/**
 * @deprecated Server-level redirect is now configured via Lovable domain settings.
 * This client-side redirect is kept as a fallback but should not be called.
 * 
 * The server-level redirect provides:
 * - Faster redirects (before JavaScript loads)
 * - Better SEO (301 permanent redirect)
 * - Reduced page load time
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
