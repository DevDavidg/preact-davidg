# Architecture — preact-davidg

## Overview

Single-page portfolio. React 19 + TypeScript + Vite. Heavy animation stack (GSAP, Motion, Three/R3F, Lottie, etc.) installed for demos.

## Boundaries

- Browser talks only to the Vite app (`localhost:5173`).
- No backend, database, or private APIs in this repo.
- Secrets never in source; use `.env.local` (gitignored) if needed later.

## Design spec

Product + visual + tech constraints: [`docs/design.md`](./design.md).  
Prototipo Immersivo v3: `REFERENCIA/Portfolio Inmersivo v3.dc.html`.

## Design source (Figma MCP)

UI reference lives in Figma. Agents must use the **Figma MCP** plugin (`plugin-figma-figma`) against this file — not invent screens from scratch. Align with `docs/design.md` (do not invent tokens outside the DS).

| | |
|--|--|
| URL | https://www.figma.com/design/sAMieh52gsQCid784ildNL/Untitled?node-id=0-1 |
| `fileKey` | `sAMieh52gsQCid784ildNL` |
| Root `nodeId` | `0:1` |

Parse `node-id` from URLs by replacing `-` with `:` (e.g. `12-34` → `12:34`). Preferred tools: `get_design_context`, `get_screenshot`, `get_metadata` after loading `/figma-design-to-code`.

## Source map

```
src/
  App.tsx / main.tsx   # entry; App code-splits the 3D scene
  components/          # DOM overlay sections (+ ui/ primitives)
  scene/               # R3F atelier: canvas, camera rig, GLSL, scene state
  scene/ui/            # world copy: glyph atlas, instanced typography, anchors
  hooks/               # scroll, pointer, motion tier, in-view
  i18n/ + locales/     # copy context + ES/EN JSON (es.json is the source)
  styles/              # tokens, base, chrome, sections, assemble, world-copy
```

The scene is one persistent room driven by a single `build` value (scroll
progress, 0 → 1):

| File | Role |
|------|------|
| `sceneState.ts` | Mutable singleton for per-frame values + Zustand store for discrete state |
| `ReconstructMaterial.ts` | The signature shader: shards → solid → lit |
| `shardGeometry.ts` | Splits a geometry into free triangles for that shader |
| `layout.ts` | Camera/target splines, artifact/portal placement, fog, cinema voxel LOD helpers |
| `Rig.tsx` | Dollies the camera along the spline with pointer parallax |
| `Artifacts.tsx` / `AboutPortrait.tsx` / `portraitVoxels.ts` / `PortraitVoxelMaterial.ts` / `Structures.tsx` / `Lattice.tsx` / `GridFloor.tsx` | Room contents — Artifacts = 6 Work panels; AboutPortrait = JPG→coloured voxel cubes timed to the About scroll window |
| `Atmosphere.tsx` | Fog and the portal the room powers on toward |

## World copy (`scene/ui/`)

Headings, section signage and numerals also exist as fragments in the room. The
glyphs are rasterised from the live webfonts into one runtime atlas, then drawn
as a single instanced mesh whose shader interpolates each fragment from its
scattered origin to its home as `build` advances. Hero + project labels are
CPU-voxelised from atlas ink into opaque lit cubes; other copy stays thin
atlas plates.

| File | Role |
|------|------|
| `glyphAtlas.ts` | Rasterises glyphs + exposes pixel buffer for CPU voxel sampling |
| `glyphLayout.ts` | Wraps text; `form: 'voxel' | 'flat'` → instance attributes |
| `GlyphMaterial.ts` | Scatter → settle; opaque voxels or atlas plates + fog |
| `GlyphField.tsx` | Instanced unit `BoxGeometry`; one draw call for all world typography |
| `worldBlocks.ts` | What exists in world space per section, with enter/exit windows |
| `WorldCopy.tsx` | Atlas lifecycle, tier gating, and the DOM hand-off flag |
| `sectionRanges.ts` / `useSectionWindows.ts` | Maps DOM section positions onto `build` |
| `fragmentSettle.ts` | Settle curve and stagger shared with `Lattice`/`Artifacts` |

Only the `cinema` tier hands headings to the scene: `WorldCopy` sets
`data-world-copy="on"` on `<html>`, and `styles/world-copy.css` turns the DOM
copy transparent while keeping it in the layout for SEO, a11y and selection.
`lite` keeps the DOM as the reading layer and renders signage only (strings that
appear nowhere in the HTML, so nothing reads twice); `still` renders no world
copy at all.

The hand-off has to be earned, because its failure mode is a heading nobody can
read. It waits for all of: an atlas that fit every glyph it was asked for
(`GlyphAtlas.complete`), a layout the fragment budget did not cut short
(`GlyphInstances.complete`), and the field having faded in far enough to stand in
for the HTML (`GlyphField` reports that once). Miss any one of them and the DOM
stays the visible layer — copy showing twice is recoverable, copy missing is not.

Work cinema has no dossier DOM: `#work` is a scroll spacer + clipped a11y list
(`.work__a11y`); shots and labels live only as Artifacts shards + world-copy
glyphs. Panel rim accent follows the nearest live panel on the dolly
(`sceneState.focus`), with keyboard focus on the a11y links taking priority.
Lite/still render a readable DOM fallback list (`.work__fallback`) instead of
an empty spacer.

About cinema is a scroll spacer; the portrait is voxels. Quote/bio/specs stay
DOM (`.about__fallback`) for legible reading — long body type as world-copy was
unreadable. The DOM face plate voids when `aboutVoxels === 'live'`; reading
never voids. Clipped a11y always mounted. Field height must clear the absolute
safety plate. Lite/still keep the full DOM plate.

## Overlay assembly (`styles/assemble.css`)

The HTML on top of the scene arrives in pieces too. Anything marked `.shard`
starts offset from its home and converges when an ancestor reports
`data-shown='true'` — the flag `useInView` already sets on reveals, process
steps and the footer, and that `Hud` and the hero cue take from `booted`. Six
offset vectors cycle over `:nth-child`, so siblings come from different
directions and land at different moments without any per-element bookkeeping.

Two rules to keep:

- **Translate and rotate only, as the individual properties.** A 3D transform,
  `perspective`, `filter` or clipping on this layer paints solid black rectangles
  for a frame over the live canvas on Chromium and WebKit. Using `translate` /
  `rotate` rather than `transform` also lets a piece that writes its own
  `transform`, such as a magnetic CTA, compose with the arrival instead of
  overriding it.
- **Never put a shard on an element that animates its own `opacity`.** An
  animation beats a transition, so the piece would skip its fade. `.contact__live`
  pulses on its indicator dot for exactly this reason, and `.hud__fill`, written
  every frame, is left out of the assembly while its track carries it.

The nav is deliberately excluded: it is the one thing that must be usable before
the page has finished building itself.

## Quality gates

- `make quick-check` before closing agent turns that touch code.
- Max ~600 lines per source file; split when approaching the limit.
- Scene budget, measured with a scripted scroll on an M-series GPU at DPR 2:
  ~26 draw calls and vsync-locked frames in `cinema`, 12 in `lite`, 0 in `still`
  (frozen frame). Adding per-frame CPU work per fragment is the thing to avoid —
  scatter, settle and lighting all belong in the shaders.
