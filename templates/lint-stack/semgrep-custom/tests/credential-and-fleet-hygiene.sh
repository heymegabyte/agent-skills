#!/usr/bin/env bash
# Test fixtures for credential-and-fleet-hygiene.yml.
# A "rule"+"id" annotation on a comment marks the NEXT line as a required match;
# an "ok" annotation marks the next line as a required non-match. (Tokens spelled
# out here on purpose so semgrep's --test parser does not read this header.)
# Run: semgrep --test --config <semgrep-custom dir> <this tests dir>
# These are deliberately-bad SAMPLES, never real credentials.

# --- secret-written-to-github-actions-file ---------------------------------
# ruleid: secret-written-to-github-actions-file
echo "token=${ANTHROPIC_API_KEY}" >>"$GITHUB_OUTPUT"
# ruleid: secret-written-to-github-actions-file
printf 'CF_TOKEN=%s\n' "${CLOUDFLARE_API_TOKEN}" >>"$GITHUB_ENV"
# ok: secret-written-to-github-actions-file
echo "build_sha=${GIT_SHA}" >>"$GITHUB_OUTPUT"

# --- hardcoded-cloudflare-token-shell --------------------------------------
# ruleid: hardcoded-cloudflare-token-shell
CLOUDFLARE_API_TOKEN="v1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789abcd"
# ok: hardcoded-cloudflare-token-shell
CLOUDFLARE_API_TOKEN="$(get-secret CLOUDFLARE_API_TOKEN)"

# --- hardcoded-broker-identity-secret --------------------------------------
# ruleid: hardcoded-broker-identity-secret
INFISICAL_CLIENT_SECRET="st.abcdef0123456789.deadbeefcafe0123"
# ruleid: hardcoded-broker-identity-secret
DEEPSEEK_API_KEY="fixture_deepseek_placeholder_value_20chars"
# ok: hardcoded-broker-identity-secret
INFISICAL_TOKEN="${INFISICAL_TOKEN:-}"

# --- secret-echoed-to-stdout -----------------------------------------------
# ruleid: secret-echoed-to-stdout
echo "resolved ${GITHUB_PAT_TOKEN}"
# ok: secret-echoed-to-stdout
printf '%s' "$value"
# ok: secret-echoed-to-stdout
printf '"present":%s' "$GET_SECRET_PRESENT"
# ok: secret-echoed-to-stdout
echo "using header $API_KEY_HEADER"

# --- infisical-interactive-login-in-script ---------------------------------
# ruleid: infisical-interactive-login-in-script
infisical login --method=universal-auth
# ok: infisical-interactive-login-in-script
infisical secrets get MY_KEY --plain --silent --env prod
# ok: infisical-interactive-login-in-script
# never run `infisical login` in a fleet script — use a machine identity
