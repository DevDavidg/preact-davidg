# Graph Report - preact-davidg  (2026-09-03)

## Corpus Check
- 130 files · ~186,369 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 981 nodes · 2768 edges · 49 communities (45 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `420ee70e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Rig.tsx
- ModuleRig.tsx
- react
- reactorControl.ts
- seo.ts
- consoleLayout.ts
- AboutPortrait.tsx
- HeroStage.tsx
- devDependencies
- FinaleGate.tsx
- compilerOptions
- sceneState
- compilerOptions
- ReactorScene.tsx
- ReactorCore.tsx
- dependencies
- build-assets.ts
- bundle-budget.mjs
- Quality
- .oxlintrc.json
- capture-shots.ts
- sceneState.ts
- WorldConsoles.tsx
- Console.tsx
- vercel.json
- fetch-fonts.ts
- home.tsx
- CinemaLayer.tsx
- diagnose.ts
- diff-hydration.ts
- review-shots.ts
- find-overflow.ts
- tsconfig.json
- scripts
- package.json
- useCopy
- glyphLayout.ts
- placement.ts
- Structures.tsx
- layout.ts
- ReconstructMaterial.ts
- gsap
- CaseCard.tsx
- index.ts
- content/types.ts
- postprocessing
- SceneBoundary.tsx

## God Nodes (most connected - your core abstractions)
1. `react` - 51 edges
2. `useCopy()` - 43 edges
3. `useSceneStore` - 42 edges
4. `clamp01()` - 33 edges
5. `sceneState` - 33 edges
6. `trackEvent()` - 27 edges
7. `HeroStage()` - 27 edges
8. `WorldConsoles()` - 27 edges
9. `homePath()` - 26 edges
10. `Quality` - 22 edges

## Surprising Connections (you probably didn't know these)
- `meta()` --calls--> `pageMeta()`  [EXTRACTED]
  app/routes/locale-gate.tsx → src/lib/seo.ts
- `Layout()` --calls--> `localeFromPath()`  [EXTRACTED]
  app/root.tsx → src/lib/locale.ts
- `ErrorBoundary()` --calls--> `homePath()`  [EXTRACTED]
  app/root.tsx → src/lib/routes.ts
- `meta()` --calls--> `isLocale()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `meta()` --calls--> `casePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts

## Import Cycles
- None detected.

## Communities (49 total, 4 thin omitted)

### Community 0 - "Rig.tsx"
Cohesion: 0.23
Nodes (17): frameConsole(), cameraFovFor(), cameraHoldFor(), cameraPacing(), cameraProgressFor(), corridorLateral(), Rig(), BASE_FOV (+9 more)

### Community 1 - "ModuleRig.tsx"
Cohesion: 0.18
Nodes (20): ChassisKind, LEDGER_BARS, ledgerBar(), ledgerChassis(), mergeBoxes(), totemChassis(), vaultChassis(), vaultSeal() (+12 more)

### Community 2 - "react"
Cohesion: 0.10
Nodes (33): react, About(), BootGate(), release(), Experience(), FinaleCard(), Hero(), HomeDocument() (+25 more)

### Community 3 - "reactorControl.ts"
Cohesion: 0.06
Nodes (66): LAW_PITCHES, LOCK_PITCHES, noiseBuffer(), ReactorSound, startReactorSound(), OperatorBar(), useControl(), SoundToggle() (+58 more)

### Community 4 - "seo.ts"
Cohesion: 0.14
Nodes (29): meta(), meta(), escapeXml(), imagesFor(), indexable(), main(), OUT_DIR, priorityFor() (+21 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.14
Nodes (22): ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), advanceOf(), ConsoleContentRect (+14 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.06
Nodes (41): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, portraitAssembleWindow(), _probe (+33 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.06
Nodes (45): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, _a, _ab, _ac, _altUp (+37 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "FinaleGate.tsx"
Cohesion: 0.22
Nodes (15): holeRadiusFor(), ReactorControl, FinaleGate(), gateColumn(), gateLintel(), gateRing(), mergeGeometries(), WHITE (+7 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "sceneState"
Cohesion: 0.31
Nodes (8): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), sceneState

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "ReactorScene.tsx"
Cohesion: 0.12
Nodes (17): holeRender, setPulseDepth(), ClearColour(), ContextGuard(), DPR, IgnitionFlare(), PulseDriver(), FALLBACK (+9 more)

### Community 14 - "ReactorCore.tsx"
Cohesion: 0.13
Nodes (26): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, strikeCore(), advancePulse() (+18 more)

### Community 15 - "dependencies"
Cohesion: 0.08
Nodes (25): isbot, lenis, maath, dependencies, isbot, lenis, maath, react (+17 more)

### Community 16 - "build-assets.ts"
Cohesion: 0.19
Nodes (15): buildIcons(), buildSocialCards(), Encoder, encodeWithinBudget(), escapeXml(), ICON_DIR, main(), monogramSvg() (+7 more)

### Community 17 - "bundle-budget.mjs"
Cohesion: 0.24
Nodes (13): BUDGETS, cinemaOnlyFiles(), CLIENT, criticalAssets(), gzip(), kb(), main(), measure() (+5 more)

### Community 18 - "Quality"
Cohesion: 0.16
Nodes (15): AboutPortraitProps, Quality, _local, TelemetryStrip(), TelemetryStripProps, BuiltConsole, ConsoleActionSpec, ConsoleBuildInput (+7 more)

### Community 19 - ".oxlintrc.json"
Cohesion: 0.17
Nodes (11): ignorePatterns, overrides, plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, build/** (+3 more)

### Community 20 - "capture-shots.ts"
Cohesion: 0.23
Nodes (11): captureSelf(), main(), MIME, OUT_DIR, requested, serveBuild(), SETTLE, Shot (+3 more)

### Community 21 - "sceneState.ts"
Cohesion: 0.11
Nodes (24): CapabilityNavigator, detectQuality(), ExperienceState, isCrawler(), NetworkInformation, onCapabilityChange(), prefersLessData(), prefersReducedMotion() (+16 more)

### Community 22 - "WorldConsoles.tsx"
Cohesion: 0.25
Nodes (18): Copy, caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), actionLabelBlocks() (+10 more)

### Community 23 - "Console.tsx"
Cohesion: 0.26
Nodes (16): clearHot(), markHot(), ActionPlate(), ActionPlateProps, rectOutline(), Console(), ConsoleAction, UplinkGate() (+8 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 26 - "home.tsx"
Cohesion: 0.16
Nodes (29): Case(), Cv(), meta(), Home(), JsonLd(), SceneBoundary(), RailChapter, ScrollRail() (+21 more)

### Community 27 - "CinemaLayer.tsx"
Cohesion: 0.09
Nodes (26): APPROACH_Z, claimLensing(), claims, DISK_INNER_RS, DISK_OUTER_RS, GATE_APERTURE_Y, GATE_APERTURE_Z_AHEAD, holeAxis() (+18 more)

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

### Community 35 - "useCopy"
Cohesion: 0.23
Nodes (20): .react-router/**, Contact(), CvDocument(), Footer(), Nav(), NAV_SECTIONS, NavSection, SkipLink() (+12 more)

### Community 36 - "glyphLayout.ts"
Cohesion: 0.11
Nodes (29): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), glyphAlphaAt(), glyphKey(), GlyphMetric, readFamily() (+21 more)

### Community 37 - "placement.ts"
Cohesion: 0.20
Nodes (14): assertNoOverlap(), beatIn(), buildPlacedConsoles(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole(), TimedConsole (+6 more)

### Community 38 - "Structures.tsx"
Cohesion: 0.29
Nodes (9): Box, Bay, BAY_BUILDS, BayBuild, BAYS, beamBoxes(), columnBoxes(), kerbBoxes() (+1 more)

### Community 39 - "layout.ts"
Cohesion: 0.19
Nodes (14): ARTIFACT_SLOTS, artifactAssembleWindow(), artifactGroupWindows(), ArtifactPlacement, ArtifactWindow, buildAtDepth, buildForPath(), cameraBeatProgresses (+6 more)

### Community 40 - "ReconstructMaterial.ts"
Cohesion: 0.14
Nodes (10): buildParts(), GEO_SPECS, Lattice(), Part, PartKind, blankMap, ReconstructMaterial, ReconstructShape (+2 more)

### Community 46 - "CaseCard.tsx"
Cohesion: 0.16
Nodes (18): CaseDocument(), CaseImage(), caseImageName(), CaseImageProps, CompactCard(), CompactCardProps, ExternalArrow(), FeaturedCard() (+10 more)

### Community 47 - "index.ts"
Cohesion: 0.14
Nodes (18): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), LocaleGate(), meta(), meta(), NotFound(), CASE_SLUGS (+10 more)

### Community 48 - "content/types.ts"
Cohesion: 0.17
Nodes (9): en, es, Decision, LabelledValue, Media, ProcessPhase, ProjectKind, Role (+1 more)

### Community 52 - "SceneBoundary.tsx"
Cohesion: 0.29
Nodes (3): FallbackProps, ReactorScene, SceneErrorBoundary

## Knowledge Gaps
- **293 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+288 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _293 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `reactorControl.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06140350877192982 - nodes in this community are weakly interconnected._
- **Should `seo.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1443850267379679 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14130434782608695 - nodes in this community are weakly interconnected._
- **Should `AboutPortrait.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06259426847662142 - nodes in this community are weakly interconnected._