.PHONY: quick-check check full-check dev build lint typecheck budget verify swallow kerr routes

quick-check: lint typecheck swallow kerr routes
	@echo "✓ quick-check OK"

swallow:
	pnpm exec tsx scripts/check-swallow.ts

kerr:
	pnpm exec tsx scripts/check-kerr.ts

routes:
	pnpm exec tsx scripts/check-routes.ts

# Run again after the build: above it can only compare paths, here it reads the
# HTML that was just written — which is where the 404-instead-of-case-study
# regression was actually visible.
check: quick-check build budget
	pnpm exec tsx scripts/check-routes.ts
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
