import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetRequest {
  action: "request" | "verify" | "reset";
  email?: string;
  token?: string;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

const generateToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Get client IP from request
const getClientIP = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
};

// Check rate limit using database
const checkRateLimit = async (
  supabase: any,
  identifier: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> => {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  // Count requests in current window
  const { data: existingRecords, error: countError } = await supabase
    .from("rate_limits")
    .select("id, request_count")
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart);

  if (countError) {
    console.error("Rate limit check error:", countError);
    // Fail open - allow request if rate limit check fails
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW };
  }

  const totalRequests = (existingRecords || []).reduce(
    (sum: number, r: any) => sum + (r.request_count || 1),
    0
  );

  if (totalRequests >= MAX_REQUESTS_PER_WINDOW) {
    // Calculate retry-after time
    const oldestRecord = existingRecords?.[0];
    const retryAfter = oldestRecord 
      ? Math.ceil((new Date(oldestRecord.window_start).getTime() + RATE_LIMIT_WINDOW_MS - Date.now()) / 1000)
      : 60;

    return { 
      allowed: false, 
      remaining: 0,
      retryAfter: Math.max(retryAfter, 1)
    };
  }

  // Record this request
  const { error: insertError } = await supabase
    .from("rate_limits")
    .insert({
      identifier,
      endpoint,
      request_count: 1,
      window_start: new Date().toISOString(),
    });

  if (insertError) {
    console.error("Rate limit insert error:", insertError);
  }

  return { 
    allowed: true, 
    remaining: MAX_REQUESTS_PER_WINDOW - totalRequests - 1 
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    const endpoint = "vault-password-reset";

    // Check rate limit before processing
    const rateLimit = await checkRateLimit(supabase, clientIP, endpoint);
    
    if (!rateLimit.allowed) {
      console.log(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: "For mange forsøg. Vent venligst før du prøver igen.",
          retryAfter: rateLimit.retryAfter
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimit.retryAfter || 60)
          } 
        }
      );
    }

    const { action, email, token }: ResetRequest = await req.json();
    console.log(`Vault password reset action: ${action}, IP: ${clientIP}, remaining: ${rateLimit.remaining}`);

    if (action === "request") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email er påkrævet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by email in auth.users
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error("Error listing users:", authError);
        // Don't reveal if email exists
        return new Response(
          JSON.stringify({ success: true, message: "Hvis emailen findes, vil du modtage en nulstillingskode." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const user = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Don't reveal if email exists
        return new Response(
          JSON.stringify({ success: true, message: "Hvis emailen findes, vil du modtage en nulstillingskode." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user has vault_settings
      const { data: vaultSettings } = await supabase
        .from("vault_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!vaultSettings) {
        return new Response(
          JSON.stringify({ success: true, message: "Hvis emailen findes, vil du modtage en nulstillingskode." }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate reset token
      const resetToken = generateToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Delete any existing unused tokens for this user
      await supabase
        .from("vault_password_resets")
        .delete()
        .eq("user_id", user.id)
        .eq("used", false);

      // Insert new token
      const { error: insertError } = await supabase
        .from("vault_password_resets")
        .insert({
          user_id: user.id,
          token: resetToken,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error("Error inserting reset token:", insertError);
        return new Response(
          JSON.stringify({ error: "Kunne ikke oprette nulstillingstoken" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send email with token
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      try {
        await resend.emails.send({
          from: "MitTek <noreply@mittek.dk>",
          to: [email],
          subject: "Nulstil din Kode-mappe adgangskode",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #1a1a1a;">Nulstil Kode-mappe adgangskode</h1>
              <p>Du har anmodet om at nulstille din Kode-mappe adgangskode.</p>
              <p style="font-size: 24px; font-weight: bold; background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 2px;">
                ${resetToken.substring(0, 8).toUpperCase()}
              </p>
              <p><strong>Denne kode udløber om 15 minutter.</strong></p>
              <p>Hvis du ikke har anmodet om dette, kan du ignorere denne email.</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                ⚠️ <strong>Vigtigt:</strong> Denne handling vil slette alle dine gemte koder i Kode-mappen. 
                Du vil skulle oprette en ny adgangskode og tilføje dine koder igen.
              </p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
              <p style="color: #999; font-size: 12px;">MitTek - Din digitale sikkerhedspartner</p>
            </div>
          `,
        });
        console.log("Reset email sent successfully");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Still return success to not reveal email status
      }

      return new Response(
        JSON.stringify({ success: true, message: "Hvis emailen findes, vil du modtage en nulstillingskode." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Token er påkrævet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find token (match first 8 chars uppercase)
      const { data: resetData, error: resetError } = await supabase
        .from("vault_password_resets")
        .select("*")
        .eq("used", false)
        .gte("expires_at", new Date().toISOString());

      if (resetError || !resetData || resetData.length === 0) {
        return new Response(
          JSON.stringify({ valid: false, error: "Ugyldig eller udløbet kode" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const matchingReset = resetData.find(r => 
        r.token.substring(0, 8).toUpperCase() === token.toUpperCase()
      );

      if (!matchingReset) {
        return new Response(
          JSON.stringify({ valid: false, error: "Ugyldig eller udløbet kode" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, userId: matchingReset.user_id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset") {
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Token er påkrævet" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find and validate token
      const { data: resetData } = await supabase
        .from("vault_password_resets")
        .select("*")
        .eq("used", false)
        .gte("expires_at", new Date().toISOString());

      const matchingReset = resetData?.find(r => 
        r.token.substring(0, 8).toUpperCase() === token.toUpperCase()
      );

      if (!matchingReset) {
        return new Response(
          JSON.stringify({ error: "Ugyldig eller udløbet kode" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark token as used
      await supabase
        .from("vault_password_resets")
        .update({ used: true })
        .eq("id", matchingReset.id);

      // Delete all vault items for user
      await supabase
        .from("vault_items")
        .delete()
        .eq("user_id", matchingReset.user_id);

      // Delete vault folders for user
      await supabase
        .from("vault_folders")
        .delete()
        .eq("user_id", matchingReset.user_id);

      // Delete vault settings (so they can set up again)
      await supabase
        .from("vault_settings")
        .delete()
        .eq("user_id", matchingReset.user_id);

      console.log(`Vault reset completed for user ${matchingReset.user_id}`);

      return new Response(
        JSON.stringify({ success: true, message: "Din Kode-mappe er blevet nulstillet. Du kan nu oprette en ny adgangskode." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ugyldig handling" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in vault-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
