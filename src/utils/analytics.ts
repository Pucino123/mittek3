// Google Analytics 4 utility functions with cookie consent integration

const GA_MEASUREMENT_ID = 'GA4_MEASUREMENT_ID'; // Replace with actual ID from secrets

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let isGA4Loaded = false;

/**
 * Initialize Google Analytics 4
 * Should only be called after user has consented to cookies
 */
export function initGA4(): void {
  if (isGA4Loaded) return;
  
  const consent = localStorage.getItem('cookie-consent');
  if (consent !== 'accepted') return;

  // Create script element for gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    anonymize_ip: true,
    cookie_flags: 'SameSite=None;Secure',
  });

  isGA4Loaded = true;
  console.log('GA4 initialized with consent');
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!isGA4Loaded || !window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (!isGA4Loaded || !window.gtag) return;
  
  window.gtag('event', eventName, params);
}

// ============================================
// Pre-defined event tracking functions
// ============================================

/**
 * Track CTA button clicks
 */
export function trackCTAClick(ctaName: string, location: string): void {
  trackEvent('cta_click', {
    cta_name: ctaName,
    location: location,
  });
}

/**
 * Track signup events
 */
export function trackSignup(method: string): void {
  trackEvent('sign_up', {
    method: method,
  });
}

/**
 * Track login events
 */
export function trackLogin(method: string): void {
  trackEvent('login', {
    method: method,
  });
}

/**
 * Track form submissions
 */
export function trackFormSubmission(formName: string, success: boolean): void {
  trackEvent('form_submission', {
    form_name: formName,
    success: success,
  });
}

/**
 * Track tool usage (checkin, quiz, battery doctor, etc.)
 */
export function trackToolUsage(toolName: string, action: string, details?: Record<string, unknown>): void {
  trackEvent('tool_usage', {
    tool_name: toolName,
    action: action,
    ...details,
  });
}

/**
 * Track guide views
 */
export function trackGuideView(guideId: string, guideTitle: string): void {
  trackEvent('guide_view', {
    guide_id: guideId,
    guide_title: guideTitle,
  });
}

/**
 * Track search actions
 */
export function trackSearch(searchTerm: string, resultCount?: number): void {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultCount,
  });
}

/**
 * Check if GA4 is currently active
 */
export function isGA4Active(): boolean {
  return isGA4Loaded;
}

/**
 * Initialize GA4 on page load if consent already given
 * Call this early in app initialization
 */
export function initGA4OnLoad(): void {
  const consent = localStorage.getItem('cookie-consent');
  if (consent === 'accepted') {
    initGA4();
  }
}
