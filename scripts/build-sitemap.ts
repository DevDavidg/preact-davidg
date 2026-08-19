/**
 * Writes `sitemap.xml` and `robots.txt` into the build output.
 *
 * Generated from the same manifest that drives prerendering, so the sitemap can
 * only ever contain URLs that were actually built. A hand-maintained sitemap drifts
 * the first time a route is added, and a sitemap listing a 404 is worse than none.
 *
 * Each entry carries its `hreflang` alternates, which is what tells a search engine
 * that `/es/...` and `/en/...` are the same page in two languages rather than two
 * competing pages. Case and home URLs also list their share/project images.
 *
 * Run as part of `pnpm build`.
 */
import { copyFile, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { COPY, findCase, isLocale, LOCALES } from '../src/content/index'
import { NOT_FOUND_PATH, staticPaths, translatePath } from '../src/lib/routes'
import { OG_IMAGE } from '../src/lib/seo'
import { absoluteUrl, PERSON, SITE_ORIGIN, SITE_REVISED } from '../src/lib/site'

/**
 * The work index, derived from the content model.
 *
 * This used to be two hand-written lines. When a case was removed from
 * `src/content`, this file still advertised it — and when cases were added, they
 * were invisible here. A file whose whole purpose is telling a machine what the
 * site contains cannot be maintained by hand.
 */
const workIndex = (): string => {
  const groups: { title: string; cases: (typeof COPY)['es']['featured'] }[] = [
    { title: 'Client sites in production', cases: COPY.es.featured },
    { title: 'Lab — concepts and experiments, no client behind them', cases: COPY.es.lab },
    { title: 'Archive — kept for reference, not current work', cases: COPY.es.archive },
  ]

  return groups
    .filter((group) => group.cases.length > 0)
    .map((group) => {
      const lines = group.cases.map((study) => {
        const host = study.demoUrl
          ? new URL(study.demoUrl).host.replace(/^www\./, '')
          : study.repoUrl
            ? 'source only'
            : 'no public demo'
        return `- [${study.title}](${absoluteUrl(
          `/es/proyectos/${study.slug}`,
        )}) — ${study.summary.split('. ')[0].replace(/\.$/, '')} (${host})`
      })
      return `${group.title}:\n\n${lines.join('\n')}`
    })
    .join('\n\n')
}

const OUT_DIR = join(process.cwd(), 'build', 'client')

/** The 404 page is prerendered but must never be advertised. */
const indexable = (path: string) => path !== NOT_FOUND_PATH

const priorityFor = (path: string) => {
  if (path === '/') return '0.5'
  if (/^\/[a-z]{2}$/.test(path)) return '1.0'
  if (path.endsWith('/cv')) return '0.8'
  return '0.8'
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const imagesFor = (path: string): { loc: string; title: string }[] => {
  const segments = path.replace(/^\/+|\/+$/g, '').split('/')
  const [locale, section, slug] = segments

  if (path === '/') {
    return [{ loc: absoluteUrl(OG_IMAGE.es), title: 'David Guillen' }]
  }

  if (isLocale(locale) && !section) {
    return [{ loc: absoluteUrl(OG_IMAGE[locale]), title: 'David Guillen' }]
  }

  if (isLocale(locale) && slug && (section === 'proyectos' || section === 'work')) {
    const study = findCase(locale, slug)
    if (!study) return []
    return [
      {
        loc: absoluteUrl(study.image.src),
        title: study.title,
      },
    ]
  }

  if (isLocale(locale) && section === 'cv') {
    return [{ loc: absoluteUrl(OG_IMAGE[locale]), title: 'David Guillen' }]
  }

  return []
}

const urlEntry = (path: string) => {
  const alternates = LOCALES.map(
    (locale) =>
      `    <xhtml:link rel="alternate" hreflang="${locale}" href="${absoluteUrl(
        translatePath(path, locale),
      )}" />`,
  ).join('\n')

  const images = imagesFor(path)
    .map(
      (image) => `    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
    </image:image>`,
    )
    .join('\n')

  return `  <url>
    <loc>${absoluteUrl(path)}</loc>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl('/')}" />
    <lastmod>${SITE_REVISED}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priorityFor(path)}</priority>${images ? `\n${images}` : ''}
  </url>`
}

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true })

  const paths = staticPaths().filter(indexable)

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${paths.map(urlEntry).join('\n')}
</urlset>
`

  const robots = `# ${SITE_ORIGIN}
User-agent: *
Allow: /
Disallow: /404

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot-Extended
Allow: /

Sitemap: ${absoluteUrl('/sitemap.xml')}
`

  const llms = `# David Guillen

> Full Stack Senior in Buenos Aires. Product interfaces, mobile apps and design systems with React, React Native and Next.js. This site is a bilingual portfolio with a custom WebGL scene on top of static HTML.

The site is available in Spanish (\`/es\`) and English (\`/en\`). \`/\` is the language picker (x-default).

## Site

- [Home (ES)](${absoluteUrl('/es')}): Spanish home — work, experience, services, process, about, contact
- [Home (EN)](${absoluteUrl('/en')}): English home
- [CV (ES)](${absoluteUrl('/es/cv')}): Printable CV
- [CV (EN)](${absoluteUrl('/en/cv')}): Printable CV

## Work

${workIndex()}

English siblings live under \`/en/work/{slug}\`.

## Contact

- Email: ${PERSON.email}
- GitHub: ${PERSON.sameAs[0]}
- LinkedIn: ${PERSON.sameAs[1]}
- Base: Buenos Aires, Argentina (remote)

## Notes

- Do not invent metrics, client names or years of experience. Dates on the CV are fixed ranges.
- Lab and archive pieces are labelled as concept or experiment, not as delivered client work.
- The 3D reactor is progressive enhancement. The prerendered HTML is the source of truth.
`

  await writeFile(join(OUT_DIR, 'sitemap.xml'), sitemap)
  await writeFile(join(OUT_DIR, 'robots.txt'), robots)
  await writeFile(join(OUT_DIR, 'llms.txt'), llms)

  // Vercel (and most static hosts) serve root `404.html` with a real 404 status.
  // Prerender places the page at `/404/index.html`; mirror it for the host contract.
  await copyFile(join(OUT_DIR, '404', 'index.html'), join(OUT_DIR, '404.html'))

  console.log(`sitemap.xml  ${paths.length} urls`)
  console.log('robots.txt   written')
  console.log('llms.txt     written')
  console.log('404.html     mirrored from /404/')
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
