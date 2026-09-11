# Handoff — cosmic upgrade (Codex → Claude Code → Codex)

Escrito por Claude Code (Opus 5, ultracode) el 2026-09-08, después de que las cuatro
sesiones de Codex se quedaran sin usage. **Leer esto primero al volver.**

Rama `master`, todo en working tree sin commitear. Ignorar `graphify-out/` en los diffs.

---

## 1. Qué hizo cada sesión de Codex (10:00–10:16)

| Sesión | Rol | Estado |
| --- | --- | --- |
| `10-00-59` | **Orquestador** | Interrumpido a mitad de edición |
| `10-01-58` | Limpieza de controles (audio + ley WIRE) | **Terminado** |
| `10-02-58` | Planetas / retrato | **Interrumpido — dejó el build roto** |
| `10-06-11` | QA visual (Playwright) | Pausado a propósito |

### Orquestador (`10-00-59`)
Trabajó en el colapso, la cámara y los efectos. Cambios ya en disco:

- **`src/scene/sceneState.ts`** — `swallow` pasó de campo plano a getter:
  `swallow = max(scrollSwallow, autonomousSwallow)`. Nuevos campos `collapseAge`,
  `collapseLaw`, `distortion`. Nueva función `advanceCollapse(delta, law, reducedMotion)`:
  un solo reloj para planetas, galaxia, horizonte y cámara. CHAOS consume la escena en
  ~38 s, VACUUM en ~180 s, VISCOUS no consume solo (0). `distortion` sólo sube en VISCOUS
  y sólo en el último tramo (`scrollSwallow` 0.68→0.95) — esto es lo que implementa
  "el agujero negro no debe deformar su alrededor a menos que llegue al final".
- **`src/scene/blackHole.ts`** — `RS_CHARGED` 0.4→0.52; nuevo `RS_DORMANT = 0.15`, o sea
  el agujero ya existe chiquito en el centro de la galaxia desde el primer frame en vez
  de "encenderse". `holeRadiusFor` ahora usa `smoothstep(build, 0.1, 0.96)`. Nuevos
  `LENS_NEAR = 0.96` / `LENS_FAR = 0.995` (sólo se lensea lo que está *en* el pozo).
  Nuevo `ringWidthFor(narrow, framePixels)` con piso de `RING_PIXELS = 1.25` px para que
  el anillo de fotones no quede punteado cuando el núcleo es chico.
- **`src/scene/Rig.tsx`** — contra-zoom real: el FOV ahora *cierra* con `swallow.drain`
  (−10°) y sólo abre en `swallow.beyond` (+14°), en vez de abrir todo el tiempo. Nuevo
  temblor `tidal = swallow.tide * 0.55` sumado a `reactorControl.shake`. Roll con grip
  0.18→0.22.
- **`src/scene/CosmicEvents.tsx`** (nuevo, ya cableado en `CosmicWorld.tsx:350`) — cometas
  y explosiones estelares, más actividad en CHAOS.
- **`src/scene/cinema/BlackHoleEffect.ts` / `CinemaLayer.tsx`** — crecimiento del pozo
  compartido entre capas; deformación reservada al tramo final de VISCOUS.
- Deps agregadas: `simplex-noise@^4.0.3`.
- Sospecha sobre el bug del titileo negro del retrato: una operación del shader del
  retrato puede producir NaN/Inf y contaminar el bloom → guardas en
  `PortraitVoxelMaterial.ts` / `ReconstructMaterial.ts`.

### Limpieza de controles (`10-01-58`) — completo
- Sonido eliminado: `src/audio/reactorSound.ts` y `src/components/SoundToggle.tsx`
  borrados, más botón, comandos, callbacks, estado y uniforms.
- Ley **WIRE** (el "modo white") eliminada de UI, teclado y consola. Quedan
  VACUUM / VISCOUS / CHAOS; entrada inválida cae a VISCOUS.
- CHAOS conserva volumen e iluminación con movimiento fuerte; VACUUM baja calor, bordes
  y agitación.
- Se conservaron los textos sobre proyectos musicales (son contenido, no audio).

### QA visual (`10-06-11`) — pausado
- Dejó `work/cosmic-upgrade/visual-qa.mjs`: Playwright con SwiftShader, 9 paradas de
  scroll (`opening`, `earth`, `saturn`, `portrait-enter/hold/exit`, `galaxy-approach`,
  `swallow-mid`, `ending`), lee `sceneState` y `reactorControl` en vivo y escribe
  `report.json` + JPGs en `work/cosmic-upgrade/$QA_LABEL/`.
- Se pausó porque el HMR arruinaba las capturas y porque faltaba integrar Planets.
- Flag: `scripts/check-kerr.ts:247` exigía un núcleo grande (`nucleus > 0.045`), lo cual
  contradice "el agujero negro debe ser chiquito". Sugirió cambiarlo por el mínimo
  visible del anillo (>1.1 px) — que es justo lo que `ringWidthFor` ya implementa.

---

## 2. El build estaba ROTO — qué arreglé

La sesión de planetas (`10-02-58`) **extrajo todo el sistema de planetas de
`src/scene/CosmicWorld.tsx`** (948 → 383 líneas) para moverlo a `src/scene/Planets.tsx`
y se cortó **antes de escribir ese archivo**. `CosmicWorld.tsx` renderizaba
`<Planets quality={quality} />` con el import comentado.

`pnpm run typecheck` fallaba con:
```
src/scene/CosmicWorld.tsx(349,8): error TS2304: Cannot find name 'Planets'.
src/scene/CosmicWorld.tsx(14,3): error TS6133: 'holeGlowFor' declarado y nunca usado.
src/scene/blackHole.ts(3,10): error TS6133: 'clamp01' declarado y nunca usado.
```

Hecho por Claude Code:

- `CosmicWorld.tsx`: descomentado `import { Planets } from "./Planets"`, borrado el
  import muerto `holeGlowFor`.
- `blackHole.ts`: borrado el import muerto `clamp01`.
- **`src/scene/Planets.tsx` escrito** (39 KB, ~830 líneas), portando los shaders del
  HEAD y aplicando el pedido del usuario. Ver sección 3.

---

## 3. `src/scene/Planets.tsx` — qué hay dentro

Los tres mundos ya no son mobiliario: son **pasadas cercanas**. El driver no es
`build` sino la profundidad que le queda al lente, leída de la cámara viva, así que
la pasada es exacta a través del damping, `corridorLateral` y el parallax del puntero:

```ts
const gap   = camera.position.z - spec.z
const swing = 1 - THREE.MathUtils.smoothstep(gap, 0, spec.reach)
```

Medido contra el `CAMERA_PATH` real (401 muestras, `BASE_FOV = 46`):

| mundo | acercamiento mínimo | pico del disco | ventana |
| --- | --- | --- | --- |
| Tierra | **3.07 m** (≈1.9 m de superficie al lente) | 0.95 de media altura de frame | build 0.24 |
| Saturno | **3.98 m** | 1.50 (borde externo del anillo) | build 0.46 |
| Luna | **3.06 m** | 0.91 | build 0.72 |

Las tres z son el punto medio entre dos vanos de la columnata (6.4 / 2.2 / −2.0 /
−5.6 / −9.2 → 0.1 / −3.8 / −7.4), así que ningún cuerpo puede crecer atravesando una
columna a ningún x.

**Argentina** es un test polígono real punto-en-polígono (par-impar) con 28 segmentos
de continente más un anillo aparte de 5 para Tierra del Fuego, acotado primero por un
bbox en UV (`p.x 0.585..0.708, p.y 0.189..0.384`) así que el 99 % de los fragmentos
sale por la primera rama. Un solo `sqrt` para todo el país. El yaw se resuelve
analíticamente, no por ajuste: en `SphereGeometry` el UV u está en azimut `−lon` y
`Ry(yaw)` resta del azimut, así que `yaw = −ARG_LON − bearing` deja a Argentina justo
sobre el rumbo de la cámara. Verificado: `dot(argDir, toCam)` 0.993 → 0.999 entre
build 0.10 y 0.24. El tilt de la Tierra es **−0.41** (los mismos 23.4°, inclinados al
otro lado) para que el punto sub-cámara caiga a 3° de Argentina en el frame clave.

**Sombras**: no hay shadow maps en ninguna parte de la escena y no puede haberlos —
`Atmosphere.tsx:91` documenta que todos los materiales son unlit con direcciones de
luz hardcodeadas. Así que "mejorar sombras" se respondió **en shader**: `reliefShade`
(auto-sombreado del relieve), la sombra proyectada del anillo sobre Saturno (camina el
rayo solar hasta el plano ecuatorial y le pregunta al mapa alpha del anillo qué se
interpone) y `umbra`. Es una respuesta de shader, no de shadow map — saberlo.

Corregido por Claude Code sobre lo que entregó el agente:

- **Sentido de las pasadas invertido.** Los tres mundos barrían hacia el mismo lado
  que el panel que se está leyendo en ese mismo beat — un disco brillante de casi una
  media altura de frame justo detrás del texto. Los vanos están en x −2.15 / +2.2 /
  −2.1 / +2.15 para z 4.6 / 0.4 / −3.8 / −7.6, así que Tierra sale a babor y Saturno a
  estribor. La Luna es la excepción y no la decide la simetría: babor en z −7.4 es la
  calle del retrato de About, así que se queda a estribor y libra el panel por fuera
  (sweep 4.4, borde interno en x 3.3).
- **Dos materiales de anillo muertos.** Se construía uno por mundo pero el JSX sólo
  monta la malla si `p.ring` — o sea Saturno. Dos se construían, se escribían cada
  frame y se destruían sin renderizar nunca. Ahora el array es disperso (`null` en los
  slots sin anillo) manteniendo el índice alineado.
- **Asignación por frame.** `for (const m of [planets[i], rings[i]])` allocaba un
  array de dos elementos por mundo por frame. Reemplazado por `warpMaterial()` a nivel
  de módulo.
- **El destello de las novas ahora ilumina.** Ver sección 4, punto 6.

---

## 4. Lo que arregló Claude Code fuera de Planets.tsx

1. **`scripts/check-kerr.ts` desbloqueado.** El criterio nuevo (anillo de fotones nunca
   por debajo de 1.1 px vía `ringWidthFor`) ya lo habías escrito en `:295-329`, pero
   nunca borraste el piso viejo `nucleus > 0.045` que exige lo contrario de lo que
   pidió el usuario. Reemplazado por el criterio que sí importa: la sombra tiene que
   ser un disco resoluble, no un pixel muerto (>3 px de radio a 720p; hay 6.8 con el
   `RS_DORMANT` actual). El script pasa.
2. **`RING_SIGMA` exportado** desde `blackHole.ts` y el assert de `check-kerr.ts:340`
   pasó de `=== 0.022` (literal duplicado de una const privada) a
   `assert.equal(..., RING_SIGMA)`.
3. **`check-swallow.ts` ya no imprime un número que no mide.** `beyond opens at
   s=0.720` era un literal; ahora se calcula (`s=0.721`).
4. **`ReconstructMaterial.ts:487` — bug real de tu requisito 5.** `uniforms.uTide.value
   = swallow.tide` **sin** multiplicar por `sceneState.distortion`, a diferencia de
   todos sus hermanos. Alimenta `squash` en el vertex, así que en CHAOS y VACUUM —
   donde `advanceCollapse` corre el swallow por reloj y `distortion` queda en 0 — el
   corredor entero se achataba mientras planetas, galaxia y lente no. Gateado.
5. **`Rig.tsx:256` — el mismo hueco en la cámara.** `swallow.tide * 0.55` sacudía el
   lente por una marea que en CHAOS/VACUUM no deforma nada. Gateado con `distortion`.
6. **El bug del titileo negro: faltaba la mitad.** Guardaste `PortraitVoxelMaterial` a
   fondo, pero **`ReconstructMaterial` no recibió ninguna guarda** — y es el material
   por el que la cámara literalmente vuela, renderizando al mismo target half-float del
   composer. Corregido:
   - `:204` `pow(1.0 - max(dot(normal,view),0.0), 2.6)` — el `max` estaba sobre el
     dot, no sobre el resultado. Con interpolantes renormalizados `dot = 1.0001`, base
     `-0.0001`, y `pow(negativo, 2.6)` es **NaN**. Es literalmente el bug que el
     retrato arregló en su propia línea 131. → `clamp(...)`.
   - `:117` `normalize(cameraPosition - worldPos.xyz)` → guardado con `max(length,1e-4)`.
   - `:116` `normalize(mat3(modelMatrix)*mat3(instance)*...)` → guardado.
   - `:197-198` `normalize(vNormalW)` / `normalize(vViewDir)` → guardados.
   - `:298` `if (alpha < 0.004) discard` es **false para NaN**, o sea el fragmento NaN
     se dibujaba. → `if (!(alpha >= 0.004)) discard` más clamp ordenado de salida.
7. **La guarda de velocidad, en la raíz.** `runtime.ts` escribía `sceneState.velocity =
   lenis.velocity` sin sanitizar — nueve lectores, siete de ellos uniforms de shader.
   `PortraitVoxelMaterial` lo documentaba y lo guardaba en 1 de 9. Ahora se sanea y se
   clampea (±200) en el único punto donde entra a la escena.
8. **`sceneState.flash` ya no es de sólo escritura.** Agregué el destello de las novas
   a `sceneState` (`flash/flashX/Y/Z`) y `CosmicEvents` lo escribe. **No** con un
   `pointLight`: `Atmosphere.tsx:91` documenta que no hay luces de escena a propósito y
   una lámpara real habría costado uniforms sin iluminar nada. El consumidor está en el
   fragment de los planetas — un segundo término lambert con dirección en object space
   resuelta en CPU y falloff autorado. Ahora una nova sí ilumina el costado de un
   planeta.
9. **`CosmicEvents`**: tres `THREE.Color` allocados por evento por frame (9 por frame en
   cinema) hoisteados a constantes de módulo.
10. **`simplex-noise` removido.** Estaba en `package.json` y no se importaba en ningún
    archivo. Si lo agregaste para trabajo de ruido que todavía falta, volvelo a poner.
11. **CSS muerta de WIRE borrada.** `app/scene.css:177-180` (`:root[data-wire='on']`).
    `data-wire` lo escribía `StageTreatment` iterando `MODES`, que ahora es
    `['crt','overclock','ghost']` — el atributo no puede setearse nunca. Era la única
    referencia colgada de toda la limpieza de audio/WIRE; el resto (imports, i18n,
    atajos de teclado, comandos de consola, docs) está limpio.
12. **`sceneState.collapseLaw` tipado.** Era `string` por widening en un object literal,
    así que `advanceCollapse` y `LawId` no estaban conectados por el tipo. Ahora
    `'VISCOUS' as LawId` con `import type` (borrado en compilación, no cierra ciclo).
13. **Comentario obsoleto de `check-swallow.ts`** que seguía afirmando que el eje es una
    función pura del scroll — falso desde `advanceCollapse`. Reescrito: `swallowShape`
    sigue siendo pura, lo que ganó un segundo canal es el *origen* de su argumento.
14. **`OperatorBar.tsx`** docblock huérfano reubicado; **`Nav.tsx`** doble línea en
    blanco que dejó `<SoundToggle />`.

---

## 5. Estado verificado ahora mismo

```
pnpm run typecheck   PASS (sin diagnósticos)
pnpm run lint        PASS (2 warnings pre-existentes de fast-refresh en CosmicWorld.tsx)
check-cosmos.ts      PASS  bulge 23.6% inside 0.1 R, arms 4.90x mean, stretch peak 2.48x
check-swallow.ts     PASS  page in by s=0.633, beyond opens at s=0.721
check-kerr.ts        PASS  nucleus 0.019 half-frames at 32.2 m, ring 1.25 px
pnpm run build       PASS  built in 1.32s, 37 prerenders, ReactorScene 251.77 kB / 80.92 kB gzip
```

---

## 6. Lo que queda para vos

1. **QA visual — el único item importante.** Nada de esto se vio corriendo en una GPU
   real. Usá `work/cosmic-upgrade/visual-qa.mjs` que ya dejaste, pero **contra un
   preview de producción, no contra dev**: el HMR es lo que te arruinó las capturas.
   Una captura por carga fresca. Lo que hay que confirmar:
   - Las tres pasadas cercanas encuadran de verdad en build 0.24 / 0.46 / 0.72.
   - Argentina se lee sobre el globo en el frame clave.
   - El titileo negro del retrato desapareció al armarse y desarmarse.
   - CHAOS se traga todo sin scrollear y nada se deforma hasta el final en VISCOUS.
2. **No existe `scripts/check-planets.ts`.** Vale la pena: las distancias de las
   pasadas y los solapamientos con la columnata son exactamente la clase de número que
   se rompe en silencio con un retoque del `CAMERA_PATH`.
3. **La garantía de "iluminada" de Argentina expira en build ≈0.26** (`n·SUN` cae a
   0.008 en 0.28). Es después del acercamiento máximo, así que se lee como despedida, y
   sigue legible por el piso `lit = 0.35 + 0.65*day`. Aceptable, pero saberlo.
4. **`Planets.tsx` muta texturas cacheadas por `useLoader`** (`colorSpace`, `anisotropy`,
   `wrapS`). Hoy no choca — nada más toca `/cosmos/` salvo `sky.webp` — pero cualquier
   consumidor futuro de `earth-mask.webp` hereda el `LinearSRGBColorSpace`.
5. **Estilo**: `Planets.tsx` es single-quote/sin punto y coma; `CosmicWorld.tsx` es
   double-quote/con punto y coma. oxlint no se queja. Cosmético.
6. Los 2 warnings de fast-refresh en `CosmicWorld.tsx` son porque exporta
   `galaxyGeometry` y `spiralFall` junto con componentes. Los consumen `check-cosmos.ts`
   y `Planets.tsx`, así que arreglarlo pide un módulo aparte.


---

## 7. Segunda ronda — lo que el usuario vio en pantalla

Se probó en GPU real (Playwright + SwiftShader, `work/cosmic-upgrade/shots.mjs`,
`diag.mjs`, `depth.mjs`). El usuario reportó dos cosas y ambas eran reales.

### "no estan los planetas"

Mío. El término del destello que agregué al fragment de los planetas usaba `n`, que
sólo existe dentro de las ramas del if/else del shader. El fragment **no compilaba**
(`0:507: 'n' : undeclared identifier`), el programa quedaba inválido y los tres
mundos no dibujaban nada. Corregido a `n0`, la normal geométrica, que además es la
correcta: un destello a doce metros no proyecta relieve de montañas en su terminador.

**Lección para el handoff:** un error de compilación de shader no rompe el typecheck,
ni el lint, ni el build, ni ninguno de los cuatro check scripts. Sólo aparece en la
consola del navegador. Hay que abrir la página.

### El encuadre: los mundos se comían el texto

Descubierto al mirar las capturas. El modelo de la pasada estaba mal planteado:
`swing` sólo llega a 1 cuando la cámara queda *al lado* del mundo, así que todo el
acercamiento —donde el disco crece de una mota a dos tercios del frame— ocurría con
el mundo **sobre el eje**, es decir tapando la copy. La Luna llenaba el frame entero
detrás de "Sobre mí". No fallaba nada: typecheck, build y `check-cosmos` en verde y
el corredor ilegible.

Rehecho: `src/scene/planetSpec.ts` (módulo nuevo, aritmética pura sobre el camino de
cámara) más `scripts/check-planets.ts`, que mide el encuadre sin canvas y afirma la
composición. Un mundo está fuera del eje **toda** la pasada. Números medidos, no
elegidos:

| mundo | disco entero visible | pico centrado | z |
| --- | --- | --- | --- |
| Tierra | 0.41 media-altura @ build 0.06 | 0.59 @ 0.10 (4.6 m) | 0.4, sale a babor |
| Saturno | 0.34 @ 0.22 | 0.38 @ 0.33 (6.0 m) | −3.6, sale a estribor |
| Luna | 0.39 @ 0.57 | 0.44 @ 0.59 (6.0 m) | −7.4, babor, por fuera del retrato |

Dos errores míos que ese check ahora atrapa: puse la Luna en z −6.2, que **atraviesa
el vano de la columnata en −5.6**, y el footprint en profundidad del anillo de Saturno
se calculaba con el radio completo cuando el anillo está inclinado — es `r·sin(tilt)`,
menos de la mitad. Con el radio completo la aserción era insatisfacible: pedía 5.2 m
entre vanos que están a 3.6 m.

El check separa la garantía por forma de pantalla: en 4:3 el marco es 25 % más angosto
en medias-anchuras, así que el mundo entra como limbo lateral en vez de completo. Lo
que se exige en **toda** forma es que la copy nunca quede cubierta.

### "el agujero negro superpone los objetos"

Real, y la causa tomó tres mediciones. El pase del pozo **ya tiene** un guard de
profundidad correcto, con los umbrales bien puestos (`LENS_NEAR`/`LENS_FAR`). Lee el
depth buffer. El problema era qué hay en ese buffer:

1. Recorriendo la escena viva a build 0.9, los **únicos** cuatro que escribían
   profundidad eran los tres planetas y el portal. Ninguna placa de consola.
2. `ReconstructMaterial.sync` decide `depthWrite` con
   `stage = state.assembleAt ?? state.build`, pero **17 de 18 de esos materiales
   nunca reciben `sync`** — su `uBuild` se queda en el 0 del constructor. Así que la
   decisión se resolvía contra `0 > 0.55` y era `false` para siempre. Arreglado en el
   constructor, que es donde para esos materiales se decide de verdad:
   `depthWrite: (options.opacity ?? 1) > 0.8`.
3. Aun así el panel UPLINK seguía siendo atravesado, y ahí estaba la razón de fondo:
   `Console.tsx` tiene un proxy de profundidad dedicado (`colorWrite: false,
   depthWrite: true`) documentado con exactamente este razonamiento — pero su
   visibilidad era `!uplink && faceOpacity > 0.85`. **La consola UPLINK estaba
   excluida a propósito**, con cara etérea al 0.45, para que el pozo se viera *a
   través* del último panel. Buena idea que costaba más de lo que valía: la sombra y
   el anillo se dibujaban sobre su tercio izquierdo y los rayos desviados *tomaban* la
   copy y la arrastraban. Quitada la excepción; el pozo queda encuadrado al lado del
   panel en vez de detrás, que es el mismo plano con el contacto legible.

Verificado con A/B numérico sobre la banda de solape: 12 % de los píxeles cambian y la
luminancia media baja de 39.8 a 36.3, o sea el panel ahora ocluye el brillo del disco.
Y a ojo: borde izquierdo continuo, las tres filas completas.

**Ojo con un falso positivo** que casi me hace perseguir un fantasma: a build 0.97 la
copy del uplink aparece como "I X I O" / "R MAI" / "T Ш" y parece lenseada. No lo
está — es el glyph field **en pleno ensamblado**. A build 0.9 el mismo panel se lee
perfecto.

### Estado al cierre de esta ronda

```
typecheck  PASS     lint  PASS (2 warnings pre-existentes)
check-cosmos  PASS   check-swallow  PASS   check-kerr  PASS   check-planets  PASS
build  PASS — 37 prerenders, sitemap 37 urls
```

Capturas en `work/cosmic-upgrade/shot-*.jpg`. La de apertura (`shot-e2.jpg`) es la que
mejor muestra el resultado: los tres mundos encuadrados a los lados, el centro libre,
y el pozo chiquito en el medio de la galaxia lejana.

### Lo que queda

1. **Todo esto se vio en SwiftShader**, no en una GPU de verdad. Vale una pasada en
   hardware real, sobre un preview de producción y no sobre dev.
2. El resto de los items de la sección 6 sigue en pie.
3. `GlyphMaterial` sigue sin escribir profundidad (`:319`). Hoy no hace falta porque
   el proxy de la placa cubre el bloque de texto, pero cualquier tipo que quede fuera
   de una placa es lenseable.
4. `src/scene/ReactorScene.tsx` tuvo una sonda `window.__scene` temporal para medir el
   depth buffer. **Ya fue removida** — si aparece en un diff, es basura, borrala.
