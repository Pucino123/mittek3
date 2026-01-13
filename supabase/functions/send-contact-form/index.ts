import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 requests per minute per IP

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-CONTACT-FORM] ${step}${detailsStr}`);
};

// Rate limiting helper
async function checkRateLimit(supabase: any, identifier: string, endpoint: string): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  
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
    
    await supabase
      .from("rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("identifier", identifier)
      .eq("endpoint", endpoint);
    
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - existing.request_count - 1 };
  }

  await supabase.from("rate_limits").insert({
    identifier,
    endpoint,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
}

// Input validation helper
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function sanitizeInput(input: string, maxLength: number): string {
  return input.trim().slice(0, maxLength);
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                    req.headers.get("x-real-ip") || 
                    "unknown";

  try {
    logStep("Function started", { ip: ipAddress });

    // Rate limiting check
    const rateCheck = await checkRateLimit(supabaseAdmin, ipAddress, "send-contact-form");
    if (!rateCheck.allowed) {
      logStep("Rate limit exceeded", { ip: ipAddress });
      return new Response(
        JSON.stringify({ error: "For mange beskeder. Vent venligst et minut." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const body: ContactFormRequest = await req.json();

    // Validate and sanitize required fields
    const name = sanitizeInput(body.name || "", 100);
    const email = sanitizeInput(body.email || "", 255);
    const subject = sanitizeInput(body.subject || "", 200);
    const message = sanitizeInput(body.message || "", 2000);

    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Alle felter skal udfyldes" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Ugyldig email-adresse" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
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

    const escapedName = escapeHtml(name);
    const escapedSubject = escapeHtml(subject);
    const escapedMessage = escapeHtml(message);

    const supportEmailResponse = await resend.emails.send({
      from: "MitTek Kontakt <onboarding@resend.dev>",
      to: ["mittek@webilax.com"],
      reply_to: email,
      subject: `[MitTek Kontakt] ${escapedSubject}`,
      html: `
        <h2>Ny kontaktformular-henvendelse</h2>
        <p><strong>Fra:</strong> ${escapedName} (${escapeHtml(email)})</p>
        <p><strong>Emne:</strong> ${escapedSubject}</p>
        <hr />
        <h3>Besked:</h3>
        <p style="white-space: pre-wrap;">${escapedMessage}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Svar direkte på denne email for at kontakte afsender.
        </p>
      `,
    });

    logStep("Support email sent", { id: supportEmailResponse?.data?.id });

    // Send confirmation to user
    const confirmationEmailResponse = await resend.emails.send({
      from: "MitTek <onboarding@resend.dev>",
      to: [email],
      subject: "Vi har modtaget din besked - MitTek",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Tak for din henvendelse, ${escapedName}!</h1>
          <p>Vi har modtaget din besked og vender tilbage hurtigst muligt.</p>
          <p><strong>Forventet svartid:</strong> 1-2 hverdage</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <h3>Din besked:</h3>
          <p><strong>Emne:</strong> ${escapedSubject}</p>
          <p style="white-space: pre-wrap; background: #f3f4f6; padding: 16px; border-radius: 8px;">${escapedMessage}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #666;">
            Venlig hilsen,<br />
            <strong>MitTek-holdet</strong>
          </p>
        </div>
      `,
    });

    logStep("Confirmation email sent", { id: confirmationEmailResponse?.data?.id });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Emails sendt succesfuldt" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    logStep("Error", { message: error.message });
    return new Response(
      JSON.stringify({ error: "Der opstod en fejl. Prøv igen senere." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
