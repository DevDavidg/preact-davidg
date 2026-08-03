---
name: auto-code-review
description: Run Bugbot/security review on local diffs and fix Critical/High before closing.
---

# Auto Code Review

## When

- Hook `stop-auto-review.sh` asks for it, or user requests review.
- Skip for docs-only / typos / formatting.

## Steps

1. Prefer Task subagent `bugbot` with `Diff: uncommitted changes`.
2. If auth/secrets/deploy config touched → also `security-review`.
3. Categorize: Critical / High / Medium / Low.
4. Fix Critical + High in-repo; re-run review if hook loops.
5. Medium/Low: mention briefly; fix only if cheap and in scope.
