import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 requests per minute per user

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[AI-CHAT] ${step}${detailsStr}`);
};

// Rate limiting helper
async function checkRateLimit(supabase: any, identifier: string, endpoint: string, maxRequests: number): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("request_count, window_start")
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart)
    .maybeSingle();

  if (existing) {
    if (existing.request_count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    await supabase
      .from("rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint);
    
    return { allowed: true, remaining: maxRequests - existing.request_count - 1 };
  }

  await supabase.from("rate_limits").insert({
    identifier,
    endpoint,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: maxRequests - 1 };
}

// Guide links for smart recommendations
const GUIDE_LINKS = `
TILGÆNGELIGE INTERNE GUIDES (brug disse til at hjælpe brugeren):
- [Opdater din enhed sikkert](/guides/update-ios) - Software-opdateringer
- [Stop irriterende popups](/guides/stop-popups) - Safari popup-blocker
- [Gør teksten større](/guides/bigger-text) - Skærmtilgængelighed
- [Forlæng din batteritid](/guides/extend-battery-life) - Batteri-tips
- [Pas på dit batteri](/guides/battery-health-tips) - Batterisundhed
- [Undgå falske opkald](/guides/block-unknown-calls) - Blokér spam
- [Beskyt din Apple-konto](/guides/enable-2fa) - To-faktor-godkendelse
- [Genkend svindelbeskeder](/guides/recognize-scam-messages) - Svindel-genkendelse
- [Genstart en frosset enhed](/guides/hard-reset) - Force restart
- [Sikkerhedskopier til iCloud](/guides/icloud-backup) - iCloud backup
- [Frigør plads på din enhed](/guides/free-up-storage) - Lagerplads
- [Ryd op i dubletter](/guides/delete-duplicates) - Fjern dubletter
- [Administrer iMessage](/guides/imessage-settings) - Beskeder
- [Find min iPhone](/guides/find-my-device) - Find min enhed
- [Skjul min email](/guides/hide-my-email) - Email-privatliv

EKSTERNE RESSOURCER (brug når vi ikke har en intern guide):
- Printer-opsætning iPhone: [Apple Support - AirPrint](https://support.apple.com/da-dk/102781)
- Facebook privatlivsindstillinger: [Facebook Hjælpecenter](https://www.facebook.com/help/325807937506242)
- Netflix problemer: [Netflix Hjælpecenter](https://help.netflix.com/da)
- YouTube indstillinger: [YouTube Hjælp](https://support.google.com/youtube)
- Instagram privatliv: [Instagram Hjælpecenter](https://help.instagram.com/196883487377501)
- WhatsApp hjælp: [WhatsApp FAQ](https://faq.whatsapp.com/da)
- DR TV app: [DR Hjælp](https://www.dr.dk/hjaelp)
- TV 2 Play: [TV 2 Kundeservice](https://kundeservice.tv2.dk/)
- MobilePay support: [MobilePay Hjælp](https://www.mobilepay.dk/hjaelp)
- NemID/MitID: [MitID Support](https://www.mitid.dk/hjaelp/)
- E-Boks hjælp: [E-Boks Support](https://www.e-boks.com/danmark/da/support)
- PostNord app: [PostNord Kundeservice](https://www.postnord.dk/kundeservice)
- Sundhed.dk: [Sundhed.dk vejledning](https://www.sundhed.dk/borger/guides/)
- Borger.dk: [Borger.dk hjælp](https://www.borger.dk/Hjaelp)
`;

const SYSTEM_PROMPT = `Du er "Din Digitale Hjælper" – en tålmodig ekspert der hjælper seniorer med teknik.

═══ KOMMUNIKATIONSREGLER ═══

1. KORTE SVAR (maks 2-3 sætninger pr. afsnit)
   - Ét emne ad gangen
   - Brug luft mellem afsnit

2. PÆDAGOGISK
   - Forklar tech-ord med sammenligninger: "iCloud er som et arkivskab på internettet"
   - Antag nyeste software medmindre de siger andet

3. TRIN-FOR-TRIN
   - Brug nummererede lister:
     1. Tryk på **Indstillinger**
     2. Vælg **Generelt**
   - Max 3-4 trin pr. besked

4. VISUELLE HINTS
   - Fremhæv knapper: **Indstillinger**
   - Brug emoji til navigation: ⚙️ 📱 💻

5. BEKRÆFT FORSTÅELSE
   - Afslut komplekse svar med: "Gav det mening?" eller "Skal vi tage næste skridt?"

═══ TONE ═══
- Rolig og tryg: "Det klarer vi nemt 😊"
- Aldrig nedladende
- Simpelt dansk

${GUIDE_LINKS}

═══ LINKS ═══
1. Intern guide først → [Linktekst](/guides/...)
2. Ellers ekstern → [Linktekst](https://...)

═══ SIKKERHED (STOP STRAKS) ═══
Ved NemID, MitID, CPR, bankkoder, passwords:
"⚠️ Det må jeg ikke hjælpe med. Ring til din bank på nummeret bag på dit kort."

Du er ekspert i iPhone, iPad, Mac, printere, WiFi, streaming, Facebook, MobilePay m.m. 💪`;

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

  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";

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

    // Rate limiting check based on user ID
    const rateCheck = await checkRateLimit(supabase, user.id, "ai-chat", RATE_LIMIT_MAX_REQUESTS);
    if (!rateCheck.allowed) {
      logStep("Rate limit exceeded", { userId: user.id });
      return new Response(JSON.stringify({ error: "For mange beskeder. Vent venligst et minut." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Check for active subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, status, plan_tier")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
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
      return new Response(JSON.stringify({ error: "Aktivt abonnement påkrævet for at bruge Din Digitale Hjælper." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Subscription verified", { planTier: subscription.plan_tier });

    // 3. Fetch user's owned devices for personalized context
    const { data: profileData } = await supabase
      .from("profiles")
      .select("owned_devices, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const ownedDevices = profileData?.owned_devices || ["iphone"];
    const deviceList = ownedDevices.join(", ");
    const userName = profileData?.display_name || "bruger";

    logStep("User profile loaded", { devices: deviceList });

    // 4. Parse request body
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      logStep("ERROR: LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    logStep("Processing request", { messageCount: messages?.length || 0, userId: user.id });

    // Build personalized system prompt with user's devices
    const personalizedPrompt = `${SYSTEM_PROMPT}

═══ BRUGERENS ENHEDER ═══
${userName} ejer følgende enheder: ${deviceList}

Når du svarer:
- Hvis spørgsmålet tydeligt handler om én enhedstype, giv et direkte svar
- Hvis det er uklart hvilken enhed de mener, spørg venligt: "Er det på din iPhone eller Mac?"
- Tilpas altid instruktioner til den relevante enhed`;

    // 5. Call AI gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: personalizedPrompt },
          ...messages,
        ],
        stream: true,
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
      if (response.status === 402) {
        logStep("AI gateway payment required");
        return new Response(JSON.stringify({ error: "Tjenesten er midlertidigt utilgængelig." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      logStep("Gateway error", { status: response.status, error: errorText });
      throw new Error("AI gateway error");
    }

    logStep("AI response streaming started", { userId: user.id });

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : "Unknown error" });
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
