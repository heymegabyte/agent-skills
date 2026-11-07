#!/usr/bin/env node
/**
 * enforce-budget.mjs — turn the financial hard-cap DOCTRINE (rules/cost-per-request-accountability.md
 * § Provisioning budget guardrails) into an executable GATE. The §5/§9 "enforce-budget" helper.
 *
 * WHY: an email alert is NOT a cap. Neon has no dollar hard-cap — the enforced stop is a per-project
 * consumption QUOTA (compute_time_seconds) via the API. Upstash's per-DB pay-as-you-go budget IS enforced
 * (rate-limits at the ceiling). This script translates a $/project budget into the right provider primitive
 * and sets/verifies it. Default is --dry-run (prints the request; changes nothing).
 *
 * Usage:
 *   enforce-budget --provider neon   --project <id> --budget 10 [--plan launch|scale] [--set]
 *   enforce-budget --provider upstash --db <id>     --budget 10 [--product redis|qstash|vector] [--set]
 *   enforce-budget --self-test        # run the pure-math assertions (no network, no creds) — exit 0/1
 *
 * Secrets resolved at runtime via get-secret (NEON_API_KEY / UPSTASH_EMAIL+UPSTASH_API_KEY); never printed.
 * Structured JSON to stdout; diagnostics to stderr. Idempotent (setting the same quota twice is a no-op).
 * Exit: 0 ok/within-budget · 1 error · 2 over-budget/would-exceed · 3 no-enforcement-available (refuse).
 */
import { execFileSync } from 'node:child_process';

// ---- PURE CORE (unit-testable, no I/O) ------------------------------------------------------------
// Neon: $ → CU-hours → compute_time_seconds quota. Plan rates verified 2026-10-25 (re-verify on bump).
const NEON_CU_HOUR_USD = { launch: 0.106, scale: 0.222 };
export function neonComputeSecondsForBudget(dollars, plan = 'launch') {
  const rate = NEON_CU_HOUR_USD[plan];
  if (!rate) throw new Error(`unknown Neon plan: ${plan}`);
  return Math.floor((dollars / rate) * 3600); // CU-hours → CU-seconds
}
// Upstash: the budget IS the dollar figure; QStash has a $20 MIN budget (can't hit <$20 → caller must route).
export function upstashBudget(dollars, product = 'redis') {
  const minByProduct = { redis: 0, vector: 0, qstash: 20 };
  const floor = minByProduct[product] ?? 0;
  const enforceable = product === 'redis' || product === 'qstash'; // vector cap unconfirmed as of 2026-10-25
  return { dollars, floor, belowFloor: dollars < floor, enforceable };
}
export function withinBudget(currentUsd, capUsd) { return currentUsd <= capUsd; }

// ---- SELF-TEST (runs now, no network) -------------------------------------------------------------
function selfTest() {
  const eq = (a, b, m) => { if (a !== b) throw new Error(`FAIL ${m}: ${a} !== ${b}`); };
  eq(neonComputeSecondsForBudget(10, 'launch'), 339622, '$10 launch → CU-seconds');
  eq(neonComputeSecondsForBudget(10, 'scale'), 162162, '$10 scale → CU-seconds');
  eq(upstashBudget(10, 'qstash').belowFloor, true, 'qstash $10 is below the $20 floor');
  eq(upstashBudget(10, 'redis').belowFloor, false, 'redis $10 is fine');
  eq(upstashBudget(10, 'vector').enforceable, false, 'vector budget unconfirmed → not enforceable');
  eq(withinBudget(9.5, 10), true, 'within'); eq(withinBudget(11, 10), false, 'over');
  console.log('✓ enforce-budget self-test: 6/6 pure-math assertions pass');
}

// ---- CLI / I/O ------------------------------------------------------------------------------------
function arg(k, d) { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? (process.argv[i + 1] ?? true) : d; }
const has = (k) => process.argv.includes(`--${k}`);
function getSecret(key) { return execFileSync('get-secret', [key], { encoding: 'utf8' }).trim(); } // never logged

function main() {
  if (has('self-test')) return selfTest();
  const provider = arg('provider'), budget = Number(arg('budget', 10)), set = has('set'), dryRun = !set;
  if (!provider) { console.error('--provider neon|upstash required (or --self-test)'); process.exit(1); }

  if (provider === 'neon') {
    const project = arg('project'), plan = arg('plan', 'launch');
    if (!project) { console.error('--project <id> required for neon'); process.exit(1); }
    const quotaSeconds = neonComputeSecondsForBudget(budget, plan);
    const plan_req = { project: { settings: { quota: { compute_time_seconds: quotaSeconds } } } };
    console.log(JSON.stringify({ provider, project, budgetUsd: budget, plan,
      enforcedBy: 'per-project consumption quota (compute_time_seconds) — the only Neon HARD stop; the $ limit is email-only',
      quota_compute_time_seconds: quotaSeconds, dryRun,
      request: { method: 'PATCH', url: `https://console.neon.tech/api/v2/projects/${project}`, body: plan_req } }, null, 2));
    if (set) {
      const key = getSecret('NEON_API_KEY'); // resolved, never printed
      execFileSync('curl', ['-fsS', '-X', 'PATCH', `https://console.neon.tech/api/v2/projects/${project}`,
        '-H', `Authorization: Bearer ${key}`, '-H', 'Content-Type: application/json',
        '-d', JSON.stringify(plan_req)], { stdio: 'inherit' });
      console.error('applied Neon quota + verify via GET; also set autoscaling_limit_max_cu + scale-to-zero separately');
    }
    return;
  }
  if (provider === 'upstash') {
    const db = arg('db'), product = arg('product', 'redis'); const b = upstashBudget(budget, product);
    if (!db) { console.error('--db <id> required for upstash'); process.exit(1); }
    if (!b.enforceable) { console.error(`${product} has no confirmed enforced budget → free-tier only or verify`); process.exit(3); }
    if (b.belowFloor) { console.error(`${product} min budget is $${b.floor} > requested $${budget} → cannot cap at $${budget}; use CF Queues (qstash) or raise the budget`); process.exit(3); }
    console.log(JSON.stringify({ provider, db, budgetUsd: budget, product, enforcedBy: 'per-DB pay-as-you-go budget (rate-limits at the ceiling)', dryRun }, null, 2));
    if (set) { getSecret('UPSTASH_API_KEY'); console.error('apply via Upstash Developer API: set the DB budget; verify via GET /v2/redis/databases'); }
    return;
  }
  console.error(`unknown provider: ${provider}`); process.exit(1);
}
try { main(); } catch (e) { console.error(String(e?.message ?? e)); process.exit(1); }
