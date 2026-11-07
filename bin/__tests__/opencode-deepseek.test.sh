#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
grep -q 'hydrate up to 900K relevant tokens' "$ROOT/bin/opencode-task.sh"
grep -q 'Context7 current library docs' "$ROOT/bin/opencode-task.sh"
grep -q 'scoped estate AI Search knowledge' "$ROOT/bin/opencode-task.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/bin" "$TMP/data" "$TMP/config/opencode"

cat >"$TMP/bin/get-secret" <<'EOF'
#!/usr/bin/env bash
if [ "${1:-}" = '--exists' ]; then exit 0; fi
[ "${1:-}" = 'DEEPSEEK_API_KEY' ] && printf 'sk-test-deepseek-key\n'
EOF
chmod +x "$TMP/bin/get-secret"

cat >"$TMP/data/auth.json" <<'EOF'
{"openrouter":{"type":"api","key":"preserve-me"}}
EOF
cat >"$TMP/config/opencode/opencode.jsonc" <<'EOF'
{"provider":{"deepseek":{"options":{"baseURL":"https://api.deepseek.com"}}}}
EOF

PATH="$TMP/bin:$PATH" \
OPENCODE_DATA_DIR="$TMP/data" \
OPENCODE_CONFIG_FILE="$TMP/config/opencode/opencode.jsonc" \
  "$ROOT/bin/opencode-deepseek-auth.sh" sync >/dev/null

jq -e '.openrouter.key == "preserve-me" and .deepseek.key == "sk-test-deepseek-key"' "$TMP/data/auth.json" >/dev/null
[ "$(stat -f '%Lp' "$TMP/data/auth.json" 2>/dev/null || stat -c '%a' "$TMP/data/auth.json")" = 600 ]

status="$(PATH="$TMP/bin:$PATH" OPENCODE_DATA_DIR="$TMP/data" OPENCODE_CONFIG_FILE="$TMP/config/opencode/opencode.jsonc" "$ROOT/bin/opencode-deepseek-auth.sh" status)"
printf '%s' "$status" | jq -e '.ready and .native_auth and .secret_source and .in_sync and .permissions_secure and (.config_shadowed|not)' >/dev/null

cat >"$TMP/bin/opencode" <<'EOF'
#!/usr/bin/env bash
printf 'deepseek=%s openai=%s anthropic=%s args=%s\n' \
  "${DEEPSEEK_API_KEY:+set}" "${OPENAI_API_KEY:+set}" "${ANTHROPIC_API_KEY:+set}" "$*"
EOF
chmod +x "$TMP/bin/opencode"

output="$(PATH="$TMP/bin:$PATH" OPENCODE_AUTH_FILE="$TMP/data/missing-auth.json" GET_SECRET_BIN="$TMP/bin/get-secret" OPENAI_API_KEY=bad ANTHROPIC_API_KEY=bad "$ROOT/bin/opencode-deepseek.sh" run hello)"
[ "$output" = 'deepseek=set openai= anthropic= args=run hello' ]

output="$(PATH="$TMP/bin:$PATH" OPENCODE_AUTH_FILE="$TMP/data/auth.json" GET_SECRET_BIN="$TMP/bin/get-secret" OPENAI_API_KEY=bad ANTHROPIC_API_KEY=bad "$ROOT/bin/opencode-deepseek.sh" run native)"
[ "$output" = 'deepseek= openai= anthropic= args=run native' ]

cat >"$TMP/bin/get-secret" <<'EOF'
#!/usr/bin/env bash
exit 1
EOF
chmod +x "$TMP/bin/get-secret"
output="$(PATH="$TMP/bin:$PATH" HOME="$TMP" OPENCODE_AUTH_FILE="$TMP/data/auth.json" GET_SECRET_BIN="$TMP/bin/get-secret" OPENAI_API_KEY=bad ANTHROPIC_API_KEY=bad "$ROOT/bin/opencode-deepseek.sh" models deepseek)"
[ "$output" = 'deepseek= openai= anthropic= args=models deepseek' ]

printf 'opencode-deepseek tests passed\n'
