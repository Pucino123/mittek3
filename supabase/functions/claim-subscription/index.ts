import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CLAIM-SUBSCRIPTION] ${step}${detailsStr}`);
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-04-30.basil",
});

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }
    
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { sessionId } = await req.json();
    logStep("Claiming session", { sessionId });

    // Find the pending subscription
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("pending_subscriptions")
      .select("*")
      .eq("checkout_session_id", sessionId)
      .eq("claimed", false)
      .maybeSingle();

    if (pendingError) {
      logStep("ERROR finding pending subscription", pendingError);
      throw new Error("Could not find pending subscription");
    }

    if (!pending) {
      logStep("No pending subscription found or already claimed");
      return new Response(JSON.stringify({ error: "No pending subscription found or already claimed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    logStep("Found pending subscription", { 
      planTier: pending.plan_tier, 
      email: pending.purchaser_email,
      stripeSubscriptionId: pending.stripe_subscription_id
    });

    // Fetch actual subscription details from Stripe to get correct status and dates
    let subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "incomplete" = "trialing";
    let currentPeriodStart = new Date().toISOString();
    let currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    let trialStart: string | null = null;
    let trialEnd: string | null = null;

    if (pending.stripe_subscription_id) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(pending.stripe_subscription_id);
        logStep("Fetched Stripe subscription", { 
          status: stripeSubscription.status,
          trialEnd: stripeSubscription.trial_end
        });

        subscriptionStatus = mapStripeStatus(stripeSubscription.status);
        currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000).toISOString();
        currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000).toISOString();
        
        if (stripeSubscription.trial_start) {
          trialStart = new Date(stripeSubscription.trial_start * 1000).toISOString();
        }
        if (stripeSubscription.trial_end) {
          trialEnd = new Date(stripeSubscription.trial_end * 1000).toISOString();
        }
      } catch (stripeError) {
        logStep("Warning: Could not fetch Stripe subscription, using defaults", stripeError);
      }
    }

    // Create the actual subscription record with correct Stripe data
    const { error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_tier: pending.plan_tier,
        status: subscriptionStatus,
        stripe_customer_id: pending.stripe_customer_id,
        stripe_subscription_id: pending.stripe_subscription_id,
        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,
        trial_start: trialStart,
        trial_end: trialEnd,
      });

    if (subscriptionError) {
      logStep("ERROR creating subscription", subscriptionError);
      throw subscriptionError;
    }

    logStep("Subscription created", { status: subscriptionStatus, trialEnd });

    // Mark pending as claimed
    const { error: updateError } = await supabaseAdmin
      .from("pending_subscriptions")
      .update({ 
        claimed: true, 
        claimed_by: user.id 
      })
      .eq("id", pending.id);

    if (updateError) {
      logStep("ERROR updating pending", updateError);
    }

    logStep("Pending subscription marked as claimed");

    return new Response(JSON.stringify({ success: true, planTier: pending.plan_tier }), {
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
