#!/usr/bin/env bash
#
# provider-capability.sh — read-only provider capability / auth / env-leak detector.
#
# Per rules/agent-provider-policy.md: internal dev-agent orchestration uses
# SUBSCRIPTION CLIs (`claude` via Claude sub, `codex` via ChatGPT sub) plus
# DeepSeek-via-OpenCode for high-volume implementation. It NEVER uses
# OPENAI_API_KEY / ANTHROPIC_API_KEY for internal work (DeepSeek API via
# `get-secret DEEPSEEK_API_KEY` IS allowed).
#
# This script inspects the local machine and emits ONE JSON object to stdout
# describing which providers are installed/authenticated, whether the DeepSeek
# secret is present (PRESENCE only — the value is never read or printed), and
# whether any forbidden API-key env var is leaking into the environment.
#
# Invariants:
#   - NEVER prints a secret value.
#   - NEVER triggers an interactive / browser login (status probes only).
#   - Read-only: no state is mutated anywhere.
#   - Always exits 0 (detection is reported in the JSON, not the exit code).
#
# Usage:
#   provider-capability.sh            # emit the full JSON object
#   provider-capability.sh --quiet    # print only `policy_ok` ("true"/"false")
#
# JSON shape:
#   {"claude":{"installed":bool,"version":str},
#    "codex":{"installed":bool,"version":str,"authenticated":bool,"available":bool},
#    "opencode":{"installed":bool,"version":str,"deepseek_models":[...],"available":bool},
#    "get_secret":{"present":bool},
#    "deepseek":{"present":bool},
#    "env_leak":{"anthropic_api_key_set":bool,"openai_api_key_set":bool},
#    "policy_ok":bool}
#
# policy_ok = claude.installed AND deepseek.present
#             AND NOT(anthropic_api_key_set OR openai_api_key_set)

set -euo pipefail

# ---------------------------------------------------------------------------
# JSON helpers (self-contained — jq is NOT required to build the object).
# ---------------------------------------------------------------------------

# jsonEscape <string> — RFC 8259 §7 string escaping (\, ", newline, CR, tab).
jsonEscape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/\\r}"
  s="${s//$'\t'/\\t}"
  printf '%s' "$s"
}

# jsonBool <0|1|anything> — echo the JSON literal true/false.
#   Treats "true"/non-empty-truthy as true; everything else false.
jsonBool() {
  case "$1" in
    true | 1) printf 'true' ;;
    *) printf 'false' ;;
  esac
}

# ---------------------------------------------------------------------------
# Detection — each probe is best-effort and never fails the script.
# ---------------------------------------------------------------------------

# detectCommand <name> — "true" if the command is resolvable, else "false".
detectCommand() {
  if command -v "$1" >/dev/null 2>&1; then
    printf 'true'
  else
    printf 'false'
  fi
}

# firstLine — read stdin, emit only the first line (trimmed of CR), tolerate none.
firstLine() {
  local line=''
  IFS= read -r line || true
  printf '%s' "${line%$'\r'}"
}

# --- claude ----------------------------------------------------------------
CLAUDE_INSTALLED="$(detectCommand claude)"
CLAUDE_VERSION=''
if [ "$CLAUDE_INSTALLED" = 'true' ]; then
  CLAUDE_VERSION="$(claude --version 2>/dev/null | firstLine || true)"
fi

# --- codex -----------------------------------------------------------------
CODEX_INSTALLED="$(detectCommand codex)"
CODEX_VERSION=''
CODEX_AUTHED='false'
if [ "$CODEX_INSTALLED" = 'true' ]; then
  CODEX_VERSION="$(codex --version 2>/dev/null | firstLine || true)"
  # `codex login status` prints "Logged in …" when authenticated. We only read
  # the human status string — no token is ever surfaced.
  CODEX_STATUS="$(codex login status 2>&1 || true)"
  case "$CODEX_STATUS" in
    *"Logged in"*) CODEX_AUTHED='true' ;;
    *) CODEX_AUTHED='false' ;;
  esac
fi
# available = installed AND authenticated (absent/unauthed is NOT fatal).
CODEX_AVAILABLE='false'
if [ "$CODEX_INSTALLED" = 'true' ] && [ "$CODEX_AUTHED" = 'true' ]; then
  CODEX_AVAILABLE='true'
fi

# --- opencode --------------------------------------------------------------
OPENCODE_INSTALLED="$(detectCommand opencode)"
OPENCODE_VERSION=''
OPENCODE_DEEPSEEK_MODELS=()
if [ "$OPENCODE_INSTALLED" = 'true' ]; then
  OPENCODE_VERSION="$(opencode --version 2>/dev/null | firstLine || true)"
  # Collect DeepSeek-capable model identifiers (empty array if none).
  while IFS= read -r model; do
    model="${model%$'\r'}"
    [ -n "$model" ] && OPENCODE_DEEPSEEK_MODELS+=("$model")
  done < <(opencode models 2>/dev/null | grep -i deepseek || true)
fi
# available = installed AND at least one DeepSeek model exposed.
OPENCODE_AVAILABLE='false'
if [ "$OPENCODE_INSTALLED" = 'true' ] && [ "${#OPENCODE_DEEPSEEK_MODELS[@]}" -gt 0 ]; then
  OPENCODE_AVAILABLE='true'
fi

# --- get-secret ------------------------------------------------------------
GET_SECRET_PRESENT="$(detectCommand get-secret)"

# --- deepseek secret (PRESENCE only — value never read/printed) -------------
DEEPSEEK_PRESENT='false'
if [ "$GET_SECRET_PRESENT" = 'true' ]; then
  if get-secret DEEPSEEK_API_KEY >/dev/null 2>&1; then
    DEEPSEEK_PRESENT='true'
  fi
fi

# --- env leak (booleans only — these SHOULD be unset for internal work) -----
ANTHROPIC_KEY_SET='false'
[ -n "${ANTHROPIC_API_KEY:-}" ] && ANTHROPIC_KEY_SET='true'
OPENAI_KEY_SET='false'
[ -n "${OPENAI_API_KEY:-}" ] && OPENAI_KEY_SET='true'

# --- policy verdict --------------------------------------------------------
POLICY_OK='false'
if [ "$CLAUDE_INSTALLED" = 'true' ] &&
  [ "$DEEPSEEK_PRESENT" = 'true' ] &&
  [ "$ANTHROPIC_KEY_SET" = 'false' ] &&
  [ "$OPENAI_KEY_SET" = 'false' ]; then
  POLICY_OK='true'
fi

# ---------------------------------------------------------------------------
# --quiet short-circuit.
# ---------------------------------------------------------------------------
if [ "${1:-}" = '--quiet' ]; then
  printf '%s\n' "$POLICY_OK"
  exit 0
fi

# ---------------------------------------------------------------------------
# Assemble the DeepSeek-models JSON array.
# ---------------------------------------------------------------------------
MODELS_JSON='[]'
if [ "${#OPENCODE_DEEPSEEK_MODELS[@]}" -gt 0 ]; then
  MODELS_JSON='['
  SEP=''
  for model in "${OPENCODE_DEEPSEEK_MODELS[@]}"; do
    MODELS_JSON+="${SEP}\"$(jsonEscape "$model")\""
    SEP=','
  done
  MODELS_JSON+=']'
fi

# ---------------------------------------------------------------------------
# Emit the single JSON object. Built by hand (jq-independent) and, when jq is
# available, re-serialized for canonical formatting.
# ---------------------------------------------------------------------------
JSON="$(
  printf '{'
  printf '"claude":{"installed":%s,"version":"%s"},' \
    "$(jsonBool "$CLAUDE_INSTALLED")" "$(jsonEscape "$CLAUDE_VERSION")"
  printf '"codex":{"installed":%s,"version":"%s","authenticated":%s,"available":%s},' \
    "$(jsonBool "$CODEX_INSTALLED")" "$(jsonEscape "$CODEX_VERSION")" \
    "$(jsonBool "$CODEX_AUTHED")" "$(jsonBool "$CODEX_AVAILABLE")"
  printf '"opencode":{"installed":%s,"version":"%s","deepseek_models":%s,"available":%s},' \
    "$(jsonBool "$OPENCODE_INSTALLED")" "$(jsonEscape "$OPENCODE_VERSION")" \
    "$MODELS_JSON" "$(jsonBool "$OPENCODE_AVAILABLE")"
  printf '"get_secret":{"present":%s},' "$(jsonBool "$GET_SECRET_PRESENT")"
  printf '"deepseek":{"present":%s},' "$(jsonBool "$DEEPSEEK_PRESENT")"
  printf '"env_leak":{"anthropic_api_key_set":%s,"openai_api_key_set":%s},' \
    "$(jsonBool "$ANTHROPIC_KEY_SET")" "$(jsonBool "$OPENAI_KEY_SET")"
  printf '"policy_ok":%s' "$(jsonBool "$POLICY_OK")"
  printf '}'
)"

if command -v jq >/dev/null 2>&1; then
  # -c keeps it one compact object; jq also validates our hand-built JSON.
  printf '%s' "$JSON" | jq -c . 2>/dev/null || printf '%s\n' "$JSON"
else
  printf '%s\n' "$JSON"
fi

exit 0
