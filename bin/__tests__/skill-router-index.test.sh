#!/usr/bin/env bash
# skill-router-index.test.sh — offline verification of the `index` L0-ecosystem command
# (REVISION 2 §11). Runs the REAL command against the repo (discover_skills reads files
# only — no DB/network), asserts JSON coherence + markdown structure + that the additive
# command did NOT break the existing dispatch chain.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
R="$ROOT/skill-router.py"
pass=0
fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

# 1. `index --json` parses + counts cohere (total == skills+rules == len(items)); each item typed
tmp="$(mktemp -t sri.XXXXXX)"
trap 'rm -f "$tmp"' EXIT
python3 "$R" index --json >"$tmp" 2>/dev/null || fail "index --json exited non-zero"
python3 - "$tmp" <<'PY' || fail "index --json structure/coherence"
import json, sys
d = json.load(open(sys.argv[1]))
m, items = d["meta"], d["items"]
assert m["total"] == m["skills"] + m["rules"], "total != skills + rules"
assert len(items) == m["total"], "len(items) != total"
assert m["skills"] >= 1 and m["rules"] >= 1, "expected >=1 skill and >=1 rule"
for it in items:
    for k in ("id", "type", "pack", "priority", "description", "path"):
        assert k in it, f"item missing key {k}"
    assert it["type"] in ("skill", "rule"), "bad type"
PY
pass=$((pass + 1))

# 2. markdown form has the L0 header + both sections
md="$(python3 "$R" index 2>/dev/null)" || fail "index (markdown) exited non-zero"
printf '%s' "$md" | grep -q "L0 Ecosystem Index" || fail "markdown missing L0 header"
printf '%s' "$md" | grep -q "^## Skills" || fail "markdown missing ## Skills"
printf '%s' "$md" | grep -q "^## Rules" || fail "markdown missing ## Rules"
pass=$((pass + 1))

# 3. the additive command did NOT break dispatch: usage now lists `index`; unknown cmd still falls through.
#    (Both paths intentionally exit 1 — capture with `|| true` so pipefail doesn't mask the grep.)
usage="$(python3 "$R" 2>&1 || true)"
printf '%s' "$usage" | grep -q "skill-router.py index" || fail "usage docstring does not list 'index'"
unknown="$(python3 "$R" definitely-not-a-command 2>&1 || true)"
printf '%s' "$unknown" | grep -qi "unknown command" || fail "dispatch fallthrough broke"
pass=$((pass + 1))

# 4. offline-safe: a second run with no args to any network/DB path still succeeds
python3 "$R" index >/dev/null 2>&1 || fail "index not offline-safe"
pass=$((pass + 1))

printf 'skill-router index tests passed (%d checks)\n' "$pass"
