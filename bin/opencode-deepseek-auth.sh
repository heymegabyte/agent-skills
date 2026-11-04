#!/usr/bin/env bash
# Keep OpenCode's native DeepSeek credential synchronized with get-secret.
# Native auth is required by GUI/desktop launches that do not inherit shell env.

set -euo pipefail
export PATH="$HOME/.local/bin:$HOME/.opencode/bin:$HOME/.volta/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

COMMAND="${1:-status}"
DATA_DIR="${OPENCODE_DATA_DIR:-${XDG_DATA_HOME:-$HOME/.local/share}/opencode}"
AUTH_FILE="${OPENCODE_AUTH_FILE:-$DATA_DIR/auth.json}"
CONFIG_FILE="${OPENCODE_CONFIG_FILE:-${XDG_CONFIG_HOME:-$HOME/.config}/opencode/opencode.jsonc}"
GET_SECRET_BIN="${GET_SECRET_BIN:-get-secret}"

native_auth_present() {
  [ -f "$AUTH_FILE" ] && command -v jq >/dev/null 2>&1 &&
    jq -e '.deepseek.type == "api" and (.deepseek.key | type == "string" and length > 0) and .litellm.type == "api" and (.litellm.key | type == "string" and length > 0)' "$AUTH_FILE" >/dev/null 2>&1
}

secret_source_present() {
  command -v "$GET_SECRET_BIN" >/dev/null 2>&1 &&
    "$GET_SECRET_BIN" --exists DEEPSEEK_API_KEY >/dev/null 2>&1
}

config_shadowed() {
  [ -f "$CONFIG_FILE" ] &&
    grep -Eq '"apiKey"[[:space:]]*:[[:space:]]*"\{env:(DEEPSEEK_API_KEY|LITELLM_API_KEY)\}"' "$CONFIG_FILE"
}

emit_status() {
  local native=false source=false shadow=false secure=false in_sync=null source_key='' native_key=''
  native_auth_present && native=true
  secret_source_present && source=true
  config_shadowed && shadow=true
  if [ -f "$AUTH_FILE" ]; then
    case "$(stat -c '%a' "$AUTH_FILE" 2>/dev/null || stat -f '%Lp' "$AUTH_FILE" 2>/dev/null || true)" in
      600) secure=true ;;
    esac
  fi
  if [ "$native" = true ] && [ "$source" = true ]; then
    source_key="$("$GET_SECRET_BIN" DEEPSEEK_API_KEY 2>/dev/null || true)"
    native_key="$(jq -r '.deepseek.key // empty' "$AUTH_FILE" 2>/dev/null || true)"
    in_sync=false
    [ -n "$source_key" ] && [ "$source_key" = "$native_key" ] && in_sync=true
  fi
  local ready=false
  if [ "$native" = true ] && [ "$shadow" = false ] && [ "$secure" = true ] &&
    { [ "$in_sync" = true ] || [ "$in_sync" = null ]; }; then
    ready=true
  fi
  printf '{"native_auth":%s,"secret_source":%s,"in_sync":%s,"config_shadowed":%s,"permissions_secure":%s,"ready":%s}\n' \
    "$native" "$source" "$in_sync" "$shadow" "$secure" "$ready"
}

sync_auth() {
  command -v jq >/dev/null 2>&1 || {
    printf 'opencode-deepseek-auth: jq is required\n' >&2
    exit 2
  }
  command -v "$GET_SECRET_BIN" >/dev/null 2>&1 || {
    printf 'opencode-deepseek-auth: get-secret is unavailable\n' >&2
    exit 3
  }

  local key litellm_key tmp
  key="$("$GET_SECRET_BIN" DEEPSEEK_API_KEY 2>/dev/null || true)"
  litellm_key="$("$GET_SECRET_BIN" LITELLM_API_KEY 2>/dev/null || true)"
  [ -n "$key" ] || {
    printf 'opencode-deepseek-auth: DEEPSEEK_API_KEY is unavailable\n' >&2
    exit 4
  }

  mkdir -p "$DATA_DIR"
  chmod 700 "$DATA_DIR" 2>/dev/null || true
  if [ -f "$AUTH_FILE" ]; then
    jq -e 'type == "object"' "$AUTH_FILE" >/dev/null || {
      printf 'opencode-deepseek-auth: refusing to replace invalid JSON at %s\n' "$AUTH_FILE" >&2
      exit 5
    }
  fi

  tmp="$(mktemp "$DATA_DIR/auth.json.tmp.XXXXXX")"
  trap 'rm -f "$tmp"' EXIT
  if [ -f "$AUTH_FILE" ]; then
    DEEPSEEK_SYNC_KEY="$key" LITELLM_SYNC_KEY="$litellm_key" jq '
      .deepseek = {type:"api", key:env.DEEPSEEK_SYNC_KEY} |
      if (env.LITELLM_SYNC_KEY | length) > 0 then .litellm = {type:"api", key:env.LITELLM_SYNC_KEY} else . end
    ' "$AUTH_FILE" >"$tmp"
  else
    DEEPSEEK_SYNC_KEY="$key" LITELLM_SYNC_KEY="$litellm_key" jq -n '
      {deepseek:{type:"api", key:env.DEEPSEEK_SYNC_KEY}} |
      if (env.LITELLM_SYNC_KEY | length) > 0 then .litellm = {type:"api", key:env.LITELLM_SYNC_KEY} else . end
    ' >"$tmp"
  fi
  chmod 600 "$tmp"
  mv "$tmp" "$AUTH_FILE"
  trap - EXIT

  config_shadowed && {
    printf 'opencode-deepseek-auth: credential synced, but config apiKey env substitution still shadows native auth\n' >&2
    exit 6
  }
  printf 'OpenCode DeepSeek credential synchronized.\n'
}

case "$COMMAND" in
  status | --status) emit_status ;;
  sync | --sync) sync_auth ;;
  *)
    printf 'Usage: %s [status|sync]\n' "${0##*/}" >&2
    exit 64
    ;;
esac
