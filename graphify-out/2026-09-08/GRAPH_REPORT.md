# Graph Report - preact-davidg  (2026-09-08)

## Corpus Check
- 155 files · ~1,559,098 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1194 nodes · 3008 edges · 73 communities (60 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12804a6a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ModuleRig.tsx
- placement.ts
- home.tsx
- useOperatorConsole.ts
- seo.ts
- glyphLayout.ts
- AboutPortrait.tsx
- HeroStage.tsx
- devDependencies
- layout.ts
- compilerOptions
- Nav.tsx
- compilerOptions
- locale.ts
- Atmosphere.tsx
- dependencies
- heroShell.ts
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- lib/routes.ts
- Kerr / realismo del pozo — plan para Kimi
- react
- vercel.json
- CinemaLayer.tsx
- sceneState
- Planets.tsx
- diagnose.ts
- diff-hydration.ts
- review-shots.ts
- find-overflow.ts
- tsconfig.json
- scripts
- package.json
- build-assets.ts
- CosmicWorld.tsx
- check-cosmos.ts
- verify-laws.ts
- sceneState.ts
- consoleLayout.ts
- final-verify.ts
- index.ts
- Console.tsx
- verify-laws2.ts
- ticker.ts
- reactorControl.ts
- .finale-shots.tmp.ts
- WorldConsoles.tsx
- Structures.tsx
- ReconstructMaterial.ts
- Quality
- shots.mjs
- fetch-fonts.ts
- sceneColors.ts
- check-swallow.ts
- audit-static.ts
- mobile-audit.ts
- shot.ts
- gsap
- Handoff — cosmic upgrade (Codex → Claude Code → Codex)
- Rig.tsx
- capability.ts
- visual-qa.mjs
- CosmicEvents.tsx
- AGENTS.md
- postprocessing

## God Nodes (most connected - your core abstractions)
1. `react` - 53 edges
2. `useCopy()` - 41 edges
3. `useSceneStore` - 40 edges
4. `sceneState` - 34 edges
5. `clamp01()` - 28 edges
6. `trackEvent()` - 27 edges
7. `homePath()` - 27 edges
8. `WorldConsoles()` - 27 edges
9. `HeroStage()` - 26 edges
10. `SwallowShape` - 24 edges

## Surprising Connections (you probably didn't know these)
- `every` --calls--> `casePath()`  [EXTRACTED]
  scripts/check-routes.ts → src/lib/routes.ts
- `Layout()` --calls--> `localeFromPath()`  [EXTRACTED]
  app/root.tsx → src/lib/locale.ts
- `ErrorBoundary()` --calls--> `homePath()`  [EXTRACTED]
  app/root.tsx → src/lib/routes.ts
- `meta()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `meta()` --calls--> `isLocale()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts

## Import Cycles
- None detected.

## Communities (73 total, 13 thin omitted)

### Community 0 - "ModuleRig.tsx"
Cohesion: 0.18
Nodes (20): ChassisKind, LEDGER_BARS, ledgerBar(), ledgerChassis(), mergeBoxes(), totemChassis(), vaultChassis(), vaultSeal() (+12 more)

### Community 1 - "placement.ts"
Cohesion: 0.18
Nodes (21): assertNoOverlap(), beatIn(), buildPlacedConsoles(), frameConsole(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole() (+13 more)

### Community 2 - "home.tsx"
Cohesion: 0.14
Nodes (35): Case(), Cv(), meta(), Home(), meta(), BootGate(), release(), JsonLd() (+27 more)

### Community 3 - "useOperatorConsole.ts"
Cohesion: 0.19
Nodes (21): editable(), LONGEST_WORD, useOperatorConsole(), WORDS, COMMANDS, installReactorConsole(), isLaw(), ReactorConsoleApi (+13 more)

### Community 4 - "seo.ts"
Cohesion: 0.17
Nodes (24): escapeXml(), imagesFor(), indexable(), main(), OUT_DIR, priorityFor(), urlEntry(), workIndex() (+16 more)

### Community 5 - "glyphLayout.ts"
Cohesion: 0.08
Nodes (35): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), glyphAlphaAt(), glyphKey(), GlyphMetric, readFamily() (+27 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.13
Nodes (25): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, isFinitePosition(), portraitAssembleWindow() (+17 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (29): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE, createBladeGeometry() (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "layout.ts"
Cohesion: 0.14
Nodes (18): ARTIFACT_SLOTS, artifactAssembleWindow(), ArtifactPlacement, ARTIFACTS, ArtifactWindow, buildAtDepth, buildForPath(), cameraBeatProgresses (+10 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "Nav.tsx"
Cohesion: 0.19
Nodes (17): .react-router/**, CvDocument(), Footer(), Nav(), NAV_SECTIONS, NavSection, SceneErrorBoundary, SiteShell() (+9 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "locale.ts"
Cohesion: 0.16
Nodes (16): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), LocaleGate(), meta(), meta(), NotFound() (+8 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.25
Nodes (14): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, idleAmount(), MASTER_PULSE_HZ (+6 more)

### Community 15 - "dependencies"
Cohesion: 0.08
Nodes (25): isbot, lenis, maath, dependencies, isbot, lenis, maath, react (+17 more)

### Community 16 - "heroShell.ts"
Cohesion: 0.15
Nodes (16): _a, _ab, _ac, _altUp, _b, buildHeroShell(), _c, _centroid (+8 more)

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

### Community 21 - "lib/routes.ts"
Cohesion: 0.14
Nodes (20): CaseDocument(), CaseImage(), caseImageName(), CaseImageProps, CompactCard(), CompactCardProps, ExternalArrow(), FeaturedCard() (+12 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "react"
Cohesion: 0.09
Nodes (43): react, About(), Contact(), Experience(), FinaleCard(), Hero(), HomeDocument(), OperatorBar() (+35 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "CinemaLayer.tsx"
Cohesion: 0.05
Nodes (58): deepestRs, ENDING_DISTANCE, halfDiagonal, nucleus, nucleusRs, OPENING, previousCharge, previousGlow (+50 more)

### Community 26 - "sceneState"
Cohesion: 0.31
Nodes (8): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), sceneState

### Community 27 - "Planets.tsx"
Cohesion: 0.15
Nodes (16): ANCHOR, AXIS, FLASH, MAPS, Planets(), RADIAL, TANGENT, TEXELS (+8 more)

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

### Community 35 - "build-assets.ts"
Cohesion: 0.19
Nodes (15): buildIcons(), buildSocialCards(), Encoder, encodeWithinBudget(), escapeXml(), ICON_DIR, main(), monogramSvg() (+7 more)

### Community 36 - "CosmicWorld.tsx"
Cohesion: 0.19
Nodes (15): attach(), AXIS, CosmicIntro(), CosmicWorld(), fieldGeometry(), galaxyGeometry(), gauss(), HII_REGION (+7 more)

### Community 37 - "check-cosmos.ts"
Cohesion: 0.10
Nodes (16): arm, arms, armTotal, at(), brightest, centroid, core, early (+8 more)

### Community 39 - "sceneState.ts"
Cohesion: 0.10
Nodes (23): ReactorScene, NEXT_DOWN, NEXT_UP, ExperienceState, advancePulse(), setPulseDepth(), DPR, PulseDriver() (+15 more)

### Community 40 - "consoleLayout.ts"
Cohesion: 0.14
Nodes (21): ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), measure(), advanceOf(), ConsoleContentRect, ConsolePlacement (+13 more)

### Community 42 - "index.ts"
Cohesion: 0.13
Nodes (17): CLIENT, every, en, es, allCases(), CASE_SLUGS, findCase(), Copy (+9 more)

### Community 43 - "Console.tsx"
Cohesion: 0.24
Nodes (17): clearHot(), completeUplink(), markHot(), ActionPlate(), ActionPlateProps, rectOutline(), Console(), ConsoleAction (+9 more)

### Community 45 - "ticker.ts"
Cohesion: 0.20
Nodes (13): MotionRuntimeOptions, startMotionRuntime(), handlers, nativeBehavior(), onLayoutRefresh(), RefreshHandler, refreshHandlers, runTicks() (+5 more)

### Community 46 - "reactorControl.ts"
Cohesion: 0.17
Nodes (14): advanceControl(), Beat, beatPresence(), damp(), fireSector(), grab(), LAW_KEYS, LAW_PROFILES (+6 more)

### Community 48 - "WorldConsoles.tsx"
Cohesion: 0.23
Nodes (18): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), TimedConsole, ConsoleSpec (+10 more)

### Community 49 - "Structures.tsx"
Cohesion: 0.29
Nodes (9): Box, Bay, BAY_BUILDS, BayBuild, BAYS, beamBoxes(), columnBoxes(), kerbBoxes() (+1 more)

### Community 50 - "ReconstructMaterial.ts"
Cohesion: 0.13
Nodes (13): holeCenter, GridFloor(), buildParts(), GEO_SPECS, Lattice(), Part, PartKind, blankMap (+5 more)

### Community 51 - "Quality"
Cohesion: 0.27
Nodes (9): AboutPortraitProps, Quality, ConsoleActionSpec, ConsoleBuildInput, ConsoleTimingOverride, WorldConsolesProps, ReactorSceneProps, SceneMode (+1 more)

### Community 53 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 54 - "sceneColors.ts"
Cohesion: 0.09
Nodes (28): liveLaw, FOG_DENSITY, finite(), PortraitVoxelMaterial, PortraitVoxelSync, ClearColour(), ContextGuard(), ReactorScene() (+20 more)

### Community 55 - "check-swallow.ts"
Cohesion: 0.47
Nodes (4): at(), eatenAt(), previous, suctionAt()

### Community 65 - "Handoff — cosmic upgrade (Codex → Claude Code → Codex)"
Cohesion: 0.18
Nodes (10): 1. Qué hizo cada sesión de Codex (10:00–10:16), 2. El build estaba ROTO — qué arreglé, 3. `src/scene/Planets.tsx` — qué hay dentro, 4. Lo que arregló Claude Code fuera de Planets.tsx, 5. Estado verificado ahora mismo, 6. Lo que queda para vos, Handoff — cosmic upgrade (Codex → Claude Code → Codex), Limpieza de controles (`10-01-58`) — completo (+2 more)

### Community 66 - "Rig.tsx"
Cohesion: 0.09
Nodes (33): ANCHOR, BAYS, FORWARD, frame(), Framed, POSITION, REL, report (+25 more)

### Community 67 - "capability.ts"
Cohesion: 0.33
Nodes (8): CapabilityNavigator, detectQuality(), isCrawler(), NetworkInformation, onCapabilityChange(), prefersLessData(), prefersReducedMotion(), supportsWebGL2()

### Community 68 - "visual-qa.mjs"
Cohesion: 0.22
Nodes (6): /src/scene/control/reactorControl.ts, /src/scene/sceneState.ts, errors, errors, snapshots, stops

### Community 69 - "CosmicEvents.tsx"
Cohesion: 0.29
Nodes (5): CHAOS_TINT, COMET_TINT, CosmicEvents(), NOVA_TINT, VACUUM_TINT

## Knowledge Gaps
- **425 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+420 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _425 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13526570048309178 - nodes in this community are weakly interconnected._
- **Should `glyphLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08292682926829269 - nodes in this community are weakly interconnected._
- **Should `AboutPortrait.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._