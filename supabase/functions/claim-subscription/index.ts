import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per minute per user

// Product ID to plan tier mapping (same as stripe-webhook)
const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_Tl6ynRCM8KbUL6": "basic",
  "prod_Tl6zZq8UNBdnPN": "plus",
  "prod_Tl6zLUM9nEq1TX": "pro",
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

// Rate limiting helper
async function checkRateLimit(supabase: any, identifier: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("request_count, window_start")
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart)
    .maybeSingle();

  if (existing) {
    if (existing.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }
    
    await supabase
      .from("rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint);
    
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.request_count - 1 };
  }

  await supabase.from("rate_limits").insert({
    identifier,
    endpoint,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
}

// Audit logging helper
async function logAudit(
  supabase: any,
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  metadata: Record<string, unknown>,
  severity: "info" | "warning" | "error" | "critical" = "info",
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      severity,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (err) {
    logStep("Failed to create audit log", { error: err instanceof Error ? err.message : String(err) });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

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

    // Rate limiting check based on user ID
    const rateCheck = await checkRateLimit(supabaseAdmin, user.id, "claim-subscription");
    if (!rateCheck.allowed) {
      logStep("Rate limit exceeded", { userId: user.id });
      await logAudit(supabaseAdmin, user.id, "rate_limit_exceeded", "claim", null, { userId: user.id }, "warning", ipAddress, userAgent);
      return new Response(JSON.stringify({ error: "For mange forsøg. Vent venligst et minut." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const { sessionId } = await req.json();
    logStep("Claiming session", { sessionId });

    // First, check if user already has an active subscription
    const { data: existingSub } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (existingSub) {
      logStep("User already has active subscription", { existingSub });
      return new Response(JSON.stringify({ success: true, planTier: existingSub.plan_tier, alreadyExists: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Try to find pending subscription first (from webhook)
    let pending = null;
    const { data: pendingData, error: pendingError } = await supabaseAdmin
      .from("pending_subscriptions")
      .select("*")
      .eq("checkout_session_id", sessionId)
      .eq("claimed", false)
      .maybeSingle();

    if (!pendingError && pendingData) {
      pending = pendingData;
      logStep("Found pending subscription from webhook", { planTier: pending.plan_tier });
    } else {
      // No pending subscription - fetch directly from Stripe (webhook might not have arrived yet)
      logStep("No pending subscription found, fetching from Stripe directly");
      
      try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription']
        });
        
        logStep("Retrieved Stripe checkout session", { 
          sessionId: checkoutSession.id,
          status: checkoutSession.status,
          paymentStatus: checkoutSession.payment_status,
          email: checkoutSession.customer_email
        });

        // Verify the checkout was completed
        if (checkoutSession.status !== 'complete' || checkoutSession.payment_status !== 'paid') {
          logStep("Checkout not completed", { status: checkoutSession.status, paymentStatus: checkoutSession.payment_status });
          return new Response(JSON.stringify({ error: "Checkout not completed yet" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        const subscription = checkoutSession.subscription as Stripe.Subscription;
        if (!subscription) {
          throw new Error("No subscription found in checkout session");
        }

        // Get plan tier from product
        const productId = subscription.items.data[0]?.price?.product as string;
        const planTier = PRODUCT_TIER_MAP[productId] || "basic";

        logStep("Subscription details from Stripe", {
          subscriptionId: subscription.id,
          productId,
          planTier,
          status: subscription.status
        });

        // Create pending subscription record for tracking (in case it wasn't created by webhook)
        const { error: insertError } = await supabaseAdmin
          .from("pending_subscriptions")
          .insert({
            checkout_session_id: sessionId,
            stripe_customer_id: checkoutSession.customer as string,
            stripe_subscription_id: subscription.id,
            purchaser_email: checkoutSession.customer_email || user.email || "",
            plan_tier: planTier,
            claimed: false,
          });

        if (insertError && !insertError.message?.includes('duplicate')) {
          logStep("Warning: Could not insert pending subscription", insertError);
        }

        // Build pending object from Stripe data
        pending = {
          id: null, // Will be null for direct Stripe fetch
          checkout_session_id: sessionId,
          stripe_customer_id: checkoutSession.customer as string,
          stripe_subscription_id: subscription.id,
          purchaser_email: checkoutSession.customer_email || user.email || "",
          plan_tier: planTier,
        };
        
      } catch (stripeError: any) {
        logStep("ERROR fetching from Stripe", { error: stripeError.message });
        await logAudit(supabaseAdmin, user.id, "claim_failed", "subscription", sessionId, { reason: "stripe_fetch_failed", error: stripeError.message }, "error", ipAddress, userAgent);
        return new Response(JSON.stringify({ error: "Could not verify payment. Please try again or contact support." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        });
      }
    }

    logStep("Processing subscription claim", { 
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
        logStep("Fetched Stripe subscription details", { 
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
        logStep("Warning: Could not fetch Stripe subscription details, using defaults", stripeError);
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

    // Mark pending as claimed (if we have the record)
    if (pending.id) {
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
    } else {
      // Update by session ID if we created it from Stripe directly
      await supabaseAdmin
        .from("pending_subscriptions")
        .update({ 
          claimed: true, 
          claimed_by: user.id 
        })
        .eq("checkout_session_id", sessionId);
    }

    logStep("Pending subscription marked as claimed");

    // Audit log for successful subscription claim
    await logAudit(
      supabaseAdmin,
      user.id,
      "subscription_claimed",
      "subscription",
      pending.stripe_subscription_id,
      { planTier: pending.plan_tier, status: subscriptionStatus, email: user.email, directFromStripe: !pendingData },
      "info",
      ipAddress,
      userAgent
    );

    return new Response(JSON.stringify({ success: true, planTier: pending.plan_tier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    await logAudit(supabaseAdmin, null, "claim_error", "subscription", null, { error: errorMessage }, "error", ipAddress, userAgent);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
