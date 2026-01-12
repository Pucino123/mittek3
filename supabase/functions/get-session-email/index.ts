import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-SESSION-EMAIL] ${step}${detailsStr}`);
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

    const { sessionId } = await req.json();
    if (!sessionId) {
      logStep("ERROR: No sessionId provided");
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Looking up session", { sessionId });

    // Find the pending subscription for this session
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("pending_subscriptions")
      .select("purchaser_email, plan_tier, claimed")
      .eq("checkout_session_id", sessionId)
      .maybeSingle();

    if (pendingError) {
      logStep("ERROR finding pending subscription", pendingError);
      throw pendingError;
    }

    if (!pending) {
      logStep("No pending subscription found for session");
      return new Response(JSON.stringify({ found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found pending subscription", { 
      email: pending.purchaser_email, 
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
