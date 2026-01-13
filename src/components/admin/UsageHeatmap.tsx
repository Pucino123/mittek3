import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { DateRange } from './DateRangePicker';

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface UsageHeatmapProps {
  dateRange: DateRange;
}

const DAYS = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function UsageHeatmap({ dateRange }: UsageHeatmapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [maxCount, setMaxCount] = useState(1);

  useEffect(() => {
    fetchHeatmapData();
  }, [dateRange]);

  const fetchHeatmapData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_views')
        .select('created_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (error) throw error;

      // Initialize grid
      const grid: Map<string, number> = new Map();
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          grid.set(`${day}-${hour}`, 0);
        }
      }

      // Count occurrences
      data?.forEach(view => {
        const date = new Date(view.created_at);
        const day = date.getDay();
        const hour = date.getHours();
        const key = `${day}-${hour}`;
        grid.set(key, (grid.get(key) || 0) + 1);
      });

      // Convert to array
      const cells: HeatmapCell[] = [];
      let max = 1;
      grid.forEach((count, key) => {
        const [day, hour] = key.split('-').map(Number);
        cells.push({ day, hour, count });
        if (count > max) max = count;
      });

      setHeatmapData(cells);
      setMaxCount(max);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getColor = (count: number): string => {
    if (count === 0) return 'bg-muted/30';
    const intensity = count / maxCount;
    if (intensity < 0.2) return 'bg-primary/20';
    if (intensity < 0.4) return 'bg-primary/40';
    if (intensity < 0.6) return 'bg-primary/60';
    if (intensity < 0.8) return 'bg-primary/80';
    return 'bg-primary';
  };

  const getCell = (day: number, hour: number): HeatmapCell | undefined => {
    return heatmapData.find(c => c.day === day && c.hour === hour);
  };

  const formatHour = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Aktivitetsmønster
        </CardTitle>
        <CardDescription>Sidevisninger fordelt på ugedag og tidspunkt (seneste 30 dage)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="flex mb-1">
              <div className="w-10" />
              {HOURS.filter((_, i) => i % 3 === 0).map(hour => (
                <div 
                  key={hour} 
                  className="flex-1 text-xs text-muted-foreground text-center"
                  style={{ minWidth: '36px' }}
                >
                  {formatHour(hour)}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <TooltipProvider delayDuration={100}>
              <div className="space-y-1">
                {DAYS.map((dayName, dayIndex) => (
                  <div key={dayName} className="flex items-center gap-1">
                    <div className="w-10 text-xs text-muted-foreground font-medium">
                      {dayName}
                    </div>
                    <div className="flex gap-0.5 flex-1">
                      {HOURS.map(hour => {
                        const cell = getCell(dayIndex, hour);
                        const count = cell?.count || 0;
                        return (
                          <Tooltip key={hour}>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-6 flex-1 rounded-sm cursor-default transition-colors ${getColor(count)}`}
                                style={{ minWidth: '12px' }}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">{dayName} kl. {formatHour(hour)}</p>
                              <p className="text-muted-foreground">{count} visninger</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TooltipProvider>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-xs text-muted-foreground">Mindre</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-4 rounded-sm bg-muted/30" />
                <div className="w-4 h-4 rounded-sm bg-primary/20" />
                <div className="w-4 h-4 rounded-sm bg-primary/40" />
                <div className="w-4 h-4 rounded-sm bg-primary/60" />
                <div className="w-4 h-4 rounded-sm bg-primary/80" />
                <div className="w-4 h-4 rounded-sm bg-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Mere</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
