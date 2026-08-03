.PHONY: quick-check check full-check dev build lint typecheck

quick-check: lint typecheck
	@echo "✓ quick-check OK"

check: quick-check build
	@echo "✓ check OK"

full-check: check
	@echo "✓ full-check OK"

lint:
	pnpm exec oxlint .

typecheck:
	pnpm exec tsc -b --pretty false

build:
	pnpm run build

dev:
	pnpm run dev
