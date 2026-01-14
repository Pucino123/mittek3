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
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 sends per hour per user

interface SendCodeRequest {
  access_code: string;
  contact_name: string;
  contact_email: string;
  instructions?: string;
  vault_items?: Array<{ title: string; secret: string; note?: string }>;
}

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-LEGACY-CODE] ${step}${detailsStr}`);
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

// Email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Simple hash function for storing the code
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive encryption key from access code
async function deriveKeyFromCode(code: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(code),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt vault data with access code
async function encryptVaultData(data: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  };
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

    // Create Supabase admin client
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

    // Rate limiting check
    const rateCheck = await checkRateLimit(supabaseAdmin, user.id, "send-legacy-code");
    if (!rateCheck.allowed) {
      logStep("Rate limit exceeded", { userId: user.id });
      return new Response(
        JSON.stringify({ error: "For mange forsendelser. Du kan sende op til 5 emails i timen." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { access_code, contact_name, contact_email, instructions, vault_items }: SendCodeRequest = await req.json();

    // Validate inputs
    if (!access_code || access_code.length < 4) {
      return new Response(
        JSON.stringify({ error: "Adgangskode skal være mindst 4 tegn" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contact_name || contact_name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Kontaktperson navn er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contact_email || !validateEmail(contact_email)) {
      return new Response(
        JSON.stringify({ error: "Ugyldig email-adresse" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Sending legacy code", { contactEmail: contact_email, userId: user.id, hasVaultItems: !!vault_items });

    // Get user profile for display name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .single();

    const senderName = profile?.display_name || profile?.email?.split('@')[0] || 'En bruger';

    // Hash and store the access code
    const codeHash = await hashCode(access_code);
    
    await supabaseAdmin
      .from("profiles")
      .update({
        legacy_access_code_hash: codeHash,
        legacy_access_code_sent_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    // If vault items are provided, encrypt and store them as a backup
    if (vault_items && vault_items.length > 0) {
      const key = await deriveKeyFromCode(access_code, user.id);
      const vaultDataJson = JSON.stringify(vault_items);
      const { ciphertext, iv } = await encryptVaultData(vaultDataJson, key);
      
      // Upsert the backup
      await supabaseAdmin
        .from("legacy_vault_backups")
        .upsert({
          user_id: user.id,
          encrypted_data: ciphertext,
          iv: iv,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      logStep("Vault backup created", { itemCount: vault_items.length });
    }

    // Send email via Resend
    const appUrl = "https://www.mittek.dk";

    const emailResponse = await resend.emails.send({
      from: "MitTek <noreply@mittek.dk>",
      to: [contact_email],
      subject: `Digital Arv: Adgangskode fra ${senderName}`,
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
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <h1 style="color: #1a1a1a; margin-top: 16px; font-size: 24px;">Digital Arv</h1>
          </div>
          
          <h2 style="color: #1a1a1a; font-size: 20px;">Kære ${contact_name}</h2>
          
          <p style="font-size: 16px;"><strong>${senderName}</strong> har betroet dig med en vigtig adgangskode til deres digitale Kode-mappe på MitTek.</p>
          
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #3B82F6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="font-size: 14px; color: #666; margin-bottom: 8px;">Din adgangskode:</p>
            <p style="font-size: 28px; font-weight: bold; color: #1a1a1a; letter-spacing: 4px; margin: 0; font-family: monospace;">${access_code}</p>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
            <p style="font-size: 14px; color: #92400e; margin: 0;">
              <strong>⚠️ Vigtigt:</strong> Gem denne kode et sikkert sted. Du kan bruge den til at få adgang til ${senderName}s Kode-mappe, hvis det bliver nødvendigt.
            </p>
          </div>
          
          ${instructions ? `
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="font-size: 14px; color: #666; margin-bottom: 8px;"><strong>Besked fra ${senderName}:</strong></p>
            <p style="font-size: 15px; color: #333; margin: 0; white-space: pre-wrap;">${instructions}</p>
          </div>
          ` : ''}
          
          <p style="font-size: 16px;">For at bruge koden skal du:</p>
          <ol style="font-size: 16px;">
            <li>Gå til <a href="${appUrl}" style="color: #3B82F6;">MitTek</a></li>
            <li>Log ind som ${senderName}s betroede hjælper</li>
            <li>Vælg at se Kode-mappen</li>
            <li>Indtast denne adgangskode</li>
          </ol>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            Denne email blev sendt til dig fordi ${senderName} har valgt dig som deres betroede kontaktperson på MitTek.
          </p>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", { emailResponse });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Adgangskode sendt til din kontaktperson" 
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