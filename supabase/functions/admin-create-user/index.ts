import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  displayName: string;
  planTier?: "basic" | "plus" | "pro";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Use getClaims for JWT validation
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Claims error:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const callerId = claimsData.claims.sub;

    // Check if caller is admin
    const { data: profile } = await userClient
      .from("profiles")
      .select("is_admin")
      .eq("user_id", callerId)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, displayName, planTier }: CreateUserRequest = rawBody;

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: "Email is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email format or email too long (max 255 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: "Password is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length > 128) {
      return new Response(
        JSON.stringify({ error: "Password must be less than 128 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate displayName
    if (!displayName || typeof displayName !== 'string') {
      return new Response(
        JSON.stringify({ error: "Display name is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const trimmedDisplayName = displayName.trim();
    if (trimmedDisplayName.length === 0 || trimmedDisplayName.length > 100) {
      return new Response(
        JSON.stringify({ error: "Display name must be between 1 and 100 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate planTier if provided
    const VALID_PLAN_TIERS = ['basic', 'plus', 'pro'];
    let sanitizedPlanTier: "basic" | "plus" | "pro" | undefined;
    if (planTier !== undefined) {
      if (typeof planTier !== 'string' || !VALID_PLAN_TIERS.includes(planTier)) {
        return new Response(
          JSON.stringify({ error: `Invalid plan tier. Must be one of: ${VALID_PLAN_TIERS.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      sanitizedPlanTier = planTier as "basic" | "plus" | "pro";
    }

    // Use admin client to create user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create user with admin API using sanitized values
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { display_name: trimmedDisplayName }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If a plan tier is specified, create a subscription
    if (sanitizedPlanTier && sanitizedPlanTier !== "basic" && newUser.user) {
      const now = new Date();
      const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const { error: subError } = await adminClient
        .from("subscriptions")
        .insert({
          user_id: newUser.user.id,
          plan_tier: sanitizedPlanTier,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          stripe_customer_id: "admin_granted",
          stripe_subscription_id: "admin_granted_" + newUser.user.id,
        });

      if (subError) {
        console.error("Error creating subscription:", subError);
        // Don't fail the whole request, user is created
      }
    }

    // Log the action
    await adminClient.from("audit_logs").insert({
      user_id: callerId,
      action: "admin_create_user",
      resource_type: "user",
      resource_id: newUser.user?.id,
      metadata: {
        created_email: trimmedEmail,
        display_name: trimmedDisplayName,
        plan_tier: sanitizedPlanTier || "basic",
      },
      severity: "info",
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
          displayName: trimmedDisplayName,
          planTier: sanitizedPlanTier || "basic"
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in admin-create-user:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
