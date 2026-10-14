/**
 * §17 — Cloudflare control-plane tests (LOCAL ONLY).
 *
 * Stack: better-sqlite3 D1 shim + in-memory R2/Queue fakes + the real Hono app,
 * with a fake Access verifier and a MOCK pipeline injected. Zero network, zero
 * credentials. (See test/cf/fakes.ts for why pool-workers was NOT used.)
 *
 * The eight §17 cases, each in its own describe block:
 *   1. migrations apply + D1 round-trip
 *   2. R2 report persistence
 *   3. queue job → pipeline → D1 + R2 → state=done
 *   4. cron idempotency (2nd run same window = no-op)
 *   5. Access: 401 w/o creds, 200 with
 *   6. tenant isolation (project A cannot read project B)
 *   7. retry handling (failing job retries then marks error/dead-letters)
 *   8. cost limit (job over remaining budget rejected by ledger breaker)
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  bearerHeaders,
  counterIds,
  jwtHeaders,
  makeHarness,
  mockPipeline,
  mockRender,
  type Harness,
} from './harness';
import { FakeD1Database } from './fakes';
import { getJob, getProject, insertJob, markJobDone, queryOpportunities, registerProject, ensureTenant } from '../../src/db';
import {
  DEFAULT_MAX_ATTEMPTS,
  handleQueue,
  processJob,
  reportKey,
} from '../../src/queue';
import { runScheduled, cronWindowStamp, CRON_WINDOW_MS, opportunityIdFor } from '../../src/worker';
import {
  assertWithinBudget,
  BudgetExceededError,
  budgetStatus,
  globalBudgetStatus,
  recordLedgerEntry,
  reserveBudget,
} from '../../src/ledger';
import { makeBatch } from './fakes';
import type { ResearchJobMessage } from '../../src/env';

const NOW = () => new Date('2026-10-14T12:00:00.000Z');

/** Helper: register a project via the DB layer and return its id. */
async function seedProject(h: Harness, tenantId: string, domain = 'example.com'): Promise<string> {
  await ensureTenant(h.db.asD1(), { id: tenantId, name: tenantId, createdAt: NOW().toISOString() });
  const p = await registerProject(h.db.asD1(), {
    id: `proj-${domain}`,
    tenantId,
    domain,
    locale: 'en-US',
    createdAt: NOW().toISOString(),
  });
  return p.id;
}

/* =================================================================== */
/* Case 1 — migrations apply + D1 round-trip.                          */
/* =================================================================== */
describe('§17.1 migrations apply + D1 round-trip', () => {
  it('applies 0001_init.sql and creates every table', () => {
    const db = new FakeD1Database();
    db.applyMigrations();
    const tables = db.sqlite
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`)
      .all()
      .map((r) => (r as { name: string }).name);
    for (const t of [
      'tenants',
      'projects',
      'keyword_opportunities',
      'research_jobs',
      'research_history',
      'cost_ledger',
      'provider_meta',
    ]) {
      expect(tables).toContain(t);
    }
  });

  it('round-trips a project insert → select (idempotent on tenant+domain)', async () => {
    const db = new FakeD1Database();
    db.applyMigrations();
    const d1 = db.asD1();
    await ensureTenant(d1, { id: 'tenant:a', name: 'A', createdAt: NOW().toISOString() });
    const first = await registerProject(d1, {
      id: 'p1',
      tenantId: 'tenant:a',
      domain: 'example.com',
      locale: 'en-US',
      createdAt: NOW().toISOString(),
    });
    // Re-register same (tenant, domain) with a DIFFERENT id → same row back.
    const again = await registerProject(d1, {
      id: 'p-other',
      tenantId: 'tenant:a',
      domain: 'example.com',
      locale: 'en-US',
      createdAt: NOW().toISOString(),
    });
    expect(again.id).toBe(first.id);
    const fetched = await getProject(d1, 'tenant:a', 'p1');
    expect(fetched?.domain).toBe('example.com');
  });

  it('upserts opportunities and preserves NULL metrics (never 0)', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, 'tenant:a');
    const pipeline = mockPipeline();
    const result = await pipeline({
      providers: {},
      project: { domain: 'example.com', locale: 'en-US', geography: 'US', language: 'en' },
      pageInventory: [],
      pageMap: { version: 1, entries: {} },
      budget: { maxSpendUsd: 20 },
      now: NOW,
    });
    const { upsertOpportunities } = await import('../../src/db');
    await upsertOpportunities(h.db.asD1(), { projectId, tenantId: 'tenant:a' }, result.opportunities, opportunityIdFor);
    const rows = await queryOpportunities(h.db.asD1(), { tenantId: 'tenant:a', projectId }, {});
    expect(rows.length).toBe(2);
    const obscure = rows.find((r) => r.keyword === 'obscure crm tactic')!;
    expect(obscure.monthly_search_volume).toBeNull();
    expect(obscure.monthly_search_volume).not.toBe(0);
    // Ranked by score desc.
    expect(rows[0]!.opportunity_score).toBeGreaterThanOrEqual(rows[1]!.opportunity_score);
  });

  it('upsert is idempotent on (project, keyword, locale)', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, 'tenant:a');
    const pipeline = mockPipeline();
    const result = await pipeline({
      providers: {},
      project: { domain: 'example.com', locale: 'en-US', geography: 'US', language: 'en' },
      pageInventory: [],
      pageMap: { version: 1, entries: {} },
      budget: { maxSpendUsd: 20 },
      now: NOW,
    });
    const { upsertOpportunities } = await import('../../src/db');
    await upsertOpportunities(h.db.asD1(), { projectId, tenantId: 'tenant:a' }, result.opportunities, opportunityIdFor);
    await upsertOpportunities(h.db.asD1(), { projectId, tenantId: 'tenant:a' }, result.opportunities, opportunityIdFor);
    const rows = await queryOpportunities(h.db.asD1(), { tenantId: 'tenant:a', projectId }, {});
    expect(rows.length).toBe(2); // still 2, not 4
  });
});

/* =================================================================== */
/* Case 2 — R2 report persistence.                                     */
/* =================================================================== */
describe('§17.2 R2 report persistence', () => {
  it('persists a report body to R2 and streams it back via GET /reports/:id', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());

    // Enqueue + run a job so a report + history row exist.
    await h.request('/research', { method: 'POST', headers: jwtHeaders(), body: JSON.stringify({ projectId }) });
    await drainQueue(h);

    // Find the history id (the GET key) from D1.
    const historyId = (
      h.db.sqlite.prepare(`SELECT id FROM research_history LIMIT 1`).get() as { id: string }
    ).id;

    const res = await h.request(`/reports/${historyId}`, { headers: jwtHeaders() });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/markdown');
    const body = await res.text();
    expect(body).toContain('# Report for example.com');
    // The object really lives in R2 under the expected key.
    const key = reportKey('reports', projectId, firstJobId(h));
    expect(h.reports.store.has(key)).toBe(true);
  });

  it('GET /reports/:id is 404 for an unknown id (never leaks cross-tenant)', async () => {
    const h = makeHarness();
    await seedProject(h, defaultTenant());
    const res = await h.request('/reports/does-not-exist', { headers: jwtHeaders() });
    expect(res.status).toBe(404);
  });
});

/* =================================================================== */
/* Case 3 — queue job → pipeline → D1 + R2 → state=done.               */
/* =================================================================== */
describe('§17.3 queue job → pipeline → D1 + R2 → state=done', () => {
  it('runs the full consumer path and marks the job done', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());

    const enq = await h.request('/research', {
      method: 'POST',
      headers: jwtHeaders(),
      body: JSON.stringify({ projectId }),
    });
    expect(enq.status).toBe(202);
    const { job } = (await enq.json()) as { job: { id: string; state: string } };
    expect(job.state).toBe('queued');
    expect(h.queue.sent.length).toBe(1);

    await drainQueue(h);

    // Job is done.
    const done = await getJob(h.db.asD1(), defaultTenant(), job.id);
    expect(done?.state).toBe('done');
    expect(done?.finished_at).toBeTruthy();

    // Opportunities landed in D1.
    const rows = await queryOpportunities(h.db.asD1(), { tenantId: defaultTenant(), projectId }, {});
    expect(rows.length).toBe(2);

    // Report landed in R2 + history points at it.
    const key = reportKey('reports', projectId, job.id);
    expect(h.reports.store.has(key)).toBe(true);
    const hist = h.db.sqlite.prepare(`SELECT report_r2_key FROM research_history LIMIT 1`).get() as { report_r2_key: string };
    expect(hist.report_r2_key).toBe(key);

    // GET /research/:jobId reflects the terminal state.
    const status = await h.request(`/research/${job.id}`, { headers: jwtHeaders() });
    const payload = (await status.json()) as { job: { state: string } };
    expect(payload.job.state).toBe('done');
  });

  it('is IDEMPOTENT: re-delivering a finished job is a no-op (no double-write)', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    const msg: ResearchJobMessage = {
      jobId: 'job-x',
      projectId,
      tenantId: defaultTenant(),
      domain: 'example.com',
      locale: 'en-US',
    };
    await insertJob(h.db.asD1(), { id: 'job-x', projectId, tenantId: defaultTenant(), enqueuedAt: NOW().toISOString() });

    const deps = h.deps.queueDeps;
    const first = await processJob(h.db.asD1(), h.reports.asR2(), msg, deps);
    expect(first).toBe('done');
    const rowsAfter1 = await queryOpportunities(h.db.asD1(), { tenantId: defaultTenant(), projectId }, {});

    // Second delivery of the SAME (now done) job → skipped, nothing changes.
    const second = await processJob(h.db.asD1(), h.reports.asR2(), msg, deps);
    expect(second).toBe('skipped');
    const rowsAfter2 = await queryOpportunities(h.db.asD1(), { tenantId: defaultTenant(), projectId }, {});
    expect(rowsAfter2.length).toBe(rowsAfter1.length);

    // Exactly one history row (no duplicate report record).
    const histCount = (h.db.sqlite.prepare(`SELECT COUNT(*) c FROM research_history`).get() as { c: number }).c;
    expect(histCount).toBe(1);
  });

  it('acks a skipped (missing) job without spending', async () => {
    const h = makeHarness();
    const msg: ResearchJobMessage = {
      jobId: 'ghost',
      projectId: 'nope',
      tenantId: defaultTenant(),
      domain: 'example.com',
      locale: 'en-US',
    };
    const outcome = await processJob(h.db.asD1(), h.reports.asR2(), msg, h.deps.queueDeps);
    expect(outcome).toBe('skipped');
    const ledger = (h.db.sqlite.prepare(`SELECT COUNT(*) c FROM cost_ledger`).get() as { c: number }).c;
    expect(ledger).toBe(0);
  });
});

/* =================================================================== */
/* Case 4 — cron idempotency.                                          */
/* =================================================================== */
describe('§17.4 cron idempotency (2nd run same window = no-op)', () => {
  it('runs once per window; a second fire in the same window is a no-op', async () => {
    const h = makeHarness();
    const first = await runScheduled(h.env, { now: NOW });
    expect(first.ranThisWindow).toBe(true);

    const second = await runScheduled(h.env, { now: NOW });
    expect(second.ranThisWindow).toBe(false);
    expect(second.stamp).toBe(first.stamp);

    // Exactly one sentinel row exists (no duplicate monitor rows).
    const count = (
      h.db.sqlite
        .prepare(`SELECT COUNT(*) c FROM provider_meta WHERE project_id='__cron__'`)
        .get() as { c: number }
    ).c;
    expect(count).toBe(1);
  });

  it('runs again in a LATER window', async () => {
    const h = makeHarness();
    await runScheduled(h.env, { now: () => new Date('2026-10-14T00:00:00.000Z') });
    // +7h ⇒ next 6h window ⇒ should run again.
    const later = await runScheduled(h.env, { now: () => new Date('2026-10-14T07:00:00.000Z') });
    expect(later.ranThisWindow).toBe(true);
  });

  it('cronWindowStamp floors to the window boundary', () => {
    const a = cronWindowStamp(new Date('2026-10-14T01:59:59.000Z'), CRON_WINDOW_MS);
    const b = cronWindowStamp(new Date('2026-10-14T00:00:00.000Z'), CRON_WINDOW_MS);
    expect(a).toBe(b); // both in the 00:00–06:00 window
  });
});

/* =================================================================== */
/* Case 5 — Access: 401 w/o creds, 200 with.                           */
/* =================================================================== */
describe('§17.5 Access middleware', () => {
  it('public /health needs no auth and NEVER leaks secrets', async () => {
    const h = makeHarness();
    const res = await h.request('/health');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain('SVC-SECRET');
    expect(text).not.toContain('SERVICE_TOKEN');
    const json = JSON.parse(text) as { status: string; budget: { cap_usd: number } };
    expect(json.status).toBe('ok');
    expect(json.budget.cap_usd).toBe(20);
  });

  it('/health does NOT tie dataforseo availability to SERVICE_TOKEN', async () => {
    // Harness sets SERVICE_TOKEN but NO DataForSEO creds → the flag must NOT be
    // true (it would be misleading to report dataforseo up on an unrelated token).
    const h = makeHarness(); // env has SERVICE_TOKEN='SVC-SECRET', no DFS creds
    const res = await h.request('/health');
    const json = (await res.json()) as { providers: { dataforseo?: boolean } };
    expect(json.providers.dataforseo).not.toBe(true);
  });

  it('/health reports dataforseo=true ONLY when real DataForSEO creds are present', async () => {
    const h = makeHarness({
      env: { DATAFORSEO_LOGIN: 'login@example.com', DATAFORSEO_PASSWORD: 'pw' },
    });
    const res = await h.request('/health');
    const text = await res.text();
    // Truthful signal, but the secret values themselves never appear.
    expect(text).not.toContain('login@example.com');
    expect(text).not.toContain('pw');
    const json = JSON.parse(text) as { providers: { dataforseo?: boolean } };
    expect(json.providers.dataforseo).toBe(true);
  });

  it('401 on a protected route with NO credentials', async () => {
    const h = makeHarness();
    const res = await h.request('/opportunities?projectId=p1');
    expect(res.status).toBe(401);
  });

  it('200 with a valid Access JWT', async () => {
    const h = makeHarness();
    await seedProject(h, defaultTenant());
    const res = await h.request('/opportunities?projectId=proj-example.com', { headers: jwtHeaders() });
    expect(res.status).toBe(200);
  });

  it('200 with a valid service token (bearer)', async () => {
    const h = makeHarness();
    // Bearer maps to tenant "tenant:service-token"; register a project there.
    await seedProject(h, 'tenant:service-token');
    const res = await h.request('/opportunities?projectId=proj-example.com', { headers: bearerHeaders() });
    expect(res.status).toBe(200);
  });

  it('401 with a BAD Access JWT', async () => {
    const h = makeHarness();
    const res = await h.request('/opportunities?projectId=p1', { headers: jwtHeaders('WRONGTOKEN') });
    expect(res.status).toBe(401);
  });

  it('401 with a wrong bearer token', async () => {
    const h = makeHarness();
    const res = await h.request('/opportunities?projectId=p1', { headers: bearerHeaders('nope') });
    expect(res.status).toBe(401);
  });
});

/* =================================================================== */
/* Case 6 — tenant isolation.                                          */
/* =================================================================== */
describe('§17.6 tenant isolation (project A cannot read project B)', () => {
  it('tenant B cannot read tenant A opportunities (empty, not leaked)', async () => {
    const h = makeHarness();

    // Tenant A registers + populates a project.
    const aProjectId = await seedProject(h, 'alpha', 'alpha.com');
    const pipeline = mockPipeline();
    const result = await pipeline({
      providers: {},
      project: { domain: 'alpha.com', locale: 'en-US', geography: 'US', language: 'en' },
      pageInventory: [],
      pageMap: { version: 1, entries: {} },
      budget: { maxSpendUsd: 20 },
      now: NOW,
    });
    const { upsertOpportunities } = await import('../../src/db');
    await upsertOpportunities(h.db.asD1(), { projectId: aProjectId, tenantId: 'alpha' }, result.opportunities, opportunityIdFor);

    // Tenant B (via TENANT:beta token) asks for tenant A's project id → scoped
    // out: 0 rows, never A's data.
    const res = await h.request(`/opportunities?projectId=${aProjectId}`, { headers: jwtHeaders('TENANT:beta') });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { count: number; opportunities: unknown[] };
    expect(json.count).toBe(0);
    expect(json.opportunities).toEqual([]);
  });

  it('tenant B cannot read tenant A job state', async () => {
    const h = makeHarness();
    const aProjectId = await seedProject(h, 'alpha', 'alpha.com');
    const enq = await h.request('/research', {
      method: 'POST',
      headers: jwtHeaders('TENANT:alpha'),
      body: JSON.stringify({ projectId: aProjectId }),
    });
    const { job } = (await enq.json()) as { job: { id: string } };

    // Tenant B tries to read A's job → 404 (not found FOR B).
    const res = await h.request(`/research/${job.id}`, { headers: jwtHeaders('TENANT:beta') });
    expect(res.status).toBe(404);

    // Tenant A can read it.
    const ok = await h.request(`/research/${job.id}`, { headers: jwtHeaders('TENANT:alpha') });
    expect(ok.status).toBe(200);
  });

  it('tenant B cannot enqueue research for tenant A project (404)', async () => {
    const h = makeHarness();
    const aProjectId = await seedProject(h, 'alpha', 'alpha.com');
    const res = await h.request('/research', {
      method: 'POST',
      headers: jwtHeaders('TENANT:beta'),
      body: JSON.stringify({ projectId: aProjectId }),
    });
    expect(res.status).toBe(404);
    // No job was enqueued for B.
    expect(h.queue.sent.length).toBe(0);
  });

  it('db.getProject enforces tenant scoping directly', async () => {
    const h = makeHarness();
    const aProjectId = await seedProject(h, 'alpha', 'alpha.com');
    expect(await getProject(h.db.asD1(), 'alpha', aProjectId)).not.toBeNull();
    expect(await getProject(h.db.asD1(), 'beta', aProjectId)).toBeNull();
  });
});

/* =================================================================== */
/* Case 7 — retry handling.                                            */
/* =================================================================== */
describe('§17.7 retry handling (failing job retries then dead-letters)', () => {
  it('a failing pipeline retries below the cap, then dead-letters at the cap', async () => {
    const failing = async () => {
      throw new Error('provider exploded');
    };
    const h = makeHarness({ pipeline: failing, queueDepsOverrides: { maxAttempts: 2 } });
    const projectId = await seedProject(h, defaultTenant());
    await insertJob(h.db.asD1(), { id: 'job-f', projectId, tenantId: defaultTenant(), enqueuedAt: NOW().toISOString() });
    const msg: ResearchJobMessage = { jobId: 'job-f', projectId, tenantId: defaultTenant(), domain: 'example.com', locale: 'en-US' };

    // Attempt 1 → error (retryable).
    const a1 = await processJob(h.db.asD1(), h.reports.asR2(), msg, h.deps.queueDeps);
    expect(a1).toBe('retry');
    let job = await getJob(h.db.asD1(), defaultTenant(), 'job-f');
    expect(job?.state).toBe('error');
    expect(job?.attempts).toBe(1);
    expect(job?.error).toContain('provider exploded');

    // Attempt 2 → attempts hits maxAttempts(2) → dead_letter.
    const a2 = await processJob(h.db.asD1(), h.reports.asR2(), msg, h.deps.queueDeps);
    expect(a2).toBe('dead_letter');
    job = await getJob(h.db.asD1(), defaultTenant(), 'job-f');
    expect(job?.state).toBe('dead_letter');
    expect(job?.attempts).toBe(2);
  });

  it('handleQueue calls retry() on the message for a retryable failure', async () => {
    const failing = async () => {
      throw new Error('boom');
    };
    const h = makeHarness({ pipeline: failing, queueDepsOverrides: { maxAttempts: DEFAULT_MAX_ATTEMPTS } });
    const projectId = await seedProject(h, defaultTenant());
    await insertJob(h.db.asD1(), { id: 'job-r', projectId, tenantId: defaultTenant(), enqueuedAt: NOW().toISOString() });
    const { batch, messages } = makeBatch<ResearchJobMessage>([
      { jobId: 'job-r', projectId, tenantId: defaultTenant(), domain: 'example.com', locale: 'en-US' },
    ]);
    await handleQueue(batch, h.db.asD1(), h.reports.asR2(), h.deps.queueDeps);
    expect(messages[0]!.retried).toBe(true);
    expect(messages[0]!.acked).toBe(false);
  });

  it('handleQueue acks a successful job', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    await insertJob(h.db.asD1(), { id: 'job-ok', projectId, tenantId: defaultTenant(), enqueuedAt: NOW().toISOString() });
    const { batch, messages } = makeBatch<ResearchJobMessage>([
      { jobId: 'job-ok', projectId, tenantId: defaultTenant(), domain: 'example.com', locale: 'en-US' },
    ]);
    await handleQueue(batch, h.db.asD1(), h.reports.asR2(), h.deps.queueDeps);
    expect(messages[0]!.acked).toBe(true);
    expect(messages[0]!.retried).toBe(false);
  });
});

/* =================================================================== */
/* Case 8 — cost limit (ledger breaker).                               */
/* =================================================================== */
describe('§17.8 cost limit (job over remaining budget rejected by breaker)', () => {
  it('rejects a job that would exceed the remaining monthly budget', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());

    // Pre-spend the window to $19.50 so only $0.50 remains — under the job's
    // $1.00 estimate ⇒ the breaker must trip.
    await recordLedgerEntry(h.db.asD1(), {
      id: 'pre',
      projectId,
      tenantId: defaultTenant(),
      provider: 'dataforseo',
      endpoint: 'seed',
      estimatedUsd: 19.5,
      actualUsd: 19.5,
      createdAt: NOW().toISOString(),
    });

    await insertJob(h.db.asD1(), { id: 'job-b', projectId, tenantId: defaultTenant(), enqueuedAt: NOW().toISOString() });
    const msg: ResearchJobMessage = { jobId: 'job-b', projectId, tenantId: defaultTenant(), domain: 'example.com', locale: 'en-US' };
    const outcome = await processJob(h.db.asD1(), h.reports.asR2(), msg, h.deps.queueDeps);
    expect(outcome).toBe('rejected');

    // Job marked error with a budget reason; pipeline NEVER ran (no opps, no report).
    const job = await getJob(h.db.asD1(), defaultTenant(), 'job-b');
    expect(job?.error).toMatch(/budget/i);
    const rows = await queryOpportunities(h.db.asD1(), { tenantId: defaultTenant(), projectId }, {});
    expect(rows.length).toBe(0);
    expect(h.reports.store.size).toBe(0);
  });

  it('assertWithinBudget throws BudgetExceededError past the cap', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    await recordLedgerEntry(h.db.asD1(), {
      id: 'x', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 20, actualUsd: 20, createdAt: NOW().toISOString(),
    });
    await expect(
      assertWithinBudget(h.db.asD1(), defaultTenant(), 1, NOW()),
    ).rejects.toBeInstanceOf(BudgetExceededError);
  });

  it('a zero-cost job always passes the breaker even at the cap', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    await recordLedgerEntry(h.db.asD1(), {
      id: 'x', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 20, actualUsd: 20, createdAt: NOW().toISOString(),
    });
    const status = await assertWithinBudget(h.db.asD1(), defaultTenant(), 0, NOW());
    expect(status.remainingUsd).toBe(0);
  });

  it('spend AGES OUT of the rolling 30-day window', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    // A $20 charge 40 days ago is outside the window → full budget available now.
    const old = new Date(NOW().getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();
    await recordLedgerEntry(h.db.asD1(), {
      id: 'old', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 20, actualUsd: 20, createdAt: old,
    });
    const status = await budgetStatus(h.db.asD1(), defaultTenant(), NOW());
    expect(status.spentUsd).toBe(0);
    expect(status.remainingUsd).toBe(20);
  });

  it('in-flight (unsettled) spend still counts against headroom', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    // Reserve $19.60 with NO actual_cost yet → remaining is $0.40.
    await recordLedgerEntry(h.db.asD1(), {
      id: 'inflight', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 19.6, actualUsd: null, createdAt: NOW().toISOString(),
    });
    const status = await budgetStatus(h.db.asD1(), defaultTenant(), NOW());
    expect(status.remainingUsd).toBeCloseTo(0.4, 4);
  });
});

/* =================================================================== */
/* Case 9 — atomic budget reserve (check+reserve is ONE statement).    */
/* =================================================================== */
describe('§17.9 atomic reserveBudget (TOCTOU-safe check-and-reserve)', () => {
  /** Count ledger rows + sum spend (settled-or-estimated) for the tenant. */
  function ledgerState(h: Harness, tenantId: string): { count: number; sum: number } {
    const count = (
      h.db.sqlite
        .prepare(`SELECT COUNT(*) c FROM cost_ledger WHERE tenant_id = ?`)
        .get(tenantId) as { c: number }
    ).c;
    const sum = Number(
      (
        h.db.sqlite
          .prepare(
            `SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0) s
               FROM cost_ledger WHERE tenant_id = ?`,
          )
          .get(tenantId) as { s: number }
      ).s,
    );
    return { count, sum };
  }

  it('writes a reservation row when the estimate FITS under the cap', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    // Pre-spend to $19.50 → $0.50 remains.
    await recordLedgerEntry(h.db.asD1(), {
      id: 'pre', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 19.5, actualUsd: 19.5, createdAt: NOW().toISOString(),
    });
    const before = ledgerState(h, defaultTenant());

    // A $0.40 reserve fits in the $0.50 headroom → succeeds + writes a row.
    await reserveBudget(h.db.asD1(), {
      id: 'r1',
      projectId,
      tenantId: defaultTenant(),
      provider: 'pipeline',
      endpoint: 'research',
      estimatedUsd: 0.4,
      now: NOW(),
    });

    const after = ledgerState(h, defaultTenant());
    expect(after.count).toBe(before.count + 1);
    expect(after.sum).toBeCloseTo(19.9, 4);
  });

  it('REFUSES the reservation (throws, NO row written, SUM unchanged) when it would exceed the cap', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    // Pre-spend to $19.50 → only $0.50 remains.
    await recordLedgerEntry(h.db.asD1(), {
      id: 'pre', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 19.5, actualUsd: 19.5, createdAt: NOW().toISOString(),
    });
    const before = ledgerState(h, defaultTenant());

    // A $1.00 reserve would push to $20.50 > $20 cap → refused.
    await expect(
      reserveBudget(h.db.asD1(), {
        id: 'r2',
        projectId,
        tenantId: defaultTenant(),
        provider: 'pipeline',
        endpoint: 'research',
        estimatedUsd: 1.0,
        now: NOW(),
      }),
    ).rejects.toBeInstanceOf(BudgetExceededError);

    // The reservation row was NOT written and the window SUM is unchanged.
    const after = ledgerState(h, defaultTenant());
    expect(after.count).toBe(before.count);
    expect(after.sum).toBeCloseTo(before.sum, 4);
  });

  it('holds the cap under CONCURRENT same-tenant reserves (only the ones that fit are written)', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    // Pre-spend to $19.00 → exactly $1.00 remains; each reserve is $0.60, so at
    // MOST one of two concurrent reserves can be admitted (0.60+0.60 = 1.20 > 1).
    await recordLedgerEntry(h.db.asD1(), {
      id: 'pre', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 19.0, actualUsd: 19.0, createdAt: NOW().toISOString(),
    });

    const attempt = (id: string) =>
      reserveBudget(h.db.asD1(), {
        id,
        projectId,
        tenantId: defaultTenant(),
        provider: 'pipeline',
        endpoint: 'research',
        estimatedUsd: 0.6,
        now: NOW(),
      }).then(
        () => 'ok' as const,
        (e) => (e instanceof BudgetExceededError ? ('refused' as const) : Promise.reject(e)),
      );

    const results = await Promise.all([attempt('c1'), attempt('c2')]);
    const admitted = results.filter((r) => r === 'ok').length;
    // Exactly one admitted; the cap is never silently exceeded.
    expect(admitted).toBe(1);
    const after = ledgerState(h, defaultTenant());
    expect(after.count).toBe(2); // the $19 seed + the single admitted reserve
    expect(after.sum).toBeLessThanOrEqual(20);
    expect(after.sum).toBeCloseTo(19.6, 4);
  });

  it('a zero-cost reserve always writes a row (a free unit can never exceed any cap)', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    await recordLedgerEntry(h.db.asD1(), {
      id: 'pre', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 20, actualUsd: 20, createdAt: NOW().toISOString(),
    });
    await reserveBudget(h.db.asD1(), {
      id: 'free', projectId, tenantId: defaultTenant(), provider: 'pipeline',
      endpoint: 'research', estimatedUsd: 0, now: NOW(),
    });
    const after = ledgerState(h, defaultTenant());
    expect(after.count).toBe(2);
  });

  it('processJob writes exactly ONE reservation row and settles it to actual (no double-count)', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    await insertJob(h.db.asD1(), { id: 'job-res', projectId, tenantId: defaultTenant(), enqueuedAt: NOW().toISOString() });
    const msg: ResearchJobMessage = { jobId: 'job-res', projectId, tenantId: defaultTenant(), domain: 'example.com', locale: 'en-US' };
    const outcome = await processJob(h.db.asD1(), h.reports.asR2(), msg, h.deps.queueDeps);
    expect(outcome).toBe('done');
    // Exactly one ledger row for the job, settled to the mock's $0.50 actual.
    const rows = h.db.sqlite
      .prepare(`SELECT estimated_cost, actual_cost FROM cost_ledger WHERE tenant_id = ?`)
      .all(defaultTenant()) as { estimated_cost: number; actual_cost: number | null }[];
    expect(rows.length).toBe(1);
    expect(rows[0]!.actual_cost).toBeCloseTo(0.5, 4);
  });

  it('rejects via the atomic reserve when the window is already at the cap (job never runs)', async () => {
    const h = makeHarness();
    const projectId = await seedProject(h, defaultTenant());
    // Pre-spend to $19.50 so the $1.00 job estimate cannot be reserved.
    await recordLedgerEntry(h.db.asD1(), {
      id: 'pre', projectId, tenantId: defaultTenant(), provider: 'p', endpoint: 'e',
      estimatedUsd: 19.5, actualUsd: 19.5, createdAt: NOW().toISOString(),
    });
    await insertJob(h.db.asD1(), { id: 'job-cap', projectId, tenantId: defaultTenant(), enqueuedAt: NOW().toISOString() });
    const msg: ResearchJobMessage = { jobId: 'job-cap', projectId, tenantId: defaultTenant(), domain: 'example.com', locale: 'en-US' };
    const outcome = await processJob(h.db.asD1(), h.reports.asR2(), msg, h.deps.queueDeps);
    expect(outcome).toBe('rejected');
    // No reservation row was written for the rejected job (only the $19.50 seed).
    const count = (
      h.db.sqlite.prepare(`SELECT COUNT(*) c FROM cost_ledger WHERE tenant_id = ?`).get(defaultTenant()) as { c: number }
    ).c;
    expect(count).toBe(1);
    const job = await getJob(h.db.asD1(), defaultTenant(), 'job-cap');
    expect(job?.error).toMatch(/budget/i);
    expect(h.reports.store.size).toBe(0);
  });
});

/* =================================================================== */
/* Case 10 — GLOBAL paid-research cap (§11): a ceiling across ALL       */
/* tenants, enforced in the SAME atomic reserve as the per-tenant cap.  */
/* =================================================================== */
describe('§17.10 global paid-research cap (§11 — cross-tenant $20 ceiling)', () => {
  /** Sum spend (settled-or-estimated) across ALL tenants + count rows. */
  function globalLedgerState(h: Harness): { count: number; sum: number } {
    const count = (h.db.sqlite.prepare(`SELECT COUNT(*) c FROM cost_ledger`).get() as { c: number }).c;
    const sum = Number(
      (
        h.db.sqlite
          .prepare(`SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0) s FROM cost_ledger`)
          .get() as { s: number }
      ).s,
    );
    return { count, sum };
  }

  /** Seed a settled charge for an ARBITRARY tenant (no project FK dependency). */
  async function seedSpend(h: Harness, tenantId: string, id: string, usd: number): Promise<void> {
    await recordLedgerEntry(h.db.asD1(), {
      id,
      projectId: `proj:${tenantId}`,
      tenantId,
      provider: 'dataforseo',
      endpoint: 'seed',
      estimatedUsd: usd,
      actualUsd: usd,
      createdAt: NOW().toISOString(),
    });
  }

  it('globalBudgetStatus sums spend across ALL tenants in the window', async () => {
    const h = makeHarness();
    await seedSpend(h, 'tenant:a', 'a1', 12);
    await seedSpend(h, 'tenant:b', 'b1', 7);
    const status = await globalBudgetStatus(h.db.asD1(), NOW());
    expect(status.capUsd).toBe(20);
    expect(status.spentUsd).toBeCloseTo(19, 4);
    expect(status.remainingUsd).toBeCloseTo(1, 4);
  });

  it('GLOBAL trip: tenant A at $12 + tenant B reserves $9 → global $21 > $20 → REJECTED (scope=global), no row', async () => {
    const h = makeHarness();
    await seedSpend(h, 'tenant:a', 'a1', 12); // global now $12
    const before = globalLedgerState(h);

    // Tenant B is individually WAY under its own $20 cap ($0 spent), but the
    // $9 reserve pushes the GLOBAL window to $21 > $20 → refused on the global.
    let caught: BudgetExceededError | null = null;
    await reserveBudget(h.db.asD1(), {
      id: 'b-res',
      projectId: 'proj:tenant:b',
      tenantId: 'tenant:b',
      provider: 'dataforseo',
      endpoint: 'serp',
      estimatedUsd: 9,
      now: NOW(),
    }).catch((e) => {
      if (e instanceof BudgetExceededError) caught = e;
      else throw e;
    });

    expect(caught).toBeInstanceOf(BudgetExceededError);
    expect(caught!.scope).toBe('global');
    const after = globalLedgerState(h);
    expect(after.count).toBe(before.count); // NO row written
    expect(after.sum).toBeCloseTo(before.sum, 4);
  });

  it('PER-TENANT trip: tenantCap=$5, tenant at $4, reserve $2 → rejected (scope=tenant) though global has room', async () => {
    const h = makeHarness();
    await seedSpend(h, 'tenant:a', 'a1', 4); // tenant A $4, global only $4 (plenty of global room)
    const before = globalLedgerState(h);

    let caught: BudgetExceededError | null = null;
    await reserveBudget(
      h.db.asD1(),
      {
        id: 'a-res',
        projectId: 'proj:tenant:a',
        tenantId: 'tenant:a',
        provider: 'dataforseo',
        endpoint: 'serp',
        estimatedUsd: 2, // 4 + 2 = 6 > tenantCap 5 → tenant trips
        now: NOW(),
      },
      20, // global cap (lots of room)
      5, // tenant cap (tighter per-project budget)
    ).catch((e) => {
      if (e instanceof BudgetExceededError) caught = e;
      else throw e;
    });

    expect(caught).toBeInstanceOf(BudgetExceededError);
    expect(caught!.scope).toBe('tenant');
    const after = globalLedgerState(h);
    expect(after.count).toBe(before.count); // NO row written
    expect(after.sum).toBeCloseTo(before.sum, 4);
  });

  it('BOTH fit: global $10 + tenant $3, reserve $2 → succeeds, row written', async () => {
    const h = makeHarness();
    await seedSpend(h, 'tenant:a', 'a1', 7); // global $7 so far, tenant B separate
    await seedSpend(h, 'tenant:b', 'b1', 3); // global now $10; tenant B at $3
    const before = globalLedgerState(h);

    // Global 10 + 2 = 12 ≤ 20 AND tenant 3 + 2 = 5 ≤ tenantCap(20 default) → fits.
    const status = await reserveBudget(h.db.asD1(), {
      id: 'b-res',
      projectId: 'proj:tenant:b',
      tenantId: 'tenant:b',
      provider: 'dataforseo',
      endpoint: 'serp',
      estimatedUsd: 2,
      now: NOW(),
    });

    const after = globalLedgerState(h);
    expect(after.count).toBe(before.count + 1); // row WRITTEN
    expect(after.sum).toBeCloseTo(12, 4); // global window now $12
    expect(status.spentUsd).toBeCloseTo(5, 4); // returned per-tenant status for B
  });

  it('CONCURRENCY: two reserves against $1 of GLOBAL headroom → exactly one admitted', async () => {
    const h = makeHarness();
    // Global pre-spent to $19 across DIFFERENT tenants → exactly $1 of GLOBAL
    // headroom. Each reserve is $0.60 for a DISTINCT tenant (each trivially
    // under its own $20), so only the GLOBAL ceiling can gate them.
    await seedSpend(h, 'tenant:a', 'a1', 19);
    const before = globalLedgerState(h);

    const attempt = (tenantId: string, id: string) =>
      reserveBudget(h.db.asD1(), {
        id,
        projectId: `proj:${tenantId}`,
        tenantId,
        provider: 'dataforseo',
        endpoint: 'serp',
        estimatedUsd: 0.6,
        now: NOW(),
      }).then(
        () => 'ok' as const,
        (e) => (e instanceof BudgetExceededError ? ('refused' as const) : Promise.reject(e)),
      );

    const results = await Promise.all([attempt('tenant:b', 'b-res'), attempt('tenant:c', 'c-res')]);
    const admitted = results.filter((r) => r === 'ok').length;
    expect(admitted).toBe(1); // 0.60 + 0.60 = 1.20 > 1 global headroom
    const after = globalLedgerState(h);
    expect(after.count).toBe(before.count + 1); // exactly one new row
    expect(after.sum).toBeLessThanOrEqual(20);
    expect(after.sum).toBeCloseTo(19.6, 4);
  });

  it('/health reports the GLOBAL $20 spent/remaining (secret-free)', async () => {
    const h = makeHarness();
    await seedSpend(h, 'tenant:a', 'a1', 12);
    await seedSpend(h, 'tenant:b', 'b1', 3); // global $15 spent
    const res = await h.request('/health');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain('SVC-SECRET');
    const json = JSON.parse(text) as {
      budget: { cap_usd: number; window_days: number; global: { spent_usd: number; remaining_usd: number } };
    };
    expect(json.budget.cap_usd).toBe(20);
    expect(json.budget.window_days).toBe(30);
    expect(json.budget.global.spent_usd).toBeCloseTo(15, 4);
    expect(json.budget.global.remaining_usd).toBeCloseTo(5, 4);
  });
});

/* =================================================================== */
/* Shared helpers.                                                     */
/* =================================================================== */

/** The default tenant the fake JWT (GOODTOKEN) resolves to. */
function defaultTenant(): string {
  return 'tenant:dev@example.com';
}

/** The first job id recorded in D1 (for report-key assembly). */
function firstJobId(h: Harness): string {
  return (h.db.sqlite.prepare(`SELECT id FROM research_jobs LIMIT 1`).get() as { id: string }).id;
}

/** Drain whatever the producer queued through the consumer once. */
async function drainQueue(h: Harness): Promise<void> {
  const bodies = h.queue.sent.map((s) => s.body);
  const { batch } = makeBatch<ResearchJobMessage>(bodies);
  await handleQueue(batch, h.db.asD1(), h.reports.asR2(), h.deps.queueDeps);
}

// Keep imports referenced in all paths.
void markJobDone;
void mockRender;
void counterIds;
void beforeEach;
