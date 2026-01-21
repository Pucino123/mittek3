import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  bookingId: string;
  userEmail: string;
  userName?: string;
  scheduledDate: string;
  scheduledTime: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { bookingId, userEmail, userName, scheduledDate, scheduledTime }: BookingConfirmationRequest = await req.json();

    if (!bookingId || !userEmail || !scheduledDate || !scheduledTime) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format the date nicely
    const dateObj = new Date(scheduledDate);
    const formattedDate = dateObj.toLocaleDateString('da-DK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = scheduledTime.slice(0, 5);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "MitTek Support <support@mittek.dk>",
        to: [userEmail],
        subject: "Din fjernsupport-session er bekræftet! ✅",
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px 24px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: rgba(255,255,255,0.2); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 32px;">🎉</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                Bekræftet!
              </h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px 24px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Hej${userName ? ` ${userName}` : ''},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                Din fjernsupport-session er nu bekræftet! 🎊
              </p>
              
              <!-- Session details card -->
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <span style="font-size: 20px; margin-right: 8px;">📅</span>
                  <strong style="color: #0369a1;">Dato:</strong>
                  <span style="color: #0c4a6e; margin-left: 8px;">${formattedDate}</span>
                </div>
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 8px;">⏰</span>
                  <strong style="color: #0369a1;">Tidspunkt:</strong>
                  <span style="color: #0c4a6e; margin-left: 8px;">kl. ${formattedTime}</span>
                </div>
              </div>
              
              <h3 style="color: #111827; font-size: 18px; margin: 0 0 16px;">
                Sådan forbereder du dig:
              </h3>
              
              <ol style="color: #4b5563; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
                <li>Sørg for at have din enhed klar og opladet</li>
                <li>Find et roligt sted med god internetforbindelse</li>
                <li>Log ind på dit MitTek dashboard 5 min før</li>
                <li>Klik på "Start session" når tiden kommer</li>
              </ol>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                En tekniker vil guide dig gennem hele processen og kan tegne direkte på din skærm for at vise dig præcis hvad du skal gøre.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                MitTek • Din digitale hjælper<br>
                <a href="https://mittek.dk" style="color: #3b82f6; text-decoration: none;">mittek.dk</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Booking confirmation email sent:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
