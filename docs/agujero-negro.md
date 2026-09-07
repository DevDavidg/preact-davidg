# El agujero negro

El finale de esta app no es un portal decorativo. Es un objeto físico con un solo
radio (`Rs`), un centro compartido y dos formas de dibujarse: una pasada
geodésica de verdad (desktop cinema) y un billboard que imita la misma silueta
(teléfonos y cualquier sesión sin composer).

El scroll lo carga, lo abre y se lo traga. Scroll hacia arriba lo reconstruye
exacto. No hay cutscene.

---

## Qué es, en una frase

Un pozo de Schwarzschild sentado en la apertura del `FinaleGate`. La cámara vuela
el corredor hacia él. Al final del rail el cuarto, los planetas y la lente caen
adentro. El medio del frame tiene que ser lo más oscuro de la página: si el
centro brilla más que la sala, es un remolino, no un agujero negro.

Copy de producto (`src/content/es.ts`):

> El último destino: un agujero negro. El scroll acerca planetas y
> constelaciones al horizonte; volvé hacia arriba para reconstruir el universo.

---

## Mapa de archivos

| Archivo | Rol |
| --- | --- |
| `src/scene/blackHole.ts` | Fuente de verdad: `Rs`, centro, eje, máscara de ownership |
| `src/scene/cinema/BlackHoleEffect.ts` | Shader geodésico (post-process) |
| `src/scene/cinema/CinemaLayer.tsx` | Composer: pozo → bloom → aberración → tone map |
| `src/scene/FinaleGate.tsx` | Mecanismo + fallback billboard |
| `src/scene/sceneState.ts` | `swallowShape()`: curva del trago |
| `src/motion/runtime.ts` | Parte el scroll en `build` (corredor) y `swallow` (finale) |
| `src/lib/sceneRoutes.ts` | Capítulo `finale` = `170vh * 2.6` |
| `src/scene/Rig.tsx` | Cámara: approach + plunge, clamp fuera del horizonte |
| `src/scene/ReactorScene.tsx` | `SwallowField` + lazy `CinemaLayer` |
| `src/scene/CosmicWorld.tsx` | Planetas / galaxia lerp al centro |
| `src/scene/ReconstructMaterial.ts` | Infall por vértice hacia `uHole` |
| `src/scene/Atmosphere.tsx` | Glow del fondo cede al pozo |
| `src/components/StageTreatment.tsx` | Wash / viñeta no pueden aclarar el horizonte |
| `src/components/FinaleCard.tsx` | Placa DOM al otro lado |
| `scripts/check-swallow.ts` | Contrato de la curva |
| `scripts/check-kerr.ts` | Radios de Kerr, cobertura de frame, crossfade del disco |

---

## Dos ejes de scroll

Un solo `lenis.progress`. Dos canales (`src/motion/runtime.ts`):

```
progress 0 ──────── corridorShare ──────── 1
         │  build 0→1  │   swallow 0→1   │
         │  corredor   │   horizonte     │
```

- `sceneState.build` = progreso del corredor, reestirado a `0 → 1` sobre la
  fracción que llega hasta `#finale`.
- `sceneState.swallow` = lo que queda. Solo existe en home. CV y case studies
  miden `corridorShare = 1` y el swallow queda en cero.

El capítulo `finale` es el más largo después del hero (`~442vh`) porque el
ending no es un fade: órbita, marea, tres gulps y la lente cayendo.

Contrato: `swallowShape(swallow)` es función pura. Sin springs, sin latches.
Scroll arriba = todo corre para atrás.

---

## La fuente de verdad: `blackHole.ts`

Antes cada capa (shader, cámara, colapso) tenía su propia idea de “dónde está
el pozo”. Por eso la luz no coincidía con la boca. Ahora todo lee este módulo.

### Unidad: radio de Schwarzschild

`Rs = 2GM/c²`. El único largo que tiene un agujero negro. El resto se escribe
en múltiplos, así un solo número escala el objeto sin que se desarmen las
proporciones.

| Constante / función | Valor (`a = 0` → `HOLE_SPIN = 0.85`) | Qué es |
| --- | --- | --- |
| `HOLE_SPIN` | `0.85` | Spin adimensional. 0 es Schwarzschild |
| `photonRs(a)` | `1.5` → `0.85` | Órbita de fotones prograda |
| `captureRs(a)` | `2.598` → `1.53` | Captura prograda (lado chico de la D) |
| `captureRsRetro(a)` | `2.598` → `3.37` | Captura retrógrada (lado gordo) |
| `iscoRs(a)` | `3` → `1.32` | Borde interno del disco |
| `DISK_OUTER_RS` | `10` | Borde externo, autorado |

La sombra que se ve no es el horizonte (`1 Rs`). Es más grande porque el
horizonte se ve a través de su propio lenseo. El gap entre sombra y anillo
brillante existe porque la materia no puede sostener órbita adentro del ISCO.

`DISK_OUTER_RS = 10` no es física: es lo que cabe en la máscara de la pasada
mientras el cuarto sigue en pie. La emisión cae como `r⁻³`, así que lo que se
recorta es menos del 1% de la luz.

### Tamaño en metros

```
Rs_cargado = 0.4 m      sombra ≈ 1.3 m, disco ≈ 4 m
RS_OPEN    = 1.58 m     la sombra tapa el alto del frame
+ crossing = 2.45 m     y se pasa de los bordes
```

Cargado: el destino del corredor, sin puerta que lo enmarque.
Abierto: licencia narrativa. Un pozo real no crece; acá el corredor mide ~24 m
y el beat es que la sombra trague el viewport.

`holeRadiusFor(build, swallow)` nunca es cero (el early-out del shader
necesita un centro) y crece en tres etapas:

1. **Carga** — `build` 0.46 → 0.96: `Rs` sube de `0.35·0.4` a `0.4`.
2. **Apertura** — `swallowShape`: `drain * 0.45 + grip * 0.55`, más un 10%
   extra en cada gulp (`suction`).
3. **Crossing** — `CROSSING_SWELL = 0.55` sobre el último 11% del rail.

El peso está en `grip` a propósito. Demasiado `drain` abría `Rs` tan rápido
que la cámara terminaba *adentro* de la sombra y el último quinto era un
frame negro.

`RS_OPEN` valía 0.96 y **no tragaba nada**. Ese número es sobreviviente de la
época en la que `APPROACH_Z` estaba 2.4 m corto y la lente terminaba a 2.2 m
de la singularidad — a *esa* distancia 0.96 m de `Rs` tapaban el frame, y era
la causa del frame negro. Se arregló `APPROACH_Z`, la lente ahora para a
10.2 m, y 0.96 nunca se re-derivó: el radio aparente de la sombra al final
del rail quedaba en **0.75 medios-altos-de-frame** (el borde de arriba está en
1.0, el costado en el aspect). Una joya al fondo de un corredor.

Re-derivado desde el plano: el borde ancho de la sombra es
`captureRsRetro(a)·Rs` a 10.2 m por un lente de 46°, así que **1 m de `Rs`
vale 0.78 medios-altos**. Con 1.58 + crossing la sombra llega a **1.91** en el
lado retrógrado y **0.86** en el prógrado. Tapa el alto con margen, se pasa del
costado izquierdo, y deja el lado prógrado corto — que es justo donde queda el
limbo que se acerca para que el anillo tenga sobre qué cerrarse.

`scripts/check-kerr.ts` afirma las dos puntas: la sombra tiene que pasar el
medio-alto del frame (si no, es una joya) y el borde prógrado tiene que quedar
adentro de la media-diagonal de un 21:9 (si no, el final es un rectángulo negro
sin anillo). Y que la lente quede afuera del radio aparente retrógrado, no solo
afuera de la esfera de fotones.

**Etapa 3, por qué el crossing puede crecer.** El último 11% es el horizonte
llegando: el cuarto ya se fue, la guardia de profundidad ya se levantó
(`(1-drain)²` = 0) y la lente ya está apoyada en su clamp. Es el único tramo
donde `Rs` no le pisa nada a nadie, así que el swell que no se podía gastar
antes se gasta acá. Monótono, porque `crossing` lo es.

### Dónde está

```
PORTAL_POSITION     = (0, 1.8, -24)
GATE_APERTURE_Y     = 2.55
GATE_APERTURE_Z_AHEAD = 2.4

holeCenter = (0, 2.55, -21.6)
```

El pozo se centra en `(PORTAL_POSITION.x, GATE_APERTURE_Y, PORTAL_POSITION.z + GATE_APERTURE_Z_AHEAD)`, no en el “destino” del layout. Si no, la cámara y el pozo no coinciden.

### Eje del disco (`DISK_TILT = 0.35 rad ≈ 20°`)

El número más consecuente del finale. La cámara vuela a altura de ojos hacia
un pozo a altura de ojos. Un disco en el plano del piso se ve edge-on, y
edge-on es la orientación en la que un agujero negro *parece* un agujero
negro:

1. Mitad cercana del disco, debajo de la sombra.
2. Mitad lejana, lenseada *arriba* de la sombra.
3. Envés, más fino, abajo.

Las tres cierran el loop que ninguna otra cosa en la naturaleza produce.
Más tilt = agujero en el piso. Face-on = anillo que gira, sin estructura.

`holeAxis()` precesa ~1.5° en 30 s (`sin(t · 0.11) · 0.026`). Eje fijo = calco.
Más wobble = animación.

### Presencia: `holeGateFor`

```
smoothstep(build, 0.94, 1)
```

El pozo llega con el mecanismo, no antes. Si fadeaba desde `build 0.44`
había un arco de acreción a medio formar al fondo de un corredor de shards,
sin gate que lo sostenga.

### Ownership: `claimLensing`

Dos capas pueden dibujar el pozo. Nunca las dos a la vez (dos discos = mancha
sin estructura).

- `CinemaLayer` monta → `claimLensing()` → `holeRender.lensing = true`.
- `FinaleGate` apaga el billboard.
- Unmount (governor demote) suelta el claim. Ref-count, no boolean: el
  composer puede remountar.

---

## Dos renderers, la misma silueta

```
calidad cinema + fidelity ≠ minimal
        → CinemaLayer (geodésicas, post)
cualquier otro caso
        → billboard de FinaleGate (tres arcos pintados)
```

`CinemaLayer` es lazy y solo lo importa `quality === 'cinema'`. Un teléfono
en `lite` no baja el chunk del composer ni el integrador. El budget de
bundle se mide desde ese módulo, no desde un nombre de chunk.

### A. Desktop: `BlackHoleEffect`

Pasada full-screen de `@react-three/postprocessing`. Por píxel resuelve de
dónde vino la luz.

#### La ecuación

En el plano rayo–centro, con `u = 1/r` y `φ` el ángulo barrido:

```
d²u / dφ² = −u + (3/2) · Rs · u²
```

El primer término es una recta en polares. El segundo es toda la relatividad
que importa acá: la luz cae.

Integrar eso da, sin dibujarlos a mano:

- **Sombra.** Impact parameter `< 3√3/2 · Rs` → el rayo entra y no vuelve.
  Early-out más barato y más valioso de la pasada.
- **Anillo de fotones.** Rayos justo afuera dan vueltas y cruzan el disco
  varias veces. El brillo diverge en el borde. Sale de la integración; no
  hay un mesh de anillo.
- **Disco lenseado.** El loop sigue después del primer cruce → imagen
  secundaria del envés, arco sobre la sombra. Un billboard no puede hacer
  esto.
- **Cuarto lenseado.** El rayo que escapa sale en otra dirección. Se
  reproyecta a screen space y se samplea el frame que el composer ya dibujó.
  Columnas, consolas y tipo se doblan. Por eso esto vive en post, no en la
  escena.
- **Beaming.** Órbita a `β = 0.6185` en el ISCO de `a = 0.85`. Doppler a la
  cuarta: el limbo que se acerca es **324× más brillante** que el que se aleja,
  en lineal. ACES lo comprime aguas abajo hasta el orden de los 2–55× que
  *muestran* las referencias, que ya vienen tonemapeadas (ver la tabla del
  final: lo que salió en Interstellar tiene el beaming apagado a propósito).

El header del shader menciona jets analíticos. El fragment que corre hoy no
los integra: el costo está en geodésicas + disco + cielo.

#### Por qué no funde el frame rate

Casi ningún píxel paga el integrador.

1. **Máscara.** Disco emplumado alrededor del centro proyectado, tamaño =
   radio aparente de la sombra (`atan(2.6 Rs / distancia) / tan(fov/2)`).
   En el corredor toca solo el umbral del gate.
2. **Tres tiers**
   - `impact > max(outer, 14 Rs)` → deflexión débil `2 Rs / b`, una rotación.
   - Adentro del radio de captura → presupuesto corto (el destino ya se sabe).
   - Cerca de `2.598 Rs` → `uSteps` completo (el anillo).
3. **Steps según fidelity**

| Fidelity | Steps | Qué se pierde |
| --- | --- | --- |
| `full` | 88 | nada |
| `reduced` | 44 | imagen de tercer orden |
| `minimal` | 28 | CinemaLayer ni monta |

Techo de compile: `BH_MAX_STEPS = 112`. `uSteps` es lo que el frame gasta.
El span de `φ` es fijo (`2.35 π`): menos steps = pasos más largos, no
trayectoria más corta. Si no, en reduced desaparece la imagen secundaria.

Integrador: Runge–Kutta 4. Un paso de orden 2 pierde la esfera de fotones
(rayos que deberían dar dos vueltas caen al horizonte) y el anillo, lo más
reconocible de la imagen, no está.

#### Disco (`bhDisk`)

Plano, no volumen. Cada cruce de signo de la altura sobre el plano es un
hit; interpolación lineal del radio.

- Borde interno abrupto, externo que se adelgaza (`smoothstep`).
- Flujo log-polar: `log(r)` es autosimilar, sin costura ni escala propia.
- **Advección kepleriana acotada** (`BH_KEP_PERIOD`, ver abajo). Antes era una
  espiral fija que el flow giraba *rígido*, con una nota explicando que la
  rotación diferencial de verdad enrolla el disco hasta hash. Enrolla — pero se
  puede acotar en vez de renunciar a ella.
- Temperatura **Novikov–Thorne**, escrita como la ley y no como su consecuencia:
  `temp ∝ (rᵢ/r)^0.75 · [1−√(rᵢ/r)]^0.25`, `radial = temp⁴`. El mismo `temp`
  colorea el gas, así que la rampa de color y la de brillo son *una* ley y no dos
  gradientes a mantener en sincro.

  El segundo factor es el que faltaba. `r^-3/4` a secas hace que el borde interno
  sea el punto más caliente y más brillante del disco, y no lo es: por el ISCO no
  se puede transmitir torque, así que el flujo se va a **cero en el borde** y el
  pico queda en `(49/36)·rᵢ`, un 36% afuera. La referencia coincide al píxel — su
  muestra más brillante y más amarilla está a 1.20 radios de sombra y cae para los
  dos lados. El rango visible pasa de los 435:1 que predecía la ley pelada a
  **39:1**, y la referencia mide 33:1: los 435 eran la razón contra un borde que
  nadie ve, porque con `a = 0.85` el ISCO está en 1.32 Rs y la sombra llega a
  3.37, o sea que el borde interno del disco vive **detrás de la sombra**.

  Corolario que corrige una nota vieja de este mismo archivo: el "rim brillante y
  duro" que se ve en toda imagen real **no es el disco terminando**, es el anillo
  de fotones apoyado en el filo de la sombra. El disco propio se desvanece.
- Doppler + redshift gravitatorio, intensidad `shift⁴` — el exponente honesto.
  Estaba en 3.2 con una disculpa adjunta ("^4 pone un factor 80 en el limbo y el
  tone map lo aplasta a blanco"). Diagnóstico equivocado: el **pico casi no se
  mueve** entre 3.2 y 4, porque en el rim el término gravitatorio cancela el
  boost y el shift total es ~1, donde cualquier exponente da 1. Los 0.8 extra se
  gastan enteros del lado oscuro, que es exactamente donde las referencias los
  ponen.
- Columna: un rayo rasante atraviesa más slab. Eso le da espesor a un plano.
- Ópticamente fino: opacidad = un tercio de la densidad. El disco *suma* luz.

#### Advección kepleriana sin enrollarse (`BH_KEP_PERIOD`)

`Ω = 1/(r^3/2 + a)` en radios gravitatorios, así que el rim interno le da vueltas
al borde externo. Ese shear es la diferencia entre plasma en órbita y una
calcomanía girando.

El `+a` es el frame dragging y no es decorativo: `r^-3/2` a secas pone **20.9:1**
de cizalla entre el rim y el borde externo de este disco, y `a = 0.85` tiene
**17.6:1** — el agujero se lleva el gas de afuera con él, así que el de adentro lo
pasa menos veces de las que diría Newton. La constante `3.39` que va adelante
renormaliza Ω al valor que daba la ley pelada en el ISCO, para que el `rate` y el
pitch de los brazos conserven los números con los que se calibraron y lo único que
cambie sea la *razón* a través del disco, que era lo único que estaba mal.

El desplazamiento es `Ω(r) · rate · mod(flow, period)`: **lo que envuelve es el
tiempo, no la fase enrollada**. Ese es todo el truco y es fácil hacerlo mal —
envolver el producto deja un serrucho en radio cuya pendiente igual crece con la
sesión, que es la misma divergencia disfrazada. Con el tiempo envuelto, el
gradiente radial de cada copia queda acotado por `rate · period · |dΩ/dr|` para
toda la vida de la página.

Dos copias, medio período desfasadas, con crossfade en un triángulo que pesa
cada una a **exactamente cero** en el instante en que se re-siembra, y a suma
**exactamente uno** siempre. `scripts/check-kerr.ts` afirma las dos cosas: si la
suma no es 1 el disco pulsa una vez por período (lee como el pozo parpadeando),
y si una copia no está en cero en su costura el pop se ve.

Costo neto: **cero**. El warp bajó de dos `bhFbm` a dos `bhNoise` — seis octavas
gastadas en un *desplazamiento*, que solo tiene que mover dónde caen las octavas
de abajo — y eso paga la segunda copia.

`ponytail:` un gulp multiplica la tasa del flow por ~50, así que en el pico la
copia se re-siembra en menos de un segundo y el wind llega a dos vueltas. Techo:
en esos beats la banda lee como hirviendo en vez de orbitando — bastante cerca de
lo que un gulp es. Upgrade: escalar el período con la tasa, o advectar un buffer.

Paleta (no cuerpo negro: no hay azul en esta sala):

| Uniform | Color | Dónde |
| --- | --- | --- |
| `uHot` | `#ffd4a0` | rim interno (`temp > 0.9`) |
| `uCool` | `#bd6d3e` | cuerpo del disco (acento del corredor) |
| `uEmber` | `#6a2a14` | borde externo **y** limbo que se aleja |
| `uChill` | ink → blanco | limbo que se acerca |
| `uVoid` | `sceneColors.abyss` | fuera de buffer / captura |

`uEmber` cubre dos puntas de la misma rampa porque son la misma física: gas
frío. Antes el tint mezclaba sobre `t` (el radio normalizado), que reparte el
cambio de hue parejo. La referencia no: el render edge-on de NASA va de
blanco-ámbar en el rim a un **#bf3507 medido** en el arco externo, y dos tercios
de ese cambio pasan adentro de los primeros 3 Rs — porque es una rampa `r^-3/4`,
no lineal.

El flow **no** es función del scroll. Es un acumulador (`Δt · rate`). El
stator sí se scrubbea: un mecanismo que no revierte está roto. Un fluido
que corre al revés es un video en rewind. El scroll dueño es la *tasa*
(`0.22 + drain·4.6 + surge·7.2`).

#### Cielo doblado (`bhSky`)

Samplea `inputBuffer` en la dirección de escape. Extra: succión en UV
(espiral hacia el pozo, más fuerte en cada gulp). Fuera del frame → fade a
`uVoid`, no smear del píxel del borde.

#### Guardia de profundidad

La pasada no sabe qué está sampleando. Una consola a 1 m, un par de grados
al lado de la apertura, se veía con la sombra pintada *a través* del copy.

`uNearGuard` = depth window-space de un punto al 70% del camino al pozo,
leído de la projection matrix (la depth de ventana no es lineal; a 24 m vs
21 m hay tres milésimas). Todo lo más cerca se deja como se dibujó.

La guardia se levanta con `(1 - drain)²`. Cuando el corredor ya está
adentro del campo, “adelante” deja de significar algo.

Casi toda la sala escribe `depthWrite: false` (`ReconstructMaterial`). Eso
está bien: la luz sí atraviesa una nube de shards. Excepción: desde
`swallow >= 0.12` el material prende depth, si no el pozo pinta encima de
alambres que siguen adelante.

Las caras de las consolas (`Console.tsx`) se apagan con `1 - drain`. Si
siguieran opacas, a un metro de la lente subtenderían el frame y
agujerearían el horizonte en el climax. El frame shardeado (fino, para
doblar) sigue cayendo.

#### Eclipse, y por qué lo último que queda es el anillo

`uEclipse = crossing * 0.85`, con `crossing` de swallow `0.86 → 0.97`.

Caer al horizonte hace dos cosas opuestas: la luz de afuera se apila en
una banda y *brilla* (blueshift), después el redshift gana y no queda luz.
`blaze` pica a 1/3 del crossing; `survives = 1 - eclipse` se lleva el resto
a cero.

Estaba atenuado a `* 0.12` porque a fuerza plena el final era un rectángulo
vacío. **El rectángulo vacío no era culpa del eclipse**: la pasada multiplicaba
*todo* lo que dibujaba por el mismo `survives`, así que el disco, el cielo y el
anillo de fotones se iban juntos y no quedaba nada que fuera lo último.

Una caída no hace eso. La aberración comprime todo el cielo de afuera en una
banda que se angosta alrededor de la dirección de viaje mientras el redshift se
lleva el resto, así que lo último que hay para ver es un arco fino y brillante en
el borde de la sombra — y después eso también. `ringSurvives = sqrt(survives)`
agenda el anillo *después* del disco y del cielo en vez de con ellos: al final del
rail el disco está al 15% y el filamento al 39%. Eso es el final — un anillo
cerrándose sobre negro — y no un retrato que nunca resuelve.

El anillo vive en `halo`, fuera de `glow`, exactamente por eso.

#### Anillo de fotones

El analítico (`exp(-((b − b_captura)/σ)²)`) se suma encima porque una divergencia
sampleada en grilla finita sale punteada.

- **σ = 2.2% del radio** de captura ≈ 1.1% del diámetro, y el FWHM que sale de ahí
  es 2.6% del diámetro. La referencia medida: un corte vertical por el ápice del
  render de NASA da **FWHM = 1.5% del diámetro**. Se queda en 2.2 igual, y el
  motivo es de píxeles y no de física: en el corredor la sombra mide ~45 px de
  radio, donde 1.5% del diámetro ya es sub-píxel y el anillo se rompe en puntos.
  Los anillos *publicados* por EHT miden mucho más gordo (0.6–0.8 del diámetro)
  porque están convolucionados con el beam; los valores deconvueltos son 0.23–0.5.
- **No le des más bloom.** Contra el negro el contraste del anillo es infinito y
  contra el hueco justo afuera es 20:1, pero contra el disco *a la misma altura* la
  referencia mide **1.16:1**. Lo que lo hace legible es que es fino, no que sea
  brillante. Y el corolario opuesto, medido sobre PRIMO/M87\*: la misma fuente
  desenfocada a medio diámetro de anillo se cae de 10.5:1 a 1.3:1 de contraste
  sombra/anillo. Cualquier blur que toque la sombra la borra.
- **Amplitud 0.55 + swallow·0.9**, tres veces la de antes. Estaba subescrito en
  0.18 contra un rim de disco que pica cerca de 6: el rasgo más reconocible de la
  imagen quedaba un factor 30 abajo de la banda que rodea, y leía como una costura
  en la sombra en vez de como el filamento que solo un agujero negro dibuja.

#### Las dos costuras verticales (arregladas)

Fueron **dos**, con la misma pinta y causas distintas, y arreglar la primera no
tocó la segunda. Vale la pena tenerlas separadas porque el síntoma es idéntico —
media pantalla lenseada y media no — y es fácil creer que ya está resuelto.

**Costura 1: el signo del frame dragging.**

`sense` leía `sign(dot(plane, uAxis))` y eso ponía una **costura dura por el medio
del frame**. El conjunto donde el plano orbital del rayo contiene el eje de spin
es una curva por el centro proyectado del pozo — con el eje casi en el up del
mundo y la lente sobre el Z del corredor, es prácticamente la vertical — y
cruzándola `sign()` daba vuelta el término de frame dragging de totalmente
prógrado a totalmente retrógrado en un píxel. Cada trayectoria de un lado y del
otro se integraba con la curvatura opuesta: el disco, el anillo y el cuarto
lenseado pisaban un borde visible.

La proyección (`dot(plane, uAxis)`, sin `sign`) es además la cantidad honesta: un
rayo cuyo plano contiene el eje no lleva momento angular respecto de él y no lo
arrastra ninguno de los dos lados. `sign()` reclamaba el máximo de uno o del otro
para exactamente esos rayos.

**Costura 2: la silueta del `uDepthGuard`.**

Visible en el finale temprano (swallow ~0.15), sobrevivió al arreglo de arriba
nueve horas. La causa no está en la geodésica: **una placa es un rectángulo y el
guard es un step**. `recall` trae el corredor de vuelta para el trago, así que hay
consolas a distancia de lectura escribiendo depth más cerca que `uNearGuard`; ahí
`ahead → 0`, el pase se apaga, y como el borde de la placa es una recta vertical
la lente se corta en una línea. No es el gate radial del mask — ese es suave —
sino el factor de depth que lo multiplica.

Se hizo obvia ahora y no antes porque el otro frente le puso **señal real al
fondo** (galaxia centrada en `holeCenter`): la misma discontinuidad sobre un cielo
vacío no tenía nada con qué mostrarse.

Feathear el umbral no arregla nada — el step está en la geometría de la placa, no
en el threshold. Lo que se hizo es **acotar el guard a donde se gana el sueldo**:
`cede = smoothstep(uMask*0.34, uMask*0.78, |offset|)`. Adentro de un tercio del
mask viven la sombra y el anillo (el radio aparente va de 0.29 a 0.14 del mask
según abre el drain, así que un tercio los cubre en todas las paradas) y ahí el
pozo gana **incondicionalmente**, porque la única regla dura de la página es que
nada se para delante del horizonte. Afuera, en el feather, donde de verdad está la
consola y donde `1/b` ya bajó la deflexión a casi nada, el guard mantiene toda su
autoridad. El borde de la placa sigue existiendo allá; ahora es un step en un
término que el mask ya está fundiendo a cero, y por eso deja de leerse como borde.

Verificado forzando `uDepthGuard = 0` y comparando capturas: con el guard apagado
la costura desaparece, lo que prueba que era él y no la integración.

#### El `depthTest` de la tipografía corría con el reloj equivocado

`GlyphMaterial` prendía depth test con `state.recall > 0.01`, y el comentario al
lado decía que usaba "el mismo threshold que `Lattice`" — que usa
`sceneState.swallow >= 0.12`. No era el mismo. `recall` es *el cuarto volviendo* y
termina en drain 0.72, o sea swallow ~0.68; **la sombra es más grande justo de ahí
al final del riel**. El depth test se apagaba exactamente en el tramo para el que
se había escrito.

No se veía porque `uDepthGuard` también ya se había ido a esa altura, así que el
pase sobreescribía la tipografía de todas formas. Dos errores cancelándose no es
una garantía, y deja de serlo en cuanto alguno de los dos schedules se mueve —
que es precisamente lo que hizo el arreglo de la costura 2. Ahora corre con
`sceneState.swallow >= 0.12`, que es lo que el comentario venía afirmando.

#### Cadena del composer

```
scene (linear, NoToneMapping)
  → BlackHoleEffect     CONVOLUTION | DEPTH, primero
  → Bloom               mipmap, intensidad baja cuando el pozo es dueño
  → ChromaticAberration residual (el pozo ya dobla)
  → ACES Filmic
```

`EffectAttribute.CONVOLUTION` no es un kernel: le gana su propio
`EffectPass` para no mezclarse con bloom. Montado primero, bloom lee el
disco / anillo / limbo. Montado después, el objeto más brillante del site
sería el único sin glow.

El renderer suelta ACES al montar el composer (bloom sobre valores ya
comprimidos es haze). Al unmount lo devuelve, para que un demote no deje
el GL sin tone map.

### B. Lite: billboard del gate

Teléfono / `lite` / `fidelity === 'minimal'`: no hay composer, no hay frame
para doblar. El gate ya tiene un quad en la apertura.

No se simula. Se *pinta* la misma silueta en tres términos explícitos
(cerca / arco de arriba / envés) + filament del anillo + beaming en X +
sombra en un quad *no* aditivo debajo.

Additive no puede dibujar oscuridad: solo deja de sumar luz. Con el wash
de ignition el centro salía gris. Un agujero negro más claro que la sala
es un remolino. El disc de horizonte ocluye (`NormalBlending`, casi
opaco) y le da al anillo algo alrededor de lo cual ser un anillo.

`uHorizon` es compartido: `min(0.36, 2.6 Rs / semi-ancho del plano)`. Si
sombra y anillo no son concéntricos, peor que no haber anillo.

El billboard crece con `1 + drain * 2.2`. No hay edificio: columnas, dintel
y stator se fueron.

---

## El trago: `swallowShape`

Una curva, la leen pozo, cámara, fog, shards, planetas.

### Canales

| Canal | Forma | Uso |
| --- | --- | --- |
| `amount` | `s` | presencia cruda |
| `pull` | `s²` | tug temprano |
| `grip` | `s³` | solo cuando ya va en serio |
| `drain` | trinquete de gulps (82%) + `s²` (18%) | **monótono**. Lo que ya se comió |
| `suction` | 3 pulsos raised-cosine | beat. Vuelve a 0 entre gulps |
| `surge` | `suction²` | patada de cámara / spin |
| `radius` | `1 − drain·0.97` | span del cuarto. Nunca reabre |
| `orbit` | `s^2.05 · 4 vueltas` | enrollado kepleriano |
| `tide` | `s^2.05` | espaguetificación `~1/r³` |
| `beyond` | `s 0.72 → 0.96` | último tramo, solo luz |
| `crossing` | `s 0.86 → 0.97` | la luz se apaga |
| `recall` | entra en `s < 0.1`, sale con drain `0.3→0.72` | materia retirada que vuelve para ser comida |

### Tres gulps

```
centro 0.16  half 0.12  amp 0.95
centro 0.42  half 0.13  amp 1.28
centro 0.68  half 0.15  amp 1.62
```

No se solapan. El último es el que se lleva la sala. `suction` no es el
colapso: es el tirón. Cualquier `* (1 − suction)` devolvía el cuarto al
80% entre el primer y el segundo gulp.

`scripts/check-swallow.ts` afirma: `drain` 0→1 monótono, `radius`
estrictamente decreciente, recall lleno en `s=0.3` y vacío en los
extremos, y ningún call site que mezcle drain+surge devuelve más del 5%
del span.

---

## Quién cae y quién no

`SwallowField` (`ReactorScene.tsx`) es un pivote en `holeCenter`. El grupo
interno deshace el offset para que los hijos conserven coordenadas de
autor. Cerrar el scale del grupo externo converge cada vértice en el pozo.

Adentro: consolas, módulos, retrato, hero. Afuera: `FinaleGate` (el pozo
no se traga a sí mismo), atmósfera, `FinaleCard` / `OperatorBar` (chrome
accesible).

Tres transforms, tres cosas que hace la gravedad:

```
across  = radius · (1 − suction·0.12)          achata en el plano del disco
along   = radius · (1 − tide·0.42) · gulpIn    estira en Z hacia el pozo
roll    = orbit + surge·0.9                    espiral vista por el eje
```

Un shrink uniforme no se parece a caer a un pozo.

Encima, `ReconstructMaterial` hace infall por vértice: shards más cerca
caen primero, se aplastan al plano del eje y ganan spin extra
(`12/(r+2.2)`). El grupo es el cuerpo; el shader es la marea.

`CosmicWorld` hace `position.lerp(holeCenter, drain)` en Tierra, Saturno y
luna, y apaga nebulosa / estrellas con el drain. El scroll los acerca al
horizonte; scroll arriba reconstruye el universo.

---

## Cámara (`Rig.tsx`)

El ojo también se lo traga. Quedarse al final del corredor es mirar el
colapso desde afuera: otra idea, más débil.

1. Lerp al `mouth` `(holeCenter.x, holeCenter.y, holeCenter.z + 12)` con
   `drain·1.05 + surge·0.1`. Destino monótono: `surge` solo como tug
   (~3% del camino, < 5% lo afirma el check).
2. Plunge: `beyond · 1.8 · 1.15 + surge · 0.75` hacia el umbral.
3. Clamp: `z ≥ holeCenter.z + PLUNGE_RADIUS`. `PLUNGE_RADIUS` sale de
   `APPROACH_Z − PLUNGE_DEPTH − holeCenter.z` (= 10.2 m con los números
   actuales). El tercer gulp, sin clamp, tiraba la lente *a través* de la
   singularidad: frame negro con el disco detrás de la cámara.

Look-at converge a `holeCenter`. No hay un segundo “dónde está el pozo”.

Roll: ~1° de pointer en el corredor. En el swallow, hasta ~16° en `grip`.
No queda horizonte que esté “mal”.

---

## Cómo se enciende

```
build 0.58–0.92   glow ámbar al fondo del corredor (Atmosphere)
build 0.78–0.96   charge del disco (potencia + uplink)
build 0.94–1.00   holeGate: el pozo toma el trabajo del glow
build = 1         empieza swallow
swallow 0.16      gulp 1
swallow 0.42      gulp 2
swallow 0.68      gulp 3 — el cuarto ya es disco
swallow 0.72      beyond: solo luz
swallow 0.86      crossing / eclipse
swallow → 1       FinaleCard (mail + “scrolleá para arriba”)
```

El handshake (`reactorControl.uplink`) no es un segundo control del pozo.
Cierra el circuito en la placa de contacto. El gate, a 11 m, es la
consecuencia a escala de edificio.

Bloom se reserva para tres momentos: tránsito del hero, portal on, pozo
comiendo. Con el disco HDR ya dibujado, bloom solo besa el anillo. Bloom
pesado sobre el pozo lavaba la sombra a gris.

Ignition wash CSS: `power·0.1·(1−swallow) + grip·0.02`. Un wash de
pantalla levanta el horizonte junto con todo y lo vuelve un disco gris.
La viñeta suelta el ending: el pozo abre pasado los bordes y el scrim le
tapaba los arcos de afuera.

---

## Fallback y calidad

| Experiencia | Pozo | Loop |
| --- | --- | --- |
| `cinema` + `full`/`reduced` | geodésicas 88/44 | always |
| `cinema` + `minimal` | billboard | always, sin composer |
| `lite` | billboard | demand (un frame por settle) |
| `static` / `failed` | nada 3D; el documento carga solo | — |

`prefers-reduced-motion`, save-data o sin WebGL2 no pagan Three. La
decisión vive en `capability.ts`, antes del chunk de la escena.

---

## Números para retocar (y qué rompen)

Cambiar uno de estos sin el resto desalinea luz, cámara y boca.

| Knob | Archivo | Si lo movés |
| --- | --- | --- |
| `DISK_TILT` | `blackHole.ts` | Face-on o agujero en el piso |
| `RS_OPEN` / `CROSSING_SWELL` | `blackHole.ts` | Cámara adentro de la sombra ↔ pozo que no traga el frame. `check-kerr.ts` acota los dos lados |
| `BH_KEP_PERIOD` | `BlackHoleEffect.ts` | Más: el disco se enrolla hasta hash. Menos: hierve en vez de orbitar |
| `uEclipse` (factor) | `CinemaLayer.tsx` | Frame vacío si sube sin `ringSurvives` detrás |
| `APPROACH_Z` / `PLUNGE_*` | `blackHole.ts` + `Rig` | Frame negro o shot desde afuera |
| `GATE_APERTURE_*` | `blackHole.ts` | Anillo y pozo se pelean |
| Pesos `drain`/`grip` en `holeRadiusFor` | `blackHole.ts` | Sombra joya con el cuarto a mitad de caída, o eclipse temprano |
| `GEODESIC_STEPS` | `CinemaLayer` | Se pierde el anillo en reduced |
| `SUCTION_GULPS` | `sceneState.ts` | Corrér `check-swallow.ts` |
| Máscara `apparent * lerp(1.6, 7.2, drain)` | `CinemaLayer` | Lensea la consola de contacto, o el anillo queda fuera |

No reescribir el integrador geodésico “para optimizarlo” con Euler o RK2.
El anillo es lo primero que muere.

---

## Diagrama de lectura

```
scroll (Lenis)
  ├─ build ──────── holeGateFor, holeRadiusFor (carga), Rig spline
  └─ swallow ─ swallowShape()
                 ├─ drain/grip ── holeRadiusFor (apertura), SwallowField, CosmicWorld
                 ├─ suction ──── uSuction, surge de cámara, spin del disco
                 ├─ orbit/tide ─ ReconstructMaterial, roll del Rig
                 └─ crossing ─── uEclipse, FinaleCard (beyond)

holeCenter / holeAxis
  ├─ BlackHoleEffect uniforms
  ├─ Rig mouth + look-at
  ├─ SwallowField pivot
  ├─ CosmicWorld lerp
  └─ ReconstructMaterial uHole

claimLensing
  ├─ CinemaLayer montado → geodesic on, billboard off, glow Atmosphere cede
  └─ unmount            → billboard on
```

---

## Cómo verificarlo

1. Home, desktop, quality cinema. Scroll hasta el gate: joya edge-on,
   sombra más oscura que la sala, arco de arriba + banda de abajo, limbo
   izq/der desigual.
2. Tres gulps: el cuarto no reabre entre pulsos.
3. Scroll arriba: el cuarto, los planetas y la lente salen por el mismo
   camino. El disco *no* corre al revés; solo baja la tasa.
4. Throttle GPU o `fidelity` reduced: misma silueta, anillo más simple.
5. Teléfono / `lite`: billboard, misma lectura de tres arcos + sombra.
6. `pnpm exec tsx scripts/check-swallow.ts` — la curva.
7. `pnpm exec tsx scripts/check-kerr.ts` — los radios de Kerr, la cobertura de
   frame de la sombra al final del rail, y la identidad de pesos del crossfade
   del disco. Imprime `shadow 0.86…1.91 half-frames`: el primer número tiene que
   quedar bajo la media-diagonal, el segundo por arriba de 1.

### Números de las referencias (medidos, no citados)

Las referencias viven en `/tmp` mientras se trabaja y **nunca** en el repo.

| Cantidad | Referencia | Valor |
| --- | --- | --- |
| Beaming, teórico | `β = 0.6185` (marco local no rotante) en el ISCO de `a = 0.85` | `((1+β)/(1−β))⁴ = **324:1**` |
| Idem, medido | Render edge-on de NASA/Goddard (Schnittman), luminancia lineal | **2.4:1** — 30× por debajo del δ³ físico |
| Idem, medido | DNGR Fig. 15c (Thorne et al. 2015), la versión *correcta* | **55:1** (predice 52.7 con sus propios 1.5/0.4) |
| Idem, medido | DNGR Fig. 15a/16 — lo que salió en la película | **0.80:1**: beaming apagado del todo |
| Pico de temperatura | Novikov–Thorne, `[1−√(rᵢ/r)]^¼` | en `(49/36)·rᵢ = 1.36 ISCO`, **no en el borde** |
| Idem, medido | Render de NASA, muestreo radial en luma lineal | pico `#f59b3b` a **1.20 radios de sombra** |
| Rampa de color | Render de NASA, 1.2 → 3.0 radios de sombra | hue 35° → 1°, valor **/5.5**; `/33` a 4.0 |
| Grosor del anillo | Render de NASA, corte vertical por el ápice | FWHM **1.5% del diámetro** de la sombra |
| Anillo vs. disco adyacente | Idem, a la misma altura | **1.16:1** — es un borde duro, no un glow |
| Contraste sombra/anillo | PRIMO 2023 sobre M87\*, invirtiendo la colorbar | **10.5:1**, y 1.3:1 al desenfocar al beam de EHT |
| Interior de la sombra | Render de NASA | **0 exacto**: 95% de los píxeles son RGB(0,0,0) |
| Cizalla kepleriana | `Ω = 1/(r^3/2 + a)`, ISCO → 10 Rs | **17.6:1** (Newton daría 20.9) |
| Sombra a `i = 90°`, `a = 0.85` | Curva crítica de Bardeen | 4.90 × **5.196** Rs — achatada solo 6% |
| Ocultación del lado cercano | Render edge-on de NASA | tapa **34% del diámetro** de la sombra |

Dos lecturas que cambian cómo se usa la tabla:

**El beaming medido no es el beaming físico, y eso es una decisión de arte, no un
error de nadie.** Thorne renderizó el correcto y lo tiró: *"exceedingly lopsided,
with the hole's shadow barely discernible, was obviously unacceptable"*, y bajó
el spin de 0.999 a 0.6 por la misma razón. Acá el shader emite lineal y ACES
comprime aguas abajo, así que el número que se le pasa es 324 y el juicio se hace
mirando el frame. Si algún día hay que bajarlo, se baja en el exponente — con la
tranquilidad de que Thorne llegó primero.

**Al anillo no hay que darle bloom de más.** Contra el negro es infinito y contra
el hueco justo afuera es 20:1, pero contra el disco a la misma altura es 1.16:1:
lo que lo hace legible es que es *fino*, no que sea brillante. Y la fila de PRIMO
dice lo otro: la misma fuente desenfocada a medio diámetro de anillo colapsa de
10.5:1 a 1.3:1. Cualquier blur que toque la sombra la borra.
