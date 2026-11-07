#!/usr/bin/env bash
# Route a task through the shared skill router + DeepSeek capability plane, then run OpenCode.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TASK="${*:-}"
[ -n "$TASK" ] || { printf 'usage: %s <task>\n' "$0" >&2; exit 64; }

ROUTE="$(node "$ROOT/bin/deepseek-control-plane.mjs" route --task "$TASK")"
MODEL="$(printf '%s' "$ROUTE" | jq -r .model)"
EFFORT="$(printf '%s' "$ROUTE" | jq -r .reasoning_effort)"
SKILLS="$(python3 "$ROOT/bin/skill-router.py" route "$TASK" --cwd "$PWD" --tool opencode 2>/dev/null || true)"

# Progressive disclosure: the router result tells OpenCode which canonical skills to load;
# it does not concatenate every SKILL.md into the prompt.
PROMPT=$(jq -nc --arg task "$TASK" --argjson route "$ROUTE" --arg skills "$SKILLS" \
  '{task:$task,deepseek_route:$route,skill_route:$skills,instructions:["Load every routed skill required for this task in full, including required references; shortened catalog descriptions are discovery hints only.","Before acting, hydrate up to 900K relevant tokens: exact repository source/callers/tests/contracts/config first, Context7 current library docs, scoped estate AI Search knowledge, then authoritative live evidence. Do not pad; record a compact hydration manifest and explicitly note unavailable sources.","When acting as a child analyzer, return only versioned schema-valid structured data; use schemas/repomix-context-summary.v1.schema.json for Repomix context and cite paths/lines instead of echoing source.","Aggressively implement safe, reversible, in-scope low-hanging fruit; record larger or destructive ideas instead of silently expanding scope.","Verify every change with the narrowest decisive gate."]}' | jq -r @json)

export OPENCODE_DEEPSEEK_EFFORT="$EFFORT"
CIRCUIT_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/emdash"
CIRCUIT_FILE="$CIRCUIT_DIR/deepseek-v4-pro.circuit"
mkdir -p "$CIRCUIT_DIR"
if [[ "$MODEL" == */deepseek-v4-pro ]] && [ -f "$CIRCUIT_FILE" ]; then
  opened="$(cat "$CIRCUIT_FILE" 2>/dev/null || echo 0)"
  if [ $(( $(date +%s) - opened )) -lt 300 ]; then MODEL='litellm/deepseek-flash'; fi
fi

attempt=1
while [ "$attempt" -le 4 ]; do
  log="$(mktemp)"
  set +e
  "$ROOT/bin/opencode-deepseek.sh" run --pure -m "$MODEL" "$PROMPT" 2> >(tee "$log" >&2)
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    [[ "$MODEL" == */deepseek-v4-pro ]] && rm -f "$CIRCUIT_FILE"
    rm -f "$log"
    exit 0
  fi
  error="$(cat "$log")"
  rm -f "$log"
  if ! printf '%s' "$error" | grep -Eqi '(^|[^0-9])(429|500|503)([^0-9]|$)|rate.?limit|overload|temporar'; then exit "$status"; fi
  if [ "$attempt" -eq 2 ] && [[ "$MODEL" == */deepseek-v4-pro ]]; then
    date +%s >"$CIRCUIT_FILE"
    MODEL="${MODEL%/*}/deepseek-flash"
  fi
  # Exponential backoff with bounded jitter: 1-2s, 2-3s, 4-5s.
  sleep $(( (1 << (attempt - 1)) + RANDOM % 2 ))
  attempt=$((attempt + 1))
done
exit 75
