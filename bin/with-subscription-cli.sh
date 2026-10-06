#!/usr/bin/env bash
#
# with-subscription-cli.sh — env-sanitizing launcher for subscription-billed CLIs.
#
# Per rules/agent-provider-policy.md: internal dev-agent orchestration must bill
# to SUBSCRIPTIONS, never to API keys. This launcher strips the relevant API-key
# env vars from the CHILD process only, so `claude` falls back to the Claude
# subscription and `codex` falls back to ChatGPT-subscription OAuth even if a
# key happens to be exported in the surrounding shell.
#
# It does NOT modify the parent shell, ~/.zshrc, or any global/persistent env —
# the unset is scoped to the spawned child via `env -u`.
#
# Usage:
#   with-subscription-cli.sh claude <args…>   # strips ANTHROPIC_API_KEY + ANTHROPIC_AUTH_TOKEN
#   with-subscription-cli.sh codex  <args…>   # strips OPENAI_API_KEY
#
# Exit codes:
#   127  requested CLI not found on PATH
#   2    unknown first argument (not claude/codex)
#   *    otherwise the child's exit code is passed through faithfully
#
# Invariants:
#   - NEVER prints a secret value.
#   - Only the child env is sanitized (via `env -u`); parent env is untouched.
#   - Args and exit status pass through unchanged.

set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: with-subscription-cli.sh <claude|codex> [args…]

  claude   launch Claude Code with ANTHROPIC_API_KEY + ANTHROPIC_AUTH_TOKEN
           stripped from the child env (forces Claude-subscription billing).
  codex    launch Codex with OPENAI_API_KEY stripped from the child env
           (forces ChatGPT-subscription OAuth billing).

Per rules/agent-provider-policy.md — internal orchestration never bills API keys.
EOF
}

# At least one argument (the CLI selector) is required.
if [ "$#" -lt 1 ]; then
  usage
  exit 2
fi

CLI="$1"
shift

case "$CLI" in
  claude)
    # Resolve the real binary so `env -u` can exec it directly.
    if ! BIN="$(command -v claude 2>/dev/null)"; then
      printf 'with-subscription-cli.sh: error: claude not found on PATH\n' >&2
      exit 127
    fi
    # Strip Anthropic API key + auth token from the CHILD only → subscription billing.
    exec env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN "$BIN" "$@"
    ;;
  codex)
    if ! BIN="$(command -v codex 2>/dev/null)"; then
      printf 'with-subscription-cli.sh: error: codex not found on PATH\n' >&2
      exit 127
    fi
    # Strip OpenAI API key from the CHILD only → ChatGPT-subscription OAuth.
    exec env -u OPENAI_API_KEY "$BIN" "$@"
    ;;
  *)
    printf 'with-subscription-cli.sh: error: unknown CLI %q (expected claude or codex)\n' "$CLI" >&2
    usage
    exit 2
    ;;
esac
