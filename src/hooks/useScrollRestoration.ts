import { useEffect } from 'react';

/**
 * Simple hook that scrolls to top on mount.
 * All pages start at the top for predictable navigation.
 */
export function useScrollRestoration() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}

/**
 * Hook for saving scroll state before navigation.
 * Currently a no-op since we removed scroll restoration.
 */
export function useSaveScrollOnNavigate() {
  return {
    saveAndNavigate: (callback: () => void) => {
      callback();
    },
    saveScrollPosition: () => {},
    saveScrollAnchor: () => {},
  };
}

// Legacy exports (no-ops for backwards compatibility)
export function saveScrollPosition(_routeKey: string) {}
export function saveScrollAnchor(_routeKey: string, _anchorId: string) {}
export function getRouteKey(_location: { pathname: string }) {
  return _location.pathname;
}
