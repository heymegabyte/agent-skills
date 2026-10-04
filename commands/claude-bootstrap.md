---
description: Bring ANY repo into compliance with the shared Claude control plane so Claude Code on the web can run /ship autonomously.
argument-hint: "[domain] (optional — defaults to cwd)"
---

Idempotent + safe. NEVER clobber existing project config — merge, never overwrite. Vendors the deterministic brain (`ccctl.mjs`) + core commands INTO the repo so Claude Code on the web (isolated sandbox, no laptop `~/.claude`) is self-sufficient.

## Steps

1. **Infer** — run `node .claude/control-plane/ccctl.mjs resolve` (or the desktop `~/.claude/plugins/heymegabyte-agent-skills/control-plane/ccctl.mjs` if not yet vendored). Reads `wrangler.toml`/`.jsonc` + `package.json` to detect `framework`, `worker`, `packageManager`, `buildCmd`, `checkCmd`, `testCmd`, `deployCmd`, `deployNoBuildCmd`, `healthPath`.

2. **Write/merge `.claude/site.json`** — TINY. Only NON-inferable facts: `domain`, `aliases`, `prodUrl`, `liveUrl` (the `*.workers.dev` fallback), `dnsStatus`, `deployProvider`, `healthPath`, `notes`. Deep-merge into any existing file; never drop existing keys. Everything else stays inferred by ccctl at runtime — do NOT duplicate build/test/deploy commands here.

3. **Vendor the control plane** — from the bootstrap source (`git clone --depth 1 https://github.com/heymegabyte/claude-bootstrap` into a temp dir, or copy from `~/.claude/plugins/heymegabyte-agent-skills`):
   - `control-plane/ccctl.mjs` → `.claude/control-plane/ccctl.mjs`
   - `commands/ship.md`, `commands/deploy.md`, `commands/bootstrap-status.md` → `.claude/commands/`
   Overwrite only these vendored artifacts (they are ours); leave all other `.claude/commands/*` untouched.

4. **Write/merge `.claude/settings.json`** — from `settings/settings.template.json`. ADD permission allows for the deploy toolchain (`npx wrangler *`, the package manager, `node .claude/control-plane/ccctl.mjs *`, `gh *`, `git *`). Merge into existing `permissions.allow`; NEVER remove an existing allow or deny.

5. **Print ONE-TIME account setup** (deep links — the human does this once per Claude account, not per repo):
   - Cloud Environment: https://claude.ai/settings/claude-code → create an environment for this repo → set `CLOUDFLARE_API_TOKEN` (+ `CLOUDFLARE_ACCOUNT_ID`) as env vars / API credentials so headless `wrangler deploy` authenticates on the web.
   - Connect the **GitHub** + **Google Workspace** connectors.
   - Optional: add remote (HTTP/SSE) MCP servers to the repo's `.mcp.json` (stdio MCP does NOT run on the web).

6. **Verify web-readiness** — run `node .claude/control-plane/ccctl.mjs resolve` FROM THE REPO ROOT. It must resolve target facts WITHOUT the plugin registry (source `site.json`/inference, not `sites.jsonc`) — that proves the repo is self-sufficient on the web. Report the resolved `worker`, `prodUrl`, `deployCmd`.

## Also (optional, desktop only)

- Register the site in the central `control-plane/sites.jsonc` so desktop `ccctl resolve <domain>` works cross-repo. This is a convenience for the laptop; the web path relies solely on the vendored `.claude/` — never depend on `sites.jsonc` at runtime.
