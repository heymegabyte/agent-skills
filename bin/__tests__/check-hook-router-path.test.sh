#!/usr/bin/env bash
# check-hook-router-path.test.sh — offline test of the hook→router dead-path detector (loop fire 49).
# Builds a temp HOME + hooks dir with: one GOOD invoker (resolves to a real router), one DEAD
# invoker (nonexistent path), and one reconcile-like hook (ROUTER_PATH → _router.md, no subprocess)
# that must be EXCLUDED (precision — it never runs the router binary).

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHECK="$ROOT/check-hook-router-path.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/.claude/bin" "$TMP/hooks"
printf 'def discover_skills():\n    return []\n' >"$TMP/.claude/bin/skill-router.py"

cat >"$TMP/hooks/good-router.py" <<'EOF'
import subprocess
from pathlib import Path
CLAUDE_DIR = Path.home() / ".claude"
ROUTER = CLAUDE_DIR / "bin" / "skill-router.py"
subprocess.run(["python3", str(ROUTER), "route"])
EOF
cat >"$TMP/hooks/bad-router.py" <<'EOF'
import subprocess
from pathlib import Path
CLAUDE_DIR = Path.home() / ".claude"
ROUTER = CLAUDE_DIR / "nonexistent" / "skill-router.py"
subprocess.run(["python3", str(ROUTER), "route"])
EOF
# reconcile-like: assigns ROUTER_PATH (not ROUTER), edits _router.md, never subprocesses → EXCLUDED
cat >"$TMP/hooks/reconcile.py" <<'EOF'
from pathlib import Path
PLUGIN_ROOT = Path.home() / ".claude" / "plugins" / "heymegabyte-agent-skills"
ROUTER_PATH = PLUGIN_ROOT / "_router.md"
# mentions skill-router.py in a comment but never runs it
EOF

pass=0
fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

# 1. default (report-only): exit 0, checked=2 (reconcile EXCLUDED), dead=1, good=ok, bad=dead
rc=0
out="$(HOME="$TMP" CLAUDE_HOOKS_DIR="$TMP/hooks" bash "$CHECK" --json 2>/dev/null)" || rc=$?
[ "$rc" = 0 ] || fail "default exit !=0 ($rc) — report-only must exit 0"
printf '%s' "$out" >"$TMP/o.json"
python3 - "$TMP/o.json" <<'PY' || fail "json verdict"
import json, sys
d = json.load(open(sys.argv[1]))
s = d["summary"]
assert s["checked"] == 2, f"checked={s['checked']} (reconcile.py must be excluded)"
assert s["dead"] == 1, f"dead={s['dead']}"
assert s["exit"] == 0, "default exit should be 0 (report-only)"
st = {h["hook"]: h["status"] for h in d["hooks"]}
assert st.get("good-router.py") == "ok", st
assert st.get("bad-router.py") == "dead", st
assert "reconcile.py" not in st, "reconcile.py (ROUTER_PATH, no subprocess) must NOT be checked"
PY
pass=$((pass + 1))

# 2. --strict exits 1 when a dead hook exists
rc=0
HOME="$TMP" CLAUDE_HOOKS_DIR="$TMP/hooks" bash "$CHECK" --strict >/dev/null 2>&1 || rc=$?
[ "$rc" = 1 ] || fail "--strict should exit 1 on a dead hook (got $rc)"
pass=$((pass + 1))

# 3. all-ok: remove the dead hook → --strict exits 0
rm "$TMP/hooks/bad-router.py"
rc=0
HOME="$TMP" CLAUDE_HOOKS_DIR="$TMP/hooks" bash "$CHECK" --strict >/dev/null 2>&1 || rc=$?
[ "$rc" = 0 ] || fail "--strict all-ok should exit 0 (got $rc)"
pass=$((pass + 1))

printf 'check-hook-router-path tests passed (%d checks)\n' "$pass"
