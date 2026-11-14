#!/usr/bin/env bash
#
# opencode-deepseek.sh — launch OpenCode with DeepSeek + Ollama (throughput tier) wired up via LiteLLM Gateway & DeepSeek API.
#
# Per rules/agent-provider-policy.md (ADR-0057): routine/high-volume internal
# implementation runs on OpenCode + DeepSeek / Ollama (hybrid-coder, ollama-coder,
# deepseek-v4-pro, deepseek-flash, deepseek-chat, deepseek-reasoner).
# Keys are resolved at runtime via `get-secret DEEPSEEK_API_KEY` and
# `get-secret LITELLM_API_KEY` and injected into the opencode CHILD process env
# ONLY — never touching parent shell or disk.
#
# Usage:
#   opencode-deepseek.sh run -m litellm/deepseek-v4-pro "reply OK"
#   opencode-deepseek.sh run -m litellm/hybrid-coder "reply OK"
#   opencode-deepseek.sh run -m deepseek/deepseek-chat "reply OK"
#   opencode-deepseek.sh models

set -euo pipefail

# Prevent stale ~/.config/opencode/opencode.json from shadowing canonical opencode.jsonc
if [ -f "${HOME}/.config/opencode/opencode.jsonc" ] && [ -f "${HOME}/.config/opencode/opencode.json" ]; then
  rm -f "${HOME}/.config/opencode/opencode.json" 2>/dev/null || true
fi

# Resolve the opencode binary so we can exec it directly under `env`.
if ! OPENCODE_BIN="$(command -v opencode 2>/dev/null)"; then
  printf 'opencode-deepseek.sh: error: opencode not found on PATH\n' >&2
  exit 127
fi

# Use the existing child environment directly; consult the broker only if absent.
if [ -z "${DEEPSEEK_API_KEY:-}" ] && [ -z "${LITELLM_API_KEY:-}" ] && ! command -v get-secret >/dev/null 2>&1; then
  printf 'opencode-deepseek.sh: error: get-secret not found on PATH\n' >&2
  exit 3
fi

DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-$(get-secret DEEPSEEK_API_KEY 2>/dev/null || true)}"
LITELLM_API_KEY="${LITELLM_API_KEY:-$(get-secret LITELLM_API_KEY 2>/dev/null || true)}"

if [ -z "${DEEPSEEK_API_KEY}" ] && [ -z "${LITELLM_API_KEY}" ]; then
  printf 'opencode-deepseek.sh: error: neither DEEPSEEK_API_KEY nor LITELLM_API_KEY available from get-secret\n' >&2
  exit 4
fi

exec env \
  DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-${LITELLM_API_KEY}}" \
  LITELLM_API_KEY="${LITELLM_API_KEY:-${DEEPSEEK_API_KEY}}" \
  "${OPENCODE_BIN}" "$@"
