# Graph Report - preact-davidg  (2026-09-06)

## Corpus Check
- 134 files · ~207,179 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1011 nodes · 2817 edges · 52 communities (45 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `420ee70e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- layout.ts
- ReactorControl
- index.ts
- useOperatorConsole.ts
- seo.ts
- consoleLayout.ts
- AboutPortrait.tsx
- HeroStage.tsx
- devDependencies
- livePowerFor
- compilerOptions
- ModuleRig.tsx
- compilerOptions
- ReactorScene.tsx
- ReactorCore.tsx
- dependencies
- build-assets.ts
- bundle-budget.mjs
- reactorControl.ts
- .oxlintrc.json
- capture-shots.ts
- home.tsx
- Absorción del portfolio — 5 tareas atómicas
- check-swallow.ts
- vercel.json
- fetch-fonts.ts
- clamp01
- FinaleGate.tsx
- diagnose.ts
- diff-hydration.ts
- review-shots.ts
- find-overflow.ts
- tsconfig.json
- scripts
- package.json
- heroShell.ts
- glyphLayout.ts
- ticker.ts
- BlackHoleEffect
- react-router
- Quality
- WorldConsoles
- placement.ts
- reactorConsole.ts
- sceneState.ts
- gsap
- silenceClockWarning.ts
- .finale-shots.tmp.ts
- WorldConsoles.tsx
- @react-router/node

## God Nodes (most connected - your core abstractions)
1. `react` - 52 edges
2. `useCopy()` - 43 edges
3. `useSceneStore` - 42 edges
4. `sceneState` - 34 edges
5. `clamp01()` - 33 edges
6. `trackEvent()` - 27 edges
7. `WorldConsoles()` - 27 edges
8. `homePath()` - 26 edges
9. `HeroStage()` - 26 edges
10. `Quality` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Layout()` --calls--> `localeFromPath()`  [EXTRACTED]
  app/root.tsx → src/lib/locale.ts
- `meta()` --calls--> `casePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts
- `meta()` --calls--> `pageMeta()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/seo.ts
- `Case()` --calls--> `useOperatorConsole()`  [EXTRACTED]
  app/routes/case.tsx → src/hooks/useOperatorConsole.ts
- `Case()` --calls--> `trackEvent()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/analytics.ts

## Import Cycles
- None detected.

## Communities (52 total, 7 thin omitted)

### Community 0 - "layout.ts"
Cohesion: 0.14
Nodes (23): APPROACH_Z, PLUNGE_DEPTH, PLUNGE_RADIUS, ARTIFACT_SLOTS, artifactAssembleWindow(), ArtifactPlacement, ArtifactWindow, buildAtDepth (+15 more)

### Community 1 - "ReactorControl"
Cohesion: 0.10
Nodes (23): liveLaw, ReactorControl, GridFloor(), Box, buildParts(), GEO_SPECS, Lattice(), Part (+15 more)

### Community 2 - "index.ts"
Cohesion: 0.06
Nodes (82): .react-router/**, ReactorSound, About(), CaseDocument(), Contact(), CvDocument(), Experience(), FinaleCard() (+74 more)

### Community 3 - "useOperatorConsole.ts"
Cohesion: 0.27
Nodes (18): editable(), LONGEST_WORD, useOperatorConsole(), WORDS, installReactorConsole(), completeUplink(), cycleLaw(), decomposeCore() (+10 more)

### Community 4 - "seo.ts"
Cohesion: 0.09
Nodes (41): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), LocaleGate(), meta(), meta(), NotFound() (+33 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.13
Nodes (23): buildActionRows(), ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), advanceOf() (+15 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.07
Nodes (42): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, portraitAssembleWindow(), _probe (+34 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (29): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE, createBladeGeometry() (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "livePowerFor"
Cohesion: 0.17
Nodes (13): LAW_PITCHES, LOCK_PITCHES, noiseBuffer(), startReactorSound(), ARTIFACTS, CONDUIT_Y, REACTOR_CORE, IgnitionFlare() (+5 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "ModuleRig.tsx"
Cohesion: 0.18
Nodes (20): ChassisKind, LEDGER_BARS, ledgerBar(), ledgerChassis(), mergeBoxes(), totemChassis(), vaultChassis(), vaultSeal() (+12 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "ReactorScene.tsx"
Cohesion: 0.13
Nodes (19): holeCenter, CosmicIntro(), CosmicWorld(), PLANETS, random(), stellarGeometry(), advancePulse(), setPulseDepth() (+11 more)

### Community 14 - "ReactorCore.tsx"
Cohesion: 0.10
Nodes (32): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, _dir, _fwd (+24 more)

### Community 15 - "dependencies"
Cohesion: 0.09
Nodes (23): isbot, lenis, maath, dependencies, isbot, lenis, maath, postprocessing (+15 more)

### Community 16 - "build-assets.ts"
Cohesion: 0.21
Nodes (14): buildIcons(), buildSocialCards(), Encoder, encodeWithinBudget(), escapeXml(), ICON_DIR, main(), monogramSvg() (+6 more)

### Community 17 - "bundle-budget.mjs"
Cohesion: 0.24
Nodes (13): BUDGETS, cinemaOnlyFiles(), CLIENT, criticalAssets(), gzip(), kb(), main(), measure() (+5 more)

### Community 18 - "reactorControl.ts"
Cohesion: 0.13
Nodes (17): advanceControl(), Beat, beatPresence(), clearHot(), damp(), grab(), LAW_KEYS, LAW_PROFILES (+9 more)

### Community 19 - ".oxlintrc.json"
Cohesion: 0.17
Nodes (11): ignorePatterns, overrides, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, build/** (+3 more)

### Community 20 - "capture-shots.ts"
Cohesion: 0.23
Nodes (11): captureSelf(), main(), MIME, OUT_DIR, requested, serveBuild(), SETTLE, Shot (+3 more)

### Community 21 - "home.tsx"
Cohesion: 0.08
Nodes (56): Case(), meta(), Cv(), meta(), Home(), react, BootGate(), release() (+48 more)

### Community 22 - "Absorción del portfolio — 5 tareas atómicas"
Cohesion: 0.14
Nodes (13): Absorción del portfolio — 5 tareas atómicas, Cambios respecto al plan, Coeficientes: medidos, no elegidos, Contrato que no se rompe, Diagnóstico (causa, no síntoma), Hallazgos previos a este trabajo (no tocados), Resultado (ejecutado), Tarea 1 — Curva: drain monótono, gulps como tirón (+5 more)

### Community 23 - "check-swallow.ts"
Cohesion: 0.50
Nodes (3): at(), previous, suctionAt()

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 26 - "clamp01"
Cohesion: 0.28
Nodes (14): ActionPlate(), ActionPlateProps, rectOutline(), Console(), ConsoleAction, UplinkGateProps, clamp01(), clamp01() (+6 more)

### Community 27 - "FinaleGate.tsx"
Cohesion: 0.11
Nodes (27): claimLensing(), claims, DISK_INNER_RS, DISK_OUTER_RS, GATE_APERTURE_Y, GATE_APERTURE_Z_AHEAD, holeAxis(), holeGateFor() (+19 more)

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

### Community 35 - "heroShell.ts"
Cohesion: 0.15
Nodes (16): _a, _ab, _ac, _altUp, _b, buildHeroShell(), _c, _centroid (+8 more)

### Community 36 - "glyphLayout.ts"
Cohesion: 0.08
Nodes (35): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), glyphAlphaAt(), glyphKey(), GlyphMetric, readFamily() (+27 more)

### Community 37 - "ticker.ts"
Cohesion: 0.19
Nodes (14): MotionRuntimeOptions, startMotionRuntime(), handlers, nativeBehavior(), onLayoutRefresh(), RefreshHandler, refreshHandlers, runTicks() (+6 more)

### Community 40 - "Quality"
Cohesion: 0.18
Nodes (13): AboutPortraitProps, Quality, _local, TelemetryStrip(), TelemetryStripProps, BuiltConsole, ConsoleActionSpec, ConsoleBuildInput (+5 more)

### Community 41 - "WorldConsoles"
Cohesion: 0.30
Nodes (14): frameConsole(), WorldConsoles(), computeViewportFit(), consoleDistanceFor(), consoleHeightFit(), consoleRiseFor(), consoleSizeFit(), consoleWidthFit() (+6 more)

### Community 42 - "placement.ts"
Cohesion: 0.24
Nodes (12): assertNoOverlap(), beatIn(), buildPlacedConsoles(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole(), TimedConsole (+4 more)

### Community 43 - "reactorConsole.ts"
Cohesion: 0.22
Nodes (9): COMMANDS, isLaw(), ReactorConsoleApi, ReactorConsoleContext, ReactorStatus, Window, LawId, LAWS (+1 more)

### Community 44 - "sceneState.ts"
Cohesion: 0.24
Nodes (8): depthBiasFor(), GULP_TOTAL, gulpEnvelope(), gulpProgress(), Phase, PHASES, SUCTION_GULPS, SwallowShape

### Community 46 - "silenceClockWarning.ts"
Cohesion: 0.50
Nodes (3): ConsoleMethod, GlobalWithFlag, INSTALLED

### Community 48 - "WorldConsoles.tsx"
Cohesion: 0.27
Nodes (14): Copy, caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), actionLabelBlocks() (+6 more)

## Knowledge Gaps
- **307 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+302 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _307 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `layout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._
- **Should `ReactorControl` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05568268497330282 - nodes in this community are weakly interconnected._
- **Should `seo.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09176470588235294 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._