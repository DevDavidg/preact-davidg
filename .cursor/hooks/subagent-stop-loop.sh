#!/usr/bin/env bash
# subagentStop: re-loop bugbot/security-review only on affirmative Critical/High findings.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_DIR="${TMPDIR:-/tmp}/preact-davidg-agent"

INPUT="$(cat)"

# Record the tree a review pass cleared, for stop-auto-review.sh to dedupe against.
# Only on the clean paths: marking a tree that still has Critical/High as reviewed
# would silence further prompts as soon as the re-loop budget runs out.
# Hash must include diff/untracked content — path-only porcelain stays stable after fixes.
record_reviewed() {
  mkdir -p "$STATE_DIR"
  "$(cd "$(dirname "$0")" && pwd)/lib/auto_review_hash.sh" "$ROOT" \
    >"$STATE_DIR/auto-review-hash"
}

STATUS="$(echo "$INPUT" | jq -r '.status // .result // empty' 2>/dev/null || true)"
SUMMARY="$(echo "$INPUT" | jq -r '.summary // .output // .message // empty' 2>/dev/null || true)"
TEXT="$STATUS $SUMMARY"

# Strong clean signals only (do not treat "no critical" as clean — High may remain).
if echo "$TEXT" | grep -Eiq \
  'found no (bugs|issues|findings)|sin hallazgos|Bugbot found no'; then
  record_reviewed
  echo '{}'
  exit 0
fi

# Affirmative defect signals. Avoid \b — BSD grep on macOS does not support it.
# Matches Bugbot XML (<severity>high</severity>), prose (Severity: high / severity: high),
# and markdown emphasis (**High** / **Critical**).
if echo "$TEXT" | grep -Eiq \
  '<severity>[[:space:]]*(critical|high)[[:space:]]*</severity>|Severity:[[:space:]]*(critical|high)([^a-zA-Z]|$)|severity[[:space:]]*[:=][[:space:]]*(critical|high)([^a-zA-Z]|$)|\*\*(critical|high)\*\*|must fix|blocking finding|❌'; then
  jq -n '{followup_message:"Subagente reportó hallazgos Critical/High o fallo. Corregí los issues y re-ejecutá la revisión hasta quedar limpio (o loop_limit)."}'
  exit 0
fi

record_reviewed
echo '{}'
exit 0

