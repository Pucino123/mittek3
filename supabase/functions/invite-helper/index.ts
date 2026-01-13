import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 invitations per hour per user

interface InviteRequest {
  helper_email: string;
  can_view_dashboard: boolean;
  can_view_checkins: boolean;
  can_view_tickets: boolean;
  can_view_notes: boolean;
  expiration_option?: '7days' | '30days' | 'permanent';
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[INVITE-HELPER] ${step}${detailsStr}`);
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

function calculateExpiresAt(option: string | undefined): string | null {
  const now = new Date();
  switch (option) {
    case '7days':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30days':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    case 'permanent':
    default:
      return null;
  }
}

// Email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client for rate limiting
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      logStep("Auth error", { error: authError });
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check based on user ID
    const rateCheck = await checkRateLimit(supabaseAdmin, user.id, "invite-helper");
    if (!rateCheck.allowed) {
      logStep("Rate limit exceeded", { userId: user.id });
      return new Response(
        JSON.stringify({ error: "For mange invitationer. Du kan sende op til 10 invitationer i timen." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { helper_email, can_view_dashboard, can_view_checkins, can_view_tickets, can_view_notes, expiration_option }: InviteRequest = await req.json();

    // Calculate expiration date
    const expiresAt = calculateExpiresAt(expiration_option);

    if (!helper_email) {
      return new Response(
        JSON.stringify({ error: "helper_email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!validateEmail(helper_email)) {
      return new Response(
        JSON.stringify({ error: "Ugyldig email-adresse" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent inviting yourself
    if (helper_email.toLowerCase() === user.email?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "Du kan ikke invitere dig selv som hjælper" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Inviting helper", { helper_email, userId: user.id });

    // Get user profile for display name

    // Get user profile for display name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .single();

    const senderName = profile?.display_name || profile?.email?.split('@')[0] || 'En bruger';

    // Generate invitation token
    const invitationToken = crypto.randomUUID();

    // Insert helper record
    const { data: helper, error: insertError } = await supabaseAdmin
      .from("trusted_helpers")
      .insert({
        user_id: user.id,
        helper_email,
        invitation_token: invitationToken,
        can_view_dashboard,
        can_view_checkins,
        can_view_tickets,
        can_view_notes,
        invitation_accepted: false,
        expires_at: expiresAt,
        permissions: {
          can_view_dashboard,
          can_view_checkins,
          can_view_tickets,
          can_view_notes,
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    console.log("Helper record created:", helper.id);

    // Send email via Resend - use production domain
    const appUrl = "https://www.mittek.dk";
    const inviteLink = `${appUrl}/helper-invite?token=${invitationToken}`;

    const emailResponse = await resend.emails.send({
      from: "MitTek <noreply@mittek.dk>",
      to: [helper_email],
      subject: `Hjælp ${senderName} med IT-tryghed`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h1 style="color: #1a1a1a; margin-top: 16px; font-size: 24px;">MitTek</h1>
          </div>
          
          <h2 style="color: #1a1a1a; font-size: 20px;">Hej!</h2>
          
          <p style="font-size: 16px;"><strong>${senderName}</strong> har inviteret dig som deres trygheds-hjælper på MitTek.</p>
          
          <p style="font-size: 16px;">Som hjælper kan du:</p>
          <ul style="font-size: 16px;">
            ${can_view_dashboard ? '<li>Se deres oversigt og status</li>' : ''}
            ${can_view_checkins ? '<li>Se deres månedlige tjek-resultater</li>' : ''}
            ${can_view_tickets ? '<li>Se deres support-sager</li>' : ''}
            ${can_view_notes ? '<li>Se deres noter</li>' : ''}
          </ul>
          
          <p style="font-size: 16px;">På den måde kan du hjælpe dem med at holde øje med deres digitale sikkerhed.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);">
              Accepter invitation
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Hvis knappen ikke virker, kan du kopiere dette link:<br>
            <a href="${inviteLink}" style="color: #3B82F6;">${inviteLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Du modtager denne email fordi ${senderName} har inviteret dig som hjælper på MitTek.
          </p>
        </body>
        </html>
      `,
    });

    console.log("Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        helper_id: helper.id,
        message: "Invitation sent successfully" 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
