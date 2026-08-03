#!/usr/bin/env python3
"""Triple-pass loop state machine for Cursor stop hooks."""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
STATE_DIR = Path(os.environ.get("TMPDIR", "/tmp")) / "preact-davidg-agent"
STATE_FILE = STATE_DIR / "triple-pass-state.json"

READONLY_RE = re.compile(
    # Keep in sync with detect-readonly-prompt.sh: "show me" and not bare "show",
    # or an edit request like "show the hero and fix spacing" skips passes 2 and 3.
    r"^\s*(what|why|how|dónde|donde|qué|que|cuál|cual|explica|explain|show me|lista|list|dónde está|where is)\b"
    r"|^(is|are|does|can|should)\b.*\?$"
    r"|\b(solo lectura|read-?only|sin cambios|don't (edit|change)|no (edites|modifiques))\b",
    re.I,
)
FAST_RE = re.compile(r"(?:!fast|--quick)\b", re.I)
UI_PATH_RE = re.compile(r"\.(tsx?|jsx?|css|html)$", re.I)


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {"pass": 0, "skip": False}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"pass": 0, "skip": False}


def save_state(state: dict) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state), encoding="utf-8")


def recent_ui_changes() -> bool:
    git = ROOT / ".git"
    if not git.exists():
        return False
    import subprocess

    try:
        out = subprocess.check_output(
            ["git", "status", "--porcelain"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False
    for line in out.splitlines():
        path = line[3:].strip()
        if path.startswith("src/") and UI_PATH_RE.search(path):
            return True
    return False


def main() -> int:
    raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        data = {}

    prompt = str(data.get("prompt") or data.get("user_prompt") or "")
    status = str(data.get("status") or data.get("loop_count") or "")
    loop_count = int(data.get("loop_count") or 0)

    # Prefer env / sidecar prompt file written by beforeSubmitPrompt
    prompt_file = STATE_DIR / "last-prompt.txt"
    if prompt_file.exists() and not prompt:
        prompt = prompt_file.read_text(encoding="utf-8")

    state = load_state()

    if FAST_RE.search(prompt) or READONLY_RE.search(prompt):
        state = {"pass": 0, "skip": True}
        save_state(state)
        print(json.dumps({}))
        return 0

    if state.get("skip"):
        print(json.dumps({}))
        return 0

    # pass progression: 0 -> after P1 ask P2; after P2 ask P3; then done
    current = int(state.get("pass") or 0)

    if current == 0:
        state["pass"] = 1
        save_state(state)
        msg = (
            "Pasada 2 (análisis estricto, SIN editar código). "
            "Máx. 12 bullets: Hecho | Gaps | Riesgos | Mejoras. "
            "Luego detente para Pasada 3."
        )
        print(json.dumps({"followup_message": msg}))
        return 0

    if current == 1:
        state["pass"] = 2
        save_state(state)
        ui = recent_ui_changes()
        msg = (
            "Pasada 3 (refinamiento). Aplica mejoras claras de la Pasada 2. "
            + (
                "Hubo cambios UI: corre captura visual con `.cursor/hooks/lib/visual_capture.py` "
                "(solo /tmp) y auto-evalúa. "
                if ui
                else ""
            )
            + "Luego `make quick-check` y cierra."
        )
        print(json.dumps({"followup_message": msg}))
        return 0

    # Done — reset for next user turn
    state = {"pass": 0, "skip": False}
    save_state(state)
    print(json.dumps({}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
