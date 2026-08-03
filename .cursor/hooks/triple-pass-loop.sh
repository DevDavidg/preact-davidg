#!/usr/bin/env bash
# stop: drive Pass 2 / Pass 3 follow-ups. Prefer auto-heal failures first.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_DIR="${TMPDIR:-/tmp}/preact-davidg-agent"
mkdir -p "$STATE_DIR"

INPUT="$(cat)"

# Speculative check first (non-fatal if make missing)
if python3 "$ROOT/.cursor/hooks/lib/speculative_check.py" --run >/dev/null 2>&1; then
  :
else
  # Failed check → force fix before continuing loop
  OUT="$(python3 "$ROOT/.cursor/hooks/lib/speculative_check.py" --consume 2>/dev/null || echo '{}')"
  if echo "$OUT" | jq -e '.followup_message' >/dev/null 2>&1; then
    echo "$OUT"
    exit 0
  fi
fi

printf '%s' "$INPUT" | python3 "$ROOT/.cursor/hooks/lib/triple_loop.py"
exit 0
