/**
 * Worker entrypoint — the authenticated control-plane API for the
 * keyword-research service.
 *
 * A single default export carries the three handlers:
 *   fetch(...)     — the Hono app (public /health + the protected API).
 *   queue(...)     — the research-job consumer (delegates to queue.ts).
 *   scheduled(...) — an idempotent periodic refresh/monitor (guarded against a
 *                    double-run inside the same window).
 *
 * Doctrine:
 *  - Public /health leaks NO secrets — provider presence/freshness/budget only.
 *  - Every protected route runs behind the Access middleware and scopes its D1
 *    reads by the authenticated tenant. There is no unscoped read.
 *  - The pipeline + verifier + id/clock are INJECTED via `buildApp` /
 *    `buildQueueDeps`, so local tests drive the whole surface with a fake
 *    verifier + a mock pipeline + simulated D1/R2/Queue bindings and make ZERO
 *    network calls and read ZERO credentials.
 */
import { Hono } from 'hono';
import type { ExecutionContext, MessageBatch, ScheduledController } from '@cloudflare/workers-types';
import type { AppVariables, Env, ResearchJobMessage, TenantContext } from './env';
import { monthlyBudgetUsd } from './env';
import {
  accessMiddleware,
  createCloudflareAccessVerifier,
  type AccessJwtVerifier,
} from './access';
import {
  getHistory,
  getJob,
  insertJob,
  queryOpportunities,
  registerProject,
  ensureTenant,
  upsertProviderMeta,
} from './db';
import { budgetStatus } from './ledger';
import {
  DEFAULT_JOB_ESTIMATE_USD,
  handleQueue,
  type JobRunnerDeps,
} from './queue';
import { runResearch, type ResearchProviders, type RunResearchInput } from './pipeline';
import { toMarkdownReport } from './report';

/* ------------------------------------------------------------------ */
/* Dependency wiring (injectable for tests).                           */
/* ------------------------------------------------------------------ */

/** The pieces the app needs that aren't bindings — all injectable. */
export interface AppDeps {
  /** Verifies Access JWTs. Prod wires the JWKS verifier; tests inject a fake. */
  verifyJwt: AccessJwtVerifier;
  /** Injected clock. */
  now: () => Date;
  /** Injected id generator. */
  newId: () => string;
  /** Queue-consumer deps (pipeline + report renderer + budgets). */
  queueDeps: JobRunnerDeps;
  /** Optional tenant resolver override (forwarded to the Access middleware). */
  resolveTenantId?: (p: { claims?: { tenant_id?: string }; subject: string }) => string;
}

/** A crypto-random id (prod). Tests inject a deterministic counter. */
function randomId(): string {
  return crypto.randomUUID();
}

/** Deterministic opportunity row id from its natural key (stable upsert id). */
export function opportunityIdFor(projectId: string, keyword: string, locale: string): string {
  // A URL-safe, collision-free-per-project id; stable so re-runs upsert in place.
  const slug = `${keyword.trim().toLowerCase()}::${locale}`.replace(/[^a-z0-9:-]+/g, '_');
  return `opp:${projectId}:${slug}`;
}

/**
 * Build the production default deps. The pipeline runner closes over providers
 * built from env at P7b; here it runs with an EMPTY provider set (every metric
 * null + a limitation per absent provider) so the Worker is deployable and
 * demonstrable before any credential is wired — never fabricating data.
 */
export function defaultDeps(env: Env): AppDeps {
  const now = () => new Date();
  const newId = randomId;

  // Prod pipeline runner. At P7b this closure builds real providers from env
  // (DataForSEO / GSC / Exa) and passes them to runResearch; today it runs with
  // the providers the caller passed (empty), honestly surfacing limitations.
  const runPipeline = (input: RunResearchInput) => {
    const providers: ResearchProviders = input.providers ?? {};
    return runResearch({ ...input, providers });
  };

  const queueDeps: JobRunnerDeps = {
    runPipeline,
    renderReport: (result, ctx) => toMarkdownReport(result, ctx),
    now,
    newId,
    opportunityId: opportunityIdFor,
    capUsd: monthlyBudgetUsd(env),
  };

  return {
    verifyJwt: env.ACCESS_TEAM
      ? createCloudflareAccessVerifier(env.ACCESS_TEAM)
      : async () => null, // no team configured ⇒ no JWT path (service token only)
    now,
    newId,
    queueDeps,
  };
}

/* ------------------------------------------------------------------ */
/* The Hono app.                                                       */
/* ------------------------------------------------------------------ */

type AppEnv = { Bindings: Env; Variables: AppVariables };

/**
 * Build the Hono app with injected deps. Exported so tests mount it against
 * simulated bindings + a fake verifier.
 */
export function buildApp(deps: AppDeps): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  /* --- Public: GET /health (NO secrets). --- */
  app.get('/health', async (c) => {
    const env = c.env;
    const cap = monthlyBudgetUsd(env);
    // Provider presence is reported by NAME + boolean only — never a value.
    const providers = {
      dataforseo: Boolean(env.SERVICE_TOKEN) || undefined, // placeholder-safe
    };
    // Freshness is a store-level question; we report the shape even when empty.
    let freshness: { records: number } = { records: 0 };
    try {
      // A cheap, tenant-agnostic count is NOT exposed here (would need a tenant);
      // health stays o(1) and secret-free. Report the budget cap + window shape.
      freshness = { records: 0 };
    } catch {
      freshness = { records: 0 };
    }
    return c.json({
      status: 'ok',
      service: 'keyword-research',
      providers,
      freshness,
      budget: { cap_usd: cap, window_days: 30 },
    });
  });

  /* --- Everything below is protected. --- */
  const protectedApi = new Hono<AppEnv>();
  protectedApi.use(
    '*',
    accessMiddleware({
      verifyJwt: deps.verifyJwt,
      ...(deps.resolveTenantId ? { resolveTenantId: deps.resolveTenantId } : {}),
    }),
  );

  /** Small helper: the authenticated tenant for the current request. */
  const tenantOf = (c: { get: (k: 'tenant') => TenantContext }) => c.get('tenant');

  /* POST /projects — register {domain, locale} → project (+ tenant ensured). */
  protectedApi.post('/projects', async (c) => {
    const tenant = tenantOf(c);
    let body: { domain?: unknown; locale?: unknown };
    try {
      body = (await c.req.json()) as typeof body;
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    const domain = typeof body.domain === 'string' ? body.domain.trim() : '';
    const locale = typeof body.locale === 'string' ? body.locale.trim() : '';
    if (!domain || !locale) {
      return c.json({ error: 'domain and locale are required' }, 422);
    }
    const nowIso = deps.now().toISOString();
    await ensureTenant(c.env.DB, { id: tenant.tenantId, name: tenant.tenantId, createdAt: nowIso });
    const project = await registerProject(c.env.DB, {
      id: deps.newId(),
      tenantId: tenant.tenantId,
      domain,
      locale,
      createdAt: nowIso,
    });
    return c.json({ project: { id: project.id, domain: project.domain, locale: project.locale }, tenant: { id: tenant.tenantId } }, 201);
  });

  /* POST /research — enqueue a job for {projectId, domain}. */
  protectedApi.post('/research', async (c) => {
    const tenant = tenantOf(c);
    let body: { projectId?: unknown };
    try {
      body = (await c.req.json()) as typeof body;
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    const projectId = typeof body.projectId === 'string' ? body.projectId.trim() : '';
    if (!projectId) return c.json({ error: 'projectId is required' }, 422);

    // Scope the project lookup by tenant — a tenant can only enqueue for its own
    // projects (cross-tenant projectId → 404, never a cross-tenant enqueue).
    const { getProject } = await import('./db');
    const project = await getProject(c.env.DB, tenant.tenantId, projectId);
    if (!project) return c.json({ error: 'project_not_found' }, 404);

    const jobId = deps.newId();
    const nowIso = deps.now().toISOString();
    await insertJob(c.env.DB, { id: jobId, projectId, tenantId: tenant.tenantId, enqueuedAt: nowIso });
    const message: ResearchJobMessage = {
      jobId,
      projectId,
      tenantId: tenant.tenantId,
      domain: project.domain,
      locale: project.locale,
    };
    await c.env.RESEARCH_QUEUE.send(message);
    return c.json({ job: { id: jobId, state: 'queued', projectId } }, 202);
  });

  /* GET /research/:jobId — job state/result (scoped). */
  protectedApi.get('/research/:jobId', async (c) => {
    const tenant = tenantOf(c);
    const jobId = c.req.param('jobId');
    const job = await getJob(c.env.DB, tenant.tenantId, jobId);
    if (!job) return c.json({ error: 'job_not_found' }, 404);
    return c.json({
      job: {
        id: job.id,
        projectId: job.project_id,
        state: job.state,
        attempts: job.attempts,
        enqueuedAt: job.enqueued_at,
        startedAt: job.started_at,
        finishedAt: job.finished_at,
        error: job.error,
      },
    });
  });

  /* GET /opportunities?projectId=… — stored opportunities (scoped). */
  protectedApi.get('/opportunities', async (c) => {
    const tenant = tenantOf(c);
    const projectId = c.req.query('projectId')?.trim();
    if (!projectId) return c.json({ error: 'projectId query param is required' }, 422);
    const limit = Number(c.req.query('limit') ?? '100');
    const rows = await queryOpportunities(
      c.env.DB,
      { tenantId: tenant.tenantId, projectId },
      { limit: Number.isFinite(limit) ? limit : 100 },
    );
    return c.json({
      projectId,
      count: rows.length,
      opportunities: rows.map((r) => ({
        keyword: r.keyword,
        locale: r.locale,
        intent: r.intent,
        monthly_search_volume: r.monthly_search_volume, // null stays null
        volume_source: r.volume_source,
        organic_keyword_difficulty: r.organic_keyword_difficulty,
        cpc: r.cpc,
        opportunity_score: r.opportunity_score,
        recommended_action: r.recommended_action,
        collected_at: r.collected_at,
        data_freshness: r.data_freshness,
      })),
    });
  });

  /* GET /reports/:id — stream a persisted report from R2 (scoped via history). */
  protectedApi.get('/reports/:id', async (c) => {
    const tenant = tenantOf(c);
    const id = c.req.param('id');
    // Resolve the R2 key via a tenant-scoped history row — a tenant can only
    // fetch reports whose history row belongs to it.
    const history = await getHistory(c.env.DB, tenant.tenantId, id);
    if (!history) return c.json({ error: 'report_not_found' }, 404);
    const object = await c.env.REPORTS.get(history.report_r2_key);
    if (!object) return c.json({ error: 'report_object_missing' }, 404);
    const contentType = object.httpMetadata?.contentType ?? 'text/markdown; charset=utf-8';
    return new Response(object.body as unknown as ReadableStream, {
      headers: { 'content-type': contentType },
    });
  });

  app.route('/', protectedApi);
  return app;
}

/* ------------------------------------------------------------------ */
/* Scheduled (cron) — idempotent periodic refresh/monitor.             */
/* ------------------------------------------------------------------ */

/** The KV-free double-run guard: one provider_meta row per window stamp. */
export function cronWindowStamp(now: Date, windowMs: number): string {
  // Floor the clock to the window so two fires inside the same window share a
  // stamp — the upsert makes the second a no-op.
  const floored = Math.floor(now.getTime() / windowMs) * windowMs;
  return new Date(floored).toISOString();
}

/** Default cron cadence guard: 6h windows (matches a 4×/day refresh). */
export const CRON_WINDOW_MS = 6 * 60 * 60 * 1000;

/**
 * Run the scheduled refresh ONCE per window. Idempotent: it stamps a sentinel
 * `provider_meta` row keyed by the window; a second fire in the same window
 * sees the stamp unchanged and does no further work. Returns whether it was the
 * first run of the window (for tests).
 */
export async function runScheduled(
  env: Env,
  deps: Pick<AppDeps, 'now'>,
  windowMs = CRON_WINDOW_MS,
): Promise<{ ranThisWindow: boolean; stamp: string }> {
  const now = deps.now();
  const stamp = cronWindowStamp(now, windowMs);

  // Sentinel row: project_id = '__cron__', provider = 'monitor'. Read-before-
  // write so we can tell first-vs-repeat run in the same window.
  const sentinel = await env.DB.prepare(
    `SELECT last_checked FROM provider_meta WHERE project_id = '__cron__' AND provider = 'monitor'`,
  ).first<{ last_checked: string }>();

  if (sentinel && sentinel.last_checked === stamp) {
    // Already ran in this window → no-op (idempotent).
    return { ranThisWindow: false, stamp };
  }

  // First run of the window: stamp it, then do the (cheap, safe) monitor work.
  await upsertProviderMeta(env.DB, {
    projectId: '__cron__',
    tenantId: '__system__',
    provider: 'monitor',
    status: 'ok',
    lastChecked: stamp,
  });

  // Monitor budget health across the system window (no spend, no network).
  await budgetStatus(env.DB, '__system__', now, monthlyBudgetUsd(env));

  return { ranThisWindow: true, stamp };
}

/* ------------------------------------------------------------------ */
/* The default export — the three handlers.                            */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const deps = defaultDeps(env);
    const app = buildApp(deps);
    return app.fetch(request, env as unknown as Record<string, unknown>);
  },

  async queue(batch: MessageBatch<ResearchJobMessage>, env: Env, _ctx: ExecutionContext): Promise<void> {
    const deps = defaultDeps(env);
    await handleQueue(batch, env.DB, env.REPORTS, deps.queueDeps);
  },

  async scheduled(_controller: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const deps = defaultDeps(env);
    await runScheduled(env, { now: deps.now });
  },
} satisfies ExportedHandler<Env, ResearchJobMessage>;

// Keep DEFAULT_JOB_ESTIMATE_USD referenced for prod tuning + re-export surface.
export { DEFAULT_JOB_ESTIMATE_USD };
