import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useNotificationCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        // Check for pending monthly check-in (last check-in more than 30 days ago)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentCheckin } = await supabase
          .from('checkins')
          .select('id')
          .eq('user_id', user.id)
          .gte('completed_at', thirtyDaysAgo.toISOString())
          .limit(1);

        let notificationCount = 0;

        // If no recent check-in, add notification
        if (!recentCheckin || recentCheckin.length === 0) {
          notificationCount += 1;
        }

        // Check for unread recommendations from latest check-in
        const { data: latestCheckin } = await supabase
          .from('checkins')
          .select('recommendations')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        if (latestCheckin?.recommendations) {
          const recommendations = latestCheckin.recommendations as unknown[];
          if (Array.isArray(recommendations) && recommendations.length > 0) {
            // Add count for actionable recommendations
            notificationCount += Math.min(recommendations.length, 3);
          }
        }

        setCount(notificationCount);
      } catch (error) {
        console.error('Error fetching notification count:', error);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  return { count, isLoading };
}
