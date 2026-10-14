/**
 * Cost ledger + circuit breaker.
 *
 * Every costed provider call appends a row to `cost_ledger`. Before a job runs
 * we ask the breaker whether the job's estimated spend fits inside what's LEFT
 * of the monthly cap; if not, the job is rejected BEFORE any money is spent.
 *
 * The window is ROLLING: "this month" = the trailing 30 days ending at the
 * injected `now`, so spend ages out continuously rather than resetting on a
 * calendar boundary.
 *
 * TWO caps are enforced together (MISSION §11 — "global and per-project
 * budgets" + a "global monthly paid-research cap of $20"):
 *   • a GLOBAL ceiling across ALL tenants (the $20 hard cap — the estate-wide
 *     spend can never exceed it, no matter how many tenants exist); and
 *   • a per-TENANT (per-project billing boundary) budget, configurable, which
 *     defaults to the global cap so by default only the global binds.
 * Both sum actual spend where settled and estimated spend where still in-flight
 * (so two concurrent jobs can't both "fit" against the same headroom), and both
 * are checked in the SAME atomic `INSERT…SELECT` — a reservation lands IFF it
 * fits under BOTH.
 *
 * PURE w.r.t. injected `now`: identical ledger state + clock ⇒ identical
 * decision. No wall-clock reads here.
 */
import type { D1Database } from '@cloudflare/workers-types';

/** The rolling window length, in milliseconds (30 days). */
export const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** The default hard monthly cap, in USD. */
export const DEFAULT_CAP_USD = 20;

/** Which cap a reservation tripped — the GLOBAL ceiling or the per-TENANT budget. */
export type BudgetScope = 'global' | 'tenant';

/** Thrown when a job is rejected because it would exceed the remaining budget. */
export class BudgetExceededError extends Error {
  constructor(
    public readonly remainingUsd: number,
    public readonly estimatedUsd: number,
    public readonly capUsd: number,
    /** Which cap tripped: the cross-tenant `'global'` ceiling or the `'tenant'` budget. */
    public readonly scope: BudgetScope = 'tenant',
  ) {
    super(
      `Budget breaker tripped (${scope}): estimated $${estimatedUsd.toFixed(2)} exceeds remaining ` +
        `$${remainingUsd.toFixed(2)} of the $${capUsd.toFixed(2)} ${scope} monthly cap.`,
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
 * Sum spend across ALL tenants inside the rolling window — the GLOBAL view that
 * backs the §11 estate-wide $20 ceiling. Same window + same
 * `SUM(COALESCE(actual_cost, estimated_cost))` in-flight semantics as
 * {@link budgetStatus}, minus the tenant filter (so every tenant's spend
 * counts). Used by `/health` and `reserveBudget`'s refusal path.
 */
export async function globalBudgetStatus(
  db: D1Database,
  now: Date,
  capUsd = DEFAULT_CAP_USD,
): Promise<BudgetStatus> {
  const windowStart = new Date(now.getTime() - WINDOW_MS).toISOString();
  const row = await db
    .prepare(
      `SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0) AS spent
         FROM cost_ledger
        WHERE created_at >= ?1`,
    )
    .bind(windowStart)
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
 * LEGACY non-atomic breaker — SUPERSEDED by {@link reserveBudget}, which does an
 * atomic check-and-reserve of BOTH caps in one statement. Kept for the read-only
 * pre-flight/monitor paths that don't write a row. Checks BOTH the per-tenant
 * budget AND the §11 GLOBAL ceiling, throwing with the tripped `scope` (global
 * checked first — the hard estate ceiling). The enforcement path writes through
 * `reserveBudget`, not here, so there is no TOCTOU window on the write path.
 *
 * `estimatedUsd === 0` always passes (a free run can't exceed any budget).
 */
export async function assertWithinBudget(
  db: D1Database,
  tenantId: string,
  estimatedUsd: number,
  now: Date,
  capUsd = DEFAULT_CAP_USD,
  tenantCapUsd = capUsd,
): Promise<BudgetStatus> {
  const global = await globalBudgetStatus(db, now, capUsd);
  const tenant = await budgetStatus(db, tenantId, now, tenantCapUsd);
  if (estimatedUsd > 0) {
    if (estimatedUsd > global.remainingUsd) {
      throw new BudgetExceededError(global.remainingUsd, estimatedUsd, capUsd, 'global');
    }
    if (estimatedUsd > tenant.remainingUsd) {
      throw new BudgetExceededError(tenant.remainingUsd, estimatedUsd, tenantCapUsd, 'tenant');
    }
  }
  return tenant;
}

/**
 * ATOMIC two-cap check-and-reserve. Writes ONE in-flight reservation row
 * (actual_cost = NULL) IFF, counting that row's `estimatedCost`, BOTH the GLOBAL
 * rolling-window spend (across ALL tenants) AND this tenant's rolling-window
 * spend stay within their caps — all in a SINGLE `INSERT … SELECT … WHERE`
 * statement. This closes the TOCTOU race a separate SELECT-SUM-then-INSERT
 * leaves open: two concurrent jobs could each pass an independent check before
 * either wrote its reservation, both slipping under a cap.
 *
 * The two caps (MISSION §11):
 *   • `globalCapUsd` — the hard ESTATE-WIDE ceiling (default $20). The SUM has
 *     NO tenant filter, so the sum of all tenants can never exceed it.
 *   • `tenantCapUsd` — the per-project/per-tenant budget (default = globalCap,
 *     so only the global binds unless a tighter budget is passed).
 * Both reuse the SAME trailing-30-day window + `SUM(COALESCE(actual_cost,
 * estimated_cost))` in-flight expression as {@link budgetStatus} — this only
 * composes the two caps atomically; it does NOT change their individual
 * semantics.
 *
 * D1 serializes writes to a database: the `INSERT … SELECT` runs as one
 * statement against a consistent snapshot and commits atomically, so two
 * concurrent consumers cannot both pass the guard — the loser sees the winner's
 * row in BOTH sums (or is serialized after it) and its WHERE evaluates false.
 *
 * If the guard fails, ZERO rows are inserted; we read `meta.changes` and, when
 * nothing was written, re-read both scopes to attribute the refusal and throw
 * {@link BudgetExceededError} carrying the tripped `scope` (global reported
 * first — the hard ceiling). `estimatedCost === 0` always reserves (a free unit
 * can't exceed any budget); the `? <= cap` comparisons with a 0 addend make that
 * fall out naturally.
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
  globalCapUsd = DEFAULT_CAP_USD,
  tenantCapUsd = globalCapUsd,
): Promise<BudgetStatus> {
  const windowStart = new Date(reservation.now.getTime() - WINDOW_MS).toISOString();
  const createdAt = reservation.now.toISOString();
  // ONE conditional insert: the row lands only if, over the SAME rolling window +
  // actual-or-estimated expression the caps use, BOTH (globalSum + est ≤ globalCap)
  // AND (tenantSum + est ≤ tenantCap). globalSum has NO tenant filter; tenantSum
  // filters by `tenant_id = ?3`. D1 serializes this INSERT…SELECT, so concurrent
  // consumers cannot both pass — the loser's sums already include the winner's
  // row (or are ordered after it) and its WHERE evaluates false.
  const result = await db
    .prepare(
      `INSERT INTO cost_ledger
         (id, project_id, tenant_id, provider, endpoint, estimated_cost, actual_cost, created_at)
       SELECT ?1, ?2, ?3, ?4, ?5, ?6, NULL, ?7
        WHERE (
          SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0)
            FROM cost_ledger
           WHERE created_at >= ?8
        ) + ?6 <= ?9
          AND (
          SELECT COALESCE(SUM(COALESCE(actual_cost, estimated_cost)), 0)
            FROM cost_ledger
           WHERE tenant_id = ?3 AND created_at >= ?8
        ) + ?6 <= ?10`,
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
      globalCapUsd,
      tenantCapUsd,
    )
    .run();

  // D1 reports rows-affected on `meta.changes`; 0 ⇒ the guard rejected the
  // insert ⇒ the reservation would have exceeded a cap. Re-read both scopes to
  // attribute WHICH cap tripped (global is the hard ceiling → reported first).
  const changes = Number(result.meta?.changes ?? 0);
  if (changes === 0) {
    const global = await globalBudgetStatus(db, reservation.now, globalCapUsd);
    if (reservation.estimatedUsd > global.remainingUsd) {
      throw new BudgetExceededError(
        global.remainingUsd,
        reservation.estimatedUsd,
        globalCapUsd,
        'global',
      );
    }
    const tenant = await budgetStatus(db, reservation.tenantId, reservation.now, tenantCapUsd);
    throw new BudgetExceededError(
      tenant.remainingUsd,
      reservation.estimatedUsd,
      tenantCapUsd,
      'tenant',
    );
  }

  return budgetStatus(db, reservation.tenantId, reservation.now, tenantCapUsd);
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
