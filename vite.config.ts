import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { writeFileSync } from "fs";

// Sitemap generator plugin
function sitemapPlugin(): Plugin {
  return {
    name: 'generate-sitemap',
    closeBundle: async () => {
      // Dynamic import to avoid issues during dev
      try {
        const { sitemapRoutes, SITE_URL } = await import('./src/config/sitemapRoutes');
        
        const today = new Date().toISOString().split('T')[0];
        
        const urlEntries = sitemapRoutes
          .map((route: { path: string; lastmod?: string; changefreq: string; priority: number }) => {
            const loc = route.path === '/' ? SITE_URL : `${SITE_URL}${route.path}`;
            const lastmod = route.lastmod || today;
            
            return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`;
          })
          .join('\n');

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
        
        writeFileSync('./dist/sitemap.xml', sitemap, 'utf-8');
        console.log(`✅ Sitemap generated with ${sitemapRoutes.length} routes`);
      } catch (error) {
        console.warn('⚠️ Could not generate sitemap:', error);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && sitemapPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
