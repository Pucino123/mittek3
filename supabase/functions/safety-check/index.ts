import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SAFETY-CHECK] ${step}${detailsStr}`);
};

const SYSTEM_PROMPT = `Du er en sikkerhedsekspert der hjælper danske seniorer med at identificere svindel og phishing.

Du modtager enten tekst fra en SMS/email ELLER et screenshot af en besked.

Din opgave:
1. Analyser indholdet for tegn på svindel
2. Giv en risikovurdering: LAV, MELLEM, eller HØJ
3. Forklar HVORFOR du vurderer det sådan i simple ord
4. Giv et klart råd om hvad brugeren skal gøre

TYPISKE SVINDELTEGN:
- Ukendt afsender der beder om personlige oplysninger
- Links til mistænkelige sider
- Tidspres ("gør det nu!", "sidste chance!")
- Påstande om gevinster eller problemer med bank/SKAT
- Stavefejl eller dårligt dansk
- Trusler om konsekvenser

Format dit svar som JSON:
{
  "risk": "LAV" | "MELLEM" | "HØJ",
  "riskExplanation": "Kort forklaring på dansk",
  "details": ["Liste", "med", "observationer"],
  "recommendation": "Hvad brugeren skal gøre"
}

Vær venlig men klar i din kommunikation. Hvis du er i tvivl, vurdér højere risiko.`;

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

    // 2. Check for active subscription with plus or pro tier
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

    if (!subscription) {
      logStep("ERROR: No active subscription", { userId: user.id });
      return new Response(JSON.stringify({ error: "Aktivt abonnement påkrævet." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Safety-check requires plus or pro tier
    const allowedTiers = ["plus", "pro"];
    if (!allowedTiers.includes(subscription.plan_tier)) {
      logStep("ERROR: Insufficient subscription tier", { tier: subscription.plan_tier, userId: user.id });
      return new Response(JSON.stringify({ error: "Sikkerhedsskjold kræver Plus eller Pro abonnement." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Subscription verified", { planTier: subscription.plan_tier });

    // 3. Parse request body
    const { text, imageBase64 } = await req.json();
    
    if (!text && !imageBase64) {
      throw new Error("No content provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    logStep("Processing", { type: imageBase64 ? "image" : "text", userId: user.id });

    let userContent: unknown;
    if (imageBase64) {
      userContent = [
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
          },
        },
        {
          type: "text",
          text: "Analysér dette billede af en besked for svindel-tegn.",
        },
      ];
    } else {
      userContent = `Analysér denne besked for svindel-tegn:\n\n${text}`;
    }

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
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        logStep("Rate limited by AI gateway");
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
    const content = data.choices?.[0]?.message?.content;

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      result = {
        risk: "MELLEM",
        riskExplanation: "Kunne ikke analysere korrekt. Vær forsigtig.",
        details: [content || "Ukendt fejl"],
        recommendation: "Kontakt en du stoler på for hjælp.",
      };
    }

    logStep("Analysis complete", { risk: result.risk, userId: user.id });

    return new Response(JSON.stringify(result), {
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
