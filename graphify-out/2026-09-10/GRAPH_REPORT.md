# Graph Report - preact-davidg  (2026-09-08)

## Corpus Check
- 157 files · ~1,642,849 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1238 nodes · 3067 edges · 74 communities (58 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12804a6a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- ModuleRig.tsx
- WorldConsoles.tsx
- locale-gate.tsx
- useOperatorConsole.ts
- seo.ts
- consoleLayout.ts
- AboutPortrait.tsx
- HeroStage.tsx
- devDependencies
- CinemaLayer.tsx
- compilerOptions
- locale.ts
- compilerOptions
- not-found.tsx
- Atmosphere.tsx
- dependencies
- heroShell.ts
- bundle-budget.mjs
- El agujero negro
- .oxlintrc.json
- capture-shots.ts
- CaseCard.tsx
- Kerr / realismo del pozo — plan para Kimi
- sceneState.ts
- vercel.json
- blackHole.ts
- MeteorStorm.tsx
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
- ReactorScene.tsx
- .tune-flyby.ts
- final-verify.ts
- index.ts
- sectionRanges.ts
- verify-laws2.ts
- SceneErrorBoundary
- reactorControl.ts
- .finale-shots.tmp.ts
- homeConsoles.ts
- silenceClockWarning.ts
- SwallowShape
- placement.ts
- shots.mjs
- fetch-fonts.ts
- sceneColors.ts
- check-swallow.ts
- audit-static.ts
- mobile-audit.ts
- shot.ts
- vacuum-verify.ts
- Handoff — cosmic upgrade (Codex → Claude Code → Codex)
- layout.ts
- capability.ts
- visual-qa.mjs
- @playwright/test
- AGENTS.md
- schema-dts
- @types/react-dom

## God Nodes (most connected - your core abstractions)
1. `react` - 54 edges
2. `useCopy()` - 41 edges
3. `useSceneStore` - 40 edges
4. `sceneState` - 35 edges
5. `clamp01()` - 28 edges
6. `trackEvent()` - 27 edges
7. `homePath()` - 27 edges
8. `WorldConsoles()` - 27 edges
9. `HeroStage()` - 26 edges
10. `SwallowShape` - 25 edges

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

## Communities (74 total, 16 thin omitted)

### Community 0 - "ModuleRig.tsx"
Cohesion: 0.06
Nodes (64): clearHot(), completeUplink(), markHot(), punch(), ReactorControl, ActionPlate(), ActionPlateProps, rectOutline() (+56 more)

### Community 1 - "WorldConsoles.tsx"
Cohesion: 0.25
Nodes (18): frameConsole(), actionLabelBlocks(), BUDGET, buildActionRows(), WorldConsoles(), publishBeats(), computeViewportFit(), consoleDistanceFor() (+10 more)

### Community 2 - "locale-gate.tsx"
Cohesion: 0.21
Nodes (13): meta(), meta(), meta(), LocaleGate(), meta(), DEFAULT_LOCALE, isLocale(), readPreferredLocale() (+5 more)

### Community 3 - "useOperatorConsole.ts"
Cohesion: 0.18
Nodes (22): editable(), LONGEST_WORD, useOperatorConsole(), WORDS, COMMANDS, installReactorConsole(), isLaw(), ReactorConsoleApi (+14 more)

### Community 4 - "seo.ts"
Cohesion: 0.15
Nodes (26): escapeXml(), imagesFor(), indexable(), main(), OUT_DIR, priorityFor(), urlEntry(), workIndex() (+18 more)

### Community 5 - "consoleLayout.ts"
Cohesion: 0.07
Nodes (51): ActionRowInput, ActionRowLayout, ActionSlot, advanceOf(), layoutActionRow(), measure(), advanceOf(), ConsoleContentRect (+43 more)

### Community 6 - "AboutPortrait.tsx"
Cohesion: 0.14
Nodes (23): ATTRIBUTES, CinemaAboutPortrait(), fieldGeometry(), _forward, _inverse, isFinitePosition(), portraitAssembleWindow(), _probe (+15 more)

### Community 7 - "HeroStage.tsx"
Cohesion: 0.09
Nodes (30): fireSector(), applyLinePeel(), applyLitPeel(), createPeelUniforms(), PeelUniforms, armatureWire(), _camStart, CORE_PHASE (+22 more)

### Community 8 - "devDependencies"
Cohesion: 0.08
Nodes (25): oxlint, devDependencies, oxlint, @react-router/dev, sharp, subset-font, tailwindcss, @tailwindcss/vite (+17 more)

### Community 9 - "CinemaLayer.tsx"
Cohesion: 0.09
Nodes (19): LENS_FAR, LENS_NEAR, BlackHoleEffect, BlackHoleEffectOptions, BlackHole, CHAOS_CHILL, CHAOS_COOL, CHAOS_EMBER (+11 more)

### Community 10 - "compilerOptions"
Cohesion: 0.07
Nodes (29): ., app, DOM, DOM.Iterable, ./.react-router/types, src, vite/client, compilerOptions (+21 more)

### Community 11 - "locale.ts"
Cohesion: 0.18
Nodes (23): .react-router/**, Footer(), Nav(), NAV_SECTIONS, NavSection, SiteShell(), Action(), ActionProps (+15 more)

### Community 12 - "compilerOptions"
Cohesion: 0.09
Nodes (22): node, react-router.config.ts, vite.config.ts, compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module (+14 more)

### Community 13 - "not-found.tsx"
Cohesion: 0.25
Nodes (7): BOOT_HOLD_STYLE, ErrorBoundary(), Layout(), meta(), NotFound(), localeFromPath(), NOT_FOUND_PATH

### Community 14 - "Atmosphere.tsx"
Cohesion: 0.19
Nodes (18): Atmosphere(), createDustGeometry(), createGlowTexture(), createShardSpecs(), hash01(), ShardSpec, advancePulse(), idleAmount() (+10 more)

### Community 15 - "dependencies"
Cohesion: 0.07
Nodes (29): gsap, isbot, lenis, maath, dependencies, gsap, isbot, lenis (+21 more)

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

### Community 21 - "CaseCard.tsx"
Cohesion: 0.15
Nodes (19): every, CaseDocument(), CvDocument(), CaseImage(), caseImageName(), CaseImageProps, CompactCard(), CompactCardProps (+11 more)

### Community 22 - "Kerr / realismo del pozo — plan para Kimi"
Cohesion: 0.11
Nodes (17): Contrato que no se rompe, Decisiones (no reabrirlas en el minion), Diagnóstico (qué falta, no el wishlist), Fuera de alcance (si lo piden, plan nuevo), Kerr / realismo del pozo — plan para Kimi, Prompt para pegarle a Kimi (una tarea), Serie vs paralelo, Tarea 10 — Verificar y parar [x] (+9 more)

### Community 23 - "sceneState.ts"
Cohesion: 0.06
Nodes (84): Case(), Cv(), Home(), react, About(), BootGate(), release(), Contact() (+76 more)

### Community 24 - "vercel.json"
Cohesion: 0.20
Nodes (9): buildCommand, cleanUrls, framework, headers, installCommand, outputDirectory, redirects, $schema (+1 more)

### Community 25 - "blackHole.ts"
Cohesion: 0.10
Nodes (38): deepestRs, ENDING_DISTANCE, halfDiagonal, nucleus, nucleusRs, OPENING, previousCharge, previousGlow (+30 more)

### Community 26 - "MeteorStorm.tsx"
Cohesion: 0.09
Nodes (20): Body, COLOR, DIR, FORWARD, HEAD, MATRIX, NORMAL, OFF (+12 more)

### Community 27 - "Planets.tsx"
Cohesion: 0.13
Nodes (19): frame(), holeAxis(), spiralFall(), ANCHOR, AXIS, FLASH, MAPS, Planets() (+11 more)

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
Nodes (15): arm, arms, armTotal, at(), brightest, centroid, core, early (+7 more)

### Community 39 - "ReactorScene.tsx"
Cohesion: 0.21
Nodes (10): FallbackProps, ReactorScene, Copy, AboutPortrait(), WorldConsolesProps, DPR, IgnitionFlare(), ReactorSceneProps (+2 more)

### Community 40 - ".tune-flyby.ts"
Cohesion: 0.12
Nodes (16): ASPECTS, Basis, bayClear(), BAYFLOOR, BAYS, Cand, CEIL, feasible() (+8 more)

### Community 42 - "index.ts"
Cohesion: 0.13
Nodes (16): CLIENT, en, es, CASE_SLUGS, COPY, Decision, LabelledValue, LOCALES (+8 more)

### Community 43 - "sectionRanges.ts"
Cohesion: 0.42
Nodes (7): ReactorScene(), measureSectionWindows(), onSectionLayoutChange(), sameWindows(), scrollLimit(), SectionWindow, useSectionWindows()

### Community 46 - "reactorControl.ts"
Cohesion: 0.17
Nodes (11): advanceControl(), Beat, beatPresence(), damp(), LAW_KEYS, LAW_PROFILES, LawProfile, LAWS (+3 more)

### Community 48 - "homeConsoles.ts"
Cohesion: 0.32
Nodes (10): caseConsoleSources(), caseConsoleSpecs(), cvConsoleSources(), cvConsoleSpecs(), homeConsoleSources(), homeConsoleSpecs(), trimLead(), trimTitle() (+2 more)

### Community 49 - "silenceClockWarning.ts"
Cohesion: 0.50
Nodes (3): ConsoleMethod, GlobalWithFlag, INSTALLED

### Community 50 - "SwallowShape"
Cohesion: 0.13
Nodes (14): holeCenter, liveLaw, CHAOS_TINT, COMET_TINT, CosmicEvents(), NOVA_TINT, VACUUM_TINT, GridFloor() (+6 more)

### Community 51 - "placement.ts"
Cohesion: 0.17
Nodes (19): AboutPortraitProps, Quality, assertNoOverlap(), beatIn(), buildPlacedConsoles(), sequenceEvenly(), sequenceTimings(), Slot (+11 more)

### Community 53 - "fetch-fonts.ts"
Cohesion: 0.32
Nodes (7): contentCharset(), FAMILIES, FamilySpec, main(), OUT_DIR, sourceUrl(), VariationAxes

### Community 54 - "sceneColors.ts"
Cohesion: 0.07
Nodes (33): _dir, _fwd, pointerOnPlane(), crossGeometry(), CursorProbe(), _probe, ringGeometry(), FOG_DENSITY (+25 more)

### Community 55 - "check-swallow.ts"
Cohesion: 0.47
Nodes (4): at(), eatenAt(), previous, suctionAt()

### Community 65 - "Handoff — cosmic upgrade (Codex → Claude Code → Codex)"
Cohesion: 0.12
Nodes (16): 1. Qué hizo cada sesión de Codex (10:00–10:16), 2. El build estaba ROTO — qué arreglé, 3. `src/scene/Planets.tsx` — qué hay dentro, 4. Lo que arregló Claude Code fuera de Planets.tsx, 5. Estado verificado ahora mismo, 6. Lo que queda para vos, 7. Segunda ronda — lo que el usuario vio en pantalla, "el agujero negro superpone los objetos" (+8 more)

### Community 66 - "layout.ts"
Cohesion: 0.08
Nodes (37): ANCHOR, BAYS, FORWARD, Framed, POSITION, REL, report, RIGHT (+29 more)

### Community 67 - "capability.ts"
Cohesion: 0.39
Nodes (7): CapabilityNavigator, detectQuality(), isCrawler(), NetworkInformation, prefersLessData(), prefersReducedMotion(), supportsWebGL2()

### Community 68 - "visual-qa.mjs"
Cohesion: 0.22
Nodes (6): /src/scene/control/reactorControl.ts, /src/scene/sceneState.ts, errors, errors, snapshots, stops

## Knowledge Gaps
- **452 isolated node(s):** `$schema`, `typescript`, `oxc`, `build/**`, `react/rules-of-hooks` (+447 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `sharp` connect `package.json` to `build-assets.ts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _452 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ModuleRig.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06264199935086011 - nodes in this community are weakly interconnected._
- **Should `consoleLayout.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07012987012987013 - nodes in this community are weakly interconnected._
- **Should `AboutPortrait.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13666666666666666 - nodes in this community are weakly interconnected._
- **Should `HeroStage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._