/**
 * A quick smoke check against the built output: what the capability gate decides,
 * whether hydration is clean, and which requests fail.
 *
 * Run with: pnpm exec tsx scripts/diagnose.ts [path]
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium, type Browser } from '@playwright/test'

const ROOT = join(process.cwd(), 'build', 'client')
const PORT = 4321
const TARGETS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['/es', '/en', '/es/proyectos/andina-art', '/en/cv', '/404']

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

const main = async () => {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)
    for (const candidate of [
      join(ROOT, normalize(url.pathname)),
      join(ROOT, normalize(url.pathname), 'index.html'),
    ]) {
      try {
        const info = await stat(candidate)
        if (!info.isFile()) continue
        response.writeHead(200, {
          'content-type': MIME[extname(candidate)] ?? 'application/octet-stream',
        })
        response.end(await readFile(candidate))
        return
      } catch {
        /* next candidate */
      }
    }
    response.writeHead(404).end('not found')
  })
  await new Promise<void>((resolve) => server.listen(PORT, resolve))

  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })

  let failures = 0
  for (const target of TARGETS) {
    failures += await check(browser, target)
  }

  await browser.close()
  await new Promise<void>((resolve) => server.close(() => resolve()))

  if (failures > 0) {
    console.error(`\n${failures} route${failures === 1 ? '' : 's'} reported problems.`)
    process.exitCode = 1
  }
}

const check = async (browser: Browser, target: string): Promise<number> => {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    // `DG_REDUCED=1` exercises the static experience.
    reducedMotion: process.env.DG_REDUCED ? 'reduce' : 'no-preference',
  })

  const errors: string[] = []
  const failed: string[] = []
  const requests: string[] = []
  page.on('request', (request) => requests.push(request.url()))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
  page.on('response', (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`)
  })

  await page.goto(`http://localhost:${PORT}${target}`, { waitUntil: 'load' })
  await page.waitForTimeout(4000)

  const report = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    let webgl2 = false
    let webgl2Error = ''
    try {
      webgl2 = Boolean(canvas.getContext('webgl2'))
    } catch (error) {
      webgl2Error = String(error)
    }
    return {
      webgl2,
      webgl2Error,
      canvases: document.querySelectorAll('canvas').length,
      preflightDone: Boolean(document.querySelector('[data-done="true"]')),
      h1: document.querySelector('h1')?.textContent ?? null,
      lang: document.documentElement.lang,
      hardwareConcurrency: navigator.hardwareConcurrency,
      innerWidth: window.innerWidth,
      coarse: window.matchMedia('(pointer: coarse)').matches,
      reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      // The site reports its own capability decision through this channel.
      events: (window as { dgAnalytics?: { name: string; detail?: string }[] })
        .dgAnalytics?.map((event) =>
          event.detail ? `${event.name}:${event.detail}` : event.name,
        ),
    }
  })

  console.log(`\n--- ${target} ---`)
  console.log(report)
  const engine = requests
    .map((url) => url.split('/').pop() ?? '')
    .filter((file) => /^(three|ReactorScene|runtime|gsap|lenis)[-.]/i.test(file))
  console.log(`engine chunks requested: ${engine.length ? engine.join(', ') : 'none'}`)
  if (failed.length) {
    console.log(`failed requests (${failed.length}):`)
    failed.slice(0, 10).forEach((f) => console.log(`  ${f}`))
  }
  if (errors.length) {
    console.log(`console errors (${errors.length}):`)
    errors.slice(0, 10).forEach((e) => console.log(`  ${e}`))
  }
  if (!failed.length && !errors.length) console.log('clean')

  await page.close()
  return failed.length + errors.length > 0 ? 1 : 0
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
