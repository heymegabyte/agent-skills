# projectsites-mcp

Project Sites as an MCP server. One prompt → live edge-native site: the server
wraps the projectsites.dev REST API and Cloudflare provisioning behind **34
tools** that Claude Code (or any MCP client) can call.

```
create_site → cf_provision_d1 / cf_provision_kv / cf_provision_r2 → deploy_site → add_domain → get_site_health
```

## Install

```bash
cd mcp-servers/projectsites-mcp/mcp-server
npm install
npm run build
```

Register with Claude Code:

```bash
claude mcp add projectsites -- node "$PWD/dist/src/index.js"
```

Or in `.mcp.json`:

```json
{
  "mcpServers": {
    "projectsites": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-servers/projectsites-mcp/mcp-server/dist/src/index.js"],
      "env": {
        "PROJECT_SITES_API_KEY": "${PROJECT_SITES_API_KEY}",
        "CF_API_TOKEN": "${CF_API_TOKEN}",
        "CF_ACCOUNT_ID": "${CF_ACCOUNT_ID}"
      }
    }
  }
}
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `PROJECT_SITES_API_KEY` | yes | Org API key (`psk_live_*`) from `/admin/api-tokens`. |
| `PROJECT_SITES_API_URL` | no | API origin. Default `https://projectsites.dev`. |
| `PROJECT_SITES_TIMEOUT_MS` | no | Per-request timeout. Default `30000`. |
| `CF_API_TOKEN` | provisioning | Cloudflare API token with D1/KV/R2 + Workers Scripts edit. |
| `CF_ACCOUNT_ID` | provisioning | Cloudflare account id. |
| `WRANGLER_BIN` | no | Wrangler binary name/path. Default `wrangler`. |
| `PROJECT_SITES_ENDPOINT_<TOOL>` | no | Per-tool endpoint override, e.g. `PROJECT_SITES_ENDPOINT_GET_SSO_CONFIG="GET /api/v2/sso"`. |

`tools/list` works without credentials — schema introspection and CI need no
secrets. The key is checked on the first API call and fails closed with
`NOT_CONFIGURED` rather than firing an unauthenticated request.

## Tools (34)

### Core — 17

| Tool | Endpoint | Notes |
| --- | --- | --- |
| `launch_site` | `POST /api/sites` + workflow poll | **One-prompt entry point.** |
| `create_site` | `POST /api/sites` | Row only; build/deploy are separate. |
| `list_sites` | `GET /api/sites` | `{ data, total }`, `limit`/`offset`. |
| `get_site` | `GET /api/sites/:id` | |
| `update_site` | `PATCH /api/sites/:id` | Business profile + lifecycle `status`. |
| `delete_site` | `DELETE /api/sites/:id` | Requires `confirm: true`. |
| `deploy_site` | `POST /api/sites/:id/deploy` | Multipart ZIP from `zip_path`. |
| `get_site_status` | `GET /api/sites/:id/workflow` | Build/publish state. |
| `get_site_health` | `GET /api/sites/:id/live-check` | 404 unless `publish_live_check` is on. |
| `get_site_logs` | `GET /api/sites/:id/logs` | |
| `get_site_analytics` | `GET /api/sites/:id/analytics` | Optional `from`/`to`. |
| `list_domains` | `GET /api/sites/:siteId/hostnames` | |
| `add_domain` | `POST /api/sites/:siteId/hostnames` | Optional `make_primary`. |
| `auth_me` | `GET /api/auth/me` | User + org for the key. |
| `get_trust_center` | `GET /api/trust-center` | |
| `get_enterprise` | `GET /api/enterprise` | Plan + entitlements. |
| `get_stripe_app` | `GET /api/stripe-app` | Stripe app install state. |

### SDK passthrough — 9

| Tool | Endpoint |
| --- | --- |
| `list_snapshots` | `GET /api/sites/:siteId/snapshots` |
| `list_media` | `GET /api/media/assets` |
| `list_form_submissions` | `GET /api/sites/:siteId/form-submissions` |
| `get_site_trust_profile` | `GET /api/sites/:siteId/trust-profile` |
| `update_site_trust_profile` | `PUT /api/sites/:siteId/trust-profile` |
| `list_audit_exports` | `GET /api/audit-exports` |
| `get_sso_config` | `GET /api/sso/config` |
| `update_sso_config` | `PUT /api/sso/config` |
| `append_sla_snapshot` | `POST /api/sla/snapshots` |

These are the SDK-surface methods named in
[agent-skills#5](https://github.com/heymegabyte/agent-skills/issues/5). Their
public REST paths are not yet in the published OpenAPI document (which currently
emits only `/health`), so every path lives in one map — `SDK_ENDPOINTS` in
`src/config.ts` — and each can be overridden per tool with
`PROJECT_SITES_ENDPOINT_<TOOL>` without touching code.

### Cloudflare provisioning — 8

| Tool | Command | Gate |
| --- | --- | --- |
| `cf_provision_d1` | `wrangler d1 create <name>` | `confirm: true` |
| `list_d1_databases` | `wrangler d1 list --json` | read-only |
| `cf_provision_kv` | `wrangler kv namespace create <title>` | `confirm: true` |
| `list_kv_namespaces` | `wrangler kv namespace list` | read-only |
| `cf_provision_r2` | `wrangler r2 bucket create <name>` | `confirm: true` |
| `list_r2_buckets` | `wrangler r2 bucket list` | read-only |
| `cf_attach_binding` | appends a TOML block | `confirm: true` |
| `cf_set_worker_secret` | `wrangler secret put <NAME> --name <worker>` | `confirm: true` |

## The provisioning flow

Every mutating provisioning tool runs as a **dry run by default**. The dry run
returns the exact command it would execute, so approval is over a concrete argv,
not a promise:

```json
{
  "ok": true,
  "applied": false,
  "tool": "cf_provision_d1",
  "plan": { "bin": "wrangler", "argv": ["d1", "create", "njsk-db"] },
  "note": "Re-call with confirm: true to create."
}
```

Four rules make this safe to hand to an agent:

1. **Plan first.** `confirm` defaults to `false` on every mutating tool.
2. **No shell.** Commands are `spawn(bin, argv)` with an argument array, so a
   slug like `x; rm -rf /` reaches the child as one inert argument.
3. **Secrets never travel through argv.** `cf_set_worker_secret` takes
   `from_env` — the *name* of a local env var — reads the value in-process and
   pipes it to the child's stdin. The value never appears in the plan, the
   result, or a log line, and an unset var fails closed. Output is scrubbed
   defensively in case wrangler ever echoes it.
4. **Config edits are additive.** `cf_attach_binding` refuses when the binding
   name already exists and otherwise appends a TOML array-of-tables block at
   EOF — a valid TOML position — so no existing line is rewritten.

### End-to-end example

```text
1. launch_site(business_name="St. John's Soup Kitchen", slug="njsk")
2. cf_provision_d1(name="njsk-db")              → plan, then confirm: true
3. cf_provision_kv(title="njsk-cache")          → plan, then confirm: true
4. cf_provision_r2(name="njsk-assets")          → plan, then confirm: true
5. cf_attach_binding(kind="d1", binding="DB", resource_id="<id from step 2>", confirm: true)
6. [build the site — skill 16]
7. deploy_site(id, zip_path="/tmp/njsk.zip")
8. add_domain(siteId=id, hostname="njsk.org", make_primary=true)
9. get_site_health(id)
```

## Verification

```bash
npm test        # build + 39 node:test cases
npm run typecheck
```

The suite pins the public contract rather than internals: tool counts and names,
required fields, `confirm` defaults, REST method/path/body per tool, the
`launch_site` sequencing, provisioning plans, and a temp-dir fake `wrangler` that
proves shell metacharacters stay inert and secrets never reach argv or output.

## Provenance

Endpoint paths marked verified in `src/config.ts` were read from the
projectsites.dev backend route modules (`apps/project-sites/src/routes/*`,
`libs/features/*/handlers.ts`). The published OpenAPI document at
`GET /api/openapi.json` currently emits only `/health`, so the SDK passthrough
group is data-driven and overridable rather than hard-coded per tool.
