/**
 * Cost ledger + circuit breaker.
 *
 * Every costed provider call appends a row to `cost_ledger`. Before a job runs
 * we ask the breaker whether the job's estimated spend fits inside what's LEFT
 * of the monthly cap; if not, the job is rejected BEFORE any money is spent.
 *
 * The window is ROLLING: "this month" = the trailing 30 days ending at the
 * injected `now`, so spend ages out continuously rather than resetting on a
 * calendar boundary. The cap is enforced per TENANT (the billing boundary),
 * summing actual spend where settled and estimated spend where still in-flight
 * (so two concurrent jobs can't both "fit" against the same headroom).
 *
 * PURE w.r.t. injected `now`: identical ledger state + clock ⇒ identical
 * decision. No wall-clock reads here.
 */
import type { D1Database } from '@cloudflare/workers-types';

/** The rolling window length, in milliseconds (30 days). */
export const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** The default hard monthly cap, in USD. */
export const DEFAULT_CAP_USD = 20;

/** Thrown when a job is rejected because it would exceed the remaining budget. */
export class BudgetExceededError extends Error {
  constructor(
    public readonly remainingUsd: number,
    public readonly estimatedUsd: number,
    public readonly capUsd: number,
  ) {
    super(
      `Budget breaker tripped: estimated $${estimatedUsd.toFixed(2)} exceeds remaining ` +
        `$${remainingUsd.toFixed(2)} of the $${capUsd.toFixed(2)} monthly cap.`,
    );
    this.name = 'BudgetExceededError';
  }
}

/** The breaker's view of the current rolling window. */
export interface BudgetStatus {
  capUsd: number;
  /** Settled + in-flight spend inside the window. */
  spentUsd: number;
  /** capUsd − spentUsd, floored at 0. */
  remainingUsd: number;
  /** The ISO lower bound of the rolling window (inclusive). */
  windowStart: string;
}

/**
 * Sum spend for a tenant inside the rolling window. Uses `actual_cost` when the
 * call has settled, else falls back to `estimated_cost` so in-flight spend
 * still counts against headroom (fail-safe: we never under-count).
 */
export async function budgetStatus(
  db: D1Database,
  tenantId: string,
  now: Date,
  capUsd = DEFAULT_CAP_USD,
): Promise<BudgetStatus> {
  const windowStart = new Date(now.getTime() - WINDOW_MS).toISOString();
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0) AS spent
         FROM cost_ledger
        WHERE tenant_id = ?1 AND created_at >= ?2`,
    )
    .bind(tenantId, windowStart)
    .first<{ spent: number }>();
  const spentUsd = Number(row?.spent ?? 0);
  const remainingUsd = Math.max(0, capUsd - spentUsd);
  return {
    capUsd,
    spentUsd: Number(spentUsd.toFixed(4)),
    remainingUsd: Number(remainingUsd.toFixed(4)),
    windowStart,
  };
}

/**
 * The circuit breaker. Throws {@link BudgetExceededError} if `estimatedUsd`
 * would push the tenant's rolling spend past the cap. Returns the pre-flight
 * {@link BudgetStatus} when the job is cleared to run.
 *
 * `estimatedUsd === 0` always passes (a free run can't exceed any budget).
 */
export async function assertWithinBudget(
  db: D1Database,
  tenantId: string,
  estimatedUsd: number,
  now: Date,
  capUsd = DEFAULT_CAP_USD,
): Promise<BudgetStatus> {
  const status = await budgetStatus(db, tenantId, now, capUsd);
  if (estimatedUsd > 0 && estimatedUsd > status.remainingUsd) {
    throw new BudgetExceededError(status.remainingUsd, estimatedUsd, capUsd);
  }
  return status;
}

/**
 * ATOMIC check-and-reserve. Writes ONE in-flight reservation row (actual_cost =
 * NULL) IFF, counting that row's `estimatedCost`, the tenant's rolling-window
 * spend stays within the cap — all in a SINGLE `INSERT … SELECT … WHERE`
 * statement. This closes the TOCTOU race that a separate SELECT-SUM-then-INSERT
 * leaves open: two concurrent same-tenant jobs could each pass an independent
 * check before either wrote its reservation, both slipping under the cap.
 *
 * The window + scope are IDENTICAL to {@link budgetStatus}/
 * {@link assertWithinBudget} (same tenant, same trailing-30-day window, same
 * `SUM(COALESCE(actual_cost, estimated_cost))` so in-flight spend counts) — this
 * only makes check+reserve atomic; it does NOT change cap semantics.
 *
 * D1 serializes writes to a database: the `INSERT … SELECT` runs as one
 * statement against a consistent snapshot and commits atomically, so two
 * concurrent consumers cannot both pass the guard — the second sees the first's
 * row in its SUM (or is serialized after it) and is refused.
 *
 * If the guard fails, ZERO rows are inserted; we read `meta.changes` and, when
 * nothing was written, throw {@link BudgetExceededError} (reservation refused).
 * `estimatedCost === 0` always reserves (a free unit can't exceed any budget);
 * the `? <= cap` comparison with a 0 addend makes that fall out naturally.
 *
 * Later reconciliation of the real spend is unchanged: settle this row with
 * {@link settleLedgerEntry} once the work completes.
 */
export async function reserveBudget(
  db: D1Database,
  reservation: {
    id: string;
    projectId: string;
    tenantId: string;
    provider: string;
    endpoint: string;
    estimatedUsd: number;
    now: Date;
  },
  capUsd = DEFAULT_CAP_USD,
): Promise<BudgetStatus> {
  const windowStart = new Date(reservation.now.getTime() - WINDOW_MS).toISOString();
  const createdAt = reservation.now.toISOString();
  // ONE conditional insert: the row lands only if the window SUM (over the SAME
  // tenant + rolling window + actual-or-estimated expression the cap uses) PLUS
  // this estimate stays within the cap. D1 serializes this INSERT…SELECT, so
  // concurrent consumers cannot both pass — the loser's SUM already includes the
  // winner's row (or is ordered after it) and its WHERE evaluates false.
  const result = await db
    .prepare(
      `INSERT INTO cost_ledger
         (id, project_id, tenant_id, provider, endpoint, estimated_cost, actual_cost, created_at)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7
        WHERE (
          SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0)
            FROM cost_ledger
           WHERE tenant_id = ?3 AND created_at >= ?8
        ) + ?6 <= ?9`,
    )
    .bind(
      reservation.id,
      reservation.projectId,
      reservation.tenantId,
      reservation.provider,
      reservation.endpoint,
      reservation.estimatedUsd,
      createdAt,
      windowStart,
      capUsd,
    )
    .run();

  // D1 reports rows-affected on `meta.changes`; 0 ⇒ the guard rejected the
  // insert ⇒ the reservation would have exceeded the cap.
  const changes = Number(result.meta?.changes ?? 0);
  if (changes === 0) {
    const status = await budgetStatus(db, reservation.tenantId, reservation.now, capUsd);
    throw new BudgetExceededError(status.remainingUsd, reservation.estimatedUsd, capUsd);
  }

  return budgetStatus(db, reservation.tenantId, reservation.now, capUsd);
}

/**
 * Append a ledger entry. Called twice per costed unit of work in the normal
 * flow: once up-front with the estimate (actual = null), then settled with the
 * real cost. Here we support both in one call: pass `actualUsd` to record a
 * settled entry, omit it for an in-flight reservation.
 */
export async function recordLedgerEntry(
  db: D1Database,
  entry: {
    id: string;
    projectId: string;
    tenantId: string;
    provider: string;
    endpoint: string;
    estimatedUsd: number;
    actualUsd?: number | null;
    createdAt: string;
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO cost_ledger
         (id, project_id, tenant_id, provider, endpoint, estimated_cost, actual_cost, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
    )
    .bind(
      entry.id,
      entry.projectId,
      entry.tenantId,
      entry.provider,
      entry.endpoint,
      entry.estimatedUsd,
      entry.actualUsd ?? null,
      entry.createdAt,
    )
    .run();
}

/**
 * Settle an in-flight reservation to its actual cost (updates `actual_cost`).
 * Scoped by id + tenant so one tenant can never settle another's row.
 */
export async function settleLedgerEntry(
  db: D1Database,
  tenantId: string,
  id: string,
  actualUsd: number,
): Promise<void> {
  await db
    .prepare(`UPDATE cost_ledger SET actual_cost = ?3 WHERE id = ?1 AND tenant_id = ?2`)
    .bind(id, tenantId, actualUsd)
    .run();
}
