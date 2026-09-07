.PHONY: quick-check check full-check dev build lint typecheck budget verify swallow kerr

quick-check: lint typecheck swallow kerr
	@echo "✓ quick-check OK"

swallow:
	pnpm exec tsx scripts/check-swallow.ts

kerr:
	pnpm exec tsx scripts/check-kerr.ts

check: quick-check build budget
	@echo "✓ check OK"

full-check: check
	@echo "✓ full-check OK"

lint:
	pnpm exec oxlint .

typecheck:
	pnpm run typecheck

build:
	pnpm run build

budget:
	pnpm run budget

verify:
	pnpm run verify

dev:
	pnpm run dev
