#!/usr/bin/env python3
"""Run make quick-check; if it fails, force a follow-up fix via stop hook."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
STATE_DIR = Path(os.environ.get("TMPDIR", "/tmp")) / "preact-davidg-agent"
FLAG = STATE_DIR / "needs-fix.json"


_CODE_PREFIXES = (
    "src/",
    "scripts/",
    "public/",
    ".cursor/hooks/",
)
_CODE_NAMES = {
    # The production entry point: a broken script tag or asset path ships silently.
    "index.html",
    "Makefile",
    "package.json",
    "pnpm-lock.yaml",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    ".oxlintrc.json",
    ".cursor/hooks.json",
    ".cursor/mcp.json",
}
_CODE_SUFFIXES = (".ts", ".tsx", ".js", ".jsx", ".css", ".py", ".sh")


def _normalize_porcelain_path(line: str) -> str:
    path = line[3:].strip()
    if " -> " in path:
        path = path.split(" -> ", 1)[1]
    return path


def code_changed() -> bool:
    try:
        out = subprocess.check_output(
            ["git", "status", "--porcelain"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return True
    for line in out.splitlines():
        if not line.strip():
            continue
        path = _normalize_porcelain_path(line)
        if path in _CODE_NAMES or path.startswith(_CODE_PREFIXES):
            return True
        if path.endswith(_CODE_SUFFIXES):
            return True
    return False


def run_quick_check() -> tuple[bool, str]:
    try:
        proc = subprocess.run(
            ["make", "quick-check"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        return False, str(exc)
    output = (proc.stdout or "") + (proc.stderr or "")
    return proc.returncode == 0, output[-4000:]


def main() -> int:
    """CLI: --run stores failure; --consume emits followup if needed."""
    args = set(sys.argv[1:])
    STATE_DIR.mkdir(parents=True, exist_ok=True)

    if "--consume" in args:
        if not FLAG.exists():
            print(json.dumps({}))
            return 0
        payload = json.loads(FLAG.read_text(encoding="utf-8"))
        FLAG.unlink(missing_ok=True)
        msg = (
            "Auto-sanación: `make quick-check` falló. Corregí ANTES de responder al usuario.\n\n"
            f"```\n{payload.get('output', '')}\n```"
        )
        print(json.dumps({"followup_message": msg}))
        return 0

    # default: run
    if not code_changed():
        FLAG.unlink(missing_ok=True)
        print(json.dumps({"ok": True, "skipped": True}))
        return 0

    ok, output = run_quick_check()
    if ok:
        FLAG.unlink(missing_ok=True)
        print(json.dumps({"ok": True}))
        return 0

    FLAG.write_text(json.dumps({"output": output}), encoding="utf-8")
    print(json.dumps({"ok": False, "output": output[-500:]}))
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
