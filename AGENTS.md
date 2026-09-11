# AGENTS.md

## Antes de tocar la escena cósmica: leé el handoff

Hay trabajo en vuelo, sin commitear, en `master`. Cuatro sesiones de Codex del
2026-09-08 (10:00–10:16) se quedaron sin usage a mitad de la tarea, y una de ellas
dejó el build roto. Claude Code lo desbloqueó y siguió.

**Leé `work/cosmic-upgrade/HANDOFF.md` primero.** Dice qué hizo cada sesión, qué
quedó terminado, qué se arregló después, y los seis items que quedan — el
importante es el QA visual, que nunca corrió en una GPU real.

Estado verificado al cierre de esa sesión: `typecheck`, `lint`, `build`,
`check-cosmos`, `check-swallow` y `check-kerr` **todos pasan**. Si algo de eso
falla ahora, algo se movió después de ese punto.

## Convenciones del repo que importan

- `docs/TASK.md` + `docs/agujero-negro.md` son el plan del pozo de Kerr: una tarea
  por chat, en serie. No implementar el archivo en bloque.
- Ponytail: diff mínimo, cero deps nuevas salvo que haga falta de verdad.
- Después de tocar código: `graphify update .` para mantener el grafo al día.
- Los materiales de la escena son **unlit a propósito** — `src/scene/Atmosphere.tsx`
  carga el razonamiento. Agregar un `THREE.Light` cuesta uniforms y no ilumina
  nada; la luz se pasa como uniform.
- La deformación por marea sólo existe en el tramo final de VISCOUS. Todo lector de
  `swallow.tide` se multiplica por `sceneState.distortion`. No hay excepciones.
