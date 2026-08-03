#!/usr/bin/env python3
"""Headless Playwright capture to /tmp (light + dark). Never writes into the repo."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

URL = os.environ.get("PREACT_DAVIDG_URL", "http://localhost:5173")
OUT_DIR = Path(os.environ.get("TMPDIR", "/tmp")) / "preact-davidg-captures"


def _settle(page) -> None:
    """Wait for real pixels: the 3D scene is a lazy chunk behind a boot overlay."""
    try:
        page.wait_for_selector("canvas", timeout=15000)
    except Exception:  # a page without a canvas is still worth capturing
        pass
    page.wait_for_timeout(2500)


def capture(url: str) -> list[Path]:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "playwright Python package missing. "
            "Use Cursor Playwright MCP or: pnpm dlx playwright install chromium",
            file=sys.stderr,
        )
        return []

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            for scheme, name in (("light", "light.png"), ("dark", "dark.png")):
                page = browser.new_page(viewport={"width": 1440, "height": 900})
                page.emulate_media(color_scheme=scheme)
                # Not networkidle: the scene runs a rAF loop and Vite keeps an HMR
                # socket open, so the page never idles and goto times out instead.
                page.goto(url, wait_until="load", timeout=30000)
                _settle(page)
                dest = OUT_DIR / name
                page.screenshot(path=str(dest), full_page=False)
                paths.append(dest)
                page.close()
            browser.close()
    except Exception as err:  # a capture failure must not break the stop hook
        print(f"visual capture failed: {err}", file=sys.stderr)
    return paths


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=URL)
    parser.add_argument("--cleanup", action="store_true")
    args = parser.parse_args()

    if args.cleanup:
        if OUT_DIR.exists():
            for f in OUT_DIR.glob("*.png"):
                f.unlink(missing_ok=True)
            print(f"cleaned {OUT_DIR}")
        return 0

    paths = capture(args.url)
    if not paths:
        return 1
    for p in paths:
        print(p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
