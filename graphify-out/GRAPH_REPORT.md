# Graph Report - preact-davidg  (2026-09-14)

## Corpus Check
- 155 files · ~1,924,946 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1223 nodes · 3072 edges · 74 communities (59 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `da81bd0d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ModuleRig.tsx
- placement.ts
- CinemaLayer.tsx
- useOperatorConsole.ts
- sceneState.ts
- consoleLayout.ts
- layout.ts
- HeroStage.tsx
- devDependencies
- reactorControl.ts
- compilerOptions
- heroShell.ts
- compilerOptions
- SwallowShape
- Atmosphere.tsx
- dependencies
- react
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- build-assets.ts
- Kerr / realismo del pozo — plan para Kimi
- index.ts
- vercel.json
- blackHole.ts
- seo.ts
- Nav.tsx
- diagnose.ts
- diff-hydration.ts
- review-shots.ts
- find-overflow.ts
- tsconfig.json
- scripts
- package.json
- ReactorScene.tsx
- CosmicWorld.tsx
- check-cosmos.ts
- verify-laws.ts
- check-planets.ts
- gsap
- final-verify.ts
- content/types.ts
- glyphAtlas.ts
- verify-laws2.ts
- postprocessing
- GlyphField.tsx
- .finale-shots.tmp.ts
- WorldConsoles
- glyphLayout.ts
- ticker.ts
- WorldConsoles.tsx
- shots.mjs
- CosmicEvents.tsx
- check-swallow.ts
- audit-static.ts
- mobile-audit.ts
- shot.ts
- vacuum-verify.ts
- Handoff — cosmic upgrade (Codex → Claude Code → Codex)
- Rig.tsx
- fetch-fonts.ts
- visual-qa.mjs
- Planets.tsx
- AGENTS.md
- sceneState
- capability.ts
- SceneErrorBoundary

## God Nodes (most connected - your core abstractions)
1. `react` - 53 edges
2. `useCopy()` - 41 edges
3. `useSceneStore` - 40 edges
4. `sceneState` - 35 edges
5. `clamp01()` - 28 edges
6. `trackEvent()` - 27 edges
7. `homePath()` - 27 edges
8. `WorldConsoles()` - 27 edges
9. `HeroStage()` - 26 edges
10. `SwallowShape` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Layout()` --calls--> `localeFromPath()`  [EXTRACTED]
  app/root.tsx → src/lib/locale.ts
- `meta()` --calls--> `isLocale()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `meta()` --calls--> `pageMeta()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/seo.ts
- `Case()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `Case()` --calls--> `useOperatorConsole()`  [EXTRACTED]
  app/routes/case.tsx → src/hooks/useOperatorConsole.ts

## Import Cycles
- None detected.

## Communities (74 total, 15 thin omitted)

### Community 0 - "ModuleRig.tsx"
Cohesion: 0.07
Nodes (56): clearHot(), completeUplink(), markHot(), ActionPlate(), ActionPlateProps, rectOutline(), Box, ChassisKind (+48 more)

### Community 1 - "placement.ts"
Cohesion: 0.17
Nodes (23): assertNoOverlap(), beatIn(), buildPlacedConsoles(), frameConsole(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole() (+15 more)

### Community 2 - "CinemaLayer.tsx"
Cohesion: 0.09
Nodes (21): claimLensing(), holeAxis(), holeRadiusFor(), BlackHoleEffect, BlackHoleEffectOptions, BlackHole, CHAOS_CHILL, CHAOS_COOL (+13 more)

### Community 3 - "useOperatorConsole.ts"
Cohesion: 0.17
Nodes (23): editable(), LONGEST_WORD, useOperatorConsole(), WORDS, COMMANDS, installReactorConsole(), isLaw(), ReactorConsoleApi (+15 more)

### Community 4 - "sceneState.ts"
Cohesion: 0.09
Nodes (47): Case(), Cv(), meta(), Home(), BootGate(), release(), JsonLd(), SkipLink() (+39 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.13
Nodes (23): buildActionRows(), ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), advanceOf() (+15 more)

### Community 6 - "layout.ts"
Cohesion: 0.05
Nodes (59): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, isFinitePosition(), portraitAssembleWindow() (+51 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (29): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE, createBladeGeometry() (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "reactorControl.ts"
Cohesion: 0.16
Nodes (13): advanceControl(), Beat, beatPresence(), damp(), fireSector(), grab(), LAW_KEYS, LAW_PROFILES (+5 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "heroShell.ts"
Cohesion: 0.15
Nodes (16): _a, _ab, _ac, _altUp, _b, buildHeroShell(), _c, _centroid (+8 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "SwallowShape"
Cohesion: 0.13
Nodes (18): holeCenter, liveLaw, GridFloor(), pulse, blankMap, ReconstructShape, ReconstructSync, FALLBACK (+10 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.25
Nodes (14): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, advancePulse(), idleAmount() (+6 more)

### Community 15 - "dependencies"
Cohesion: 0.08
Nodes (25): isbot, lenis, maath, dependencies, isbot, lenis, maath, react (+17 more)

### Community 16 - "react"
Cohesion: 0.16
Nodes (24): react, About(), Contact(), Experience(), FinaleCard(), Hero(), HomeDocument(), Process() (+16 more)

### Community 17 - "bundle-budget.mjs"
Cohesion: 0.24
Nodes (13): BUDGETS, cinemaOnlyFiles(), CLIENT, criticalAssets(), gzip(), kb(), main(), measure() (+5 more)

### Community 18 - "El agujero negro"
Cohesion: 0.05
Nodes (36): A. Desktop: `BlackHoleEffect`, Advección kepleriana sin enrollarse (`BH_KEP_PERIOD`), Anillo de fotones, B. Lite: billboard del gate, Cadena del composer, Canales, Cielo doblado (`bhSky`), Cámara (`Rig.tsx`) (+28 more)

### Community 19 - ".oxlintrc.json"
Cohesion: 0.17
Nodes (11): ignorePatterns, overrides, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, build/** (+3 more)

### Community 20 - "capture-shots.ts"
Cohesion: 0.23
Nodes (11): captureSelf(), main(), MIME, OUT_DIR, requested, serveBuild(), SETTLE, Shot (+3 more)

### Community 21 - "build-assets.ts"
Cohesion: 0.19
Nodes (15): buildIcons(), buildSocialCards(), Encoder, encodeWithinBudget(), escapeXml(), ICON_DIR, main(), monogramSvg() (+7 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "index.ts"
Cohesion: 0.11
Nodes (28): meta(), CLIENT, every, CaseDocument(), CvDocument(), CaseImage(), caseImageName(), CaseImageProps (+20 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "blackHole.ts"
Cohesion: 0.09
Nodes (38): corridorEnd, deepestRs, ENDING_DISTANCE, halfDiagonal, lensAt(), nucleus, nucleusRs, OPENING (+30 more)

### Community 26 - "seo.ts"
Cohesion: 0.09
Nodes (42): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), LocaleGate(), meta(), meta(), NotFound() (+34 more)

### Community 27 - "Nav.tsx"
Cohesion: 0.19
Nodes (21): .react-router/**, Footer(), Nav(), NAV_SECTIONS, NavSection, SiteShell(), Action(), ActionProps (+13 more)

### Community 28 - "diagnose.ts"
Cohesion: 0.50
Nodes (4): check(), main(), MIME, ROOT

### Community 29 - "diff-hydration.ts"
Cohesion: 0.50
Nodes (4): main(), MIME, normaliseHtml(), ROOT

### Community 30 - "review-shots.ts"
Cohesion: 0.40
Nodes (3): OUT, View, VIEWS

### Community 33 - "scripts"
Cohesion: 0.18
Nodes (11): scripts, assets, budget, build, dev, fonts, lint, shots (+3 more)

### Community 34 - "package.json"
Cohesion: 0.20
Nodes (9): name, packageManager, pnpm, onlyBuiltDependencies, private, type, version, esbuild (+1 more)

### Community 35 - "ReactorScene.tsx"
Cohesion: 0.14
Nodes (14): ReactorScene, setPulseDepth(), CinemaLayer, ClearColour(), ContextGuard(), DPR, IgnitionFlare(), PulseDriver() (+6 more)

### Community 36 - "CosmicWorld.tsx"
Cohesion: 0.12
Nodes (25): attach(), AXIS, CosmicIntro(), CosmicWorld(), deepGeometry(), FAR_GALAXIES, FAR_SHAPES, fbmFragment() (+17 more)

### Community 37 - "check-cosmos.ts"
Cohesion: 0.10
Nodes (16): arm, arms, armTotal, at(), brightest, centroid, core, early (+8 more)

### Community 39 - "check-planets.ts"
Cohesion: 0.15
Nodes (12): ANCHOR, BAYS, FORWARD, Framed, ORBIT, POSITION, REL, report (+4 more)

### Community 42 - "content/types.ts"
Cohesion: 0.17
Nodes (9): en, es, Decision, LabelledValue, Media, ProcessPhase, ProjectKind, Role (+1 more)

### Community 43 - "glyphAtlas.ts"
Cohesion: 0.27
Nodes (10): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), readFamily(), Request, ROLE_TOKEN, ROLE_WEIGHT (+2 more)

### Community 46 - "GlyphField.tsx"
Cohesion: 0.25
Nodes (6): ATTRIBUTES, GlyphField(), GlyphFieldProps, SOURCE_KEYS, GlyphInstances, GlyphMaterial

### Community 48 - "WorldConsoles"
Cohesion: 0.24
Nodes (16): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), projectSpecs(), TimedConsole (+8 more)

### Community 49 - "glyphLayout.ts"
Cohesion: 0.18
Nodes (19): glyphAlphaAt(), glyphKey(), GlyphMetric, advanceOf(), countBlockFragments(), countFragments(), Cursor, GlyphForm (+11 more)

### Community 50 - "ticker.ts"
Cohesion: 0.19
Nodes (14): MotionRuntimeOptions, startMotionRuntime(), handlers, nativeBehavior(), onLayoutRefresh(), RefreshHandler, refreshHandlers, runTicks() (+6 more)

### Community 51 - "WorldConsoles.tsx"
Cohesion: 0.19
Nodes (16): Copy, AboutPortraitProps, Quality, _local, TelemetryStrip(), TelemetryStripProps, BuiltConsole, ConsoleActionSpec (+8 more)

### Community 53 - "CosmicEvents.tsx"
Cohesion: 0.22
Nodes (7): AIM, CHAOS_TINT, COMET_TINT, NOVA_TINT, ROCK_TINT, VACUUM_TINT, PLANETS

### Community 55 - "check-swallow.ts"
Cohesion: 0.21
Nodes (10): at(), chaos, eatenAt(), previous, quiet, settle(), suctionAt(), vacuum (+2 more)

### Community 65 - "Handoff — cosmic upgrade (Codex → Claude Code → Codex)"
Cohesion: 0.12
Nodes (16): 1. Qué hizo cada sesión de Codex (10:00–10:16), 2. El build estaba ROTO — qué arreglé, 3. `src/scene/Planets.tsx` — qué hay dentro, 4. Lo que arregló Claude Code fuera de Planets.tsx, 5. Estado verificado ahora mismo, 6. Lo que queda para vos, 7. Segunda ronda — lo que el usuario vio en pantalla, "el agujero negro superpone los objetos" (+8 more)

### Community 66 - "Rig.tsx"
Cohesion: 0.19
Nodes (18): frame(), APPROACH_Z, closestApproach(), PLUNGE_DEPTH, CAMERA_PATH, cameraFovFor(), cameraHoldFor(), cameraPacing() (+10 more)

### Community 67 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 68 - "visual-qa.mjs"
Cohesion: 0.22
Nodes (6): /src/scene/control/reactorControl.ts, /src/scene/sceneState.ts, errors, errors, snapshots, stops

### Community 69 - "Planets.tsx"
Cohesion: 0.16
Nodes (15): CosmicEvents(), ANCHOR, AXIS, FLASH, MAPS, Planets(), RADIAL, TANGENT (+7 more)

### Community 71 - "sceneState"
Cohesion: 0.31
Nodes (8): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), sceneState

### Community 73 - "capability.ts"
Cohesion: 0.39
Nodes (7): CapabilityNavigator, detectQuality(), isCrawler(), NetworkInformation, prefersLessData(), prefersReducedMotion(), supportsWebGL2()

## Knowledge Gaps
- **438 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+433 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _438 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ModuleRig.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07204968944099378 - nodes in this community are weakly interconnected._
- **Should `CinemaLayer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
- **Should `sceneState.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `layout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05029838022165388 - nodes in this community are weakly interconnected._