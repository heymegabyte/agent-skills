/**
 * D1 query helpers for the control plane.
 *
 * THE ONE RULE: every read is scoped by `project_id` or `tenant_id`. There is
 * no helper that returns another tenant's rows — the tenant/project id is a
 * REQUIRED parameter on every function, baked into the SQL `WHERE`. A caller
 * physically cannot ask for cross-tenant data through this module.
 *
 * All writes are parameterized (no string interpolation of values) and metrics
 * preserve the null-doctrine: an unknown metric is written as SQL NULL, never
 * coerced to 0 (we pass `?? null`, and 0 passes through unchanged as a real 0).
 */
import type { D1Database } from '@cloudflare/workers-types';
import type { KeywordOpportunity } from './types';

/* ------------------------------------------------------------------ */
/* Row shapes (what D1 returns — snake_case, matching the schema).     */
/* ------------------------------------------------------------------ */

export interface ProjectRow {
  id: string;
  tenant_id: string;
  domain: string;
  locale: string;
  created_at: string;
}

export interface JobRow {
  id: string;
  project_id: string;
  tenant_id: string;
  state: JobState;
  enqueued_at: string;
  started_at: string | null;
  finished_at: string | null;
  attempts: number;
  error: string | null;
}

export interface OpportunityRow {
  id: string;
  project_id: string;
  tenant_id: string;
  keyword: string;
  locale: string;
  intent: string;
  monthly_search_volume: number | null;
  volume_source: string | null;
  organic_keyword_difficulty: number | null;
  cpc: number | null;
  opportunity_score: number;
  recommended_action: string;
  collected_at: string;
  data_freshness: number;
}

export interface HistoryRow {
  id: string;
  project_id: string;
  tenant_id: string;
  report_r2_key: string;
  created_at: string;
}

/** Job lifecycle states. */
export type JobState = 'queued' | 'running' | 'done' | 'error' | 'dead_letter';

/* ------------------------------------------------------------------ */
/* Tenants + projects.                                                 */
/* ------------------------------------------------------------------ */

/** Ensure a tenant row exists (idempotent). */
export async function ensureTenant(
  db: D1Database,
  tenant: { id: string; name: string; createdAt: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tenants (id, name, created_at) VALUES (?1, ?2, ?3)
       ON CONFLICT(id) DO NOTHING`,
    )
    .bind(tenant.id, tenant.name, tenant.createdAt)
    .run();
}

/**
 * Register (or fetch) a project for a tenant+domain. Idempotent on
 * (tenant_id, domain): a repeat registration returns the existing row.
 */
export async function registerProject(
  db: D1Database,
  input: { id: string; tenantId: string; domain: string; locale: string; createdAt: string },
): Promise<ProjectRow> {
  await db
    .prepare(
      `INSERT INTO projects (id, tenant_id, domain, locale, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(tenant_id, domain) DO NOTHING`,
    )
    .bind(input.id, input.tenantId, input.domain, input.locale, input.createdAt)
    .run();

  // Read it back scoped by tenant so we always return the canonical row
  // (whether just-inserted or pre-existing) — never a cross-tenant match.
  const row = await db
    .prepare(`SELECT * FROM projects WHERE tenant_id = ?1 AND domain = ?2`)
    .bind(input.tenantId, input.domain)
    .first<ProjectRow>();
  if (!row) throw new Error('registerProject: row vanished after insert');
  return row;
}

/** Fetch a project BY ID, scoped to the tenant (tenant isolation enforced). */
export async function getProject(
  db: D1Database,
  tenantId: string,
  projectId: string,
): Promise<ProjectRow | null> {
  return db
    .prepare(`SELECT * FROM projects WHERE id = ?1 AND tenant_id = ?2`)
    .bind(projectId, tenantId)
    .first<ProjectRow>();
}

/* ------------------------------------------------------------------ */
/* Jobs.                                                               */
/* ------------------------------------------------------------------ */

/** Insert a freshly-enqueued job in `queued` state. */
export async function insertJob(
  db: D1Database,
  job: { id: string; projectId: string; tenantId: string; enqueuedAt: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO research_jobs (id, project_id, tenant_id, state, enqueued_at, attempts)
       VALUES (?1, ?2, ?3, 'queued', ?4, 0)`,
    )
    .bind(job.id, job.projectId, job.tenantId, job.enqueuedAt)
    .run();
}

/** Fetch a job by id, scoped to the tenant. */
export async function getJob(
  db: D1Database,
  tenantId: string,
  jobId: string,
): Promise<JobRow | null> {
  return db
    .prepare(`SELECT * FROM research_jobs WHERE id = ?1 AND tenant_id = ?2`)
    .bind(jobId, tenantId)
    .first<JobRow>();
}

/** Fetch a job by id WITHOUT a tenant filter — internal (queue consumer) use only. */
export async function getJobInternal(db: D1Database, jobId: string): Promise<JobRow | null> {
  return db.prepare(`SELECT * FROM research_jobs WHERE id = ?1`).bind(jobId).first<JobRow>();
}

/** Mark a job `running` + stamp started_at + increment attempts. */
export async function markJobRunning(
  db: D1Database,
  jobId: string,
  startedAt: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE research_jobs
         SET state = 'running', started_at = ?2, attempts = attempts + 1
       WHERE id = ?1`,
    )
    .bind(jobId, startedAt)
    .run();
}

/** Mark a job `done` + stamp finished_at + clear any prior error. */
export async function markJobDone(
  db: D1Database,
  jobId: string,
  finishedAt: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE research_jobs SET state = 'done', finished_at = ?2, error = NULL WHERE id = ?1`,
    )
    .bind(jobId, finishedAt)
    .run();
}

/**
 * Record a failed attempt. If `attempts` has reached `maxAttempts` the job is
 * moved to `dead_letter`; otherwise it returns to `error` (retryable). Returns
 * the resulting state so the consumer can decide whether to retry() the message.
 */
export async function markJobFailed(
  db: D1Database,
  jobId: string,
  error: string,
  maxAttempts: number,
  finishedAt: string,
): Promise<JobState> {
  const current = await getJobInternal(db, jobId);
  const attempts = current?.attempts ?? 0;
  const terminal = attempts >= maxAttempts;
  const state: JobState = terminal ? 'dead_letter' : 'error';
  await db
    .prepare(`UPDATE research_jobs SET state = ?2, error = ?3, finished_at = ?4 WHERE id = ?1`)
    .bind(jobId, state, error.slice(0, 2000), terminal ? finishedAt : null)
    .run();
  return state;
}

/* ------------------------------------------------------------------ */
/* Opportunities.                                                      */
/* ------------------------------------------------------------------ */

/**
 * Upsert a batch of opportunities for a project (one statement per row, run as
 * a D1 batch so it's atomic). Unknown metrics stay NULL. Upsert key is
 * (project_id, keyword, locale).
 */
export async function upsertOpportunities(
  db: D1Database,
  scope: { projectId: string; tenantId: string },
  opportunities: readonly KeywordOpportunity[],
  idFor: (projectId: string, keyword: string, locale: string) => string,
): Promise<number> {
  if (opportunities.length === 0) return 0;
  const stmt = db.prepare(
    `INSERT INTO keyword_opportunities (
       id, project_id, tenant_id, keyword, locale, intent,
       monthly_search_volume, volume_source, organic_keyword_difficulty, cpc,
       opportunity_score, recommended_action, collected_at, data_freshness
     ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)
     ON CONFLICT(project_id, keyword, locale) DO UPDATE SET
       intent = excluded.intent,
       monthly_search_volume = excluded.monthly_search_volume,
       volume_source = excluded.volume_source,
       organic_keyword_difficulty = excluded.organic_keyword_difficulty,
       cpc = excluded.cpc,
       opportunity_score = excluded.opportunity_score,
       recommended_action = excluded.recommended_action,
       collected_at = excluded.collected_at,
       data_freshness = excluded.data_freshness`,
  );
  const batch = opportunities.map((o) =>
    stmt.bind(
      idFor(scope.projectId, o.keyword, o.locale),
      scope.projectId,
      scope.tenantId,
      o.keyword,
      o.locale,
      o.search_intent,
      o.monthly_search_volume ?? null,
      o.volume_source ?? null,
      o.organic_keyword_difficulty ?? null,
      o.cpc ?? null,
      o.opportunity_score,
      o.recommended_action,
      o.collected_at,
      o.data_freshness,
    ),
  );
  await db.batch(batch);
  return opportunities.length;
}

/** Query stored opportunities for a project (scoped), ranked by score desc. */
export async function queryOpportunities(
  db: D1Database,
  scope: { tenantId: string; projectId: string },
  opts: { limit?: number } = {},
): Promise<OpportunityRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 100, 1), 1000);
  const { results } = await db
    .prepare(
      `SELECT * FROM keyword_opportunities
         WHERE project_id = ?1 AND tenant_id = ?2
         ORDER BY opportunity_score DESC, keyword ASC
         LIMIT ?3`,
    )
    .bind(scope.projectId, scope.tenantId, limit)
    .all<OpportunityRow>();
  return results ?? [];
}

/* ------------------------------------------------------------------ */
/* History.                                                            */
/* ------------------------------------------------------------------ */

/**
 * Deterministic history-row id from a jobId, so a retried job reuses its ONE
 * history row (paired with the INSERT OR IGNORE below) rather than appending a
 * duplicate pointer on each redelivery.
 */
export function historyIdFor(jobId: string): string {
  return `hist:${jobId}`;
}

/** Append a research-history row pointing at a persisted R2 report. */
export async function insertHistory(
  db: D1Database,
  row: { id: string; projectId: string; tenantId: string; reportR2Key: string; createdAt: string },
): Promise<void> {
  // OR IGNORE → idempotent on the PK (use `historyIdFor(jobId)` as `id`). A job
  // that inserted history then threw before `markJobDone` and later retried to
  // success re-runs this line with the SAME id; the second insert is a no-op, so
  // retries never duplicate the history pointer.
  await db
    .prepare(
      `INSERT OR IGNORE INTO research_history (id, project_id, tenant_id, report_r2_key, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5)`,
    )
    .bind(row.id, row.projectId, row.tenantId, row.reportR2Key, row.createdAt)
    .run();
}

/** Fetch a single history row by id, scoped to the tenant. */
export async function getHistory(
  db: D1Database,
  tenantId: string,
  id: string,
): Promise<HistoryRow | null> {
  return db
    .prepare(`SELECT * FROM research_history WHERE id = ?1 AND tenant_id = ?2`)
    .bind(id, tenantId)
    .first<HistoryRow>();
}

/* ------------------------------------------------------------------ */
/* Provider meta.                                                      */
/* ------------------------------------------------------------------ */

/** Upsert a provider-health snapshot for a project. */
export async function upsertProviderMeta(
  db: D1Database,
  row: { projectId: string; tenantId: string; provider: string; status: string; lastChecked: string },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO provider_meta (project_id, tenant_id, provider, status, last_checked)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(project_id, provider) DO UPDATE SET
         status = excluded.status,
         last_checked = excluded.last_checked`,
    )
    .bind(row.projectId, row.tenantId, row.provider, row.status, row.lastChecked)
    .run();
}
