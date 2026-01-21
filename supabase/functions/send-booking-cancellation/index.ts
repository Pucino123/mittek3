import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CancellationEmailRequest {
  bookingId: string;
  cancellationReason: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, cancellationReason }: CancellationEmailRequest = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: "Missing bookingId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking details with user email
    const { data: booking, error: bookingError } = await supabase
      .from("support_bookings")
      .select(`
        id,
        scheduled_date,
        scheduled_time,
        user_id
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Booking fetch error:", bookingError);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("user_id", booking.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Profile fetch error:", profileError);
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formattedDate = new Date(booking.scheduled_date).toLocaleDateString("da-DK", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const formattedTime = booking.scheduled_time.slice(0, 5);
    const userName = profile.display_name || "bruger";

    // Send cancellation email
    const emailResponse = await resend.emails.send({
      from: "MitTek <noreply@mittek.dk>",
      to: [profile.email],
      subject: "Din fjernsupport-session er blevet annulleret",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
            .card { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 24px; margin: 24px 0; }
            .reason-box { background: white; border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-top: 16px; }
            .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; color: #666; font-size: 14px; }
            .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🛡️ MitTek</div>
            </div>
            
            <h1 style="font-size: 24px; margin-bottom: 16px;">Hej ${userName},</h1>
            
            <p>Vi beklager at måtte informere dig om, at din planlagte fjernsupport-session er blevet annulleret.</p>
            
            <div class="card">
              <p style="margin: 0; font-weight: 600; color: #991b1b;">❌ Session annulleret</p>
              <p style="margin: 8px 0 0 0;">Planlagt til: <strong>${formattedDate} kl. ${formattedTime}</strong></p>
              
              <div class="reason-box">
                <p style="margin: 0; font-size: 14px; color: #666;">Årsag fra teknikeren:</p>
                <p style="margin: 8px 0 0 0; font-weight: 500;">"${cancellationReason}"</p>
              </div>
            </div>
            
            <p>Du er velkommen til at booke en ny session, når det passer dig:</p>
            
            <p style="text-align: center; margin: 32px 0;">
              <a href="https://mittek3.lovable.app/support-hub" class="btn">Book ny session</a>
            </p>
            
            <div class="footer">
              <p>Med venlig hilsen,<br><strong>MitTek Support</strong></p>
              <p style="font-size: 12px; color: #999;">
                © 2025 MitTek. Alle rettigheder forbeholdes.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Cancellation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-booking-cancellation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
