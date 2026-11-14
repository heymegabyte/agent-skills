/**
 * @module config
 * @description Runtime configuration and the REST endpoint map for the
 * Project Sites MCP server.
 *
 * Everything is resolved **at call time** (not module load) so tests and
 * embedders can flip env vars after import — the same contract the
 * `skills-gateway-mcp` server uses.
 *
 * ## Endpoint provenance
 *
 * Paths marked `verified` were read from the projectsites.dev backend route
 * modules (`apps/project-sites/src/routes/*` and `libs/features/*\/handlers.ts`)
 * at build time. Paths marked `sdk` are the SDK-surface passthroughs named in
 * heymegabyte/agent-skills#5 whose public REST paths are not yet published in
 * the OpenAPI document (`GET /api/openapi.json` currently emits only
 * `/health`). The `sdk` group is therefore data-driven: every entry can be
 * overridden with `PROJECT_SITES_ENDPOINT_<TOOL>` and all of them share one
 * map, so a backend rename is a one-line change rather than a tool rewrite.
 *
 * @see https://github.com/heymegabyte/agent-skills/issues/5
 */

/** Where the API lives. Trailing slash is stripped so path joins stay clean. */
export const apiBaseUrl = (): string =>
  (process.env.PROJECT_SITES_API_URL ?? 'https://projectsites.dev').replace(/\/+$/, '');

/** Bearer token for the Project Sites API. Empty string means "not configured". */
export const apiKey = (): string => process.env.PROJECT_SITES_API_KEY ?? '';

/** Per-request timeout. Kept short so a wedged socket cannot stall an agent turn. */
export const requestTimeoutMs = (): number => {
  const raw = Number(process.env.PROJECT_SITES_TIMEOUT_MS ?? 30_000);
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
};

/** Cloudflare credentials are read only by the provisioning module. */
export const cloudflare = () => ({
  apiToken: process.env.CF_API_TOKEN ?? '',
  accountId: process.env.CF_ACCOUNT_ID ?? '',
  /** Wrangler binary. Overridable so tests can point at a fixture. */
  wranglerBin: process.env.WRANGLER_BIN ?? 'wrangler',
});

/**
 * REST paths for the SDK passthrough group.
 *
 * `:siteId` is substituted by {@link resolvePath}. Anything not present here has
 * a verified path inline in `tools.ts`.
 */
export const SDK_ENDPOINTS = {
  list_snapshots: 'GET /api/sites/:siteId/snapshots',
  list_media: 'GET /api/media/assets',
  list_form_submissions: 'GET /api/sites/:siteId/form-submissions',
  get_site_trust_profile: 'GET /api/sites/:siteId/trust-profile',
  update_site_trust_profile: 'PUT /api/sites/:siteId/trust-profile',
  list_audit_exports: 'GET /api/audit-exports',
  get_sso_config: 'GET /api/sso/config',
  update_sso_config: 'PUT /api/sso/config',
  append_sla_snapshot: 'POST /api/sla/snapshots',
} as const;

/** A tool name from {@link SDK_ENDPOINTS}. */
export type SdkToolName = keyof typeof SDK_ENDPOINTS;

/**
 * Resolve a tool's `"METHOD /path"` string, honouring the per-tool env override
 * `PROJECT_SITES_ENDPOINT_<UPPER_SNAKE_TOOL>` (e.g.
 * `PROJECT_SITES_ENDPOINT_GET_SSO_CONFIG="GET /api/v2/sso"`).
 */
export function endpointFor(tool: SdkToolName): { method: string; path: string } {
  const override = process.env[`PROJECT_SITES_ENDPOINT_${tool.toUpperCase()}`];
  const raw = override?.trim() || SDK_ENDPOINTS[tool];
  const [method = 'GET', ...rest] = raw.split(/\s+/);
  return { method: method.toUpperCase(), path: rest.join(' ') };
}

/** Substitute `:name` tokens; throw rather than ship a literal `:siteId` to the API. */
export function resolvePath(path: string, params: Record<string, string>): string {
  return path.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (_match, key: string) => {
    const value = params[key];
    if (value === undefined) throw new Error(`Missing path parameter ":${key}" for ${path}`);
    return encodeURIComponent(value);
  });
}
