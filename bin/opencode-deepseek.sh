#!/usr/bin/env bash
# Launch OpenCode on the direct DeepSeek rail without leaking unrelated API keys.
# CLI launches prefer get-secret; desktop/native auth is the fallback.

set -euo pipefail

if ! OPENCODE_BIN="$(command -v opencode 2>/dev/null)"; then
  printf 'opencode-deepseek.sh: error: opencode not found on PATH\n' >&2
  exit 127
fi

# Optional Langfuse Cloud OTLP telemetry. Values are scoped to the child only;
# the OpenCode plugin records lifecycle metadata, never prompts/tool args/files.
GET_SECRET_BIN="${GET_SECRET_BIN:-get-secret}"
LANGFUSE_ENV=()
if command -v "$GET_SECRET_BIN" >/dev/null 2>&1; then
  LF_PUBLIC="$($GET_SECRET_BIN LANGFUSE_PUBLIC_KEY 2>/dev/null || true)"
  LF_SECRET="$($GET_SECRET_BIN LANGFUSE_SECRET_KEY 2>/dev/null || true)"
  LF_BASE="$($GET_SECRET_BIN LANGFUSE_BASE_URL 2>/dev/null || true)"
  [ -n "$LF_PUBLIC" ] && [ -n "$LF_SECRET" ] && LANGFUSE_ENV+=(LANGFUSE_PUBLIC_KEY="$LF_PUBLIC" LANGFUSE_SECRET_KEY="$LF_SECRET")
  [ -n "$LF_BASE" ] && LANGFUSE_ENV+=(LANGFUSE_BASE_URL="$LF_BASE")
fi

# LiteLLM gateway virtual key (PRIMARY rail: llm.megabyte.space/v1). Export so CLI
# launches route through the 4-key rotation + fallback + Langfuse gateway. Per
# rules/litellm-gateway.md — never the master key, never a raw DeepSeek key.
LITELLM_ENV=()
if command -v "$GET_SECRET_BIN" >/dev/null 2>&1; then
  LITELLM_KEY="$("$GET_SECRET_BIN" LITELLM_API_KEY 2>/dev/null || true)"
  [ -n "$LITELLM_KEY" ] && LITELLM_ENV+=(LITELLM_API_KEY="$LITELLM_KEY")
fi

# Prefer OpenCode's mode-0600 native credential. This avoids exposing the key in
# a child process environment and matches desktop/managed-launch behavior.
AUTH_FILE="${OPENCODE_AUTH_FILE:-${XDG_DATA_HOME:-$HOME/.local/share}/opencode/auth.json}"
if command -v jq >/dev/null 2>&1 && [ -f "$AUTH_FILE" ] &&
  jq -e '.deepseek.type == "api" and (.deepseek.key | type == "string" and length > 0)' "$AUTH_FILE" >/dev/null 2>&1; then
  exec env -u DEEPSEEK_API_KEY -u OPENAI_API_KEY -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN \
    OPENCODE_ENABLE_EXA=1 OPENCODE_EXPERIMENTAL_LSP_TOOL=true \
    ${LANGFUSE_ENV[@]+"${LANGFUSE_ENV[@]}"} ${LITELLM_ENV[@]+"${LITELLM_ENV[@]}"} "$OPENCODE_BIN" "$@"
fi

# Bootstrap/fallback path for machines not yet synchronized. Scope the encrypted
# source value to the child and scrub unrelated premium-provider credentials.
DEEPSEEK_KEY=''
if command -v "$GET_SECRET_BIN" >/dev/null 2>&1; then
  DEEPSEEK_KEY="$("$GET_SECRET_BIN" DEEPSEEK_API_KEY 2>/dev/null || true)"
fi
if [ -n "$DEEPSEEK_KEY" ]; then
  exec env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN \
    OPENCODE_ENABLE_EXA=1 OPENCODE_EXPERIMENTAL_LSP_TOOL=true \
    ${LANGFUSE_ENV[@]+"${LANGFUSE_ENV[@]}"} ${LITELLM_ENV[@]+"${LITELLM_ENV[@]}"} DEEPSEEK_API_KEY="$DEEPSEEK_KEY" "$OPENCODE_BIN" "$@"
fi

printf 'opencode-deepseek.sh: error: DeepSeek auth unavailable; run bin/opencode-deepseek-auth.sh sync\n' >&2
exit 4
