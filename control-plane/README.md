# claude-bootstrap

The canonical, portable **Claude Code control plane**. Vendor it into any GitHub
repo and a Claude Code **web** session — an isolated cloud sandbox that clones the
repo and where the laptop's `~/.claude` does **not** load — can autonomously
**implement → test → deploy → verify** Cloudflare Workers projects.

## The hierarchy

```
Claude account (connectors, Cloud Environment, account Skills)
  └─ claude-bootstrap (this repo — the canonical control plane)
       └─ any GitHub repo (vendors .claude/ + CLAUDE.md via /claude-bootstrap)
            └─ Claude Code cloud session (clones repo; runs setup.sh)
                 └─ GitHub (branch / PR / Workers Builds trigger)
                      └─ Cloudflare (preview → production)
                           └─ Browser verify (change observable on live URL)
                                └─ Reporting (PR comment / summary)
```

## Quick start

In any repo, run:

```
/claude-bootstrap
```

It vendors `.claude/commands`, `.claude/agents`, `.claude/control-plane`, and a
least-privilege `.claude/settings.json` (merged, never clobbered), so the repo
carries its own deploy brain. Then just describe intent (`/ship`, `/fast-fix`, or
plain English) and the loop runs to a verified live change.

## What's inside

- **commands/** — `ship`, `deploy`, `fast-fix`, `bootstrap-status`,
  `claude-bootstrap`, `sync-claude`, `verify-production`, `rollback`.
- **agents/** — `browser-operator` (real-browser live-URL verification),
  `resource-broker` (resolve/provision CF resources before deploy).
- **control-plane/** — `ccctl.mjs`, the zero-dep Node ESM **deterministic brain**
  (`resolve` / `classify` / `plan` / `invalidation-plan` / `verify` / `doctor`),
  and `sites.jsonc`, the target registry.
- **bootstrap/** — `setup.sh`, the cloud-session setup script.

## How web sessions use it

Claude Code on the web only sees what travels **with the repo**: `.claude/skills`,
`.claude/commands`, `CLAUDE.md`, `.claude/settings.json`, hooks, and `.mcp.json`.
`~/.claude/plugins` does **not** load on web — which is exactly why the whole
control plane is vendored into the repo rather than assumed on the machine.

- **Remote (HTTP/SSE) MCP works on web**; **stdio MCP does not** — prefer remote
  MCP endpoints in `.mcp.json`.
- The **Cloud Environment** UI injects env vars / API credentials, so `wrangler`
  authenticates headlessly.
- `npm` / `npx` / `wrangler` and outbound HTTPS all work in the sandbox.
- **Routines** can trigger sessions on a schedule or on GitHub events.

## One-time account setup

Do these once on your Claude account so every repo's web sessions can deploy:

1. **Cloud Environment secrets** — <https://claude.ai/settings/claude-code> → add
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` so wrangler authenticates
   headlessly.
2. **Connectors** — connect the **GitHub** connector (branches/PRs) and, if you
   want draft-email reporting, the **Google Workspace** connector.
3. **Cloudflare plugin** — `/plugin marketplace add cloudflare/claude-code` then
   `/plugin install cloudflare` *(verify current syntax at
   developers.cloudflare.com)*.
4. **Cloudflare Code Mode MCP** — add the remote MCP endpoint
   <https://mcp.cloudflare.com/mcp>.

## Security

- **No secrets are committed** — this repo contains code + config only.
- **OAuth** for interactive connectors; **CI secrets** for CI.
- Prefer **GitHub → Workers Builds** over distributing Cloudflare credentials:
  push a branch and let Cloudflare build/deploy, so CF creds stay in Cloudflare
  rather than fanning out to every session.
