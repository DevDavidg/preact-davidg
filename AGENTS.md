# Guía para Agentes — preact-davidg

Portfolio personal (React 19 + TypeScript + Vite). App única en `src/` — no monorepo.

## Mapa

| Path | Rol |
|------|-----|
| `src/` | App React (páginas, componentes, hooks, estilos) |
| `public/` | Assets estáticos |
| `docs/` | Docs técnicas, [`design.md`](./docs/design.md) (spec Immersivo) y `TASK.md` |
| `.cursor/` | Rules, hooks, MCP, skills, contexto |

## Stack local

| Servicio | URL |
|----------|-----|
| Vite / FE | http://localhost:5173 |

No hay backend ni DB en este repo. No inventes APIs ni schemas.

## Diseño

Spec: [`docs/design.md`](./docs/design.md) (firma atelier + reconstrucción, tokens, fases, anti-slop).  
Figma MCP (`plugin-figma-figma`) para UI — no inventar layout ni tokens fuera del DS / `design.md`.

| Campo | Valor |
|-------|--------|
| File | [Untitled (portfolio)](https://www.figma.com/design/sAMieh52gsQCid784ildNL/Untitled?node-id=0-1) |
| `fileKey` | `sAMieh52gsQCid784ildNL` |
| Root `nodeId` | `0:1` (URL `node-id=0-1`) |

Flujo: skill `/figma-design-to-code` → `get_design_context` / `get_screenshot` con ese `fileKey` + `nodeId`.

## Comandos

| Comando | Uso |
|---------|-----|
| `make quick-check` | oxlint + `tsc -b` (~10s) |
| `make check` | quick-check + build |
| `make full-check` | check estricto (build limpio) |
| `pnpm dev` | Dev server |
| `pnpm build` | Build producción |

## Flujo estándar

1. Leer `.cursor/rules/project-context.mdc` y alcance del prompt.
2. Cambios mínimos — sin refactors no pedidos.
3. Archivos tocados ≤ **600 líneas**; si se acercan, modularizar.
4. `make quick-check` antes de cerrar.
5. Si cambian scripts, env o arquitectura → actualizar docs en la misma sesión.
6. Bypass rápido: `!fast` / `--quick` omite el triple-pass loop.

## Orquestación

Features multi-paso → Orquestador escribe `docs/TASK.md` → Minions en Composer limpio (Grok 4.5) → marcar `[x]` → cerrar sesión.
