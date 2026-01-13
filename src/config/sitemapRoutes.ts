/**
 * Sitemap Route Configuration
 * 
 * This file defines all public routes that should be included in the sitemap.
 * Protected routes (requiring authentication) are excluded.
 * 
 * Update this file when adding new public pages to automatically
 * include them in the generated sitemap.xml
 */

export interface SitemapRoute {
  /** URL path (without domain) */
  path: string;
  /** How often the page changes: always, hourly, daily, weekly, monthly, yearly, never */
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Priority from 0.0 to 1.0 (1.0 = most important) */
  priority: number;
  /** Optional: Last modification date (ISO format). Defaults to build date if not set. */
  lastmod?: string;
}

/**
 * Public routes to include in sitemap.
 * Sorted by priority (highest first).
 */
export const sitemapRoutes: SitemapRoute[] = [
  // Homepage - highest priority
  {
    path: '/',
    changefreq: 'weekly',
    priority: 1.0,
  },
  
  // Core marketing pages
  {
    path: '/pricing',
    changefreq: 'weekly',
    priority: 0.9,
  },
  {
    path: '/faq',
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    path: '/contact',
    changefreq: 'monthly',
    priority: 0.7,
  },
  
  // Public tool pages (accessible without login)
  {
    path: '/screenshot-ai',
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    path: '/safety',
    changefreq: 'monthly',
    priority: 0.7,
  },
  
  // Authentication pages
  {
    path: '/signup',
    changefreq: 'monthly',
    priority: 0.6,
  },
  {
    path: '/login',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    path: '/reset-password',
    changefreq: 'yearly',
    priority: 0.3,
  },
  
  // Helper invite (public landing)
  {
    path: '/helper-invite',
    changefreq: 'monthly',
    priority: 0.4,
  },
  
  // Legal pages
  {
    path: '/privacy',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    path: '/terms',
    changefreq: 'yearly',
    priority: 0.3,
  },
];

/** Base URL for the site (without trailing slash) */
export const SITE_URL = 'https://www.mittek.dk';
