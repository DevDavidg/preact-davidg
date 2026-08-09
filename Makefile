.PHONY: quick-check check full-check dev build lint typecheck test e2e budget verify

quick-check: lint typecheck
	@echo "✓ quick-check OK"

check: quick-check test build budget
	@echo "✓ check OK"

full-check: check e2e
	@echo "✓ full-check OK"

lint:
	pnpm exec oxlint .

typecheck:
	pnpm run typecheck

test:
	pnpm run test

e2e:
	pnpm run e2e

build:
	pnpm run build

budget:
	pnpm run budget

verify:
	pnpm run verify

dev:
	pnpm run dev
