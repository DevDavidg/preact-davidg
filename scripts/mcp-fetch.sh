#!/usr/bin/env bash
# Thin MCP fetch server (stdio JSON-RPC).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec python3 "$ROOT/scripts/mcp-fetch-server.py"
