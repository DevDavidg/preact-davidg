# Graph Report - preact-davidg  (2026-09-07)

## Corpus Check
- 135 files · ~213,460 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1045 nodes · 2828 edges · 57 communities (50 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `420ee70e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- placement.ts
- ReconstructMaterial.ts
- react
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
- FinaleGate.tsx
- diagnose.ts
- diff-hydration.ts
- review-shots.ts
- find-overflow.ts
- tsconfig.json
- scripts
- package.json
- build-sitemap.ts
- glyphLayout.ts
- sceneState.ts
- CinemaLayer.tsx
- react-router
- Quality
- lib/routes.ts
- index.ts
- GlyphMaterial.ts
- glyphAtlas.ts
- gsap
- CursorProbe.tsx
- .finale-shots.tmp.ts
- WorldConsoles.tsx
- @react-router/node
- portraitVoxels.ts
- sceneColors.ts
- sectionRanges.ts
- GlyphField.tsx
- SceneErrorBoundary

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
- `meta()` --calls--> `isLocale()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts
- `meta()` --calls--> `casePath()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/routes.ts
- `meta()` --calls--> `pageMeta()`  [EXTRACTED]
  app/routes/case.tsx → src/lib/seo.ts

## Import Cycles
- None detected.

## Communities (57 total, 7 thin omitted)

### Community 0 - "placement.ts"
Cohesion: 0.14
Nodes (30): APPROACH_Z, PLUNGE_DEPTH, assertNoOverlap(), beatIn(), buildPlacedConsoles(), frameConsole(), sequenceEvenly(), sequenceTimings() (+22 more)

### Community 1 - "ReconstructMaterial.ts"
Cohesion: 0.27
Nodes (8): holeCenter, liveLaw, GridFloor(), blankMap, ReconstructShape, ReconstructSync, sceneColors, SwallowShape

### Community 2 - "react"
Cohesion: 0.11
Nodes (33): react, About(), BootGate(), release(), Contact(), Experience(), FinaleCard(), Hero() (+25 more)

### Community 3 - "reactorControl.ts"
Cohesion: 0.09
Nodes (49): LAW_PITCHES, LOCK_PITCHES, noiseBuffer(), ReactorSound, startReactorSound(), OperatorBar(), useControl(), SoundToggle() (+41 more)

### Community 4 - "seo.ts"
Cohesion: 0.23
Nodes (21): meta(), LocaleGate(), meta(), DEFAULT_LOCALE, readPreferredLocale(), homePath(), LOCALE_GATE_PATH, alternateLinks() (+13 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.14
Nodes (22): ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), advanceOf(), ConsoleContentRect (+14 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.19
Nodes (14): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, portraitAssembleWindow(), _probe (+6 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.06
Nodes (45): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, _a, _ab, _ac, _altUp (+37 more)

### Community 8 - "devDependencies"
Cohesion: 0.06
Nodes (31): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+23 more)

### Community 9 - "layout.ts"
Cohesion: 0.12
Nodes (22): ARTIFACT_SLOTS, artifactAssembleWindow(), ArtifactPlacement, ARTIFACTS, ArtifactWindow, buildAtDepth, buildForPath(), cameraBeatProgresses (+14 more)

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
Cohesion: 0.11
Nodes (18): ReactorScene, advanceControl(), damp(), CosmicIntro(), CosmicWorld(), PLANETS, random(), stellarGeometry() (+10 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.23
Nodes (14): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, advancePulse(), idleAmount() (+6 more)

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
Cohesion: 0.17
Nodes (28): Case(), Cv(), meta(), Home(), JsonLd(), SkipLink(), FallbackProps, SceneBoundary() (+20 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar (+9 more)

### Community 23 - "locale.ts"
Cohesion: 0.24
Nodes (17): .react-router/**, CvDocument(), Footer(), Nav(), NAV_SECTIONS, NavSection, SiteShell(), WorldNav() (+9 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 26 - "CaseCard.tsx"
Cohesion: 0.17
Nodes (17): CaseDocument(), CaseImage(), caseImageName(), CaseImageProps, CompactCard(), CompactCardProps, ExternalArrow(), FeaturedCard() (+9 more)

### Community 27 - "FinaleGate.tsx"
Cohesion: 0.15
Nodes (23): deepestRs, captureRs(), captureRsRetro(), claims, closestApproach(), DISK_INNER_RS, DISK_OUTER_RS, GATE_APERTURE_Y (+15 more)

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
Nodes (15): meta(), escapeXml(), imagesFor(), indexable(), main(), OUT_DIR, priorityFor(), urlEntry() (+7 more)

### Community 36 - "glyphLayout.ts"
Cohesion: 0.18
Nodes (19): glyphAlphaAt(), glyphKey(), GlyphMetric, advanceOf(), countBlockFragments(), countFragments(), Cursor, GlyphForm (+11 more)

### Community 37 - "sceneState.ts"
Cohesion: 0.06
Nodes (42): at(), previous, suctionAt(), useExperience(), NEXT_DOWN, NEXT_UP, MotionRuntimeOptions, startMotionRuntime() (+34 more)

### Community 38 - "CinemaLayer.tsx"
Cohesion: 0.16
Nodes (11): claimLensing(), holeAxis(), holeGateFor(), holeRadiusFor(), BlackHoleEffect, BlackHoleEffectOptions, BlackHole, CinemaLayer() (+3 more)

### Community 40 - "Quality"
Cohesion: 0.18
Nodes (13): AboutPortraitProps, Quality, _local, TelemetryStrip(), TelemetryStripProps, BuiltConsole, ConsoleActionSpec, ConsoleBuildInput (+5 more)

### Community 41 - "lib/routes.ts"
Cohesion: 0.18
Nodes (10): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), NotFound(), CASE_SLUGS, localeFromPath(), CASE_SEGMENT (+2 more)

### Community 42 - "index.ts"
Cohesion: 0.19
Nodes (12): en, es, Copy, Decision, LabelledValue, LOCALES, Media, ProcessPhase (+4 more)

### Community 43 - "GlyphMaterial.ts"
Cohesion: 0.20
Nodes (9): FOG_DENSITY, PortraitVoxelMaterial, PortraitVoxelSync, clamp01(), settleAt(), smoothstep01(), STAGGER_CAP, STAGGER_RATIO (+1 more)

### Community 44 - "glyphAtlas.ts"
Cohesion: 0.27
Nodes (10): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), readFamily(), Request, ROLE_TOKEN, ROLE_WEIGHT (+2 more)

### Community 46 - "CursorProbe.tsx"
Cohesion: 0.31
Nodes (8): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), pulseAt()

### Community 48 - "WorldConsoles.tsx"
Cohesion: 0.22
Nodes (20): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), TimedConsole, ConsoleSpec (+12 more)

### Community 50 - "portraitVoxels.ts"
Cohesion: 0.36
Nodes (9): buildPortraitVoxels(), chroma(), coverSampleRect(), dilateMask(), hash01(), isStudioBackground(), luminance(), PortraitVoxelField (+1 more)

### Community 51 - "sceneColors.ts"
Cohesion: 0.27
Nodes (9): ClearColour(), ContextGuard(), FALLBACK, parseable(), readToken(), refreshSceneColors(), TokenName, TOKENS (+1 more)

### Community 52 - "sectionRanges.ts"
Cohesion: 0.42
Nodes (7): ReactorScene(), measureSectionWindows(), onSectionLayoutChange(), sameWindows(), scrollLimit(), SectionWindow, useSectionWindows()

### Community 53 - "GlyphField.tsx"
Cohesion: 0.25
Nodes (6): ATTRIBUTES, GlyphField(), GlyphFieldProps, SOURCE_KEYS, GlyphInstances, GlyphMaterial

## Knowledge Gaps
- **330 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _330 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `placement.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.1126530612244898 - nodes in this community are weakly interconnected._
- **Should `reactorControl.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08832425892316999 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14130434782608695 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05877551020408163 - nodes in this community are weakly interconnected._