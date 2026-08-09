/**
 * Writes `sitemap.xml` and `robots.txt` into the build output.
 *
 * Generated from the same manifest that drives prerendering, so the sitemap can
 * only ever contain URLs that were actually built. A hand-maintained sitemap drifts
 * the first time a route is added, and a sitemap listing a 404 is worse than none.
 *
 * Each entry carries its `hreflang` alternates, which is what tells a search engine
 * that `/es/...` and `/en/...` are the same page in two languages rather than two
 * competing pages.
 *
 * Run as part of `pnpm build`.
 */
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { LOCALES } from '../src/content/index'
import { NOT_FOUND_PATH, staticPaths, translatePath } from '../src/lib/routes'
import { absoluteUrl, SITE_ORIGIN } from '../src/lib/site'

const OUT_DIR = join(process.cwd(), 'build', 'client')

/** The 404 page is prerendered but must never be advertised. */
const indexable = (path: string) => path !== NOT_FOUND_PATH

const priorityFor = (path: string) => {
  if (path === '/') return '0.5'
  if (/^\/[a-z]{2}$/.test(path)) return '1.0'
  if (path.endsWith('/cv')) return '0.7'
  return '0.8'
}

const urlEntry = (path: string) => {
  const alternates = LOCALES.map(
    (locale) =>
      `    <xhtml:link rel="alternate" hreflang="${locale}" href="${absoluteUrl(
        translatePath(path, locale),
      )}" />`,
  ).join('\n')

  return `  <url>
    <loc>${absoluteUrl(path)}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl('/')}" />
    <changefreq>monthly</changefreq>
    <priority>${priorityFor(path)}</priority>
  </url>`
}

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true })

  const paths = staticPaths().filter(indexable)

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.map(urlEntry).join('\n')}
</urlset>
`

  const robots = `# ${SITE_ORIGIN}
User-agent: *
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml')}
`

  await writeFile(join(OUT_DIR, 'sitemap.xml'), sitemap)
  await writeFile(join(OUT_DIR, 'robots.txt'), robots)

  // Vercel (and most static hosts) serve root `404.html` with a real 404 status.
  // Prerender places the page at `/404/index.html`; mirror it for the host contract.
  await copyFile(join(OUT_DIR, '404', 'index.html'), join(OUT_DIR, '404.html'))

  console.log(`sitemap.xml  ${paths.length} urls`)
  console.log('robots.txt   written')
  console.log('404.html     mirrored from /404/')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
