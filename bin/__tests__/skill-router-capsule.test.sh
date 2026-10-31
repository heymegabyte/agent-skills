#!/usr/bin/env bash
# skill-router-capsule.test.sh — offline verification of the L1 `capsule` command (REVISION 2 §11).
# Runs the REAL command against the repo (discover_skills reads files only — no DB/network); proves
# the body→capsule token reduction, structure, rule-id resolution, and that the additive command did
# not break the dispatch chain.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
R="$ROOT/skill-router.py"
pass=0
fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

# 1. capsule for a large skill: structure + a SUBSTANTIAL body→capsule reduction (prove the L1 win)
tmp="$(mktemp -t src.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
python3 "$R" capsule 07-quality-and-verification --json >"$tmp" 2>/dev/null || fail "capsule --json exited non-zero"
python3 - "$tmp" <<'PY' || fail "capsule structure/reduction"
import json, sys
d = json.load(open(sys.argv[1]))
assert d["id"] == "07-quality-and-verification", "wrong id"
assert d["body_tokens"] > d["capsule_tokens"], "capsule not smaller than body"
assert d["reduction_pct"] >= 50, f"reduction only {d['reduction_pct']}% (<50)"
cap = d["capsule"]
assert cap.startswith("## 07-quality-and-verification"), "capsule missing id header"
assert "Sections:" in cap, "capsule missing Sections outline"
PY
pass=$((pass + 1))

# 2. markdown form prints the capsule outline (not a full body dump)
md="$(python3 "$R" capsule 07-quality-and-verification 2>/dev/null)" || fail "capsule markdown exited non-zero"
printf '%s' "$md" | grep -q "^## 07-quality-and-verification" || fail "markdown missing id header"
printf '%s' "$md" | grep -q "^Sections:" || fail "markdown missing Sections"
pass=$((pass + 1))

# 3. a rule id resolves both bare and prefixed
python3 "$R" capsule verification-loop --json >/dev/null 2>&1 || fail "bare rule id did not resolve"
python3 "$R" capsule rules/verification-loop --json >/dev/null 2>&1 || fail "prefixed rule id did not resolve"
pass=$((pass + 1))

# 4. unknown id → exit 1; dispatch intact (usage lists capsule)
rc=0
python3 "$R" capsule totally-not-a-skill-xyz >/dev/null 2>&1 || rc=$?
[ "$rc" = 1 ] || fail "unknown id did not exit 1 (got $rc)"
usage="$(python3 "$R" 2>&1 || true)"
printf '%s' "$usage" | grep -q "skill-router.py capsule" || fail "usage docstring does not list 'capsule'"
pass=$((pass + 1))

printf 'skill-router capsule tests passed (%d checks)\n' "$pass"
