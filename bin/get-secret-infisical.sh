#!/usr/bin/env bash
#
# get-secret-infisical.sh — the Infisical-backed secret resolver for machines that DON'T have the
# chezmoi/age `get-secret` rail or Cloudflare Secrets Store (the Proxmox Ubuntu VM / `codexrye`,
# GitHub self-hosted runners, DeskLink-provisioned desktops). Install it AS `get-secret` on those
# machines (symlink `~/.local/bin/get-secret -> this`) so EVERY existing `get-secret KEY` call across
# the agent skills resolves transparently via Infisical — one universal interface, machine-scoped backend.
#
# Precedence (most-local first): process env var → Infisical. The resolved secret is the ONLY thing on
# stdout (machine-readable, unquoted); it is NEVER logged/echoed. Diagnostics go to stderr.
#
# Auth (non-interactive — no `infisical login`): a MACHINE IDENTITY token in `INFISICAL_TOKEN`
# (universal-auth / OIDC exchange), scoped least-privilege per environment. Config via env:
#   INFISICAL_TOKEN       machine-identity access token (or GitHub Actions OIDC-exchanged token)
#   INFISICAL_PROJECT_ID  the Infisical project/workspace id
#   INFISICAL_ENV         environment slug: dev | preview | prod   (default: prod)
#   INFISICAL_API_URL     optional self-hosted base url
#
# Exit: 0 ok (value on stdout) · 2 usage · 3 unavailable (not in env + Infisical absent/unconfigured).
# NOTE: verify `infisical secrets get` flags against the installed CLI version at setup; this uses the
# documented `--plain --silent --env --projectId` form (Infisical CLI ≥0.x). Never prints the value.

set -uo pipefail

# Styling is optional on bare machines — source if present, else printf-to-stderr fallbacks.
# shellcheck disable=SC1091
if [ -f "${HOME}/.claude/hooks/style.sh" ]; then source "${HOME}/.claude/hooks/style.sh"; fi
command -v emdash_error >/dev/null 2>&1 || {
  emdash_error() { printf 'get-secret-infisical: %s\n' "$*" >&2; }
  emdash_info() { printf 'get-secret-infisical: %s\n' "$*" >&2; }
}

NAME="${1:-}"
if [ -z "$NAME" ]; then
  emdash_error "usage: get-secret-infisical.sh <SECRET_NAME>"
  exit 2
fi

# 1. Process env wins — identical fast path to the chezmoi `get-secret` (keeps behavior uniform).
if [ -n "${!NAME:-}" ]; then
  printf '%s' "${!NAME}"
  exit 0
fi

# 2. Infisical machine-identity lookup.
if command -v infisical >/dev/null 2>&1; then
  ENV_SLUG="${INFISICAL_ENV:-prod}"
  args=(secrets get "$NAME" --plain --silent --env "$ENV_SLUG")
  [ -n "${INFISICAL_PROJECT_ID:-}" ] && args+=(--projectId "$INFISICAL_PROJECT_ID")
  [ -n "${INFISICAL_API_URL:-}" ] && args+=(--domain "$INFISICAL_API_URL")
  # INFISICAL_TOKEN (machine identity) is read by the CLI from the env automatically.
  if value="$(infisical "${args[@]}" 2>/dev/null)" && [ -n "$value" ]; then
    printf '%s' "$value"
    exit 0
  fi
  emdash_error "'$NAME' not found in Infisical env '${ENV_SLUG}' (check INFISICAL_TOKEN/OIDC + INFISICAL_PROJECT_ID + the secret exists)"
  exit 3
fi

emdash_error "'$NAME' unavailable — not in process env, and the 'infisical' CLI is absent. Install it + set INFISICAL_TOKEN + INFISICAL_PROJECT_ID (+ INFISICAL_ENV), or use the chezmoi get-secret on a configured dev machine."
exit 3
