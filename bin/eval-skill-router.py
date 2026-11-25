#!/usr/bin/env python3
"""Run deterministic, requirement-based routing acceptance cases."""
from __future__ import annotations

import importlib.util
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROUTER_PATH = ROOT / "bin" / "skill-router.py"
CASES_PATH = ROOT / "evals" / "router-routing-cases.json"


def load_router():
    spec = importlib.util.spec_from_file_location("skill_router_eval", ROUTER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module


def main() -> int:
    os.environ["AGENT_SKILLS_DISABLE_EMBEDDINGS"] = "1"
    router = load_router()
    router.cmd_sync_metadata(quiet=True)
    fixture = json.loads(CASES_PATH.read_text())
    failures, results = [], []
    for case in fixture["cases"]:
        first = router.cmd_route(case["prompt"], cwd=str(ROOT))
        second = router.cmd_route(case["prompt"], cwd=str(ROOT))
        selected = {row["id"]: row["reason"] for row in first["selected"]}
        missing = [item for item in case.get("required", []) if item not in selected]
        forbidden = [item for item in case.get("forbidden_trigger_matches", []) if selected.get(item) == "trigger-match"]
        deterministic = first["selected"] == second["selected"]
        row = {"id": case["id"], "missing": missing, "forbidden": forbidden, "deterministic": deterministic}
        results.append(row)
        if missing or forbidden or not deterministic:
            failures.append(row)
    print(json.dumps({"status": "fail" if failures else "pass", "cases": results}, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
