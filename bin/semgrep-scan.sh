#!/usr/bin/env bash
#
# semgrep-scan.sh — deterministic Semgrep gate for the fleet (wrapped by mise:
#   mise run security:semgrep        → --full
#   mise run security:semgrep:fast   → --fast   (diff-aware, inner-loop)
#   mise run security:rules:test     → --test   (validate + unit-test custom rules)
#
# Uses the CURRENT Semgrep architecture: the `semgrep` main binary, OSS/CE engine
# (`--oss-only`, login-free — no SEMGREP_APP_TOKEN needed). The archived standalone
# `semgrep-mcp` is NOT used; interactive MCP is `semgrep mcp` (see .mcp.json).
#
# Rules (hierarchy per ADR-0001): community baseline (../templates/lint-stack/.semgrep)
# + custom fleet invariants (../templates/lint-stack/semgrep-custom). Project repos
# extend these; they never fork copies.
#
# Output: human summary (counts by severity) to stdout; add --json for the uniform
# machine-readable envelope. NEVER prints matched source fragments in --json summary.
# Exit: 0 clean/skipped · 1 findings at/above --error threshold · 2 usage · 3 rule-test failed.

set -uo pipefail

MODE="${1:---full}"
shift || true
JSON=0
for a in "$@"; do [ "$a" = "--json" ] && JSON=1; done

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$ROOT" ] && ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CUSTOM_DIR="${ROOT}/templates/lint-stack/semgrep-custom"
BASELINE="${ROOT}/templates/lint-stack/.semgrep/baseline.yml"
TESTS_DIR="${CUSTOM_DIR}/tests"

log() { printf 'semgrep-scan: %s\n' "$*" >&2; }

if ! command -v semgrep >/dev/null 2>&1; then
  log "semgrep not on PATH — skipping (install via: mise install, or 'uv tool install semgrep==1.180.0'). Non-blocking."
  exit 0
fi

# Rule configs that actually exist (custom dir always; baseline if present).
configs=(--config "$CUSTOM_DIR")
[ -f "$BASELINE" ] && configs+=(--config "$BASELINE")

run_scan() {
  local target="$1"
  shift
  # --oss-only: force login-free CE engine. --metrics=off: no telemetry. Exclude
  # our own rule fixtures (they are deliberately-bad samples, not real code).
  semgrep scan "${configs[@]}" --oss-only --metrics=off --error \
    --exclude 'tests' --exclude '.terraform' --exclude 'node_modules' \
    "$@" "$target"
}

case "$MODE" in
  --full | full)
    log "full scan: ${ROOT}"
    if [ "$JSON" = 1 ]; then
      run_scan "$ROOT" --json | jq '{errors: ([.results[]|select(.extra.severity=="ERROR")]|length), warnings: ([.results[]|select(.extra.severity=="WARNING")]|length), info: ([.results[]|select(.extra.severity=="INFO")]|length), paths_scanned: (.paths.scanned|length)}'
      exit "${PIPESTATUS[0]}"
    fi
    run_scan "$ROOT"
    ;;
  --fast | fast)
    base="$(git merge-base HEAD "@{upstream}" 2>/dev/null || git rev-parse HEAD~1 2>/dev/null || git rev-parse HEAD)"
    log "fast diff-aware scan since ${base}"
    run_scan "$ROOT" --baseline-commit "$base"
    ;;
  --test | test)
    log "validating custom rule syntax"
    if ! semgrep --validate --config "$CUSTOM_DIR" >/dev/null 2>&1; then
      semgrep --validate --config "$CUSTOM_DIR"
      log "rule validation FAILED"
      exit 3
    fi
    log "unit-testing custom rules against fixtures"
    if [ -d "$TESTS_DIR" ]; then
      semgrep --test --config "$CUSTOM_DIR" "$TESTS_DIR" || {
        log "rule fixtures FAILED"
        exit 3
      }
    else
      log "no fixtures dir ($TESTS_DIR) — validation only"
    fi
    log "custom rules valid + fixtures pass"
    ;;
  *)
    log "usage: semgrep-scan.sh [--full|--fast|--test] [--json]"
    exit 2
    ;;
esac
