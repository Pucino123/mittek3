import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageUserRequest {
  action: "reset_password" | "update_plan" | "toggle_status";
  userId: string;
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

    const { data: { user: callerUser } } = await userClient.auth.getUser();
    if (!callerUser) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if caller is admin
    const { data: profile } = await userClient
      .from("profiles")
      .select("is_admin")
      .eq("user_id", callerUser.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, userId, planTier }: ManageUserRequest = await req.json();

    if (!action || !userId) {
      return new Response(
        JSON.stringify({ error: "Action and userId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get target user info
    const { data: targetUser } = await adminClient.auth.admin.getUserById(userId);
    if (!targetUser.user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: Record<string, unknown> = {};

    switch (action) {
      case "reset_password": {
        // Generate password reset link
        const { data, error } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email: targetUser.user.email!,
        });

        if (error) throw error;

        // Send email using Resend
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const resend = new Resend(resendKey);
          
          await resend.emails.send({
            from: "iHero <noreply@ihero.dk>",
            to: [targetUser.user.email!],
            subject: "Nulstil din adgangskode",
            html: `
              <h1>Nulstil din adgangskode</h1>
              <p>Du har anmodet om at nulstille din adgangskode til iHero.</p>
              <p>Klik på linket nedenfor for at vælge en ny adgangskode:</p>
              <p><a href="${data.properties.action_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Nulstil adgangskode</a></p>
              <p>Linket udløber om 24 timer.</p>
              <p>Hvis du ikke har anmodet om dette, kan du ignorere denne email.</p>
              <br>
              <p>Venlig hilsen,<br>iHero Team</p>
            `,
          });
        }

        result = { success: true, message: "Password reset email sent" };
        break;
      }

      case "update_plan": {
        if (!planTier) {
          return new Response(
            JSON.stringify({ error: "Plan tier is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Check for existing subscription
        const { data: existingSub } = await adminClient
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        if (existingSub) {
          // Update existing subscription
          await adminClient
            .from("subscriptions")
            .update({
              plan_tier: planTier,
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", existingSub.id);
        } else {
          // Create new subscription
          await adminClient.from("subscriptions").insert({
            user_id: userId,
            plan_tier: planTier,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            stripe_customer_id: "admin_granted",
            stripe_subscription_id: "admin_granted_" + userId,
          });
        }

        result = { success: true, message: `Plan updated to ${planTier}` };
        break;
      }

      case "toggle_status": {
        const isBanned = targetUser.user.banned_until !== null;
        
        if (isBanned) {
          // Unban user
          await adminClient.auth.admin.updateUserById(userId, {
            ban_duration: "none"
          });
          result = { success: true, message: "User activated", status: "active" };
        } else {
          // Ban user indefinitely
          await adminClient.auth.admin.updateUserById(userId, {
            ban_duration: "876000h" // ~100 years
          });
          result = { success: true, message: "User deactivated", status: "banned" };
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    // Log the action
    await adminClient.from("audit_logs").insert({
      user_id: callerUser.id,
      action: `admin_${action}`,
      resource_type: "user",
      resource_id: userId,
      metadata: {
        target_email: targetUser.user.email,
        action_details: result,
        plan_tier: planTier,
      },
      severity: "info",
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in admin-manage-user:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
