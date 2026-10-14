/**
 * Shared runtime environment + request-context types for the control plane.
 *
 * Kept in its own module so `db.ts`, `ledger.ts`, `access.ts`, `queue.ts`, and
 * `worker.ts` can all depend on the same `Env`/`TenantContext` without a cycle
 * back through `worker.ts`.
 *
 * Everything the Worker touches that is a Cloudflare binding is declared here;
 * IDs/names are set in `wrangler.jsonc` (and filled with real IDs at P7b).
 */

/** The Worker's bound resources + vars. */
export interface Env {
  /** D1 — normalized opportunity store, jobs, ledger, history, provider meta. */
  DB: D1Database;
  /** R2 — persisted research reports (markdown/json bytes). */
  REPORTS: R2Bucket;
  /** Queue producer — enqueue research jobs. */
  RESEARCH_QUEUE: Queue<ResearchJobMessage>;

  // --- Vars (set in wrangler.jsonc; placeholders locally) ---
  /** Expected Cloudflare Access JWT audience (aud) tag. */
  ACCESS_AUD?: string;
  /** Cloudflare Access team domain, e.g. "myteam" in myteam.cloudflareaccess.com. */
  ACCESS_TEAM?: string;
  /** Optional bearer service token accepted as an alternative to Access. */
  SERVICE_TOKEN?: string;
  /** Hard monthly USD budget cap (defaults to 20 when unset). */
  MONTHLY_BUDGET_USD?: string;
}

/**
 * The authenticated principal for a request, extracted by the Access
 * middleware. `projectId` is only present once a route resolves a project; the
 * tenant is always present on a protected route.
 */
export interface TenantContext {
  tenantId: string;
  /** How the caller authenticated (for audit/debug — never a secret value). */
  via: 'access-jwt' | 'service-token';
  /** The subject/identity string (email for JWT, client-id for a token). */
  subject: string;
}

/** The message shape carried on the research queue. */
export interface ResearchJobMessage {
  jobId: string;
  projectId: string;
  tenantId: string;
  domain: string;
  locale: string;
}

/** Hono variable map — what middleware stashes on `c.var`. */
export interface AppVariables {
  tenant: TenantContext;
}

/** Resolve the effective monthly budget cap from env (default $20). */
export function monthlyBudgetUsd(env: Env): number {
  const raw = env.MONTHLY_BUDGET_USD;
  if (raw === undefined) return 20;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 20;
}
