# Graph Report - preact-davidg  (2026-09-13)

## Corpus Check
- 155 files · ~1,925,066 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1217 nodes · 3064 edges · 76 communities (61 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d5b46b8b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ModuleRig.tsx
- placement.ts
- CinemaLayer.tsx
- useOperatorConsole.ts
- home.tsx
- consoleLayout.ts
- layout.ts
- HeroStage.tsx
- devDependencies
- reactorControl.ts
- compilerOptions
- heroShell.ts
- compilerOptions
- sceneState.ts
- Atmosphere.tsx
- dependencies
- Console.tsx
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- build-assets.ts
- Kerr / realismo del pozo — plan para Kimi
- CaseCard.tsx
- vercel.json
- blackHole.ts
- seo.ts
- WorldConsoles.tsx
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
- Structures.tsx
- not-found.tsx
- final-verify.ts
- index.ts
- glyphAtlas.ts
- verify-laws2.ts
- actionRow.ts
- sceneState
- .finale-shots.tmp.ts
- homeConsoles.ts
- glyphLayout.ts
- locale-gate.tsx
- consoles/types.ts
- shots.mjs
- capability.ts
- BlackHoleEffect
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
- build-sitemap.ts
- silenceClockWarning.ts
- gsap
- postprocessing

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
- `ErrorBoundary()` --calls--> `homePath()`  [EXTRACTED]
  app/root.tsx → src/lib/routes.ts
- `meta()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `meta()` --calls--> `casePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts
- `meta()` --calls--> `samePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts

## Import Cycles
- None detected.

## Communities (76 total, 15 thin omitted)

### Community 0 - "ModuleRig.tsx"
Cohesion: 0.18
Nodes (20): ChassisKind, LEDGER_BARS, ledgerBar(), ledgerChassis(), mergeBoxes(), totemChassis(), vaultChassis(), vaultSeal() (+12 more)

### Community 1 - "placement.ts"
Cohesion: 0.18
Nodes (20): assertNoOverlap(), beatIn(), buildPlacedConsoles(), frameConsole(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole() (+12 more)

### Community 2 - "CinemaLayer.tsx"
Cohesion: 0.10
Nodes (26): shadowAt(), claimLensing(), DISK_OUTER_RS, holeGlowFor(), holeRadiusFor(), iscoRs(), LENS_NEAR, ringWidthFor() (+18 more)

### Community 3 - "useOperatorConsole.ts"
Cohesion: 0.19
Nodes (21): editable(), LONGEST_WORD, useOperatorConsole(), WORDS, COMMANDS, installReactorConsole(), isLaw(), ReactorConsoleApi (+13 more)

### Community 4 - "home.tsx"
Cohesion: 0.06
Nodes (88): Case(), Cv(), Home(), react, .react-router/**, About(), BootGate(), release() (+80 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.21
Nodes (14): advanceOf(), ConsoleContentRect, ConsolePlacement, ConsoleRow, ConsoleRowKind, KIND_DEFAULTS, layoutConsoleRows(), MAX_LINES (+6 more)

### Community 6 - "layout.ts"
Cohesion: 0.05
Nodes (56): SECTION_IDS, AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, isFinitePosition() (+48 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (31): scrollByPixels(), applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE (+23 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "reactorControl.ts"
Cohesion: 0.14
Nodes (18): useControl(), advanceControl(), Beat, completeUplink(), controlRevision(), damp(), fireSector(), grab() (+10 more)

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
Cohesion: 0.13
Nodes (23): MotionRuntimeOptions, startMotionRuntime(), onLayoutRefresh(), runTicks(), setScroller(), Quality, beatPresence(), ReactorSceneProps (+15 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.15
Nodes (21): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, _dir, _fwd (+13 more)

### Community 15 - "dependencies"
Cohesion: 0.08
Nodes (25): isbot, lenis, maath, dependencies, isbot, lenis, maath, react (+17 more)

### Community 16 - "Console.tsx"
Cohesion: 0.26
Nodes (16): clearHot(), markHot(), ActionPlate(), ActionPlateProps, rectOutline(), Console(), ConsoleAction, UplinkGate() (+8 more)

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

### Community 23 - "CaseCard.tsx"
Cohesion: 0.16
Nodes (18): every, CaseDocument(), CvDocument(), SiteShell(), CaseImage(), caseImageName(), CaseImageProps, CompactCard() (+10 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "blackHole.ts"
Cohesion: 0.10
Nodes (28): corridorEnd, deepestRs, ENDING_DISTANCE, halfDiagonal, nucleus, nucleusRs, OPENING, previousCharge (+20 more)

### Community 26 - "seo.ts"
Cohesion: 0.41
Nodes (13): homePath(), translatePath(), alternateLinks(), caseSchema(), crumbs(), cvSchema(), featuredList(), homeSchema() (+5 more)

### Community 27 - "WorldConsoles.tsx"
Cohesion: 0.27
Nodes (12): actionLabelBlocks(), BUDGET, buildActionRows(), WorldConsoles(), WorldConsolesProps, publishBeats(), layoutActionRow(), SceneMode (+4 more)

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
Cohesion: 0.12
Nodes (19): ReactorScene, holeRender, WHITE, PORTAL_POSITION, setPulseDepth(), ClearColour(), ContextGuard(), DPR (+11 more)

### Community 36 - "CosmicWorld.tsx"
Cohesion: 0.14
Nodes (21): attach(), AXIS, CosmicIntro(), CosmicWorld(), deepGeometry(), FAR_GALAXIES, FIELD_CENTRE, fieldGeometry() (+13 more)

### Community 37 - "check-cosmos.ts"
Cohesion: 0.10
Nodes (15): arm, arms, armTotal, at(), brightest, centroid, core, early (+7 more)

### Community 39 - "Structures.tsx"
Cohesion: 0.25
Nodes (10): Box, ARTIFACTS, Bay, BAY_BUILDS, BayBuild, BAYS, beamBoxes(), columnBoxes() (+2 more)

### Community 40 - "not-found.tsx"
Cohesion: 0.25
Nodes (7): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), NotFound(), localeFromPath(), NOT_FOUND_PATH

### Community 42 - "index.ts"
Cohesion: 0.13
Nodes (19): CLIENT, en, es, CASE_SLUGS, COPY, Copy, Decision, LabelledValue (+11 more)

### Community 43 - "glyphAtlas.ts"
Cohesion: 0.27
Nodes (10): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), readFamily(), Request, ROLE_TOKEN, ROLE_WEIGHT (+2 more)

### Community 45 - "actionRow.ts"
Cohesion: 0.36
Nodes (7): ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), measure(), TypeMetrics, GlyphAtlas

### Community 46 - "sceneState"
Cohesion: 0.08
Nodes (26): holeCenter, _local, liveLaw, GridFloor(), buildParts(), GEO_SPECS, Lattice(), Part (+18 more)

### Community 48 - "homeConsoles.ts"
Cohesion: 0.30
Nodes (12): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), projectSpecs(), ConsoleSpec (+4 more)

### Community 49 - "glyphLayout.ts"
Cohesion: 0.18
Nodes (19): glyphAlphaAt(), glyphKey(), GlyphMetric, advanceOf(), countBlockFragments(), countFragments(), Cursor, GlyphForm (+11 more)

### Community 50 - "locale-gate.tsx"
Cohesion: 0.23
Nodes (12): meta(), meta(), meta(), LocaleGate(), meta(), DEFAULT_LOCALE, isLocale(), readPreferredLocale() (+4 more)

### Community 51 - "consoles/types.ts"
Cohesion: 0.29
Nodes (7): AboutPortraitProps, TelemetryStripProps, BuiltConsole, ConsoleActionSpec, ConsoleBuildInput, ConsoleTimingOverride, SectionWindows

### Community 53 - "capability.ts"
Cohesion: 0.16
Nodes (13): CapabilityNavigator, detectQuality(), isCrawler(), NetworkInformation, prefersLessData(), prefersReducedMotion(), supportsWebGL2(), AIM (+5 more)

### Community 55 - "check-swallow.ts"
Cohesion: 0.21
Nodes (10): at(), chaos, eatenAt(), previous, quiet, settle(), suctionAt(), vacuum (+2 more)

### Community 65 - "Handoff — cosmic upgrade (Codex → Claude Code → Codex)"
Cohesion: 0.12
Nodes (16): 1. Qué hizo cada sesión de Codex (10:00–10:16), 2. El build estaba ROTO — qué arreglé, 3. `src/scene/Planets.tsx` — qué hay dentro, 4. Lo que arregló Claude Code fuera de Planets.tsx, 5. Estado verificado ahora mismo, 6. Lo que queda para vos, 7. Segunda ronda — lo que el usuario vio en pantalla, "el agujero negro superpone los objetos" (+8 more)

### Community 66 - "Rig.tsx"
Cohesion: 0.11
Nodes (32): lensAt(), ANCHOR, BAYS, FORWARD, frame(), Framed, ORBIT, POSITION (+24 more)

### Community 67 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 68 - "visual-qa.mjs"
Cohesion: 0.22
Nodes (6): /src/scene/control/reactorControl.ts, /src/scene/sceneState.ts, errors, errors, snapshots, stops

### Community 69 - "Planets.tsx"
Cohesion: 0.16
Nodes (13): holeAxis(), spiralFall(), ANCHOR, AXIS, FLASH, MAPS, Planets(), RADIAL (+5 more)

### Community 71 - "build-sitemap.ts"
Cohesion: 0.17
Nodes (14): escapeXml(), imagesFor(), indexable(), main(), OUT_DIR, priorityFor(), urlEntry(), workIndex() (+6 more)

### Community 73 - "silenceClockWarning.ts"
Cohesion: 0.50
Nodes (3): ConsoleMethod, GlobalWithFlag, INSTALLED

## Knowledge Gaps
- **435 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+430 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _435 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CinemaLayer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._
- **Should `home.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.056171735241502686 - nodes in this community are weakly interconnected._
- **Should `layout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.052403846153846155 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08907563025210084 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._