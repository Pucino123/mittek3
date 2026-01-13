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

    const body: PageViewRequest = await req.json();
    
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

    // Insert page view with geo data
    const { error } = await supabaseClient
      .from('page_views')
      .insert({
        path: body.path,
        referrer: body.referrer || null,
        user_agent: body.user_agent || null,
        session_id: body.session_id || null,
        user_id: body.user_id || null,
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
