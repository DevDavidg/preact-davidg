#!/usr/bin/env bash
# stop: request Bugbot/security review when functional code changed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_DIR="${TMPDIR:-/tmp}/preact-davidg-agent"
HASH_FILE="$STATE_DIR/auto-review-hash"

mkdir -p "$STATE_DIR"

CHANGED="$(git -C "$ROOT" status --porcelain 2>/dev/null || true)"
if [[ -z "$CHANGED" ]]; then
  rm -f "$HASH_FILE"
  echo '{}'
  exit 0
fi

# Skip pure docs/format
FUNC=0
SENSITIVE=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  path="${line:3}"
  path="${path%% -> *}"
  # rename target
  if [[ "$line" == *" -> "* ]]; then
    path="${line#* -> }"
  fi
  case "$path" in
    *.md|docs/*|BUGBOT.md|CLAUDE.md|AGENTS.md|.cursor/skills/*|.cursor/context/*) ;;
    *.env*|*credentials*|*secrets*|.cursor/mcp.local.json)
      SENSITIVE=1
      FUNC=1
      ;;
    src/*|package.json|vite.config.ts|Makefile|scripts/*|.cursor/hooks/*|.cursor/mcp.json|.cursor/hooks.json)
      FUNC=1
      ;;
  esac
done <<<"$CHANGED"

if [[ "$FUNC" -eq 0 ]]; then
  echo '{}'
  exit 0
fi

# Dedupe by dirty-tree *content* hash (status + diff + untracked blobs).
# Written by subagent-stop-loop.sh after a review pass; path-only porcelain
# would skip re-review after fixing the same files. Do not write the hash here —
# otherwise the next stop skips before any review runs.
HASH_SCRIPT="$(cd "$(dirname "$0")" && pwd)/lib/auto_review_hash.sh"
HASH="$("$HASH_SCRIPT" "$ROOT")"
if [[ -f "$HASH_FILE" ]] && [[ "$(cat "$HASH_FILE")" == "$HASH" ]]; then
  echo '{}'
  exit 0
fi

if [[ "$SENSITIVE" -eq 1 ]]; then
  MSG="Auto-review: hubo cambios sensibles/config. Ejecutá revisión Bugbot + Security Review sobre el diff local y corregí Critical/High antes de cerrar."
else
  MSG="Auto-review: hubo cambios de lógica/UI. Ejecutá revisión Bugbot sobre cambios locales (uncommitted). Corregí Critical/High antes de cerrar."
fi

jq -n --arg m "$MSG" '{followup_message:$m}'
exit 0
