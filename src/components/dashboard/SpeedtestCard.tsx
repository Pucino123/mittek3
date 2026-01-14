import { forwardRef, useState, useEffect, useRef } from 'react';
import { Wifi, ExternalLink, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ToolDetailModal } from './ToolDetailModal';

interface SpeedtestCardProps {
  isEditMode?: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

export const SpeedtestCard = forwardRef<HTMLDivElement, SpeedtestCardProps>(
  ({ isEditMode, onRemove, isDragging, style, onExitEditMode }, ref) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showIframe, setShowIframe] = useState(false);

    // Track when edit mode started to prevent immediate exit
    const editModeStartRef = useRef<number>(0);

    useEffect(() => {
      if (isEditMode) {
        editModeStartRef.current = Date.now();
      }
    }, [isEditMode]);

    // Auto-start test when modal opens
    useEffect(() => {
      if (isModalOpen) {
        setShowIframe(true);
      }
    }, [isModalOpen]);

    const handleCardClick = (e: React.MouseEvent) => {
      if (isEditMode) {
        const target = e.target as HTMLElement;
        if (!target.closest('button')) {
          e.preventDefault();
          e.stopPropagation();
          if (Date.now() - editModeStartRef.current < 400) return;
          onExitEditMode?.();
        }
      } else {
        setIsModalOpen(true);
      }
    };

    const handleOpenExternal = () => {
      window.open('https://fast.com', '_blank', 'noopener,noreferrer');
    };

    return (
      <>
        {/* Dashboard Card (Summary View) */}
        <div
          ref={ref}
          style={style}
          onClick={handleCardClick}
          className={cn(
            "card-interactive p-3 sm:p-4 flex flex-col relative h-full min-h-[180px] sm:min-h-[200px] md:min-h-[210px] cursor-pointer",
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
              className="absolute -top-2 -left-2 z-10 flex items-center justify-center bg-muted text-muted-foreground rounded-full shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
              style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', flexShrink: 0 }}
              aria-label="Fjern Hastighedstest"
            >
              <X className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
            </button>
          )}

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
              <Wifi className="h-5 w-5 text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Hastighedstest</h3>
              <p className="text-xs text-muted-foreground">Test din forbindelse</p>
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-20 h-20 rounded-full bg-info/10 flex items-center justify-center mb-2">
              <Play className="h-8 w-8 text-info" />
            </div>
            <p className="text-sm font-medium">Tjek hastighed</p>
          </div>

          {/* Action hint */}
          <div className="text-center mt-2">
            <span className="text-xs text-muted-foreground">Tryk for at starte →</span>
          </div>
        </div>

        {/* Detail Modal */}
        <ToolDetailModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title="Hastighedstest"
          icon={Wifi}
          iconColor="text-info"
          className="sm:max-w-xl"
        >
          {/* Speedtest iframe */}
          <div className="space-y-4">
            {showIframe ? (
              <div className="rounded-lg overflow-hidden border bg-white">
                <iframe
                  src="https://fast.com"
                  className="w-full h-[350px] border-0"
                  title="Internet Speed Test"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto rounded-full bg-info/10 flex items-center justify-center mb-4">
                  <Wifi className="h-12 w-12 text-info" />
                </div>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => setShowIframe(true)}
                >
                  <Play className="h-5 w-5" />
                  Start hastighedstest
                </Button>
              </div>
            )}


            <p className="text-xs text-muted-foreground text-center">
              Drevet af Fast.com (Netflix). Måler din reelle download-hastighed.
            </p>
          </div>
        </ToolDetailModal>
      </>
    );
  }
);

SpeedtestCard.displayName = 'SpeedtestCard';
