import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[FIND-PENDING] ${step}${detailsStr}`);
};

// Simple in-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5; // Max 5 requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Per minute

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  entry.count++;
  return false;
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

  try {
    logStep("Function started");

    // Get client IP for rate limiting (use forwarded header or fallback)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check rate limit based on IP
    if (isRateLimited(clientIP)) {
      logStep("Rate limited", { ip: clientIP });
      return new Response(JSON.stringify({ error: "For mange forsøg. Vent venligst et minut." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    const { email } = await req.json();
    if (!email) {
      logStep("ERROR: No email provided");
      return new Response(JSON.stringify({ error: "Email is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logStep("ERROR: Invalid email format");
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Also rate limit per email to prevent enumeration
    if (isRateLimited(`email:${email.toLowerCase()}`)) {
      logStep("Rate limited by email", { email: email.toLowerCase() });
      return new Response(JSON.stringify({ error: "For mange forsøg for denne email. Vent venligst." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 429,
      });
    }

    logStep("Searching for pending subscription", { email: email.toLowerCase() });

    // Find unclaimed pending subscription for this email
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("pending_subscriptions")
      .select("checkout_session_id, plan_tier")
      .eq("purchaser_email", email.toLowerCase())
      .eq("claimed", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingError) {
      logStep("ERROR", pendingError);
      throw pendingError;
    }

    // Return consistent response to prevent email enumeration
    // Don't reveal whether email exists or not - just return found: false
    if (!pending) {
      logStep("No pending subscription found");
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found pending subscription", { planTier: pending.plan_tier });

    // Only return minimal information needed for the claim flow
    return new Response(JSON.stringify({ 
      found: true, 
      sessionId: pending.checkout_session_id,
      planTier: pending.plan_tier,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
