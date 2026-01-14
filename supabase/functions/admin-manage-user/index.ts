import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageUserRequest {
  action:
    | "reset_password"
    | "update_plan"
    | "toggle_status"
    | "delete_user"
    | "delete_user_by_email"
    | "remove_plan"
    | "reset_legacy_code";
  userId?: string;
  email?: string;
  planTier?: "basic" | "plus" | "pro";
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function findUserIdByEmail(adminClient: any, email: string): Promise<string | null> {
  const emailLc = email.trim().toLowerCase();
  const perPage = 1000;

  // Safety cap: 20k users max scan
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users: any[] = data?.users ?? [];
    const found = users.find((u) => (u.email ?? "").toLowerCase() === emailLc);
    if (found?.id) return found.id;

    if (users.length < perPage) break;
  }

  return null;
}

async function deleteStorageFolder(adminClient: any, bucket: string, folder: string) {
  const storage = adminClient.storage.from(bucket);
  const limit = 100;
  let offset = 0;

  while (true) {
    const { data, error } = await storage.list(folder, { limit, offset });
    if (error) throw error;

    const items: any[] = data ?? [];

    // Files usually have an id; folders typically don't.
    const filePaths = items
      .filter((item) => item?.name && item?.id)
      .map((item) => `${folder}/${item.name}`);

    if (filePaths.length > 0) {
      const { error: removeError } = await storage.remove(filePaths);
      if (removeError) throw removeError;
    }

    if (items.length < limit) break;
    offset += limit;
  }
}

async function deleteUserStorage(adminClient: any, userId: string) {
  // User-owned uploads live in "<userId>/*".
  await deleteStorageFolder(adminClient, "avatars", userId);
  await deleteStorageFolder(adminClient, "ticket-attachments", userId);
}

async function deleteByEq(adminClient: any, table: string, column: string, value: string) {
  const { error } = await adminClient.from(table).delete().eq(column, value);
  if (error) throw error;
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
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify JWT using getClaims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error("Auth error:", claimsError);
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerUserId = claimsData.claims.sub as string;

    // Check if caller is admin
    const { data: profile } = await userClient
      .from("profiles")
      .select("is_admin")
      .eq("user_id", callerUserId)
      .single();

    if (!profile?.is_admin) {
      return jsonResponse({ error: "Admin access required" }, 403);
    }

    const { action, userId: requestUserId, email, planTier }: ManageUserRequest = await req.json();

    if (!action) {
      return jsonResponse({ error: "Action is required" }, 400);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let userId = requestUserId?.trim();

    if (action === "delete_user_by_email") {
      if (!email) {
        return jsonResponse({ error: "Email is required" }, 400);
      }

      const foundId = await findUserIdByEmail(adminClient, email);
      if (!foundId) {
        return jsonResponse({ error: "User not found" }, 404);
      }

      userId = foundId;
    }

    if (!userId) {
      return jsonResponse({ error: "userId is required" }, 400);
    }

    // Get target user info
    const { data: targetUser, error: targetUserError } = await adminClient.auth.admin.getUserById(userId);
    if (targetUserError || !targetUser.user) {
      return jsonResponse({ error: "User not found" }, 404);
    }

    const targetEmail = targetUser.user.email ?? null;

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
          return jsonResponse({ error: "Plan tier is required" }, 400);
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
          const { error } = await adminClient
            .from("subscriptions")
            .update({
              plan_tier: planTier,
              status: "active",
              current_period_start: now.toISOString(),
              current_period_end: periodEnd.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", existingSub.id);
          if (error) throw error;
        } else {
          // Create new subscription
          const { error } = await adminClient.from("subscriptions").insert({
            user_id: userId,
            plan_tier: planTier,
            status: "active",
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            stripe_customer_id: "admin_granted",
            stripe_subscription_id: "admin_granted_" + userId,
          });
          if (error) throw error;
        }

        result = { success: true, message: `Plan updated to ${planTier}` };
        break;
      }

      case "toggle_status": {
        const isBanned = targetUser.user.banned_until !== null;

        if (isBanned) {
          // Unban user
          const { error } = await adminClient.auth.admin.updateUserById(userId, {
            ban_duration: "none",
          });
          if (error) throw error;
          result = { success: true, message: "User activated", status: "active" };
        } else {
          // Ban user indefinitely
          const { error } = await adminClient.auth.admin.updateUserById(userId, {
            ban_duration: "876000h", // ~100 years
          });
          if (error) throw error;
          result = { success: true, message: "User deactivated", status: "banned" };
        }
        break;
      }

      case "delete_user_by_email":
      case "delete_user": {
        // 1) Collect IDs for child-table deletes
        const { data: conversations, error: convError } = await adminClient
          .from("chat_conversations")
          .select("id")
          .eq("user_id", userId);
        if (convError) throw convError;

        const { data: tickets, error: ticketsError } = await adminClient
          .from("support_tickets")
          .select("id")
          .eq("user_id", userId);
        if (ticketsError) throw ticketsError;

        // 2) Delete dependent rows first
        if (conversations?.length) {
          const conversationIds = conversations.map((c: any) => c.id);
          const { error } = await adminClient.from("chat_messages").delete().in("conversation_id", conversationIds);
          if (error) throw error;
        }

        if (tickets?.length) {
          const ticketIds = tickets.map((t: any) => t.id);
          const { error } = await adminClient.from("support_messages").delete().in("ticket_id", ticketIds);
          if (error) throw error;
        }

        // 3) Delete user data in public tables (but KEEP profiles/user_roles until auth delete succeeds)
        await deleteByEq(adminClient, "chat_conversations", "user_id", userId);
        await deleteByEq(adminClient, "checkins", "user_id", userId);
        await deleteByEq(adminClient, "check_history", "user_id", userId);
        await deleteByEq(adminClient, "panic_cases", "user_id", userId);

        await deleteByEq(adminClient, "support_tickets", "user_id", userId);
        await deleteByEq(adminClient, "support_credits", "user_id", userId);

        // Trusted helpers (both directions)
        await deleteByEq(adminClient, "trusted_helpers", "user_id", userId);
        await deleteByEq(adminClient, "trusted_helpers", "helper_user_id", userId);

        await deleteByEq(adminClient, "user_achievements", "user_id", userId);
        await deleteByEq(adminClient, "user_dashboard_settings", "user_id", userId);
        await deleteByEq(adminClient, "user_notes", "user_id", userId);
        await deleteByEq(adminClient, "user_wishlist", "user_id", userId);

        await deleteByEq(adminClient, "vault_items", "user_id", userId);
        await deleteByEq(adminClient, "vault_folders", "user_id", userId);
        await deleteByEq(adminClient, "vault_settings", "user_id", userId);
        await deleteByEq(adminClient, "vault_password_resets", "user_id", userId);

        // Subscriptions + pending claims
        await deleteByEq(adminClient, "pending_subscriptions", "claimed_by", userId);
        if (targetEmail) {
          const { error } = await adminClient
            .from("pending_subscriptions")
            .delete()
            .ilike("purchaser_email", targetEmail);
          if (error) throw error;
        }
        await deleteByEq(adminClient, "subscriptions", "user_id", userId);

        // 4) Delete user-owned storage objects (these can block auth-user deletion)
        await deleteUserStorage(adminClient, userId);

        // 5) Delete the auth user
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
        if (deleteError) throw deleteError;

        // 6) Clean up remaining public rows last (so admin can retry if auth delete fails)
        await deleteByEq(adminClient, "user_roles", "user_id", userId);
        await deleteByEq(adminClient, "profiles", "user_id", userId);

        result = { success: true, message: "User deleted permanently" };
        break;
      }

      case "remove_plan": {
        // Remove all subscriptions for the user (set status to canceled)
        const { error } = await adminClient
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (error) throw error;

        result = { success: true, message: "Plan removed - user now has no active subscription" };
        break;
      }

      case "reset_legacy_code": {
        // Clear the legacy access code hash and vault backup so user can set a new one
        const { error: profileError } = await adminClient
          .from("profiles")
          .update({
            legacy_access_code_hash: null,
            legacy_access_code_sent_at: null,
          })
          .eq("user_id", userId);

        if (profileError) throw profileError;

        // Also delete the encrypted vault backup
        await adminClient
          .from("legacy_vault_backups")
          .delete()
          .eq("user_id", userId);

        result = { success: true, message: "Legacy code reset - user can now set a new code" };
        break;
      }

      default:
        return jsonResponse({ error: "Invalid action" }, 400);
    }

    // Log the action
    await adminClient.from("audit_logs").insert({
      user_id: callerUserId,
      action: `admin_${action}`,
      resource_type: "user",
      resource_id: userId,
      metadata: {
        target_email: targetEmail,
        action_details: result,
        plan_tier: planTier,
      },
      severity: "info",
    });

    return jsonResponse(result, 200);
  } catch (error) {
    console.error("Error in admin-manage-user:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Internal server error" },
      500,
    );
  }
});
