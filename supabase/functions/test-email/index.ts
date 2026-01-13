import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "RESEND_API_KEY is not configured" 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resend = new Resend(resendApiKey);
    
    // Parse optional target email from request body
    let targetEmail = "delivered@resend.dev"; // Resend's test email that always succeeds
    try {
      const body = await req.json();
      if (body.email) {
        targetEmail = body.email;
      }
    } catch {
      // No body provided, use default test email
    }

    console.log(`Sending test email to: ${targetEmail}`);

    const emailResponse = await resend.emails.send({
      from: "DigitalHjelper <noreply@digitalhjelper.dk>",
      to: [targetEmail],
      subject: "✅ Test Email - Resend API Virker!",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 30px;">✓</span>
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">Email Test Succesfuld!</h1>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #166534; margin: 0; font-size: 16px;">
              🎉 Din Resend API-nøgle er korrekt konfigureret og emails kan sendes.
            </p>
          </div>
          
          <div style="color: #6b7280; font-size: 14px;">
            <p><strong>Sendt:</strong> ${new Date().toLocaleString('da-DK')}</p>
            <p><strong>Fra:</strong> DigitalHjelper</p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Dette er en test-email fra DigitalHjelper.dk
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test email sent successfully",
        emailId: emailResponse.data?.id,
        sentTo: targetEmail
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending test email:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.statusCode ? `Status: ${error.statusCode}` : undefined
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
