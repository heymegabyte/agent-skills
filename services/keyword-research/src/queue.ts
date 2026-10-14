/**
 * Queue consumer — the async worker that turns an enqueued research job into
 * persisted opportunities (D1) + a persisted report (R2).
 *
 * Contract honored here:
 *  - PIPELINE IS INJECTED. This module never imports a provider adapter or
 *    touches `fetch`. The caller hands it a `runPipeline` (the real one in
 *    `worker.ts`, a mock in tests), so the consumer is testable with zero
 *    network + zero credentials.
 *  - IDEMPOTENT. A job already in a terminal state (`done`/`dead_letter`) is a
 *    no-op — redelivery or a double cron can't double-spend or double-write.
 *  - BUDGET-GUARDED. Before running, the ledger breaker must clear the job's
 *    estimated spend; a job over the remaining monthly cap is rejected and
 *    marked `error` WITHOUT running the pipeline (never overspends).
 *  - RETRY WITH A BOUND. A failed attempt increments `attempts`; below the cap
 *    the message is `retry()`-ed, at the cap the job is dead-lettered.
 *  - BOUNDED CONCURRENCY. A batch is processed with a small concurrency limit so
 *    a big batch can't fan out unboundedly inside one invocation.
 */
import type { D1Database, MessageBatch, Message, R2Bucket } from '@cloudflare/workers-types';
import type { ResearchJobMessage } from './env';
import type { ResearchResult, RunResearchInput } from './pipeline';
import type { ReportContext } from './report';
import {
  getJobInternal,
  getProject,
  insertHistory,
  markJobDone,
  markJobFailed,
  markJobRunning,
  upsertOpportunities,
} from './db';
import {
  BudgetExceededError,
  reserveBudget,
  settleLedgerEntry,
} from './ledger';

/** Default attempt cap before a job is dead-lettered. */
export const DEFAULT_MAX_ATTEMPTS = 3;
/** Default in-invocation concurrency for a batch. */
export const DEFAULT_CONCURRENCY = 3;
/** Rough pre-flight estimate for a research run (USD) — gates the breaker. */
export const DEFAULT_JOB_ESTIMATE_USD = 1.0;

/**
 * Everything the consumer needs that isn't a binding. All injected so the
 * consumer is hermetic.
 */
export interface JobRunnerDeps {
  /** The research pipeline (mocked in tests). */
  runPipeline: (input: RunResearchInput) => Promise<ResearchResult>;
  /** Render the persisted report body from a result + context. */
  renderReport: (result: ResearchResult, ctx: ReportContext) => string;
  /** Injected clock. */
  now: () => Date;
  /** Injected id generator (uuid in prod; deterministic in tests). */
  newId: () => string;
  /** Deterministic opportunity row id from its natural key. */
  opportunityId: (projectId: string, keyword: string, locale: string) => string;
  /** Max attempts before dead-letter. */
  maxAttempts?: number;
  /** Per-batch concurrency. */
  concurrency?: number;
  /** Monthly budget cap (USD). */
  capUsd?: number;
  /** Where persisted reports live. */
  reportKeyPrefix?: string;
}

/** Build the R2 object key for a job's report. */
export function reportKey(prefix: string, projectId: string, jobId: string): string {
  return `${prefix}/${projectId}/${jobId}.md`;
}

/**
 * Process a single job message. Returns `'done' | 'skipped' | 'retry' |
 * 'dead_letter' | 'rejected'` so the batch loop (and tests) can assert the
 * outcome. Only `'retry'` asks the platform to redeliver.
 */
export async function processJob(
  db: D1Database,
  reports: R2Bucket,
  msg: ResearchJobMessage,
  deps: JobRunnerDeps,
): Promise<'done' | 'skipped' | 'retry' | 'dead_letter' | 'rejected'> {
  const maxAttempts = deps.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const prefix = deps.reportKeyPrefix ?? 'reports';
  const nowDate = deps.now();
  const nowIso = nowDate.toISOString();

  // --- Idempotency: terminal jobs are a no-op. ---
  const existing = await getJobInternal(db, msg.jobId);
  if (!existing) {
    // No job row (race / bad message) → ack it; nothing to do, nothing to spend.
    return 'skipped';
  }
  if (existing.state === 'done' || existing.state === 'dead_letter') {
    return 'skipped';
  }

  // --- ATOMIC budget check-and-reserve BEFORE any work. ---
  // One conditional INSERT reserves the estimate IFF it fits under the cap, so
  // the reservation row is written iff within budget — no TOCTOU gap between a
  // separate check and a later insert. D1 serializes the INSERT…SELECT, so two
  // concurrent same-tenant jobs can NOT both pass (the loser sees the winner's
  // reservation in its SUM). On refusal, no row is written and the pipeline
  // never runs — the cap is never silently exceeded.
  const ledgerId = deps.newId();
  try {
    await reserveBudget(
      db,
      {
        id: ledgerId,
        projectId: msg.projectId,
        tenantId: msg.tenantId,
        provider: 'pipeline',
        endpoint: 'research',
        estimatedUsd: DEFAULT_JOB_ESTIMATE_USD,
        now: nowDate,
      },
      deps.capUsd,
    );
  } catch (e) {
    if (e instanceof BudgetExceededError) {
      // Reservation refused (would exceed the cap). Mark error WITHOUT running
      // the pipeline and WITHOUT leaving a reservation row behind; we do NOT ask
      // for immediate redelivery (retryable only if the window later frees up).
      await markJobFailed(db, msg.jobId, `budget: ${e.message}`, maxAttempts, nowIso);
      return 'rejected';
    }
    throw e;
  }

  await markJobRunning(db, msg.jobId, nowIso);

  try {
    // Resolve the project (scoped by tenant — never cross-tenant).
    const project = await getProject(db, msg.tenantId, msg.projectId);
    if (!project) {
      await markJobFailed(db, msg.jobId, 'project not found for tenant', maxAttempts, nowIso);
      await settleLedgerEntry(db, msg.tenantId, ledgerId, 0);
      return 'rejected';
    }

    // Run the INJECTED pipeline (mock in tests; real providers in prod).
    const result = await deps.runPipeline({
      // Providers are supplied by the caller's closure in prod; the injected
      // runPipeline owns them, so we pass an empty set here — the mock ignores
      // it, and the prod runner closes over its own providers.
      providers: {},
      project: {
        domain: project.domain,
        locale: project.locale,
        geography: project.locale.split('-')[1] ?? 'US',
        language: project.locale.split('-')[0] ?? 'en',
      },
      pageInventory: [],
      pageMap: { version: 1, entries: {} },
      budget: { maxSpendUsd: deps.capUsd ?? 20 },
      now: deps.now,
    });

    // Persist opportunities to D1 (scoped).
    await upsertOpportunities(
      db,
      { projectId: msg.projectId, tenantId: msg.tenantId },
      result.opportunities,
      deps.opportunityId,
    );

    // Persist the report body to R2, then record history + settle the ledger.
    const key = reportKey(prefix, msg.projectId, msg.jobId);
    const ctx: ReportContext = {
      domain: project.domain,
      locale: project.locale,
      geography: project.locale.split('-')[1] ?? 'US',
      language: project.locale.split('-')[0] ?? 'en',
      budgetUsd: deps.capUsd ?? 20,
      generatedAt: nowIso,
    };
    const body = deps.renderReport(result, ctx);
    await reports.put(key, body, { httpMetadata: { contentType: 'text/markdown; charset=utf-8' } });

    await insertHistory(db, {
      id: deps.newId(),
      projectId: msg.projectId,
      tenantId: msg.tenantId,
      reportR2Key: key,
      createdAt: nowIso,
    });

    // Settle the reservation to the pipeline's ACTUAL cost.
    await settleLedgerEntry(db, msg.tenantId, ledgerId, result.costActual);

    await markJobDone(db, msg.jobId, nowIso);
    return 'done';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // The failed attempt spent nothing we can attribute → settle reservation to 0.
    await settleLedgerEntry(db, msg.tenantId, ledgerId, 0);
    const state = await markJobFailed(db, msg.jobId, message, maxAttempts, nowIso);
    return state === 'dead_letter' ? 'dead_letter' : 'retry';
  }
}

/**
 * The exported queue handler. Processes a batch with bounded concurrency,
 * ack-ing terminal outcomes and `retry()`-ing only the retryable failures.
 */
export async function handleQueue(
  batch: MessageBatch<ResearchJobMessage>,
  db: D1Database,
  reports: R2Bucket,
  deps: JobRunnerDeps,
): Promise<void> {
  const concurrency = Math.max(1, deps.concurrency ?? DEFAULT_CONCURRENCY);
  const messages = batch.messages;

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < messages.length) {
      const index = cursor++;
      const m = messages[index] as Message<ResearchJobMessage>;
      const outcome = await processJob(db, reports, m.body, deps);
      if (outcome === 'retry') {
        m.retry();
      } else {
        m.ack();
      }
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, messages.length || 1) }, () => worker());
  await Promise.all(pool);
}
