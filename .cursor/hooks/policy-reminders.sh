#!/usr/bin/env bash
# stop: remind about docs sync / line budget when code changed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

INPUT="$(cat)"
CHANGED="$(git -C "$ROOT" status --porcelain 2>/dev/null || true)"

if [[ -z "$CHANGED" ]]; then
  echo '{}'
  exit 0
fi

CODE_HIT=0
DOC_HIT=0
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  path="${line:3}"
  case "$path" in
    src/*|*.ts|*.tsx|*.js|*.jsx|Makefile|package.json|vite.config.ts)
      CODE_HIT=1
      ;;
    AGENTS.md|docs/*|README.md|.cursor/rules/*)
      DOC_HIT=1
      ;;
  esac
done <<<"$CHANGED"

MSG=""
if [[ "$CODE_HIT" -eq 1 && "$DOC_HIT" -eq 0 ]]; then
  if echo "$CHANGED" | grep -Eq '(package\.json|Makefile|vite\.config|scripts/)'; then
    MSG="Policy: cambiaste scripts/deps/config sin docs. Actualizá AGENTS.md o docs/ si el cambio es de interfaz pública."
  fi
fi

# Near line-budget scan on modified src files
ALERTS=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  path="${line:3}"
  path="${path%% -> *}"
  if [[ -f "$ROOT/$path" && "$path" == src/* ]]; then
    lines=$(wc -l <"$ROOT/$path" | tr -d ' ')
    if [[ "$lines" -ge 600 ]]; then
      ALERTS+=("⛔ $path = ${lines} líneas — modularizar.")
    elif [[ "$lines" -ge 500 ]]; then
      ALERTS+=("⚠️ $path = ${lines}/600 líneas.")
    fi
  fi
done <<<"$CHANGED"

if [[ ${#ALERTS[@]} -gt 0 ]]; then
  MSG="${MSG:+$MSG }Line budget: ${ALERTS[*]}"
fi

if [[ -n "$MSG" ]]; then
  jq -n --arg m "$MSG" '{followup_message:$m}'
else
  echo '{}'
fi
exit 0
