#!/usr/bin/env bash
# Subscription-safe Claude Code cloud-session launcher.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cmd="${1:-doctor}"
shift || true

case "$cmd" in
  doctor)
    command -v claude >/dev/null 2>&1 || { jq -nc '{ready:false,reason:"claude-missing"}'; exit 1; }
    auth="$(claude auth status 2>/dev/null || true)"
    remote="$(git remote get-url origin 2>/dev/null || true)"
    jq -nc --argjson auth "${auth:-null}" --arg remote "$remote" \
      '{ready:($auth.loggedIn == true and $auth.authMethod == "claude.ai" and ($remote|test("github.com"))),auth_method:($auth.authMethod // null),subscription:($auth.subscriptionType // null),github_remote:($remote|length>0),cloud_credit_expires:"2026-11-04T23:59:59-08:00"}'
    ;;
  run)
    [ "$#" -gt 0 ] || { printf 'usage: claude-cloud.sh run <prompt>\n' >&2; exit 64; }
    remote="$(git remote get-url origin 2>/dev/null || true)"
    printf '%s' "$remote" | grep -q 'github.com' || { printf 'claude-cloud: current repository needs a GitHub origin\n' >&2; exit 3; }
    exec "$ROOT/bin/with-subscription-cli.sh" claude --cloud "$*"
    ;;
  *) printf 'usage: claude-cloud.sh <doctor|run> [prompt]\n' >&2; exit 64 ;;
esac
