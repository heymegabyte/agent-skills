---
description: Report the Claude control-plane environment (auth mode, tooling, connectors, resolved target). Fires when you need to confirm the sandbox can deploy.
argument-hint: "(no args)"
---

Read-only diagnostic. **NEVER print credential VALUES** — presence/booleans only.

## Gather

- `node .claude/control-plane/ccctl.mjs doctor` → `ccctlVersion`, `registrySites`, `repoRoots`, `node`, `hasFetch`, `env.{CLOUDFLARE_API_KEY, CLOUDFLARE_EMAIL, CLOUDFLARE_API_TOKEN}` (booleans).
- `node .claude/control-plane/ccctl.mjs resolve` → target `domain`, `worker`, `prodUrl`, `liveUrl`, `verifyUrl`, `framework`, `packageManager`, `checkCmd`/`testCmd`/`deployCmd`, `source`.
- `claude mcp list` (if the binary exists) → connected MCP servers.
- `npx wrangler --version` → Wrangler version.
- `gh auth status` → GitHub connector state.
- Auth MODE: subscription vs API key. **Warn if `ANTHROPIC_API_KEY` is set** — it risks pay-per-token API billing instead of the subscription; recommend unsetting it in the sandbox.
- Claude Code version, current repo + branch, browser availability (Cloudflare Browser Rendering / Browserbase / Playwright).

## Report — one compact table

| Field | Value |
|---|---|
| Auth mode | subscription \| **API-KEY ⚠ (billing risk)** |
| Claude version | … |
| ccctl version | … |
| Skills / Plugins | count (note: web loads repo `.claude/`, NOT laptop `~/.claude/plugins/`) |
| MCP | names + reachable? (web = remote only) |
| GitHub connector | connected? |
| Cloudflare creds | TOKEN ✓/✗ · API_KEY ✓/✗ · EMAIL ✓/✗ (presence only) |
| Gmail / Workspace | connected? |
| Wrangler | version |
| Repo / branch | … |
| Target worker | … · prodUrl · liveUrl |
| check / test / deploy | commands (from ccctl) |
| Browser | Rendering \| Browserbase \| Playwright \| none |

End with a one-line **READY / NOT READY to /ship** verdict + the single blocking gap if not ready.
