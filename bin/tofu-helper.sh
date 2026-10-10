#!/usr/bin/env bash
#
# tofu-helper.sh — OpenTofu lifecycle wrapper (wrapped by mise: infra:fmt/validate/test/plan/drift).
#
# BOUNDARY (ADR-0001 § OpenTofu): OpenTofu owns LONG-LIVED infrastructure topology
# (zones/DNS/R2/D1/KV/Queues/Access). Wrangler/app-CI owns frequently-changing Worker
# code. Never let both believe they own the same resource.
#
# Roots are discovered from tracked *.tf files (excluding .terraform + example modules
# under templates/). Static ops (fmt/validate/test) need NO credentials and NO backend.
# plan/drift need creds (CLOUDFLARE_API_TOKEN via get-secret) + a configured backend; if
# none is under management yet they report cleanly instead of failing.
#
# STATE never touches git (.gitignore). Backend/locking choice: R2 WITHOUT native
# use_lockfile (OpenTofu #4405 is CLOSED "not planned" — self-collision risk) + the
# repo-scoped execution lock. See rules/opentofu-infrastructure.md.
# Exit: 0 ok/skip · 1 op failed · 2 usage · 3 destructive plan needs approval.

set -uo pipefail

CMD="${1:-validate}"
shift || true

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$ROOT" ] && ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf 'tofu-helper: %s\n' "$*" >&2; }

if ! command -v tofu >/dev/null 2>&1; then
  log "tofu not on PATH — install via 'mise install' (opentofu is pinned in mise.toml). Non-blocking skip."
  exit 0
fi

# Discover roots = dirs with tracked .tf files, minus vendored/example trees.
discoverRoots() {
  git -C "$ROOT" ls-files '*.tf' 2>/dev/null \
    | sed 's#/[^/]*$##' | sort -u \
    | grep -vE '(^|/)\.terraform(/|$)' || true
}

mapfile -t ROOTS < <(discoverRoots)
# Only treat template/example modules as validate-targets, not plan/apply targets.
realRoots() { printf '%s\n' "${ROOTS[@]}" | grep -vE '(^|/)templates/' || true; }

if [ "${#ROOTS[@]}" -eq 0 ]; then
  log "no OpenTofu roots tracked yet — authoring doctrine + templates only (see rules/opentofu-infrastructure.md)."
  [ "$CMD" = "drift" ] && echo "infra:drift — no roots under management (clean)"
  exit 0
fi

case "$CMD" in
  fmt)
    log "tofu fmt -check across ${#ROOTS[@]} root(s)"
    rc=0
    for r in "${ROOTS[@]}"; do tofu -chdir="$ROOT/$r" fmt -check -recursive -diff || rc=1; done
    exit "$rc"
    ;;
  validate)
    log "backend-free init + validate across ${#ROOTS[@]} root(s)"
    rc=0
    for r in "${ROOTS[@]}"; do
      (cd "$ROOT/$r" && tofu init -backend=false -input=false >/dev/null 2>&1 \
        && { tofu validate -lint=all 2>/dev/null || tofu validate; }) || {
        log "validate failed: $r"
        rc=1
      }
    done
    exit "$rc"
    ;;
  test)
    log "tofu test (plan-only assertions; no real resources)"
    rc=0
    for r in "${ROOTS[@]}"; do
      if ls "$ROOT/$r"/*.tftest.hcl >/dev/null 2>&1; then
        (cd "$ROOT/$r" && tofu test) || rc=1
      fi
    done
    exit "$rc"
    ;;
  plan | drift)
    mapfile -t MANAGED < <(realRoots)
    if [ "${#MANAGED[@]}" -eq 0 ]; then
      echo "infra:${CMD} — no managed (non-template) roots yet (clean)"
      exit 0
    fi
    if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
      log "no CLOUDFLARE_API_TOKEN in env — resolve via: export CLOUDFLARE_API_TOKEN=\$(get-secret CLOUDFLARE_API_TOKEN). Skipping ${CMD}."
      exit 0
    fi
    rc=0
    for r in "${MANAGED[@]}"; do
      (cd "$ROOT/$r" && tofu init -input=false >/dev/null \
        && tofu plan -input=false -detailed-exitcode -no-color)
      ec=$?
      # -detailed-exitcode: 0 no-change · 1 error · 2 changes-present
      if [ "$ec" = 1 ]; then rc=1; fi
      [ "$CMD" = "drift" ] && [ "$ec" = 2 ] && log "DRIFT in $r (plan has changes)"
    done
    exit "$rc"
    ;;
  *)
    log "usage: tofu-helper.sh [fmt|validate|test|plan|drift]"
    exit 2
    ;;
esac
