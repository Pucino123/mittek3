import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for targeted sending
    let targetUserId: string | null = null;
    try {
      const body = await req.json();
      targetUserId = body?.targetUserId || null;
    } catch {
      // No body or not JSON - continue with batch mode
    }

    console.log(targetUserId 
      ? `Sending targeted reminder to user: ${targetUserId}` 
      : "Starting monthly reminder check...");

    if (!resendApiKey) {
      console.log("No Resend API key configured");
      return new Response(
        JSON.stringify({ error: "Email not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get profiles - either specific user or all
    let profilesQuery = supabase
      .from('profiles')
      .select('user_id, display_name, email');

    if (targetUserId) {
      profilesQuery = profilesQuery.eq('user_id', targetUserId);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} profiles to check`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      // Skip the 30-day check if this is a targeted send (helper requesting reminder)
      if (!targetUserId) {
        // Get latest checkin for this user
        const { data: latestCheckin } = await supabase
          .from('checkins')
          .select('completed_at')
          .eq('user_id', profile.user_id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Determine if user needs a reminder
        let needsReminder = false;
        
        if (!latestCheckin) {
          // Never done a checkin
          needsReminder = true;
        } else {
          const lastCheckinDate = new Date(latestCheckin.completed_at);
          if (lastCheckinDate < thirtyDaysAgo) {
            needsReminder = true;
          }
        }

        if (!needsReminder) continue;
      }

      // Send reminder email via Resend
      try {
        const displayName = profile.display_name || profile.email.split('@')[0];
        
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MitTek <noreply@mittek.dk>",
            to: [profile.email],
            subject: `Det er tid til dit månedlige tjek, ${displayName}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1a73e8; font-size: 28px; margin-bottom: 10px;">🔒 MitTek</h1>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
                  <h2 style="color: #1a1a1a; font-size: 22px; margin-top: 0;">Hej ${displayName}!</h2>
                  
                  <p style="font-size: 16px; color: #555;">
                    Det er 30 dage siden, vi sidst tjekkede din digitale sikkerhed.
                  </p>
                  
                  <p style="font-size: 16px; color: #555;">
                    Brug 2 minutter på at sikre, at alt er opdateret og trygt på din telefon.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://mittek.dk/checkin" style="display: inline-block; background: #1a73e8; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Start dit månedlige tjek
                    </a>
                  </div>
                </div>
                
                <p style="font-size: 14px; color: #888; text-align: center;">
                  Du modtager denne email fordi du er bruger af MitTek.<br>
                  <a href="https://mittek.dk/settings" style="color: #1a73e8;">Administrer dine indstillinger</a>
                </p>
              </body>
              </html>
            `,
          }),
        });

        if (emailResponse.ok) {
          console.log(`Sent reminder to ${profile.email}`);
          sentCount++;
        } else {
          const errorText = await emailResponse.text();
          console.error(`Failed to send to ${profile.email}:`, errorText);
          errors.push(profile.email);
        }
      } catch (emailError) {
        console.error(`Failed to send to ${profile.email}:`, emailError);
        errors.push(profile.email);
      }
    }

    console.log(`Monthly reminder completed. Sent: ${sentCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errors.length,
        errorEmails: errors,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-monthly-reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
