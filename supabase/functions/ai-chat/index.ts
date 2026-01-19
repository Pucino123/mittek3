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
═══ TILGÆNGELIGE MITTEK-GUIDES ═══

📱 APPS:
- [Hent nye apps](/guides/download-apps) - Download apps fra App Store
- [Opdater dine apps](/guides/update-apps) - Hold apps opdateret
- [Organiser dine apps](/guides/organize-apps) - Ryd op på hjemmeskærmen
- [Slet apps du ikke bruger](/guides/delete-apps) - Fjern unødvendige apps

🔋 BATTERI:
- [Forlæng din batteritid](/guides/extend-battery-life) - Spar på batteriet
- [Pas på dit batteri](/guides/battery-health-tips) - Batterisundhed og pleje

💬 BESKEDER:
- [Bloker uønskede beskeder](/guides/block-spam-messages) - Stop spam-SMS
- [Kom i gang med iMessage](/guides/imessage-setup) - Opsæt iMessage
- [Ryd op i Beskeder](/guides/cleanup-messages) - Slet gamle beskeder

📅 HVERDAG:
- [Gør teksten større](/guides/bigger-text) - Skærmtilgængelighed
- [Opdater din enhed sikkert](/guides/update-ios) - Software-opdateringer
- [Stop irriterende popups](/guides/stop-popups) - Safari popup-blocker

☁️ ICLOUD:
- [Gem dine billeder i iCloud](/guides/icloud-photos) - Billedesynkronisering
- [Ryd op i iCloud](/guides/icloud-cleanup) - Frigør iCloud-plads
- [Sikkerhedskopier til iCloud](/guides/icloud-backup) - Backup af enhed

🔒 SIKKERHED:
- [Beskyt din Apple-konto](/guides/enable-2fa) - To-faktor-godkendelse
- [Find min iPhone](/guides/find-my-iphone) - Find min enhed
- [Genkend svindelbeskeder](/guides/recognize-scam-messages) - Svindel-genkendelse
- [Genstart en frosset enhed](/guides/hard-reset) - Force restart
- [Undgå falske opkald](/guides/block-unknown-calls) - Blokér spam-opkald

═══ MITTEK-VÆRKTØJER ═══
- [Sikkerhedstjek](/sikkerhedstjek) - Tjek din enheds sikkerhed
- [Batteridoktor](/battery-doctor) - Analysér batterisundhed
- [Kode-mappe](/kodemappe) - Gem adgangskoder sikkert
- [Panik-knap](/panik) - Hurtig hjælp ved svindel
- [Adgangskodenøgle](/adgangskode) - Generer stærke koder
- [Svindelquiz](/svindelquiz) - Test din viden om svindel
- [Gæste-WiFi](/gaeste-wifi) - Del WiFi sikkert
- [Ordbog](/ordbog) - Tekniske begreber forklaret

═══ EKSTERNE RESSOURCER ═══
Brug når MitTek ikke har en guide:

📞 Apple Support:
- Generel hjælp: [Apple Support Danmark](https://support.apple.com/da-dk)
- Printer-opsætning: [AirPrint](https://support.apple.com/da-dk/102781)

📱 Sociale medier:
- Facebook: [Facebook Hjælpecenter](https://www.facebook.com/help/325807937506242)
- Instagram: [Instagram Hjælpecenter](https://help.instagram.com/196883487377501)
- YouTube: [YouTube Hjælp](https://support.google.com/youtube)

📺 Streaming:
- Netflix: [Netflix Hjælpecenter](https://help.netflix.com/da)
- DR TV: [DR Hjælp](https://www.dr.dk/hjaelp)
- TV 2 Play: [TV 2 Kundeservice](https://kundeservice.tv2.dk/)

💳 Betaling & offentlige tjenester:
- MobilePay: [MobilePay Hjælp](https://www.mobilepay.dk/hjaelp)
- MitID: [MitID Support](https://www.mitid.dk/hjaelp/)
- E-Boks: [E-Boks Support](https://www.e-boks.com/danmark/da/support)
- Borger.dk: [Borger.dk hjælp](https://www.borger.dk/Hjaelp)
- Sundhed.dk: [Sundhed.dk vejledning](https://www.sundhed.dk/borger/guides/)

📦 Andet:
- WhatsApp: [WhatsApp FAQ](https://faq.whatsapp.com/da)
- PostNord: [PostNord Kundeservice](https://www.postnord.dk/kundeservice)
`;

const SYSTEM_PROMPT = `Du er "Din Digitale Hjælper" – MitTeks rolige og venlige digitale assistent.

═══ DIN ROLLE ═══
Du hjælper brugeren med det, der vises på skærmen – værktøjer, funktioner og muligheder i MitTek-dashboardet og brugerfladen.

═══ TONE OG STIL ═══
- **Rolig og venlig**: Tal langsomt og tålmodigt, som en god ven
- **Tryg og beroligende**: "Det klarer vi nemt sammen 😊"
- **Simpelt dansk**: Brug hverdagsord, ingen teknisk jargon

═══ SVAR-REGLER ═══

**KORTE SVAR ER BEDST!**
- Maks 2-3 korte sætninger
- Foretruk 3-4 simple trin frem for lange afsnit
- Lange forklaringer kan overvælde brugeren

**TRIN-FOR-TRIN FORMAT:**
1. Tryk på **X**
2. Vælg **Y**
3. Færdig! ✅

**TILBYD MERE HJÆLP KORT:**
Afslut med én sætning: "Har du brug for mere hjælp?"

═══ DASHBOARD TILPASNING ═══

**Når brugeren spørger om at flytte eller ændre værktøjer på forsiden:**

Sådan gør du:
1. **Hold fingeren nede** på et værktøj i et par sekunder
2. Værktøjerne begynder at ryste – nu kan du flytte dem
3. Tryk på **Tilføj værktøj** i bunden for at tilføje nye
4. Tryk på **✕** på et værktøj for at fjerne det

**VIGTIGT:** Nævn ALDRIG en blyant-ikon eller gem-knap – de findes ikke!

═══ HENVISNINGER TIL HJÆLP ═══

**ALTID MitTeks egne guides først!**
Hvis emnet er dækket af en MitTek-guide, henvis dertil.

${GUIDE_LINKS}

**Hvis MitTek ikke har en guide:**
Henvis venligt til Apple Support eller andre officielle hjælpesider.

═══ VÆR ÆRLIG ═══
- **Gæt aldrig**: Sig roligt "Det er jeg ikke sikker på" og foreslå den bedste guide
- Giv altid korrekt information baseret på din viden

═══ SIKKERHED (STOP STRAKS) ═══
Ved NemID, MitID, CPR, bankkoder, passwords:
"⚠️ Det må jeg ikke hjælpe med. Ring til din bank på nummeret bag på dit kort."

Du kan altid hjælpe! 💚`;

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

    // 4. Parse and validate request body
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = rawBody;
    
    // Validate messages array
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "At least one message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (messages.length > 50) {
      return new Response(JSON.stringify({ error: "Too many messages (max 50)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and sanitize each message
    const MAX_MESSAGE_LENGTH = 10000;
    const sanitizedMessages = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      if (typeof msg !== 'object' || msg === null) {
        return new Response(JSON.stringify({ error: `Message ${i + 1} must be an object` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { role, content } = msg;

      if (typeof role !== 'string' || !['user', 'assistant'].includes(role)) {
        return new Response(JSON.stringify({ error: `Message ${i + 1} has invalid role` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (typeof content !== 'string') {
        return new Response(JSON.stringify({ error: `Message ${i + 1} content must be a string` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (content.length > MAX_MESSAGE_LENGTH) {
        return new Response(JSON.stringify({ error: `Message ${i + 1} is too long (max ${MAX_MESSAGE_LENGTH} characters)` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      sanitizedMessages.push({ role, content: content.trim() });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      logStep("ERROR: LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    logStep("Processing request", { messageCount: sanitizedMessages.length, userId: user.id });

    // Build personalized system prompt with user's devices
    const personalizedPrompt = `${SYSTEM_PROMPT}

═══ BRUGERENS ENHEDER ═══
${userName} ejer følgende enheder: ${deviceList}

Når du svarer:
- Hvis spørgsmålet tydeligt handler om én enhedstype, giv et direkte svar
- Hvis det er uklart hvilken enhed de mener, spørg venligt: "Er det på din iPhone eller Mac?"
- Tilpas altid instruktioner til den relevante enhed`;

    // 5. Call AI gateway with sanitized messages
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
          ...sanitizedMessages,
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
