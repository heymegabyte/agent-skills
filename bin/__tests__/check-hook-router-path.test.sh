#!/usr/bin/env bash
# check-hook-router-path.test.sh — offline test of the hook→router dead-path detector (loop fire 49/50).
# Builds a temp HOME + hooks dir with: one GOOD invoker (resolves to a real router), one DEAD
# invoker (nonexistent path), and one reconcile-like hook (ROUTER_PATH → _router.md, no subprocess)
# that must be EXCLUDED (precision — it never runs the router binary). Health-check semantics:
# exit 1 when any dead hook exists, exit 0 when all resolve.

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

# 1. a DEAD hook present → exit 1 (surfaces drift); checked=2 (reconcile EXCLUDED), dead=1, good=ok, bad=dead
rc=0
out="$(HOME="$TMP" CLAUDE_HOOKS_DIR="$TMP/hooks" bash "$CHECK" --json 2>/dev/null)" || rc=$?
[ "$rc" = 1 ] || fail "dead present must exit 1 (got $rc)"
printf '%s' "$out" >"$TMP/o.json"
python3 - "$TMP/o.json" <<'PY' || fail "json verdict"
import json, sys
d = json.load(open(sys.argv[1]))
s = d["summary"]
assert s["checked"] == 2, f"checked={s['checked']} (reconcile.py must be excluded)"
assert s["dead"] == 1, f"dead={s['dead']}"
assert s["exit"] == 1, "summary.exit should be 1 when a dead hook exists"
st = {h["hook"]: h["status"] for h in d["hooks"]}
cause = {h["hook"]: h.get("cause") for h in d["hooks"]}
assert st.get("good-router.py") == "ok", st
assert st.get("bad-router.py") == "dead", st
# a plainly-missing ancestor (no symlink) → cause "missing-path" (not dangling-symlink)
assert cause.get("bad-router.py") == "missing-path", f"bad-router cause={cause.get('bad-router.py')}"
assert "reconcile.py" not in st, "reconcile.py (ROUTER_PATH, no subprocess) must NOT be checked"
PY
pass=$((pass + 1))

# 2. all-ok (remove the dead hook) → exit 0, summary.exit 0
rm "$TMP/hooks/bad-router.py"
rc=0
out="$(HOME="$TMP" CLAUDE_HOOKS_DIR="$TMP/hooks" bash "$CHECK" --json 2>/dev/null)" || rc=$?
[ "$rc" = 0 ] || fail "all-ok must exit 0 (got $rc)"
printf '%s' "$out" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["summary"]["dead"]==0 and d["summary"]["exit"]==0, d["summary"]' || fail "all-ok json verdict"
pass=$((pass + 1))

# 3. a DANGLING SYMLINK ancestor (the real fire-89 root cause: a stale `~/.claude/bin` → a
#    renamed/missing plugin dir) → status dead, cause "dangling-symlink", + a repoint fix message.
TMP2="$(mktemp -d)"
trap 'rm -rf "$TMP" "$TMP2"' EXIT
mkdir -p "$TMP2/.claude" "$TMP2/hooks"
# bin → a MISSING target (simulates heymegabyte-claude-skills/bin that no longer exists)
ln -s "$TMP2/.claude/plugins/gone/bin" "$TMP2/.claude/bin"
cat >"$TMP2/hooks/dangling-router.py" <<'EOF'
import subprocess
from pathlib import Path
CLAUDE_DIR = Path.home() / ".claude"
ROUTER = CLAUDE_DIR / "bin" / "skill-router.py"
subprocess.run(["python3", str(ROUTER), "route"])
EOF
rc=0
out="$(HOME="$TMP2" CLAUDE_HOOKS_DIR="$TMP2/hooks" bash "$CHECK" --json 2>"$TMP2/err.txt")" || rc=$?
[ "$rc" = 1 ] || fail "dangling symlink must exit 1 (got $rc)"
printf '%s' "$out" >"$TMP2/o.json"
python3 - "$TMP2/o.json" <<'PY' || fail "dangling-symlink json verdict"
import json, sys
d = json.load(open(sys.argv[1]))
assert d["summary"]["dead"] == 1, d["summary"]
h = next(x for x in d["hooks"] if x["hook"] == "dangling-router.py")
assert h["status"] == "dead", h
assert h.get("cause") == "dangling-symlink", f"cause={h.get('cause')}"
PY
# the owner-facing fix must be the REPOINT recipe (rm the stale link + ln -s the real dir), not mkdir
grep -q 'DANGLING symlink' "$TMP2/err.txt" || fail "fix message missing dangling-symlink root cause"
grep -qE 'rm .* && ln -s' "$TMP2/err.txt" || fail "fix message missing repoint (rm && ln -s) recipe"
pass=$((pass + 1))

printf 'check-hook-router-path tests passed (%d checks)\n' "$pass"
