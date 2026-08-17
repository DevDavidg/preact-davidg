/**
 * Recaptures the project screenshots from the live demos.
 *
 * Three of the committed shots were misleading rather than merely dated: the store
 * looked like a blank page because its catalogue loads after first paint, and the
 * old portfolio was caught mid-typewriter so its own strapline read as truncated.
 * A screenshot that shows a broken page is worse than no screenshot, so this waits
 * for the network to settle, scrolls to trigger lazy content, scrolls back and only
 * then captures.
 *
 * Run with: pnpm run shots
 */
import { createServer } from 'node:http'
import { mkdir, readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium, type Browser } from '@playwright/test'
import { COPY } from '../src/content/index'

const OUT_DIR = join(process.cwd(), 'public', 'work')

/** 16:10, matching the aspect the cards and the 3D panels are built for. */
const VIEWPORT = { width: 1600, height: 1000 }

interface Shot {
  slug: string
  file: string
  url: string
  /** Settle time before capture, in milliseconds. */
  settle: number
}

/**
 * How long each hero needs before it is showing its finished state.
 *
 * Several of these demos animate on load, and capturing too early produces a
 * screenshot that misrepresents the work: the art-direction landing assembles its
 * painting out of particles, so an early frame shows confetti instead of the piece,
 * and the archived portfolio types its strapline character by character.
 */
const SETTLE: Record<string, number> = {
  'landing-davinci': 9000,
  'david-g-dev': 7000,
  fueradecontexto: 4000,
  'ag-valores': 2500,
  nonconformist: 2500,
}

const DEFAULT_SETTLE = 1500

/** Derived from the content model so a new case cannot be forgotten here. */
const shots = (): Shot[] => {
  const cases = [...COPY.es.featured, ...COPY.es.lab, ...COPY.es.archive]
  return cases
    // This site is captured from the local build instead; see `captureSelf`.
    .filter((study) => study.demoUrl && study.slug !== 'signal-reactor')
    .map((study) => ({
      slug: study.slug,
      file: study.image.src.replace('/work/', ''),
      url: study.demoUrl!,
      settle: SETTLE[study.slug] ?? DEFAULT_SETTLE,
    }))
}

/** `pnpm run shots landing-davinci` retakes one shot without touching the rest. */
const requested = process.argv.slice(2)
const wanted = (slug: string) =>
  requested.length === 0 || requested.includes(slug)

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

/** Minimal static server for the prerendered output, so the site can shoot itself. */
const serveBuild = async (root: string, port: number) => {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://localhost:${port}`)
    const candidates = [
      join(root, normalize(url.pathname)),
      join(root, normalize(url.pathname), 'index.html'),
    ]

    for (const candidate of candidates) {
      try {
        const info = await stat(candidate)
        if (!info.isFile()) continue
        response.writeHead(200, {
          'content-type': MIME[extname(candidate)] ?? 'application/octet-stream',
        })
        response.end(await readFile(candidate))
        return
      } catch {
        // Try the next candidate.
      }
    }

    response.writeHead(404).end('not found')
  })

  await new Promise<void>((resolve) => server.listen(port, resolve))
  return () => new Promise<void>((resolve) => server.close(() => resolve()))
}

/**
 * The Signal Reactor case is this site, so its screenshot comes from the built
 * output. It waits for the preflight overlay to clear — the signal that the renderer
 * has presented a frame — and shoots the opening chapter, where the monogram, the
 * core and the headline are all in frame. An earlier version scrolled into the
 * gallery, which produced a screenshot of the *other* case studies.
 */
const captureSelf = async (browser: Browser) => {
  const root = join(process.cwd(), 'build', 'client')
  try {
    await stat(join(root, 'es', 'index.html'))
  } catch {
    console.warn('skipped signal-reactor.jpg: no build found, run `pnpm build` first')
    return
  }

  const port = 4319
  const close = await serveBuild(root, port)
  const page = await browser.newPage({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  })

  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text())
  })
  page.on('pageerror', (error) => problems.push(error.message))

  try {
    await page.goto(`http://localhost:${port}/es`, { waitUntil: 'load' })

    // Wait for the canvas rather than for a timer. This has to be quick: headless
    // Chromium renders through SwiftShader at software speed, so the performance
    // governor will — correctly — abandon the scene after a few slow seconds, and a
    // late capture would show the document-only experience.
    await page
      .waitForSelector('canvas', { timeout: 12_000 })
      .catch(() => undefined)

    // A nudge into the first chapter so the reactor core has begun to charge, then
    // just enough time for the camera damping to settle.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.22))
    // Long enough for the instrument cluster to fade back out, so the shot shows the
    // reading state rather than the mid-scroll state.
    await page.waitForTimeout(2100)

    const canvases = await page.locator('canvas').count()
    await page.screenshot({
      path: join(OUT_DIR, 'signal-reactor.jpg'),
      type: 'jpeg',
      quality: 92,
    })
    console.log(
      `captured signal-reactor.jpg  (local build, ${canvases} canvas${
        canvases === 1 ? '' : 'es'
      })`,
    )
    if (canvases === 0) {
      console.warn(
        '  no canvas: the capability gate declined WebGL in this browser, so the ' +
          'shot shows the document-only experience',
      )
    }
    for (const problem of problems.slice(0, 5)) console.warn(`  console: ${problem}`)
  } catch (error) {
    console.warn(
      `skipped signal-reactor.jpg: ${error instanceof Error ? error.message : error}`,
    )
  } finally {
    await page.close()
    await close()
  }
}

const main = async () => {
  await mkdir(OUT_DIR, { recursive: true })

  // Headless Chromium has no GPU, so WebGL has to be routed through SwiftShader.
  // Without these flags the capability gate correctly declines the scene and every
  // capture would be of the document-only experience.
  const browser = await chromium.launch({
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      // Some client sites (CDN / WAF) refuse bare headless Chromium.
      '--disable-blink-features=AutomationControlled',
    ],
  })
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    // Screenshots are documentation, not a performance test: let everything land.
    reducedMotion: 'no-preference',
    locale: 'es-AR',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    extraHTTPHeaders: {
      'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
    },
  })
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
  })

  for (const shot of shots()) {
    if (!wanted(shot.slug)) continue
    const page = await context.newPage()
    try {
      await page.goto(shot.url, { waitUntil: 'load', timeout: 45_000 })
      await page
        .waitForLoadState('networkidle', { timeout: 20_000 })
        .catch(() => undefined)

      // Trigger anything that only loads once it scrolls into view, then return
      // to the top so the capture is still of the hero.
      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2))
      await page.waitForTimeout(900)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(shot.settle)

      await page.screenshot({
        path: join(OUT_DIR, shot.file),
        type: 'jpeg',
        quality: 92,
      })
      console.log(`captured ${shot.file}  ${shot.url}`)
    } catch (error) {
      console.warn(
        `skipped ${shot.file}: ${error instanceof Error ? error.message : error}`,
      )
    } finally {
      await page.close()
    }
  }

  if (wanted('signal-reactor')) {
    await captureSelf(browser)
  }
  await browser.close()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
