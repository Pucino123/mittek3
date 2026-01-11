import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ANALYZE-SCREENSHOT] ${step}${detailsStr}`);
};

const SYSTEM_PROMPT = `Du er en venlig og tålmodig IT-hjælper for seniorer i Danmark. Du modtager et screenshot fra en brugers telefon, tablet eller computer.

Din opgave:
1. Forklar hvad billedet viser i simple vendinger (uden teknisk jargon)
2. Vurder om det er noget brugeren bør bekymre sig om
3. Giv et klart "Næste skridt" - hvad skal brugeren gøre

Format dit svar sådan:
**Hvad jeg ser:**
[Kort, klar beskrivelse]

**Er det sikkert?**
[Ja/Nej/Måske - med kort forklaring]

**Næste skridt:**
[Enkle trin brugeren kan følge]

Husk: Brugeren er måske nervøs eller usikker. Vær beroligende og venlig. Brug emojis sparsomt for at gøre det venligt 😊`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client for auth validation
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // 1. Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      logStep("ERROR: No authorization header");
      return new Response(JSON.stringify({ error: "Ikke autoriseret. Log venligst ind." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      logStep("ERROR: Invalid session", { error: userError?.message });
      return new Response(JSON.stringify({ error: "Ugyldig session. Log venligst ind igen." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // 2. Check for active subscription (Plus or Pro required for Screenshot AI)
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, status, plan_tier")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      logStep("ERROR: Subscription check failed", { error: subError.message });
      return new Response(JSON.stringify({ error: "Kunne ikke verificere abonnement." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!subscription || !['plus', 'pro'].includes(subscription.plan_tier)) {
      logStep("ERROR: Plus/Pro subscription required", { userId: user.id, planTier: subscription?.plan_tier });
      return new Response(JSON.stringify({ error: "Plus eller Pro abonnement påkrævet for Screenshot AI." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Subscription verified", { planTier: subscription.plan_tier });

    // 3. Parse request body
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    logStep("Processing image", { userId: user.id });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Hvad viser dette billede, og hvad skal jeg gøre?",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørgsler. Vent venligst et øjeblik." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      logStep("Gateway error", { status: response.status, error: errorText });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content || "Kunne ikke analysere billedet.";

    logStep("Analysis complete", { userId: user.id });

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : "Unknown error" });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
