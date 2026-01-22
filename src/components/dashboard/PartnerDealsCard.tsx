import { forwardRef } from 'react';
import { Handshake, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PartnerDealsCardProps {
  isEditMode: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

export const PartnerDealsCard = forwardRef<HTMLDivElement, PartnerDealsCardProps>(
  ({ isEditMode, onRemove, isDragging, style, onExitEditMode }, ref) => {
    
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isEditMode) {
        onExitEditMode?.();
        return;
      }
      
      toast.info('Kommer snart!', {
        description: 'Vi arbejder på at finde de bedste tilbud til dig.',
      });
    };

    return (
      <div
        ref={ref}
        style={style}
        onClick={handleClick}
        className={cn(
          "card-interactive p-3 sm:p-5 flex flex-col relative h-full min-h-[180px] sm:min-h-[200px] md:min-h-[210px]",
          "grayscale opacity-60 cursor-not-allowed",
          isEditMode && "animate-wiggle cursor-grab grayscale-0 opacity-100",
          isDragging && "opacity-50 scale-105 shadow-xl"
        )}
      >
        {/* Coming Soon Badge */}
        <div className="absolute -top-2 left-4 z-10">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium shadow-sm border border-border">
            Kommer snart
          </span>
        </div>

        {/* Remove button in edit mode */}
        {isEditMode && onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -left-2 z-20 flex items-center justify-center bg-muted text-muted-foreground rounded-full shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
            style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', flexShrink: 0 }}
            aria-label="Fjern Vores samarbejdspartnere"
          >
            <X className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
          </button>
        )}

        <div className="flex items-start justify-between mb-2 sm:mb-3 mt-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 relative">
            <Handshake className="h-5 w-5 sm:h-6 sm:w-6" />
            {/* Lock overlay */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
              <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
            </div>
          </div>
          <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-primary text-primary-foreground rounded-full">
            Plus
          </span>
        </div>
        
        <h3 className="text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1 leading-tight line-clamp-1">
          Vores samarbejdspartnere
        </h3>
        <p className="text-muted-foreground text-[13px] sm:text-sm line-clamp-2">
          Få rabat hos reparatører
        </p>
        
        {/* Spacer to push action to bottom */}
        <div className="flex-1" />
        
        <div className="mt-2 sm:mt-3 flex items-center text-muted-foreground font-medium text-xs sm:text-sm">
          <Lock className="mr-1 h-3 w-3" />
          Kommer snart
        </div>
      </div>
    );
  }
);

PartnerDealsCard.displayName = 'PartnerDealsCard';
