#!/usr/bin/env bash
#
# research-orchestrator.sh — the deterministic, gum-logged driver for the
# RESEARCH EXPANSION phase at the beginning of a build/prompt.
#
# WHY THIS EXISTS (rules/research-expansion-orchestration.md + agent-provider-policy.md):
#   Internal research that used to reach for the OpenAI / Anthropic *APIs* is now handled by
#   the SUBSCRIPTION CLIs — `claude` (deep/judgment research + synthesis) and `codex`
#   (independent heavy researcher / second angle, when authed) — plus OpenCode+DeepSeek for
#   high-throughput breadth (enumeration, many-source scans, candidate generation). This script
#   makes that routing deterministic (hooks > rules > prompts) and emits rich `gum` output so a
#   human can SEE: how many research sessions the work broke into, a summary of what each
#   claude/codex/opencode session returned, whether each session was RUN (+why) or skipped
#   (+why), and whether its result was USED in the final plan (+why).
#
# All human output goes through the `emdash_*` wrappers (gum-backed, CI-safe fallback) + direct
# `gum` for tables/boxes; machine-readable output (the result-file path) is the ONLY thing on
# stdout. Never prints a secret (the DeepSeek key is injected by opencode-deepseek.sh into its
# child only). CI-safe: every gum/optional-CLI call is guarded + degrades.
#
# Subcommands:
#   phase  "<title>" ["<detail>"]                         announce a major step
#   plan   <N> ["<thesis>"]                               "research expansion started → N sessions"
#   run    --k K --n N --provider claude|codex|opencode --role "…" --question "…" \
#            [--model M] [--timeout S] [--out FILE] [--dry-run]
#                                                         RUN a session via the right CLI, log
#                                                         before/after + summary; prints OUT path
#   log-result --k K --n N --provider P --role "…" --question "…" --result-file FILE
#                                                         log an already-produced result (no CLI call)
#   skip   --k K --provider P --role "…" [--question "…"] --why "…"
#                                                         a session deliberately NOT run (+why)
#   verdict --k K --provider P --used yes|no --why "…"    was the result USED in the plan (+why)
#   summary                                               final gum table + counts (reads the ledger)
#
# Ledger: $RESEARCH_DIR/sessions.ndjson (default ./.research). Secret-free. Per-session output:
#   $RESEARCH_DIR/session-<k>-<provider>.md
#
# Exit: 0 ok · 2 usage · 3 provider unavailable (session skipped) · * child exit passed through.

set -uo pipefail

# ---------------------------------------------------------------------------- styling + env
# shellcheck disable=SC1091
if [ -f "${HOME}/.claude/hooks/style.sh" ]; then source "${HOME}/.claude/hooks/style.sh"; fi
# Minimal fallbacks if style.sh is absent (keeps the script CI-safe standalone).
if ! command -v emdash_header >/dev/null 2>&1; then
  emdash_header() { printf '\n== %s ==\n' "$*" >&2; }
  emdash_log() { printf '  %s\n' "$1" >&2; }
  emdash_success() { printf '  [ok] %s\n' "$*" >&2; }
  emdash_warn() { printf '  [warn] %s\n' "$*" >&2; }
  emdash_info() { printf '  [i] %s\n' "$*" >&2; }
  emdash_error() { printf '  [err] %s\n' "$*" >&2; }
fi

HAS_GUM=0
command -v gum >/dev/null 2>&1 && HAS_GUM=1
HAS_JQ=0
command -v jq >/dev/null 2>&1 && HAS_JQ=1
HAS_GLOW=0
command -v glow >/dev/null 2>&1 && HAS_GLOW=1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESEARCH_DIR="${RESEARCH_DIR:-${PWD}/.research}"
LEDGER="${RESEARCH_DIR}/sessions.ndjson"
mkdir -p "${RESEARCH_DIR}"

# Brand palette (black #060610 / cyan #00E5FF) + per-provider accent.
C_CYAN="#00E5FF"
C_PURPLE="#7C3AED"
C_AMBER="#F5A623"
C_DIM="#6B7280"
C_GREEN="#00E5A8"
provider_color() { case "$1" in claude) printf '%s' "$C_CYAN" ;; codex) printf '%s' "$C_PURPLE" ;; opencode) printf '%s' "$C_AMBER" ;; *) printf '%s' "$C_DIM" ;; esac }
provider_label() { case "$1" in claude) printf 'claude (Claude subscription · deep/judgment)' ;; codex) printf 'codex (ChatGPT subscription · independent)' ;; opencode) printf 'opencode (DeepSeek · throughput)' ;; *) printf '%s' "$1" ;; esac }

# gum box helper (border + title), fallback to emdash.
box() { # box <title> <color> <body>
  if [ "$HAS_GUM" = "1" ]; then
    { gum style --border rounded --border-foreground "$2" --padding "0 1" --margin "0 0 0 2" \
      "$(gum style --foreground "$2" --bold "$1")" "$3"; } >&2
  else
    emdash_info "$1"
    printf '%s\n' "$3" >&2
  fi
}

# glow markdown renderer (stylized); fallback to `gum format`, then raw cat. Human
# output → stderr (stdout stays machine-readable). Forces a style so it renders even
# when stdout is captured (non-TTY), e.g. inside the agent's tool-result stream.
glow_md() { # glow_md <markdown-file>
  local f="$1"
  [ -s "$f" ] || {
    emdash_warn "(nothing to render: $f)"
    return
  }
  if [ "$HAS_GLOW" = "1" ]; then
    glow --style dark --width "${GLOW_WIDTH:-100}" "$f" >&2 2>/dev/null || cat "$f" >&2
  elif [ "$HAS_GUM" = "1" ]; then
    gum format <"$f" >&2 2>/dev/null || cat "$f" >&2
  else
    cat "$f" >&2
  fi
}

# JSON string escaper (jq when present; minimal fallback otherwise).
json_str() { if [ "$HAS_JQ" = "1" ]; then jq -Rn --arg s "$1" '$s'; else printf '"%s"' "$(printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/ /g' | tr '\n' ' ')"; fi; }

ledger_append() { printf '%s\n' "$1" >>"${LEDGER}"; }

now_iso() { date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || printf 'unknown'; }

# ---------------------------------------------------------------------------- availability
provider_available() { # provider_available <provider> -> 0 available, 1 not; reason on stdout
  local p="$1"
  case "$p" in
    claude)
      command -v claude >/dev/null 2>&1 || {
        printf 'claude CLI not on PATH'
        return 1
      }
      return 0
      ;;
    codex)
      command -v codex >/dev/null 2>&1 || {
        printf 'codex CLI not on PATH (not provided) — claude covers this angle'
        return 1
      }
      # treat presence as provided; auth is validated by the CLI itself at run time
      return 0
      ;;
    opencode)
      command -v opencode >/dev/null 2>&1 || {
        printf 'opencode not on PATH'
        return 1
      }
      if command -v get-secret >/dev/null 2>&1; then
        [ -n "$(get-secret DEEPSEEK_API_KEY 2>/dev/null || true)" ] || {
          printf 'DEEPSEEK_API_KEY unavailable from get-secret'
          return 1
        }
      fi
      return 0
      ;;
    *)
      printf 'unknown provider %s' "$p"
      return 1
      ;;
  esac
}

# ---------------------------------------------------------------------------- provider run
run_provider() { # run_provider <provider> <prompt> <model> <timeout> <outfile> -> fills outfile, returns child status
  local p="$1" prompt="$2" model="$3" tmo="$4" out="$5" sub="${SCRIPT_DIR}/with-subscription-cli.sh" oc="${SCRIPT_DIR}/opencode-deepseek.sh"
  local timeout_bin=""
  command -v timeout >/dev/null 2>&1 && timeout_bin="timeout ${tmo}"
  command -v gtimeout >/dev/null 2>&1 && timeout_bin="gtimeout ${tmo}"
  case "$p" in
    claude) ${timeout_bin} "$sub" claude -p "$prompt" >"$out" 2>>"${out}.err" ;;
    codex) ${timeout_bin} "$sub" codex exec "$prompt" >"$out" 2>>"${out}.err" ;;
    opencode) ${timeout_bin} "$oc" run -m "${model:-deepseek/deepseek-v4-pro}" "$prompt" >"$out" 2>>"${out}.err" ;;
    *) return 2 ;;
  esac
}

digest() { # digest <file> -> short human summary to stdout (first non-empty lines / char cap)
  local f="$1"
  [ -s "$f" ] || {
    printf '(empty output)'
    return
  }
  grep -v '^[[:space:]]*$' "$f" | head -c 1400
}

# ---------------------------------------------------------------------------- arg parse
getopt_val() { # getopt_val <name> <args...>; echoes value after --name
  local want="$1"
  shift
  while [ "$#" -gt 0 ]; do
    [ "$1" = "$want" ] && {
      printf '%s' "${2:-}"
      return
    }
    shift
  done
}
has_flag() {
  local want="$1"
  shift
  for a in "$@"; do [ "$a" = "$want" ] && return 0; done
  return 1
}

# ============================================================================ subcommands
cmd="${1:-}"
shift || true
case "$cmd" in
  phase)
    title="${1:-Research}"
    detail="${2:-}"
    emdash_header "◆ ${title}"
    [ -n "$detail" ] && emdash_log "$detail"
    ;;

  plan)
    n="${1:-?}"
    thesis="${2:-}"
    emdash_header "◆ RESEARCH EXPANSION — started"
    emdash_log "Decomposing the prompt into ${n} independent research session(s)."
    emdash_info "Routing: claude = deep/judgment · codex = independent 2nd angle (if provided) · opencode/DeepSeek = throughput breadth."
    [ -n "$thesis" ] && box "research thesis" "$C_CYAN" "$thesis"
    : >"${LEDGER}" # fresh ledger per expansion
    emdash_log "ledger: ${LEDGER}"
    ;;

  run)
    k="$(getopt_val --k "$@")"
    n="$(getopt_val --n "$@")"
    provider="$(getopt_val --provider "$@")"
    role="$(getopt_val --role "$@")"
    question="$(getopt_val --question "$@")"
    model="$(getopt_val --model "$@")"
    tmo="$(getopt_val --timeout "$@")"
    tmo="${tmo:-180}"
    out="$(getopt_val --out "$@")"
    out="${out:-${RESEARCH_DIR}/session-${k}-${provider}.md}"
    [ -n "$provider" ] && [ -n "$question" ] || {
      emdash_error "run: --provider and --question required"
      exit 2
    }
    color="$(provider_color "$provider")"
    # BEFORE
    if [ "$HAS_GUM" = "1" ]; then
      gum style --foreground "$color" --bold "▶ research session ${k}/${n} · $(provider_label "$provider")" >&2
      gum style --foreground "$C_DIM" "   role: ${role}" "   ask:  ${question}" >&2
    else
      emdash_log "▶ research session ${k}/${n} · $(provider_label "$provider") · ${role}: ${question}"
    fi
    # availability / launch decision
    if reason="$(provider_available "$provider")"; then
      emdash_info "does research: YES — ${provider} is provided; running (${role})."
      if has_flag --dry-run "$@"; then
        printf 'DRY-RUN: %s would research: %s\n' "$provider" "$question" >"$out"
      else
        emdash_info "researching via ${provider} (≤${tmo}s)…"
        run_provider "$provider" "$question" "$model" "$tmo" "$out" || emdash_warn "${provider} exited non-zero (partial output captured)"
      fi
      sum="$(digest "$out")"
      box "session ${k}/${n} · ${provider} · retrieved" "$color" "$sum"
      ledger_append "{\"k\":$(json_str "$k"),\"n\":$(json_str "$n"),\"provider\":$(json_str "$provider"),\"role\":$(json_str "$role"),\"question\":$(json_str "$question"),\"launched\":true,\"out\":$(json_str "$out"),\"used\":null,\"why\":null,\"at\":$(json_str "$(now_iso)")}"
      emdash_success "session ${k}/${n} complete → ${out}"
      printf '%s\n' "$out" # machine-readable: the result path (stdout)
    else
      emdash_warn "does research: NO — ${reason}."
      ledger_append "{\"k\":$(json_str "$k"),\"n\":$(json_str "$n"),\"provider\":$(json_str "$provider"),\"role\":$(json_str "$role"),\"question\":$(json_str "$question"),\"launched\":false,\"out\":null,\"used\":false,\"why\":$(json_str "skipped: ${reason}"),\"at\":$(json_str "$(now_iso)")}"
      exit 3
    fi
    ;;

  log-result)
    k="$(getopt_val --k "$@")"
    n="$(getopt_val --n "$@")"
    provider="$(getopt_val --provider "$@")"
    role="$(getopt_val --role "$@")"
    question="$(getopt_val --question "$@")"
    rf="$(getopt_val --result-file "$@")"
    [ -n "$provider" ] && [ -f "${rf:-/nonexistent}" ] || {
      emdash_error "log-result: --provider and --result-file (existing) required"
      exit 2
    }
    color="$(provider_color "$provider")"
    if [ "$HAS_GUM" = "1" ]; then gum style --foreground "$color" --bold "▶ research session ${k}/${n} · $(provider_label "$provider") (agent-run)" >&2; fi
    emdash_info "does research: YES — ${role} (${question})."
    box "session ${k}/${n} · ${provider} · retrieved" "$color" "$(digest "$rf")"
    ledger_append "{\"k\":$(json_str "$k"),\"n\":$(json_str "$n"),\"provider\":$(json_str "$provider"),\"role\":$(json_str "$role"),\"question\":$(json_str "$question"),\"launched\":true,\"out\":$(json_str "$rf"),\"used\":null,\"why\":null,\"at\":$(json_str "$(now_iso)")}"
    emdash_success "logged session ${k}/${n} (${provider})"
    ;;

  skip)
    k="$(getopt_val --k "$@")"
    provider="$(getopt_val --provider "$@")"
    role="$(getopt_val --role "$@")"
    question="$(getopt_val --question "$@")"
    why="$(getopt_val --why "$@")"
    [ -n "$provider" ] && [ -n "$why" ] || {
      emdash_error "skip: --provider and --why required"
      exit 2
    }
    emdash_warn "⏭ session ${k} · ${provider} · does research: NO — ${why}"
    ledger_append "{\"k\":$(json_str "$k"),\"n\":null,\"provider\":$(json_str "$provider"),\"role\":$(json_str "$role"),\"question\":$(json_str "$question"),\"launched\":false,\"out\":null,\"used\":false,\"why\":$(json_str "$why"),\"at\":$(json_str "$(now_iso)")}"
    ;;

  verdict)
    k="$(getopt_val --k "$@")"
    provider="$(getopt_val --provider "$@")"
    used="$(getopt_val --used "$@")"
    why="$(getopt_val --why "$@")"
    [ -n "$provider" ] && [ -n "$used" ] && [ -n "$why" ] || {
      emdash_error "verdict: --provider --used yes|no --why required"
      exit 2
    }
    if [ "$used" = "yes" ]; then
      if [ "$HAS_GUM" = "1" ]; then gum style --foreground "$C_GREEN" "✅ session ${k} · ${provider} · USED — ${why}" >&2; else emdash_success "session ${k} · ${provider} · USED — ${why}"; fi
    else
      if [ "$HAS_GUM" = "1" ]; then gum style --foreground "$C_DIM" "⏭ session ${k} · ${provider} · NOT USED — ${why}" >&2; else emdash_warn "session ${k} · ${provider} · NOT USED — ${why}"; fi
    fi
    # record verdict (append a verdict line; summary prefers the latest verdict per k+provider)
    ledger_append "{\"verdict\":true,\"k\":$(json_str "$k"),\"provider\":$(json_str "$provider"),\"used\":$([ "$used" = yes ] && echo true || echo false),\"why\":$(json_str "$why"),\"at\":$(json_str "$(now_iso)")}"
    ;;

  summary)
    emdash_header "◆ RESEARCH EXPANSION — summary"
    [ -s "$LEDGER" ] || {
      emdash_warn "no research ledger at ${LEDGER}"
      exit 0
    }
    if [ "$HAS_JQ" = "1" ]; then
      # Fold verdict lines into their session, then render.
      rows="$(jq -rs '
        (map(select(.verdict==true)) | map({key:(.k+"|"+.provider), value:.}) | from_entries) as $v
        | map(select(.verdict!=true))
        | map((. + ($v[.k+"|"+.provider] // {})) as $m
            | [ .k, .provider, (.role//"-"),
                (if .launched then "yes" else "no" end),
                (if $m.used==true then "USED" elif $m.used==false then "skip" else "pending" end),
                (($m.why // .why // "-")[0:48]) ] | @tsv)
        | .[]
      ' "$LEDGER" 2>/dev/null)"
      if [ "$HAS_GUM" = "1" ] && [ -n "$rows" ]; then
        { printf 'k\tprovider\trole\tran\tused\twhy\n%s\n' "$rows" | gum table --print --separator $'\t' --widths 3,9,22,4,8,50; } >&2 || printf '%s\n' "$rows" >&2
      else
        printf 'k\tprovider\trole\tran\tused\twhy\n%s\n' "$rows" >&2
      fi
      total="$(jq -rs '[.[]|select(.verdict!=true)]|length' "$LEDGER")"
      ran="$(jq -rs '[.[]|select(.verdict!=true and .launched==true)]|length' "$LEDGER")"
      cl="$(jq -rs '[.[]|select(.verdict!=true and .provider=="claude")]|length' "$LEDGER")"
      cx="$(jq -rs '[.[]|select(.verdict!=true and .provider=="codex")]|length' "$LEDGER")"
      oc="$(jq -rs '[.[]|select(.verdict!=true and .provider=="opencode")]|length' "$LEDGER")"
      used="$(jq -rs '[.[]|select(.verdict==true and .used==true)]|length' "$LEDGER")"
      box "research breakdown" "$C_CYAN" "$total session(s) · ran ${ran} · used ${used}
by provider → claude ${cl} · codex ${cx} · opencode ${oc}"
    else
      emdash_info "jq absent — raw ledger:"
      cat "$LEDGER" >&2
    fi
    ;;

  synth)
    # Render + record a SYNTHESIZED Claude Code prompt (the output of the research).
    title="$(getopt_val --title "$@")"
    title="${title:-synthesized prompt}"
    from="$(getopt_val --from "$@")"
    pf="$(getopt_val --prompt-file "$@")"
    inline="$(getopt_val --prompt "$@")"
    slug="$(printf '%s' "$title" | tr '[:upper:] ' '[:lower:]-' | tr -cd 'a-z0-9-' | cut -c1-40)"
    sf="${RESEARCH_DIR}/synth-${slug:-prompt}.md"
    if [ -n "$pf" ] && [ -f "$pf" ]; then
      cp "$pf" "$sf"
    elif [ -n "$inline" ]; then
      printf '%s\n' "$inline" >"$sf"
    else
      emdash_error "synth: --prompt-file FILE or --prompt \"text\" required"
      exit 2
    fi
    if [ "$HAS_GUM" = "1" ]; then
      gum style --foreground "$C_GREEN" --bold "🧠 SYNTHESIZED CLAUDE CODE PROMPT — ${title}" >&2
      [ -n "$from" ] && gum style --foreground "$C_DIM" "   synthesized from research: ${from}" >&2
    else
      emdash_header "SYNTHESIZED CLAUDE CODE PROMPT — ${title}"
      [ -n "$from" ] && emdash_log "synthesized from research: ${from}"
    fi
    glow_md "$sf"
    ledger_append "{\"synth\":true,\"title\":$(json_str "$title"),\"from\":$(json_str "${from:-}"),\"file\":$(json_str "$sf"),\"at\":$(json_str "$(now_iso)")}"
    emdash_success "synthesized prompt rendered → ${sf}"
    printf '%s\n' "$sf"
    ;;

  report)
    # Full, detailed, glow-rendered narrative: how claude/codex/opencode were used
    # (table + per-session detail) AND every synthesized Claude Code prompt.
    emdash_header "◆ RESEARCH → SYNTHESIS — full report"
    [ -s "$LEDGER" ] || {
      emdash_warn "no research ledger at ${LEDGER}"
      exit 0
    }
    rep="${RESEARCH_DIR}/REPORT.md"
    {
      printf '# Research → Synthesis report\n\n'
      printf '_How the subscription CLIs (claude · codex · opencode/DeepSeek) were used, and the Claude Code prompts synthesized from them._\n\n'
      if [ "$HAS_JQ" = "1" ]; then
        printf '## How the CLIs were used\n\n'
        printf '| k | provider | role | ran | used | why |\n|---|---|---|---|---|---|\n'
        jq -rs '
          (map(select(.verdict==true)) | map({key:((.k//"")+"|"+(.provider//"")), value:.}) | from_entries) as $v
          | map(select((.verdict|not) and (.synth|not)))
          | map((. + ($v[(.k//"")+"|"+(.provider//"")] // {})) as $m
              | "| \(.k // "-") | \(.provider // "-") | \(.role // "-") | \(if .launched then "yes" else "no" end) | \(if $m.used==true then "USED" elif $m.used==false then "no" else "pending" end) | \(($m.why // .why // "-")) |")
          | .[]' "$LEDGER" 2>/dev/null
        printf '\n## Per-session research detail\n\n'
        while IFS=$'\t' read -r k prov role q out; do
          [ -n "$prov" ] || continue
          printf '### session %s — %s (%s)\n\n' "${k:--}" "$prov" "${role:--}"
          [ -n "$q" ] && [ "$q" != "null" ] && printf '**Ask:** %s\n\n' "$q"
          if [ -n "$out" ] && [ "$out" != "null" ] && [ -f "$out" ]; then
            # shellcheck disable=SC2016  # literal markdown code-fence; %s is printf's
            printf '```\n%s\n```\n\n' "$(grep -v '^[[:space:]]*$' "$out" | head -c 2000)"
          fi
        done < <(jq -rs '.[]|select((.verdict|not) and (.synth|not) and .launched==true)|[.k,.provider,.role,.question,.out]|@tsv' "$LEDGER" 2>/dev/null)
        printf '## Synthesized Claude Code prompts\n\n'
        while IFS=$'\t' read -r title from file; do
          [ -n "$file" ] || continue
          printf '### %s\n\n' "${title:-prompt}"
          [ -n "$from" ] && [ "$from" != "null" ] && printf '_synthesized from: %s_\n\n' "$from"
          [ -f "$file" ] && printf '%s\n\n' "$(cat "$file")"
        done < <(jq -rs '.[]|select(.synth==true)|[.title,.from,.file]|@tsv' "$LEDGER" 2>/dev/null)
      else
        # shellcheck disable=SC2016  # literal markdown code-fence; %s is printf's
        printf '## Raw ledger (jq absent)\n\n```\n%s\n```\n' "$(cat "$LEDGER")"
      fi
    } >"$rep"
    glow_md "$rep"
    emdash_success "full report → ${rep}"
    printf '%s\n' "$rep"
    ;;

  *)
    emdash_header "research-orchestrator"
    emdash_log "subcommands: phase · plan · run · log-result · skip · verdict · synth · report · summary"
    emdash_log "see header of $(basename "${BASH_SOURCE[0]}") for flags. Doctrine: rules/research-expansion-orchestration.md"
    [ -n "$cmd" ] && {
      emdash_error "unknown subcommand: ${cmd}"
      exit 2
    }
    ;;
esac
