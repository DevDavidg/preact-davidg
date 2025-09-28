import { FunctionComponent } from "preact";

const Sitemap: FunctionComponent = () => {
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://preact-davidg.vercel.app/</loc>
    <lastmod>2025-06-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://preact-davidg.vercel.app/projects</loc>
    <lastmod>2025-06-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://preact-davidg.vercel.app/about</loc>
    <lastmod>2025-06-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://preact-davidg.vercel.app/contact</loc>
    <lastmod>2025-06-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://preact-davidg.vercel.app/colors</loc>
    <lastmod>2025-06-26</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

  return (
    <pre style="white-space: pre-wrap; font-family: monospace;">
      {sitemapContent}
    </pre>
  );
};

export default Sitemap;
