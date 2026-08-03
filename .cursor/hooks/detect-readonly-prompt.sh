#!/usr/bin/env bash
# beforeSubmitPrompt: mark readonly / !fast prompts so stop loop can skip.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_DIR="${TMPDIR:-/tmp}/preact-davidg-agent"
mkdir -p "$STATE_DIR"

INPUT="$(cat)"
PROMPT="$(echo "$INPUT" | jq -r '.prompt // .user_prompt // empty' 2>/dev/null || true)"
printf '%s' "$PROMPT" >"$STATE_DIR/last-prompt.txt"

SKIP=0
if echo "$PROMPT" | grep -Eiq '(^|[[:space:]])(!fast|--quick)([[:space:]]|$)'; then
  SKIP=1
fi
if echo "$PROMPT" | grep -Eiq '^(what|why|how|dónde|donde|qué|que|cuál|cual|explica|explain|show me|lista|list)\b'; then
  SKIP=1
fi
if echo "$PROMPT" | grep -Eiq '\b(solo lectura|read-?only|sin cambios|don'\''t (edit|change)|no (edites|modifiques))\b'; then
  SKIP=1
fi

if [[ "$SKIP" -eq 1 ]]; then
  echo '{"pass":0,"skip":true}' >"$STATE_DIR/triple-pass-state.json"
  jq -n --arg ctx "Modo rápido/consulta: omitir triple-pass. Responder directo; no editar salvo pedido explícito." \
    '{additional_context:$ctx}'
  exit 0
fi

echo '{"pass":0,"skip":false}' >"$STATE_DIR/triple-pass-state.json"
echo '{}'
exit 0
