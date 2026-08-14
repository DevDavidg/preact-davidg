/**
 * Fails the build when the site gets heavier than it is allowed to be.
 *
 * The interesting number is not "total JS" — the 3D scene is deliberately large —
 * it is how much a visitor has to download *before the page is usable*. So the
 * critical figure is computed by walking the actual `<script>` and modulepreload
 * graph of a prerendered HTML file, which is the same set the browser fetches.
 *
 * Run with: pnpm run budget
 */
import { gzipSync } from 'node:zlib'
import { readFile, readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

const CLIENT = join(process.cwd(), 'build', 'client')

const BUDGETS = {
  /** JS the home page loads before it can hydrate. */
  criticalJs: 150 * 1024,
  /** CSS on the critical path. */
  criticalCss: 20 * 1024,
  /**
   * The lazily imported 3D scene, including its share of Three.js.
   *
   * Raised from 320 kB when the corridor gained the operator layer: the three
   * module bays and their chassis, the uplink handshake, the pointer probe, the
   * signal conduits and the voxel portrait. That work landed at ~319 kB, which
   * technically still fit — but a budget with 700 bytes of headroom stops being
   * a guard and becomes a tripwire, so this leaves room to work in.
   *
   * Note what this number is and is not. It sums *every* chunk that is not on
   * the critical path, so splitting work into a lazier chunk makes it go up, not
   * down — per-chunk overhead is real and the sum is unchanged otherwise. It is
   * a ceiling on how much JavaScript the site can ever ask for, which is the
   * useful guard; it is not the scene's first payload.
   */
  sceneJs: 330 * 1024,
  /** All self-hosted fonts together. */
  fonts: 120 * 1024,
  /** Any single project image, in any format. */
  image: 150 * 1024,
  /**
   * Every project image a browser could download while reading the page, counting
   * the JPEG fallbacks only — a browser picks one format per image, so summing all
   * three would measure a download that never happens.
   */
  workImages: 600 * 1024,
}

const gzip = (buffer) => gzipSync(buffer, { level: 9 }).length

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`

const walk = async (dir) => {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await walk(path)))
      continue
    }
    out.push(path)
  }
  return out
}

/** Every asset the given HTML file pulls in before it is interactive. */
const criticalAssets = async (htmlPath) => {
  const html = await readFile(htmlPath, 'utf8')
  const hrefs = new Set()
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) {
    hrefs.add(match[1])
  }
  return [...hrefs]
}

const measure = async (paths) => {
  let raw = 0
  let compressed = 0
  for (const path of paths) {
    const buffer = await readFile(path)
    raw += buffer.byteLength
    compressed += gzip(buffer)
  }
  return { raw, compressed }
}

const results = []
const record = (label, actual, budget) => {
  results.push({ label, actual, budget, pass: actual <= budget })
}

const main = async () => {
  try {
    await stat(CLIENT)
  } catch {
    console.error('No build found. Run `pnpm build` first.')
    process.exitCode = 1
    return
  }

  const files = await walk(CLIENT)

  // Critical path, measured from the Spanish home page.
  const home = join(CLIENT, 'es', 'index.html')
  const critical = await criticalAssets(home)
  const criticalJs = critical
    .filter((href) => href.endsWith('.js'))
    .map((href) => join(CLIENT, href.slice(1)))
  const criticalCss = critical
    .filter((href) => href.endsWith('.css'))
    .map((href) => join(CLIENT, href.slice(1)))

  record('critical JS (gzip)', (await measure(criticalJs)).compressed, BUDGETS.criticalJs)
  record('critical CSS (gzip)', (await measure(criticalCss)).compressed, BUDGETS.criticalCss)

  // The scene: every chunk that is not on the critical path.
  const criticalSet = new Set(criticalJs)
  const sceneChunks = files.filter(
    (file) => file.endsWith('.js') && file.includes('/assets/') && !criticalSet.has(file),
  )
  record('scene JS (gzip)', (await measure(sceneChunks)).compressed, BUDGETS.sceneJs)

  const fonts = files.filter((file) => file.endsWith('.woff2'))
  // Fonts are already compressed; gzip would misreport them.
  record('fonts (raw)', (await measure(fonts)).raw, BUDGETS.fonts)

  const images = files.filter((file) => /\.(jpg|jpeg|png|avif|webp)$/.test(file))
  for (const image of images) {
    const { size } = await stat(image)
    // Social cards are fetched by scrapers, not by visitors, so they are exempt.
    if (image.includes('/social/')) continue
    record(`image ${relative(CLIENT, image)}`, size, BUDGETS.image)
  }

  const fallbacks = images.filter(
    (file) => file.includes('/work/') && /\.jpe?g$/.test(file),
  )
  record(
    'work images, jpeg fallbacks',
    (await measure(fallbacks)).raw,
    BUDGETS.workImages,
  )

  const width = Math.max(...results.map((r) => r.label.length))
  let failed = 0
  for (const result of results) {
    const mark = result.pass ? 'ok  ' : 'FAIL'
    if (!result.pass) failed += 1
    console.log(
      `${mark} ${result.label.padEnd(width)}  ${kb(result.actual).padStart(10)} / ${kb(
        result.budget,
      ).padStart(10)}`,
    )
  }

  if (failed > 0) {
    console.error(`\n${failed} budget${failed === 1 ? '' : 's'} exceeded.`)
    process.exitCode = 1
    return
  }
  console.log('\nAll budgets met.')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
