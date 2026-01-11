import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Store scroll positions keyed by route (pathname + search + hash)
const scrollPositions: Record<string, number> = {};

// Store anchor IDs for element-based restoration
const scrollAnchors: Record<string, string> = {};

/**
 * Save current scroll position for a given route key
 */
export function saveScrollPosition(routeKey: string) {
  scrollPositions[routeKey] = window.scrollY;
}

/**
 * Get saved scroll position for a route key
 */
export function getSavedScrollPosition(routeKey: string): number | null {
  return scrollPositions[routeKey] ?? null;
}

/**
 * Clear scroll position for a route key
 */
export function clearScrollPosition(routeKey: string) {
  delete scrollPositions[routeKey];
}

/**
 * Save anchor ID for element-based restoration
 */
export function saveScrollAnchor(routeKey: string, anchorId: string) {
  scrollAnchors[routeKey] = anchorId;
}

/**
 * Get saved anchor ID for a route key
 */
export function getSavedScrollAnchor(routeKey: string): string | null {
  return scrollAnchors[routeKey] ?? null;
}

/**
 * Clear anchor for a route key
 */
export function clearScrollAnchor(routeKey: string) {
  delete scrollAnchors[routeKey];
}

export function getRouteKey(location: { pathname: string; search?: string; hash?: string }) {
  return `${location.pathname}${location.search ?? ''}${location.hash ?? ''}`;
}

/**
 * Scroll to a specific element by anchor ID, accounting for sticky header
 */
function scrollToAnchorInstant(anchorId: string, headerOffset: number = 80): boolean {
  const element = document.querySelector(`[data-scroll-anchor="${anchorId}"]`);
  if (!element) return false;

  const elementRect = element.getBoundingClientRect();
  const absoluteTop = window.scrollY + elementRect.top - headerOffset;

  window.scrollTo(0, Math.max(0, absoluteTop));
  return true;
}

/**
 * Stabilize scroll position after initial restore
 * Re-aligns if content shifts due to async loading
 */
function stabilizeScrollPosition(
  anchorId: string,
  opts?: { durationMs?: number; intervalMs?: number; headerOffset?: number }
) {
  const durationMs = opts?.durationMs ?? 1200;
  const intervalMs = opts?.intervalMs ?? 150;
  const headerOffset = opts?.headerOffset ?? 80;

  let elapsed = 0;

  const checkInterval = window.setInterval(() => {
    elapsed += intervalMs;

    const element = document.querySelector(`[data-scroll-anchor="${anchorId}"]`);
    if (!element) {
      window.clearInterval(checkInterval);
      return;
    }

    const elementRect = element.getBoundingClientRect();
    const currentVisibleTop = elementRect.top;

    // If element has drifted from expected position, re-align
    const expectedTop = headerOffset;
    const drift = Math.abs(currentVisibleTop - expectedTop);

    if (drift > 30) {
      const absoluteTop = window.scrollY + elementRect.top - headerOffset;
      window.scrollTo(0, Math.max(0, absoluteTop));
    }

    if (elapsed >= durationMs) {
      window.clearInterval(checkInterval);
    }
  }, intervalMs);
}

/**
 * Hook to restore scroll position BEFORE paint (useLayoutEffect)
 * Page loads at the exact position - no visible scrolling
 */
export function useScrollRestoration() {
  const location = useLocation();

  // useLayoutEffect runs synchronously before browser paint
  useLayoutEffect(() => {
    const routeKey = getRouteKey(location);
    const savedAnchor = getSavedScrollAnchor(routeKey) ?? getSavedScrollAnchor(location.pathname);
    const savedPosition =
      getSavedScrollPosition(routeKey) ?? getSavedScrollPosition(location.pathname) ?? null;

    // Try anchor-based restoration first (more reliable for dynamic content)
    if (savedAnchor) {
      const success = scrollToAnchorInstant(savedAnchor);
      
      if (success) {
        // Stabilize in case content loads async and shifts layout
        stabilizeScrollPosition(savedAnchor);
      } else if (savedPosition !== null && savedPosition > 0) {
        // Fallback to position-based if anchor not found yet
        window.scrollTo(0, savedPosition);
      }

      // Clear anchor after restoration
      clearScrollAnchor(routeKey);
      clearScrollAnchor(location.pathname);
    } else if (savedPosition !== null && savedPosition > 0) {
      window.scrollTo(0, savedPosition);
    }

    // Save position when leaving
    return () => {
      saveScrollPosition(routeKey);
    };
  }, [location.pathname, location.search, location.hash]);
}

/**
 * Hook to save scroll position before navigation
 */
export function useSaveScrollOnNavigate() {
  const location = useLocation();

  const saveAndNavigate = (callback: () => void, anchorId?: string) => {
    const routeKey = getRouteKey(location);
    saveScrollPosition(routeKey);
    if (anchorId) {
      saveScrollAnchor(routeKey, anchorId);
    }
    callback();
  };

  return {
    saveAndNavigate,
    saveScrollPosition: () => saveScrollPosition(getRouteKey(location)),
    saveScrollAnchor: (anchorId: string) => saveScrollAnchor(getRouteKey(location), anchorId),
  };
}
