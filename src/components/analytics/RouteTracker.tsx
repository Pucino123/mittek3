import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, isGA4Active } from '@/utils/analytics';
import { usePageTracking } from '@/hooks/usePageTracking';

/**
 * RouteTracker component that automatically tracks page views
 * when the route changes. Must be placed inside BrowserRouter.
 * 
 * Tracks to both GA4 (if consented) and internal Supabase analytics.
 */
export function RouteTracker() {
  const location = useLocation();
  
  // Track to internal Supabase analytics
  usePageTracking();

  useEffect(() => {
    // Only track to GA4 if active (user has consented)
    if (isGA4Active()) {
      // Use pathname for tracking, optionally include search params
      const path = location.pathname + location.search;
      trackPageView(path);
    }
  }, [location]);

  return null;
}
