// Core Web Vitals tracking utility
// Tracks LCP, FID, CLS and sends to Google Analytics

import { trackEvent } from './analytics';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Get rating based on Web Vitals thresholds
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],     // Largest Contentful Paint
    FID: [100, 300],       // First Input Delay
    CLS: [0.1, 0.25],      // Cumulative Layout Shift
    FCP: [1800, 3000],     // First Contentful Paint
    TTFB: [800, 1800],     // Time to First Byte
    INP: [200, 500],       // Interaction to Next Paint
  };

  const [good, poor] = thresholds[name] || [0, 0];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vital to analytics
 */
function reportWebVital(metric: WebVitalMetric): void {
  trackEvent('web_vitals', {
    metric_name: metric.name,
    metric_value: Math.round(metric.value),
    metric_rating: metric.rating,
    metric_delta: Math.round(metric.delta),
    metric_id: metric.id,
  });

  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log(`[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  }
}

/**
 * Initialize Core Web Vitals tracking
 * Uses the Performance Observer API
 */
export function initWebVitals(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Track Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      
      if (lastEntry) {
        const value = lastEntry.startTime;
        reportWebVital({
          name: 'LCP',
          value,
          rating: getRating('LCP', value),
          delta: value,
          id: `lcp-${Date.now()}`,
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // LCP not supported
  }

  // Track First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number };
      
      if (firstEntry) {
        const value = firstEntry.processingStart - firstEntry.startTime;
        reportWebVital({
          name: 'FID',
          value,
          rating: getRating('FID', value),
          delta: value,
          id: `fid-${Date.now()}`,
        });
      }
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch {
    // FID not supported
  }

  // Track Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Report CLS when page is hidden (user navigates away)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportWebVital({
          name: 'CLS',
          value: clsValue,
          rating: getRating('CLS', clsValue),
          delta: clsValue,
          id: `cls-${Date.now()}`,
        });
      }
    });
  } catch {
    // CLS not supported
  }

  // Track First Contentful Paint (FCP)
  try {
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        const value = fcpEntry.startTime;
        reportWebVital({
          name: 'FCP',
          value,
          rating: getRating('FCP', value),
          delta: value,
          id: `fcp-${Date.now()}`,
        });
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch {
    // FCP not supported
  }
}
