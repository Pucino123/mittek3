import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PageViewRequest {
  path: string;
  referrer?: string;
  user_agent?: string;
  session_id?: string;
  user_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse and validate request body
    let body: PageViewRequest;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Validate and sanitize path (required field)
    if (typeof body.path !== 'string' || body.path.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Path is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const MAX_PATH_LENGTH = 500;
    const MAX_REFERRER_LENGTH = 2000;
    const MAX_USER_AGENT_LENGTH = 500;
    const MAX_SESSION_ID_LENGTH = 100;

    // Sanitize all inputs
    let sanitizedPath = body.path.trim().slice(0, MAX_PATH_LENGTH);
    if (!sanitizedPath.startsWith('/')) {
      sanitizedPath = '/' + sanitizedPath;
    }
    // Remove potentially dangerous characters
    sanitizedPath = sanitizedPath.replace(/[<>'"]/g, '');

    const sanitizedReferrer = typeof body.referrer === 'string' 
      ? body.referrer.trim().slice(0, MAX_REFERRER_LENGTH).replace(/[<>'"]/g, '')
      : null;

    const sanitizedUserAgent = typeof body.user_agent === 'string'
      ? body.user_agent.trim().slice(0, MAX_USER_AGENT_LENGTH)
      : null;

    const sanitizedSessionId = typeof body.session_id === 'string'
      ? body.session_id.trim().slice(0, MAX_SESSION_ID_LENGTH).replace(/[^a-zA-Z0-9-_]/g, '')
      : null;

    // Validate user_id if provided (must be valid UUID)
    let sanitizedUserId: string | null = null;
    if (body.user_id) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof body.user_id === 'string' && uuidRegex.test(body.user_id.trim())) {
        sanitizedUserId = body.user_id.trim().toLowerCase();
      }
    }
    
    // Get client IP from headers
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || req.headers.get('cf-connecting-ip')
      || req.headers.get('x-real-ip')
      || 'unknown';

    // Get geo data from IP using a free geo-IP service
    let country: string | null = null;
    let city: string | null = null;

    if (clientIP && clientIP !== 'unknown' && clientIP !== '127.0.0.1') {
      try {
        // Using ip-api.com (free, no API key needed, 45 requests/min limit)
        const geoResponse = await fetch(`http://ip-api.com/json/${clientIP}?fields=status,country,city`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === 'success') {
            country = geoData.country || null;
            city = geoData.city || null;
          }
        }
      } catch (geoError) {
        console.log('Geo lookup failed:', geoError);
        // Continue without geo data
      }
    }

    // Insert page view with sanitized and validated data
    const { error } = await supabaseClient
      .from('page_views')
      .insert({
        path: sanitizedPath,
        referrer: sanitizedReferrer,
        user_agent: sanitizedUserAgent,
        session_id: sanitizedSessionId,
        user_id: sanitizedUserId,
        country,
        city,
      });

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true, country, city }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    console.error('Error tracking page view:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
