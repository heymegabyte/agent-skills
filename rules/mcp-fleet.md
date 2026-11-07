---
last_reviewed: 2026-10-10
superseded_by: null
name: "mcp-fleet"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# MCP Fleet — what to wire and why

Companion to `[[mcp-auth-options]]` (transport/auth) and `[[secret-provisioning]]`. This file governs WHICH MCPs join the fleet; that one governs HOW they authenticate.

## Hard rule — a provisioned key gates wiring

- **Never wire an MCP whose credential is only in `.env.example`.** That file is a template of vars we *might* use, not proof of a key.
- Provisioned = a file exists in the chezmoi secrets dir (`get-secret <KEY>` returns non-empty). Verify before `claude mcp add`.
- `.env.example` listed `FIRECRAWL_API_KEY`, `NOTION_TOKEN`, `BETTER_AUTH_SECRET`, `CLOUDINARY_*`, `POSTMARK_SERVER_TOKEN` — **none are in the vault.** Do not wire these until the key is provisioned first.

## Wire pattern

- Key-based servers → stdio + `get-secret` inline, so they work headlessly (no OAuth dance). Mirror the `coolify` entry shape.
  - `claude mcp add -s user <name> -- bash -lc 'KEY=$(/Users/Apple/.local/bin/get-secret KEY 2>/dev/null) exec npx -y <pkg>'`
- OAuth-only remotes (Cloudflare, Sentry-hosted) → `--transport http <url>`; first connect opens a browser login. Reuse an existing provider OAuth where possible.
- Sensitive + **write** (auth, payments, secrets, email) → self-hosted *hardened* variant behind CF Access per `[[mcp-auth-options]]`, not a raw community server. Read-mostly research/observability → official remote/stdio is fine.

## Current Tier-1 (wired 2026-10-10, keys verified)

- **sequential-thinking** — credential-free stdio `@modelcontextprotocol/server-sequential-thinking` for
  explicit, revisable multi-step analysis in architecture, migration, incident response, and orchestration
  agents. Register user-wide with
  `claude mcp add --scope user --transport stdio sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking`.
- **coolify** — official self-hosted Streamable HTTP endpoint at `https://coolify.megabyte.space/mcp`,
  wrapped through `mcp-remote` with a dedicated read-only team token resolved from macOS Keychain at
  runtime. Route to orchestration, deployment, and incident-response agents.
- **grafana** — official `mcp-grafana` stdio server targeting the private Grafana origin with a dedicated
  Viewer service-account token stored in the macOS Keychain. Route only to deployment, performance, and
  incident-response agents because its observability tool inventory is intentionally large.
- **mcp-docs** — official `https://modelcontextprotocol.io/mcp` documentation server. Route exclusively to
  `mcp-engineer`; do not load it into general agents.
- **sentry** — stdio `@sentry/mcp-server` + `SENTRY_AUTH_TOKEN`. Serves the estate Sentry baseline (2026-10-04): `incident-responder`/`deploy-verifier` query issues, traces, Seer in-loop.
- **tavily** — stdio `tavily-mcp` + `TAVILY_API_KEY`. Research/crawl/extract rail for competitor-research + Phase 0 saturation. **Replaces flaky `exa`** (cold-npx connect timeouts).
- **elevenlabs** — stdio `uvx elevenlabs-mcp` + `ELEVENLABS_API_KEY`. Phase 4 per-page AI podcast + `media-orchestrator` (voice hosts A/B already provisioned).
- **cloudflare-browser** — http `browser.mcp.cloudflare.com/mcp` (OAuth). Browser Run for real-user-journey E2E (Supreme Principle #6). The `cloudflare` entry is already the consolidated primary — observability/bindings/radar fold into it.

## Tier-2 — provision the key, THEN wire

- **Google Maps/Places** — `GOOGLE_MAPS_API_KEY`+`GOOGLE_PLACES_API_KEY` provisioned; Phase 0 local-biz research + embedded maps. Confirm official-vs-community MCP before wiring a geo key.
- **AWS (SES)** — AWS keys provisioned; SES is the sole email rail. Use `mcp-proxy-for-aws` (SigV4) or a hardened wrapper, not a raw server.
- Notion / Better Auth / Cloudinary / Firecrawl — only after the key lands in the vault.

## Drift to fix (fleet hygiene)

- **`resend` MCP violates doctrine** — "NEVER Resend; SES is the sole email rail." Drop it, or replace with a hardened SES MCP (AWS keys are provisioned; `POSTMARK_SERVER_TOKEN` is not).
- **Coolify MCP recovered 2026-11-03** — the native `/mcp` endpoint is enabled and connected with a
  vaulted team token. Keep SSH as the break-glass diagnostic path, not the default management interface.
- **`exa`** cold-connect timeouts — superseded by `tavily` as the primary research rail.
- **4 overlapping browser MCPs** (`playwright` + `chrome-devtools` + `stagehand-local` + `browserbase`) — keep `playwright` (local, token-cheap a11y-tree) + `browserbase` (cloud journeys); the other two are redundant.
