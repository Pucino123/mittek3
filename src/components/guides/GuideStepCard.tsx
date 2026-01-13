import { Lightbulb, AlertTriangle, BookOpen } from 'lucide-react';
import { parseTextWithIcons } from '@/utils/inlineIcons';

interface GuideStepCardProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  instruction: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  animatedGifUrl?: string | null;
  tipText?: string | null;
  warningText?: string | null;
}

// Helper to detect YouTube URLs and extract video ID
const getYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// Video player component - optimized with lazy loading
const VideoPlayer = ({ url }: { url: string }) => {
  const youtubeId = getYouTubeVideoId(url);
  
  if (youtubeId) {
    return (
      <div className="aspect-video w-full">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="Video guide"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="w-full h-full"
        />
      </div>
    );
  }
  
  return (
    <div className="aspect-video w-full">
      <video 
        src={url} 
        controls 
        className="w-full h-full object-contain bg-muted"
        playsInline
        preload="metadata"
      >
        Din browser understøtter ikke video.
      </video>
    </div>
  );
};

export const GuideStepCard = ({
  stepNumber,
  totalSteps,
  title,
  instruction,
  imageUrl,
  videoUrl,
  animatedGifUrl,
  tipText,
  warningText,
}: GuideStepCardProps) => {
  // Determine which media to show: GIF takes priority over static image
  const displayMedia = animatedGifUrl || imageUrl;
  const isGif = !!animatedGifUrl;

  return (
    <div className="bg-card shadow-lg rounded-2xl border border-border overflow-hidden mb-8">
      {/* Image/Video/GIF Area - optimized for CLS prevention */}
      {videoUrl ? (
        <div className="w-full bg-muted">
          <VideoPlayer url={videoUrl} />
        </div>
      ) : displayMedia ? (
        <div className="aspect-video w-full bg-muted flex items-center justify-center relative">
          <img 
            src={displayMedia} 
            alt={title} 
            className="w-full h-full object-cover"
            loading="lazy"
            width={640}
            height={360}
            decoding="async"
          />
          {isGif && (
            <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              GIF
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-video w-full bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Billede kommer snart</p>
          </div>
        </div>
      )}

      {/* Text Area */}
      <div className="p-6 space-y-4">
        {/* Header with step number */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-primary uppercase tracking-wider">
            Trin {stepNumber} af {totalSteps}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-foreground">{parseTextWithIcons(title)}</h2>
        <p className="text-lg text-muted-foreground leading-relaxed">{parseTextWithIcons(instruction)}</p>

        {/* Tip Box */}
        {tipText && (
          <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm mb-1">Godt tip</p>
              <p className="text-amber-700 dark:text-amber-300 text-sm leading-relaxed">{parseTextWithIcons(tipText)}</p>
            </div>
          </div>
        )}

        {/* Warning Box */}
        {warningText && (
          <div className="flex gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-rose-800 dark:text-rose-200 text-sm mb-1">Vigtigt at vide</p>
              <p className="text-rose-700 dark:text-rose-300 text-sm leading-relaxed">{parseTextWithIcons(warningText)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};