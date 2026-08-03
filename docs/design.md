# Design — Portfolio Immersivo DG

> Spec única: producto + diseño + tech.  
> Leer antes de Claude Design, Figma o implementación en `src/`.  
> Prototipo visual: [`REFERENCIA/Portfolio Inmersivo v3.dc.html`](../REFERENCIA/Portfolio%20Inmersivo%20v3.dc.html)  
> Sistema de tokens: [`REFERENCIA/Portfolio David Guillen.dc.html`](../REFERENCIA/Portfolio%20David%20Guillen.dc.html)  
> Figma: `fileKey` `sAMieh52gsQCid784ildNL` · root `0:1`

---

## 1. Problema del usuario

Un visitante (cliente / hiring / peer creativo) llega en &lt;10s y debe sentir:

1. **Esto no es un portfolio template** — hay una firma espacial memorable.
2. **David construye experiencias de punta a punta** — creative + full-stack, no solo “landing bonita”.
3. **Puedo contratarlo** — CTA claro sin perder el wow.

Métrica de éxito (cualitativa): alguien describe el sitio como *“el que se reconstruye mientras scrolleás”*, no *“otro dark Awwwards”*.

---

## 2. Firma (locked)

**Híbrido A + C**

| Pieza | Qué es |
|-------|--------|
| **A — Atelier persistente** | Una sola escena 3D que no se resetea entre secciones. El scroll mueve cámara / estado del mundo; el HTML es overlay. |
| **C — Reconstrucción** | El mundo pasa de wire → solid → lit (`SCANNING → ASSEMBLING → BEAUTY → LIVE`) ligado al scroll. |

**Una firma > diez efectos.** Todo FX secundario se justifica solo si refuerza esta metáfora.

### Qué NO hacer

- Grid de partículas / blob genérico como wow principal
- Custom cursor ring + magnetic + marquee + bloom + física “porque sí”
- Torus / GLB stock flotando de fondo mientras el contenido es un site normal
- Cards planas de proyectos como primera lectura (son **artefactos en el espacio**)
- WebGPU-only sin fallback WebGL
- Inventar tokens fuera del DS (no cream/serif terracotta, no purple glow)

---

## 3. Design system (sync)

Dark premium 60-30-10 — **Noir gold + Darker + Soft geo**. Acento **solo** en CTAs, estados vivos y portal LIVE.

| Token | Valor | Uso |
|-------|-------|-----|
| Base | `#070605` (swatch `#0C0B09` × darker) | Fondo / void |
| Surface | swatch `#161411` × darker | Paneles overlay |
| Surface hover | swatch `#1F1C17` × darker | Hover filas |
| Línea | ink @ 8–14% | Bordes |
| Tinta | `#F4EFE6` | Texto |
| Tinta 55 | ink @ ~48% (tone darker) | Secundario |
| Acento | `#D4A054` | CTA / LIVE / fase activa |
| Acento hover | `#E0B56E` | Hover CTA |

**Tipo**

| Rol | Familia | Notas |
|-----|---------|-------|
| Display / UI | Outfit | Display XL ~96–112, tracking tight |
| Body | Newsreader | Lead 18–20 / body 15–16 |
| Meta / labels | IBM Plex Mono | Caps, tracking +12–18% |

**Espaciado:** escala 8 · 16 · 24 · 32 · 48 · 64. Padding sección desktop `120px 64px`. Whitespace como directiva.

**i18n:** copy ES con etiquetas EN (`01 — PROYECTOS ⁄ ARTIFACTS`). Strings en `src/locales/` al implementar — no hardcodear en componentes finales.

---

## 4. Navegación espacial (fases)

Escena fija (canvas/R3F full-viewport, `z-index` bajo). UI en overlays (`pointer-events` solo en hits).

| Scroll (aprox.) | Fase HUD | Escena | Sección dominante |
|-----------------|----------|--------|-------------------|
| 0–18% | `SCANNING` | Wireframe, grid perspectiva, sin fill | Hero |
| 18–48% | `ASSEMBLING` | Cajas/objetos se solidifican; artefactos visibles | Work + Services |
| 48–78% | `BEAUTY` | Materiales lit, DOF/luz controlada | Process + About |
| 78–100% | `LIVE` | Acento oro “portal / power-on” | Contact |

HUD fijo (opcional en prod, sí en prototipo): fase + `BUILD xxx%` + hint `WIRE → SOLID → LIT`.

Progress bar 2px acento en top — OK (funcional, no ruido).

---

## 5. Pantallas / secciones

### Hero (SCANNING)

- Eyebrow: `CREATIVE DEVELOPER — FULL STACK SENIOR` + blink acento
- H1: **Experiencias web que no se olvidan.** (weight-morph por char en desktop OK)
- Lead: una línea sobre reconstrucción + 3D/motion/full-stack
- CTAs: `RESERVÁ 15 MIN` (primary) · `EXPLORAR ESCENA` (ghost)
- Meta: años / stack / disponibilidad Q1 2027
- Cue: `SCROLL TO BUILD`

**Budget primer viewport:** marca DG® (nav) + H1 + lead + CTAs + escena. Sin stats strip, sin cards, sin badges flotantes sobre el 3D.

### Work (ASSEMBLING) — artifacts

3 objetos en espacio (no grid de cards primero):

| # | Tags | Rol |
|---|------|-----|
| 01 | WEBGL · 3D | Destacado |
| 02 | MOTION | Scrollytelling |
| 03 | FULL-STACK | SaaS / producto |

Cada artefacto: shot (`image-slot` / media real) + número outline + título + 2 líneas. Focus → panel HTML overlay (drei `Html` en prod).

### Services (ASSEMBLING)

Filas (no cards decorativas): Immersivas · Full-stack · Motion · Performance. Panel surface translúcido sobre la escena.

### Process (BEAUTY)

Sticky número morph `01–04` + título de fase. Steps: Descubrimiento → Prototipo técnico → Build → Launch. El número es el héroe visual.

### About (BEAUTY)

Retrato + quote del atelier + meta (base, stack, estado).

### Contact (LIVE)

Portal: glow acento, copy “¿Encendemos la escena?”, mailto hero, links sociales. La escena “enciende” — no solo cambia el texto.

---

## 6. Motion & interacción

| Permitido | Condición |
|-----------|-----------|
| Scroll → progreso de reconstrucción + cámara | Firma principal |
| Magnetic en CTAs (`data-mag`) | Desktop fine pointer |
| H1 char weight por proximidad mouse | Desktop; off en coarse/reduced |
| Reveal IO suave en overlays | Una vez; easing `.22,1,.36,1` |
| Sticky process number sync | ScrollTrigger / IO |
| Web Audio sutil (opcional v2) | Solo si refuerza BUILD/LIVE; mute default |

| Evitar | Por qué |
|--------|---------|
| Cursor custom ring | Compite con la escena |
| Marquee de stack como hero visual | Ruido 2022 |
| Partículas que huyen del mouse | Firma vieja (v1) |
| Postpro pesado (bloom stacked) | Genérico + caro en FPS |

**Reduced motion:** escena estática en estado BEAUTY o layout HTML premium sin loop; sin parallax ni morph continuo.  
**Coarse / mobile:** escena LOD baja (menos geo, sin mouse parallax); orbit touch opcional; mismos overlays legibles.

---

## 7. Stack de implementación (prod)

| Capa | Elección |
|------|----------|
| App | React 19 + TypeScript + Vite (`pnpm`) |
| 3D | R3F + drei · WebGL first; WebGPU opcional con fallback |
| Scroll | Lenis + GSAP ScrollTrigger |
| Shaders | GLSL propio mínimo (1 material firma) — no stock soup |
| i18n | `src/locales/` |
| QA | `make quick-check` · Playwright capturas solo en `/tmp` |

**Demo gris (obligatoria antes de beauty):** un beat navegable — scroll 0→1 morph wire→solid a ~60fps en desktop mid — sin texturas finales.

---

## 8. Tiers de experiencia

| Tier | Quién | Qué recibe |
|------|-------|------------|
| Desktop cine | Fine pointer, GPU media+ | Escena completa + morph + magnetic + H1 morph |
| Mobile reducida | Coarse / narrow | LOD bajo, mismos copy/CTAs, sin cursor FX |
| `prefers-reduced-motion` | Accesibilidad | HTML + DS premium, sin animaciones continuas |

Presupuesto mental: **60fps** en MacBook/GPU mid; degradar antes que stutter.

---

## 9. Flujo de trabajo (AI-native)

1. **Taste pack** — este `design.md` + Figma + Immersivo v3 (+ máx. 3 refs externas no-Awwwards-clone).
2. **Sistema primero** — tokens/DS; no pantallas sueltas en Claude Design.
3. **Wire / fases** — validar SCAN→LIVE en prototipo (v3 o R3F gris).
4. **Overlays** — HTML UI sobre escena; edge cases mobile.
5. **Build** — Cursor / Claude Code Minion por tarea atómica (`docs/TASK.md`).
6. **Sync opcional** — html.to.design / screenshot → Figma; no rediseñar el 3D en Figma.
7. **Claude Design** — OK para reel, slides, social del case; **no** es el runtime del sitio.

---

## 10. Prompt constraints (pegar en agentes)

```
Portfolio DG Immersivo v3.
Firma: escena atelier persistente + reconstrucción wire→solid→lit (SCANNING→ASSEMBLING→BEAUTY→LIVE).
DS: Noir gold darker — #070605 / #D4A054 acento solo CTA/LIVE · Outfit + Newsreader + IBM Plex Mono.
Proyectos = artefactos espaciales, no card grid.
Prohibido: partículas como wow, cursor ring, purple/glow/cream-serif AI slop, WebGPU sin fallback.
Primero demo gris scroll→morph a 60fps; después beauty.
Refs: docs/design.md · REFERENCIA/Portfolio Inmersivo v3.dc.html · Figma sAMieh52gsQCid784ildNL.
```

---

## 11. Criterios done (MVP sitio)

- [ ] Escena persistente R3F (o equivalente) ligada al scroll con 4 fases legibles en HUD o transición visual
- [ ] Hero + Work artifacts + Services + Process morph + About + Contact portal
- [ ] DS tokens aplicados; acento solo donde corresponde
- [ ] Tiers mobile + reduced-motion respetados
- [ ] CTA mailto / contacto usable
- [ ] `make quick-check` OK; LCP/scroll sin jank obvio en desktop mid

---

## 12. Fuera de alcance (MVP)

- CMS / backend / auth
- Case studies multipágina completos (puede ser overlay/modal v1)
- Tienda, WordPress, lead-gen Maps
- Generación de video faceless como parte del sitio
- Física Rapier / multiplayer / VR
