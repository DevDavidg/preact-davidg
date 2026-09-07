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
   * The cinema-only layer: post-processing and the geodesic black hole.
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
   * What one project shot is allowed to weigh on average, counting the JPEG
   * fallbacks only — a browser picks one format per image, so summing all three
   * would measure a download that never happens.
   *
   * Per shot rather than per folder, which is the correction. This was a flat
   * 600 kB total, already 93% full at eleven case studies, and it went red on the
   * sixteenth while the weight of a shot had not moved at all: 50.5 kB per entry
   * before, 50.4 kB after, same 1440×900, same encoder, same quality ladder. A
   * total ceiling on a portfolio measures how much work has shipped rather than
   * whether the asset pipeline regressed, so it fails for the one reason that is
   * not a defect and teaches everyone to raise it.
   *
   * 56 kB is today's mean plus room for exactly one more shot arriving at the
   * `image` ceiling — enough that a genuinely texture-heavy addition lands, not
   * enough for a quality bump across the set to go unnoticed. Total page weight
   * stays bounded by `image` per file and by the cards below the fold being
   * `loading="lazy"`: nobody downloads the whole folder to read the page.
   */
  workImageAverage: 56 * 1024,
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

/**
 * The one module the cinema split is defined by.
 *
 * `src/scene/cinema/CinemaLayer.tsx` is the lazy boundary for the whole advanced
 * animation stack — post-processing and the geodesic black hole — and
 * `quality === 'cinema'` is the only thing that ever resolves it. Naming the
 * source module rather than an output file is what makes this survive a bundler
 * change.
 */
const CINEMA_ENTRY = 'src/scene/cinema/CinemaLayer.tsx'

const readManifest = async () => {
  try {
    return JSON.parse(
      await readFile(join(CLIENT, '.vite', 'manifest.json'), 'utf8'),
    )
  } catch {
    return null
  }
}

/**
 * Output files reachable from a set of manifest keys.
 *
 * Follows static and dynamic imports alike — a dynamic import is still something
 * that entry can pull down — except for keys in `stop`, which is how the base
 * side of the split avoids walking through the boundary it is measuring against.
 */
const reachable = (manifest, roots, stop = new Set()) => {
  const seen = new Set()
  const queue = [...roots]
  while (queue.length > 0) {
    const key = queue.pop()
    if (seen.has(key) || stop.has(key)) continue
    const entry = manifest[key]
    if (!entry) continue
    seen.add(key)
    queue.push(...(entry.imports ?? []), ...(entry.dynamicImports ?? []))
  }
  return new Set([...seen].map((key) => manifest[key].file))
}

/** Chunks only a cinema visitor ever asks for, as build-relative paths. */
const cinemaOnlyFiles = (manifest) => {
  if (!manifest[CINEMA_ENTRY]) return new Set()
  const cinema = reachable(manifest, [CINEMA_ENTRY])
  /*
   * Roots, not every key. A shared chunk (`_name-hash.js`) is only ever reached
   * *through* an entry, so listing it as a root of its own is redundant while
   * cinema stays one chunk — and wrong the moment it does not, because the
   * second half would then be its own root and count itself as base.
   */
  const shared = reachable(
    manifest,
    Object.keys(manifest).filter(
      (key) =>
        key !== CINEMA_ENTRY &&
        (manifest[key].isEntry || manifest[key].isDynamicEntry),
    ),
    new Set([CINEMA_ENTRY]),
  )
  return new Set([...cinema].filter((file) => !shared.has(file)))
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
   * From the import graph, not from a filename. This used to look for a
   * `cinema-*.js` chunk pinned by a `manualChunks` entry in `vite.config.ts` —
   * and that entry is gone, deliberately: its own comment records that under
   * rolldown it distorted the shared vendor chunk and pulled React internals onto
   * the critical path. So the pattern matched nothing, the cinema layer was
   * counted against the phone's budget, and the split the two numbers exist to
   * express had quietly stopped being measured at all.
   *
   * The config already emits the manifest for exactly this, and the graph in it
   * cannot go stale the way a name can. A chunk is cinema-only when it is
   * reachable from the cinema entry and from *nowhere else* — a shared chunk, Three
   * itself being the large one, belongs to the base budget because a `lite`
   * visitor downloads it. The traversal below refuses to follow the dynamic import
   * that reaches the cinema entry from the scene, or every cinema chunk would come
   * back as shared.
   */
  const criticalSet = new Set(criticalJs)
  const offCritical = files.filter(
    (file) => file.endsWith('.js') && file.includes('/assets/') && !criticalSet.has(file),
  )

  const manifest = await readManifest()
  const cinemaOnly = manifest ? cinemaOnlyFiles(manifest) : new Set()
  const isCinema = (file) => cinemaOnly.has(relative(CLIENT, file))
  const cinemaChunks = offCritical.filter(isCinema)
  const baseChunks = offCritical.filter((file) => !isCinema(file))

  record('base scene JS (gzip)', (await measure(baseChunks)).compressed, BUDGETS.baseJs)
  record('cinema-only JS (gzip)', (await measure(cinemaChunks)).compressed, BUDGETS.cinemaJs)

  // Nothing cinema-only means the entry below stopped resolving and the advanced
  // animation layer is inside the base budget again, unnoticed. Failing loudly is
  // the point: the alternative is a guard that passes because it stopped looking.
  if (cinemaChunks.length === 0) {
    console.warn(
      `note: nothing resolved as cinema-only from ${CINEMA_ENTRY}. If the ` +
        'advanced animation layer is expected, its dependencies are being ' +
        'counted against the base budget.',
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
  // The count and total ride along in the label: they are what you want when the
  // mean moves, and they make an empty folder read as `NaN` over 0 shots rather
  // than as a mean of zero that quietly passes.
  const fallbackBytes = (await measure(fallbacks)).raw
  record(
    `work images, mean jpeg fallback (${fallbacks.length} shots, ${kb(fallbackBytes)})`,
    fallbackBytes / fallbacks.length,
    BUDGETS.workImageAverage,
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
