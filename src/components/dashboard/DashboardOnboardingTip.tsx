import { useState, useEffect, useRef } from 'react';
import { X, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'mittek_dashboard_intro_seen';

interface DashboardOnboardingTipProps {
  targetRef?: React.RefObject<HTMLElement>;
}

export function DashboardOnboardingTip({ targetRef }: DashboardOnboardingTipProps) {
  const [showTip, setShowTip] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(STORAGE_KEY);
    if (hasSeen) return;

    // If no targetRef, use a fallback timer
    if (!targetRef?.current) {
      const timer = setTimeout(() => {
        if (!hasTriggered.current) {
          hasTriggered.current = true;
          setShowTip(true);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Use IntersectionObserver to detect when tools section is visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggered.current) {
            hasTriggered.current = true;
            // Small delay for smoother UX
            setTimeout(() => setShowTip(true), 500);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 } // Trigger when 30% visible
    );

    observer.observe(targetRef.current);

    return () => observer.disconnect();
  }, [targetRef]);

  const dismissTip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShowTip(false);
  };

  if (!showTip) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in max-w-sm w-full mx-4">
      <div className="bg-primary text-primary-foreground rounded-2xl p-4 shadow-xl relative">
        <button
          onClick={dismissTip}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary-foreground/20 transition-colors"
          aria-label="Luk tip"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
            <Hand className="h-5 w-5" />
          </div>
          <div className="flex-1 pr-4">
            <p className="font-medium text-sm mb-1">Tip: Tilpas dit dashboard</p>
            <p className="text-xs opacity-90">
              Hold fingeren nede på en knap for at flytte eller fjerne den.
            </p>
          </div>
        </div>
        
        <Button
          onClick={dismissTip}
          variant="secondary"
          size="sm"
          className="w-full mt-3 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
        >
          Forstået
        </Button>
      </div>
    </div>
  );
}
