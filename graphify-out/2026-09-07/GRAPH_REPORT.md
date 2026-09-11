# Graph Report - preact-davidg  (2026-09-07)

## Corpus Check
- 142 files · ~660,896 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1115 nodes · 2933 edges · 64 communities (54 shown, 10 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12804a6a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Console.tsx
- WorldConsoles.tsx
- home.tsx
- reactorControl.ts
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
- check-kerr.ts
- CursorProbe.tsx
- blackHole.ts
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
- BlackHoleEffect
- glyphLayout.ts
- CinemaLayer.tsx
- useCopy
- index.ts
- placement.ts
- postprocessing
- gsap
- SoundToggle.tsx
- .finale-shots.tmp.ts
- homeConsoles.ts
- COPY
- Structures.tsx
- Lattice.tsx
- Quality
- fetch-fonts.ts
- sceneColors.ts
- check-swallow.ts
- SceneErrorBoundary
- audit-static.ts
- mobile-audit.ts
- shot.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 52 edges
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
- `ErrorBoundary()` --calls--> `homePath()`  [EXTRACTED]
  app/root.tsx → src/lib/routes.ts
- `meta()` --calls--> `casePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts
- `meta()` --calls--> `samePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts
- `Case()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts

## Import Cycles
- None detected.

## Communities (64 total, 10 thin omitted)

### Community 0 - "Console.tsx"
Cohesion: 0.21
Nodes (19): clearHot(), grab(), markHot(), punch(), ActionPlate(), ActionPlateProps, rectOutline(), Console() (+11 more)

### Community 1 - "WorldConsoles.tsx"
Cohesion: 0.27
Nodes (17): frameConsole(), actionLabelBlocks(), BUDGET, WorldConsoles(), publishBeats(), BASE_FOV, computeViewportFit(), consoleDistanceFor() (+9 more)

### Community 2 - "home.tsx"
Cohesion: 0.11
Nodes (40): Case(), Cv(), Home(), react, BootGate(), release(), JsonLd(), OperatorBar() (+32 more)

### Community 3 - "reactorControl.ts"
Cohesion: 0.12
Nodes (36): editable(), LONGEST_WORD, useOperatorConsole(), WORDS, COMMANDS, installReactorConsole(), isLaw(), ReactorConsoleApi (+28 more)

### Community 4 - "seo.ts"
Cohesion: 0.11
Nodes (39): meta(), meta(), meta(), LocaleGate(), meta(), meta(), escapeXml(), imagesFor() (+31 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.13
Nodes (23): buildActionRows(), ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), advanceOf() (+15 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.06
Nodes (41): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, portraitAssembleWindow(), _probe (+33 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (31): scrollByPixels(), applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE (+23 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "layout.ts"
Cohesion: 0.11
Nodes (27): APPROACH_Z, closestApproach(), PLUNGE_DEPTH, ARTIFACT_SLOTS, artifactAssembleWindow(), ArtifactPlacement, ARTIFACTS, ArtifactWindow (+19 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "ModuleRig.tsx"
Cohesion: 0.19
Nodes (19): ChassisKind, LEDGER_BARS, ledgerBar(), ledgerChassis(), mergeBoxes(), totemChassis(), vaultChassis(), vaultSeal() (+11 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "ReactorScene.tsx"
Cohesion: 0.13
Nodes (16): ReactorScene, SECTION_IDS, ClearColour(), ContextGuard(), DPR, IgnitionFlare(), ReactorScene(), ReadySignal() (+8 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.20
Nodes (16): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, advancePulse(), idleAmount() (+8 more)

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

### Community 21 - "sceneState.ts"
Cohesion: 0.10
Nodes (27): beatPresence(), ReactorControl, GridFloor(), blankMap, ReconstructShape, ReconstructSync, sceneColors, clamp01() (+19 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "ticker.ts"
Cohesion: 0.08
Nodes (37): Contact(), Hero(), HomeDocument(), ProcessStep(), ProcessStepProps, Services(), Action(), ActionProps (+29 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "check-kerr.ts"
Cohesion: 0.14
Nodes (15): deepestRs, ENDING_DISTANCE, halfDiagonal, nucleus, nucleusRs, OPENING, previousCharge, previousGlow (+7 more)

### Community 26 - "CursorProbe.tsx"
Cohesion: 0.31
Nodes (8): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), pulseAt()

### Community 27 - "blackHole.ts"
Cohesion: 0.18
Nodes (17): captureRs(), claims, DISK_INNER_RS, DISK_OUTER_RS, GATE_APERTURE_Y, GATE_APERTURE_Z_AHEAD, HOLE_SPIN, holeGlowFor() (+9 more)

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
Cohesion: 0.13
Nodes (21): attach(), AXIS, CosmicWorld(), DISK_LIGHT, fieldGeometry(), galaxyGeometry(), gauss(), HII_REGION (+13 more)

### Community 37 - "check-cosmos.ts"
Cohesion: 0.10
Nodes (16): arm, arms, armTotal, at(), brightest, centroid, core, early (+8 more)

### Community 39 - "glyphLayout.ts"
Cohesion: 0.11
Nodes (29): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), glyphAlphaAt(), glyphKey(), GlyphMetric, readFamily() (+21 more)

### Community 40 - "CinemaLayer.tsx"
Cohesion: 0.18
Nodes (14): claimLensing(), holeAxis(), holeCenter, holeRadiusFor(), ringWidthFor(), BlackHole, CinemaLayer(), CinemaLayerProps (+6 more)

### Community 41 - "useCopy"
Cohesion: 0.17
Nodes (26): .react-router/**, About(), CvDocument(), Experience(), FinaleCard(), Footer(), Nav(), NAV_SECTIONS (+18 more)

### Community 42 - "index.ts"
Cohesion: 0.09
Nodes (32): CLIENT, every, CaseDocument(), CaseImage(), caseImageName(), CaseImageProps, CompactCard(), CompactCardProps (+24 more)

### Community 43 - "placement.ts"
Cohesion: 0.21
Nodes (13): assertNoOverlap(), beatIn(), buildPlacedConsoles(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole(), WORLD_UP (+5 more)

### Community 46 - "SoundToggle.tsx"
Cohesion: 0.29
Nodes (9): LAW_PITCHES, LOCK_PITCHES, noiseBuffer(), ReactorSound, startReactorSound(), SoundToggle(), liveLaw, setSoundRequest() (+1 more)

### Community 48 - "homeConsoles.ts"
Cohesion: 0.28
Nodes (12): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), TimedConsole, ConsoleSpec (+4 more)

### Community 49 - "COPY"
Cohesion: 0.25
Nodes (7): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), NotFound(), COPY, localeFromPath(), NOT_FOUND_PATH

### Community 50 - "Structures.tsx"
Cohesion: 0.29
Nodes (9): Box, Bay, BAY_BUILDS, BayBuild, BAYS, beamBoxes(), columnBoxes(), kerbBoxes() (+1 more)

### Community 51 - "Lattice.tsx"
Cohesion: 0.22
Nodes (6): buildParts(), GEO_SPECS, Lattice(), Part, PartKind, ReconstructMaterial

### Community 52 - "Quality"
Cohesion: 0.20
Nodes (12): AboutPortraitProps, Quality, _local, TelemetryStripProps, BuiltConsole, ConsoleActionSpec, ConsoleBuildInput, ConsoleTimingOverride (+4 more)

### Community 53 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 54 - "sceneColors.ts"
Cohesion: 0.38
Nodes (6): FALLBACK, parseable(), readToken(), TokenName, TOKENS, viaCanvas()

### Community 55 - "check-swallow.ts"
Cohesion: 0.47
Nodes (4): at(), eatenAt(), previous, suctionAt()

## Knowledge Gaps
- **375 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+370 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.121) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _375 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11278195488721804 - nodes in this community are weakly interconnected._
- **Should `reactorControl.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.11585365853658537 - nodes in this community are weakly interconnected._
- **Should `seo.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10909090909090909 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `AboutPortrait.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._