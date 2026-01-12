import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Lock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  minPlan: 'basic' | 'plus' | 'pro';
  hasAccess: boolean;
  isEditMode: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
}

export const DashboardCard = forwardRef<HTMLDivElement, DashboardCardProps>(
  ({ 
    id,
    title, 
    description, 
    icon: Icon, 
    href, 
    color, 
    minPlan,
    hasAccess, 
    isEditMode,
    onRemove,
    isDragging,
    style,
    ...props 
  }, ref) => {
    const cardContent = (
      <>
        {/* Remove button in edit mode - perfect circle */}
        {isEditMode && onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -left-2 z-10 flex items-center justify-center bg-muted text-muted-foreground rounded-full shadow-md border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
            style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', flexShrink: 0 }}
            aria-label={`Fjern ${title}`}
          >
            <X className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
          </button>
        )}

        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center shrink-0 relative`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
            {/* Lock overlay for locked cards */}
            {!hasAccess && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center shadow-sm">
                <Lock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
              </div>
            )}
          </div>
          {!hasAccess && (
            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-primary text-primary-foreground rounded-full">
              Plus
            </span>
          )}
        </div>
        
        <h3 className="text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1 leading-tight line-clamp-1">{title}</h3>
        <p className="text-muted-foreground text-[11px] sm:text-sm line-clamp-2">{description}</p>
        
        {/* Spacer to push action to bottom */}
        <div className="flex-1" />
        
        <div className="mt-2 sm:mt-3 flex items-center text-primary font-medium text-xs sm:text-sm">
          {hasAccess ? (
            <>Åbn</>
          ) : (
            <>
              <Lock className="mr-1 h-3 w-3" />
              Kræver Plus
            </>
          )}
          <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
        </div>
      </>
    );

    // In edit mode, render as div (not clickable for navigation)
    if (isEditMode) {
      return (
        <div
          ref={ref}
          style={style}
          className={cn(
            "card-interactive p-3 sm:p-5 flex flex-col relative h-[160px] sm:h-[180px] md:h-[190px]",
            !hasAccess && "opacity-60 grayscale-[20%]",
            isEditMode && "animate-wiggle cursor-grab",
            isDragging && "opacity-50 scale-105 shadow-xl"
          )}
          {...props}
        >
          {cardContent}
        </div>
      );
    }

    return (
      <Link
        to={hasAccess ? href : '/settings/subscription'}
        className={cn(
          "card-interactive p-3 sm:p-5 flex flex-col h-[160px] sm:h-[180px] md:h-[190px]",
          !hasAccess && "opacity-60 grayscale-[20%]"
        )}
      >
        {cardContent}
      </Link>
    );
  }
);

DashboardCard.displayName = 'DashboardCard';