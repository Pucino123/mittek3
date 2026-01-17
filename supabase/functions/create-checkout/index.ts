import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price IDs for each tier (LIVE MODE)
const PRICE_IDS: Record<string, string> = {
  basic: "price_1SnaktFGReA91a36bgrnCm3K",
  plus: "price_1Snal6FGReA91a36Aa1pYpBZ",
  pro: "price_1SnalFFGReA91a36Cx0v5cHW",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Rate limiting helper
async function checkRateLimit(supabase: any, identifier: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  // Get current request count
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
    
    // Increment counter
    await supabase
      .from("rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint);
    
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.request_count - 1 };
  }

  // Create new rate limit entry
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

    // Rate limiting check
    const rateCheck = await checkRateLimit(supabaseAdmin, ipAddress, "create-checkout");
    if (!rateCheck.allowed) {
      logStep("Rate limit exceeded", { ip: ipAddress });
      await logAudit(supabaseAdmin, "rate_limit_exceeded", "checkout", null, { ip: ipAddress }, "warning", ipAddress, userAgent);
      return new Response(JSON.stringify({ error: "For mange forsøg. Vent venligst et minut." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Parse and validate request body
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { planTier, email } = rawBody;

    // Validate planTier
    const VALID_PLAN_TIERS = ['basic', 'plus', 'pro'];
    if (typeof planTier !== 'string' || !VALID_PLAN_TIERS.includes(planTier.trim().toLowerCase())) {
      return new Response(JSON.stringify({ error: `Invalid plan tier. Must be one of: ${VALID_PLAN_TIERS.join(', ')}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    const sanitizedPlanTier = planTier.trim().toLowerCase();

    // Validate email if provided
    let sanitizedEmail: string | undefined;
    if (email !== undefined && email !== null) {
      if (typeof email !== 'string') {
        return new Response(JSON.stringify({ error: "Email must be a string" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const trimmedEmail = email.trim().toLowerCase();
      if (trimmedEmail.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
          return new Response(JSON.stringify({ error: "Invalid email format" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }
        sanitizedEmail = trimmedEmail;
      }
    }

    logStep("Request received", { planTier: sanitizedPlanTier, email: sanitizedEmail || 'anonymous' });

    const priceId = PRICE_IDS[sanitizedPlanTier];
    if (!priceId) {
      throw new Error(`Invalid plan tier: ${sanitizedPlanTier}`);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Check if customer exists
    let customerId: string | undefined;
    if (sanitizedEmail) {
      const customers = await stripe.customers.list({ email: sanitizedEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : sanitizedEmail,
      locale: "da",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      payment_method_collection: "always",
      subscription_data: {
        trial_period_days: 14,
      },
      success_url: `${origin}/finish-signup?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      allow_promotion_codes: true,
      tax_id_collection: { enabled: true },
      custom_text: {
        submit: {
          message: "Alle priser er inkl. 25% dansk moms. Du modtager en kvittering på email efter køb.",
        },
      },
      metadata: {
        plan_tier: sanitizedPlanTier,
      },
    };

    // If using existing customer, allow updating name for tax ID collection
    if (customerId) {
      sessionParams.customer_update = {
        name: "auto",
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Audit log for checkout initiated
    await logAudit(
      supabaseAdmin,
      "checkout_initiated",
      "checkout",
      session.id,
      { planTier: sanitizedPlanTier, email: sanitizedEmail || "anonymous" },
      "info",
      ipAddress,
      userAgent
    );

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    await logAudit(supabaseAdmin, "checkout_error", "checkout", null, { error: errorMessage }, "error", ipAddress, userAgent);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
