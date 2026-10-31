#!/usr/bin/env bash
# repomix-pack.test.sh — offline, deterministic test of the four guards + fail-soft.
# Stubs `repomix` on a temp PATH and builds throwaway owned/non-owned git repos; never
# touches the network or a real repo. Asserts REVISION-2 §9 acceptance:
# owned-only · stale/oversized rejected · fresh reused · repomix-absent fail-soft.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOL="$ROOT/repomix-pack.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkbin() {
  mkdir -p "$TMP/bin"
  cat >"$TMP/bin/repomix" <<'EOF'
#!/usr/bin/env bash
out=""; prev=""
for a in "$@"; do
  [ "$prev" = "--output" ] && out="$a"
  prev="$a"
done
[ -n "$out" ] && printf '<repomix>fake pack contents for test</repomix>\n' >"$out"
exit 0
EOF
  chmod +x "$TMP/bin/repomix"
}

mkrepo() { # mkrepo <dir> <origin-url>
  local d="$1" url="$2"
  mkdir -p "$d"
  git -C "$d" init -q
  printf 'hello\n' >"$d/README.md"
  git -C "$d" add -A
  git -C "$d" -c user.email=t@e -c user.name=t commit -q -m init
  [ -n "$url" ] && git -C "$d" remote add origin "$url"
}

mkbin
mkrepo "$TMP/owned" "https://github.com/heymegabyte/agent-skills.git"
mkrepo "$TMP/cust" "git@github.com:some-customer/thing.git"

pass=0
check() { # check <desc> <jq-filter> <json>
  if printf '%s' "$3" | jq -e "$2" >/dev/null 2>&1; then
    pass=$((pass + 1))
  else
    printf 'FAIL: %s\n  got: %s\n' "$1" "$3" >&2
    exit 1
  fi
}

# 1. OWNED repo → generated, owned=yes, pack written
rc=0
out="$(PATH="$TMP/bin:$PATH" "$TOOL" --repo="$TMP/owned" --out="$TMP/owned/pack.xml" --json 2>/dev/null)" || rc=$?
check "owned generates" '.pack.action=="generated" and .pack.owned=="yes" and .summary.exit==0' "$out"
[ "$rc" = 0 ] || { printf 'FAIL: owned exit !=0 (%s)\n' "$rc" >&2; exit 1; }
[ -s "$TMP/owned/pack.xml" ] || { printf 'FAIL: owned pack not written\n' >&2; exit 1; }
pass=$((pass + 1))

# 2. FRESH reuse → second run is idempotent (reused, not regenerated)
rc=0
out="$(PATH="$TMP/bin:$PATH" "$TOOL" --repo="$TMP/owned" --out="$TMP/owned/pack.xml" --json 2>/dev/null)" || rc=$?
check "fresh reused" '.pack.action=="reused" and .pack.reason=="fresh_within_ttl"' "$out"

# 3. NOT-OWNED repo → rejected (tenant boundary), pack NOT written
rc=0
out="$(PATH="$TMP/bin:$PATH" "$TOOL" --repo="$TMP/cust" --out="$TMP/cust/pack.xml" --json 2>/dev/null)" || rc=$?
check "not-owned rejected" '.pack.action=="rejected" and (.pack.reason|startswith("not_owned")) and .summary.exit==1' "$out"
[ "$rc" = 1 ] || { printf 'FAIL: not-owned exit !=1 (%s)\n' "$rc" >&2; exit 1; }
[ ! -f "$TMP/cust/pack.xml" ] || { printf 'FAIL: not-owned pack was written\n' >&2; exit 1; }
pass=$((pass + 1))

# 4. OVER-BUDGET → rejected, oversized pack NOT written to --out
rc=0
out="$(PATH="$TMP/bin:$PATH" "$TOOL" --repo="$TMP/owned" --out="$TMP/budget.xml" --max-tokens=1 --json 2>/dev/null)" || rc=$?
check "over-budget rejected" '.pack.action=="rejected" and (.pack.reason|startswith("over_budget")) and .summary.exit==1' "$out"
[ ! -f "$TMP/budget.xml" ] || { printf 'FAIL: over-budget pack was written\n' >&2; exit 1; }
pass=$((pass + 1))

# 5. REPOMIX ABSENT → fail-soft (never fabricates). Scrub PATH so no repomix/npx is resolvable.
rc=0
out="$(PATH="/usr/bin:/bin:/usr/sbin:/sbin" "$TOOL" --repo="$TMP/owned" --out="$TMP/absent.xml" --json 2>/dev/null)" || rc=$?
check "repomix absent fail-soft" '.pack.action=="rejected" and (.pack.reason|startswith("repomix_unavailable")) and .summary.exit==1' "$out"
[ ! -f "$TMP/absent.xml" ] || { printf 'FAIL: absent produced a pack\n' >&2; exit 1; }
pass=$((pass + 1))

# 6. ALLOW-LOCAL → a repo with no origin is permitted when opted in
mkrepo "$TMP/local" ""
rc=0
out="$(PATH="$TMP/bin:$PATH" "$TOOL" --repo="$TMP/local" --out="$TMP/local/pack.xml" --allow-local --json 2>/dev/null)" || rc=$?
check "allow-local generates owned=local" '.pack.action=="generated" and .pack.owned=="local"' "$out"

printf 'repomix-pack tests passed (%d assertions)\n' "$pass"
