#!/usr/bin/env bash
# check-harness-manifests.sh — assert the generated harness manifests
# (.opencode/config.json, .codex-plugin/plugin.json, .kimi-plugin/plugin.json)
# reference only files that EXIST and track the real category count.
#
# Why: fire-1 of the cross-agent arc (2026-10-03) found .opencode/config.json
# listing FOUR dead SKILL.md paths (03/18/19/20 — retired in the Sep re-arch)
# and missing 21-28 entirely — OpenCode consumers were loading a manifest that
# 404s. bin/gen-harness-manifests.mjs regenerates; this gate catches drift
# (generated-artifact class per rules/drift-detection.md — no soak period).
#
# Usage: bash bin/check-harness-manifests.sh

set -uo pipefail

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 1

EXIT=0
CATS_ACTUAL=$(find . -maxdepth 1 -type d -name '[0-9][0-9]-*' | wc -l | tr -d ' ')

checkManifest() {
  mf="$1"
  mfdir=$(dirname "$mf")
  if [ ! -f "$mf" ]; then
    printf '✗ %s missing — run "node bin/gen-harness-manifests.mjs"\n' "$mf" >&2
    EXIT=1
    return
  fi
  while IFS= read -r p; do
    [ -z "$p" ] && continue
    # Manifest paths may be repo-root-relative OR manifest-dir-relative (kimi
    # emits ../..). Accept if EITHER resolution exists.
    if [ ! -e "$p" ] && [ ! -e "$mfdir/$p" ]; then
      printf '✗ %s references missing file: %s\n' "$mf" "$p" >&2
      EXIT=1
    fi
  done <<<"$(grep -oE '"(path|files)": ?"[^"]+"|^ *"[^"]+\.md",?$' "$mf" | grep -oE '[A-Za-z0-9_./-]+\.md')"
  SKILL_COUNT=$(grep -c 'SKILL\.md' "$mf" | tr -d ' ')
  if [ "$SKILL_COUNT" != "0" ] && [ "$SKILL_COUNT" != "$CATS_ACTUAL" ]; then
    printf '✗ %s lists %s SKILL.md entries — actual categories %s (regen: node bin/gen-harness-manifests.mjs)\n' "$mf" "$SKILL_COUNT" "$CATS_ACTUAL" >&2
    EXIT=1
  fi
}

for mf in .opencode/config.json .codex-plugin/plugin.json .kimi-plugin/plugin.json; do
  checkManifest "$mf"
done

if [ "$EXIT" = "0" ]; then
  printf '✓ harness manifests current — %s categories, all referenced files exist\n' "$CATS_ACTUAL" >&2
fi
exit "$EXIT"
