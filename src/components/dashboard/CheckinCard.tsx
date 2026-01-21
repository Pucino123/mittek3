import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ChevronRight, CheckCircle, X, Smartphone, Tablet, Monitor, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CheckinCardProps {
  isEditMode: boolean;
  onRemove?: () => void;
  isDragging?: boolean;
  style?: React.CSSProperties;
  onExitEditMode?: () => void;
}

interface DeviceConfig {
  label: string;
  Icon: LucideIcon;
}

const deviceConfig: Record<string, DeviceConfig> = {
  iphone: { label: 'iPhone', Icon: Smartphone },
  ipad: { label: 'iPad', Icon: Tablet },
  mac: { label: 'Mac', Icon: Monitor },
};

export function CheckinCard({ 
  isEditMode, 
  onRemove, 
  isDragging, 
  style,
  onExitEditMode 
}: CheckinCardProps) {
  const { user } = useAuth();
  const [hasRecentCheckin, setHasRecentCheckin] = useState<boolean | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [daysUntilNext, setDaysUntilNext] = useState<number>(30);
  const [checkedDevices, setCheckedDevices] = useState<string[]>([]);

  useEffect(() => {
    const checkLastCheckin = async () => {
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: historyData } = await supabase
        .from('check_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      const hasRecent = !!historyData && historyData.length > 0;
      setHasRecentCheckin(hasRecent);
      
      if (hasRecent && historyData[0]) {
        setLastScore(historyData[0].score);
        setCheckedDevices(historyData[0].device_types || []);
        
        const completedDate = new Date(historyData[0].created_at);
        const nextCheckinDate = new Date(completedDate);
        nextCheckinDate.setDate(nextCheckinDate.getDate() + 30);
        const today = new Date();
        const diffTime = nextCheckinDate.getTime() - today.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setDaysUntilNext(diffDays);
      }
    };

    checkLastCheckin();
  }, [user]);

  const cardContent = (
    <>
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
          aria-label="Fjern Månedligt Tjek"
        >
          <X className="h-3 w-3" style={{ width: '12px', height: '12px' }} />
        </button>
      )}

      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={cn(
          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
          hasRecentCheckin ? "bg-success/10" : "bg-primary/10"
        )}>
          {hasRecentCheckin ? (
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
          ) : (
            <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          )}
        </div>
        
        {/* Compact score badge in corner */}
        {hasRecentCheckin && lastScore !== null && (
          <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded-full">
            <span className="text-xs font-bold">{lastScore}/100</span>
          </div>
        )}
      </div>
      
      <h3 className="text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1 leading-tight line-clamp-1">
        Månedligt Tjek
      </h3>
      
      {/* Dynamic description based on status */}
      {hasRecentCheckin ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-[13px] sm:text-sm">
            Om {daysUntilNext} {daysUntilNext === 1 ? 'dag' : 'dage'}
          </p>
          {/* Compact device icons */}
          {checkedDevices.length > 0 && (
            <div className="flex items-center gap-1">
              {checkedDevices.slice(0, 3).map((device, index) => {
                const config = deviceConfig[device];
                if (!config) return null;
                const IconComponent = config.Icon;
                return (
                  <span 
                    key={`${device}-${index}`} 
                    className="inline-flex items-center justify-center w-5 h-5 bg-muted rounded text-muted-foreground"
                    title={config.label}
                  >
                    <IconComponent className="h-3 w-3" />
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-[13px] sm:text-sm line-clamp-2">
          Tjek din enheds sundhed
        </p>
      )}
      
      {/* Spacer to push action to bottom */}
      <div className="flex-1" />
      
      <div className="mt-2 sm:mt-3 flex items-center text-primary font-medium text-xs sm:text-sm">
        {hasRecentCheckin ? 'Se detaljer' : 'Start tjek'}
        <ChevronRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
      </div>
    </>
  );

  if (isEditMode) {
    return (
      <div
        style={style}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('button')) {
            e.preventDefault();
            e.stopPropagation();
            onExitEditMode?.();
          }
        }}
        className={cn(
          "card-interactive p-3 sm:p-5 flex flex-col relative h-full min-h-[180px] sm:min-h-[200px] md:min-h-[210px]",
          isEditMode && "animate-wiggle cursor-grab",
          isDragging && "opacity-50 scale-105 shadow-xl"
        )}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      to="/checkin"
      className="card-interactive p-3 sm:p-5 flex flex-col h-full min-h-[180px] sm:min-h-[200px] md:min-h-[210px]"
      style={{ touchAction: 'pan-y' }}
    >
      {cardContent}
    </Link>
  );
}
