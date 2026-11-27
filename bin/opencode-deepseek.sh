#!/usr/bin/env bash
#
# opencode-deepseek.sh — launch OpenCode with DeepSeek + Ollama (throughput tier) wired up via LiteLLM Gateway & DeepSeek API.
#
# Per rules/agent-provider-policy.md (ADR-0057): routine/high-volume internal
# implementation runs on OpenCode + DeepSeek / Ollama (hybrid-coder, ollama-coder,
# deepseek-v4-pro, deepseek-flash, deepseek-chat, deepseek-reasoner).
# Resolve the selected provider's credential from the environment or secret
# broker. Keep direct DeepSeek and LiteLLM credentials separate.
#
# Usage:
#   opencode-deepseek.sh run -m litellm/deepseek-v4-pro "reply OK"
#   opencode-deepseek.sh run -m litellm/hybrid-coder "reply OK"
#   opencode-deepseek.sh run -m deepseek/deepseek-chat "reply OK"
#   opencode-deepseek.sh models

set -euo pipefail

# OpenCode owns config discovery. Keep the account's files intact.

# Resolve the opencode binary so we can exec it directly under `env`.
if ! OPENCODE_BIN="$(command -v opencode 2>/dev/null)"; then
  printf 'opencode-deepseek.sh: error: opencode not found on PATH\n' >&2
  exit 127
fi

model=""
args=("$@")
for ((index = 0; index < $#; index++)); do
  arg="${args[index]}"
  case "${arg}" in
    --) break ;;
    -h | --help | -v | --version) exec "${OPENCODE_BIN}" "$@" ;;
    -m | --model)
      index=$((index + 1))
      model="${args[index]:-}"
      ;;
    --model=*) model="${arg#--model=}" ;;
  esac
done

case "${model}" in
  "" | litellm/*) credential_name=LITELLM_API_KEY ;;
  deepseek/*) credential_name=DEEPSEEK_API_KEY ;;
  *)
    printf 'opencode-deepseek.sh: error: model must use the LiteLLM or direct DeepSeek route\n' >&2
    exit 2
    ;;
esac

credential="${!credential_name:-}"
if [ -z "${credential}" ]; then
  if ! command -v get-secret >/dev/null 2>&1; then
    printf 'opencode-deepseek.sh: error: get-secret unavailable for %s\n' "${credential_name}" >&2
    exit 3
  fi
  credential="$(get-secret "${credential_name}" 2>/dev/null || true)"
fi
if [ -z "${credential}" ]; then
  printf 'opencode-deepseek.sh: error: %s unavailable from get-secret\n' "${credential_name}" >&2
  exit 4
fi

export "${credential_name}=${credential}"
exec "${OPENCODE_BIN}" "$@"
