/**
 * Redirects non-www URLs to www for consistent URL structure.
 * This should be called early in the app initialization.
 * 
 * Note: For production, it's recommended to also configure this
 * at the DNS/hosting level (Cloudflare, Netlify, Vercel) for 
 * faster redirects before JavaScript loads.
 */
export function enforceWwwRedirect(): void {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  const { hostname, href } = window.location;
  
  // Check if we're on the production domain without www
  if (hostname === 'mittek.dk') {
    // Replace hostname with www version
    const newUrl = href.replace('://mittek.dk', '://www.mittek.dk');
    window.location.replace(newUrl);
  }
}
