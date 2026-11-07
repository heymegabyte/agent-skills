#!/usr/bin/env node
// worker-pool.mjs — MAX-5 global worker pool with durable leases + weighted-fair selection.
// Governed by rules/worker-pool-and-task-ledger.md. Leases persist in .claude/run-the-loop/leases.json.
// Extends the seat/slot primitives (bin/claude-pool.sh, bin/worktree-pool.sh) with lease/heartbeat/reclaim.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEASES = resolve(ROOT, '.claude/run-the-loop/leases.json');
export const MAX_WORKERS = 5;
const DEFAULT_TTL_MS = 15 * 60 * 1000;

function load() { return existsSync(LEASES) ? JSON.parse(readFileSync(LEASES, 'utf8')) : { leases: [] }; }
function save(s) { mkdirSync(dirname(LEASES), { recursive: true }); writeFileSync(LEASES, JSON.stringify(s, null, 2)); }
const live = (s, now) => s.leases.filter((l) => l.expires_ts > now);

// Reclaim expired leases; returns the task_ids that must be re-queued.
export function reclaim(now = Date.now(), s = load()) {
  const expired = s.leases.filter((l) => l.expires_ts <= now);
  s.leases = live(s, now); save(s);
  return expired.map((l) => l.task_id);
}

// Acquire a slot iff fewer than MAX_WORKERS live leases. One desktop-bound worker is caller's concern.
export function acquire(owner, task_id, now = Date.now(), ttl = DEFAULT_TTL_MS, s = load()) {
  s.leases = live(s, now);
  if (s.leases.length >= MAX_WORKERS) return null;
  const lease = { slot: s.leases.length + 1, owner, pid: process.pid, task_id, heartbeat_ts: now, expires_ts: now + ttl };
  s.leases.push(lease); save(s);
  return lease;
}
export function heartbeat(owner, now = Date.now(), ttl = DEFAULT_TTL_MS, s = load()) {
  const l = s.leases.find((x) => x.owner === owner);
  if (l) { l.heartbeat_ts = now; l.expires_ts = now + ttl; save(s); }
  return l || null;
}
export function release(owner, s = load()) { s.leases = s.leases.filter((l) => l.owner !== owner); save(s); }

// Weighted-fair: next category = max(target_share − current_share) scaled by priority + deadline urgency.
// Drives actual spend toward token-allocation.categories.json targets + prevents starvation.
export function selectNextCategory(targets, actuals, { priority = 1, deadlineBoost = 0 } = {}) {
  const total = Object.values(actuals).reduce((a, b) => a + b, 0) || 0;
  let best = null, bestScore = -Infinity;
  for (const [cat, target] of Object.entries(targets)) {
    const curShare = total ? (actuals[cat] || 0) / total * 100 : 0;
    const deficit = target - curShare;              // under-served → positive
    const score = deficit * priority + deadlineBoost;
    if (score > bestScore) { bestScore = score; best = Number(cat); }
  }
  return best;
}

function main() {
  const [cmd, a, b] = process.argv.slice(2);
  if (cmd === 'acquire') console.log(JSON.stringify(acquire(a, b)));
  else if (cmd === 'heartbeat') console.log(JSON.stringify(heartbeat(a)));
  else if (cmd === 'release') release(a), console.log('released');
  else if (cmd === 'reclaim') console.log('requeue: ' + JSON.stringify(reclaim()));
  else if (cmd === 'status') console.log(JSON.stringify(load(), null, 2));
  else { console.error('usage: worker-pool.mjs <acquire|heartbeat|release|reclaim|status> [owner] [task_id]'); process.exit(2); }
}
if (import.meta.url === `file://${process.argv[1]}`) main();
