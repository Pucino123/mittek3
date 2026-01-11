import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, History, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface CheckHistoryEntry {
  id: string;
  created_at: string;
  score: number;
  device_types: string[];
}

export function CheckHistoryWidget() {
  const { user } = useAuth();
  const [history, setHistory] = useState<CheckHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('check_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(12);
    
    if (!error && data) {
      setHistory(data);
    }
    setIsLoading(false);
  };

  const handleReset = async () => {
    if (!user) return;
    
    setIsResetting(true);
    try {
      // Get the most recent checkin to delete it
      const { data: latestCheckin } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();
      
      if (latestCheckin) {
        const { error } = await supabase
          .from('checkins')
          .delete()
          .eq('id', latestCheckin.id);
        
        if (error) throw error;
      }
      
      toast.success('Månedstjek nulstillet!', {
        description: 'Du kan nu køre et nyt tjek.',
      });
      
      // Reload the page to reset the dashboard state
      window.location.reload();
    } catch (error) {
      console.error('Reset error:', error);
      toast.error('Kunne ikke nulstille tjekket');
    } finally {
      setIsResetting(false);
    }
  };

  // Don't show if no history yet
  if (isLoading) {
    return null;
  }

  if (history.length === 0) {
    return null;
  }

  // Prepare chart data
  const chartData = history.map((entry) => ({
    date: format(new Date(entry.created_at), 'd. MMM', { locale: da }),
    score: entry.score,
    fullDate: format(new Date(entry.created_at), 'd. MMMM yyyy', { locale: da }),
  }));

  // Calculate trend
  const lastTwo = history.slice(-2);
  const trend = lastTwo.length >= 2 ? lastTwo[1].score - lastTwo[0].score : 0;
  const trendColor = trend >= 0 ? 'text-success' : 'text-warning';
  const TrendIcon = trend >= 0 ? TrendingUp : TrendingDown;

  // Get recent entries for list (last 5)
  const recentEntries = history.slice(-5).reverse();

  const getStatusEmoji = (score: number) => {
    if (score === 100) return '🟢';
    if (score >= 80) return '🟡';
    return '🟠';
  };

  const getStatusText = (score: number) => {
    if (score === 100) return 'Alt OK';
    if (score >= 80) return 'Små ting';
    const issues = Math.ceil((100 - score) / 20);
    return `${issues} fejl`;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Din Fremgang</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Nulstil Månedstjek?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Er du sikker? Dette sletter resultatet for denne måned, så du kan starte forfra.
                    Din historik bevares.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuller</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReset}
                    disabled={isResetting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isResetting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Nulstil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line Chart */}
        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 11 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-sm">
                        <p className="font-medium">{data.fullDate}</p>
                        <p className="text-primary font-bold">{data.score}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={80} stroke="hsl(var(--muted))" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 5 }}
                activeDot={{ r: 7, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent List */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Seneste tjek
          </p>
          <div className="space-y-1">
            {recentEntries.map((entry) => (
              <div 
                key={entry.id} 
                className="flex items-center justify-between py-1.5 text-sm"
              >
                <span className="text-muted-foreground">
                  {format(new Date(entry.created_at), 'd. MMMM', { locale: da })}
                </span>
                <span className="font-medium">
                  <span className="font-bold">{entry.score}%</span>
                  {' '}
                  <span className="text-muted-foreground">
                    ({getStatusText(entry.score)})
                  </span>
                  {' '}
                  {getStatusEmoji(entry.score)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
