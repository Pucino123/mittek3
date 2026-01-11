import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Store scroll positions keyed by pathname
const scrollPositions: Record<string, number> = {};

/**
 * Save current scroll position for the current route
 */
export function saveScrollPosition(pathname: string) {
  scrollPositions[pathname] = window.scrollY;
}

/**
 * Get saved scroll position for a route
 */
export function getSavedScrollPosition(pathname: string): number | null {
  return scrollPositions[pathname] ?? null;
}

/**
 * Clear scroll position for a route
 */
export function clearScrollPosition(pathname: string) {
  delete scrollPositions[pathname];
}

/**
 * Hook to automatically save scroll position when leaving a page
 * and restore it when returning
 */
export function useScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    // On mount, check if we have a saved position for this route
    const savedPosition = getSavedScrollPosition(location.pathname);
    
    if (savedPosition !== null) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedPosition, behavior: 'instant' });
      });
    }

    // Save scroll position when navigating away
    return () => {
      saveScrollPosition(location.pathname);
    };
  }, [location.pathname]);
}

/**
 * Hook to save scroll position before navigation
 */
export function useSaveScrollOnNavigate() {
  const location = useLocation();

  const saveAndNavigate = (callback: () => void) => {
    saveScrollPosition(location.pathname);
    callback();
  };

  return { saveAndNavigate, saveScrollPosition: () => saveScrollPosition(location.pathname) };
}
