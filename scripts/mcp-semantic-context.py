#!/usr/bin/env python3
"""Minimal semantic-ish context MCP: ripgrep + path/name scoring over src/."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROTOCOL = "2024-11-05"


def send(msg: dict) -> None:
    sys.stdout.write(json.dumps(msg) + "\n")
    sys.stdout.flush()


def respond(req_id, result) -> None:
    send({"jsonrpc": "2.0", "id": req_id, "result": result})


def respond_error(req_id, code: int, message: str) -> None:
    send({"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}})


def tokenize(q: str) -> list[str]:
    return [t for t in re.split(r"\W+", q.lower()) if len(t) >= 2]


def search(query: str, limit: int = 12) -> str:
    tokens = tokenize(query)
    if not tokens:
        return "Empty query."

    pattern = "|".join(re.escape(t) for t in tokens)
    try:
        proc = subprocess.run(
            [
                "rg",
                "-n",
                "--no-heading",
                "-S",
                "-g",
                "!node_modules",
                "-g",
                "!dist",
                "-g",
                "!.git",
                pattern,
                str(ROOT / "src"),
                str(ROOT / "docs"),
                str(ROOT / "AGENTS.md"),
            ],
            capture_output=True,
            text=True,
            timeout=20,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired) as exc:
        return f"rg failed: {exc}"

    scores: dict[str, list[str]] = {}
    for line in (proc.stdout or "").splitlines():
        if ":" not in line:
            continue
        path_part, rest = line.split(":", 1)
        rel = str(Path(path_part).resolve().relative_to(ROOT)) if path_part.startswith("/") else path_part
        score = 0
        low = (rel + " " + rest).lower()
        for t in tokens:
            if t in low:
                score += 2 if t in rel.lower() else 1
        scores.setdefault(rel, [])
        # store as "score|||line"
        scores[rel].append(f"{score}|||{rest[:240]}")

    ranked = sorted(
        scores.items(),
        key=lambda kv: -max(int(x.split("|||", 1)[0]) for x in kv[1]),
    )[:limit]

    chunks: list[str] = []
    for rel, hits in ranked:
        top = sorted(hits, key=lambda x: -int(x.split("|||", 1)[0]))[:5]
        body = "\n".join(f"  {h.split('|||', 1)[1]}" for h in top)
        chunks.append(f"## {rel}\n{body}")
    return "\n\n".join(chunks) if chunks else "No matches."


def handle(msg: dict) -> None:
    method = msg.get("method")
    req_id = msg.get("id")

    if method == "initialize":
        respond(
            req_id,
            {
                "protocolVersion": PROTOCOL,
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "semantic-context", "version": "1.0.0"},
            },
        )
        return
    if method == "notifications/initialized":
        return
    if method == "tools/list":
        respond(
            req_id,
            {
                "tools": [
                    {
                        "name": "semantic_search",
                        "description": "Search src/docs with token-weighted ripgrep for agent context",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "query": {"type": "string"},
                                "limit": {"type": "integer", "default": 12},
                            },
                            "required": ["query"],
                        },
                    }
                ]
            },
        )
        return
    if method == "tools/call":
        params = msg.get("params") or {}
        name = params.get("name")
        args = params.get("arguments") or {}
        if name != "semantic_search":
            respond_error(req_id, -32601, f"Unknown tool: {name}")
            return
        text = search(str(args.get("query") or ""), int(args.get("limit") or 12))
        respond(req_id, {"content": [{"type": "text", "text": text}]})
        return
    if req_id is not None:
        respond_error(req_id, -32601, f"Method not found: {method}")


def main() -> int:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            handle(json.loads(line))
        except json.JSONDecodeError:
            continue
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
