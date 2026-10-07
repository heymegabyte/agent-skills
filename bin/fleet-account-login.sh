#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.local/bin:$HOME/ai/tools/bin:$HOME/.volta/bin:$PATH"
account="${1:?Usage: fleet-account-login.sh claude-1|claude-2|claude-3}"
case "$account" in claude-1|claude-2|claude-3) ;; *) exit 2 ;; esac
source "$HOME/ai/tools/claw-router/lib/common.sh"
directory="$(cr_account_dir "$account")"
cr_link_shared_paths "$directory"
env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN -u ANTHROPIC_BASE_URL -u CLAUDE_CODE_OAUTH_TOKEN \
  CLAUDE_CONFIG_DIR="$directory" claude auth login --claudeai
env -u ANTHROPIC_API_KEY -u ANTHROPIC_AUTH_TOKEN CLAUDE_CONFIG_DIR="$directory" \
  claude auth status --json >/dev/null
cr_config_update '(.accounts[] | select(.name==$n) | .enabled) = true' --arg n "$account"
printf '%s is authenticated and enabled for subscription routing.\n' "$account"
