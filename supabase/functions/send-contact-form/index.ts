import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Alle felter skal udfyldes" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supportEmailResponse = await resend.emails.send({
      from: "MitTek Kontakt <onboarding@resend.dev>",
      to: ["mittek@webilax.com"],
      reply_to: email,
      subject: `[MitTek Kontakt] ${subject}`,
      html: `
        <h2>Ny kontaktformular-henvendelse</h2>
        <p><strong>Fra:</strong> ${name} (${email})</p>
        <p><strong>Emne:</strong> ${subject}</p>
        <hr />
        <h3>Besked:</h3>
        <p style="white-space: pre-wrap;">${message}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Svar direkte på denne email for at kontakte afsender.
        </p>
      `,
    });

    console.log("Support email sent:", supportEmailResponse);

    // Send confirmation to user
    const confirmationEmailResponse = await resend.emails.send({
      from: "MitTek <onboarding@resend.dev>",
      to: [email],
      subject: "Vi har modtaget din besked - MitTek",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Tak for din henvendelse, ${name}!</h1>
          <p>Vi har modtaget din besked og vender tilbage hurtigst muligt.</p>
          <p><strong>Forventet svartid:</strong> 1-2 hverdage</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <h3>Din besked:</h3>
          <p><strong>Emne:</strong> ${subject}</p>
          <p style="white-space: pre-wrap; background: #f3f4f6; padding: 16px; border-radius: 8px;">${message}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #666;">
            Venlig hilsen,<br />
            <strong>MitTek-holdet</strong>
          </p>
        </div>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmailResponse);

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
    console.error("Error in send-contact-form function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
