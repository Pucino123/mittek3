import { useEffect, useRef } from 'react';
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
 * Show a subtle visual indicator when scroll is restored
 */
function showScrollRestoredIndicator() {
  // Create a subtle pulse overlay at the top of the viewport
  const indicator = document.createElement('div');
  indicator.className = 'scroll-restored-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent);
    z-index: 9999;
    pointer-events: none;
    animation: scrollIndicatorFade 0.6s ease-out forwards;
  `;
  
  // Add keyframes if not already present
  if (!document.getElementById('scroll-indicator-styles')) {
    const style = document.createElement('style');
    style.id = 'scroll-indicator-styles';
    style.textContent = `
      @keyframes scrollIndicatorFade {
        0% { opacity: 0; transform: scaleX(0); }
        30% { opacity: 1; transform: scaleX(1); }
        100% { opacity: 0; transform: scaleX(1); }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(indicator);
  
  // Remove after animation
  setTimeout(() => {
    indicator.remove();
  }, 600);
}

/**
 * Hook to automatically save scroll position when leaving a page
 * and restore it when returning
 */
export function useScrollRestoration(options?: { showIndicator?: boolean }) {
  const location = useLocation();
  const hasRestored = useRef(false);
  const showIndicator = options?.showIndicator ?? true;

  useEffect(() => {
    // Reset the restored flag when location changes
    hasRestored.current = false;
    
    // On mount, check if we have a saved position for this route
    const savedPosition = getSavedScrollPosition(location.pathname);
    
    if (savedPosition !== null && savedPosition > 0) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedPosition, behavior: 'instant' });
        
        // Show visual feedback that scroll was restored
        if (showIndicator && !hasRestored.current) {
          hasRestored.current = true;
          showScrollRestoredIndicator();
        }
      });
    }

    // Save scroll position when navigating away
    return () => {
      saveScrollPosition(location.pathname);
    };
  }, [location.pathname, showIndicator]);
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
