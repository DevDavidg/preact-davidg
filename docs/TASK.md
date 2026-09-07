# Kerr / realismo del pozo — plan para Kimi

Estado: escrito por el chat de planificación. **No implementar desde este
archivo en bloque.** Un chat = una tarea. Serie 1 → 10.

El swallow (plan anterior) está cerrado. Este archivo es solo el pozo.

---

## Prompt para pegarle a Kimi (una tarea)

```
Leé docs/TASK.md y docs/agujero-negro.md.
Ejecutá SOLO la Tarea N. No adelantes la siguiente.
Contrato del plan: no lo rompas.
Ponytail: diff mínimo, cero deps nuevas, no reescribir el integrador
hasta la Tarea 8.
Al terminar: [x] en esa tarea, check del plan, typecheck si tocaste TS.
```

Sustituí `N`. Cerrá el chat al terminar. No abras Tarea 8 sin 1–7 verdes.

---

## Contrato que no se rompe

- `swallowShape()` sigue siendo función pura de `sceneState.swallow`. Scroll
  arriba = todo corre para atrás. El flow del disco **sigue siendo
  acumulador** (un fluido no se rebobina).
- `FinaleGate` fuera de `SwallowField`. `FinaleCard` / `OperatorBar` no se
  tragan.
- Cero dependencias nuevas. Diff mínimo. Un solo integrador en
  `BlackHoleEffect.ts` — no un segundo pass “Kerr”.
- Lite y cinema son la **misma silueta**. Cada tarea que cambie el look del
  pozo toca el billboard en el mismo chat, o el fallback miente.
- El medio del frame sigue siendo lo más oscuro. Additive no dibuja
  oscuridad. Bloom no lava la sombra a gris.
- La cámara **nunca** entra a la esfera de fotones. Hoy el clamp asume
  `PHOTON_RS = 1.5` y `SHADOW_RS = 2.598`. Kerr prograda mueve esos radios
  hacia adentro: Tarea 8–9 rehacen el clamp, no “después lo vemos”.
- Paleta del cuarto: ámbar / champagne / ink. El Doppler mueve **esa** rampa
  (ember ↔ pálido). No aparece un wedge azul-UV / rayos X. Un cuerpo negro
  honesto es extranjero en esta sala — ya se rechazó una vez en
  `CinemaLayer.tsx`.
- MHD no es un solver. Es ruido autorado que *lee* como MRI. Techo en la
  tarea.
- Sub-anillos: N=1 ya está (Gauss analítico). N=2 se agrega. N=3…∞ no. RK4
  finito no produce una cascada infinita; no lo prometemos.
- `scripts/check-swallow.ts` sigue verde. Lo que sea Kerr cierra forma en
  `scripts/check-kerr.ts` (Tarea 7).

---

## Diagnóstico (qué falta, no el wishlist)

El pass ya es Schwarzschild de verdad: ODE `d²u/dφ² = −u + (3/2) Rs u²`,
RK4, captura `3√3/2 Rs`, ISCO `3 Rs`, disco lenseado, Doppler de
**intensidad** `shift^3.2`, anillo N=1 bajo escrito. Los jets están
escritos en el header de `BlackHoleEffect.ts` y **no existen** en el
fragment.

Lo que el wishlist pide, en costo real:

| Pedido | ¿Se puede en este pass? | Dónde |
| --- | --- | --- |
| Color Doppler | Sí. `shift` ya está. Solo pinta hue. | Tarea 1 |
| Disco con grosor + opacidad | Sí. Slab `h/r`, no raymarch 3D. | Tarea 2 |
| “MHD” | Sí como grano. No como GRMHD. | Tarea 3 |
| Jets Blandford–Znajek | Sí, analítico (el header ya lo describe). | Tarea 4 |
| Dilatación `√(1−Rs/r)` | Sí, sobre tasas que ya existen. | Tarea 5 |
| Subanillo N=2 | Sí, mismo truco que N=1. | Tarea 6 |
| Kerr `a`, ISCO(a), captura(a) | Sí en CPU primero, `a=0` bit-idéntico. | Tarea 7 |
| Frame dragging + sombra en D | Reescribe `bhAccel`. Un chat. | Tarea 8 |
| Ergoesfera | Cascarón analítico barato, *después* de Kerr. | Tarea 8, si no pelea la sombra |
| Kerr 3D (constante de Carter, θ) | No en este plan. La toma a 20° se cubre con Kerr ecuatorial + offset de impacto. Si la D no alcanza, plan nuevo. | fuera |
| Anillos infinitos / GRMHD | No. | fuera |

Kerr primero es el orden equivocado: semanas de ODE para un disco que sigue
siendo un plano ámbar simétrico. Primero se ve el objeto; después gira.

---

## Decisiones (no reabrirlas en el minion)

1. **Spin objetivo:** `a = 0.85` en cinema, no `0.998`. Extremo pega el ISCO
   a `0.5 Rs` y obliga a reescribir plunge / `RS_OPEN` de un saque. 0.85 ya
   achata la sombra y acerca el rim. `a` es uniform, 0 en lite si el
   billboard no puede mentir la D.
2. **Kerr ecuatorial.** Un parámetro extra en `bhAccel`, mismo loop RK4,
   mismo `φ` span. No hay segundo integrador.
3. **ISCO y captura dejan de ser constantes** en Tarea 7. `DISK_INNER_RS` y
   `SHADOW_RS` pasan a funciones de `a` que en `a=0` devuelven 3 y 2.598.
   `CinemaLayer` y `FinaleGate` leen las funciones. Un solo lugar.
4. **Ergoesfera:** un término débil entre horizonte y límite estático. Si
   aclara el medio del frame, se borra. No es un mesh.
5. **`uFlow` no se vuelve función del scroll.** La dilatación multiplica la
   *tasa* del acumulador y el spin de shards, no el valor.

---

## Serie vs paralelo

Todo es **serie**. `BlackHoleEffect.ts` es un solo fragment. Dos chats
sobre ese archivo = merge podrido. Tarea 7 toca `blackHole.ts` pero
`CinemaLayer` ya lee esas constantes: tampoco es paralela.

Oleada: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10.

---

## Tarea 1 — Doppler de color, no solo de brillo

**Goal.** El limbo que se acerca corre pálido; el que se aleja, ember. El
`shift` que ya calcula `bhDisk` pinta hue, no solo `beam`.

**Files.**
`src/scene/cinema/BlackHoleEffect.ts` (`bhDisk`),
`src/scene/cinema/CinemaLayer.tsx` (solo si hace falta un 4º color; preferí
no),
`src/scene/FinaleGate.tsx` (mismos polos en el billboard).

**Deps.** ninguna.

**Cambio.**
- El `shift` actual ya mezcla un poco hacia `uChill` / `uHot`. Subir ese
  recorrido hasta que los dos lados se lean como temperaturas distintas,
  no como el mismo ámbar a distinta ganancia.
- No agregar un canal azul. Extremos: ember `#6a2a14` ↔ champagne
  `#ffe6c4`. El limbo recedente puede caer hacia ink; el approaching no
  pasa de `uChill`.
- Billboard: el `limb` / `beam` que ya existe gasta la misma rampa.

**Check.**
- Cinema, swallow ~0.3: un lado del disco es claramente más frío/pálido
  que el otro. No hay cian ni violeta.
- Lite: misma asimetría, más tonta.
- El centro sigue más oscuro que la sala.
- Scroll atrás no “rebobina” el color: el color es función de geometría +
  `shift`, no del acumulador.

---

## Tarea 2 — Disco como slab (`h/r`), no como plano

**Goal.** El disco tiene espesor y el frente tapa el envés. Sigue siendo
un cruce de plano, no un volumen.

**Files.**
`src/scene/cinema/BlackHoleEffect.ts` (`bhDisk` + test de cruce),
`src/scene/FinaleGate.tsx` (banda más gorda hacia afuera).

**Deps.** Tarea 1.

**Cambio.**
- `h/r` autorado, ~0.08 en el borde interno, más fino afuera. Un rayo que
  cruza “el plano” con `|height| < h` acumula columna; no un raymarch.
- Opacidad del hit cercano sube lo bastante para que la imagen secundaria
  (arco de arriba) se lea *atrás* de la banda de abajo, no al mismo nivel.
  Techo: no volver a la chapa opaca que mató el envés (el comentario de
  `density * 0.2` es la lección). Probar en `0.28–0.40`, no `1.0`.
- `ponytail:` slab de altura escalar. Si se pide volumen de verdad, el
  upgrade es un segundo cruce a `±h`, no un grid 3D.

**Check.**
- La banda de abajo tapa parte del arco de arriba donde se cruzan.
- El gap sombra–rim sigue visible (ISCO sigue en 3 Rs).
- `reduced` (44 steps) no pierde el arco de arriba.
- Lite: banda con grosor que crece hacia afuera, no una línea.

---

## Tarea 3 — Grano tipo MRI, no espiral perfecta

**Goal.** El flujo deja de ser un log-polar liso. Filamentos desiguales y
manchas calientes, sin un solver.

**Files.**
`src/scene/cinema/BlackHoleEffect.ts` (`bhDisk` grain/stream),
`src/scene/FinaleGate.tsx` (el fbm del billboard, mismos exponentes).

**Deps.** Tarea 2.

**Cambio.**
- Romper la simetría de `sin(angle * 3)`: más de un modo azimutal, pesos
  distintos, una mancha que orbita con `uFlow` (fase, no nueva textura).
- El exponente del grain ya está en 1.6. Subir contraste de *huecos*, no
  de brillo pico — bloom está abajo y un pico nuevo lava la sombra.
- `ponytail:` 4 octavas + 1 mancha. Techo: se tilea si te quedás 2 min en
  el finale. Upgrade: una 3ª escala, no un 3D noise texture.

**Check.**
- A swallow 0.2–0.5 el disco no parece un caramelo girando.
- Un minuto en página: no hay hash de enrollado diferencial (el comentario
  de `bhDisk` sigue vigente: no lap real inner vs outer).
- Presupuesto de steps igual. Cero loops nuevos por píxel fuera de
  `bhFbm` ya pagado.

---

## Tarea 4 — Jets analíticos

**Goal.** Dos haces por el eje, baratos, solo dentro de su envelope. El
header de `BlackHoleEffect.ts` ya describe el método: closest approach del
rayo a la recta del eje, un fbm, sin integrar.

**Files.**
`src/scene/cinema/BlackHoleEffect.ts` (`mainImage`, después del integrador),
`src/scene/cinema/CinemaLayer.tsx` (intensidad: `charge` / `suction`, no
nuevo uniform si se puede),
`src/scene/FinaleGate.tsx` (dos lóbulos débiles en Y del billboard).

**Deps.** Tarea 3.

**Cambio.**
- Función `bhJet(origin, dir)`: distancia rayo–eje, envelope gaussiano,
  grain reusando `bhFbm`. Se suma a `glow` *después* de captura, con
  `through`, para que el jet no pinte adentro de la sombra.
- Beaming axial suave (el jet que apunta a cámara un poco más vivo). Misma
  rampa de color, más pálida que el rim.
- Apagados o casi hasta `holeGateFor` ~1. En el corredor no hay dos
  reflectores saliendo del stator.
- Lite: dos lóbulos, no geodésicas.

**Check.**
- Cinema, gate armado: se leen dos haces opuestos al eje, no un glow
  esférico.
- La sombra sigue negra por el medio. El jet no cruza el disco negro.
- `minimal` / lite no queda un smear aditivo sobre el horizonte.
- Mask del pass no tiene que crecer para los jets: si el envelope pide más
  máscara, achicar el jet, no abrir el pass.

---

## Tarea 5 — Dilatación temporal en las tasas

**Goal.** Cerca del pozo, el disco y los shards se perciben más lentos.
La materia que cae no se apaga de golpe: se enfría y se frena.

**Files.**
`src/scene/cinema/CinemaLayer.tsx` (tasa de `flow.current`),
`src/scene/cinema/BlackHoleEffect.ts` (`uEclipse` / charge, no nueva ODE),
`src/scene/ReconstructMaterial.ts` (spin / grav cerca de `uHole`),
`src/scene/Rig.tsx` solo si el plunge pelea el freeze — preferí no.

**Deps.** Tarea 4.

**Cambio.**
- Factor `sqrt(max(1 - Rs/r, ε))` con `r` = distancia cámara–`holeCenter`
  (observer) para lo que el visitante *oye* como tiempo del disco, y con
  `r` de cada shard para el infall local.
- Multiplica la tasa de `uFlow`, no `uFlow` mismo.
- El freeze óptico del crossing ya existe (`uEclipse`, `survives`).
  Acoplarlo: a mayor `crossing`, menos charge y más redshift de la paleta
  (hacia ink), no un cut a negro en swallow 0.62–0.68 si se puede evitar
  con esto. Si el acantilado de luz es la cámara *adentro* de la sombra
  (hallazgo del swallow), **no lo disfraces acá** — se toca en Tarea 9.
- `ponytail:` un `uDilate` 0–1 si hace falta, no un reloj nuevo.

**Check.**
- Swallow 0.1 vs 0.7: el disco gira visiblemente más lento cerca del
  final, sin rebobinar al scrollear atrás (la tasa baja; el acumulador no
  retrocede).
- Shards cerca del pozo se arrastran más que los lejanos.
- `check-swallow.ts` verde. Nada de esto toca `drain` / `radius`.

---

## Tarea 6 — Subanillo N=2

**Goal.** Un segundo filament, más fino y más adentro que N=1. No una
cascada.

**Files.**
`src/scene/cinema/BlackHoleEffect.ts` (el `ring` gaussiano),
`src/scene/FinaleGate.tsx` (un segundo `exp` más flaco).

**Deps.** Tarea 5.

**Cambio.**
- N=1 se queda. N=2: mismo `exp(-((impact - capture)/σ)²)` con `σ` más
  chico y amplitud ~1/e de N=1, un pelo adentro del pico de N=1.
- Cero steps extra. Cero loop.
- Lite: un segundo anillo más débil, concéntrico. Kerr todavía no acható
  nada.

**Check.**
- El borde de la sombra es un filament doble, no un glow suave.
- En `reduced` N=2 puede perderse; N=1 no.
- No hay tercer anillo.

---

## Tarea 7 — Radios Kerr en CPU, `a=0` idéntico [x]

**Goal.** ISCO, esfera de fotones y captura dejan de ser literales. Con
`a=0` el frame no cambia ni un bit de uniform.

**Files.**
`src/scene/blackHole.ts`,
`src/scene/cinema/CinemaLayer.tsx` (lee funciones),
`src/scene/FinaleGate.tsx` (lee funciones),
`scripts/check-kerr.ts` (nuevo, el check de esta oleada).

**Deps.** Tarea 6. **No tocar el shader.**

**Cambio.**
- `spinFor(fidelity)` o constante `HOLE_SPIN = 0` por ahora (el valor 0.85
  entra en Tarea 8). Esta tarea solo introduce la API.
- `iscoRs(a)`, `photonRs(a)`, `captureRs(a)` — formas cerradas de Kerr
  ecuatorial (progrado). En `a=0`: `3`, `1.5`, `3√3/2`.
- `DISK_INNER_RS` / `SHADOW_RS` / `PHOTON_RS` quedan como los valores `a=0`
  o se borran si no queda caller. Un solo camino.
- `check-kerr.ts`: asserts de los tres radios en `a=0` y monotonía
  prograda (`isco` y `photon` bajan cuando `a` sube). Sin Three, sin
  canvas.

**Check.**
- `pnpm exec tsx scripts/check-kerr.ts`
- `pnpm exec tsx scripts/check-swallow.ts`
- Cinema a swallow 0.3: el pozo se ve como antes de esta tarea. Si no,
  revertir. Esta tarea no se ve; se mide.

---

## Tarea 8 — Integrador Kerr ecuatorial + sombra en D [x]

**Goal.** El espacio se arrastra. La sombra deja de ser un círculo. El
ISCO se acerca. Un solo loop RK4, `bhAccel` con `uSpin`.

**Files.**
`src/scene/blackHole.ts` (`HOLE_SPIN = 0.85` cinema; 0 si hace falta
proteger lite),
`src/scene/cinema/BlackHoleEffect.ts` (`bhAccel`, captura, early-outs),
`src/scene/cinema/CinemaLayer.tsx` (`uSpin`, `uInner`, `uMask` desde
`captureRs(a)`),
`src/scene/FinaleGate.tsx` (sombra un poco offset / ovalada; no geodésicas).

**Deps.** Tarea 7.

**Cambio.**
- `bhAccel(u)` gana términos de Kerr ecuatorial (potencial efectivo con
  `a`). El loop, el cruce de plano, `bhDisk` y `bhSky` se quedan.
- Early-out de captura usa `captureRs(a)`, no el `#define BH_CAPTURE`
  2.598. El define muere o se vuelve uniform.
- Frame dragging visible: el flow azimutal suma un arrastre en el sentido
  del spin (fase extra, no segunda ODE).
- Sombra en D: el impact parameter de captura depende del lado (progrado
  vs retrógrado). Sin eso, Kerr “gira” y la sombra sigue redonda — no
  cerrar la tarea.
- Ergoesfera: cascarón débil entre horizonte y límite estático. Si el
  medio del frame aclara, borrar el término. No es un mesh.
- Billboard: offset horizontal leve + achatamiento. Misma lectura, tonta.
- `ponytail:` ecuatorial. Carter + θ = plan nuevo, no un “ya que estamos”.

**Cuidado.** `a=0.85` mueve el fotón prograda hacia ~`1.2 Rs` y el ISCO
hacia ~`1.4 Rs`. El rim se acerca a la sombra. El gap no puede
desaparecer del todo (sigue habiendo ISCO ≠ horizonte). Si el rim come la
sombra, bajar `a`, no agrandar `RS_OPEN`.

**Check.**
- `a=0` (tmp) reproduce Tarea 7. Después `a=0.85`.
- Sombra achatada, más “comida” de un lado. No un óvalo simétrico.
- El disco corre más cerca del negro que a `3 Rs`.
- 88 / 44 / 28 steps: N=1 sobrevive. El pass no se sale de la máscara en
  el corredor (`build < 1`).
- Lite: D tonta, no un círculo con dos jets.

---

## Tarea 9 — Plunge, Rs y máscara contra la esfera nueva [x]

**Goal.** La lente no se mete en la sombra Kerr. El acantilado negro de
swallow 0.62–0.68 (hallazgo del swallow) se ataca acá, no en dilatación.

**Files.**
`src/scene/blackHole.ts` (`holeRadiusFor`, `PLUNGE_*`, `APPROACH_Z` si
hace falta),
`src/scene/Rig.tsx` (clamp: `r > photonRs(a) * rs * margen`),
`src/scene/cinema/CinemaLayer.tsx` (máscara lee `captureRs(a)`),
`scripts/check-kerr.ts` (assert: `PLUNGE_RADIUS > photonRs(a) * RS_OPEN`
con margen, p.ej. 1.15).

**Deps.** Tarea 8.

**Cambio.**
- El clamp de `Rig` deja de asumir 1.5 / 2.2 / 10.2 m de comentarios
  viejos. Lee `photonRs(spin)` y `holeRadiusFor` reales.
- `holeRadiusFor` no puede abrir `Rs` hasta que `PLUNGE_RADIUS / Rs <
  photonRs`. Si pisan, bajar `RS_OPEN` o alejar `APPROACH_Z`. Un número
  miente → frame negro.
- Máscara: el lado retrógrado de una D es más ancho. El disc de mask tiene
  que cubrir el peor lado, no el `SHADOW_RS` de Schwarzschild.
- No abrir la máscara con `suction` (ya quemó el viewport una vez).

**Check.**
- `check-kerr.ts` falla si el clamp entra a la esfera de fotones.
- Scrub 0 → 0.95 cinema: no hay cut a negro en 0.62–0.68. El crossing
  apaga *después*, con retrato del pozo, no un viewport vacío.
- Scroll atrás: la lente sale. Destino monótono (`drain + surge` acotado,
  `check-swallow.ts`).

---

## Tarea 10 — Verificar y parar [x]

**Deps.** 1–9.

- `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`, `pnpm run budget`.
- `pnpm exec tsx scripts/check-swallow.ts`
- `pnpm exec tsx scripts/check-kerr.ts`
- Browser cinema, rail finale, ida y vuelta:
  - `build → 1`: joya en el gate, jets apenas, Doppler de color, sombra
    todavía chica.
  - swallow 0.16 / 0.42 / 0.68: tres gulps, disco grueso, grano, D, limbo
    frío/caliente, cuarto cayendo.
  - swallow 0.85+: dilatación, eclipse, `FinaleCard`. No frame negro
    prematuro.
  - Lite: misma lectura, tonta. Governor `minimal`: no se queda a oscuras
    (`claimLensing` se suelta).
- `graphify update .`
- Actualizar `docs/agujero-negro.md` **solo** si los números de `Rs` /
  captura / ISCO cambiaron. No un essay nuevo.

---

## Fuera de alcance (si lo piden, plan nuevo)

- Kerr 3D con constante de Carter.
- `a → 0.998` y ISCO en `0.5 Rs`.
- Paleta de cuerpo negro / Chandra (azul-UV).
- Solver MHD o textura 3D precomputada.
- Sub-anillos N≥3.
- Segundo EffectPass.
- Tocar `swallowShape` para “hacer más Kerr”.
