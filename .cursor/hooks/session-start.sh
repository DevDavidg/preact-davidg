#!/usr/bin/env bash
# sessionStart: inject stack ports + quality reminders.
set -euo pipefail

CTX=$(cat <<'EOF'
[preact-davidg] React 19 + Vite @ http://localhost:5173 | pnpm only | make quick-check
Reglas: agent-brain (600 líneas, triple-pass) | sin backend/DB | capturas solo en /tmp
Bypass: !fast o --quick
EOF
)

jq -n --arg ctx "$CTX" '{additional_context:$ctx}'
exit 0
