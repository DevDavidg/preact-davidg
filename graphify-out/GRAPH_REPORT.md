# Graph Report - preact-davidg  (2026-09-07)

## Corpus Check
- 135 files · ~211,862 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1041 nodes · 2806 edges · 57 communities (51 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `420ee70e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Rig.tsx
- ReconstructMaterial.ts
- react
- useOperatorConsole.ts
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
- build-assets.ts
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- home.tsx
- Kerr / realismo del pozo — plan para Kimi
- Nav.tsx
- vercel.json
- fetch-fonts.ts
- CaseCard.tsx
- blackHole.ts
- diagnose.ts
- diff-hydration.ts
- review-shots.ts
- find-overflow.ts
- tsconfig.json
- scripts
- package.json
- build-sitemap.ts
- reactorControl.ts
- ticker.ts
- CinemaLayer.tsx
- react-router
- WorldConsoles.tsx
- index.ts
- content/types.ts
- heroShell.ts
- sceneState.ts
- gsap
- CursorProbe.tsx
- .finale-shots.tmp.ts
- homeConsoles.ts
- @react-router/node
- placement.ts
- capability.ts
- sectionRanges.ts
- ReactorControl
- silenceClockWarning.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 51 edges
2. `useCopy()` - 43 edges
3. `useSceneStore` - 42 edges
4. `sceneState` - 33 edges
5. `clamp01()` - 31 edges
6. `trackEvent()` - 27 edges
7. `WorldConsoles()` - 27 edges
8. `homePath()` - 26 edges
9. `HeroStage()` - 26 edges
10. `COPY` - 22 edges

## Surprising Connections (you probably didn't know these)
- `Layout()` --calls--> `localeFromPath()`  [EXTRACTED]
  app/root.tsx → src/lib/locale.ts
- `ErrorBoundary()` --calls--> `homePath()`  [EXTRACTED]
  app/root.tsx → src/lib/routes.ts
- `meta()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `meta()` --calls--> `casePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts
- `Case()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts

## Import Cycles
- None detected.

## Communities (57 total, 6 thin omitted)

### Community 0 - "Rig.tsx"
Cohesion: 0.16
Nodes (26): APPROACH_Z, PLUNGE_DEPTH, frameConsole(), actionLabelBlocks(), WorldConsoles(), publishBeats(), cameraFovFor(), cameraHoldFor() (+18 more)

### Community 1 - "ReconstructMaterial.ts"
Cohesion: 0.18
Nodes (12): holeCenter, GridFloor(), blankMap, ReconstructShape, ReconstructSync, FALLBACK, parseable(), readToken() (+4 more)

### Community 2 - "react"
Cohesion: 0.11
Nodes (36): react, LAW_PITCHES, LOCK_PITCHES, noiseBuffer(), ReactorSound, startReactorSound(), About(), Contact() (+28 more)

### Community 3 - "useOperatorConsole.ts"
Cohesion: 0.22
Nodes (20): editable(), LONGEST_WORD, useOperatorConsole(), WORDS, COMMANDS, installReactorConsole(), isLaw(), ReactorConsoleApi (+12 more)

### Community 4 - "seo.ts"
Cohesion: 0.21
Nodes (22): meta(), meta(), meta(), LocaleGate(), meta(), isLocale(), readPreferredLocale(), homePath() (+14 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.07
Nodes (50): ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), measure(), advanceOf(), ConsoleContentRect, ConsolePlacement (+42 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.06
Nodes (37): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, portraitAssembleWindow(), _probe (+29 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (29): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE, createBladeGeometry() (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "layout.ts"
Cohesion: 0.12
Nodes (21): ARTIFACT_SLOTS, artifactAssembleWindow(), ArtifactPlacement, ARTIFACTS, ArtifactWindow, buildAtDepth, buildForPath(), cameraBeatProgresses (+13 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "ModuleRig.tsx"
Cohesion: 0.07
Nodes (56): beatPresence(), clearHot(), markHot(), ActionPlate(), ActionPlateProps, rectOutline(), Box, ChassisKind (+48 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "ReactorScene.tsx"
Cohesion: 0.14
Nodes (17): ReactorScene, advanceControl(), damp(), CosmicIntro(), CosmicWorld(), PLANETS, random(), stellarGeometry() (+9 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.24
Nodes (15): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, advancePulse(), idleAmount() (+7 more)

### Community 15 - "dependencies"
Cohesion: 0.09
Nodes (23): isbot, lenis, maath, dependencies, isbot, lenis, maath, postprocessing (+15 more)

### Community 16 - "build-assets.ts"
Cohesion: 0.21
Nodes (14): buildIcons(), buildSocialCards(), Encoder, encodeWithinBudget(), escapeXml(), ICON_DIR, main(), monogramSvg() (+6 more)

### Community 17 - "bundle-budget.mjs"
Cohesion: 0.24
Nodes (13): BUDGETS, cinemaOnlyFiles(), CLIENT, criticalAssets(), gzip(), kb(), main(), measure() (+5 more)

### Community 18 - "El agujero negro"
Cohesion: 0.06
Nodes (31): A. Desktop: `BlackHoleEffect`, B. Lite: billboard del gate, Cadena del composer, Canales, Cielo doblado (`bhSky`), Cámara (`Rig.tsx`), Cómo se enciende, Cómo verificarlo (+23 more)

### Community 19 - ".oxlintrc.json"
Cohesion: 0.17
Nodes (11): ignorePatterns, overrides, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, build/** (+3 more)

### Community 20 - "capture-shots.ts"
Cohesion: 0.23
Nodes (11): captureSelf(), main(), MIME, OUT_DIR, requested, serveBuild(), SETTLE, Shot (+3 more)

### Community 21 - "home.tsx"
Cohesion: 0.18
Nodes (26): Case(), Cv(), Home(), BootGate(), release(), JsonLd(), SkipLink(), SceneBoundary() (+18 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "Nav.tsx"
Cohesion: 0.20
Nodes (20): .react-router/**, Footer(), Nav(), NAV_SECTIONS, NavSection, Action(), ActionProps, isExternal() (+12 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 26 - "CaseCard.tsx"
Cohesion: 0.15
Nodes (20): CaseDocument(), CvDocument(), SiteShell(), CaseImage(), caseImageName(), CaseImageProps, CompactCard(), CompactCardProps (+12 more)

### Community 27 - "blackHole.ts"
Cohesion: 0.15
Nodes (24): deepestRs, captureRs(), captureRsRetro(), claimLensing(), claims, closestApproach(), DISK_INNER_RS, GATE_APERTURE_Y (+16 more)

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

### Community 35 - "build-sitemap.ts"
Cohesion: 0.16
Nodes (15): escapeXml(), imagesFor(), indexable(), main(), OUT_DIR, priorityFor(), urlEntry(), workIndex() (+7 more)

### Community 36 - "reactorControl.ts"
Cohesion: 0.16
Nodes (14): Beat, completeUplink(), fireSector(), grab(), LAW_KEYS, LAW_PROFILES, LawProfile, LAWS (+6 more)

### Community 37 - "ticker.ts"
Cohesion: 0.19
Nodes (14): MotionRuntimeOptions, startMotionRuntime(), handlers, nativeBehavior(), onLayoutRefresh(), RefreshHandler, refreshHandlers, runTicks() (+6 more)

### Community 38 - "CinemaLayer.tsx"
Cohesion: 0.15
Nodes (10): DISK_OUTER_RS, BlackHoleEffect, BlackHoleEffectOptions, BlackHole, CinemaLayerProps, GEODESIC_STEPS, SAMPLES, WHITE (+2 more)

### Community 40 - "WorldConsoles.tsx"
Cohesion: 0.19
Nodes (16): Copy, CopyBundle, AboutPortraitProps, Quality, TelemetryStripProps, BuiltConsole, ConsoleActionSpec, ConsoleBuildInput (+8 more)

### Community 41 - "index.ts"
Cohesion: 0.10
Nodes (21): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), NotFound(), FallbackProps, SceneErrorBoundary, RailChapter (+13 more)

### Community 42 - "content/types.ts"
Cohesion: 0.17
Nodes (9): en, es, Decision, LabelledValue, Media, ProcessPhase, ProjectKind, Role (+1 more)

### Community 43 - "heroShell.ts"
Cohesion: 0.15
Nodes (16): _a, _ab, _ac, _altUp, _b, buildHeroShell(), _c, _centroid (+8 more)

### Community 44 - "sceneState.ts"
Cohesion: 0.17
Nodes (11): at(), previous, suctionAt(), depthBiasFor(), GULP_TOTAL, gulpEnvelope(), gulpProgress(), Phase (+3 more)

### Community 46 - "CursorProbe.tsx"
Cohesion: 0.33
Nodes (7): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry()

### Community 48 - "homeConsoles.ts"
Cohesion: 0.32
Nodes (10): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), trimLead(), trimTitle() (+2 more)

### Community 50 - "placement.ts"
Cohesion: 0.24
Nodes (12): assertNoOverlap(), beatIn(), buildPlacedConsoles(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole(), TimedConsole (+4 more)

### Community 51 - "capability.ts"
Cohesion: 0.27
Nodes (10): CapabilityNavigator, detectQuality(), ExperienceState, isCrawler(), NetworkInformation, onCapabilityChange(), prefersLessData(), prefersReducedMotion() (+2 more)

### Community 52 - "sectionRanges.ts"
Cohesion: 0.38
Nodes (8): ReactorScene(), clamp01(), measureSectionWindows(), onSectionLayoutChange(), sameWindows(), scrollLimit(), SectionWindow, useSectionWindows()

### Community 53 - "ReactorControl"
Cohesion: 0.36
Nodes (7): OperatorBar(), useControl(), controlRevision(), cycleLaw(), MODES, ReactorControl, subscribeControl()

### Community 54 - "silenceClockWarning.ts"
Cohesion: 0.50
Nodes (3): ConsoleMethod, GlobalWithFlag, INSTALLED

## Knowledge Gaps
- **330 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _330 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.10572390572390572 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0707070707070707 - nodes in this community are weakly interconnected._
- **Should `AboutPortrait.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._