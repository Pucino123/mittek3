import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product ID to plan tier mapping
const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_Tl6ynRCM8KbUL6": "basic",
  "prod_Tl6zZq8UNBdnPN": "plus",
  "prod_Tl6zLUM9nEq1TX": "pro",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-04-30.basil",
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-USER-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe subscription status to database enum
const mapStripeStatus = (stripeStatus: string): "active" | "trialing" | "past_due" | "canceled" | "incomplete" => {
  switch (stripeStatus) {
    case "active": return "active";
    case "trialing": return "trialing";
    case "past_due": return "past_due";
    case "canceled": return "canceled";
    default: return "incomplete";
  }
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

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    // Check if caller is admin
    const { data: adminCheck } = await supabaseAdmin.rpc('is_admin', { _user_id: userData.user.id });
    if (!adminCheck) {
      throw new Error("Unauthorized - Admin access required");
    }

    const { email, userId } = await req.json();
    
    if (!email && !userId) {
      throw new Error("Email or userId is required");
    }

    logStep("Syncing subscription", { email, userId });

    // Find Stripe customer by email
    let customerEmail = email;
    
    // If userId provided, get email from profile
    if (userId && !email) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("user_id", userId)
        .single();
      
      if (profile?.email) {
        customerEmail = profile.email;
      } else {
        // Try to get from auth
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authUser?.user?.email) {
          customerEmail = authUser.user.email;
        }
      }
    }

    if (!customerEmail) {
      throw new Error("Could not determine user email");
    }

    logStep("Looking up Stripe customer", { email: customerEmail });

    // Search for customer in Stripe
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found for email", { email: customerEmail });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Ingen Stripe-kunde fundet med denne email" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const stripeCustomer = customers.data[0];
    logStep("Found Stripe customer", { customerId: stripeCustomer.id });

    // Get active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomer.id,
      status: "all",
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      logStep("No subscriptions found for customer", { customerId: stripeCustomer.id });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Ingen abonnementer fundet for denne kunde i Stripe" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Find user in our database
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", customerEmail)
        .single();
      
      if (profile) {
        targetUserId = profile.user_id;
      }
    }

    if (!targetUserId) {
      throw new Error("Bruger ikke fundet i systemet med denne email");
    }

    // Get the most relevant subscription (active > trialing > others)
    const priority: Record<string, number> = { active: 4, trialing: 3, past_due: 2, canceled: 1, incomplete: 0 };
    const prioritizedSubs = [...subscriptions.data].sort((a: Stripe.Subscription, b: Stripe.Subscription) => {
      return (priority[b.status] ?? -1) - (priority[a.status] ?? -1);
    });

    const stripeSub = prioritizedSubs[0];
    const productId = stripeSub.items.data[0]?.price?.product as string;
    const planTier = PRODUCT_TIER_MAP[productId] || "basic";

    logStep("Processing subscription", { 
      subscriptionId: stripeSub.id, 
      status: stripeSub.status,
      productId,
      planTier 
    });

    // Check if user already has a subscription record
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const subscriptionData = {
      user_id: targetUserId,
      plan_tier: planTier,
      status: mapStripeStatus(stripeSub.status),
      stripe_customer_id: stripeCustomer.id,
      stripe_subscription_id: stripeSub.id,
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: stripeSub.cancel_at_period_end,
      trial_start: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000).toISOString() : null,
      trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
    };

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id);

      if (updateError) throw updateError;
      logStep("Updated existing subscription", { subscriptionId: existingSub.id });
    } else {
      // Create new subscription record
      const { error: insertError } = await supabaseAdmin
        .from("subscriptions")
        .insert(subscriptionData);

      if (insertError) throw insertError;
      logStep("Created new subscription record");
    }

    // Audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: userData.user.id,
      action: "admin_sync_user_subscription",
      resource_type: "subscription",
      resource_id: stripeSub.id,
      metadata: { 
        targetEmail: customerEmail,
        targetUserId,
        planTier,
        status: stripeSub.status,
        stripeCustomerId: stripeCustomer.id
      },
      severity: "info",
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Abonnement synkroniseret: ${planTier.toUpperCase()} (${stripeSub.status})`,
        subscription: {
          planTier,
          status: stripeSub.status,
          stripeCustomerId: stripeCustomer.id,
          stripeSubscriptionId: stripeSub.id,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
