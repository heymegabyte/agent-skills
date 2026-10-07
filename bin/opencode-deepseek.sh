#!/usr/bin/env bash
#
# opencode-deepseek.sh — launch OpenCode with DeepSeek (throughput tier) wired up.
#
# Per rules/agent-provider-policy.md (ADR-0057): routine/high-volume internal
# implementation runs on OpenCode + DeepSeek. The DeepSeek API key is resolved at
# runtime via `get-secret DEEPSEEK_API_KEY` and injected into the opencode CHILD
# process env ONLY — it never touches the parent shell, ~/.zshrc, or any global
# env, and its value is NEVER printed, logged, or written to disk.
#
# The provider itself is declared once in ~/.config/opencode/opencode.jsonc with
#   "apiKey": "{env:DEEPSEEK_API_KEY}"
# so this launcher only has to supply that env var to the child.
#
# Usage:
#   opencode-deepseek.sh run -m deepseek/deepseek-chat "reply OK"
#   opencode-deepseek.sh run -m deepseek/deepseek-reasoner "…"
#   opencode-deepseek.sh models deepseek
#   opencode-deepseek.sh                      # interactive TUI with DeepSeek available
#
# All arguments are passed through to `opencode` verbatim; the child exit status
# is preserved.
#
# Exit codes:
#   127  opencode not found on PATH
#   3    get-secret not found on PATH
#   4    DEEPSEEK_API_KEY could not be resolved from get-secret
#   *    otherwise the opencode child's exit code is passed through faithfully
#
# Invariants:
#   - NEVER prints / logs / echoes the secret value.
#   - The key is injected into the CHILD only (via `env VAR=val`); parent env is
#     untouched and nothing is exported into the surrounding shell.
#   - Args and exit status pass through unchanged.

set -euo pipefail

# Resolve the opencode binary so we can exec it directly under `env`.
if ! OPENCODE_BIN="$(command -v opencode 2>/dev/null)"; then
  printf 'opencode-deepseek.sh: error: opencode not found on PATH\n' >&2
  exit 127
fi

# Use the existing child environment directly; consult the broker only if absent.
if [ -z "${DEEPSEEK_API_KEY:-}" ] && ! command -v get-secret >/dev/null 2>&1; then
  printf 'opencode-deepseek.sh: error: get-secret not found on PATH\n' >&2
  exit 3
fi

# Fetch the DeepSeek key into a local variable. It is read into memory only and
# handed to the child via `env`; it is never printed and never leaves this shell.
DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY:-$(get-secret DEEPSEEK_API_KEY 2>/dev/null || true)}"
if [ -z "${DEEPSEEK_API_KEY}" ]; then
  printf 'opencode-deepseek.sh: error: DEEPSEEK_API_KEY unavailable from get-secret\n' >&2
  exit 4
fi

# Inject the key into the opencode CHILD env only. `env NAME=value cmd` scopes the
# variable to the spawned process; the parent shell never has it exported.
exec env DEEPSEEK_API_KEY="${DEEPSEEK_API_KEY}" "${OPENCODE_BIN}" "$@"
