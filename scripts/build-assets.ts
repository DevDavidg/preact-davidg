/**
 * Turns raw captures into the assets the site ships.
 *
 * Three jobs, all derived from the content model so nothing has to be kept in
 * sync by hand:
 *
 * 1. Recompress every project shot to the size it is actually displayed at. The
 *    art-direction case was a 770 kB JPEG for a card rendered at half the
 *    viewport — the single heaviest thing on the page by an order of magnitude.
 * 2. Render the social cards. There were none, so every share on LinkedIn,
 *    WhatsApp or Slack fell back to whatever the scraper guessed.
 * 3. Render the icon set. The favicon was a violet lightning bolt from an
 *    unrelated project.
 *
 * Run with: pnpm run assets
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { COPY, LOCALES } from '../src/content/index'
import { PERSON, SITE_HOST } from '../src/lib/site'

const PUBLIC_DIR = join(process.cwd(), 'public')
const WORK_DIR = join(PUBLIC_DIR, 'work')
const SOCIAL_DIR = join(PUBLIC_DIR, 'social')
const ICON_DIR = join(PUBLIC_DIR, 'icons')

/** Palette, mirrored from `app/theme.css`. */
const REACTOR = '#050608'
const GRAPHITE = '#0d1117'
const INK = '#f3eee4'
const INK_DIM = '#9a948c'
const IGNITION = '#ffb454'

/**
 * Project shots are shown at half a wide viewport at most, so 1440 px covers a
 * 2× display of a 720 px slot. Beyond that the bytes buy nothing.
 */
const SHOT_WIDTH = 1440
const SHOT_HEIGHT = 900

/** Ceiling per shot, matching the budget script so the two cannot disagree. */
const SHOT_MAX_BYTES = 140 * 1024

const shotSources = () => {
  const cases = [...COPY.es.featured, ...COPY.es.lab, ...COPY.es.archive]
  return cases.map((study) => study.image.src.replace('/work/', ''))
}

type Encoder = (pipeline: sharp.Sharp, quality: number) => Promise<Buffer>

/**
 * Encodes down to a byte ceiling instead of trusting one quality number.
 *
 * A flat quality setting produces wildly different sizes depending on content: at
 * q74 the flat UI screenshots landed around 20 kB while the oil-painting hero — all
 * texture and noise — came out at 207 kB. Stepping the quality down until the file
 * fits keeps the clean shots pristine and only degrades the one that has to give.
 */
const encodeWithinBudget = async (
  pipeline: sharp.Sharp,
  encode: Encoder,
  maxBytes: number,
  qualities: number[],
): Promise<{ buffer: Buffer; quality: number }> => {
  let last: { buffer: Buffer; quality: number } | null = null
  for (const quality of qualities) {
    const buffer = await encode(pipeline.clone(), quality)
    last = { buffer, quality }
    if (buffer.byteLength <= maxBytes) return last
  }
  return last!
}

const optimiseShots = async () => {
  for (const file of shotSources()) {
    const source = join(WORK_DIR, file)
    let input: Buffer
    try {
      input = await readFile(source)
    } catch {
      console.warn(`missing ${file} — run \`pnpm run shots\` first`)
      continue
    }

    const base = sharp(input).resize(SHOT_WIDTH, SHOT_HEIGHT, {
      fit: 'cover',
      position: 'top',
    })

    // Progressive JPEG with mozjpeg: the fallback every browser understands.
    const jpeg = await encodeWithinBudget(
      base,
      (pipeline, quality) =>
        pipeline.jpeg({ quality, progressive: true, mozjpeg: true }).toBuffer(),
      SHOT_MAX_BYTES,
      [78, 72, 66, 60, 54, 48, 42],
    )
    await writeFile(source, jpeg.buffer)

    const stem = file.replace(/\.jpe?g$/, '')
    const parts = [`jpeg ${(jpeg.buffer.byteLength / 1024).toFixed(0).padStart(4)} kB q${jpeg.quality}`]

    // Modern formats are only worth shipping when they actually win. WebP is poor
    // at film grain and came out larger than JPEG on the painted hero; writing it
    // anyway would mean serving the *heavier* file to the newer browser.
    const webp = await encodeWithinBudget(
      base,
      (pipeline, quality) => pipeline.webp({ quality, effort: 5 }).toBuffer(),
      Math.min(SHOT_MAX_BYTES, jpeg.buffer.byteLength),
      [80, 74, 68, 62, 56, 50],
    )
    if (webp.buffer.byteLength < jpeg.buffer.byteLength) {
      await writeFile(join(WORK_DIR, `${stem}.webp`), webp.buffer)
      parts.push(`webp ${(webp.buffer.byteLength / 1024).toFixed(0).padStart(4)} kB`)
    } else {
      await rm(join(WORK_DIR, `${stem}.webp`), { force: true })
      parts.push('webp  —')
    }

    const avif = await encodeWithinBudget(
      base,
      (pipeline, quality) => pipeline.avif({ quality, effort: 5 }).toBuffer(),
      Math.min(SHOT_MAX_BYTES, jpeg.buffer.byteLength),
      [62, 56, 50, 44, 38],
    )
    if (avif.buffer.byteLength < jpeg.buffer.byteLength) {
      await writeFile(join(WORK_DIR, `${stem}.avif`), avif.buffer)
      parts.push(`avif ${(avif.buffer.byteLength / 1024).toFixed(0).padStart(4)} kB`)
    } else {
      await rm(join(WORK_DIR, `${stem}.avif`), { force: true })
      parts.push('avif  —')
    }

    console.log(`${stem.padEnd(20)} ${parts.join('  ')}`)
  }
}

/** The portrait is square and displayed at 22 rem, so 720 px covers 2×. */
const optimisePortrait = async () => {
  const source = join(PUBLIC_DIR, 'about', 'david-portrait.jpg')
  const input = await readFile(source).catch(() => null)
  if (!input) return

  const base = sharp(input).resize(720, 720, { fit: 'cover' })
  const jpeg = await base
    .clone()
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toBuffer()
  await writeFile(source, jpeg)

  await writeFile(
    join(PUBLIC_DIR, 'about', 'david-portrait.webp'),
    await base.clone().webp({ quality: 80, effort: 5 }).toBuffer(),
  )
  await writeFile(
    join(PUBLIC_DIR, 'about', 'david-portrait.avif'),
    await base.clone().avif({ quality: 62, effort: 5 }).toBuffer(),
  )
  console.log(`portrait             jpeg ${(jpeg.byteLength / 1024).toFixed(0)} kB`)
}

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (char) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[char]!,
  )

/**
 * Share cards, drawn as SVG and rasterised.
 *
 * Composed rather than screenshotted: a share card has to read at thumbnail size
 * in a chat list, which a shrunken page never does.
 */
const buildSocialCards = async () => {
  await mkdir(SOCIAL_DIR, { recursive: true })

  for (const locale of LOCALES) {
    const copy = COPY[locale]
    const headline = escapeXml(copy.hero.headline)
    const stack = escapeXml(copy.hero.factStack)

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${REACTOR}"/>
      <stop offset="1" stop-color="${GRAPHITE}"/>
    </linearGradient>
    <radialGradient id="core" cx="0.86" cy="0.22" r="0.5">
      <stop offset="0" stop-color="${IGNITION}" stop-opacity="0.5"/>
      <stop offset="1" stop-color="${IGNITION}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#core)"/>

  <!-- The corridor grid, echoing the scene's floor. -->
  <g stroke="${INK}" stroke-opacity="0.07" stroke-width="1">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${(i + 1) * 52}" x2="1200" y2="${(i + 1) * 52}"/>`).join('')}
    ${Array.from({ length: 16 }, (_, i) => `<line x1="${(i + 1) * 75}" y1="0" x2="${(i + 1) * 75}" y2="630"/>`).join('')}
  </g>

  <rect x="0" y="0" width="1200" height="4" fill="${IGNITION}"/>

  <text x="80" y="132" font-family="IBM Plex Mono, monospace" font-size="20"
        letter-spacing="4" fill="${IGNITION}">DAVID GUILLEN</text>
  <text x="80" y="168" font-family="IBM Plex Mono, monospace" font-size="20"
        letter-spacing="4" fill="${INK_DIM}">${escapeXml(PERSON.jobTitle.toUpperCase())}</text>

  <text x="80" y="330" font-family="Bricolage Grotesque, Helvetica, sans-serif"
        font-size="74" font-weight="600" letter-spacing="-2" fill="${INK}">
    <tspan x="80" dy="0">${headline.split(' ').slice(0, 3).join(' ')}</tspan>
    <tspan x="80" dy="86">${headline.split(' ').slice(3).join(' ')}</tspan>
  </text>

  <line x1="80" y1="470" x2="1120" y2="470" stroke="${INK}" stroke-opacity="0.14"/>
  <text x="80" y="522" font-family="IBM Plex Mono, monospace" font-size="21"
        letter-spacing="3" fill="${INK_DIM}">${stack}</text>
  <text x="80" y="562" font-family="IBM Plex Mono, monospace" font-size="21"
        letter-spacing="3" fill="${INK_DIM}">${escapeXml(SITE_HOST)}</text>
</svg>`

    const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()
    await writeFile(join(SOCIAL_DIR, `og-${locale}.png`), png)
    console.log(`og-${locale}.png          ${(png.byteLength / 1024).toFixed(0)} kB`)
  }
}

/**
 * The icon set. A DG monogram on the reactor black, so a bookmark or a home-screen
 * shortcut belongs to the same system as the site.
 */
const monogramSvg = (size: number, radius: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${radius}" fill="${REACTOR}"/>
  <rect x="4" y="4" width="56" height="56" rx="${Math.max(radius - 3, 0)}"
        fill="none" stroke="${IGNITION}" stroke-opacity="0.35" stroke-width="1.5"/>
  <text x="32" y="43" text-anchor="middle"
        font-family="Bricolage Grotesque, Helvetica, sans-serif"
        font-size="30" font-weight="700" letter-spacing="-1.5" fill="${INK}">DG</text>
</svg>`

const buildIcons = async () => {
  await mkdir(ICON_DIR, { recursive: true })

  // Apple ignores transparency and rounds the corners itself, so it gets a square.
  const apple = await sharp(Buffer.from(monogramSvg(180, 0)))
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(join(ICON_DIR, 'apple-touch-icon.png'), apple)

  for (const size of [192, 512]) {
    const png = await sharp(Buffer.from(monogramSvg(size, 12)))
      .png({ compressionLevel: 9 })
      .toBuffer()
    await writeFile(join(ICON_DIR, `icon-${size}.png`), png)
  }

  // The SVG favicon is the primary: it stays sharp at any size and is ~400 bytes.
  await writeFile(join(PUBLIC_DIR, 'favicon.svg'), monogramSvg(64, 12).trim())

  // `/favicon.ico` still gets requested by crawlers and older scrapers.
  const ico = await sharp(Buffer.from(monogramSvg(48, 8)))
    .resize(48, 48)
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(join(PUBLIC_DIR, 'favicon.ico'), ico)

  await writeFile(
    join(PUBLIC_DIR, 'manifest.webmanifest'),
    `${JSON.stringify(
      {
        id: '/',
        name: 'David Guillen — Full Stack Senior',
        short_name: 'David Guillen',
        description:
          'Full Stack Senior in Buenos Aires. Product interfaces, apps and design systems with React, React Native and Next.js.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/es',
        scope: '/',
        display: 'standalone',
        background_color: REACTOR,
        theme_color: REACTOR,
        categories: ['portfolio', 'developer'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      null,
      2,
    )}\n`,
  )
  console.log('icons + manifest    written')
}

const main = async () => {
  await optimiseShots()
  await optimisePortrait()
  await buildSocialCards()
  await buildIcons()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
