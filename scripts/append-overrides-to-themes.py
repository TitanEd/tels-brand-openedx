#!/usr/bin/env python3
"""Append brand component overrides from core.css onto light.css / dark.css.

MFEs load variant brandOverride CSS; overrides compiled via core.scss must also
ship on light/dark or Gradebook forms/selects never pick them up.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"

# First shared container rule from paragon/overrides/_layout.scss
MARKER = ".container,\n.container-fluid"


def extract_overrides(core_css: str) -> str:
    start = core_css.find(MARKER)
    if start < 0:
        start = core_css.find(".container,")
    if start < 0:
        raise SystemExit("Could not find override block in dist/core.css")
    block = core_css[start:]
    # Drop accidental raw SCSS source if a prior build corrupted the file
    junk = block.find("\n// Assembled by")
    if junk >= 0:
        block = block[:junk]
    junk2 = block.find("\n@import ")
    if junk2 >= 0:
        block = block[:junk2]
    return block.strip() + "\n"


def append_to(path: Path, block: str) -> None:
    text = path.read_text()
    banner = "\n\n/* === TitanEd brand component overrides (from core) === */\n"
    if "TitanEd brand component overrides" in text:
        # Replace previous append
        idx = text.find("/* === TitanEd brand component overrides")
        text = text[:idx].rstrip() + "\n"
    path.write_text(text + banner + block)
    print(f"appended overrides → {path.name} (+{len(block)} bytes)")


def minify_like(src: Path, dest: Path) -> None:
    """Very small minify: drop comments/newlines for .min.css companions."""
    import re

    css = src.read_text()
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{}:;,])\s*", r"\1", css)
    dest.write_text(css.strip() + "\n")
    print(f"rewrote {dest.name}")


def main() -> None:
    core = (DIST / "core.css").read_text()
    block = extract_overrides(core)
    # Keep core clean if SCSS source leaked into it
    if "\n// Assembled by" in core:
        clean = core[: core.find("\n// Assembled by")].rstrip() + "\n"
        (DIST / "core.css").write_text(clean)
        print("cleaned leaked SCSS source from core.css")
    for name in ("light.css", "dark.css"):
        append_to(DIST / name, block)
    for pair in (("light.css", "light.min.css"), ("dark.css", "dark.min.css"), ("core.css", "core.min.css")):
        minify_like(DIST / pair[0], DIST / pair[1])


if __name__ == "__main__":
    main()
