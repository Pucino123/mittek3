import { useState, useEffect } from 'react';
import { X, Sparkles, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface AIChatTooltipProps {
  isSubscriptionActive: boolean;
}

export const AIChatTooltip = ({ isSubscriptionActive }: AIChatTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if tooltip was dismissed before
    const dismissed = localStorage.getItem('ai_chat_tooltip_dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // On mobile, don't show tooltip automatically - user must click chat button
    if (isMobile) {
      setIsDismissed(true);
      return;
    }

    // Show tooltip after a short delay (desktop only)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isMobile]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('ai_chat_tooltip_dismissed', 'true');
  };

  if (!isSubscriptionActive || isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-28 right-4 sm:right-6 z-40 animate-fade-in hidden sm:block">
      {/* Tooltip card */}
      <div className="bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-2xl max-w-[280px] relative">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-muted hover:bg-muted-foreground/20"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">Din Digitale Hjælper 💬</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Spørg om alt! F.eks. "Hvordan tager jeg et screenshot?" eller "Min WiFi virker ikke"
            </p>
          </div>
        </div>

        {/* Example questions */}
        <div className="space-y-2 mb-3">
          <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            💬 "Hvorfor løber mit batteri hurtigt tør?"
          </div>
          <div className="bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground">
            💬 "Hvordan sletter jeg gamle billeder?"
          </div>
        </div>

        {/* Try it text */}
        <p className="text-xs text-center text-primary font-medium">
          Prøv det – det er helt gratis! 👇
        </p>

        {/* Arrow pointing down */}
        <div className="absolute -bottom-4 right-8 flex flex-col items-center">
          <div className={cn(
            "w-0 h-0",
            "border-l-[12px] border-l-transparent",
            "border-r-[12px] border-r-transparent",
            "border-t-[12px] border-t-primary/30"
          )} />
          <ArrowDown className="h-6 w-6 text-primary animate-bounce mt-1" />
        </div>
      </div>
    </div>
  );
};
