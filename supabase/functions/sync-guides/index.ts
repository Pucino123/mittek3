import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded guides data (simplified - matching the key guides from the frontend)
const hardcodedGuidesData = [
  {
    id: "update-ios",
    title: "Opdater din enhed sikkert",
    description: "Sørg for at din enhed har den nyeste software",
    category: "hverdag",
    steps: [
      { step_number: 1, title: "Åbn Indstillinger", instruction: "Find det grå tandhjul-ikon på din startskærm, og tryk på det. Det hedder \"Indstillinger\"." },
      { step_number: 2, title: "Tryk på \"Generelt\"", instruction: "Rul lidt ned på siden og find \"Generelt\". Det har et tandhjul-ikon. Tryk på det." },
      { step_number: 3, title: "Find \"Softwareopdatering\"", instruction: "I menuen \"Generelt\", find og tryk på \"Softwareopdatering\". Den er ofte øverst." },
      { step_number: 4, title: "Installer opdateringen", instruction: "Hvis der er en opdatering tilgængelig, tryk på \"Hent og installer\". Sørg for at din telefon har mindst 50% batteri." }
    ]
  },
  {
    id: "stop-popups",
    title: "Stop irriterende popups (Safari)",
    description: "Blokér uønskede vinduer og advarsler i Safari",
    category: "hverdag",
    steps: [
      { step_number: 1, title: "Åbn Indstillinger", instruction: "Find det grå tandhjul-ikon på din startskærm, og tryk på det." },
      { step_number: 2, title: "Find Safari", instruction: "Rul ned i Indstillinger indtil du finder \"Safari\" (den har et kompas-ikon). Tryk på den." },
      { step_number: 3, title: "Slå \"Bloker vinduer\" til", instruction: "Find sektionen \"Generelt\" og sørg for at \"Bloker vinduer\" er slået TIL (den skal være grøn)." },
      { step_number: 4, title: "Aktiver svindelbeskyttelse", instruction: "Rul ned til \"Anonymitet og sikkerhed\" og sørg for at \"Advarsel om svindelwebsted\" er slået TIL (grøn)." }
    ]
  },
  {
    id: "bigger-text",
    title: "Gør teksten større",
    description: "Gør det lettere at læse på din skærm",
    category: "hverdag",
    steps: [
      { step_number: 1, title: "Åbn Indstillinger", instruction: "Find det grå tandhjul-ikon på din startskærm, og tryk på det." },
      { step_number: 2, title: "Find \"Skærm & Lysstyrke\"", instruction: "Rul ned og find \"Skærm & Lysstyrke\". Tryk på den." },
      { step_number: 3, title: "Tryk på \"Tekststørrelse\"", instruction: "Find og tryk på \"Tekststørrelse\". Her kan du justere hvor stor teksten skal være." },
      { step_number: 4, title: "Træk skyderen", instruction: "Træk skyderen mod HØJRE for at gøre teksten STØRRE." }
    ]
  },
  {
    id: "extend-battery-life",
    title: "Forlæng din batteritid",
    description: "Få din enhed til at holde strøm hele dagen",
    category: "batteri",
    steps: [
      { step_number: 1, title: "Tjek din batteritilstand", instruction: "Gå til Indstillinger > Batteri > Batteritilstand & Opladning." },
      { step_number: 2, title: "Slå strømbesparelse til", instruction: "Swipe ned fra højre hjørne af skærmen og tryk på batteri-ikonet." },
      { step_number: 3, title: "Find strømslugerne", instruction: "Gå til Indstillinger > Batteri og se listen over apps der bruger mest strøm." },
      { step_number: 4, title: "Sluk for unødvendige funktioner", instruction: "Gå til Indstillinger > Generelt > Opdater i baggrunden og slå det fra for apps du ikke bruger." }
    ]
  },
  {
    id: "block-unknown-calls",
    title: "Undgå falske opkald",
    description: "Stop svindlere i at ringe til dig",
    category: "sikkerhed",
    steps: [
      { step_number: 1, title: "Åbn Telefon-indstillinger", instruction: "Din iPhone kan automatisk afvise folk, du ikke kender. Gå til Indstillinger > Telefon." },
      { step_number: 2, title: "Find funktionen", instruction: "Rul helt ned i bunden af listen og find \"Gør ukendte opkald lydløse\"." },
      { step_number: 3, title: "Slå det til", instruction: "Skub knappen, så den bliver grøn. Nu ringer telefonen kun, hvis det er nogen fra dine kontakter." }
    ]
  },
  {
    id: "two-factor-auth",
    title: "Tænd for to-faktor godkendelse",
    description: "Dobbelt beskyttelse af din Apple-konto",
    category: "sikkerhed",
    steps: [
      { step_number: 1, title: "Åbn Indstillinger", instruction: "Find det grå tandhjul-ikon og tryk på det." },
      { step_number: 2, title: "Tryk på dit navn øverst", instruction: "Helt øverst i Indstillinger ser du dit navn og billede. Tryk på det." },
      { step_number: 3, title: "Gå til \"Log ind & sikkerhed\"", instruction: "Find og tryk på \"Log ind & sikkerhed\"." },
      { step_number: 4, title: "Aktiver to-faktor", instruction: "Tryk på \"To-faktor-godkendelse\" og følg vejledningen." }
    ]
  },
  {
    id: "find-my-device",
    title: "Aktiver \"Find min\"",
    description: "Find din enhed hvis den bliver væk",
    category: "sikkerhed",
    steps: [
      { step_number: 1, title: "Åbn Indstillinger", instruction: "Find det grå tandhjul-ikon på din startskærm." },
      { step_number: 2, title: "Tryk på dit navn øverst", instruction: "Dit navn og billede står øverst i Indstillinger." },
      { step_number: 3, title: "Tryk på \"Find\"", instruction: "Find \"Find\" i listen og tryk på den." },
      { step_number: 4, title: "Aktiver alle tre muligheder", instruction: "Sørg for at \"Find min iPhone\", \"Find-netværk\" og \"Send sidste lokation\" alle er slået TIL (grønne)." }
    ]
  },
  {
    id: "icloud-backup",
    title: "Sikkerhedskopier til iCloud",
    description: "Gem dine billeder og data sikkert i skyen",
    category: "icloud",
    steps: [
      { step_number: 1, title: "Åbn Indstillinger", instruction: "Find det grå tandhjul-ikon på din startskærm." },
      { step_number: 2, title: "Tryk på dit navn øverst", instruction: "Øverst i Indstillinger ser du dit navn. Tryk på det." },
      { step_number: 3, title: "Tryk på \"iCloud\"", instruction: "Find og tryk på \"iCloud\"." },
      { step_number: 4, title: "Aktiver iCloud-sikkerhedskopi", instruction: "Tryk på \"iCloud-sikkerhedskopi\" og sørg for at den er slået til. Tryk derefter på \"Sikkerhedskopier nu\"." }
    ]
  },
  {
    id: "manage-imessage",
    title: "Ryd op i Beskeder",
    description: "Slet gamle beskeder og frigør plads",
    category: "beskeder",
    steps: [
      { step_number: 1, title: "Åbn Indstillinger", instruction: "Find det grå tandhjul-ikon på din startskærm." },
      { step_number: 2, title: "Find \"Beskeder\"", instruction: "Rul ned og tryk på \"Beskeder\" (blå taleboble-ikon)." },
      { step_number: 3, title: "Vælg historik", instruction: "Under \"Beskedhistorik\", tryk på \"Behold beskeder\" og vælg hvor længe du vil gemme gamle beskeder." },
      { step_number: 4, title: "Slet store vedhæftninger", instruction: "Gå til Indstillinger > Generelt > iPhone-lagerplads > Beskeder for at se og slette store filer." }
    ]
  },
  {
    id: "organize-apps",
    title: "Organisér dine apps",
    description: "Ryd op på din startskærm og find ting lettere",
    category: "apps",
    steps: [
      { step_number: 1, title: "Hold fingeren nede på en app", instruction: "Tryk og hold på en app indtil alle apps begynder at ryste." },
      { step_number: 2, title: "Træk apps sammen", instruction: "Træk en app oven på en anden for at oprette en mappe." },
      { step_number: 3, title: "Navngiv mappen", instruction: "Tryk på mappens navn for at ændre det til noget beskrivende, fx \"Spil\" eller \"Nyheder\"." },
      { step_number: 4, title: "Afslut redigering", instruction: "Tryk på en tom plads på skærmen, eller tryk på \"Færdig\" øverst til højre." }
    ]
  }
];

const logStep = (step: string, details?: any) => {
  console.log(`[SYNC-GUIDES] ${step}`, details ? JSON.stringify(details) : "");
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin status
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting guide sync", { user_id: user.id });

    // Check existing guides count
    const { data: existingGuides, error: countError } = await supabaseAdmin
      .from("guides")
      .select("id, title");
    
    if (countError) throw countError;
    
    logStep("Existing guides", { count: existingGuides?.length || 0 });

    let syncedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Insert each guide
    for (const guideData of hardcodedGuidesData) {
      // Check if guide already exists
      const existingGuide = existingGuides?.find(g => 
        g.title.toLowerCase() === guideData.title.toLowerCase()
      );
      
      if (existingGuide) {
        logStep("Skipping existing guide", { title: guideData.title });
        skippedCount++;
        continue;
      }

      // Insert guide
      const { data: newGuide, error: guideError } = await supabaseAdmin
        .from("guides")
        .insert({
          title: guideData.title,
          description: guideData.description,
          category: guideData.category,
          is_published: true,
          min_plan: "basic",
          sort_order: syncedCount,
        })
        .select()
        .single();

      if (guideError) {
        logStep("Error inserting guide", { title: guideData.title, error: guideError });
        errors.push(`Guide "${guideData.title}": ${guideError.message}`);
        continue;
      }

      logStep("Inserted guide", { id: newGuide.id, title: guideData.title });

      // Insert steps for this guide
      const stepsToInsert = guideData.steps.map(step => ({
        guide_id: newGuide.id,
        step_number: step.step_number,
        title: step.title,
        instruction: step.instruction,
      }));

      const { error: stepsError } = await supabaseAdmin
        .from("guide_steps")
        .insert(stepsToInsert);

      if (stepsError) {
        logStep("Error inserting steps", { guide_id: newGuide.id, error: stepsError });
        errors.push(`Steps for "${guideData.title}": ${stepsError.message}`);
      } else {
        logStep("Inserted steps", { guide_id: newGuide.id, count: stepsToInsert.length });
      }

      syncedCount++;
    }

    logStep("Sync complete", { synced: syncedCount, skipped: skippedCount, errors: errors.length });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synkronisering fuldført`,
        synced: syncedCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
