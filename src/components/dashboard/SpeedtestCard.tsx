import { forwardRef, useState, useEffect, useRef } from 'react';
import { Wifi, ExternalLink, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SpeedtestCardProps {
  isEditMode?: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

export const SpeedtestCard = forwardRef<HTMLDivElement, SpeedtestCardProps>(
  ({ isEditMode, onRemove, isDragging, style, onExitEditMode }, ref) => {
    const [showIframe, setShowIframe] = useState(false);
    const [iframeError, setIframeError] = useState(false);

    // Track when edit mode started to prevent immediate exit
    const editModeStartRef = useRef<number>(0);

    useEffect(() => {
      if (isEditMode) {
        editModeStartRef.current = Date.now();
      }
    }, [isEditMode]);

    const handleCardClick = (e: React.MouseEvent) => {
      if (isEditMode) {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('iframe')) {
          e.preventDefault();
          e.stopPropagation();
          if (Date.now() - editModeStartRef.current < 400) return;
          onExitEditMode?.();
        }
      }
    };

    const handleOpenExternal = () => {
      window.open('https://fast.com', '_blank', 'noopener,noreferrer');
    };

    return (
      <div
        ref={ref}
        style={style}
        onClick={handleCardClick}
        className={cn(
          "card-interactive p-3 sm:p-4 flex flex-col relative h-full min-h-[180px] sm:min-h-[200px] md:min-h-[210px]",
          isEditMode && "animate-wiggle cursor-grab",
          isDragging && "opacity-50"
        )}
      >
        {/* Remove button in edit mode */}
        {isEditMode && onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -left-2 z-10 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <Wifi className="h-4 w-4 text-info" />
            </div>
            <h3 className="font-semibold text-sm">Hastighedstest</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenExternal();
            }}
          >
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {showIframe && !iframeError ? (
            <iframe
              src="https://fast.com"
              className="w-full h-[120px] rounded-lg border-0"
              title="Internet Speed Test"
              sandbox="allow-scripts allow-same-origin"
              onError={() => setIframeError(true)}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-info/10 flex items-center justify-center">
                <Wifi className="h-8 w-8 text-info" />
              </div>
              <p className="text-xs text-muted-foreground">
                Test din internetforbindelse
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowIframe(true);
                  }}
                >
                  <Play className="h-3 w-3" />
                  Start test
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenExternal();
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                  Åbn
                </Button>
              </div>
            </div>
          )}
        </div>

        {showIframe && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            Drevet af Fast.com (Netflix)
          </p>
        )}
      </div>
    );
  }
);

SpeedtestCard.displayName = 'SpeedtestCard';
