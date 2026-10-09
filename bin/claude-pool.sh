#!/usr/bin/env bash
#
# claude-pool.sh — pool N Claude Code subscription SEATS (e.g. 3× Max 20x) behind one
# launcher, with least-recently-used selection + auto-failover when a seat hits its
# 5-hour / weekly cap. This is the missing primitive under an OpenClaw-style swarm: it lets
# the orchestrator (or the research/dispatch router) spawn many Claude Code agents in
# parallel and spread them across the seats you own without any account ever colliding.
#
# HOW IT WORKS (the proven mechanism — jonroosevelt.com multi-account load balancer):
#   Claude Code reads ALL of its state — credentials, settings, skills, projects — from the
#   directory named by $CLAUDE_CONFIG_DIR. We give each seat its OWN config dir under the pool
#   root; only `.credentials.json` is seat-local, while settings/CLAUDE.md/skills/hooks/agents/
#   commands are SYMLINKED back to your canonical ~/.claude so every seat shares one brain.
#   Pinning CLAUDE_CONFIG_DIR per launch = one terminal per account, zero global-state mutation.
#
# SUBSCRIPTION SAFETY (rules/agent-provider-policy.md — hard):
#   Every launch goes through `with-subscription-cli.sh claude`, which strips ANTHROPIC_API_KEY
#   / ANTHROPIC_AUTH_TOKEN from the child so billing stays on the Max SUBSCRIPTION. Setting any
#   of ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN / apiKeyHelper silently DISABLES the subscription
#   — this script never sets them and warns if your env leaks one.
#
# Subcommands:
#   init [--seats N]                 scaffold N seat config dirs + shared-config symlinks (+login steps)
#   status                           gum table: each seat's auth + available/limited + last-used
#   list                             machine-readable: one "<seat>\t<config-dir>" per line (stdout)
#   pick                             echo the best available seat's CLAUDE_CONFIG_DIR (stdout); exit 3 if all capped
#   run [--dry-run] -- <claude args> launch claude on the best seat; on a rate-limit, fail over to the next
#   mark-limited <seat> [ttl_sec]    mark a seat capped (default 5h) so pick/run skip it until it resets
#   reset <seat|--all>               clear a seat's limited state
#
# Env: CLAUDE_POOL_DIR (default ~/.claude-pool) · CLAUDE_HOME (canonical source, default ~/.claude)
# Exit: 0 ok · 2 usage · 3 all seats capped/unavailable · * child exit passed through.

set -uo pipefail

# ---------------------------------------------------------------------------- styling
# shellcheck disable=SC1091
if [ -f "${HOME}/.claude/hooks/style.sh" ]; then source "${HOME}/.claude/hooks/style.sh"; fi
if ! command -v emdash_header >/dev/null 2>&1; then
  emdash_header() { printf '\n== %s ==\n' "$*" >&2; }
  emdash_log() { printf '  %s\n' "$1" >&2; }
  emdash_success() { printf '  [ok] %s\n' "$*" >&2; }
  emdash_warn() { printf '  [warn] %s\n' "$*" >&2; }
  emdash_info() { printf '  [i] %s\n' "$*" >&2; }
  emdash_error() { printf '  [err] %s\n' "$*" >&2; }
fi
HAS_GUM=0
command -v gum >/dev/null 2>&1 && HAS_GUM=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
POOL="${CLAUDE_POOL_DIR:-${HOME}/.claude-pool}"
CLAUDE_HOME="${CLAUDE_HOME:-${HOME}/.claude}"
STATE="${POOL}/.state"
DEFAULT_LIMIT_TTL=18000 # 5h — the Max rolling window
# Config items shared across every seat (symlinked); .credentials.json stays seat-local.
SHARED_ITEMS=(settings.json CLAUDE.md skills hooks agents commands output-styles plugins)

now_epoch() { date +%s 2>/dev/null || printf '0'; }
seat_dirs() { find "$POOL" -maxdepth 1 -type d -name 'seat-*' 2>/dev/null | sort; }
seat_name() { basename "$1"; }
cred_file() { printf '%s/.credentials.json' "$1"; }
is_authed() { [ -s "$(cred_file "$1")" ]; }
state_file() { printf '%s/%s.limited' "$STATE" "$(seat_name "$1")"; }
lastused_file() { printf '%s/%s.lastused' "$STATE" "$(seat_name "$1")"; }

limited_until() {
  local f
  f="$(state_file "$1")"
  [ -f "$f" ] && cat "$f" 2>/dev/null || printf '0'
}
is_limited() { [ "$(limited_until "$1")" -gt "$(now_epoch)" ] 2>/dev/null; }
last_used() {
  local f
  f="$(lastused_file "$1")"
  [ -f "$f" ] && cat "$f" 2>/dev/null || printf '0'
}
touch_used() {
  mkdir -p "$STATE"
  now_epoch >"$(lastused_file "$1")"
}

warn_env_leak() {
  for v in ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN; do
    if [ -n "${!v:-}" ]; then emdash_warn "${v} is set in your shell — it would OVERRIDE the subscription + bill the API. with-subscription-cli.sh strips it from the child, but unset it globally to be safe."; fi
  done
}

# Pick the best seat: authed, not currently limited, least-recently-used. Echoes the dir, or "".
pick_seat() {
  local best="" best_used="" u
  while IFS= read -r d; do
    [ -n "$d" ] || continue
    is_authed "$d" || continue
    is_limited "$d" && continue
    u="$(last_used "$d")"
    if [ -z "$best" ] || [ "$u" -lt "$best_used" ]; then
      best="$d"
      best_used="$u"
    fi
  done < <(seat_dirs)
  printf '%s' "$best"
}

# ---------------------------------------------------------------------------- args
cmd="${1:-}"
shift || true

case "$cmd" in
  init)
    seats=3
    [ "${1:-}" = "--seats" ] && { seats="${2:-3}"; }
    emdash_header "◆ claude-pool init — ${seats} seat(s)"
    warn_env_leak
    [ -d "$CLAUDE_HOME" ] || emdash_warn "canonical CLAUDE_HOME ${CLAUDE_HOME} not found — symlinks will be skipped"
    mkdir -p "$STATE"
    i=1
    while [ "$i" -le "$seats" ]; do
      seat="${POOL}/seat-${i}"
      mkdir -p "$seat"
      for item in "${SHARED_ITEMS[@]}"; do
        if [ -e "${CLAUDE_HOME}/${item}" ]; then ln -sfn "${CLAUDE_HOME}/${item}" "${seat}/${item}"; fi
      done
      if is_authed "$seat"; then
        emdash_success "seat-${i}: ready (authed) → ${seat}"
      else
        emdash_info "seat-${i}: scaffolded (NOT yet authed) → ${seat}"
        emdash_log "   login this seat:  CLAUDE_CONFIG_DIR=${seat} claude  (then /login with Max subscription #${i})"
      fi
      i=$((i + 1))
    done
    emdash_log "shared config symlinked from ${CLAUDE_HOME}; only .credentials.json is per-seat."
    emdash_success "pool root: ${POOL} — run 'claude-pool.sh status' to see auth state."
    ;;

  status)
    emdash_header "◆ claude-pool status"
    warn_env_leak
    rows=""
    now="$(now_epoch)"
    while IFS= read -r d; do
      [ -n "$d" ] || continue
      nm="$(seat_name "$d")"
      if ! is_authed "$d"; then
        st="needs-login"
        detail="run: CLAUDE_CONFIG_DIR=$d claude /login"
      elif is_limited "$d"; then
        lu="$(limited_until "$d")"
        st="CAPPED"
        detail="resets in $(((lu - now) / 60))m"
      else
        st="available"
        detail="idle $((($now - $(last_used "$d")) / 60))m"
      fi
      rows+="${nm}\t${st}\t${detail}\t${d}\n"
    done < <(seat_dirs)
    [ -n "$rows" ] || {
      emdash_warn "no seats — run 'claude-pool.sh init --seats 3'"
      exit 0
    }
    if [ "$HAS_GUM" = "1" ]; then
      {
        printf 'seat\tstate\tdetail\tconfig-dir\n'
        printf '%b' "$rows"
      } | gum table --print --separator $'\t' --widths 8,12,16,44 >&2
    else
      printf 'seat\tstate\tdetail\tconfig-dir\n%b' "$rows" >&2
    fi
    avail="$(pick_seat)"
    [ -n "$avail" ] && emdash_success "next pick → $(seat_name "$avail")" || emdash_warn "all seats capped or unauthed"
    ;;

  list)
    while IFS= read -r d; do [ -n "$d" ] && printf '%s\t%s\n' "$(seat_name "$d")" "$d"; done < <(seat_dirs)
    ;;

  pick)
    seat="$(pick_seat)"
    if [ -z "$seat" ]; then
      emdash_warn "no available seat (all capped/unauthed) — degrade routine work to DeepSeek/OpenCode"
      exit 3
    fi
    emdash_info "picked $(seat_name "$seat")"
    printf '%s\n' "$seat" # machine-readable: the CLAUDE_CONFIG_DIR
    ;;

  run)
    dry=0
    [ "${1:-}" = "--dry-run" ] && {
      dry=1
      shift
    }
    [ "${1:-}" = "--" ] && shift
    [ "$#" -gt 0 ] || {
      emdash_error "run: pass claude args after --, e.g. run -- -p 'fix the bug'"
      exit 2
    }
    warn_env_leak
    sub="${SCRIPT_DIR}/with-subscription-cli.sh"
    tried=0
    total="$(seat_dirs | grep -c . || printf '0')"
    while :; do
      seat="$(pick_seat)"
      if [ -z "$seat" ]; then
        emdash_error "all ${total} seat(s) capped/unauthed — no Claude capacity. Degrade to DeepSeek/OpenCode or wait for reset."
        exit 3
      fi
      tried=$((tried + 1))
      emdash_info "▶ launching claude on $(seat_name "$seat") (attempt ${tried}) — subscription-billed, API keys stripped"
      touch_used "$seat"
      if [ "$dry" = "1" ]; then
        emdash_log "DRY-RUN: CLAUDE_CONFIG_DIR=${seat} ${sub} claude $*"
        exit 0
      fi
      cap="$(mktemp)"
      CLAUDE_CONFIG_DIR="$seat" "$sub" claude "$@" 2> >(tee "$cap" >&2)
      rc=$?
      if [ "$rc" -ne 0 ] && grep -qiE 'rate.?limit|usage limit|limit reached|429|exceeded your|too many requests' "$cap"; then
        rm -f "$cap"
        emdash_warn "$(seat_name "$seat") hit its cap — marking limited (${DEFAULT_LIMIT_TTL}s) and failing over"
        printf '%s' "$(($(now_epoch) + DEFAULT_LIMIT_TTL))" >"$(state_file "$seat")"
        [ "$tried" -ge "$total" ] && {
          emdash_error "every seat capped this round"
          exit 3
        }
        continue
      fi
      rm -f "$cap"
      exit "$rc"
    done
    ;;

  mark-limited)
    seat="${1:-}"
    ttl="${2:-$DEFAULT_LIMIT_TTL}"
    [ -n "$seat" ] || {
      emdash_error "mark-limited <seat> [ttl_sec]"
      exit 2
    }
    [ -d "$seat" ] || seat="${POOL}/${seat}"
    mkdir -p "$STATE"
    printf '%s' "$(($(now_epoch) + ttl))" >"$(state_file "$seat")"
    emdash_warn "$(seat_name "$seat") marked capped for $((ttl / 60))m"
    ;;

  reset)
    if [ "${1:-}" = "--all" ]; then
      rm -f "$STATE"/*.limited 2>/dev/null
      emdash_success "cleared limited state on all seats"
    else
      seat="${1:-}"
      [ -n "$seat" ] || {
        emdash_error "reset <seat|--all>"
        exit 2
      }
      [ -d "$seat" ] || seat="${POOL}/${seat}"
      rm -f "$(state_file "$seat")"
      emdash_success "$(seat_name "$seat") reset"
    fi
    ;;

  *)
    emdash_header "claude-pool"
    emdash_log "subcommands: init · status · list · pick · run · mark-limited · reset"
    emdash_log "pools N Claude Max seats via CLAUDE_CONFIG_DIR + failover. Doctrine: rules/agent-provider-policy.md."
    [ -n "$cmd" ] && {
      emdash_error "unknown subcommand: ${cmd}"
      exit 2
    }
    ;;
esac
