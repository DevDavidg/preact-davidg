/**
 * The one runnable check on the site's own URLs.
 *
 * A case study decides whether it is the page that was asked for by comparing
 * `location.pathname` against `casePath()`. That comparison was `===`, and
 * `v8_trailingSlashAwareDataRequests` hands the prerenderer the path *with* a
 * trailing slash — so all 32 case study pages shipped as NotFound under
 * `noindex`, and the browser then hydrated the real page over the wrong tree
 * (React #418). Nothing in the repo noticed: `pnpm build` was green throughout,
 * and half the site was a 404 for a crawler.
 *
 * Hence both halves below. `samePath` has to go on reading the two spellings of
 * a URL as one page, and — when a build is on disk — the HTML that actually
 * shipped has to be the case study rather than the 404 page.
 *
 *   pnpm exec tsx scripts/check-routes.ts
 */
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { CASE_SLUGS, COPY, LOCALES, findCase } from '../src/content'
import { casePath, cvPath, homePath, samePath } from '../src/lib/routes'

const every = LOCALES.flatMap((locale) =>
  CASE_SLUGS.map((slug) => ({ locale, slug, path: casePath(locale, slug) })),
)

/* ------------------------------------------------------------- the comparison */

// The regression itself: the prerenderer's spelling of a case URL has to satisfy
// the guard that the browser's spelling satisfies.
for (const { path } of every) {
  assert.ok(samePath(`${path}/`, path), `${path}/ was not recognised as ${path}`)
  assert.ok(samePath(path, `${path}/`), 'samePath must be symmetric')
}
for (const locale of LOCALES) {
  assert.ok(samePath(`${homePath(locale)}/`, homePath(locale)), 'home rejects its own slash')
  assert.ok(samePath(`${cvPath(locale)}/`, cvPath(locale)), 'cv rejects its own slash')
}

// ...and it stays a comparison. Normalising a trailing slash away must not start
// matching pages that are genuinely different, or the guard protects nothing and
// every slug renders every other slug's case study.
assert.ok(!samePath(casePath('es', 'ag-valores'), casePath('es', 'rally')), 'slugs collapsed')
assert.ok(!samePath(casePath('es', 'rally'), casePath('en', 'rally')), 'locales collapsed')
assert.ok(!samePath('/es/proyectos/', '/es/proyectos/ag-valores'), 'parent matched its child')
assert.ok(!samePath('/es', '/es/cv'), 'a prefix is not a path')

/* --------------------------------------------------------------- the shipped HTML */

const CLIENT = join(process.cwd(), 'build', 'client')
const built = await stat(CLIENT).then(
  (info) => info.isDirectory(),
  () => false,
)

if (!built) {
  console.log(`routes ok — ${every.length} case paths, comparison only (no build to read)`)
  process.exit(0)
}

// React escapes exactly these three in text; titles here carry em dashes and
// ampersands, and the UTF-8 output leaves the dashes alone.
const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

for (const { locale, slug, path } of every) {
  const study = findCase(locale, slug)
  assert.ok(study, `${path} has no case study behind it`)

  const html = await readFile(join(CLIENT, path, 'index.html'), 'utf8')
  const notFound = COPY[locale].notFound.title

  assert.ok(!html.includes(notFound), `${path} prerendered as the 404 page`)
  assert.ok(!html.includes('noindex'), `${path} shipped noindex — it is indexable content`)
  assert.ok(
    html.includes(`<title>${escape(study.title)} —`),
    `${path} is missing its own <title>`,
  )
  assert.ok(html.includes(`>${escape(study.title)}</h1>`), `${path} is missing its <h1>`)
  // The canonical is the whole reason the slash matters: two URLs for one page are
  // only safe while both of them name the same one. Compared as a path so the check
  // does not also depend on whatever origin the build was configured with.
  const canonical = /rel="canonical" href="([^"]*)"/.exec(html)?.[1]
  assert.equal(
    canonical?.replace(/^https?:\/\/[^/]+/, ''),
    path,
    `${path} points its canonical at ${canonical}`,
  )
}

console.log(`routes ok — ${every.length} case pages prerendered as themselves, canonical clean`)
