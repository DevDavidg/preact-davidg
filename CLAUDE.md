# Claude Code

Start at [README.md](./README.md) — it covers the architecture, the progressive
enhancement contract, the size budgets and how to run the asset pipeline.

Project rules live in `.cursor/rules/`. Hooks in `.cursor/hooks.json`.

## Before proposing a change

- `make quick-check` — lint and typecheck
- `make check` — adds unit tests, build and size budgets
- `make full-check` — adds the end-to-end and accessibility suites

## Two constraints that are easy to break

1. **Nothing in the scene layer may hide document text.** The 3D typography renders
   only decorative telemetry that appears nowhere in the document. Making DOM copy
   transparent so 3D can stand in for it breaks text selection, high-contrast mode
   and hydration.
2. **The capability gate runs before the scene import.** Anything that pulls
   `three`, `gsap` or `lenis` into the critical bundle breaks the promise that a
   reduced-motion or data-saver visitor downloads none of it. `pnpm run budget`
   enforces this.
