#!/usr/bin/env python3
"""Classify prompt intent and emit agent context + line-budget alerts."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SESSION_RULE = ROOT / ".cursor" / "rules" / "_session-intent.mdc"
LINE_BUDGET = 600
WARN_AT = 500

UI_KEYS = re.compile(
    r"\b(ui|ux|css|tailwind|layout|hero|component|animat|gsap|three|canvas|page|style)\b",
    re.I,
)
API_KEYS = re.compile(r"\b(api|endpoint|fetch|backend|server|route|auth)\b", re.I)
INFRA_KEYS = re.compile(
    r"\b(docker|ci|deploy|vercel|vite\.config|makefile|hook|mcp|infra)\b", re.I
)
MATH_KEYS = re.compile(r"\b(math|matrix|quaternion|shader|physics|rapier)\b", re.I)
PATH_RE = re.compile(r"(?:src|public|docs)/[\w./-]+\.\w+")


def classify(prompt: str) -> str:
    scores = {
        "UI": len(UI_KEYS.findall(prompt)),
        "API": len(API_KEYS.findall(prompt)),
        "Infra": len(INFRA_KEYS.findall(prompt)),
        "Math": len(MATH_KEYS.findall(prompt)),
    }
    best = max(scores, key=scores.get)
    return best if scores[best] else "General"


def persona(intent: str) -> str:
    return {
        "UI": "Senior Frontend — composición, a11y, motion con propósito.",
        "API": "Senior API — este repo no tiene backend; no inventar servicios.",
        "Infra": "Platform — pnpm, Vite, hooks Cursor, scripts make.",
        "Math": "Graphics/Math — precisión numérica y perf en animación/3D.",
        "General": "Senior Full-stack FE — alcance mínimo, calidad alta.",
    }[intent]


def line_alerts(paths: list[str]) -> list[str]:
    alerts: list[str] = []
    for rel in paths:
        path = ROOT / rel
        if not path.is_file():
            continue
        try:
            n = sum(1 for _ in path.open("r", encoding="utf-8", errors="ignore"))
        except OSError:
            continue
        if n >= LINE_BUDGET:
            alerts.append(f"⛔ `{rel}` tiene {n} líneas (≥{LINE_BUDGET}) — modularizar antes de crecer.")
        elif n >= WARN_AT:
            alerts.append(f"⚠️ `{rel}` tiene {n}/{LINE_BUDGET} líneas — cerca del límite.")
    return alerts


def write_session_rule(intent: str, alerts: list[str]) -> None:
    SESSION_RULE.parent.mkdir(parents=True, exist_ok=True)
    body = [
        "---",
        "description: Intención de sesión (auto-generado; no editar a mano)",
        "alwaysApply: true",
        "---",
        "",
        f"# Session Intent: {intent}",
        "",
        f"**Persona:** {persona(intent)}",
        "",
        "- Objetivo concreto; no expandir alcance.",
        "- Archivos ≤ 600 líneas; `make quick-check` tras cambios de código.",
    ]
    if alerts:
        body += ["", "## Alertas de tamaño", ""] + [f"- {a}" for a in alerts]
    SESSION_RULE.write_text("\n".join(body) + "\n", encoding="utf-8")


def main() -> int:
    raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        data = {}

    prompt = str(data.get("prompt") or data.get("user_prompt") or "")
    intent = classify(prompt)
    paths = PATH_RE.findall(prompt)
    alerts = line_alerts(paths)
    write_session_rule(intent, alerts)

    ctx_parts = [
        f"[intent] {intent} — {persona(intent)}",
        "Límite 600 líneas/archivo. Preferir Grep/Glob antes de Read.",
    ]
    ctx_parts.extend(alerts)

    out = {"additional_context": "\n".join(ctx_parts)}
    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
