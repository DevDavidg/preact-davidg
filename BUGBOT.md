# Bugbot — revisión estática

Al revisar diffs de este repo:

1. **Defect-first:** bugs, regresiones, a11y rotas, leaks de rendimiento (Three/GSAP/listeners).
2. **Scope:** solo archivos del diff; no sugerir refactors cosméticos.
3. **Stack:** React 19 + Vite + TypeScript. Preferir `pnpm` / `make quick-check`.
4. **Severidad:** Critical / High bloquean cierre; Medium/Low son opcionales.
5. **Omitir:** typos, formato, docs-only, renames sin lógica.
