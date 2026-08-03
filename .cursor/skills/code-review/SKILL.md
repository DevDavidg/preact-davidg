---
name: code-review
description: Two-axis review — spec compliance and code quality for this portfolio.
---

# Code Review

## Axis A — Spec

- ¿Cumple el pedido del usuario sin scope creep?
- ¿Estados loading/error/empty si aplica?
- ¿i18n / a11y básicos?

## Axis B — Quality

- TypeScript estricto; sin `@ts-ignore` nuevos.
- Archivos ≤ 600 líneas.
- Listeners/RAF/GSAP/Three: cleanup en unmount.
- `pnpm` / `make quick-check` verdes.
