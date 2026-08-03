#!/usr/bin/env bash
# sessionEnd: wipe session state + temp captures.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
STATE_DIR="${TMPDIR:-/tmp}/preact-davidg-agent"
CAP_DIR="${TMPDIR:-/tmp}/preact-davidg-captures"

rm -f "$ROOT/.cursor/rules/_session-intent.mdc" 2>/dev/null || true
rm -rf "$STATE_DIR" 2>/dev/null || true
python3 "$ROOT/.cursor/hooks/lib/visual_capture.py" --cleanup >/dev/null 2>&1 || true
rm -rf "$CAP_DIR" 2>/dev/null || true

echo '{}'
exit 0
