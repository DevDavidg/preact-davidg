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
   * The 3D scene as every visitor who gets one receives it.
   *
   * This is the number that protects a phone. Every device narrower than 1100px
   * or with a coarse pointer resolves to `lite` (see `src/scene/capability.ts`),
   * and `lite` never touches the cinema chunk below — so this budget is what a
   * phone can actually be asked to download, and it does not move.
   *
   * It was previously called `sceneJs` and summed *every* non-critical chunk,
   * which made it impossible to say "desktop may have more" without also saying
   * "phones may have more". Splitting the two is what let the advanced animation
   * stack land at all: the ceiling that matters stayed exactly where it was.
   *
   * Note what this number is and is not. It sums every non-cinema chunk off the
   * critical path, so moving work into a lazier chunk makes it go up, not down —
   * per-chunk overhead is real and the sum is otherwise unchanged. It is a
   * ceiling on how much JavaScript a `lite` visitor can ever ask for; it is not
   * the scene's first payload.
   */
  baseJs: 330 * 1024,
  /**
   * The cinema-only layer: post-processing, transmission materials, the Theatre
   * timeline, the physics solver and the Rive runtime.
   *
   * Gated twice over — `quality === 'cinema'` requires a fine pointer and a
   * viewport at least 1100px wide, and `usePerformanceGovernor` can demote out of
   * it from measured frame time. A visitor who does not clear both bars never
   * requests this chunk, which is why it is allowed to be large.
   *
   * It is still a real guard rather than a rubber stamp: this stack is heavy
   * enough that it is easy to add a fifth library without noticing, and the point
   * of the number is that doing so has to be a decision someone writes down.
   */
  cinemaJs: 1_500 * 1024,
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

  /*
   * Off the critical path, split by who actually downloads it.
   *
   * `cinema-*.js` is pinned by name in `vite.config.ts` — a `manualChunks` entry
   * rather than a filename guess, because a guess that stops matching would fail
   * open and silently stop guarding anything.
   */
  const criticalSet = new Set(criticalJs)
  const offCritical = files.filter(
    (file) => file.endsWith('.js') && file.includes('/assets/') && !criticalSet.has(file),
  )
  const isCinema = (file) => /\/cinema-[^/]*\.js$/.test(file)
  const cinemaChunks = offCritical.filter(isCinema)
  const baseChunks = offCritical.filter((file) => !isCinema(file))

  record('base scene JS (gzip)', (await measure(baseChunks)).compressed, BUDGETS.baseJs)
  record('cinema-only JS (gzip)', (await measure(cinemaChunks)).compressed, BUDGETS.cinemaJs)

  // A cinema chunk that measures zero means the manualChunks entry stopped
  // matching and its contents are now inside the base budget, unnoticed.
  if (cinemaChunks.length === 0) {
    console.warn(
      'note: no cinema-* chunk was emitted. If the advanced animation layer is ' +
        'expected, its dependencies are being counted against the base budget.',
    )
  }

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
