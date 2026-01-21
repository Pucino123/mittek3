import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

// Product ID to plan tier mapping (same as in stripe-webhook)
const PRODUCT_TIER_MAP: Record<string, string> = {
  "prod_Tl6ynRCM8KbUL6": "basic",
  "prod_Tl6zZq8UNBdnPN": "plus",
  "prod_Tl6zLUM9nEq1TX": "pro",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-SESSION-EMAIL] ${step}${detailsStr}`);
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                    req.headers.get("x-real-ip") || 
                    "unknown";

  try {
    logStep("Function started", { ip: ipAddress });

    // Rate limiting check
    const rateCheck = await checkRateLimit(supabaseAdmin, ipAddress, "get-session-email");
    if (!rateCheck.allowed) {
      logStep("Rate limit exceeded", { ip: ipAddress });
      return new Response(JSON.stringify({ error: "For mange forsøg. Vent venligst et minut." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      logStep("ERROR: No sessionId provided");
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate sessionId format (Stripe session IDs start with cs_)
    if (typeof sessionId !== 'string' || !sessionId.startsWith('cs_') || sessionId.length > 200) {
      logStep("ERROR: Invalid sessionId format");
      return new Response(JSON.stringify({ error: "Invalid session ID format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Looking up session", { sessionId: sessionId.substring(0, 20) + "..." });

    // First, check if pending subscription exists in database
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("pending_subscriptions")
      .select("purchaser_email, plan_tier, claimed")
      .eq("checkout_session_id", sessionId)
      .maybeSingle();

    if (pendingError) {
      logStep("ERROR finding pending subscription", pendingError);
    }

    if (pending) {
      logStep("Found pending subscription in DB", { 
        planTier: pending.plan_tier,
        claimed: pending.claimed 
      });

      return new Response(JSON.stringify({ 
        found: true, 
        email: pending.purchaser_email,
        planTier: pending.plan_tier,
        alreadyClaimed: pending.claimed,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If not in database yet (webhook hasn't arrived), fetch directly from Stripe
    logStep("No pending subscription in DB, fetching from Stripe API");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (!session) {
        logStep("Stripe session not found");
        return new Response(JSON.stringify({ found: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const customerEmail = session.customer_email || session.customer_details?.email;
      
      if (!customerEmail) {
        logStep("No email found in Stripe session");
        return new Response(JSON.stringify({ found: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Try to get plan tier from subscription
      let planTier = "basic";
      if (session.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const productId = subscription.items.data[0]?.price?.product as string;
          planTier = PRODUCT_TIER_MAP[productId] || "basic";
        } catch (subErr) {
          logStep("Could not fetch subscription details", { error: subErr instanceof Error ? subErr.message : String(subErr) });
        }
      }

      logStep("Found session in Stripe API", { 
        email: customerEmail,
        planTier,
        status: session.status
      });

      return new Response(JSON.stringify({ 
        found: true, 
        email: customerEmail,
        planTier: planTier,
        alreadyClaimed: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (stripeErr) {
      logStep("Stripe API error", { error: stripeErr instanceof Error ? stripeErr.message : String(stripeErr) });
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});