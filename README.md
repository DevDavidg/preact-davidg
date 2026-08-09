# Signal Reactor — David Guillen's portfolio

A bilingual portfolio built as **static HTML with a real-time WebGL scene layered on
top**. The 3D experience is an upgrade, never a requirement: with no WebGL, on a slow
device, on a metered connection, or with reduced motion requested, the full content is
still served and not a byte of Three.js is downloaded.

React 19 · React Router 7 (static prerender) · Three.js / React Three Fiber · GSAP ·
Tailwind CSS 4 · TypeScript · Vite 8

---

## Getting started

```bash
pnpm install
pnpm run dev          # http://localhost:5173
pnpm run build        # prerenders every route into build/client
```

`pnpm run build` produces a plain static directory. There is no server in production.

### Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm run dev` | Dev server with HMR |
| `pnpm run build` | Prerender all routes, then write `sitemap.xml` and `robots.txt` |
| `pnpm run typecheck` | Route typegen + `tsc -b` |
| `pnpm run lint` | oxlint |
| `pnpm run test` | Unit tests (Vitest) |
| `pnpm run e2e` | End-to-end + accessibility tests against the real build |
| `pnpm run budget` | Fails if the site exceeds its size budgets |
| `pnpm run verify` | `build` → `budget` → route smoke check |

### Asset pipeline

These are run by hand, because they hit the network and change files in `public/`.

| Command | What it does |
| --- | --- |
| `pnpm run fonts` | Downloads and subsets the three font families |
| `pnpm run shots` | Recaptures project screenshots from the live demos |
| `pnpm run assets` | Recompresses images, renders social cards and icons |

`pnpm run shots [slug…]` retakes individual screenshots. The Signal Reactor shot is
taken from the local `build/client`, so build before running it.

### Deployment

Set the canonical origin, or canonical tags, `hreflang`, the sitemap and the social
cards will all point at the default:

```bash
VITE_SITE_ORIGIN=https://your-domain.dev pnpm run build
```

Serve `build/client` as static files, with two rules the tests assume:

1. Unknown paths return **`/404/index.html` with a 404 status** — not a redirect, and
   not the SPA fallback.
2. `/` serves the language gate, which links to both locales.

---

## Architecture

```
app/                    Route modules, the document shell and global CSS
  root.tsx              <html>, head, error boundary
  routes.ts             Localised URL map
  routes/               One module per page
  theme.css             Tailwind theme: the single source of the palette
  scene.css             Stage, fragment arrival, view transitions, print
src/
  content/              All copy, typed. Spanish is the source of truth
  components/           Document UI
  scene/                The WebGL reactor
  motion/               Scroll, the shared tick bus, the lazy motion runtime
  audio/                Opt-in synthesised sound
  hooks/  lib/          Capability detection, routing, SEO, analytics
scripts/                Asset pipeline, budgets and diagnostics
tests/                  Unit and end-to-end suites
```

### Progressive enhancement

The order of operations is the contract:

```
prerendered HTML  →  capability gate  →  scene chunk  →  performance governor
   (complete)        (before import)      (lazy)          (can demote or abandon)
```

| Experience | Canvas | Loop | When |
| --- | --- | --- | --- |
| `static` | none | none at all | Reduced motion, data saver, no WebGL2, or demoted |
| `lite` | on demand | a frame per scroll settle | Touch, narrow, or a weak device |
| `cinema` | continuous | shared GSAP ticker | Capable desktop that holds the frame budget |

Two rules make this hold up:

- **The gate runs before the import.** `src/scene/capability.ts` has no dependency on
  the scene, so a visitor who will never see 3D never downloads it. The end-to-end
  suite asserts zero engine requests in that case.
- **The document is never the fallback path — it is the only path.** Nothing in the
  scene layer hides document text. Earlier versions replaced DOM headings with 3D
  glyphs and made the originals transparent, which broke text selection,
  high-contrast mode and hydration; the 3D typography now renders only decorative
  telemetry that appears nowhere in the document.

### One clock

Lenis, GSAP and the renderer used to run three separate animation frames, so scroll
position, DOM timelines and the camera could each read a different moment.
`src/motion/runtime.ts` now steps Lenis from GSAP's ticker and the scene reads the
values written during that same tick.

Components never import GSAP. They subscribe to `src/motion/ticker.ts`, which has no
dependencies and is simply never called on the static experience — that is what keeps
the animation engine out of the critical bundle.

### Budgets

`pnpm run budget` walks the real `<script>` graph of a prerendered page, so "critical"
means what the browser actually fetches before the page is usable.

| Budget | Limit | Current |
| --- | --- | --- |
| Critical JS (gzip) | 150 kB | ~129 kB |
| Critical CSS (gzip) | 20 kB | ~8 kB |
| Scene JS (gzip, lazy) | 320 kB | ~297 kB |
| Fonts (subsetted) | 120 kB | ~95 kB |
| Any single image | 150 kB | ~136 kB |
| Work images, JPEG fallbacks | 600 kB | ~341 kB |

Two decisions came out of measuring rather than guessing:

- **No post-processing library.** `postprocessing` plus its React bindings cost about
  200 kB gzipped to deliver a bloom that only ever applied to one object, plus grain.
  The bloom is an additive sprite on that object now, and the grain is a static CSS
  overlay.
- **Fonts are subsetted locally.** Google's `latin` subsets of the three families come
  to ~367 kB, and the API's `text=` parameter does not subset variable fonts, so
  `scripts/fetch-fonts.ts` cuts them with HarfBuzz down to ~95 kB.

### Content

Everything the site says lives in `src/content/`, typed against the Spanish shape so a
missing translation is a compile error. Editorial rules the unit tests enforce:

- No metric without public evidence. Personal work is labelled as concept or
  experiment, never as delivered client work.
- No claim that expires — no age, no "N+ years" counter.
- Every call to action promises exactly what its destination does.

Projects are split into **featured**, **lab** and **archive** so a reader can tell
delivered thinking from an experiment without reading the fine print. Featured cases
each get a module in the 3D gallery; the count is asserted against the scene layout.

---

## Diagnostics

Kept in `scripts/` because each one was written to find a real bug:

| Script | Finds |
| --- | --- |
| `diagnose.ts` | What the capability gate decided, failed requests, console errors, per route |
| `diff-hydration.ts` | Hydration mismatches, by diffing prerendered HTML against the hydrated DOM |
| `find-overflow.ts` | Which element causes horizontal scroll at a given width |

```bash
pnpm exec tsx tests/e2e/serve-build.ts &      # serve the build
pnpm exec tsx scripts/diagnose.ts             # all routes
DG_REDUCED=1 pnpm exec tsx scripts/diagnose.ts /es
pnpm exec tsx scripts/find-overflow.ts 320 /es
```

## Testing

```bash
pnpm run test    # content invariants, routing, capability gate, charge curve
pnpm run e2e     # desktop (Chromium + SwiftShader) and mobile (WebKit)
```

The end-to-end suite covers what the architecture claims: the page is complete as
static HTML, every project opens with mouse, touch and keyboard, both locales are
shareable and reciprocal, unknown URLs 404, and the site survives reduced motion, no
WebGL, data saver and a failed scene chunk. Accessibility is checked with axe on every
prerendered route, in both browsers.

## Agents

Project rules live in `.cursor/rules/`, hooks in `.cursor/hooks.json`.
