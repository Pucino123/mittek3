import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Map of guide slugs to their cover image filenames
    const slugToFilename: Record<string, string> = {
      'download-apps': 'guide-download-apps.jpg',
      'delete-apps': 'guide-delete-apps.jpg',
      'update-apps': 'guide-update-apps.jpg',
      'organize-apps': 'guide-organize-apps.jpg',
      'extend-battery-life': 'guide-extend-battery.jpg',
      'battery-health-tips': 'guide-battery-health.jpg',
      'cleanup-messages': 'guide-cleanup-messages.jpg',
      'imessage-setup': 'guide-imessage-setup.jpg',
      'block-spam-messages': 'guide-block-spam.jpg',
      'update-ios': 'guide-update-ios.jpg',
      'stop-popups': 'guide-stop-popups.jpg',
      'bigger-text': 'guide-bigger-text.jpg',
      'icloud-backup': 'guide-icloud-backup.jpg',
      'icloud-photos': 'guide-icloud-photos.jpg',
      'icloud-cleanup': 'guide-icloud-cleanup.jpg',
      'block-unknown-calls': 'guide-block-calls.jpg',
      'enable-2fa': 'guide-2fa.jpg',
      'find-my-iphone': 'guide-find-my.jpg',
      'recognize-scam-messages': 'guide-scam-messages.jpg',
      'hard-reset': 'guide-hard-reset.jpg',
    };

    // Get all published guides
    const { data: guides, error: guidesError } = await supabase
      .from('guides')
      .select('id, slug, cover_image_url')
      .eq('is_published', true);

    if (guidesError) throw guidesError;

    const results: { slug: string; status: string; url?: string }[] = [];

    for (const guide of guides || []) {
      if (!guide.slug || !slugToFilename[guide.slug]) {
        results.push({ slug: guide.slug || 'unknown', status: 'skipped - no matching cover' });
        continue;
      }

      // Check if already has a storage URL
      if (guide.cover_image_url && guide.cover_image_url.includes('supabase')) {
        results.push({ slug: guide.slug, status: 'already uploaded', url: guide.cover_image_url });
        continue;
      }

      const filename = slugToFilename[guide.slug];
      const storagePath = `covers/${filename}`;

      // Construct public URL
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/guide-images/${storagePath}`;

      // Update guide with storage URL
      const { error: updateError } = await supabase
        .from('guides')
        .update({ cover_image_url: publicUrl })
        .eq('id', guide.id);

      if (updateError) {
        results.push({ slug: guide.slug, status: `error: ${updateError.message}` });
      } else {
        results.push({ slug: guide.slug, status: 'updated', url: publicUrl });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
