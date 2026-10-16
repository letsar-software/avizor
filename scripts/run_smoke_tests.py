#!/usr/bin/env python3
"""Run every Playwright smoke test under scripts/ against AVIZOR_BASE_URL.

GitHub Actions points all historical scripts (each hardcoded to a different
local port) at a single CI server by rewriting localhost URLs before execution.
Any non-zero exit fails the process so the CI job goes red.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPTS_DIR.parent
BASE_URL = os.environ.get("AVIZOR_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
URL_PATTERN = re.compile(r"https?://(?:localhost|127\.0\.0\.1):\d+")
ARGV_SCRIPTS = {"phenology_handoff_visual.py", "results_ux_smoke.py"}


def discover_scripts() -> list[Path]:
    return sorted(path for path in SCRIPTS_DIR.glob("*.py") if path.name != Path(__file__).name)


def rewritten_source(path: Path) -> str:
    base = os.environ.get("AVIZOR_BASE_URL", BASE_URL).rstrip("/")
    return URL_PATTERN.sub(base, path.read_text(encoding="utf-8"))


def run_script(path: Path, env: dict[str, str]) -> int:
    source = rewritten_source(path)
    extra_args = [BASE_URL] if path.name in ARGV_SCRIPTS else []
    with tempfile.NamedTemporaryFile("w", suffix=f"-{path.name}", delete=False, encoding="utf-8") as tmp:
        tmp.write(source)
        tmp_path = tmp.name
    try:
        return subprocess.run([sys.executable, tmp_path, *extra_args], cwd=str(REPO_ROOT), env=env).returncode
    finally:
        Path(tmp_path).unlink(missing_ok=True)


def main() -> int:
    scripts = discover_scripts()
    if not scripts:
        print("No se encontraron smoke tests en scripts/", file=sys.stderr)
        return 1

    Path("screenshots").mkdir(exist_ok=True)
    Path("docs/screenshots").mkdir(parents=True, exist_ok=True)

    env = os.environ.copy()
    env["AVIZOR_BASE_URL"] = BASE_URL
    env.setdefault("CI", "true")
    env["PYTHONUNBUFFERED"] = "1"

    print(f"AVIZOR_BASE_URL={BASE_URL}")
    print(f"Running {len(scripts)} smoke tests")

    failed: list[str] = []
    for script in scripts:
        print(f"\n==> {script.name}", flush=True)
        code = run_script(script, env)
        if code != 0:
            failed.append(script.name)
            print(f"FAIL {script.name} (exit {code})", flush=True)
        else:
            print(f"PASS {script.name}", flush=True)

    if failed:
        print("\nSmoke tests failed: " + ", ".join(failed), file=sys.stderr)
        return 1

    print(f"\nAll {len(scripts)} smoke tests passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
