import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify this is a scheduled job or admin request
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // Allow if valid cron secret is provided or if it's a service role call
    const isCronJob = req.headers.get("x-cron-secret") === cronSecret;
    const isServiceRole = authHeader?.includes(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "");
    
    if (!isCronJob && !isServiceRole) {
      // Check if user is admin
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader || "" } },
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();
        
      if (!profile?.is_admin) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use service role to run cleanup
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get count before cleanup
    const { count: beforeCount } = await adminClient
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .lt("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    // Run the cleanup function
    const { error } = await adminClient.rpc("cleanup_old_audit_logs");

    if (error) {
      console.error("Cleanup error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to cleanup audit logs", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the cleanup action
    await adminClient.from("audit_logs").insert({
      action: "audit_logs_cleanup",
      resource_type: "system",
      metadata: { 
        deleted_count: beforeCount || 0,
        retention_days: 90,
        triggered_by: isCronJob ? "scheduled_job" : "manual"
      },
      severity: "info",
    });

    console.log(`Cleanup completed. Deleted ${beforeCount || 0} old audit logs.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: beforeCount || 0,
        message: `Cleaned up ${beforeCount || 0} audit logs older than 90 days`
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in cleanup-audit-logs:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
