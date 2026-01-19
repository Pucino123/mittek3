import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[REPAIR-PROFILES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header");
    }

    // Create user client for authentication
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      throw new Error("Not authenticated");
    }

    const userId = claimsData.claims.sub as string;

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: userId });
    if (!isAdmin) {
      throw new Error("Unauthorized - admin access required");
    }

    logStep("Admin verified", { adminId: userId });

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    logStep("Found auth users", { count: authUsers.users.length });

    // Get all existing profiles
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id");

    if (profilesError) {
      throw new Error(`Failed to list profiles: ${profilesError.message}`);
    }

    const existingUserIds = new Set(existingProfiles?.map(p => p.user_id) || []);
    logStep("Found existing profiles", { count: existingUserIds.size });

    // Find users without profiles
    const usersWithoutProfiles = authUsers.users.filter(u => !existingUserIds.has(u.id));
    logStep("Users without profiles", { count: usersWithoutProfiles.length });

    if (usersWithoutProfiles.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Alle brugere har profiler",
        repaired: 0,
        total_users: authUsers.users.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create missing profiles
    const profilesToCreate = usersWithoutProfiles.map(user => ({
      user_id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Bruger',
      is_admin: user.email === 'kevin.therkildsen@icloud.com',
    }));

    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert(profilesToCreate);

    if (insertError) {
      throw new Error(`Failed to create profiles: ${insertError.message}`);
    }

    // Also create user_roles for the new users
    const rolesToCreate = usersWithoutProfiles.map(user => ({
      user_id: user.id,
      role: 'user' as const,
    }));

    await supabaseAdmin.from("user_roles").insert(rolesToCreate);

    logStep("Created missing profiles", { count: profilesToCreate.length });

    // Log audit
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userId,
      action: "repair_profiles",
      resource_type: "profiles",
      resource_id: null,
      metadata: { 
        repaired_count: profilesToCreate.length,
        repaired_emails: profilesToCreate.map(p => p.email)
      },
      severity: "info",
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Oprettede ${profilesToCreate.length} manglende profiler`,
      repaired: profilesToCreate.length,
      repaired_users: profilesToCreate.map(p => ({ email: p.email, display_name: p.display_name })),
      total_users: authUsers.users.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
