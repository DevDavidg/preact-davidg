# Graph Report - preact-davidg  (2026-09-11)

## Corpus Check
- 155 files · ~1,927,154 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1215 nodes · 3059 edges · 75 communities (60 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12804a6a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ModuleRig.tsx
- WorldConsoles.tsx
- CinemaLayer.tsx
- useOperatorConsole.ts
- sceneState.ts
- consoleLayout.ts
- AboutPortrait.tsx
- HeroStage.tsx
- devDependencies
- reactorControl.ts
- compilerOptions
- heroShell.ts
- compilerOptions
- ticker.ts
- Atmosphere.tsx
- dependencies
- portraitVoxels.ts
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- useCopy
- Kerr / realismo del pozo — plan para Kimi
- lib/routes.ts
- vercel.json
- blackHole.ts
- sceneState
- not-found.tsx
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
- tailwindcss
- final-verify.ts
- CaseStudy
- @tailwindcss/vite
- verify-laws2.ts
- sceneColors.ts
- GlyphField.tsx
- .finale-shots.tmp.ts
- homeConsoles.ts
- glyphLayout.ts
- index.ts
- placement.ts
- shots.mjs
- SwallowShape
- GlyphMaterial.ts
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
- seo.ts
- Action.tsx
- lenis

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
- `meta()` --calls--> `pageMeta()`  [EXTRACTED]
  app/routes/locale-gate.tsx → src/lib/seo.ts
- `every` --calls--> `casePath()`  [EXTRACTED]
  scripts/check-routes.ts → src/lib/routes.ts
- `Layout()` --calls--> `localeFromPath()`  [EXTRACTED]
  app/root.tsx → src/lib/locale.ts
- `ErrorBoundary()` --calls--> `homePath()`  [EXTRACTED]
  app/root.tsx → src/lib/routes.ts
- `meta()` --calls--> `findCase()`  [EXTRACTED]
  app/routes/case.tsx → src/content/index.ts

## Import Cycles
- None detected.

## Communities (75 total, 15 thin omitted)

### Community 0 - "ModuleRig.tsx"
Cohesion: 0.06
Nodes (63): CapabilityNavigator, detectQuality(), isCrawler(), NetworkInformation, prefersLessData(), prefersReducedMotion(), supportsWebGL2(), beatPresence() (+55 more)

### Community 1 - "WorldConsoles.tsx"
Cohesion: 0.23
Nodes (20): frameConsole(), actionLabelBlocks(), BUDGET, buildActionRows(), WorldConsoles(), publishBeats(), BASE_FOV, computeViewportFit() (+12 more)

### Community 2 - "CinemaLayer.tsx"
Cohesion: 0.09
Nodes (19): DISK_OUTER_RS, LENS_FAR, LENS_NEAR, BlackHoleEffect, BlackHoleEffectOptions, BlackHole, CHAOS_CHILL, CHAOS_COOL (+11 more)

### Community 3 - "useOperatorConsole.ts"
Cohesion: 0.19
Nodes (21): editable(), LONGEST_WORD, useOperatorConsole(), WORDS, COMMANDS, installReactorConsole(), isLaw(), ReactorConsoleApi (+13 more)

### Community 4 - "sceneState.ts"
Cohesion: 0.10
Nodes (49): Case(), meta(), Cv(), meta(), Home(), meta(), react, BootGate() (+41 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.14
Nodes (22): ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), advanceOf(), ConsoleContentRect (+14 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.18
Nodes (15): AboutPortrait(), ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, isFinitePosition(), portraitAssembleWindow() (+7 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (29): applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE, createBladeGeometry() (+21 more)

### Community 8 - "devDependencies"
Cohesion: 0.07
Nodes (27): oxlint, devDependencies, oxlint, @playwright/test, @react-router/dev, schema-dts, sharp, subset-font (+19 more)

### Community 9 - "reactorControl.ts"
Cohesion: 0.17
Nodes (15): advanceControl(), Beat, completeUplink(), damp(), fireSector(), grab(), LAW_KEYS, LAW_PROFILES (+7 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "heroShell.ts"
Cohesion: 0.15
Nodes (16): _a, _ab, _ac, _altUp, _b, buildHeroShell(), _c, _centroid (+8 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "ticker.ts"
Cohesion: 0.20
Nodes (13): MotionRuntimeOptions, startMotionRuntime(), handlers, nativeBehavior(), onLayoutRefresh(), RefreshHandler, refreshHandlers, runTicks() (+5 more)

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.20
Nodes (17): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, advancePulse(), idleAmount() (+9 more)

### Community 15 - "dependencies"
Cohesion: 0.07
Nodes (27): gsap, isbot, maath, dependencies, gsap, isbot, maath, postprocessing (+19 more)

### Community 16 - "portraitVoxels.ts"
Cohesion: 0.36
Nodes (9): buildPortraitVoxels(), chroma(), coverSampleRect(), dilateMask(), hash01(), isStudioBackground(), luminance(), PortraitVoxelField (+1 more)

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

### Community 21 - "useCopy"
Cohesion: 0.17
Nodes (23): About(), Contact(), Experience(), FinaleCard(), Hero(), HomeDocument(), Process(), ProcessStep() (+15 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "lib/routes.ts"
Cohesion: 0.13
Nodes (33): .react-router/**, CaseDocument(), CvDocument(), Footer(), Nav(), NAV_SECTIONS, NavSection, SiteShell() (+25 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "blackHole.ts"
Cohesion: 0.09
Nodes (39): corridorEnd, deepestRs, ENDING_DISTANCE, halfDiagonal, lensAt(), nucleus, nucleusRs, OPENING (+31 more)

### Community 26 - "sceneState"
Cohesion: 0.31
Nodes (8): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), sceneState

### Community 27 - "not-found.tsx"
Cohesion: 0.25
Nodes (7): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), NotFound(), localeFromPath(), NOT_FOUND_PATH

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
Cohesion: 0.14
Nodes (12): ReactorScene, CosmicIntro(), CinemaLayer, ClearColour(), ContextGuard(), DPR, IgnitionFlare(), ReadySignal() (+4 more)

### Community 36 - "CosmicWorld.tsx"
Cohesion: 0.15
Nodes (20): attach(), AXIS, CosmicWorld(), deepGeometry(), FAR_GALAXIES, FIELD_CENTRE, fieldGeometry(), galaxyGeometry() (+12 more)

### Community 37 - "check-cosmos.ts"
Cohesion: 0.10
Nodes (15): arm, arms, armTotal, at(), brightest, centroid, core, early (+7 more)

### Community 39 - "layout.ts"
Cohesion: 0.13
Nodes (20): ARTIFACT_SLOTS, artifactAssembleWindow(), ArtifactPlacement, ARTIFACTS, ArtifactWindow, buildAtDepth, buildForPath(), cameraBeatProgresses (+12 more)

### Community 42 - "CaseStudy"
Cohesion: 0.11
Nodes (21): CaseImageProps, CompactCardProps, FeaturedCardProps, en, es, CaseStudy, Copy, Decision (+13 more)

### Community 45 - "sceneColors.ts"
Cohesion: 0.21
Nodes (10): blankMap, ReconstructShape, ReconstructSync, FALLBACK, parseable(), readToken(), sceneColors, TokenName (+2 more)

### Community 46 - "GlyphField.tsx"
Cohesion: 0.25
Nodes (6): ATTRIBUTES, GlyphField(), GlyphFieldProps, SOURCE_KEYS, GlyphInstances, GlyphMaterial

### Community 48 - "homeConsoles.ts"
Cohesion: 0.28
Nodes (12): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), TimedConsole, ConsoleSpec (+4 more)

### Community 49 - "glyphLayout.ts"
Cohesion: 0.11
Nodes (29): buildGlyphAtlas(), collectRequests(), FALLBACK_FAMILY, fontString(), glyphAlphaAt(), glyphKey(), GlyphMetric, readFamily() (+21 more)

### Community 50 - "index.ts"
Cohesion: 0.14
Nodes (13): LocaleGate(), meta(), CLIENT, every, FallbackProps, SceneErrorBoundary, CASE_SLUGS, COPY (+5 more)

### Community 51 - "placement.ts"
Cohesion: 0.12
Nodes (26): AboutPortraitProps, Quality, assertNoOverlap(), beatIn(), buildPlacedConsoles(), sequenceEvenly(), sequenceTimings(), Slot (+18 more)

### Community 53 - "SwallowShape"
Cohesion: 0.14
Nodes (12): holeCenter, AIM, CHAOS_TINT, COMET_TINT, CosmicEvents(), NOVA_TINT, ROCK_TINT, VACUUM_TINT (+4 more)

### Community 54 - "GlyphMaterial.ts"
Cohesion: 0.17
Nodes (11): liveLaw, FOG_DENSITY, finite(), PortraitVoxelMaterial, PortraitVoxelSync, clamp01(), settleAt(), smoothstep01() (+3 more)

### Community 55 - "check-swallow.ts"
Cohesion: 0.21
Nodes (10): at(), chaos, eatenAt(), previous, quiet, settle(), suctionAt(), vacuum (+2 more)

### Community 65 - "Handoff — cosmic upgrade (Codex → Claude Code → Codex)"
Cohesion: 0.12
Nodes (16): 1. Qué hizo cada sesión de Codex (10:00–10:16), 2. El build estaba ROTO — qué arreglé, 3. `src/scene/Planets.tsx` — qué hay dentro, 4. Lo que arregló Claude Code fuera de Planets.tsx, 5. Estado verificado ahora mismo, 6. Lo que queda para vos, 7. Segunda ronda — lo que el usuario vio en pantalla, "el agujero negro superpone los objetos" (+8 more)

### Community 66 - "Rig.tsx"
Cohesion: 0.12
Nodes (31): ANCHOR, BAYS, FORWARD, frame(), Framed, ORBIT, POSITION, REL (+23 more)

### Community 67 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 68 - "visual-qa.mjs"
Cohesion: 0.22
Nodes (6): /src/scene/control/reactorControl.ts, /src/scene/sceneState.ts, errors, errors, snapshots, stops

### Community 69 - "Planets.tsx"
Cohesion: 0.16
Nodes (14): holeAxis(), spiralFall(), ANCHOR, AXIS, FLASH, MAPS, Planets(), RADIAL (+6 more)

### Community 71 - "seo.ts"
Cohesion: 0.09
Nodes (40): buildIcons(), buildSocialCards(), Encoder, encodeWithinBudget(), escapeXml(), ICON_DIR, main(), monogramSvg() (+32 more)

### Community 73 - "Action.tsx"
Cohesion: 0.43
Nodes (6): Action(), ActionProps, isExternal(), MagneticProps, Variant, AnalyticsEvent

## Knowledge Gaps
- **435 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+430 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `seo.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _435 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ModuleRig.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.060694579681921455 - nodes in this community are weakly interconnected._
- **Should `CinemaLayer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09057971014492754 - nodes in this community are weakly interconnected._
- **Should `sceneState.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09543193125282677 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.14130434782608695 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0928030303030303 - nodes in this community are weakly interconnected._