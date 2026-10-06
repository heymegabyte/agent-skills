#!/usr/bin/env bash
# check-required-keys.sh — API Key Gate helper
# Usage: check-required-keys.sh <mode>
# Modes: saas | portfolio | local-business | non-profit | other
# Output: JSON {ok, mode, missing[], present[], hint}
# Logs:   ~/.claude/debug/api-key-gate.log
#
# Provider policy SSOT: rules/agent-provider-policy.md
#   Internal dev-agent orchestration uses SUBSCRIPTION CLIs (claude/codex) +
#   DeepSeek-via-OpenCode — NOT OpenAI/Anthropic API keys. DeepSeek API is the
#   allowed throughput tier (get-secret DEEPSEEK_API_KEY). ANTHROPIC_API_KEY /
#   OPENAI_API_KEY are product-runtime Worker secrets only, never internal auth.
set -uo pipefail

MODE="${1:-other}"
LOG="$HOME/.claude/debug/api-key-gate.log"
mkdir -p "$(dirname "$LOG")"
HOSTNAME_SHORT=$(hostname -s 2>/dev/null || echo unknown)
CHEZMOI_DIR="$HOME/.local/share/chezmoi/home/.chezmoitemplates/secrets-${HOSTNAME_SHORT}"
MASTER_ENV="$HOME/emdash-projects/worktrees/rare-chefs-film-8op/.env.local"

# Required keys per mode (see rules/agent-provider-policy.md).
# DEEPSEEK_API_KEY = allowed throughput tier for internal dev agents (DeepSeek-via-OpenCode).
# ANTHROPIC_API_KEY / OPENAI_API_KEY are NOT required here — internal orchestration uses
# subscription CLIs (claude/codex); those keys are product-runtime Worker secrets only
# (see WARN_ONLY below + the env-presence caution).
BASELINE=(CLOUDFLARE_API_KEY CLOUDFLARE_EMAIL CLOUDFLARE_ACCOUNT_ID DEEPSEEK_API_KEY GITHUB_TOKEN RESEND_API_KEY IDEOGRAM_API_KEY)
OBSERVABILITY=(SENTRY_DSN SENTRY_AUTH_TOKEN POSTHOG_API_KEY POSTHOG_HOST GTM_CONTAINER_ID)
# Product-runtime only, not internal-orchestration: presence in the dev SHELL env is a
# WARNING (can override subscription auth + cause API billing), never a readiness signal.
WARN_ONLY=(ANTHROPIC_API_KEY OPENAI_API_KEY)

case "$MODE" in
  saas) EXTRA=(CLERK_SECRET_KEY CLERK_PUBLISHABLE_KEY STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET INNGEST_EVENT_KEY INNGEST_SIGNING_KEY NEON_DATABASE_URL) ;;
  portfolio) EXTRA=(PEXELS_API_KEY PIXABAY_API_KEY) ;;
  local-business) EXTRA=(GOOGLE_MAPS_API_KEY GOOGLE_PLACES_API_KEY) ;;
  non-profit) EXTRA=(STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET) ;;
  *) EXTRA=() ;;
esac

REQUIRED=("${BASELINE[@]}" "${OBSERVABILITY[@]}" "${EXTRA[@]}")

# Load env files (silent failures OK)
# shellcheck source=/dev/null
[ -f "$MASTER_ENV" ] && {
  set -a
  source "$MASTER_ENV" 2>/dev/null
  set +a
}
# shellcheck source=/dev/null
[ -n "${CLAUDE_ENV_FILE:-}" ] && [ -f "$CLAUDE_ENV_FILE" ] && {
  set -a
  source "$CLAUDE_ENV_FILE" 2>/dev/null
  set +a
}
[ -f "$PWD/.env.local" ] && {
  set -a
  source "$PWD/.env.local" 2>/dev/null
  set +a
}
[ -f "$PWD/.dev.vars" ] && {
  set -a
  source "$PWD/.dev.vars" 2>/dev/null
  set +a
}

resolveKey() {
  local key="$1"
  if [ -n "${!key:-}" ]; then
    echo "env"
    return
  fi
  if [ -f "$CHEZMOI_DIR/$key" ]; then
    echo "chezmoi"
    return
  fi
  if command -v get-secret >/dev/null 2>&1 && get-secret "$key" >/dev/null 2>&1; then
    echo "get-secret"
    return
  fi
  echo ""
}

MISSING=()
PRESENT=()
for key in "${REQUIRED[@]}"; do
  src=$(resolveKey "$key")
  if [ -n "$src" ]; then PRESENT+=("\"${key}:${src}\""); else MISSING+=("\"${key}\""); fi
done

# Env-presence caution (rules/agent-provider-policy.md). Warn — never gate — when a
# product-runtime provider key is set in the dev SHELL env: it can override subscription
# auth (claude/codex) and cause API billing for INTERNAL orchestration. Unset it for
# internal dev agents; keep it ONLY as a product-runtime Worker secret. To stderr so the
# stdout JSON stays clean.
for key in "${WARN_ONLY[@]}"; do
  if [ -n "${!key:-}" ]; then
    echo "WARN: ${key} is set in the dev shell env — product-runtime only, not internal-orchestration auth. It can override subscription CLIs (claude/codex) and incur API billing; unset it for internal dev agents (see rules/agent-provider-policy.md)." >&2
  fi
done

OK=true
HINT="null"
if [ ${#MISSING[@]} -gt 0 ]; then
  OK=false
  if [ -d "$CHEZMOI_DIR" ]; then HINT="\"chezmoi pull\""; else HINT="\"paste below\""; fi
fi

# Build JSON arrays manually (jq not guaranteed)
joinArr() {
  local IFS=,
  echo "$*"
}
MISSING_JSON="[$(joinArr "${MISSING[@]}")]"
PRESENT_JSON="[$(joinArr "${PRESENT[@]}")]"

JSON="{\"ok\":${OK},\"mode\":\"${MODE}\",\"missing\":${MISSING_JSON},\"present\":${PRESENT_JSON},\"hint\":${HINT}}"
echo "$JSON"

# Append audit log
TS=$(date -u +%FT%TZ)
echo "{\"ts\":\"${TS}\",\"mode\":\"${MODE}\",\"ok\":${OK},\"missing_count\":${#MISSING[@]}}" >>"$LOG"

[ "$OK" = "true" ] && exit 0 || exit 1
