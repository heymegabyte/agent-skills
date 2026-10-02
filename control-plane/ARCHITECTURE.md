# Architecture

How claude-bootstrap turns a one-sentence intent into a **verified live change** on
Cloudflare, from any surface (laptop, Claude Code web, chat), with no laptop
`~/.claude` assumed.

## 1. DeploymentController capability interface

Every deploy provider implements the same six capabilities so the loop is
provider-agnostic:

| Capability | Meaning |
|---|---|
| `resolveTarget` | intent + registry → concrete target (worker, hostname, routes, cache strategy) |
| `preflight` | resources exist, creds present, build clean, rollback ref captured |
| `deploy` | publish preview then production |
| `invalidate` | run the minimal cache-invalidation plan |
| `verify` | HTTP then browser; confirm change is observable on the live URL |
| `rollback` | restore the captured pre-deploy version |

**Provider order** (first that can serve the target wins):

1. **ProjectSites MCP** — the eventual **primary**; managed deploy + invalidate + verify.
2. **Cloudflare MCP / official plugin** — CF-native operations over remote MCP.
3. **wrangler CLI + CF REST** — the direct-CF adapters that are the **working
   provider today**.
4. **GitHub push → Workers Builds** — push a branch; Cloudflare builds/deploys,
   keeping CF creds inside Cloudflare.

Direct-CF adapters (3) carry the loop **now**; ProjectSites MCP (1) becomes primary
as it lands, with no change to callers.

## 2. ccctl — the deterministic brain

`control-plane/ccctl.mjs` (zero-dep Node ESM) makes the non-negotiable decisions
deterministically, so the LLM never guesses target, risk, or cache scope:

- `resolve` — intent + `sites.jsonc` → the concrete target.
- `classify` — change → risk lane (see §3).
- `plan` — the ordered deploy steps for the target.
- `invalidation-plan` — the minimal cache actions (see §5).
- `verify` — HTTP-level assertions the change is live.
- `doctor` — environment self-check (used by `setup.sh`).

## 3. Risk lanes — testing depth scales with risk

| Lane | Trigger | Testing depth |
|---|---|---|
| **FAST** | copy, asset, favicon, single static value | typecheck + targeted check; no full suite |
| **NORMAL** | component/page/route/logic change | unit + build + affected E2E |
| **HIGH** | auth, payments, data-shape, migration, worker routing | full suite + browser + data reconcile |

A favicon swap must **not** run the full suite; an auth change must. `ccctl classify`
picks the lane; the command scales tests to it.

## 4. Verification strategy

Two layers, always in order:

1. **HTTP** (`ccctl verify`) — status, headers, key content on the live URL.
2. **Real browser** (`browser-operator`) — the change is **observable** to a user.

Success is defined as **the change is observable on the live URL** — not "deploy
succeeded". And **reconcile display vs data source**: a surface that renders a
clean empty state can still be reading the wrong source, so verify the displayed
data against its authoritative store, not just that the page rendered.

## 5. Cache invalidation — narrowest scope first

Prefer the tightest mechanism that guarantees freshness:

```
hashed asset  >  versioned URL  >  cache-tag  >  single URL  >  prefix  >  hostname  >  purge-all (last resort)
```

`ccctl invalidation-plan` emits the minimal set; purge-all is a last resort, never
the default.

## 6. Production-safe test-state isolation

When tests must touch a live environment:

- **run-id-tagged fixtures** — every created record carries a unique run id.
- **snapshot / restore** around mutations.
- **`finally` cleanup** — always tear down, even on failure.
- **never mutate real customer data** — synthetic, tagged rows only.

## 7. Web portability — what must be repo-contained

Because `~/.claude/plugins` does not load on web, everything the loop needs travels
**with the repo**: `.claude/commands`, `.claude/agents`, `.claude/control-plane`
(`ccctl.mjs` + `sites.jsonc`), `bootstrap/setup.sh`, `CLAUDE.md`,
`.claude/settings.json`, hooks, and `.mcp.json` (**remote** MCP only — stdio does
not work on web). Nothing may depend on machine-local state.

## 8. Synthesis of the 10 optimization passes

- **Latency** — parallel-speculate independent work; collapse decisions into a
  single `ccctl plan` call rather than many probes.
- **DX** — one-sentence intent is the whole interface; the brain fills the rest.
- **Reliability** — capture the rollback ref **before** deploy, always.
- **MCP-first** — prefer ProjectSites / Cloudflare MCP over shelling out when the
  MCP can serve the operation.
- **Portability** — repo-vendored control plane; zero laptop assumptions.
- **Simplicity** — reuse wrangler + CF primitives; **no bespoke framework**.
