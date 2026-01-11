import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Store scroll positions keyed by route (pathname + search + hash)
const scrollPositions: Record<string, number> = {};

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

function getRouteKey(location: { pathname: string; search?: string; hash?: string }) {
  return `${location.pathname}${location.search ?? ''}${location.hash ?? ''}`;
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
  }, 900);

  window.setTimeout(() => {
    root.remove();
  }, 1150);
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
    const savedPosition =
      getSavedScrollPosition(routeKey) ?? getSavedScrollPosition(location.pathname) ?? null;

    if (savedPosition !== null && savedPosition > 0) {
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

  const saveAndNavigate = (callback: () => void) => {
    saveScrollPosition(getRouteKey(location));
    callback();
  };

  return {
    saveAndNavigate,
    saveScrollPosition: () => saveScrollPosition(getRouteKey(location)),
  };
}
