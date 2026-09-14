# Graph Report - preact-davidg  (2026-09-14)

## Corpus Check
- 155 files · ~1,923,545 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1218 nodes · 3066 edges · 78 communities (62 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a2a65b51`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ModuleRig.tsx
- placement.ts
- CinemaLayer.tsx
- useOperatorConsole.ts
- home.tsx
- consoleLayout.ts
- AboutPortrait.tsx
- HeroStage.tsx
- devDependencies
- reactorControl.ts
- compilerOptions
- heroShell.ts
- compilerOptions
- sceneState.ts
- Atmosphere.tsx
- dependencies
- react
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- build-sitemap.ts
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
- layout.ts
- sceneColors.ts
- final-verify.ts
- content/types.ts
- glyphAtlas.ts
- verify-laws2.ts
- actionRow.ts
- GlyphField.tsx
- .finale-shots.tmp.ts
- homeConsoles.ts
- glyphLayout.ts
- ticker.ts
- WorldConsoles.tsx
- shots.mjs
- CosmicEvents.tsx
- sectionRanges.ts
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
- lenis
- tailwindcss
- @tailwindcss/vite

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
- `meta()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `meta()` --calls--> `casePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts
- `meta()` --calls--> `pageMeta()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/seo.ts
- `Case()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts

## Import Cycles
- None detected.

## Communities (78 total, 16 thin omitted)

### Community 0 - "ModuleRig.tsx"
Cohesion: 0.07
Nodes (56): beatPresence(), clearHot(), markHot(), GridFloor(), ActionPlate(), ActionPlateProps, rectOutline(), Box (+48 more)

### Community 1 - "placement.ts"
Cohesion: 0.19
Nodes (23): assertNoOverlap(), beatIn(), buildPlacedConsoles(), frameConsole(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole() (+15 more)

### Community 2 - "CinemaLayer.tsx"
Cohesion: 0.09
Nodes (22): claimLensing(), DISK_OUTER_RS, LENS_NEAR, ringWidthFor(), BlackHoleEffect, BlackHoleEffectOptions, BlackHole, CHAOS_CHILL (+14 more)

### Community 3 - "useOperatorConsole.ts"
Cohesion: 0.16
Nodes (14): editable(), LONGEST_WORD, WORDS, COMMANDS, isLaw(), ReactorConsoleApi, ReactorConsoleContext, ReactorStatus (+6 more)

### Community 4 - "home.tsx"
Cohesion: 0.10
Nodes (45): Case(), meta(), Cv(), meta(), Home(), BootGate(), release(), JsonLd() (+37 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.22
Nodes (13): advanceOf(), ConsoleContentRect, ConsolePlacement, ConsoleRow, ConsoleRowKind, KIND_DEFAULTS, layoutConsoleRows(), MAX_LINES (+5 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.13
Nodes (25): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, isFinitePosition(), portraitAssembleWindow() (+17 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (29): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE, createBladeGeometry() (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.07
Nodes (27): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+19 more)

### Community 9 - "reactorControl.ts"
Cohesion: 0.18
Nodes (22): useOperatorConsole(), installReactorConsole(), advanceControl(), Beat, completeUplink(), cycleLaw(), damp(), decomposeCore() (+14 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "heroShell.ts"
Cohesion: 0.15
Nodes (16): _a, _ab, _ac, _altUp, _b, buildHeroShell(), _c, _centroid (+8 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "sceneState.ts"
Cohesion: 0.14
Nodes (15): holeCenter, liveLaw, pulse, blankMap, ReconstructShape, ReconstructSync, depthBiasFor(), GULP_TOTAL (+7 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.25
Nodes (14): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, advancePulse(), idleAmount() (+6 more)

### Community 15 - "dependencies"
Cohesion: 0.07
Nodes (27): gsap, isbot, maath, dependencies, gsap, isbot, maath, postprocessing (+19 more)

### Community 16 - "react"
Cohesion: 0.15
Nodes (25): react, About(), Contact(), Experience(), FinaleCard(), Hero(), HomeDocument(), Process() (+17 more)

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

### Community 21 - "build-sitemap.ts"
Cohesion: 0.10
Nodes (27): buildIcons(), buildSocialCards(), Encoder, encodeWithinBudget(), escapeXml(), ICON_DIR, main(), monogramSvg() (+19 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "index.ts"
Cohesion: 0.11
Nodes (28): CLIENT, every, CaseDocument(), CvDocument(), CaseImage(), caseImageName(), CaseImageProps, CompactCard() (+20 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "blackHole.ts"
Cohesion: 0.09
Nodes (38): corridorEnd, deepestRs, ENDING_DISTANCE, halfDiagonal, lensAt(), nucleus, nucleusRs, OPENING (+30 more)

### Community 26 - "seo.ts"
Cohesion: 0.15
Nodes (27): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), LocaleGate(), meta(), meta(), NotFound() (+19 more)

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
Cohesion: 0.15
Nodes (13): ReactorScene, setPulseDepth(), ClearColour(), ContextGuard(), DPR, IgnitionFlare(), PulseDriver(), ReadySignal() (+5 more)

### Community 36 - "CosmicWorld.tsx"
Cohesion: 0.14
Nodes (22): attach(), AXIS, CosmicIntro(), CosmicWorld(), deepGeometry(), FAR_GALAXIES, fbmFragment(), FIELD_CENTRE (+14 more)

### Community 37 - "check-cosmos.ts"
Cohesion: 0.10
Nodes (16): arm, arms, armTotal, at(), brightest, centroid, core, early (+8 more)

### Community 39 - "layout.ts"
Cohesion: 0.13
Nodes (20): ARTIFACT_SLOTS, artifactAssembleWindow(), ArtifactPlacement, ARTIFACTS, ArtifactWindow, buildAtDepth, buildForPath(), cameraBeatProgresses (+12 more)

### Community 40 - "sceneColors.ts"
Cohesion: 0.16
Nodes (13): FOG_DENSITY, finite(), PortraitVoxelMaterial, PortraitVoxelSync, FALLBACK, parseable(), readToken(), sceneColors (+5 more)

### Community 42 - "content/types.ts"
Cohesion: 0.17
Nodes (9): en, es, Decision, LabelledValue, Media, ProcessPhase, ProjectKind, Role (+1 more)

### Community 43 - "glyphAtlas.ts"
Cohesion: 0.27
Nodes (10): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), readFamily(), Request, ROLE_TOKEN, ROLE_WEIGHT (+2 more)

### Community 45 - "actionRow.ts"
Cohesion: 0.27
Nodes (10): buildActionRows(), ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), TypeMetrics (+2 more)

### Community 46 - "GlyphField.tsx"
Cohesion: 0.25
Nodes (6): ATTRIBUTES, GlyphField(), GlyphFieldProps, SOURCE_KEYS, GlyphInstances, GlyphMaterial

### Community 48 - "homeConsoles.ts"
Cohesion: 0.28
Nodes (13): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), projectSpecs(), TimedConsole (+5 more)

### Community 49 - "glyphLayout.ts"
Cohesion: 0.18
Nodes (19): glyphAlphaAt(), glyphKey(), GlyphMetric, advanceOf(), countBlockFragments(), countFragments(), Cursor, GlyphForm (+11 more)

### Community 50 - "ticker.ts"
Cohesion: 0.20
Nodes (13): MotionRuntimeOptions, startMotionRuntime(), handlers, nativeBehavior(), onLayoutRefresh(), RefreshHandler, refreshHandlers, runTicks() (+5 more)

### Community 51 - "WorldConsoles.tsx"
Cohesion: 0.18
Nodes (17): Copy, AboutPortraitProps, Quality, _local, TelemetryStripProps, BuiltConsole, ConsoleActionSpec, ConsoleBuildInput (+9 more)

### Community 53 - "CosmicEvents.tsx"
Cohesion: 0.22
Nodes (7): AIM, CHAOS_TINT, COMET_TINT, CosmicEvents(), NOVA_TINT, ROCK_TINT, VACUUM_TINT

### Community 54 - "sectionRanges.ts"
Cohesion: 0.26
Nodes (11): ReactorScene(), clamp01(), settleAt(), smoothstep01(), STAGGER_CAP, measureSectionWindows(), onSectionLayoutChange(), sameWindows() (+3 more)

### Community 55 - "check-swallow.ts"
Cohesion: 0.21
Nodes (11): at(), chaos, eatenAt(), previous, quiet, settle(), suctionAt(), vacuum (+3 more)

### Community 65 - "Handoff — cosmic upgrade (Codex → Claude Code → Codex)"
Cohesion: 0.12
Nodes (16): 1. Qué hizo cada sesión de Codex (10:00–10:16), 2. El build estaba ROTO — qué arreglé, 3. `src/scene/Planets.tsx` — qué hay dentro, 4. Lo que arregló Claude Code fuera de Planets.tsx, 5. Estado verificado ahora mismo, 6. Lo que queda para vos, 7. Segunda ronda — lo que el usuario vio en pantalla, "el agujero negro superpone los objetos" (+8 more)

### Community 66 - "Rig.tsx"
Cohesion: 0.13
Nodes (29): ANCHOR, BAYS, FORWARD, frame(), Framed, ORBIT, POSITION, REL (+21 more)

### Community 67 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 68 - "visual-qa.mjs"
Cohesion: 0.22
Nodes (6): /src/scene/control/reactorControl.ts, /src/scene/sceneState.ts, errors, errors, snapshots, stops

### Community 69 - "Planets.tsx"
Cohesion: 0.16
Nodes (13): holeAxis(), ANCHOR, AXIS, FLASH, MAPS, Planets(), RADIAL, TANGENT (+5 more)

### Community 71 - "sceneState"
Cohesion: 0.31
Nodes (8): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), sceneState

### Community 73 - "capability.ts"
Cohesion: 0.39
Nodes (7): CapabilityNavigator, detectQuality(), isCrawler(), NetworkInformation, prefersLessData(), prefersReducedMotion(), supportsWebGL2()

## Knowledge Gaps
- **435 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+430 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-sitemap.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _435 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ModuleRig.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07002012072434607 - nodes in this community are weakly interconnected._
- **Should `CinemaLayer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08831908831908832 - nodes in this community are weakly interconnected._
- **Should `home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10109289617486339 - nodes in this community are weakly interconnected._
- **Should `AboutPortrait.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._