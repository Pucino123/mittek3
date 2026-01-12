import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DeviceType = "iphone" | "ipad" | "mac";

type IncomingStep = {
  step_number: number;
  title: string;
  instruction: string;
  instructionByDevice?: Partial<Record<DeviceType, string>>;
  image_url?: string;
  tip_text?: string;
  warning_text?: string;
  video_url?: string | null;
  animated_gif_url?: string | null;
};

type IncomingGuide = {
  id: string; // Required - use as unique slug
  title: string;
  description?: string;
  category?: string;
  steps?: IncomingStep[];
  stepsByDevice?: Partial<Record<DeviceType, IncomingStep[]>>;
};

type StepInsertRow = {
  guide_id: string;
  step_number: number;
  title: string;
  instruction: string;
  device_type?: string[] | null;
  image_url?: string | null;
  video_url?: string | null;
  animated_gif_url?: string | null;
  tip_text?: string | null;
  warning_text?: string | null;
};

// Map hardcoded guide ID to existing DB guide for deduplication
type GuideMapping = {
  hardcoded_id: string;
  db_id: string;
  title: string;
};

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

const extractStepsForGuide = (guide: IncomingGuide): Omit<StepInsertRow, "guide_id">[] => {
  const out: Omit<StepInsertRow, "guide_id">[] = [];

  const pushStep = (step: IncomingStep, device?: DeviceType) => {
    const instruction = device && step.instructionByDevice?.[device]
      ? step.instructionByDevice[device]!
      : step.instruction;

    out.push({
      step_number: step.step_number,
      title: step.title,
      instruction,
      device_type: device ? [device] : null,
      image_url: step.image_url ?? null,
      video_url: step.video_url ?? null,
      animated_gif_url: step.animated_gif_url ?? null,
      tip_text: step.tip_text ?? null,
      warning_text: step.warning_text ?? null,
    });
  };

  if (Array.isArray(guide.steps) && guide.steps.length > 0) {
    for (const s of guide.steps) {
      if (!isRecord(s)) continue;
      pushStep(s as IncomingStep);
    }
    return out;
  }

  if (guide.stepsByDevice && isRecord(guide.stepsByDevice)) {
    const entries = Object.entries(guide.stepsByDevice) as [DeviceType, IncomingStep[]][];
    for (const [device, steps] of entries) {
      if (!Array.isArray(steps)) continue;
      for (const s of steps) {
        if (!isRecord(s)) continue;
        pushStep(s as IncomingStep, device);
      }
    }
  }

  return out;
};

const logStep = (step: string, details?: any) => {
  console.log(`[SYNC-GUIDES] ${step}`, details ? JSON.stringify(details) : "");
};

// Normalize title for matching (handles minor differences)
const normalizeTitle = (title: string): string => {
  return title.toLowerCase().trim()
    .replace(/é/g, 'e')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user is admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin status
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting guide sync", { user_id: user.id });

    // Read guides payload from request body
    const contentType = req.headers.get("content-type") || "";
    const bodyJson = contentType.includes("application/json")
      ? await req.json().catch(() => null)
      : null;

    const incomingGuides: IncomingGuide[] =
      bodyJson && isRecord(bodyJson) && Array.isArray((bodyJson as any).guides)
        ? ((bodyJson as any).guides as IncomingGuide[])
        : [];

    // Check for upsert mode (restore standard)
    const isUpsertMode = bodyJson && isRecord(bodyJson) && (bodyJson as any).mode === "upsert";

    if (!incomingGuides.length) {
      return new Response(JSON.stringify({ error: "No guides provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Incoming guides", { count: incomingGuides.length, mode: isUpsertMode ? "upsert" : "insert" });

    // Log all incoming guide IDs and titles for debugging
    logStep("Guide IDs received", { 
      guides: incomingGuides.map(g => ({ id: g.id, title: g.title })) 
    });

    // Check for duplicates in incoming guides
    const seenIds = new Set<string>();
    const duplicateIds: string[] = [];
    for (const g of incomingGuides) {
      if (seenIds.has(g.id)) {
        duplicateIds.push(g.id);
      }
      seenIds.add(g.id);
    }
    if (duplicateIds.length > 0) {
      logStep("WARNING: Duplicate IDs in hardcoded guides", { duplicates: duplicateIds });
    }

    // Fetch ALL existing guides (override default pagination limit)
    const { data: existingGuides, error: countError } = await supabaseAdmin
      .from("guides")
      .select("id, title, sort_order")
      .range(0, 9999);

    if (countError) throw countError;

    const existingCount = existingGuides?.length || 0;
    logStep("Existing guides", { count: existingCount });

    // Build normalized title map for matching
    const existingByNormalizedTitle = new Map<string, { id: string; title: string }>();
    for (const g of existingGuides || []) {
      const normalized = normalizeTitle(g.title);
      existingByNormalizedTitle.set(normalized, { id: g.id, title: g.title });
    }

    let syncedCount = 0;
    let skippedCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];
    const mappings: GuideMapping[] = [];

    // Process each guide
    for (const guideData of incomingGuides) {
      if (!guideData?.id || typeof guideData.id !== "string") {
        logStep("Skipping invalid guide (no id)", { guide: guideData });
        continue;
      }
      if (!guideData?.title || typeof guideData.title !== "string") {
        logStep("Skipping invalid guide (no title)", { guide: guideData });
        continue;
      }

      // Match by normalized title to handle duplicates/variants
      const normalizedTitle = normalizeTitle(guideData.title);
      const existingGuide = existingByNormalizedTitle.get(normalizedTitle);

      if (existingGuide) {
        mappings.push({
          hardcoded_id: guideData.id,
          db_id: existingGuide.id,
          title: guideData.title,
        });

        if (isUpsertMode) {
          // UPSERT MODE: Update existing guide
          logStep("Updating existing guide", { 
            hardcoded_id: guideData.id, 
            db_id: existingGuide.id, 
            title: guideData.title 
          });

          const { error: updateError } = await supabaseAdmin
            .from("guides")
            .update({
              title: guideData.title, // Update to match hardcoded exactly
              description: guideData.description || null,
              category: guideData.category || null,
            })
            .eq("id", existingGuide.id);

          if (updateError) {
            logStep("Error updating guide", { title: guideData.title, error: updateError });
            errors.push(`Update "${guideData.title}": ${updateError.message}`);
            continue;
          }

          // Delete existing steps and reinsert
          await supabaseAdmin
            .from("guide_steps")
            .delete()
            .eq("guide_id", existingGuide.id);

          // Insert new steps
          const steps = extractStepsForGuide(guideData);
          if (steps.length > 0) {
            const stepsToInsert: StepInsertRow[] = steps.map((s) => ({
              guide_id: existingGuide.id,
              step_number: s.step_number,
              title: s.title,
              instruction: s.instruction,
              device_type: s.device_type ?? null,
              image_url: s.image_url ?? null,
              video_url: s.video_url ?? null,
              animated_gif_url: s.animated_gif_url ?? null,
              tip_text: s.tip_text ?? null,
              warning_text: s.warning_text ?? null,
            }));

            const { error: stepsError } = await supabaseAdmin
              .from("guide_steps")
              .insert(stepsToInsert);

            if (stepsError) {
              logStep("Error reinserting steps", { guide_id: existingGuide.id, error: stepsError });
            } else {
              logStep("Reinserted steps", { guide_id: existingGuide.id, count: stepsToInsert.length });
            }
          }

          updatedCount++;
        } else {
          // INSERT MODE: Skip existing
          logStep("Skipping existing guide", { 
            hardcoded_id: guideData.id, 
            matched_title: existingGuide.title 
          });
          skippedCount++;
        }
        continue;
      }

      // INSERT new guide
      const sortOrder = existingCount + syncedCount;

      const { data: newGuide, error: guideError } = await supabaseAdmin
        .from("guides")
        .insert({
          title: guideData.title,
          description: guideData.description || null,
          category: guideData.category || null,
          is_published: true,
          min_plan: "basic",
          sort_order: sortOrder,
        })
        .select()
        .single();

      if (guideError) {
        logStep("Error inserting guide", { title: guideData.title, error: guideError });
        errors.push(`Guide "${guideData.title}": ${guideError.message}`);
        continue;
      }

      logStep("Inserted guide", { db_id: newGuide.id, hardcoded_id: guideData.id, title: guideData.title });
      
      mappings.push({
        hardcoded_id: guideData.id,
        db_id: newGuide.id,
        title: guideData.title,
      });

      // Insert steps (supports both `steps` and `stepsByDevice`)
      const steps = extractStepsForGuide(guideData);
      if (steps.length > 0) {
        const stepsToInsert: StepInsertRow[] = steps.map((s) => ({
          guide_id: newGuide.id,
          step_number: s.step_number,
          title: s.title,
          instruction: s.instruction,
          device_type: s.device_type ?? null,
          image_url: s.image_url ?? null,
          video_url: s.video_url ?? null,
          animated_gif_url: s.animated_gif_url ?? null,
          tip_text: s.tip_text ?? null,
          warning_text: s.warning_text ?? null,
        }));

        const { error: stepsError } = await supabaseAdmin
          .from("guide_steps")
          .insert(stepsToInsert);

        if (stepsError) {
          logStep("Error inserting steps", { guide_id: newGuide.id, error: stepsError });
          errors.push(`Steps for "${guideData.title}": ${stepsError.message}`);
        } else {
          logStep("Inserted steps", { guide_id: newGuide.id, count: stepsToInsert.length });
        }
      }

      syncedCount++;
    }

    logStep("Sync complete", { 
      synced: syncedCount, 
      updated: updatedCount, 
      skipped: skippedCount, 
      errors: errors.length,
      totalIncoming: incomingGuides.length,
      totalMapped: mappings.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synkronisering fuldført`,
        synced: syncedCount,
        updated: updatedCount,
        skipped: skippedCount,
        totalGuides: existingCount + syncedCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
