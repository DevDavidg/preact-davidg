# Graph Report - preact-davidg  (2026-09-07)

## Corpus Check
- 137 files · ~238,849 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1092 nodes · 2895 edges · 57 communities (45 shown, 12 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `34bd061f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- actionRow.ts
- reactorControl.ts
- home.tsx
- reactorConsole.ts
- seo.ts
- consoleLayout.ts
- AboutPortrait.tsx
- HeroStage.tsx
- devDependencies
- layout.ts
- compilerOptions
- ModuleRig.tsx
- compilerOptions
- ReactorScene.tsx
- Atmosphere.tsx
- dependencies
- heroShell.ts
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- sceneState.ts
- Kerr / realismo del pozo — plan para Kimi
- ticker.ts
- vercel.json
- useOperatorConsole.ts
- sceneState
- blackHole.ts
- diagnose.ts
- diff-hydration.ts
- review-shots.ts
- find-overflow.ts
- tsconfig.json
- scripts
- package.json
- GlyphField.tsx
- CosmicWorld.tsx
- check-cosmos.ts
- BlackHoleEffect
- glyphLayout.ts
- glyphAtlas.ts
- TelemetryStrip.tsx
- index.ts
- lenis
- postprocessing
- gsap
- ReactorControl
- .finale-shots.tmp.ts
- WorldConsoles.tsx
- maath
- react-dom
- react-router
- SceneBoundary.tsx
- @react-three/postprocessing
- zustand

## God Nodes (most connected - your core abstractions)
1. `react` - 51 edges
2. `useCopy()` - 43 edges
3. `useSceneStore` - 42 edges
4. `sceneState` - 34 edges
5. `clamp01()` - 29 edges
6. `trackEvent()` - 27 edges
7. `homePath()` - 27 edges
8. `WorldConsoles()` - 27 edges
9. `HeroStage()` - 26 edges
10. `COPY` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Layout()` --calls--> `localeFromPath()`  [EXTRACTED]
  app/root.tsx → src/lib/locale.ts
- `meta()` --calls--> `pageMeta()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/seo.ts
- `Case()` --calls--> `caseSchema()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/seo.ts
- `meta()` --calls--> `pageMeta()`  [EXTRACTED]
  app/routes/cv.tsx → src/lib/seo.ts
- `Cv()` --calls--> `cvSchema()`  [EXTRACTED]
  app/routes/cv.tsx → src/lib/seo.ts

## Import Cycles
- None detected.

## Communities (57 total, 12 thin omitted)

### Community 0 - "actionRow.ts"
Cohesion: 0.27
Nodes (10): buildActionRows(), ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), TypeMetrics (+2 more)

### Community 1 - "reactorControl.ts"
Cohesion: 0.13
Nodes (15): ReactorSound, SoundToggle(), advanceControl(), Beat, beatPresence(), damp(), LAW_KEYS, LAW_PROFILES (+7 more)

### Community 2 - "home.tsx"
Cohesion: 0.05
Nodes (102): Case(), meta(), Cv(), meta(), Home(), react, .react-router/**, CLIENT (+94 more)

### Community 3 - "reactorConsole.ts"
Cohesion: 0.18
Nodes (19): COMMANDS, installReactorConsole(), isLaw(), ReactorConsoleApi, ReactorConsoleContext, ReactorStatus, Window, decomposeCore() (+11 more)

### Community 4 - "seo.ts"
Cohesion: 0.05
Nodes (65): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), LocaleGate(), meta(), meta(), NotFound() (+57 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.20
Nodes (14): ConsoleSpec, advanceOf(), ConsoleContentRect, ConsolePlacement, ConsoleRow, ConsoleRowKind, KIND_DEFAULTS, layoutConsoleRows() (+6 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.07
Nodes (37): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, portraitAssembleWindow(), _probe (+29 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (29): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE, createBladeGeometry() (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "layout.ts"
Cohesion: 0.09
Nodes (50): APPROACH_Z, closestApproach(), PLUNGE_DEPTH, assertNoOverlap(), beatIn(), buildPlacedConsoles(), frameConsole(), sequenceEvenly() (+42 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "ModuleRig.tsx"
Cohesion: 0.06
Nodes (65): CapabilityNavigator, detectQuality(), isCrawler(), NetworkInformation, prefersLessData(), prefersReducedMotion(), supportsWebGL2(), clearHot() (+57 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "ReactorScene.tsx"
Cohesion: 0.11
Nodes (18): ReactorScene, CosmicIntro(), setPulseDepth(), ClearColour(), ContextGuard(), DPR, PulseDriver(), ReadySignal() (+10 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.24
Nodes (15): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, advancePulse(), idleAmount() (+7 more)

### Community 15 - "dependencies"
Cohesion: 0.15
Nodes (13): isbot, dependencies, isbot, react, @react-router/node, @react-three/drei, @react-three/fiber, three (+5 more)

### Community 16 - "heroShell.ts"
Cohesion: 0.15
Nodes (16): _a, _ab, _ac, _altUp, _b, buildHeroShell(), _c, _centroid (+8 more)

### Community 17 - "bundle-budget.mjs"
Cohesion: 0.24
Nodes (13): BUDGETS, cinemaOnlyFiles(), CLIENT, criticalAssets(), gzip(), kb(), main(), measure() (+5 more)

### Community 18 - "El agujero negro"
Cohesion: 0.06
Nodes (35): A. Desktop: `BlackHoleEffect`, Advección kepleriana sin enrollarse (`BH_KEP_PERIOD`), Anillo de fotones, B. Lite: billboard del gate, Cadena del composer, Canales, Cielo doblado (`bhSky`), Cámara (`Rig.tsx`) (+27 more)

### Community 19 - ".oxlintrc.json"
Cohesion: 0.17
Nodes (11): ignorePatterns, overrides, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, build/** (+3 more)

### Community 20 - "capture-shots.ts"
Cohesion: 0.23
Nodes (11): captureSelf(), main(), MIME, OUT_DIR, requested, serveBuild(), SETTLE, Shot (+3 more)

### Community 21 - "sceneState.ts"
Cohesion: 0.16
Nodes (12): at(), previous, suctionAt(), depthBiasFor(), GULP_TOTAL, gulpEnvelope(), gulpProgress(), Phase (+4 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "ticker.ts"
Cohesion: 0.19
Nodes (14): MotionRuntimeOptions, startMotionRuntime(), handlers, nativeBehavior(), onLayoutRefresh(), RefreshHandler, refreshHandlers, runTicks() (+6 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "useOperatorConsole.ts"
Cohesion: 0.23
Nodes (11): OperatorBar(), useControl(), editable(), LONGEST_WORD, WORDS, controlRevision(), cycleLaw(), ModeId (+3 more)

### Community 26 - "sceneState"
Cohesion: 0.31
Nodes (8): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), sceneState

### Community 27 - "blackHole.ts"
Cohesion: 0.09
Nodes (38): deepestRs, ENDING_DISTANCE, halfDiagonal, previousRs, shadowAtEnd, apparentShadow(), captureRs(), captureRsRetro() (+30 more)

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

### Community 35 - "GlyphField.tsx"
Cohesion: 0.25
Nodes (6): ATTRIBUTES, GlyphField(), GlyphFieldProps, SOURCE_KEYS, GlyphInstances, GlyphMaterial

### Community 36 - "CosmicWorld.tsx"
Cohesion: 0.15
Nodes (19): attach(), AXIS, CosmicWorld(), fieldGeometry(), galaxyGeometry(), gauss(), HII_REGION, MAPS (+11 more)

### Community 37 - "check-cosmos.ts"
Cohesion: 0.10
Nodes (15): arm, arms, armTotal, at(), brightest, centroid, core, early (+7 more)

### Community 39 - "glyphLayout.ts"
Cohesion: 0.18
Nodes (19): glyphAlphaAt(), glyphKey(), GlyphMetric, advanceOf(), countBlockFragments(), countFragments(), Cursor, GlyphForm (+11 more)

### Community 40 - "glyphAtlas.ts"
Cohesion: 0.27
Nodes (10): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), readFamily(), Request, ROLE_TOKEN, ROLE_WEIGHT (+2 more)

### Community 41 - "TelemetryStrip.tsx"
Cohesion: 0.50
Nodes (4): _local, TelemetryStrip(), TelemetryStripProps, BuiltConsole

### Community 42 - "index.ts"
Cohesion: 0.17
Nodes (15): en, es, DEFAULT_LOCALE, Copy, Decision, LabelledValue, Locale, Media (+7 more)

### Community 46 - "ReactorControl"
Cohesion: 0.12
Nodes (20): LAW_PITCHES, LOCK_PITCHES, noiseBuffer(), startReactorSound(), holeCenter, liveLaw, ReactorControl, CONDUIT_Y (+12 more)

### Community 48 - "WorldConsoles.tsx"
Cohesion: 0.33
Nodes (12): COPY, caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), BUDGET (+4 more)

### Community 52 - "SceneBoundary.tsx"
Cohesion: 0.16
Nodes (13): FallbackProps, SceneErrorBoundary, CompactCardProps, FeaturedCardProps, CaseStudy, AboutPortraitProps, Quality, ConsoleBuildInput (+5 more)

## Knowledge Gaps
- **361 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+356 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `seo.ts`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _361 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reactorControl.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13450292397660818 - nodes in this community are weakly interconnected._
- **Should `home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.051864801864801864 - nodes in this community are weakly interconnected._
- **Should `seo.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053946053946053944 - nodes in this community are weakly interconnected._
- **Should `AboutPortrait.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07474747474747474 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._