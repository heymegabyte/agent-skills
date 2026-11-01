#!/usr/bin/env bash
# check-hook-router-path.sh — assert every hook that invokes skill-router references a path
# that RESOLVES to the real router. Catches the silent-no-op class (loop fire 48): a hook
# pointing at a NONEXISTENT `~/.claude/bin/skill-router.py` exits rc!=0 and is swallowed by the
# hook's `|| true` wrapper, so the whole skill-router INJECTION layer dies SILENTLY (no error,
# no injection, ever — wired-but-broken / config≠proof).
#
# Health check: exits 1 when any invoking hook points at a DEAD/mismatched router, 0 when all
# resolve. Designed to run as a NON-BLOCKING lint-all soft-info section (the harness never fails
# the build on an info section — the non-zero exit only flags drift so `--quiet` surfaces it); the
# LIVE fix (reviving the hooks) is OWNER-GATED (untracked global config + per-prompt blast radius).
# `--json`: uniform envelope per rules/uniform-json-output.md.
#
# Env: CLAUDE_HOOKS_DIR (default ~/.claude/hooks) · HOME (resolves CLAUDE_DIR-form paths).
#
# Usage: bash bin/check-hook-router-path.sh [--json]

set -uo pipefail

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/emit-json.sh
. "$SELF_DIR/lib/emit-json.sh"
# shellcheck source=/dev/null
[ -f "$HOME/.claude/hooks/style.sh" ] && . "$HOME/.claude/hooks/style.sh"
say() {
  if command -v emdash_log >/dev/null 2>&1; then
    emdash_log "$1" info >&2
  else
    printf '%s\n' "$1" >&2
  fi
}
say_err() {
  if command -v emdash_error >/dev/null 2>&1; then
    emdash_error "$1" >&2
  else
    printf 'error: %s\n' "$1" >&2
  fi
}

JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    *)
      say_err "unknown arg: $arg"
      exit 2
      ;;
  esac
done

HOOKS_DIR="${CLAUDE_HOOKS_DIR:-$HOME/.claude/hooks}"
PLUGIN_ROUTER="$HOME/.claude/plugins/heymegabyte-agent-skills/bin/skill-router.py"

# resolve_router_path <ROUTER-assignment-line> — echo the filesystem path the hook resolves to.
# Joins the double-quoted segments; a CLAUDE_DIR/Path.home()/.claude reference roots them at
# $HOME/.claude, else they are treated as an absolute literal. Best-effort (reports unparseable).
resolve_router_path() {
  local line="$1" segs
  segs="$(printf '%s' "$line" | grep -oE '"[^"]+"' | tr -d '"' | paste -sd/ - 2>/dev/null)"
  segs="${segs#/}"
  [ -n "$segs" ] || return 0
  case "$segs" in
    .claude | .claude/*)
      # segs already carries the `.claude` segment (e.g. Path.home()/".claude"/"bin"/…)
      printf '%s/%s' "$HOME" "$segs"
      ;;
    *)
      if printf '%s' "$line" | grep -qE 'CLAUDE_DIR|Path\.home\(\)|\.claude'; then
        printf '%s/.claude/%s' "$HOME" "$segs"
      else
        printf '/%s' "$segs"
      fi
      ;;
  esac
}

# diagnose_dead <resolved-path> — set DD_CAUSE (+ DD_SYMLINK/DD_TARGET) explaining WHY the router
# path doesn't resolve: a DANGLING SYMLINK in an ancestor (the common case — a stale `~/.claude/bin`
# left pointing at an old/renamed plugin name) vs a plainly-missing path. Drives the correct fix.
DD_CAUSE=""
DD_SYMLINK=""
DD_TARGET=""
diagnose_dead() {
  local d
  DD_CAUSE="missing-path"
  DD_SYMLINK=""
  DD_TARGET=""
  d="$(dirname "$1")"
  while [ -n "$d" ] && [ "$d" != "/" ] && [ "$d" != "." ]; do
    if [ -L "$d" ] && [ ! -e "$d" ]; then
      DD_CAUSE="dangling-symlink"
      DD_SYMLINK="$d"
      DD_TARGET="$(readlink "$d")"
      return 0
    fi
    d="$(dirname "$d")"
  done
}

checked=0
dead=0
hooks_json=""
first=1
fix_symlink=""
fix_target=""
for hook in "$HOOKS_DIR"/*.py; do
  [ -f "$hook" ] || continue
  # in-scope = a module-level `ROUTER =` assignment that is INVOKED via subprocess (the router
  # hooks). Excludes files that merely mention the router or assign a different ROUTER_* (e.g. the
  # reconcile hook's `ROUTER_PATH = … / "_router.md"`, which edits the map, never runs the binary).
  grep -qE '^ROUTER[[:space:]]*=' "$hook" || continue
  grep -qE 'subprocess|Popen|check_output|\.run\(' "$hook" || continue
  checked=$((checked + 1))
  name="$(basename "$hook")"
  line="$(grep -m1 -E '^ROUTER[[:space:]]*=' "$hook" || true)"
  resolved=""
  cause=""
  if [ -z "$line" ]; then
    status="no-router-assign"
  else
    resolved="$(resolve_router_path "$line")"
    if [ -z "$resolved" ]; then
      status="unparseable"
    elif [ ! -e "$resolved" ]; then
      status="dead"
      dead=$((dead + 1))
      diagnose_dead "$resolved"
      cause="$DD_CAUSE"
      if [ -n "$DD_SYMLINK" ] && [ -z "$fix_symlink" ]; then
        fix_symlink="$DD_SYMLINK"
        fix_target="$DD_TARGET"
      fi
    elif grep -q 'def discover_skills' "$resolved" 2>/dev/null; then
      status="ok"
    else
      status="exists-not-router"
      cause="wrong-file"
      dead=$((dead + 1))
    fi
  fi
  say "$name → ${resolved:-<no ROUTER=>} [$status${cause:+ · $cause}]"
  [ "$first" = 1 ] || hooks_json="$hooks_json,"
  first=0
  hooks_json="$hooks_json{$(emit_kv_string hook "$name"),$(emit_kv_string router_path "$resolved"),$(emit_kv_string status "$status"),$(emit_kv_string cause "$cause")}"
done

code=0
[ "$dead" -gt 0 ] && code=1

if [ "$JSON" = 1 ]; then
  ts="$(emit_iso_ts)"
  sha="$(emit_git_sha "$SELF_DIR/..")"
  printf '{%s,"hooks":[%s],"summary":{%s,%s,%s}}\n' \
    "$(emit_meta_block "$HOOKS_DIR" "$ts" "$sha")" \
    "$hooks_json" \
    "$(emit_kv_int checked "$checked")" "$(emit_kv_int dead "$dead")" "$(emit_kv_int exit "$code")"
fi

if [ "$dead" -gt 0 ]; then
  say_err "$dead/$checked skill-router hook(s) reference a DEAD/mismatched router → injection silently no-ops."
  if [ -n "$fix_symlink" ]; then
    say_err "Root cause: \"$fix_symlink\" is a DANGLING symlink → \"$fix_target\" (missing). The real router is in $SELF_DIR."
    say_err "Fix (owner-gated — global live config): rm \"$fix_symlink\" && ln -s \"$SELF_DIR\" \"$fix_symlink\""
  else
    say_err "Fix (owner-gated — global live config): mkdir -p \"$HOME/.claude/bin\" && ln -s \"$PLUGIN_ROUTER\" \"$HOME/.claude/bin/skill-router.py\""
  fi
elif [ "$checked" -gt 0 ]; then
  say "all $checked skill-router hook(s) resolve to the real router ✓"
else
  say "no skill-router hooks found in $HOOKS_DIR"
fi
exit "$code"
