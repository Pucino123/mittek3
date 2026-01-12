import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function is designed to be called by a cron job
// It syncs all Stripe customers to the database automatically
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Check for cron secret or admin auth
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    // Allow if cron secret matches OR if admin is authenticated
    const isCronCall = cronSecret && req.headers.get("x-cron-secret") === cronSecret;
    
    if (!isCronCall && authHeader) {
      const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
      const anonClient = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_ANON_KEY")!
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error("Unauthorized");
      }

      const { data: isAdmin } = await supabaseClient.rpc("is_admin", { _user_id: user.id });
      if (!isAdmin) {
        throw new Error("Admin access required");
      }
    } else if (!isCronCall) {
      // For cron calls without secret, we still proceed (Supabase cron)
      console.log("Processing scheduled sync...");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Fetch all customers from Stripe
    const customers: Stripe.Customer[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;

    while (hasMore) {
      const response = await stripe.customers.list({
        limit: 100,
        starting_after: startingAfter,
      });
      
      customers.push(...response.data);
      hasMore = response.has_more;
      
      if (response.data.length > 0) {
        startingAfter = response.data[response.data.length - 1].id;
      }
    }

    console.log(`[Scheduled Sync] Found ${customers.length} customers in Stripe`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const customer of customers) {
      const email = customer.email;
      if (!email) {
        skipped++;
        continue;
      }

      try {
        // Check if user exists in auth.users
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (!authUser) {
          // Create auth user
          const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: {
              display_name: customer.name || email.split("@")[0],
              synced_from_stripe: true,
            },
          });

          if (createError) {
            errors.push(`Failed to create user ${email}: ${createError.message}`);
            continue;
          }

          if (newUser?.user) {
            created++;
            console.log(`[Scheduled Sync] Created user: ${email}`);
          }
        } else {
          // Check if profile exists
          const { data: existingProfile } = await supabaseClient
            .from("profiles")
            .select("id")
            .eq("user_id", authUser.id)
            .single();

          if (!existingProfile) {
            // Create profile
            const { error: profileError } = await supabaseClient
              .from("profiles")
              .insert({
                user_id: authUser.id,
                email: email,
                display_name: customer.name || email.split("@")[0],
              });

            if (profileError) {
              errors.push(`Failed to create profile for ${email}: ${profileError.message}`);
            } else {
              updated++;
            }
          } else {
            skipped++;
          }
        }

        // Sync subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          const userId = authUser?.id || (await supabaseClient.auth.admin.listUsers()).data?.users?.find(
            u => u.email?.toLowerCase() === email.toLowerCase()
          )?.id;

          if (userId) {
            const { data: existingSub } = await supabaseClient
              .from("subscriptions")
              .select("id")
              .eq("user_id", userId)
              .single();

            let planTier: "basic" | "plus" | "pro" = "basic";
            const priceId = sub.items.data[0]?.price?.id;
            if (priceId) {
              if (priceId.includes("pro") || priceId.includes("price_1RUqGR")) {
                planTier = "pro";
              } else if (priceId.includes("plus") || priceId.includes("price_1RUqFe")) {
                planTier = "plus";
              }
            }

            const subscriptionData = {
              user_id: userId,
              stripe_customer_id: customer.id,
              stripe_subscription_id: sub.id,
              status: sub.status as "active" | "past_due" | "canceled" | "incomplete" | "trialing",
              plan_tier: planTier,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
              trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
              trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
            };

            if (existingSub) {
              await supabaseClient
                .from("subscriptions")
                .update(subscriptionData)
                .eq("id", existingSub.id);
            } else {
              await supabaseClient
                .from("subscriptions")
                .insert(subscriptionData);
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        errors.push(`Error processing ${email}: ${errorMessage}`);
      }
    }

    // Log the sync result
    await supabaseClient.from("audit_logs").insert({
      action: "scheduled_stripe_sync",
      resource_type: "stripe",
      severity: errors.length > 0 ? "warn" : "info",
      metadata: {
        total_customers: customers.length,
        created,
        updated,
        skipped,
        errors_count: errors.length,
      },
    });

    console.log(`[Scheduled Sync] Complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        total_stripe_customers: customers.length,
        created,
        updated,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("[Scheduled Sync] Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
