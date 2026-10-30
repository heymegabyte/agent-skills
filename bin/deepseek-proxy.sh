#!/usr/bin/env bash
#
# deepseek-proxy.sh — run Claude Code against DeepSeek's Anthropic endpoint through
# the local reasoning-preserving proxy (bin/deepseek-proxy/proxy.mjs).
#
# Why: DeepSeek V4's Anthropic-compatible endpoint rejects (HTTP 400) any multi-turn
# request whose assistant tool_use turns omit `reasoning_content` while thinking is
# enabled. Claude Code drops it during its Anthropic<->OpenAI conversion, so turn 2 of
# every agentic task fails. The proxy captures the reasoning from the SSE stream and
# re-injects it on later turns. See MEG-207.
#
# Usage:
#   bin/deepseek-proxy.sh                      # interactive claude with DeepSeek + proxy
#   bin/deepseek-proxy.sh -p "explain this"    # one-shot; args pass through to claude
#   bin/deepseek-proxy.sh --no-proxy           # bypass the proxy (old behaviour)
#   deepseek_proxy_port=8899 bin/deepseek-proxy.sh
#
# Exit codes:
#   127  node or claude not found on PATH
#   3    get-secret not found and DEEPSEEK_API_KEY unset
#   5    proxy failed health/startup
#
# Invariants:
#   - The DeepSeek key is resolved at runtime and handed to TWO children only: the
#     proxy and `claude`. It is never printed, logged, or written to disk.
#   - The proxy binds 127.0.0.1 only.
#   - The proxy is terminated on exit, including on error.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${deepseek_proxy_port:-8788}"
USE_PROXY=1
ARGS=()

for arg in "$@"; do
  case "$arg" in
    --no-proxy) USE_PROXY=0 ;;
    *) ARGS+=("$arg") ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  printf 'deepseek-proxy.sh: error: node not found on PATH\n' >&2
  exit 127
fi
if ! command -v claude >/dev/null 2>&1; then
  printf 'deepseek-proxy.sh: error: claude not found on PATH\n' >&2
  exit 127
fi

if [ -z "${DEEPSEEK_API_KEY:-}" ] && ! command -v get-secret >/dev/null 2>&1; then
  printf 'deepseek-proxy.sh: error: get-secret not found on PATH\n' >&2
  exit 3
fi
DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-$(get-secret DEEPSEEK_API_KEY 2>/dev/null || true)}"
if [ -z "${DEEPSEEK_API_KEY}" ]; then
  printf 'deepseek-proxy.sh: error: DEEPSEEK_API_KEY unavailable from get-secret\n' >&2
  exit 3
fi

if [ "$USE_PROXY" -eq 0 ]; then
  exec env DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" \
    ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic \
    claude "${ARGS[@]}"
fi

PROXY_STATUS_FILE="$(mktemp)"
DEEPSEEK_PROXY_PORT="$PORT" DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" \
  node "$ROOT/bin/deepseek-proxy/proxy.mjs" >"$PROXY_STATUS_FILE" 2>&1 &
PROXY_PID=$!

cleanup() {
  if kill -0 "$PROXY_PID" 2>/dev/null; then
    kill "$PROXY_PID" 2>/dev/null || true
    wait "$PROXY_PID" 2>/dev/null || true
  fi
  rm -f "$PROXY_STATUS_FILE"
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 40); do
  if grep -q 'listening on' "$PROXY_STATUS_FILE" 2>/dev/null; then
    break
  fi
  if ! kill -0 "$PROXY_PID" 2>/dev/null; then
    printf 'deepseek-proxy.sh: error: proxy exited during startup\n' >&2
    cat "$PROXY_STATUS_FILE" >&2
    exit 5
  fi
  sleep 0.15
done

if ! grep -q 'listening on' "$PROXY_STATUS_FILE" 2>/dev/null; then
  printf 'deepseek-proxy.sh: error: proxy did not start within 6s\n' >&2
  exit 5
fi

# The key reaches the proxy through its env (it forwards it upstream only when the
# client sends no credential of its own). `claude` keeps using apiKeyHelper or the
# DEEPSEEK_API_KEY it already resolves.
env DEEPSEEK_API_KEY="$DEEPSEEK_API_KEY" \
  ANTHROPIC_BASE_URL="http://127.0.0.1:$PORT" \
  claude "${ARGS[@]}"
