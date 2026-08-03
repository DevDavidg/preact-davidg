#!/usr/bin/env bash
# beforeSubmitPrompt: classify intent + line-budget alerts.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec python3 "$ROOT/.cursor/hooks/lib/intent_context.py"
