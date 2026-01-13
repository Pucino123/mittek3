import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Generate a session ID for anonymous tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export function usePageTracking() {
  const location = useLocation();
  const { user } = useAuth();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // Avoid tracking the same path twice in a row
    if (lastTrackedPath.current === location.pathname) {
      return;
    }
    lastTrackedPath.current = location.pathname;

    const trackPageView = async () => {
      try {
        const sessionId = getSessionId();
        const referrer = document.referrer || null;
        const userAgent = navigator.userAgent || null;

        // Call edge function for geo-enriched tracking
        const { error } = await supabase.functions.invoke('track-pageview', {
          body: {
            path: location.pathname,
            referrer,
            user_agent: userAgent,
            session_id: sessionId,
            user_id: user?.id || null,
          },
        });

        if (error) {
          // Fallback to direct insert if edge function fails
          await supabase.from('page_views').insert({
            user_id: user?.id || null,
            path: location.pathname,
            referrer,
            user_agent: userAgent,
            session_id: sessionId,
          });
        }
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.debug('Page tracking failed:', error);
      }
    };

    // Small delay to ensure navigation has completed
    const timeoutId = setTimeout(trackPageView, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname, user?.id]);
}
