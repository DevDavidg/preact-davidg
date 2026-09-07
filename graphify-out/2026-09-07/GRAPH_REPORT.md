# Graph Report - preact-davidg  (2026-09-07)

## Corpus Check
- 136 files · ~238,195 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1088 nodes · 2881 edges · 52 communities (46 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `34bd061f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- WorldConsoles.tsx
- sceneColors.ts
- sceneState.ts
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
- build-assets.ts
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- home.tsx
- Kerr / realismo del pozo — plan para Kimi
- locale.ts
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
- CosmicWorld.tsx
- check-cosmos.ts
- CinemaLayer.tsx
- glyphLayout.ts
- glyphAtlas.ts
- lib/routes.ts
- index.ts
- SceneErrorBoundary
- postprocessing
- gsap
- sceneState
- .finale-shots.tmp.ts
- homeConsoles.ts
- placement.ts

## God Nodes (most connected - your core abstractions)
1. `react` - 51 edges
2. `useCopy()` - 43 edges
3. `useSceneStore` - 42 edges
4. `sceneState` - 34 edges
5. `clamp01()` - 29 edges
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
- `meta()` --calls--> `isLocale()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `meta()` --calls--> `casePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts
- `meta()` --calls--> `samePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts

## Import Cycles
- None detected.

## Communities (52 total, 6 thin omitted)

### Community 0 - "WorldConsoles.tsx"
Cohesion: 0.23
Nodes (19): actionLabelBlocks(), BUDGET, buildActionRows(), WorldConsoles(), publishBeats(), layoutActionRow(), BASE_FOV, computeViewportFit() (+11 more)

### Community 1 - "sceneColors.ts"
Cohesion: 0.38
Nodes (6): FALLBACK, parseable(), readToken(), TokenName, TOKENS, viaCanvas()

### Community 2 - "sceneState.ts"
Cohesion: 0.06
Nodes (59): react, at(), previous, suctionAt(), About(), Contact(), Experience(), FinaleCard() (+51 more)

### Community 3 - "reactorControl.ts"
Cohesion: 0.06
Nodes (65): LAW_PITCHES, LOCK_PITCHES, noiseBuffer(), ReactorSound, startReactorSound(), OperatorBar(), useControl(), SoundToggle() (+57 more)

### Community 4 - "seo.ts"
Cohesion: 0.23
Nodes (21): meta(), LocaleGate(), meta(), DEFAULT_LOCALE, readPreferredLocale(), homePath(), LOCALE_GATE_PATH, alternateLinks() (+13 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.14
Nodes (21): ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), measure(), advanceOf(), ConsoleContentRect, ConsolePlacement (+13 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.09
Nodes (30): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, portraitAssembleWindow(), _probe (+22 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.06
Nodes (46): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, _a, _ab, _ac, _altUp (+38 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "layout.ts"
Cohesion: 0.14
Nodes (25): APPROACH_Z, PLUNGE_DEPTH, frameConsole(), ARTIFACT_SLOTS, artifactAssembleWindow(), ArtifactPlacement, ArtifactWindow, buildAtDepth (+17 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "ModuleRig.tsx"
Cohesion: 0.06
Nodes (62): beatPresence(), clearHot(), markHot(), GridFloor(), ActionPlate(), ActionPlateProps, rectOutline(), Box (+54 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "ReactorScene.tsx"
Cohesion: 0.13
Nodes (19): FallbackProps, ReactorScene, Copy, Quality, WorldConsolesProps, setPulseDepth(), ClearColour(), ContextGuard() (+11 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.20
Nodes (15): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, ARTIFACTS, CONDUIT_Y (+7 more)

### Community 15 - "dependencies"
Cohesion: 0.08
Nodes (25): isbot, lenis, maath, dependencies, isbot, lenis, maath, react (+17 more)

### Community 16 - "build-assets.ts"
Cohesion: 0.19
Nodes (15): buildIcons(), buildSocialCards(), Encoder, encodeWithinBudget(), escapeXml(), ICON_DIR, main(), monogramSvg() (+7 more)

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

### Community 21 - "home.tsx"
Cohesion: 0.15
Nodes (31): Case(), Cv(), meta(), Home(), BootGate(), release(), JsonLd(), SkipLink() (+23 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "locale.ts"
Cohesion: 0.19
Nodes (22): .react-router/**, CvDocument(), Footer(), Nav(), NAV_SECTIONS, NavSection, SiteShell(), WorldNav() (+14 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 26 - "CaseCard.tsx"
Cohesion: 0.20
Nodes (14): CaseDocument(), CaseImage(), caseImageName(), CaseImageProps, CompactCard(), CompactCardProps, ExternalArrow(), FeaturedCard() (+6 more)

### Community 27 - "blackHole.ts"
Cohesion: 0.12
Nodes (28): deepestRs, ENDING_DISTANCE, halfDiagonal, previousRs, shadowAtEnd, apparentShadow(), captureRs(), captureRsRetro() (+20 more)

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
Cohesion: 0.18
Nodes (14): meta(), escapeXml(), imagesFor(), indexable(), main(), OUT_DIR, priorityFor(), urlEntry() (+6 more)

### Community 36 - "CosmicWorld.tsx"
Cohesion: 0.13
Nodes (21): holeAxis(), attach(), AXIS, CosmicIntro(), CosmicWorld(), fieldGeometry(), galaxyGeometry(), gauss() (+13 more)

### Community 37 - "check-cosmos.ts"
Cohesion: 0.10
Nodes (15): arm, arms, armTotal, at(), brightest, centroid, core, early (+7 more)

### Community 38 - "CinemaLayer.tsx"
Cohesion: 0.17
Nodes (8): DISK_OUTER_RS, BlackHoleEffect, BlackHoleEffectOptions, BlackHole, GEODESIC_STEPS, SAMPLES, WHITE, CinemaLayer

### Community 39 - "glyphLayout.ts"
Cohesion: 0.19
Nodes (18): glyphAlphaAt(), glyphKey(), advanceOf(), countBlockFragments(), countFragments(), Cursor, GlyphForm, gridFor() (+10 more)

### Community 40 - "glyphAtlas.ts"
Cohesion: 0.24
Nodes (11): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), GlyphMetric, readFamily(), Request, ROLE_TOKEN (+3 more)

### Community 41 - "lib/routes.ts"
Cohesion: 0.19
Nodes (10): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), NotFound(), COPY, localeFromPath(), CASE_SEGMENT (+2 more)

### Community 42 - "index.ts"
Cohesion: 0.18
Nodes (11): en, es, CASE_SLUGS, Decision, LabelledValue, LOCALES, Media, ProcessPhase (+3 more)

### Community 46 - "sceneState"
Cohesion: 0.12
Nodes (22): holeCenter, _dir, _fwd, pointerOnPlane(), liveLaw, crossGeometry(), CursorProbe(), _probe (+14 more)

### Community 48 - "homeConsoles.ts"
Cohesion: 0.28
Nodes (12): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), TimedConsole, ConsoleSpec (+4 more)

### Community 52 - "placement.ts"
Cohesion: 0.14
Nodes (23): AboutPortraitProps, assertNoOverlap(), beatIn(), buildPlacedConsoles(), sequenceEvenly(), sequenceTimings(), Slot, timeConsole() (+15 more)

## Knowledge Gaps
- **360 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+355 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _360 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `sceneState.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05938037865748709 - nodes in this community are weakly interconnected._
- **Should `reactorControl.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06280701754385964 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.1422924901185771 - nodes in this community are weakly interconnected._
- **Should `AboutPortrait.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05725490196078432 - nodes in this community are weakly interconnected._