# Control-Plane Migration — Progress Checkpoint

_Resume doc for the 15m loop / a fresh session. Never store secret values here._

## ✅ CORE GOAL VERIFIED (2026-09-30)

The claude.ai → push → Workers Builds → deploy loop is **GREEN end-to-end**. The build of commit `38c6ed8` (the custom_domain-routes fix) = **Success**, all 5 stages green, now the **ACTIVE deployment** (Worker version `ec868834`, 100% traffic). Deploys to `njsk-org.manhattan.workers.dev`; zero secrets in the sandbox. Saying a change in a claude.ai njsk.org session ships to production autonomously.

## DONE + verified

- `heymegabyte/claude-bootstrap` created + pushed — ccctl brain, 8 commands, 2 agents (browser-operator, resource-broker), `bootstrap/setup.sh`, README/ARCHITECTURE/capability-matrix. Secret-scan clean.
- `ccctl.mjs` built + live-tested: resolve/classify(fast|normal|high)/plan/invalidation/verify. Verified against `https://njsk-org.manhattan.workers.dev` (200 + security headers).
- njsk.org web-ready + pushed (`bcac250`): `.claude/site.json`, vendored `ccctl.mjs`, 6 commands, `settings.json`, **Auto-Ship CLAUDE.md** (any change request → full /ship pipeline).
- Cloudflare API read verified (account "Megabyte Labs"). Local secrets complete for CF deploy (`ANTHROPIC_API_KEY` correctly unset in env).
- Claude Code web confirmed live (Bz · Max; repos connected; 3 Routines exist).
- Durable cron `ddd6685c` (every 15m) scheduled to continue this work.

## REMAINING (exact steps — each is browser/OAuth-gated to Brian's session)

1. **Web deploys = GitHub → Cloudflare Workers Builds (NOT a sandbox CF token).** FINDING (verified 2026-09-30): the claude.ai Cloud Environment has NO secret-safe env slot — its Environment-variables box is plaintext ("don't add secrets"), API-credentials only injects request headers, setup-script would expose a pasted token. So do NOT put `CLOUDFLARE_API_TOKEN` there. One-time: connect the `njsk-org` worker → Workers Builds → repo `heymegabyte/njsk.org` branch `main` (CF dash → Workers & Pages → njsk-org → Settings → Build → Connect to Git). Then web `/ship` deploys by `git push`; CF builds + deploys server-side with the account's own creds.
2. **Account Skills upload:** claude.ai → Settings → Capabilities → Skills → enable code execution → upload account-worthy skills as ZIPs (package the control-plane workflow first). Verify with `/skills`.
3. **Connectors:** Google Workspace/Gmail (OAuth consent); Cloudflare official plugin/MCP (`mcp.cloudflare.com/mcp`). GitHub already authed.

## Secret discipline

- Clipboard is the ONLY transit for a value into a browser field; clear with `pbcopy </dev/null` after paste. Never print or commit values. Use the bitwarden MCP for specific items only.

## Gotcha (verified 2026-09-30) — Workers Builds "rolled build token"

- njsk-org's FIRST Workers Build (commit ef02fed) FAILED at _Initializing_ (4s): "The build token selected for this build has been deleted or rolled and cannot be used." The connection's build token was stale — code never ran (not a build failure).
- Fix: in Workers Builds settings regenerate the build token OR disconnect+reconnect Git (re-mints a token), then re-trigger. **Confirm a GREEN build before claiming web push→deploy is live.**
- **FIXED 2026-09-30:** reconnected Workers Builds. NOTE: the "Create new token" path hit a persistent Cloudflare internal error ("An internal error prevented the form from submitting") — the workaround was to select an EXISTING valid build token from the dropdown (`megabyte-labs-sites build token`) instead. Connection saved clean (no token error). Re-triggered build `83b92b9`. That token warns it lacks `ai_search_write` / `email_routing_*` / `connectivity_directory_*` perms — not needed for njsk's `wrangler deploy` (Workers/D1/KV/R2/AI), but CONFIRM the build goes green on the dashboard Builds page (heavy build, ~minutes).

## Context note

- Cron fires in-session while idle (accumulates context). For genuinely fresh context, RESTART the session — the durable cron + this file resume the work deterministically.
