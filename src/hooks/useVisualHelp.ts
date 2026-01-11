import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Import all fallback images
import guideBatterySettings from '@/assets/guide-battery-settings.png';
import guideIcloudSettings from '@/assets/guide-icloud-settings.png';
import guideFindMy from '@/assets/guide-find-my.png';
import guideTwoFactor from '@/assets/guide-two-factor.png';
import guideSafariPopups from '@/assets/guide-safari-popups.png';
import guideHardReset from '@/assets/guide-hard-reset.png';

// Hardcoded fallback images for when database is unavailable
export const fallbackVisualHelp: Record<string, Record<string, VisualHelpData>> = {
  'battery-doctor': {
    'brightness': {
      image_url: guideBatterySettings,
      gif_url: null,
      video_url: null,
      description: 'Kontrolcenter med lysstyrke-slider',
    },
    'old-phone': {
      image_url: guideBatterySettings,
      gif_url: null,
      video_url: null,
      description: 'Batteriindstillinger på iPhone',
    },
    'low-power-mode': {
      image_url: guideBatterySettings,
      gif_url: null,
      video_url: null,
      description: 'Batteriindstillinger med strømbesparelse',
    },
  },
  'medical-id': {
    'step-1': {
      image_url: guideFindMy,
      gif_url: null,
      video_url: null,
      description: 'Find Sundhed-appen på startskærmen',
    },
    'step-2': {
      image_url: guideIcloudSettings,
      gif_url: null,
      video_url: null,
      description: 'Profilbillede i øverste højre hjørne',
    },
    'step-7': {
      image_url: guideTwoFactor,
      gif_url: null,
      video_url: null,
      description: 'Vis på låst skærm indstilling',
    },
  },
  'guest-wifi': {
    'step-1': {
      image_url: guideIcloudSettings,
      gif_url: null,
      video_url: null,
      description: 'Wi-Fi ikon øverst på skærmen',
    },
    'step-3': {
      image_url: guideSafariPopups,
      gif_url: null,
      video_url: null,
      description: 'Del adgangskode pop-up',
    },
  },
  'hardware': {
    'hard-reset': {
      image_url: guideHardReset,
      gif_url: null,
      video_url: null,
      description: 'Hard reset knap-kombination',
    },
  },
};

export interface VisualHelpData {
  image_url: string | null;
  gif_url: string | null;
  video_url: string | null;
  description: string | null;
}

interface UseVisualHelpOptions {
  featureKey: string;
  stepKey: string;
  enabled?: boolean;
}

export function useVisualHelp({ featureKey, stepKey, enabled = true }: UseVisualHelpOptions) {
  const [data, setData] = useState<VisualHelpData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !featureKey || !stepKey) {
      // Return fallback immediately if not fetching
      const fallback = fallbackVisualHelp[featureKey]?.[stepKey] || null;
      setData(fallback);
      return;
    }

    const fetchVisualHelp = async () => {
      setIsLoading(true);
      try {
        const { data: dbData, error } = await supabase
          .from('visual_help_images')
          .select('image_url, gif_url, video_url, description')
          .eq('feature_key', featureKey)
          .eq('step_key', stepKey)
          .maybeSingle();

        if (error) throw error;

        // If database has data with actual content, use it
        if (dbData && (dbData.image_url || dbData.gif_url || dbData.video_url)) {
          setData(dbData);
        } else {
          // Fall back to hardcoded images
          const fallback = fallbackVisualHelp[featureKey]?.[stepKey] || null;
          setData(fallback);
        }
      } catch (err) {
        console.warn('Failed to fetch visual help, using fallback:', err);
        // On error, use fallback
        const fallback = fallbackVisualHelp[featureKey]?.[stepKey] || null;
        setData(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisualHelp();
  }, [featureKey, stepKey, enabled]);

  return { data, isLoading };
}

// Utility to get fallback without hook (for static usage)
export function getFallbackVisualHelp(featureKey: string, stepKey: string): VisualHelpData | null {
  return fallbackVisualHelp[featureKey]?.[stepKey] || null;
}
