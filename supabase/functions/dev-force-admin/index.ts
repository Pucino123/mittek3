import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Security: Disable this function in production
  const environment = Deno.env.get("ENVIRONMENT") || "development";
  if (environment === "production") {
    return new Response(
      JSON.stringify({ error: "Function disabled in production" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is the owner
    if (user.email !== "kevin.therkildsen@icloud.com") {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only owner can use this function" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Force admin/pro for user:", user.id);

    // Use service role client for admin updates
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update profile to admin
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ is_admin: true })
      .eq("user_id", user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      throw profileError;
    }

    console.log("Profile updated to admin");

    // Check if subscription exists
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingSub) {
      // Update existing subscription
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .update({ 
          plan_tier: "pro", 
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq("user_id", user.id);

      if (subError) {
        console.error("Subscription update error:", subError);
        throw subError;
      }
    } else {
      // Create new subscription
      const { error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert({ 
          user_id: user.id,
          plan_tier: "pro", 
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (subError) {
        console.error("Subscription insert error:", subError);
        throw subError;
      }
    }

    console.log("Subscription set to pro/active");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account upgraded to Admin + Pro" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
