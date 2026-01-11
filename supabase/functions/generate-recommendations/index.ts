import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });

  try {
    // Validate authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Ikke autoriseret" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Ugyldig session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body - support both old and new format
    const body = await req.json();
    const { checkinData, issues, devices } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // New format with issues string
    if (issues !== undefined) {
      // Build strict device list for AI
      const deviceList = devices?.length > 0 
        ? devices.map((d: string) => {
            if (d === 'iphone') return 'iPhone';
            if (d === 'ipad') return 'iPad';
            if (d === 'mac') return 'Mac';
            return d;
          }).join(', ')
        : 'ukendt';

      const systemPrompt = `Du er MitTeks sikkerhedsrådgiver. Baseret på brugerens enhedsproblemer, generer 1-4 konkrete, handlingsrettede anbefalinger.

KRITISK REGEL - ENHEDSBEGRÆNSNING:
- Brugeren ejer KUN disse enheder: ${deviceList}
- Du må ALDRIG nævne enheder brugeren ikke har
- Hvis brugeren IKKE har Mac/computer, må du IKKE nævne: Papirkurv, genstart computer, Mac, macOS, Systemindstillinger
- Hvis brugeren IKKE har iPhone, må du IKKE nævne: iPhone-specifikke funktioner
- Hvis brugeren IKKE har iPad, må du IKKE nævne: iPad-specifikke funktioner

REGLER:
1. Svar KUN med valid JSON - ingen markdown, ingen forklaringer
2. Hver anbefaling skal have: title (kort), description (1-2 sætninger), priority (high/medium/low)
3. Brug dansk sprog
4. Vær konkret og handlingsorienteret
5. Prioriter sikkerhedsproblemer højt

EKSEMPEL OUTPUT FORMAT:
{
  "recommendations": [
    {
      "title": "Opdater din iPhone nu",
      "description": "Sikkerhedsopdateringer beskytter mod hackere. Gå til Indstillinger → Generelt → Softwareopdatering.",
      "priority": "high"
    }
  ]
}`;

      const userPrompt = `Brugerens enheder: ${devices?.join(', ') || 'Ukendt'}

Fundne problemer:
${issues || 'Ingen problemer fundet'}

Generer anbefalinger baseret på disse problemer.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 1000,
          temperature: 0.3
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      // Parse JSON from response
      let recommendations;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          recommendations = parsed.recommendations || [];
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Parse error:', parseError, 'Content:', content);
        recommendations = [{
          title: "Tjek dine enheder",
          description: "Vi kunne ikke generere specifikke anbefalinger. Gennemgå dine svar og følg de generelle sikkerhedsråd.",
          priority: "medium"
        }];
      }

      return new Response(JSON.stringify({ recommendations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Old format with checkinData object
    const context = [];
    if (checkinData?.storage_free_gb !== null && checkinData?.storage_free_gb !== undefined) {
      if (checkinData.storage_free_gb < 5) {
        context.push('Brugeren har meget lidt ledig plads (under 5 GB)');
      } else if (checkinData.storage_free_gb < 10) {
        context.push('Brugeren har begrænset ledig plads (under 10 GB)');
      }
    }
    if (checkinData?.has_pending_update) {
      context.push('Brugeren har en ventende opdatering');
    }
    if (checkinData?.sees_annoying_popups) {
      context.push('Brugeren oplever irriterende popups');
    }
    if (checkinData?.unsure_about_messages) {
      context.push('Brugeren har været usikker på mistænkelige beskeder');
    }

    // If no issues, return simple recommendation
    if (context.length === 0) {
      return new Response(JSON.stringify({ 
        recommendations: ['Din enhed ser fin ud! Fortsæt med at holde øje med opdateringer og mistænkelige beskeder.']
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `Du er en venlig IT-hjælper for ældre danskere. Baseret på følgende tjek-resultater, giv 3 korte, konkrete og venlige anbefalinger på dansk. Hver anbefaling skal være max 1-2 sætninger og meget let at forstå.

Tjek-resultater:
${context.join('\n')}

Svar kun med de 3 anbefalinger, en per linje, uden nummerering eller punktopstilling.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      const fallback = context.map(c => {
        if (c.includes('ledig plads')) return 'Frigør plads ved at slette gamle billeder og apps du ikke bruger.';
        if (c.includes('opdatering')) return 'Installér den ventende opdatering for at holde din enhed sikker.';
        if (c.includes('popups')) return 'Luk Safari og undgå mistænkelige hjemmesider.';
        if (c.includes('beskeder')) return 'Brug Sikkerhedsskjoldet til at tjekke mistænkelige beskeder.';
        return '';
      }).filter(Boolean);
      
      return new Response(JSON.stringify({ recommendations: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const recommendations = content
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .slice(0, 3);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      recommendations: ['Kunne ikke generere anbefalinger. Prøv igen senere.']
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});