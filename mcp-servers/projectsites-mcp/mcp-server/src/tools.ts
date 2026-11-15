/**
 * @module tools
 * @description The Project Sites MCP tool manifest — 34 tools across three
 * groups, plus the Zod→JSON Schema bridge MCP needs for `tools/list`.
 *
 * Groups
 *  - **core** (17) — sites CRUD, deploy, status/health/logs/analytics, domains,
 *    Trust Center / Enterprise / Stripe-app surfaces, `auth_me`, and the
 *    one-prompt `launch_site` orchestrator.
 *  - **sdk** (9) — the SDK-surface passthroughs named in
 *    heymegabyte/agent-skills#5. Paths come from `config.SDK_ENDPOINTS` so a
 *    backend rename is data, not code.
 *  - **provisioning** (8) — Cloudflare D1/KV/R2 create + list, binding attach,
 *    and worker-secret upload. Plan-first; see `provisioning.ts`.
 *
 * Every handler returns a plain JSON-serialisable value. Failures throw
 * `ApiError` (or a `{ok:false}` envelope from provisioning) and `index.ts`
 * converts that to an MCP `isError` result — no handler returns a silent `{}`.
 */
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { z, type ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { endpointFor, resolvePath, type SdkToolName } from './config.js';
import { request, type Runtime } from './http.js';
import {
  AttachBindingInput,
  attachBinding,
  listD1Databases,
  listKvNamespaces,
  listR2Buckets,
  ProvisionD1Input,
  ProvisionKvInput,
  ProvisionR2Input,
  provisionD1,
  provisionKv,
  provisionR2,
  SetWorkerSecretInput,
  setWorkerSecret,
  type AttachBindingInput as AttachBindingInputType,
  type ProvisionD1Input as ProvisionD1InputType,
  type ProvisionKvInput as ProvisionKvInputType,
  type ProvisionR2Input as ProvisionR2InputType,
  type SetWorkerSecretInput as SetWorkerSecretInputType,
} from './provisioning.js';

/** Which surface a tool belongs to. Surfaced in the README + fleet registry. */
export type ToolCategory = 'core' | 'sdk' | 'provisioning';

/** One MCP tool: a name, a description the model reads, a Zod schema, a handler. */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodTypeAny;
  category: ToolCategory;
  handler: (rt: Runtime, input: never) => Promise<unknown>;
}

/** Type-preserving helper so each handler's input is inferred from its schema. */
function defineTool<S extends ZodTypeAny>(
  name: string,
  category: ToolCategory,
  description: string,
  inputSchema: S,
  run: (rt: Runtime, input: z.infer<S>) => Promise<unknown>,
): ToolDefinition {
  return { name, category, description, inputSchema, handler: run as ToolDefinition['handler'] };
}

/** Convert a Zod schema to the JSON Schema MCP advertises. */
export function toJsonSchema(schema: ZodTypeAny): Record<string, unknown> {
  const json = zodToJsonSchema(schema, { target: 'jsonSchema7', $refStrategy: 'none' }) as Record<string, unknown>;
  delete json.$schema;
  // Normalise the two fields every MCP client inspects, so the shape is uniform
  // whether or not the tool happens to have required or optional arguments.
  json.type ??= 'object';
  json.required ??= [];
  json.properties ??= {};
  return json;
}

// ── shared field schemas ─────────────────────────────────────────────────────

const siteId = z.string().min(1).describe('Site id (UUID) from list_sites.');
const siteIdKey = { siteId } as const;

const pagination = {
  limit: z.number().int().positive().max(500).optional().describe('Page size (default 250, max 500).'),
  offset: z.number().int().min(0).optional().describe('Rows to skip (default 0).'),
};

// ── core: sites ──────────────────────────────────────────────────────────────

const ListSitesInput = z.object({ ...pagination });

const GetSiteInput = z.object({ id: siteId });

const CreateSiteInput = z.object({
  business_name: z.string().min(1).max(120).describe('Legal or trade name, e.g. "St. John\'s Soup Kitchen".'),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, digits, dashes.')
    .optional()
    .describe('URL slug. Omit to let the API derive one.'),
  business_phone: z.string().max(20).nullish(),
  business_email: z.string().email().max(254).nullish(),
  business_address: z.string().max(500).nullish(),
  google_place_id: z.string().max(255).nullish().describe('Pin the site to a Google Places record when known.'),
});

const UpdateSiteInput = z.object({
  id: siteId,
  business_name: z.string().min(1).max(120).optional(),
  business_phone: z.string().max(20).nullish(),
  business_email: z.string().email().max(254).nullish(),
  business_address: z.string().max(500).nullish(),
  business_website: z.string().url().max(2048).nullish(),
  original_prompt: z.string().max(8000).nullish(),
  logo_url: z.string().url().max(2048).nullish(),
  app_icon_url: z.string().url().max(2048).nullish(),
  status: z.enum(['draft', 'building', 'published', 'archived']).optional(),
});

const DeleteSiteInput = z.object({
  id: siteId,
  confirm: z.boolean().default(false).describe('Deleting is irreversible. Must be true to proceed.'),
});

const DeploySiteInput = z.object({
  id: siteId,
  zip_path: z.string().min(1).describe('Absolute path to the built site ZIP.'),
  dist_path: z.string().default('dist/').describe('Directory inside the ZIP that holds the built assets.'),
  chat_path: z.string().optional().describe('Optional path to a chat transcript to attach with the deploy.'),
});

// ── core: observability ──────────────────────────────────────────────────────

const GetSiteStatusInput = z.object({ id: siteId });
const GetSiteHealthInput = z.object({ id: siteId });
const GetSiteLogsInput = z.object({ id: siteId, ...pagination });
const GetSiteAnalyticsInput = z.object({
  id: siteId,
  from: z.string().optional().describe('ISO date, inclusive.'),
  to: z.string().optional().describe('ISO date, inclusive.'),
});

// ── core: domains ────────────────────────────────────────────────────────────

const ListDomainsInput = z.object({ siteId });
const AddDomainInput = z.object({
  siteId,
  hostname: z.string().min(3).describe('Fully-qualified hostname, e.g. "njsk.org".'),
  make_primary: z.boolean().default(false),
});

// ── core: one-prompt launch ──────────────────────────────────────────────────

const LaunchSiteInput = z.object({
  business_name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  business_email: z.string().email().max(254).nullish(),
  business_phone: z.string().max(20).nullish(),
  business_address: z.string().max(500).nullish(),
  google_place_id: z.string().max(255).nullish(),
  wait_ms: z
    .number()
    .int()
    .min(0)
    .max(30_000)
    .default(0)
    .describe('How long to poll the build workflow before returning (0 = single check).'),
});

// ── sdk passthrough ─────────────────────────────────────────────────────────

/** Generic "METHOD path, optional params/query/body" handler. */
function sdkTool(
  name: SdkToolName,
  description: string,
  schema: ZodTypeAny,
  map: (input: Record<string, unknown>) => { params?: Record<string, string>; query?: Record<string, unknown>; body?: unknown },
) {
  return defineTool(name, 'sdk', description, schema, async (rt, input) => {
    const { method, path } = endpointFor(name);
    const { params = {}, query, body } = map(input as Record<string, unknown>);
    return request(rt, resolvePath(path, params), {
      method,
      query: query as Record<string, string | number | boolean | undefined | null> | undefined,
      body,
    });
  });
}

const ListSnapshotsInput = z.object({ ...siteIdKey, ...pagination });
const ListMediaInput = z.object({
  ...pagination,
  kind: z.enum(['image', 'video', 'audio', 'document']).optional(),
});
const ListFormSubmissionsInput = z.object({ ...siteIdKey, ...pagination, status: z.string().optional() });
const GetTrustProfileInput = z.object({ siteId });
const UpdateTrustProfileInput = z.object({
  siteId,
  profile: z.record(z.unknown()).describe('Trust Center profile fields to merge.'),
});
const ListAuditExportsInput = z.object({ ...pagination });
const GetSsoConfigInput = z.object({});
const UpdateSsoConfigInput = z.object({ config: z.record(z.unknown()).describe('SSO configuration to apply.') });
const AppendSlaSnapshotInput = z.object({
  period_start: z.string().describe('ISO date the SLA window opens.'),
  period_end: z.string().describe('ISO date the SLA window closes.'),
  uptime_pct: z.number().min(0).max(100).optional(),
  incidents: z.array(z.record(z.unknown())).optional(),
});

// ── manifest ────────────────────────────────────────────────────────────────

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // ----- core: sites -----
  defineTool(
    'list_sites',
    'core',
    'List every site in the authenticated organization, newest first. Returns `{ data, total }`.',
    ListSitesInput,
    (rt, input) => request(rt, '/api/sites', { query: input }),
  ),
  defineTool('get_site', 'core', 'Fetch one site by id, including its primary hostname.', GetSiteInput, (rt, input) =>
    request(rt, `/api/sites/${encodeURIComponent(input.id)}`),
  ),
  defineTool(
    'create_site',
    'core',
    'Create a site record. This provisions the row only — build and deploy are separate steps (see launch_site).',
    CreateSiteInput,
    (rt, input) => request(rt, '/api/sites', { method: 'POST', body: input }),
  ),
  defineTool('update_site', 'core', 'Patch a site\'s business profile or lifecycle status.', UpdateSiteInput, (rt, input) => {
    const { id, ...patch } = input;
    return request(rt, `/api/sites/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
  }),
  defineTool(
    'delete_site',
    'core',
    'Soft-delete a site. Irreversible from this surface — requires confirm: true.',
    DeleteSiteInput,
    async (rt, input) => {
      if (!input.confirm) {
        return {
          ok: false,
          tool: 'delete_site',
          plan: { method: 'DELETE', path: `/api/sites/${input.id}` },
          note: 'Re-call with confirm: true to delete.',
        };
      }
      return request(rt, `/api/sites/${encodeURIComponent(input.id)}`, { method: 'DELETE' });
    },
  ),
  defineTool(
    'deploy_site',
    'core',
    'Deploy a built site from a local ZIP (multipart upload). Returns the deployed version.',
    DeploySiteInput,
    async (rt, input) => {
      const zip = await readFile(input.zip_path);
      const form = new FormData();
      form.set('zip', new Blob([zip], { type: 'application/zip' }), basename(input.zip_path));
      form.set('dist_path', input.dist_path);
      if (input.chat_path) {
        form.set('chat', new Blob([await readFile(input.chat_path)], { type: 'application/json' }), basename(input.chat_path));
      }
      return request(rt, `/api/sites/${encodeURIComponent(input.id)}/deploy`, {
        method: 'POST',
        form,
        timeoutMs: 300_000,
      });
    },
  ),
  // ----- core: observability -----
  defineTool('get_site_status', 'core', 'Read a site\'s current build/publish workflow state.', GetSiteStatusInput, (rt, input) =>
    request(rt, `/api/sites/${encodeURIComponent(input.id)}/workflow`),
  ),
  defineTool(
    'get_site_health',
    'core',
    'Probe a published site\'s live URL (server-side HEAD check). Flag-gated: 404 when publish_live_check is off.',
    GetSiteHealthInput,
    (rt, input) => request(rt, `/api/sites/${encodeURIComponent(input.id)}/live-check`),
  ),
  defineTool('get_site_logs', 'core', 'Read the per-site audit log, newest first.', GetSiteLogsInput, (rt, input) =>
    request(rt, `/api/sites/${encodeURIComponent(input.id)}/logs`, { query: input }),
  ),
  defineTool(
    'get_site_analytics',
    'core',
    'Per-site traffic analytics summary for an optional date range.',
    GetSiteAnalyticsInput,
    (rt, input) => {
      const { id, ...query } = input;
      return request(rt, `/api/sites/${encodeURIComponent(id)}/analytics`, { query });
    },
  ),
  // ----- core: domains -----
  defineTool('list_domains', 'core', 'List the hostnames attached to a site, primary first.', ListDomainsInput, (rt, input) =>
    request(rt, `/api/sites/${encodeURIComponent(input.siteId)}/hostnames`),
  ),
  defineTool('add_domain', 'core', 'Attach a hostname to a site and optionally promote it to primary.', AddDomainInput, (rt, input) => {
    const { siteId: sid, ...body } = input;
    return request(rt, `/api/sites/${encodeURIComponent(sid)}/hostnames`, { method: 'POST', body });
  }),
  // ----- core: org surfaces -----
  defineTool('auth_me', 'core', 'Return the authenticated user and organization for the current API key.', z.object({}), (rt) =>
    request(rt, '/api/auth/me'),
  ),
  defineTool('get_trust_center', 'core', 'Read the org\'s public Trust Center profile.', z.object({}), (rt) =>
    request(rt, '/api/trust-center'),
  ),
  defineTool('get_enterprise', 'core', 'Read the org\'s Enterprise plan, limits, and entitlements.', z.object({}), (rt) =>
    request(rt, '/api/enterprise'),
  ),
  defineTool('get_stripe_app', 'core', 'Read the org\'s Stripe app installation and status.', z.object({}), (rt) =>
    request(rt, '/api/stripe-app'),
  ),
  // ----- core: one-prompt -----
  defineTool(
    'launch_site',
    'core',
    'ONE-PROMPT ENTRY POINT. Create a site, then poll its build workflow for up to wait_ms. Returns the created site and its current status — follow with deploy_site and add_domain.',
    LaunchSiteInput,
    async (rt, input) => {
      const { wait_ms: waitMs, ...create } = input;
      const created = await request<{ id?: string; site?: { id?: string } }>(rt, '/api/sites', {
        method: 'POST',
        body: create,
      });
      const id = created?.id ?? created?.site?.id;
      if (!id) return { created, status: null, note: 'Site created but the response carried no id; call list_sites.' };

      const deadline = Date.now() + waitMs;
      let status = await request(rt, `/api/sites/${encodeURIComponent(id)}/workflow`).catch((error: Error) => ({
        error: error.message,
      }));
      while (waitMs > 0 && Date.now() < deadline && isPending(status)) {
        await new Promise((r) => setTimeout(r, 2_000));
        status = await request(rt, `/api/sites/${encodeURIComponent(id)}/workflow`).catch((error: Error) => ({
          error: error.message,
        }));
      }
      return {
        id,
        created,
        status,
        next: ['deploy_site (with a built ZIP)', 'add_domain', 'get_site_health'],
      };
    },
  ),
  // ----- sdk passthrough -----
  sdkTool('list_snapshots', 'List a site\'s versioned snapshots, newest first.', ListSnapshotsInput, (input) => ({
    params: { siteId: String(input.siteId) },
    query: { limit: input.limit, offset: input.offset },
  })),
  sdkTool('list_media', 'List media assets in the org library.', ListMediaInput, (input) => ({
    query: { limit: input.limit, offset: input.offset, kind: input.kind },
  })),
  sdkTool('list_form_submissions', 'List inbound form submissions for a site.', ListFormSubmissionsInput, (input) => ({
    params: { siteId: String(input.siteId) },
    query: { limit: input.limit, offset: input.offset, status: input.status },
  })),
  sdkTool('get_site_trust_profile', 'Read a site\'s Trust Center profile.', GetTrustProfileInput, (input) => ({
    params: { siteId: String(input.siteId) },
  })),
  sdkTool('update_site_trust_profile', 'Merge fields into a site\'s Trust Center profile.', UpdateTrustProfileInput, (input) => ({
    params: { siteId: String(input.siteId) },
    body: input.profile,
  })),
  sdkTool('list_audit_exports', 'List generated audit-trail exports.', ListAuditExportsInput, (input) => ({
    query: { limit: input.limit, offset: input.offset },
  })),
  sdkTool('get_sso_config', 'Read the org SSO configuration.', GetSsoConfigInput, () => ({})),
  sdkTool('update_sso_config', 'Apply an SSO configuration.', UpdateSsoConfigInput, (input) => ({ body: input.config })),
  sdkTool('append_sla_snapshot', 'Append an SLA reporting snapshot for a period.', AppendSlaSnapshotInput, (input) => ({
    body: input,
  })),
  // ----- Cloudflare provisioning -----
  defineTool(
    'cf_provision_d1',
    'provisioning',
    'Create a D1 database. Dry run unless confirm: true.',
    ProvisionD1Input,
    (rt, input: ProvisionD1InputType) => provisionD1(rt, input),
  ),
  defineTool('list_d1_databases', 'provisioning', 'List D1 databases in the account (read-only).', z.object({}), (rt) =>
    listD1Databases(rt),
  ),
  defineTool(
    'cf_provision_kv',
    'provisioning',
    'Create a KV namespace. Dry run unless confirm: true.',
    ProvisionKvInput,
    (rt, input: ProvisionKvInputType) => provisionKv(rt, input),
  ),
  defineTool('list_kv_namespaces', 'provisioning', 'List KV namespaces in the account (read-only).', z.object({}), (rt) =>
    listKvNamespaces(rt),
  ),
  defineTool(
    'cf_provision_r2',
    'provisioning',
    'Create an R2 bucket. Dry run unless confirm: true.',
    ProvisionR2Input,
    (rt, input: ProvisionR2InputType) => provisionR2(rt, input),
  ),
  defineTool('list_r2_buckets', 'provisioning', 'List R2 buckets in the account (read-only).', z.object({}), (rt) =>
    listR2Buckets(rt),
  ),
  defineTool(
    'cf_attach_binding',
    'provisioning',
    'Append a D1/KV/R2 binding to a wrangler config. Additive only; refused when the binding already exists.',
    AttachBindingInput,
    (rt, input: AttachBindingInputType) => attachBinding(rt, input),
  ),
  defineTool(
    'cf_set_worker_secret',
    'provisioning',
    'Upload a Worker secret from a named local env var (never from an argument value). Dry run unless confirm: true.',
    SetWorkerSecretInput,
    (rt, input: SetWorkerSecretInputType) => setWorkerSecret(rt, input),
  ),
];

/** Name → definition, for O(1) dispatch. */
export const TOOLS_BY_NAME: ReadonlyMap<string, ToolDefinition> = new Map(
  TOOL_DEFINITIONS.map((tool) => [tool.name, tool]),
);

/** Tool counts per group — asserted by the tests so the manifest cannot drift. */
export function toolCounts(): Record<ToolCategory, number> {
  return TOOL_DEFINITIONS.reduce(
    (acc, tool) => ({ ...acc, [tool.category]: acc[tool.category] + 1 }),
    { core: 0, sdk: 0, provisioning: 0 } as Record<ToolCategory, number>,
  );
}

/** The `tools/list` payload. */
export function listToolsPayload() {
  return TOOL_DEFINITIONS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: toJsonSchema(tool.inputSchema),
  }));
}

/** True when a workflow payload still describes in-flight work. */
function isPending(status: unknown): boolean {
  if (!status || typeof status !== 'object') return false;
  const record = status as Record<string, unknown>;
  const state = String(record.status ?? record.state ?? record.phase ?? '').toLowerCase();
  return ['queued', 'pending', 'running', 'building', 'in_progress', 'started'].includes(state);
}
