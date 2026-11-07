#!/usr/bin/env bash
set -euo pipefail
GET_SECRET_BIN="${GET_SECRET_BIN:-get-secret}"
KEY="${DEEPSEEK_API_KEY:-}"
if [ -z "$KEY" ] && command -v "$GET_SECRET_BIN" >/dev/null 2>&1; then KEY="$($GET_SECRET_BIN DEEPSEEK_API_KEY 2>/dev/null || true)"; fi
[ -n "$KEY" ] || { printf 'promptfoo-deepseek: DEEPSEEK_API_KEY unavailable\n' >&2; exit 4; }
exec env -u OPENAI_API_KEY -u ANTHROPIC_API_KEY DEEPSEEK_API_KEY="$KEY" npx --yes promptfoo@latest "$@"
