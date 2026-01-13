/**
 * Sitemap Generator Script
 * 
 * Generates sitemap.xml at build time based on route configuration.
 * Run with: npx tsx scripts/generate-sitemap.ts
 * 
 * This script is also integrated into the Vite build process.
 */

import { writeFileSync } from 'fs';
import { sitemapRoutes, SITE_URL, type SitemapRoute } from '../src/config/sitemapRoutes';

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateSitemapXml(routes: SitemapRoute[], baseUrl: string): string {
  const today = formatDate(new Date());
  
  const urlEntries = routes
    .map(route => {
      const loc = route.path === '/' 
        ? baseUrl 
        : `${baseUrl}${route.path}`;
      const lastmod = route.lastmod || today;
      
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

// Generate and write sitemap
const sitemap = generateSitemapXml(sitemapRoutes, SITE_URL);
const outputPath = './public/sitemap.xml';

writeFileSync(outputPath, sitemap, 'utf-8');
console.log(`✅ Sitemap generated: ${outputPath}`);
console.log(`   Routes included: ${sitemapRoutes.length}`);
