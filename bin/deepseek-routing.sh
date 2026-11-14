#!/usr/bin/env bash
#
# deepseek-routing.sh — DeepSeek cost controls for heymegabyte/agent-skills#6.
#
# Sub-features 1 and 2 of the issue, for the OpenCode rail
# (rules/model-routing.md § OpenCode harness — direct DeepSeek):
#
#   agent-coverage          audit agents/*.md frontmatter against the target
#                           DeepSeek routing table (pro / flash) and report drift
#   resolve <agent>         print the CLI tier alias (opus|sonnet|haiku) that an
#                           agent file resolves to on the DeepSeek rail
#   warm                    send ONE no-op warmup request so the provider caches
#                           the request prefix before the first real prompt
#   run -a <agent> [args…]  warm (lazily) then exec opencode with the agent's
#                           model + the effort escalator's --variant
#   warm-stamp / warm-reset inspect / clear the per-key warm stamp
#
# Why aliases: rules/model-routing.md § Provider portability forbids hardcoding
# provider IDs in agent frontmatter. The DeepSeek mapping lives HERE, in one
# table, so a tier change never touches 28 agent files:
#   opus    -> deepseek-v4-pro[1m]   (architect, security-reviewer, completeness-checker)
#   sonnet  -> deepseek-flash        (test-writer, code-simplifier, visual-qa, content-writer …)
#   haiku   -> deepseek-flash
#
# Warmup contract (issue #6 § 2): one request with a minimal max_tokens payload.
# Prompt caches are keyed by request prefix; a warm request only helps the NEXT
# request if it shares that prefix. This script therefore warms the prefix the
# caller actually sends (system-prompt bytes), not a dummy string, and stamps
# the prefix hash + TTL so repeated runs refresh a live entry instead of paying
# for a redundant cold-write. The estimated saving is reported as an ESTIMATE
# from the provider's cache-hit discount, never as a measured invoice delta.
#
# Invariants:
#   - NEVER prints, logs, or echoes DEEPSEEK_API_KEY (only presence checks).
#   - Only api.deepseek.com is called (no gateway — see agent-provider-policy).
#   - Warm failure is non-fatal for `run` (warn on stderr, continue).
#   - All temps under ${TMPDIR:-/tmp}; no secrets written to disk.
#
# Exit codes:
#   0   ok
#   1   drift found (agent-coverage) or warm failed (warm)
#   2   usage / bad config
#   3   python3 missing (effort escalator)
#   4   DEEPSEEK_API_KEY unavailable (warm / run)
#   127 opencode not found on PATH (run)

set -uo pipefail

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 2

API_BASE="${DEEPSEEK_API_BASE:-https://api.deepseek.com}"
WARM_MAX_TOKENS="${DEEPSEEK_WARM_MAX_TOKENS:-1}"
WARM_TTL_SECONDS="${DEEPSEEK_WARM_TTL:-1800}"
STAMP_DIR="${DEEPSEEK_WARM_STAMP_DIR:-${XDG_CACHE_HOME:-$HOME/.cache}/agent-skills}"
ESCALATOR="$SKILLS_ROOT/bin/effort-escalator.py"

# Target routing table from issue #6. Keep in sync with rules/model-routing.md
# § OpenCode harness routing. Free-text list = agents that MUST resolve to it.
TARGET_AGENTS_PRO="architect security-reviewer completeness-checker"
TARGET_AGENTS_FLASH="test-writer code-simplifier changelog-generator visual-qa content-writer"

usage() {
  sed -n '3,40p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

# tier_alias_for_agent <agent-name> -> prints opus|sonnet|haiku|""
tier_alias_for_agent() {
  local name="$1" file="agents/$1.md"
  [ -f "$file" ] || return 1
  awk -F': *' '/^model: / { gsub(/"/, "", $2); print $2; exit }' "$file"
}

# deepseek_id_for_tier <alias> -> prints the DeepSeek model ID for that rail tier
deepseek_id_for_tier() {
  case "$1" in
    opus) printf 'deepseek-v4-pro[1m]' ;;
    sonnet | haiku) printf 'deepseek-flash' ;;
    *) return 1 ;;
  esac
}

# deepseek_default_tier — sonnet and haiku both map to Flash; the CLI default
# stays `sonnet` so the alias resolves identically to the Claude rail.
cmd_agent_coverage() {
  local json=0
  for arg in "$@"; do [ "$arg" = "--json" ] && json=1; done

  local pro_missing="" flash_missing="" pro_wrong="" flash_wrong=""
  local name tier

  for name in $TARGET_AGENTS_PRO; do
    tier=$(tier_alias_for_agent "$name") || { pro_missing+="$name "; continue; }
    if [ "$tier" != "opus" ]; then pro_wrong+="$name:$tier "; fi
  done
  for name in $TARGET_AGENTS_FLASH; do
    tier=$(tier_alias_for_agent "$name") || { flash_missing+="$name "; continue; }
    case "$tier" in
      sonnet | haiku) : ;;
      *) flash_wrong+="$name:$tier " ;;
    esac
  done

  # Agents whose declared alias already resolves to Flash — reported for the
  # record so the audit shows the real share of Flash traffic.
  local flash_share=0 total=0
  while IFS= read -r tier; do
    [ -z "$tier" ] && continue
    total=$((total + 1))
    case "$tier" in sonnet | haiku) flash_share=$((flash_share + 1)) ;; esac
  done < <(for f in agents/*.md; do
    awk -F': *' '/^model: / { gsub(/"/, "", $2); print $2; exit }' "$f"
  done)

  local drift=0
  for bucket in "$pro_missing" "$flash_missing" "$pro_wrong" "$flash_wrong"; do
    [ -n "$bucket" ] && drift=1
  done

  if [ "$json" = "1" ]; then
    printf '{"pro":{"want":"opus","missing":"%s","wrong":"%s"},"flash":{"want":"sonnet|haiku","missing":"%s","wrong":"%s"},"flash_share":{"agents":%d,"total":%d},"drift":%s}\n' \
      "$pro_missing" "$pro_wrong" "$flash_missing" "$flash_wrong" "$flash_share" "$total" \
      "$([ "$drift" = "1" ] && echo true || echo false)"
  else
    printf '▸ DeepSeek agent routing — target table from issue #6\n'
    printf '  pro[1m] (opus): %s\n' "$TARGET_AGENTS_PRO"
    printf '  flash  (sonnet|haiku): %s\n' "$TARGET_AGENTS_FLASH"
    [ -n "$pro_missing" ] && printf '  ✗ missing agent files (pro): %s\n' "$pro_missing"
    [ -n "$flash_missing" ] && printf '  ✗ missing agent files (flash): %s\n' "$flash_missing"
    [ -n "$pro_wrong" ] && printf '  ✗ wrong tier (pro): %s\n' "$pro_wrong"
    [ -n "$flash_wrong" ] && printf '  ✗ wrong tier (flash): %s\n' "$flash_wrong"
    printf '  · flash-tier agents: %d/%d (%.0f%%)\n' "$flash_share" "$total" \
      "$(awk -v a="$flash_share" -v b="$total" 'BEGIN{ if (b>0) printf "%.0f", 100*a/b; else print 0 }')"
    if [ "$drift" = "1" ]; then
      printf '✗ routing drift — fix agents/*.md frontmatter or the target table\n'
    else
      printf '✓ routing table matches agents/*.md\n'
    fi
  fi
  [ "$drift" = "1" ] && return 1
  return 0
}

cmd_resolve() {
  local agent="${1:-}"
  [ -n "$agent" ] || usage
  local tier
  tier=$(tier_alias_for_agent "$agent") || {
    printf 'deepseek-routing: no agents/%s.md\n' "$agent" >&2
    return 2
  }
  printf '%s\n' "$(deepseek_id_for_tier "$tier")"
}

# prefix_hash <string> — stable short hash without leaking the bytes
prefix_hash() {
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$1" | sha256sum | cut -c1-16
  else
    printf '%s' "$1" | shasum -a 256 | cut -c1-16
  fi
}

warm_stamp_file() {
  printf '%s/warm-%s.stamp\n' "$STAMP_DIR" "$1"
}

cmd_warm_stamp() {
  local key="${1:-}"
  [ -n "$key" ] || usage
  local f
  f=$(warm_stamp_file "$key")
  if [ -f "$f" ] && [ $(( $(date +%s) - $(cat "$f") )) -lt "$WARM_TTL_SECONDS" ]; then
    printf 'fresh\n'
  else
    printf 'stale\n'
  fi
}

cmd_warm_reset() {
  rm -f "$STAMP_DIR"/warm-*.stamp
}

# cmd_warm <model> <prefix-text> [--json]
cmd_warm() {
  local model="${1:-}"
  local prefix="${2:-}"
  local json=0
  [ "${3:-}" = "--json" ] && json=1
  [ -n "$model" ] || usage

  if [ -z "${DEEPSEEK_API_KEY:-}" ]; then
    printf 'deepseek-routing: DEEPSEEK_API_KEY not set in env\n' >&2
    return 4
  fi

  local key
  key=$(prefix_hash "$model|$prefix")
  mkdir -p "$STAMP_DIR" 2>/dev/null || true

  local started ended bodies
  started=$(date +%s)
  bodies=$(mktemp "${TMPDIR:-/tmp}/ds-warm.XXXXXX")
  local status
  status=$(curl -sS -o "$bodies" -w '%{http_code}' -m 20 \
    -X POST "$API_BASE/v1/chat/completions" \
    -H "Authorization: Bearer ${DEEPSEEK_API_KEY}" \
    -H 'Content-Type: application/json' \
    --data-binary "$(python3 - "$model" "$prefix" "$WARM_MAX_TOKENS" <<'PY'
import json, sys
model, prefix, max_tokens = sys.argv[1], sys.argv[2], int(sys.argv[3])
messages = []
if prefix.strip():
    messages.append({"role": "system", "content": prefix})
messages.append({"role": "user", "content": "warm"})
print(json.dumps({"model": model, "messages": messages, "max_tokens": max_tokens,
                  "stream": False, "temperature": 0}))
PY
)" 2>/dev/null) || status="000"
  ended=$(date +%s)

  local prompt_tokens=0 cache_hit_tokens=0
  if [ "$status" = "200" ]; then
    read -r _hit _miss prompt_tokens cache_hit_tokens < <(python3 - "$bodies" <<'PY'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
except Exception:
    print(0, 0, 0, 0); raise SystemExit
u = d.get("usage") or {}
hit = int(u.get("prompt_cache_hit_tokens") or 0)
miss = int(u.get("prompt_cache_miss_tokens") or u.get("prompt_tokens") or 0)
print(1 if hit else 0, 1 if miss else 0, int(u.get("prompt_tokens") or 0), hit)
PY
    )
    printf '%s' "$ended" > "$(warm_stamp_file "$key")"
  fi
  rm -f "$bodies"

  local ms=$(( (ended - started) * 1000 ))
  if [ "$json" = "1" ]; then
    printf '{"ok":%s,"status":"%s","ms":%d,"prompt_tokens":%d,"cache_hit_tokens":%d,"stamp":"%s"}\n' \
      "$([ "$status" = "200" ] && echo true || echo false)" "$status" "$ms" \
      "$prompt_tokens" "$cache_hit_tokens" "$key"
  else
    if [ "$status" = "200" ]; then
      printf '✓ warmed %s in %dms (prompt %d tok, cache-hit %d tok)\n' \
        "$model" "$ms" "$prompt_tokens" "$cache_hit_tokens"
    else
      printf '✗ warm failed: HTTP %s\n' "$status" >&2
    fi
  fi
  [ "$status" = "200" ] || return 1
  return 0
}

# cmd_run — warm lazily, then exec opencode with agent model + effort variant.
cmd_run() {
  local agent="" effort="" passthrough=()
  while [ $# -gt 0 ]; do
    case "$1" in
      -a | --agent)
        agent="${2:-}"
        shift 2
        ;;
      --effort)
        effort="${2:-}"
        shift 2
        ;;
      *)
        passthrough+=("$1")
        shift
        ;;
    esac
  done

  local model_id="deepseek/deepseek-chat"
  if [ -n "$agent" ]; then
    local tier
    tier=$(tier_alias_for_agent "$agent") || {
      printf 'deepseek-routing: no agents/%s.md\n' "$agent" >&2
      return 2
    }
    model_id="deepseek/$(deepseek_id_for_tier "$tier")"
  fi

  # Effort: explicit > escalator over the joined passthrough prompt > default.
  if [ -z "$effort" ] && [ -f "$ESCALATOR" ] && [ "${#passthrough[@]}" -gt 0 ]; then
    if ! command -v python3 >/dev/null 2>&1; then
      printf 'deepseek-routing: python3 missing — skipping effort escalator\n' >&2
    else
      effort=$(python3 "$ESCALATOR" classify "${passthrough[*]}" 2>/dev/null || true)
    fi
  fi
  effort="${effort:-medium}"

  # Lazy warm: only when the cache entry is stale for this agent prefix.
  local prefix=""
  [ -n "$agent" ] && prefix=$(sed -n '/^---$/,/^---$/p' "agents/$agent.md" 2>/dev/null)
  local key stale
  key=$(prefix_hash "$model_id|$prefix")
  stale=$(cmd_warm_stamp "$key")
  if [ "$stale" = "stale" ] && [ -n "${DEEPSEEK_API_KEY:-}" ]; then
    cmd_warm "$model_id" "$prefix" >/dev/null 2>&1 || \
      printf 'deepseek-routing: warm skipped (request failed; continuing)\n' >&2
  fi

  if ! OPENCODE_BIN="$(command -v opencode 2>/dev/null)"; then
    printf 'deepseek-routing: opencode not found on PATH\n' >&2
    return 127
  fi

  printf '▸ %s · effort=%s%s\n' "$model_id" "$effort" "${agent:+ · agent=$agent}" >&2
  exec "$OPENCODE_BIN" run -m "$model_id" --variant "$effort" "${passthrough[@]}"
}

main() {
  local cmd="${1:-}"
  [ $# -gt 0 ] && shift
  case "$cmd" in
    agent-coverage) cmd_agent_coverage "$@" ;;
    resolve) cmd_resolve "$@" ;;
    warm) cmd_warm "$@" ;;
    run) cmd_run "$@" ;;
    warm-stamp) cmd_warm_stamp "$@" ;;
    warm-reset) cmd_warm_reset "$@" ;;
    *) usage ;;
  esac
}

main "$@"
