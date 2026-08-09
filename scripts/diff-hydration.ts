/**
 * Locates a hydration mismatch by comparing the prerendered HTML with the DOM after
 * hydration.
 *
 * React only prints a useful diff in development builds, and the prerender always
 * runs the production build, so this reconstructs the same information from the two
 * artefacts instead.
 *
 * Run with: pnpm exec tsx scripts/diff-hydration.ts [path]
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { chromium } from '@playwright/test'

const ROOT = join(process.cwd(), 'build', 'client')
const PORT = 4322
const TARGET = process.argv[2] ?? '/es'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
}

/** One tag per line, attributes sorted, so a diff is readable. */
const normaliseHtml = (html: string) =>
  html
    .replace(/>\s+</g, '>\n<')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

const main = async () => {
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://localhost:${PORT}`)
    for (const candidate of [
      join(ROOT, normalize(url.pathname)),
      join(ROOT, normalize(url.pathname), 'index.html'),
    ]) {
      try {
        if (!(await stat(candidate)).isFile()) continue
        response.writeHead(200, {
          'content-type': MIME[extname(candidate)] ?? 'application/octet-stream',
        })
        response.end(await readFile(candidate))
        return
      } catch {
        /* next */
      }
    }
    response.writeHead(404).end('not found')
  })
  await new Promise<void>((resolve) => server.listen(PORT, resolve))

  const staticHtml = await readFile(
    join(ROOT, TARGET.replace(/^\//, ''), 'index.html'),
    'utf8',
  )

  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
  await page.goto(`http://localhost:${PORT}${TARGET}`, { waitUntil: 'load' })
  await page.waitForTimeout(2500)
  const liveHtml = await page.evaluate(() => document.documentElement.outerHTML)

  const before = normaliseHtml(staticHtml)
  const after = normaliseHtml(liveHtml)

  // Only report lines unique to one side; the shared bulk is noise.
  const count = (lines: string[]) => {
    const map = new Map<string, number>()
    for (const line of lines) map.set(line, (map.get(line) ?? 0) + 1)
    return map
  }
  const beforeCounts = count(before)
  const afterCounts = count(after)

  const onlyBefore: string[] = []
  const onlyAfter: string[] = []
  for (const [line, n] of beforeCounts) {
    const other = afterCounts.get(line) ?? 0
    for (let i = 0; i < n - other; i += 1) onlyBefore.push(line)
  }
  for (const [line, n] of afterCounts) {
    const other = beforeCounts.get(line) ?? 0
    for (let i = 0; i < n - other; i += 1) onlyAfter.push(line)
  }

  console.log(`\n=== only in prerendered HTML (${onlyBefore.length}) ===`)
  onlyBefore.slice(0, 30).forEach((line) => console.log(`- ${line.slice(0, 200)}`))
  console.log(`\n=== only in hydrated DOM (${onlyAfter.length}) ===`)
  onlyAfter.slice(0, 30).forEach((line) => console.log(`+ ${line.slice(0, 200)}`))

  await browser.close()
  await new Promise<void>((resolve) => server.close(() => resolve()))
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
