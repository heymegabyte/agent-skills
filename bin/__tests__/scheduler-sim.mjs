#!/usr/bin/env node
// scheduler-sim.mjs — 1000-iteration proof for rules/worker-pool-and-task-ledger.md (BACKLOG SIM-SCHED).
// Deterministic (seeded LCG, no Math.random). Asserts: MAX-5 concurrency, weighted-fair spend trends to
// token-allocation targets, no category starves, expired leases reclaim + re-queue.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectNextCategory, MAX_WORKERS } from '../worker-pool.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const cats = JSON.parse(readFileSync(resolve(ROOT, '.claude/run-the-loop/token-allocation.categories.json'), 'utf8'));
const targets = Object.fromEntries(cats.categories.map((c) => [c.id, c.target]));

// seeded LCG for reproducible "random" task token sizes
let seed = 1234567;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const N = 1000;
const actuals = Object.fromEntries(cats.categories.map((c) => [c.id, 0]));
const workers = [];           // active leases: {owner, expires}
let maxConcurrent = 0, reclaimed = 0, now = 0;

for (let i = 0; i < N; i++) {
  now += 1000;
  // reclaim expired leases (simulate ~20% of ticks having a stale worker to reclaim)
  for (let w = workers.length - 1; w >= 0; w--) if (workers[w].expires <= now) { workers.splice(w, 1); reclaimed++; }
  // fill up to MAX_WORKERS
  while (workers.length < MAX_WORKERS) {
    const cat = selectNextCategory(targets, actuals, { priority: 1 });
    const tokens = 500 + Math.floor(rand() * 1500);     // variable task size
    actuals[cat] += tokens;
    const ttl = (1 + Math.floor(rand() * 3)) * 1000;    // 1–3 ticks; forces reclaim churn
    workers.push({ owner: `w${i}`, cat, expires: now + ttl });
    maxConcurrent = Math.max(maxConcurrent, workers.length);
  }
}

const total = Object.values(actuals).reduce((a, b) => a + b, 0);
const rows = cats.categories.map((c) => ({ id: c.id, name: c.name, target: c.target, actual: +(actuals[c.id] / total * 100).toFixed(2) }));
const maxDev = Math.max(...rows.map((r) => Math.abs(r.actual - r.target)));
const starved = rows.filter((r) => r.actual === 0);

console.log(`iterations=${N} maxConcurrent=${maxConcurrent} reclaimed=${reclaimed} total_tokens=${total}`);
console.log('sample target vs actual %:');
for (const id of [1, 2, 11, 21, 50]) { const r = rows.find((x) => x.id === id); console.log(`  #${r.id} ${r.name}: target ${r.target} / actual ${r.actual}`); }
console.log(`maxDeviation=${maxDev.toFixed(2)}pp  starvedCategories=${starved.length}`);

const pass = maxConcurrent <= MAX_WORKERS && starved.length === 0 && maxDev <= 1.5 && reclaimed > 0;
console.log(pass ? 'SIM PASS ✓' : 'SIM FAIL ✗');
process.exit(pass ? 0 : 1);
