import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function LiveVisitorCounter() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [isLive, setIsLive] = useState(true);

  const fetchActiveUsers = async () => {
    try {
      // Count unique sessions from the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('page_views')
        .select('session_id')
        .gte('created_at', fiveMinutesAgo)
        .not('session_id', 'is', null);

      if (error) throw error;

      // Count unique sessions
      const uniqueSessions = new Set(data?.map(v => v.session_id)).size;
      setActiveUsers(uniqueSessions);
      setIsLive(true);
    } catch (error) {
      console.error('Error fetching active users:', error);
      setIsLive(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchActiveUsers();

    // Set up real-time subscription
    const channel = supabase
      .channel('page_views_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'page_views',
        },
        () => {
          // Refetch on new page view
          fetchActiveUsers();
        }
      )
      .subscribe();

    // Also poll every 30 seconds as backup
    const interval = setInterval(fetchActiveUsers, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktive besøgende</p>
              <p className="text-2xl font-bold">{activeUsers}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Circle 
              className={`h-2.5 w-2.5 fill-current ${isLive ? 'text-success animate-pulse' : 'text-muted-foreground'}`} 
            />
            <span className="text-xs text-muted-foreground">
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Brugere aktive inden for de seneste 5 minutter
        </p>
      </CardContent>
    </Card>
  );
}
