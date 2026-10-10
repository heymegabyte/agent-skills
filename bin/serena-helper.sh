#!/usr/bin/env bash
#
# serena-helper.sh — worktree-aware Serena semantic-index driver (wrapped by mise:
#   mise run semantic:index    → index
#   mise run semantic:doctor   → doctor
#
# WORKTREE-AWARE BY DESIGN (ADR-0001 § Serena): always binds to the CURRENT working
# dir, NEVER a fixed canonical checkout — the fleet runs from ~/ai/worktrees/<repo>/<run-id>,
# and Serena must index the tree the agent is actually editing. Per-project data lives in
# ./.serena (project.yml + memories committed; cache/ + logs/ + project.local.yml gitignored).
# Serena auto-updates its index after file changes, so we index ONCE per fresh worktree.
#
# Install (reproducible): `uv tool install -p 3.13 serena-agent` (v1.7.0 recommended;
# avoid the marketplace). Fallback: pinned uvx. Memory stays NON-canonical (git is truth):
# we run with the `no-memories` concern disabled only where configured.
# Exit: 0 ok/skipped · 2 usage.

set -uo pipefail

CMD="${1:-doctor}"
shift || true
JSON=0
for a in "$@"; do [ "$a" = "--json" ] && JSON=1; done

CWD="$(pwd)"
PROJECT_DIR="${CWD}/.serena"
CACHE_DIR="${PROJECT_DIR}/cache"
SERENA_REF="v1.7.0"

log() { printf 'serena-helper: %s\n' "$*" >&2; }

# Resolve a runnable serena: prefer an installed binary, else pinned uvx.
resolveSerena() {
  if command -v serena >/dev/null 2>&1; then
    SERENA=(serena)
  elif command -v uvx >/dev/null 2>&1; then
    SERENA=(uvx --from "git+https://github.com/oraios/serena@${SERENA_REF}" serena)
  else
    SERENA=()
  fi
}

resolveSerena

case "$CMD" in
  index)
    if [ "${#SERENA[@]}" -eq 0 ]; then
      log "serena unavailable — install: uv tool install -p 3.13 serena-agent  (non-blocking skip)"
      exit 0
    fi
    log "indexing worktree ${CWD} (bound to cwd, not a fixed checkout)"
    "${SERENA[@]}" project index --project "$CWD" 2>&1 | tail -5 || {
      log "index returned nonzero (often harmless on first run) — continuing"
    }
    ;;
  doctor)
    # Truthful: "yes" only if the serena binary is installed; "via-uvx" if only the
    # uvx runtime fallback is available (would download on first use); else "no".
    if command -v serena >/dev/null 2>&1; then
      installed="yes"
    elif command -v uvx >/dev/null 2>&1; then
      installed="via-uvx"
    else installed="no"; fi
    has_project="no"
    [ -f "${PROJECT_DIR}/project.yml" ] && has_project="yes"
    freshness="never"
    if [ -d "$CACHE_DIR" ]; then
      newest="$(find "$CACHE_DIR" -type f -exec stat -f '%m' {} \; 2>/dev/null | sort -rn | head -1)"
      if [ -n "${newest:-}" ]; then
        age_d=$(((${EPOCHSECONDS:-$(date +%s)} - newest) / 86400))
        freshness="${age_d}d old"
      fi
    fi
    if [ "$JSON" = 1 ]; then
      printf '{"serena_installed":"%s","project_activated":"%s","index_freshness":"%s","worktree":"%s"}\n' \
        "$installed" "$has_project" "$freshness" "$CWD"
    else
      printf 'Serena: installed=%s · project=%s · index=%s · worktree=%s\n' \
        "$installed" "$has_project" "$freshness" "$CWD"
    fi
    ;;
  *)
    log "usage: serena-helper.sh [index|doctor] [--json]"
    exit 2
    ;;
esac
