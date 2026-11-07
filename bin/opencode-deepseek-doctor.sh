#!/usr/bin/env bash
# Diagnose OpenCode + DeepSeek without exposing credentials. Use --live for a paid request.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LIVE=false
[ "${1:-}" = '--live' ] && LIVE=true

installed=false
models=false
auth_ready=false
config_ok=false
live_ok=null
version=''

if command -v opencode >/dev/null 2>&1; then
  installed=true
  version="$(opencode --version 2>/dev/null | head -n 1 || true)"
  if opencode models deepseek 2>/dev/null | grep -q '^deepseek/'; then models=true; fi
  resolved="$(env -u DEEPSEEK_API_KEY opencode debug config 2>/dev/null || true)"
  if [ -n "$resolved" ] && ! printf '%s' "$resolved" | jq -e '.provider.deepseek.options.apiKey == ""' >/dev/null 2>&1; then
    config_ok=true
  fi
fi

auth_json="$("$ROOT/bin/opencode-deepseek-auth.sh" status)"
if printf '%s' "$auth_json" | jq -e '.ready == true' >/dev/null; then auth_ready=true; fi

if [ "$LIVE" = true ]; then
  live_ok=false
  if env -u DEEPSEEK_API_KEY opencode run --pure -m deepseek/deepseek-flash \
    'Reply with exactly OPENCODE_DEEPSEEK_OK and nothing else.' 2>/dev/null | grep -q 'OPENCODE_DEEPSEEK_OK'; then
    live_ok=true
  fi
fi

ready=false
if [ "$installed" = true ] && [ "$models" = true ] && [ "$auth_ready" = true ] && [ "$config_ok" = true ]; then
  ready=true
fi
if [ "$LIVE" = true ] && [ "$live_ok" != true ]; then ready=false; fi

jq -nc \
  --arg version "$version" \
  --argjson installed "$installed" \
  --argjson models "$models" \
  --argjson auth_ready "$auth_ready" \
  --argjson config_ok "$config_ok" \
  --argjson live_ok "$live_ok" \
  --argjson ready "$ready" \
  '{installed:$installed,version:$version,models_available:$models,native_auth_ready:$auth_ready,config_ok:$config_ok,live_ok:$live_ok,ready:$ready}'

[ "$ready" = true ]
