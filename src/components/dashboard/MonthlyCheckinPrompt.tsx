import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, ArrowRight, Sparkles, CheckCircle, Smartphone, Tablet, Monitor, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface MonthlyCheckinPromptProps {
  onHasRecentCheckin?: (hasRecent: boolean, checkinData?: any) => void;
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

export function MonthlyCheckinPrompt({ onHasRecentCheckin }: MonthlyCheckinPromptProps) {
  const { user, profile } = useAuth();
  const [hasRecentCheckin, setHasRecentCheckin] = useState<boolean | null>(null);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [daysUntilNext, setDaysUntilNext] = useState<number>(30);
  const [checkedDevices, setCheckedDevices] = useState<string[]>([]);
  const ownedDevices = (profile?.owned_devices as string[]) || ['iphone'];

  useEffect(() => {
    const checkLastCheckin = async () => {
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Query check_history which has device_types
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
        
        // Calculate days until next checkin (30 days from created_at)
        const completedDate = new Date(historyData[0].created_at);
        const nextCheckinDate = new Date(completedDate);
        nextCheckinDate.setDate(nextCheckinDate.getDate() + 30);
        const today = new Date();
        const diffTime = nextCheckinDate.getTime() - today.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        setDaysUntilNext(diffDays);
        
        onHasRecentCheckin?.(true, historyData[0]);
      } else {
        onHasRecentCheckin?.(false);
      }
    };

    checkLastCheckin();
  }, [user, onHasRecentCheckin]);

  // Loading state
  if (hasRecentCheckin === null) {
    return null;
  }

  // User has done checkin recently - show success with device summary
  if (hasRecentCheckin) {
    return (
      <div className="card-elevated p-4 sm:p-5 mb-6 bg-success/5 border-success/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-base">Månedligt Tjek gennemført</p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Din score: {lastScore}/100 • Næste tjek om {daysUntilNext} {daysUntilNext === 1 ? 'dag' : 'dage'}
            </p>
            {checkedDevices.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs text-muted-foreground">Tjekket:</span>
                {checkedDevices.map((device, index) => {
                  const config = deviceConfig[device];
                  if (!config) return null;
                  const IconComponent = config.Icon;
                  return (
                    <span 
                      key={`${device}-${index}`} 
                      className="inline-flex items-center gap-1 text-xs bg-success/10 text-success px-2 py-0.5 rounded-full"
                      title={config.label}
                    >
                      <IconComponent className="h-3 w-3" />
                      {config.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // User hasn't done checkin - show prominent call-to-action with device info
  return (
    <div className="card-elevated p-5 sm:p-6 mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <ClipboardCheck className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">Anbefalet</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-1">Start dit Månedlige Tjek</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            {ownedDevices.length > 1 
              ? `Tjek dine ${ownedDevices.length} enheder på kun 3 minutter og få en personlig handlingsplan.`
              : 'På kun 3 minutter får du en personlig handlingsplan for at holde din enhed sikker og hurtig.'
            }
          </p>
          {ownedDevices.length > 1 && (
            <div className="flex items-center gap-2 mt-2">
              {ownedDevices.map((device, index) => {
                const config = deviceConfig[device];
                if (!config) return null;
                const IconComponent = config.Icon;
                return (
                  <span 
                    key={`${device}-${index}`} 
                    className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                  >
                    <IconComponent className="h-3 w-3" />
                    {config.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        <Link to="/checkin" className="shrink-0">
          <Button variant="hero" size="lg" className="w-full sm:w-auto min-h-[52px] text-base">
            Start nu
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}