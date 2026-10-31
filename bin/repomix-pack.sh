#!/usr/bin/env bash
# repomix-pack.sh — owned-only Repomix context-pack wrapper (REVISION 2 §9 / §22 retrieval).
# Per rules/tool-design-as-api.md + rules/uniform-json-output.md + the converge-agent-ecosystem
# deliverable "Repomix owned-only wrapper (freshness/redaction/token-budget)". Supports the
# REVISION-2 acceptance scenario: "stale/oversized context pack rejected/regenerated".
#
# Generates a Repomix context pack of an OWNED repo, behind four guards so an agent never
# packs a customer/arbitrary repo, never ships an over-budget pack, and never regenerates a
# still-fresh one:
#   1. OWNED-REPO guard (tenant boundary) — the repo's `origin` owner MUST be in OWNED_ORGS;
#      a non-owned or origin-less repo is rejected (override with --allow-local for a local repo).
#   2. FRESHNESS guard — reuse an existing pack newer than HEAD and within --ttl-min; else regenerate.
#   3. TOKEN-BUDGET guard — an oversized pack (> --max-tokens) is REJECTED, never written to --out.
#   4. REDACTION — Repomix's built-in Secretlint security check is kept ON (never disabled) +
#      any `.repomixignore` is honored; secrets are not packed.
#
# Fail-soft: if repomix is unavailable (not on PATH and --allow-npx not given) it emits a clear
# error and NEVER fabricates a pack. Idempotent: a re-run within the TTL is a no-op (reused).
#
# Usage:
#   bash bin/repomix-pack.sh [--repo=PATH] [--out=FILE] [--max-tokens=N] [--ttl-min=N]
#                            [--force] [--allow-local] [--allow-npx] [--json] [--dry-run]
#
# --repo=PATH     target repo (default: current dir)
# --out=FILE      pack output path (default: <repo>/.repomix-pack.xml)
# --max-tokens=N  token budget; a pack over this is rejected (default 200000)
# --ttl-min=N     freshness window in minutes (default 60)
# --force         regenerate even if a fresh pack exists
# --allow-local   permit a repo with no `origin` remote (treated as owned-local)
# --allow-npx     if repomix is not on PATH, invoke it via `npx --yes repomix`
# --json          uniform JSON envelope on stdout per rules/uniform-json-output.md
# --dry-run       plan only; never invoke repomix or write a pack
#
# OWNED_ORGS (env) overrides the owned-org allowlist (space-separated, lowercased).

set -uo pipefail

SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/emit-json.sh
. "$SELF_DIR/lib/emit-json.sh"

# Human output → ALWAYS stderr (keeps stdout pure JSON per rules/uniform-json-output.md).
# Prefer the estate gum styling when present; the `>&2` redirect normalizes its stream to stderr
# regardless of whether gum writes to stdout.
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
DRY_RUN=0
FORCE=0
ALLOW_LOCAL=0
ALLOW_NPX=0
REPO="."
OUT=""
MAX_TOKENS=200000
TTL_MIN=60
OWNED_ORGS="${OWNED_ORGS:-heymegabyte megabytelabs megabyte-labs megabytespace}"

for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --force) FORCE=1 ;;
    --allow-local) ALLOW_LOCAL=1 ;;
    --allow-npx) ALLOW_NPX=1 ;;
    --repo=*) REPO="${arg#--repo=}" ;;
    --out=*) OUT="${arg#--out=}" ;;
    --max-tokens=*) MAX_TOKENS="${arg#--max-tokens=}" ;;
    --ttl-min=*) TTL_MIN="${arg#--ttl-min=}" ;;
    --help | -h)
      sed -n '2,38p' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    *)
      say_err "unknown arg: $arg"
      exit 2
      ;;
  esac
done

# owner_from_remote <git-remote-url> — echo the lowercased owner/org, or nothing.
# Handles https://host/OWNER/repo(.git) and git@host:OWNER/repo(.git).
owner_from_remote() {
  local url="$1" path owner
  url="${url%.git}"
  case "$url" in
    *://*) path="${url#*://}" path="${path#*/}" ;; # strip scheme + host
    *:*) path="${url#*:}" ;;                       # scp-like host:OWNER/repo
    *) path="$url" ;;
  esac
  owner="${path%%/*}"
  printf '%s' "$(printf '%s' "$owner" | tr '[:upper:]' '[:lower:]')"
}

# is_owned <owner> — 0 if owner is in the OWNED_ORGS allowlist, else 1.
is_owned() {
  local owner="$1" o
  [ -n "$owner" ] || return 1
  for o in $OWNED_ORGS; do
    [ "$owner" = "$o" ] && return 0
  done
  return 1
}

# estimate_tokens <file> — conservative token estimate (bytes/4), version-independent.
estimate_tokens() {
  local bytes
  bytes="$(wc -c <"$1" 2>/dev/null | tr -d ' ')"
  [ -n "$bytes" ] || bytes=0
  printf '%d' "$(((bytes + 3) / 4))"
}

# file_mtime <file> — epoch mtime (BSD or GNU stat).
file_mtime() {
  stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null || printf '0'
}

# pack_is_fresh <out> <repo> <ttl_min> — 0 if OUT exists, is at least as new as HEAD, and within TTL.
pack_is_fresh() {
  local out="$1" repo="$2" ttl_min="$3" head_epoch out_mtime now age
  [ -f "$out" ] || return 1
  head_epoch="$(git -C "$repo" log -1 --format=%ct 2>/dev/null || printf '0')"
  out_mtime="$(file_mtime "$out")"
  now="$(date +%s)"
  age=$((now - out_mtime))
  [ "$out_mtime" -ge "$head_epoch" ] || return 1
  [ "$age" -lt $((ttl_min * 60)) ] || return 1
  return 0
}

# emit <action> <reason> <token_count> <out> <owned> <exit>
emit() {
  local action="$1" reason="$2" tok="$3" out="$4" owned="$5" code="$6" ts sha
  ts="$(emit_iso_ts)"
  sha="$(emit_git_sha "$REPO")"
  if [ "$JSON" = 1 ]; then
    printf '{%s,"pack":{' "$(emit_meta_block "$REPO" "$ts" "$sha" "$REPO")"
    printf '%s,' "$(emit_kv_string "action" "$action")"
    printf '%s,' "$(emit_kv_string "reason" "$reason")"
    printf '%s,' "$(emit_kv_string "out" "$out")"
    printf '%s,' "$(emit_kv_string "owned" "$owned")"
    printf '%s,' "$(emit_kv_int "token_count" "$tok")"
    printf '%s,' "$(emit_kv_int "max_tokens" "$MAX_TOKENS")"
    printf '%s' "$(emit_kv_int "ttl_min" "$TTL_MIN")"
    printf '},"summary":{%s}}\n' "$(emit_kv_int "exit" "$code")"
  fi
  return 0
}

fail() {
  local action="$1" reason="$2"
  emit "$action" "$reason" 0 "" "" 1
  say_err "$reason"
  exit 1
}

# 1. target must be a git repo
if ! git -C "$REPO" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  fail "rejected" "not_a_repo: $REPO is not a git work tree"
fi
REPO="$(cd "$REPO" && git rev-parse --show-toplevel)"
[ -n "$OUT" ] || OUT="$REPO/.repomix-pack.xml"

# 2. OWNED-REPO guard (tenant boundary)
ORIGIN="$(git -C "$REPO" remote get-url origin 2>/dev/null || printf '')"
OWNED="no"
if [ -z "$ORIGIN" ]; then
  if [ "$ALLOW_LOCAL" = 1 ]; then
    OWNED="local"
  else
    fail "rejected" "no_origin: repo has no 'origin' remote — pass --allow-local to pack a local repo"
  fi
else
  OWNER="$(owner_from_remote "$ORIGIN")"
  if is_owned "$OWNER"; then
    OWNED="yes"
  else
    fail "rejected" "not_owned: origin owner '$OWNER' not in OWNED_ORGS ($OWNED_ORGS)"
  fi
fi

# 3. FRESHNESS guard
if [ "$FORCE" != 1 ] && pack_is_fresh "$OUT" "$REPO" "$TTL_MIN"; then
  TOK="$(estimate_tokens "$OUT")"
  emit "reused" "fresh_within_ttl" "$TOK" "$OUT" "$OWNED" 0
  say "reused fresh pack ($TOK tok): $OUT"
  exit 0
fi

# 4. resolve a repomix runner (soft — RUN stays empty if unavailable)
RUN=()
if command -v repomix >/dev/null 2>&1; then
  RUN=(repomix)
elif [ "$ALLOW_NPX" = 1 ] && command -v npx >/dev/null 2>&1; then
  RUN=(npx --yes repomix)
fi

# 5. dry-run plans only — never requires repomix, never writes a pack
if [ "$DRY_RUN" = 1 ]; then
  if [ "${#RUN[@]}" -gt 0 ]; then
    runner="${RUN[*]}"
  else
    runner="unavailable (pass --allow-npx)"
  fi
  emit "planned" "dry_run" 0 "$OUT" "$OWNED" 0
  say "dry-run: would generate $OUT via '$runner' (owned=$OWNED, budget=$MAX_TOKENS tok)"
  exit 0
fi

# 6. a real run requires a runner (fail-soft — never fabricate a pack)
if [ "${#RUN[@]}" -eq 0 ]; then
  fail "rejected" "repomix_unavailable: repomix not on PATH (pass --allow-npx to use 'npx --yes repomix')"
fi

# 7. generate to a temp file (REDACTION: Secretlint security check stays ON — never --no-security-check)
TMP_OUT="$(mktemp -t repomix-pack.XXXXXX)"
trap 'rm -f "$TMP_OUT"' EXIT
if ! "${RUN[@]}" "$REPO" --output "$TMP_OUT" >/dev/null 2>&1; then
  fail "rejected" "generate_failed: repomix exited non-zero"
fi
if [ ! -s "$TMP_OUT" ]; then
  fail "rejected" "generate_failed: empty pack produced"
fi

# 8. TOKEN-BUDGET guard — an oversized pack is rejected, never written to --out
TOK="$(estimate_tokens "$TMP_OUT")"
if [ "$TOK" -gt "$MAX_TOKENS" ]; then
  rm -f "$TMP_OUT"
  trap - EXIT
  fail "rejected" "over_budget: pack ~$TOK tok exceeds --max-tokens=$MAX_TOKENS"
fi

# 9. commit the pack
mv "$TMP_OUT" "$OUT"
trap - EXIT
emit "generated" "ok" "$TOK" "$OUT" "$OWNED" 0
say "generated pack ($TOK tok, budget $MAX_TOKENS): $OUT"
exit 0
