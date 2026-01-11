import { useEffect, useRef } from 'react';
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

// Check if user prefers reduced motion
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showScrollRestoredIndicator() {
  const root = document.createElement('div');
  root.setAttribute('aria-live', 'polite');
  root.className = 'fixed left-1/2 top-4 -translate-x-1/2 z-[9999] pointer-events-none';

  const bubble = document.createElement('div');
  bubble.className =
    'rounded-full bg-primary text-primary-foreground shadow-lg px-4 py-2 text-sm font-medium animate-enter animate-pulse';
  bubble.textContent = 'Tilbage til din position';

  root.appendChild(bubble);
  document.body.appendChild(root);

  // Fade out + remove
  window.setTimeout(() => {
    bubble.classList.remove('animate-enter', 'animate-pulse');
    bubble.classList.add('animate-exit');
  }, 1800);

  window.setTimeout(() => {
    root.remove();
  }, 2100);
}

/**
 * Scroll to a specific element by anchor ID, accounting for sticky header
 */
function scrollToAnchor(
  anchorId: string,
  opts?: { smooth?: boolean; headerOffset?: number }
): boolean {
  const smooth = opts?.smooth ?? !prefersReducedMotion();
  const headerOffset = opts?.headerOffset ?? 80; // Account for sticky header

  const element = document.querySelector(`[data-scroll-anchor="${anchorId}"]`);
  if (!element) return false;

  const elementRect = element.getBoundingClientRect();
  const absoluteTop = window.scrollY + elementRect.top - headerOffset;

  window.scrollTo({
    top: Math.max(0, absoluteTop),
    behavior: smooth ? 'smooth' : 'auto',
  });

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
  const durationMs = opts?.durationMs ?? 1500;
  const intervalMs = opts?.intervalMs ?? 200;
  const headerOffset = opts?.headerOffset ?? 80;

  let elapsed = 0;
  let lastTop: number | null = null;

  const checkInterval = window.setInterval(() => {
    elapsed += intervalMs;

    const element = document.querySelector(`[data-scroll-anchor="${anchorId}"]`);
    if (!element) {
      window.clearInterval(checkInterval);
      return;
    }

    const elementRect = element.getBoundingClientRect();
    const currentVisibleTop = elementRect.top;

    // If element has moved significantly from expected position, re-align
    const expectedTop = headerOffset;
    const drift = Math.abs(currentVisibleTop - expectedTop);

    if (drift > 20 && lastTop !== null && Math.abs(currentVisibleTop - lastTop) > 5) {
      // Content shifted, re-align without smooth scroll to avoid jank
      const absoluteTop = window.scrollY + elementRect.top - headerOffset;
      window.scrollTo({ top: Math.max(0, absoluteTop), behavior: 'auto' });
    }

    lastTop = currentVisibleTop;

    if (elapsed >= durationMs) {
      window.clearInterval(checkInterval);
    }
  }, intervalMs);
}

function restoreScrollTo(targetY: number, opts?: { maxAttempts?: number; intervalMs?: number }) {
  const maxAttempts = opts?.maxAttempts ?? 16;
  const intervalMs = opts?.intervalMs ?? 50;

  let attempts = 0;

  const tryRestore = () => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const canReachTarget = maxScroll >= targetY - 2;

    // Scroll as far as possible right now
    const desired = Math.min(targetY, maxScroll);
    window.scrollTo({ top: desired, behavior: 'auto' });

    const closeEnough = Math.abs(window.scrollY - targetY) < 2;

    // If the page isn't tall enough yet, keep trying until it is (or we time out)
    if ((!canReachTarget || !closeEnough) && attempts < maxAttempts) {
      attempts += 1;
      window.setTimeout(tryRestore, intervalMs);
    }
  };

  tryRestore();
}

/**
 * Hook to automatically save scroll position when leaving a page
 * and restore it when returning
 */
export function useScrollRestoration(options?: { showIndicator?: boolean }) {
  const location = useLocation();
  const hasShownIndicator = useRef(false);
  const showIndicator = options?.showIndicator ?? true;

  useEffect(() => {
    hasShownIndicator.current = false;

    const routeKey = getRouteKey(location);
    const savedAnchor = getSavedScrollAnchor(routeKey) ?? getSavedScrollAnchor(location.pathname);
    const savedPosition =
      getSavedScrollPosition(routeKey) ?? getSavedScrollPosition(location.pathname) ?? null;

    // Try anchor-based restoration first (more reliable)
    if (savedAnchor) {
      requestAnimationFrame(() => {
        // Small delay to let DOM render
        window.setTimeout(() => {
          const success = scrollToAnchor(savedAnchor, { smooth: !prefersReducedMotion() });
          
          if (success) {
            if (showIndicator && !hasShownIndicator.current) {
              hasShownIndicator.current = true;
              showScrollRestoredIndicator();
            }
            // Start stabilization to handle async content loading
            stabilizeScrollPosition(savedAnchor);
          } else if (savedPosition !== null && savedPosition > 0) {
            // Fallback to position-based if anchor not found
            restoreScrollTo(savedPosition);
            if (showIndicator && !hasShownIndicator.current) {
              hasShownIndicator.current = true;
              showScrollRestoredIndicator();
            }
          }

          // Clear anchor after restoration attempt
          clearScrollAnchor(routeKey);
          clearScrollAnchor(location.pathname);
        }, 50);
      });
    } else if (savedPosition !== null && savedPosition > 0) {
      requestAnimationFrame(() => {
        restoreScrollTo(savedPosition);

        if (showIndicator && !hasShownIndicator.current) {
          hasShownIndicator.current = true;
          showScrollRestoredIndicator();
        }
      });
    }

    return () => {
      saveScrollPosition(routeKey);
    };
  }, [location.pathname, location.search, location.hash, showIndicator]);
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
