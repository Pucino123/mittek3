import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Sun, AppWindow, Clock, RotateCcw, MapPin, BellOff, BatteryWarning, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Import visual guide images
import guideBatterySettings from '@/assets/guide-battery-settings.png';
import guideIcloudSettings from '@/assets/guide-icloud-settings.png';

type HelpType = 'brightness' | 'close-apps' | 'old-phone' | 'background-refresh' | 'location-services' | 'low-power-mode' | 'notifications' | null;

interface BatteryHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  helpType: HelpType;
}

interface VisualHelpData {
  image_url: string | null;
  gif_url: string | null;
  video_url: string | null;
  description: string | null;
}

const helpContent = {
  brightness: {
    icon: Sun,
    title: 'Find lysstyrken',
    visualImage: guideBatterySettings,
    visualAlt: 'Kontrolcenter med lysstyrke-slider',
    steps: [
      {
        instruction: 'Træk ned fra det øverste højre hjørne af skærmen',
        detail: 'Dette åbner Kontrolcenter'
      },
      {
        instruction: 'Find sol-ikonet (lysstyrke)',
        detail: 'Det er en lodret bjælke med et sol-symbol'
      },
      {
        instruction: 'Tjek om bjælken er helt i toppen',
        detail: 'Hvis ja, er din lysstyrke på max - og bruger meget strøm'
      }
    ],
    tip: '💡 Tip: Slå "Automatisk lysstyrke" til under Indstillinger → Skærm & Lysstyrke'
  },
  'close-apps': {
    icon: AppWindow,
    title: 'Se dine åbne apps',
    steps: [
      {
        instruction: 'Stryg op fra bunden og hold inde',
        detail: 'På ældre iPhones: Dobbeltklik på Hjem-knappen'
      },
      {
        instruction: 'Du ser nu alle dine åbne apps',
        detail: 'De vises som små kort du kan swipe igennem'
      },
      {
        instruction: 'Lad dem være!',
        detail: 'iOS håndterer apps automatisk. At lukke dem bruger faktisk MERE strøm'
      }
    ],
    tip: '💡 Tip: Luk kun apps hvis de er frosset eller ikke virker'
  },
  'old-phone': {
    icon: Clock,
    title: 'Tjek batterisundheden',
    visualImage: guideBatterySettings,
    visualAlt: 'Batteriindstillinger på iPhone',
    steps: [
      {
        instruction: 'Åbn Indstillinger (det grå tandhjul)',
        detail: 'Find det på din startskærm'
      },
      {
        instruction: 'Scroll ned og tryk på "Batteri"',
        detail: 'Her kan du se batteriforbrug'
      },
      {
        instruction: 'Tryk på "Batterisundhed og opladning"',
        detail: 'Se din "Maksimal kapacitet"'
      }
    ],
    tip: '💡 Under 80% kapacitet? Batteriet er slidt og bør udskiftes'
  },
  'background-refresh': {
    icon: RotateCcw,
    title: 'Tjek baggrundsaktivitet',
    steps: [
      {
        instruction: 'Åbn Indstillinger',
        detail: 'Find det grå tandhjul på din startskærm'
      },
      {
        instruction: 'Tryk på "Generelt"',
        detail: 'Det er i den øverste sektion'
      },
      {
        instruction: 'Find "Opdater i baggrunden"',
        detail: 'Her ser du alle apps der opdaterer sig selv'
      },
      {
        instruction: 'Slå FRA for apps du ikke bruger dagligt',
        detail: 'Spil, shopping-apps og sociale medier behøver det sjældent'
      }
    ],
    tip: '💡 Tip: Behold det slået TIL for mail, kalender og beskeder'
  },
  'location-services': {
    icon: MapPin,
    title: 'Tjek placeringstjenester',
    steps: [
      {
        instruction: 'Åbn Indstillinger',
        detail: 'Find det grå tandhjul'
      },
      {
        instruction: 'Tryk på "Anonymitet & Sikkerhed"',
        detail: 'Det er i den øverste del af listen'
      },
      {
        instruction: 'Tryk på "Lokalitetstjenester"',
        detail: 'Her ser du alle apps der bruger din placering'
      },
      {
        instruction: 'Tjek hver app',
        detail: 'Apps med lilla pil har brugt din placering for nylig'
      },
      {
        instruction: 'Skift til "Kun ved brug" eller "Aldrig"',
        detail: 'De fleste apps behøver ikke "Altid"'
      }
    ],
    tip: '💡 Tip: Kort/GPS-apps kan have "Altid", men sociale medier behøver det sjældent'
  },
  'low-power-mode': {
    icon: BatteryWarning,
    title: 'Aktivér strømbesparelse',
    visualImage: guideBatterySettings,
    visualAlt: 'Batteriindstillinger med strømbesparelse',
    steps: [
      {
        instruction: 'Træk ned fra øverste højre hjørne',
        detail: 'Dette åbner Kontrolcenter'
      },
      {
        instruction: 'Find batteri-ikonet',
        detail: 'Det ligner et batteri'
      },
      {
        instruction: 'Tryk på det for at aktivere',
        detail: 'Ikonet bliver gult når det er aktivt'
      }
    ],
    tip: '💡 Tip: Strømbesparelse kan også aktiveres automatisk under Indstillinger → Batteri'
  },
  'notifications': {
    icon: BellOff,
    title: 'Begræns notifikationer',
    steps: [
      {
        instruction: 'Åbn Indstillinger',
        detail: 'Find det grå tandhjul'
      },
      {
        instruction: 'Tryk på "Notifikationer"',
        detail: 'Her ser du alle apps der kan sende beskeder'
      },
      {
        instruction: 'Gennemgå hver app',
        detail: 'Spørg dig selv: Behøver jeg at vide dette med det samme?'
      },
      {
        instruction: 'Slå "Tillad notifikationer" FRA',
        detail: 'For apps du ikke behøver høre fra konstant'
      }
    ],
    tip: '💡 Tip: Behold notifikationer for telefon, beskeder og mail - slå fra for spil og apps du sjældent bruger'
  }
};

// Video Player Component
function VideoPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = e.currentTarget.parentElement?.querySelector('video');
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = e.currentTarget.parentElement?.querySelector('video');
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-muted/30">
      <video 
        src={src} 
        className="w-full h-auto max-h-64 object-contain"
        muted={isMuted}
        playsInline
        loop
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      <div className="absolute bottom-2 left-2 flex gap-2">
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={handleMuteToggle}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export function BatteryHelpModal({ open, onOpenChange, helpType }: BatteryHelpModalProps) {
  const [dbVisualHelp, setDbVisualHelp] = useState<VisualHelpData | null>(null);

  // Fetch visual help from database
  useEffect(() => {
    if (open && helpType) {
      const fetchVisualHelp = async () => {
        const { data } = await supabase
          .from('visual_help_images')
          .select('image_url, gif_url, video_url, description')
          .eq('feature_key', 'battery-doctor')
          .eq('step_key', helpType)
          .maybeSingle();
        
        if (data) {
          setDbVisualHelp(data);
        }
      };
      fetchVisualHelp();
    }
  }, [open, helpType]);

  if (!helpType) return null;
  
  const content = helpContent[helpType];
  const Icon = content.icon;

  // Determine which visual to show (prioritize database content)
  const videoUrl = dbVisualHelp?.video_url;
  const gifUrl = dbVisualHelp?.gif_url;
  const imageUrl = dbVisualHelp?.image_url || ('visualImage' in content ? content.visualImage : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {content.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Video (highest priority) */}
          {videoUrl && (
            <VideoPlayer src={videoUrl} />
          )}
          
          {/* GIF (second priority) */}
          {!videoUrl && gifUrl && (
            <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
              <img 
                src={gifUrl} 
                alt={content.title}
                className="w-full h-auto object-contain max-h-64"
              />
            </div>
          )}
          
          {/* Static image (fallback) */}
          {!videoUrl && !gifUrl && imageUrl && (
            <div className="rounded-xl overflow-hidden border border-border bg-muted/30">
              <img 
                src={imageUrl} 
                alt={'visualAlt' in content ? content.visualAlt : content.title}
                className="w-full h-auto object-contain max-h-48"
              />
            </div>
          )}
          
          {content.steps.map((step, index) => (
            <div key={index} className="card-elevated p-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{step.instruction}</p>
                  <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
                </div>
              </div>
            </div>
          ))}
          
          <div className="p-4 bg-info/10 rounded-xl border border-info/20">
            <p className="text-sm">{content.tip}</p>
          </div>
        </div>

        <Button variant="hero" onClick={() => onOpenChange(false)} className="w-full">
          Forstået
        </Button>
      </DialogContent>
    </Dialog>
  );
}

interface ShowMeWhereButtonProps {
  onClick: () => void;
}

export function ShowMeWhereButton({ onClick }: ShowMeWhereButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-info hover:text-info hover:bg-info/10 gap-1.5"
    >
      <Eye className="h-4 w-4" />
      Vis mig hvor
    </Button>
  );
}
