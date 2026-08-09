/**
 * Builds the self-hosted font subsets in `public/fonts/`.
 *
 * Google's `latin` subsets of these three families total ~367 kB, and the API's
 * `text=` parameter does not subset variable fonts, so the glyph set is cut
 * locally with HarfBuzz instead. The character set is derived from the content
 * modules rather than guessed, so the files carry exactly the glyphs this site
 * can render and nothing else.
 *
 * A safety margin of printable ASCII, Spanish diacritics and the punctuation the
 * design uses is always included, so a small copy edit cannot silently fall back
 * to a system font.
 *
 * Run with: pnpm run fonts
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import subsetFont from 'subset-font'
import { COPY, LOCALES } from '../src/content/index'

const OUT_DIR = join(process.cwd(), 'public', 'fonts')

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Always-present glyphs: printable ASCII, the Spanish letters and the exact
 * punctuation the design system uses (quotes, dashes, ellipsis, middot, minus).
 */
const SAFETY_GLYPHS =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`' +
  'abcdefghijklmnopqrstuvwxyz{|}~' +
  'áéíóúÁÉÍÓÚñÑüÜ¿¡ºª' +
  'àèìòùâêîôûäëïöçãõÀÈÉÊÔÇ' +
  '·–—…“”‘’«»†•→↗↓×−⁄©®™°%'

/** Every character the site can render, collapsed to a sorted unique string. */
const contentCharset = (): string => {
  const glyphs = new Set<string>(SAFETY_GLYPHS)

  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      for (const char of value) glyphs.add(char)
      return
    }
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach(walk)
    }
  }

  LOCALES.forEach((locale) => walk(COPY[locale]))

  // Newlines and tabs are not glyphs.
  return Array.from(glyphs)
    .filter((char) => char.codePointAt(0)! > 0x1f)
    .sort()
    .join('')
}

type VariationAxes = Record<
  string,
  number | { min: number; max: number; default?: number }
>

interface FamilySpec {
  file: string
  /** `family=` value for the Google Fonts CSS API. */
  query: string
  style: 'normal' | 'italic'
  /**
   * Variable axes are trimmed to the range the design actually animates. The
   * hero heading morphs weight, so `wght` stays a range; optical size is pinned
   * because the site sets one size per role.
   */
  variationAxes?: VariationAxes
}

const FAMILIES: FamilySpec[] = [
  {
    file: 'bricolage-grotesque.woff2',
    query: 'Bricolage+Grotesque:opsz,wght@12..96,400..800',
    style: 'normal',
    variationAxes: { opsz: 48, wght: { min: 400, max: 800, default: 600 } },
  },
  {
    file: 'newsreader.woff2',
    query: 'Newsreader:opsz,wght@6..72,400..600',
    style: 'normal',
    variationAxes: { opsz: 20, wght: { min: 400, max: 600, default: 400 } },
  },
  {
    file: 'newsreader-italic.woff2',
    query: 'Newsreader:ital,opsz,wght@1,6..72,400..500',
    style: 'italic',
    variationAxes: { opsz: 20, wght: 400 },
  },
  {
    file: 'ibm-plex-mono-400.woff2',
    query: 'IBM+Plex+Mono:wght@400',
    style: 'normal',
  },
  {
    file: 'ibm-plex-mono-600.woff2',
    query: 'IBM+Plex+Mono:wght@600',
    style: 'normal',
  },
]

/**
 * Google splits every family into unicode-range blocks. Only the `latin` one is
 * fetched — it is the single block whose range starts at U+0000, and the derived
 * charset is a subset of it. Picking any other block would yield a file with
 * almost none of the glyphs this site needs.
 */
const LATIN_RANGE = 'U+0000-00FF'

const sourceUrl = (css: string, style: FamilySpec['style']): string => {
  const block = css
    .split('@font-face')
    .slice(1)
    .find(
      (entry) =>
        entry.includes(`font-style: ${style}`) && entry.includes(LATIN_RANGE),
    )
  if (!block) throw new Error(`no latin ${style} @font-face block`)
  const url = block.match(/src:\s*url\(([^)]+)\)/)?.[1]
  if (!url) throw new Error(`no src url in latin ${style} block`)
  return url
}

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true })

  const charset = contentCharset()
  console.log(`charset: ${charset.length} glyphs\n`)

  let total = 0
  for (const family of FAMILIES) {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family.query}&display=swap`

    const css = await fetch(cssUrl, { headers: { 'User-Agent': UA } }).then((r) => {
      if (!r.ok) throw new Error(`${cssUrl} → ${r.status}`)
      return r.text()
    })

    const source = Buffer.from(
      await fetch(sourceUrl(css, family.style)).then((r) => {
        if (!r.ok) throw new Error(`font file → ${r.status}`)
        return r.arrayBuffer()
      }),
    )

    const subset = await subsetFont(source, charset, {
      targetFormat: 'woff2',
      ...(family.variationAxes ? { variationAxes: family.variationAxes } : {}),
    })

    await writeFile(join(OUT_DIR, family.file), subset)
    total += subset.byteLength
    console.log(
      `${family.file.padEnd(30)} ${(subset.byteLength / 1024)
        .toFixed(1)
        .padStart(6)} kB  (from ${(source.byteLength / 1024).toFixed(1)} kB)`,
    )
  }

  console.log(`\ntotal ${(total / 1024).toFixed(1)} kB`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
