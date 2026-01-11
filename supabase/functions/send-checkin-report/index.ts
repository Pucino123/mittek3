import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { score, recommendations } = await req.json();

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .single();

    // Get trusted helper
    const { data: helpers } = await supabase
      .from("trusted_helpers")
      .select("helper_email, can_view_checkins")
      .eq("user_id", user.id)
      .eq("invitation_accepted", true);

    if (!helpers || helpers.length === 0) {
      return new Response(JSON.stringify({ error: "Ingen hjælper fundet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const helper = helpers[0];
    
    if (!helper.can_view_checkins) {
      return new Response(JSON.stringify({ error: "Hjælperen har ikke tilladelse til at se tjek-resultater" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // HTML escape function to prevent injection
    const escapeHtml = (text: string): string => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      };
      return text.replace(/[&<>"']/g, m => map[m]);
    };

    const userName = escapeHtml(profile?.display_name || profile?.email || "En bruger");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.log("[SEND-CHECKIN] No Resend key, simulating email send");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Rapport ville blive sendt (email ikke konfigureret)" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize recommendations before rendering to HTML
    const sanitizedRecommendations = (recommendations as string[])
      .map(r => escapeHtml(r))
      .map(r => `<li>${r}</li>`)
      .join('');

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "MitTek <noreply@mittek.dk>",
        to: [helper.helper_email],
        subject: `${userName} har gennemført et Månedligt Tjek`,
        html: `
          <h2>Hej!</h2>
          <p>${userName} har lige gennemført et Månedligt Tjek på MitTek.</p>
          <h3>Resultat: ${score}/100</h3>
          <p><strong>Anbefalinger:</strong></p>
          <ul>
            ${sanitizedRecommendations}
          </ul>
          <p>Med venlig hilsen,<br/>MitTek</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("[SEND-CHECKIN] Email error:", errorText);
      throw new Error("Could not send email");
    }

    console.log("[SEND-CHECKIN] Report sent to", helper.helper_email);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[SEND-CHECKIN] Error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
