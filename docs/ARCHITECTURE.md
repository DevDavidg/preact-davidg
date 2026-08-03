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
  hooks/               # scroll, pointer, motion tier, in-view
  i18n/ + locales/     # copy context + ES/EN JSON (es.json is the source)
  styles/              # tokens.css, base.css, chrome.css, sections.css
```

The scene is one persistent room driven by a single `build` value (scroll
progress, 0 → 1):

| File | Role |
|------|------|
| `sceneState.ts` | Mutable singleton for per-frame values + Zustand store for discrete state |
| `ReconstructMaterial.ts` | The signature shader: shards → solid → lit |
| `shardGeometry.ts` | Splits a geometry into free triangles for that shader |
| `layout.ts` | Camera/target splines, artifact and portal placement, fog |
| `Rig.tsx` | Dollies the camera along the spline with pointer parallax |
| `Artifacts.tsx` / `Structures.tsx` / `Lattice.tsx` / `GridFloor.tsx` | Room contents |
| `Atmosphere.tsx` | Fog and the portal the room powers on toward |

## Quality gates

- `make quick-check` before closing agent turns that touch code.
- Max ~600 lines per source file; split when approaching the limit.
