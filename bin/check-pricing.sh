#!/usr/bin/env bash
# check-pricing.sh — detect stale or unannotated pricing references in the docs.
# Per pass-58→61 manual-audit pattern. Mechanizes the pricing-staleness check
# that caught 5 latent bugs (Opus pricing direction, $15/$75 vs $5/$25,
# Haiku 3.5 → 4.5, Workers CPU-ms 625× off, D1 included-tier missing).
#
# A pricing reference is any line matching $N/MTok, $N/GB-month, or
# $N.NN/M variants. Each must have a "verified YYYY-MM-DD" annotation
# within N (default 3) lines for the audit to consider it CURRENT.
#
# R30: a second ADVISORY-ONLY pass surfaces processing fees (N.N% + N¢)
# and SaaS tiers ($N/mo) — the vendor-repricing class — with an allowlist
# that drops illustrative amounts (presets, e.g./example, ~approx). These
# never fail the build; they flag volatile claims worth a dated annotation.
#
# Usage:
#   bash ~/.agentskills/bin/check-pricing.sh [--json] [--max-age-days N]
#
# --json: uniform envelope per rules/uniform-json-output.md (6th caller of
#         bin/lib/emit-json.sh).
# --max-age-days: default 90. References older than this are flagged "stale".

set -uo pipefail

JSON=0
MAX_AGE_DAYS=90
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    --max-age-days=*) MAX_AGE_DAYS="${arg#--max-age-days=}" ;;
  esac
done

SKILLS_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SKILLS_ROOT" || exit 1

# shellcheck source=lib/emit-json.sh
. "$SKILLS_ROOT/bin/lib/emit-json.sh"

CURRENT=0
STALE=0
UNANNOTATED=0
REFS=()
STATUSES=()
AGES=()
LOCATIONS=()

TODAY_EPOCH=$(date -u +%s)

[ "$JSON" = "0" ] && printf '▸ Scanning pricing references (max age=%d days)...\n' "$MAX_AGE_DAYS" >&2

# Find every pricing-like reference in the docs surface.
# Pass-101: scripts/*.sh + bin/check-pricing.sh added per the scope-completeness
# discipline (rules/lint-doctrine.md § Codified incidents row 12, pass-100).
# Note: bin/check-pricing.sh self-scans intentionally to validate its own regex.
HITS=()
while IFS= read -r _hit; do HITS+=("$_hit"); done < <(
  grep -rnE '\$[0-9]+(\.[0-9]+)?(/MTok|/GB-month|/M (requests|extra requests|rows-read|rows-written|reads|writes|CPU-ms))' \
    rules/*.md \
    [0-9][0-9]-*/*.md \
    CONVENTIONS.md \
    SKILL_PROFILES.md \
    README.md \
    agents/*.md \
    scripts/*.sh \
    2>/dev/null
)

for hit in "${HITS[@]}"; do
  # Parse `<file>:<line>:<content>`
  file="${hit%%:*}"
  rest="${hit#*:}"
  line_no="${rest%%:*}"
  content="${rest#*:}"
  loc="${file}:${line_no}"

  # Check for a "verified YYYY-MM-DD" annotation within ±3 lines.
  start=$((line_no > 3 ? line_no - 3 : 1))
  end=$((line_no + 3))
  ctx=$(awk -v s="$start" -v e="$end" 'NR>=s && NR<=e' "$file" 2>/dev/null)
  annot=$(printf '%s\n' "$ctx" | grep -oiE 'verified [0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1)

  REFS+=("${content:0:80}")
  LOCATIONS+=("$loc")

  if [ -z "$annot" ]; then
    UNANNOTATED=$((UNANNOTATED + 1))
    STATUSES+=("unannotated")
    AGES+=("-1")
    [ "$JSON" = "0" ] && printf '  ⊝ no-annot  %s\n' "$loc" >&2
  else
    # Strip "verified " or "Verified " prefix (case-insensitive matched above).
    annot_date="${annot##* }"
    annot_epoch=$(date -j -u -f "%Y-%m-%d" "$annot_date" "+%s" 2>/dev/null || date -u -d "$annot_date" "+%s" 2>/dev/null || echo 0)
    age_days=$(((TODAY_EPOCH - annot_epoch) / 86400))
    AGES+=("$age_days")
    if [ "$age_days" -le "$MAX_AGE_DAYS" ]; then
      CURRENT=$((CURRENT + 1))
      STATUSES+=("current")
      [ "$JSON" = "0" ] && printf '  ✓ %dd      %s\n' "$age_days" "$loc" >&2
    else
      STALE=$((STALE + 1))
      STATUSES+=("stale")
      [ "$JSON" = "0" ] && printf '  ✗ %dd      %s (re-verify)\n' "$age_days" "$loc" >&2
    fi
  fi
done

# --- Fee/tier advisory pass (R30) ---------------------------------------
# Processing fees (N.N% + N¢) and SaaS tiers ($N/mo) are the vendor-repricing
# class pass-2 kept finding stale (Inngest/Square/Auth0/Clerk). They are
# ADVISORY-ONLY (never fail the build) — surfaced so volatile claims can be
# dated deliberately. The allowlist suppresses illustrative amounts (donation
# preset arrays, e.g./example/~approx lines) so the list stays signal.
FEE_TIER=0
FEE_TIER_DATED=0
FEE_TIER_LOCS=()
while IFS= read -r _hit; do
  [ -z "$_hit" ] && continue
  FEE_TIER=$((FEE_TIER + 1))
  _ft_file="${_hit%%:*}"
  _ft_line="$(printf '%s' "${_hit#*:}" | cut -d: -f1)"
  # Dated-vs-undated (±3 lines) so deliberate annotation shows as progress.
  # Still ADVISORY — neither count fails the build.
  _ft_s=$((_ft_line > 3 ? _ft_line - 3 : 1))
  _ft_e=$((_ft_line + 3))
  if awk -v s="$_ft_s" -v e="$_ft_e" 'NR>=s && NR<=e' "$_ft_file" 2>/dev/null \
    | grep -qiE 'verified [0-9]{4}-[0-9]{2}-[0-9]{2}'; then
    FEE_TIER_DATED=$((FEE_TIER_DATED + 1))
  else
    FEE_TIER_LOCS+=("${_ft_file}:${_ft_line}")
  fi
done < <(
  grep -rnE '([0-9]+\.[0-9]+%[ ]?\+[ ]?(\$?[0-9]+(\.[0-9]+)?|[0-9]+¢)|\$[0-9]+/(mo|month)\b)' \
    rules/*.md \
    [0-9][0-9]-*/*.md \
    CONVENTIONS.md \
    agents/*.md \
    commands/*.md \
    2>/dev/null \
    | grep -viE '(preset|e\.g\.|example|illustrative|round up|~\$|(\$[0-9]+/){2,})'
)

TOTAL=${#REFS[@]}
EXIT=0
[ "$STALE" -gt 0 ] && EXIT=1

if [ "$JSON" = "0" ]; then
  printf '\n━━━ SUMMARY: %d total · %d current · %d stale · %d unannotated\n' \
    "$TOTAL" "$CURRENT" "$STALE" "$UNANNOTATED" >&2
  if [ "$STALE" -gt 0 ]; then
    printf '✗ %d pricing reference(s) older than %d days — re-verify per pass-61 doctrine\n' "$STALE" "$MAX_AGE_DAYS" >&2
  elif [ "$UNANNOTATED" -gt 0 ]; then
    printf '⊝ %d pricing reference(s) lack "verified YYYY-MM-DD" annotation — add one within ±3 lines\n' "$UNANNOTATED" >&2
  else
    printf '✓ all pricing references current\n' >&2
  fi
  if [ "$FEE_TIER" -gt 0 ]; then
    printf 'ℹ %d fee/tier ref(s) (N%%+N¢ / $N/mo) — advisory · %d dated / %d undated:\n' \
      "$FEE_TIER" "$FEE_TIER_DATED" $((FEE_TIER - FEE_TIER_DATED)) >&2
    for l in "${FEE_TIER_LOCS[@]}"; do printf '    · %s (date if a vendor claim)\n' "$l" >&2; done
  fi
fi

if [ "$JSON" = "1" ]; then
  META_TS=$(emit_iso_ts)
  META_GIT_SHA=$(emit_git_sha "$SKILLS_ROOT")
  META_BLOCK=$(emit_meta_block "$SKILLS_ROOT" "$META_TS" "$META_GIT_SHA" "default")
  printf '{%s,"refs":[' "$META_BLOCK"
  for i in "${!REFS[@]}"; do
    [ "$i" -gt 0 ] && printf ','
    printf '{"location":"%s","status":"%s","age_days":%d,"content":"%s"}' \
      "$(json_escape "${LOCATIONS[$i]}")" \
      "$(json_escape "${STATUSES[$i]}")" \
      "${AGES[$i]}" \
      "$(json_escape "${REFS[$i]}")"
  done
  printf '],"summary":{"total":%d,"current":%d,"stale":%d,"unannotated":%d,"fee_tier_advisory":%d,"fee_tier_dated":%d,"max_age_days":%d,"exit":%d}}\n' \
    "$TOTAL" "$CURRENT" "$STALE" "$UNANNOTATED" "$FEE_TIER" "$FEE_TIER_DATED" "$MAX_AGE_DAYS" "$EXIT"
fi

exit "$EXIT"
