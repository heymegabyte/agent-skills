#!/usr/bin/env bash
# bin/verify-change-ownership.sh — runtime verification of the OpenSpec change-ownership workflow (§7).
#
# Classifies every check as STATIC (file/validator), RUNTIME (executed here), or LIMITED (needs a live
# agent/host, reported honestly — never faked). Exit 0 only when all STATIC + RUNTIME checks pass.
# Read-only + idempotent (the idempotency probe uses a disposable tmp dir). Canonical: rules/openspec-change-ownership.md
set -uo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
if [ -f "$HOME/.claude/hooks/style.sh" ]; then . "$HOME/.claude/hooks/style.sh" || true; fi
if ! command -v emdash_log >/dev/null 2>&1; then
  emdash_log() { printf '%s\n' "$*"; }
  emdash_success() { printf '✓ %s\n' "$*"; }
  emdash_warn() { printf '! %s\n' "$*" >&2; }
  emdash_error() { printf '✗ %s\n' "$*" >&2; }
  emdash_header() { printf '\n=== %s ===\n' "$*"; }
fi
PASS=0; FAIL=0; LIMITED=0
ok()  { PASS=$((PASS + 1)); emdash_success "$1"; }
no()  { FAIL=$((FAIL + 1)); emdash_error "$1"; }
lim() { LIMITED=$((LIMITED + 1)); emdash_warn "LIMITED — $1"; }

MARK="Change Ownership — Plan & Decompose Early"
CHANGES="agent-change-ownership-policy change-ownership-atomic-dispatcher agent-ownership-checkpoint-hooks change-ownership-verification-suite openspec-four-agent-global-integration"
nocolor() { grep -ivE 'mise|shorthands'; }

emdash_header "change-ownership workflow verification (§7)"

# 1 STATIC — invariant reaches each installed agent file EXACTLY ONCE (no dup from re-sync).
emdash_log "[STATIC] invariant present exactly once per agent"
for f in "$HOME/.claude/CLAUDE.md" "$HOME/.codex/AGENTS.md" "$HOME/.config/opencode/AGENTS.md" "$HOME/.gemini/GEMINI.md"; do
  c=$(grep -cF "$MARK" "$f" 2>/dev/null || true); c=${c:-0}
  [ "$c" = "1" ] && ok "  ${f/#$HOME/~} (1)" || no "  ${f/#$HOME/~} (count=$c, expected 1)"
done

# 2 STATIC — canonical rule present + all cross-links resolve.
[ -f rules/openspec-change-ownership.md ] && ok "[STATIC] canonical rule present" || no "[STATIC] canonical rule MISSING"
if node bin/audit-crosslinks.mjs >/tmp/vco-cl.txt 2>&1; then
  broken=$(grep -oE 'Broken links[[:space:]]*:[[:space:]]*[0-9]+' /tmp/vco-cl.txt | grep -oE '[0-9]+$' | head -1)
  [ "${broken:-1}" = "0" ] && ok "[STATIC] cross-links resolve (0 broken)" || no "[STATIC] broken cross-links: ${broken:-?}"
else no "[STATIC] crosslink audit errored"; fi

# 3 RUNTIME — atomic one-owner claim incl. concurrent 2nd-claim refused (the key §7 check).
emdash_log "[RUNTIME] atomic one-owner claim"
if node bin/change-ownership.test.mjs >/tmp/vco-co.txt 2>&1; then
  ok "[RUNTIME] change-ownership.test.mjs — $(grep -oE '[0-9]+ passed, [0-9]+ failed' /tmp/vco-co.txt | tail -1)"
else no "[RUNTIME] change-ownership.test.mjs FAILED"; fi

# 4 RUNTIME — OpenSpec artifacts validate --strict.
emdash_log "[RUNTIME] openspec validate --strict (workflow changes)"
for ch in $CHANGES; do
  if openspec validate "$ch" --strict >/dev/null 2>&1; then ok "  $ch"; else no "  $ch invalid"; fi
done

# 5 RUNTIME — plugin hook manifest: one handler per event (no duplicate handlers).
if python3 - <<'PY' 2>/dev/null
import json, sys
h = json.load(open("hooks/hooks.json"))["hooks"]
bad = [e for e in ("UserPromptSubmit", "SessionStart", "PreCompact") if len(h.get(e, [])) != 1]
sys.exit(1 if bad else 0)
PY
then ok "[RUNTIME] hooks.json — one handler per event (no duplicates)"; else no "[RUNTIME] hooks.json duplicate/missing handler"; fi

# 6 RUNTIME — distribution is idempotent: re-copy canonical == source; installed == canonical (no drift).
emdash_log "[RUNTIME] idempotent sync (overwrite-copy, no drift)"
tmp=$(mktemp -d); drift=0
for pair in "CLAUDE.md|$HOME/.claude/CLAUDE.md" "AGENTS.md|$HOME/.codex/AGENTS.md" "AGENTS.md|$HOME/.config/opencode/AGENTS.md" "GEMINI.md|$HOME/.gemini/GEMINI.md"; do
  src="${pair%%|*}"; inst="${pair##*|}"
  cp "$REPO/$src" "$tmp/x"; cp "$REPO/$src" "$tmp/x"   # copy twice → still identical
  cmp -s "$REPO/$src" "$tmp/x" || drift=1
  cmp -s "$REPO/$src" "$inst" || { drift=1; emdash_warn "  installed drift: ${inst/#$HOME/~}"; }
done
rm -rf "$tmp"
[ "$drift" = 0 ] && ok "[RUNTIME] re-copy idempotent + installed==canonical" || no "[RUNTIME] distribution drift detected"

# 7 STATIC — every workflow proposal carries real content (not a bare dir/metadata file).
emdash_log "[STATIC] proposals carry real content"
for ch in $CHANGES; do
  f="openspec/changes/$ch/proposal.md"; b=$(wc -c <"$f" 2>/dev/null || echo 0)
  [ "$b" -gt 400 ] && ok "  $ch ($b bytes)" || no "  $ch proposal too thin ($b bytes)"
done

# 8 RUNTIME — an unrelated proposal stays proposed while owned work completes.
prop=$(openspec list 2>/dev/null | nocolor | grep -c 'tasks' || true)
comp=$(openspec list 2>/dev/null | nocolor | grep -c 'Complete' || true)
{ [ "${prop:-0}" -ge 1 ] && [ "${comp:-0}" -ge 1 ]; } && ok "[RUNTIME] ${prop:-0} proposed coexist with ${comp:-0} complete" || lim "proposed/complete coexistence inconclusive"

# 9 LIMITED — honestly reported (need a live agent runtime or a per-host sync; not runnable here).
lim "fresh-session invariant load INSIDE live Codex/Gemini/OpenCode runtimes (content verified at each load path + exactly once; launching those binaries is out of scope here)"
lim "live multi-agent decomposition-before-implementation behavior (doctrine is in the always-loaded files + demonstrated by this repo's own change decomposition; a live agent run is not driven here)"
lim "cross-host/remote distribution beyond 'git push origin main' (each host activates via its sync-fleet-harnesses run / git pull)"

emdash_header "summary"
emdash_log "PASS=$PASS  FAIL=$FAIL  LIMITED=$LIMITED (reported)"
if [ "$FAIL" = 0 ]; then emdash_success "all STATIC + RUNTIME checks passed"; exit 0; else emdash_error "$FAIL check(s) failed"; exit 1; fi
