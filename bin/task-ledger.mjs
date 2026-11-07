#!/usr/bin/env node
// task-ledger.mjs — append-only task ledger over .claude/run-the-loop/ledger.ndjson
// Governed by rules/worker-pool-and-task-ledger.md; records validate against task-ledger.schema.json.
// CLI: node bin/task-ledger.mjs <append|claim|update|complete|state|list> '<json>'
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LEDGER = resolve(ROOT, '.claude/run-the-loop/ledger.ndjson');
const STATUSES = ['backlog', 'ready', 'claimed', 'in_progress', 'blocked', 'verifying', 'done', 'abandoned'];
const REQUIRED = ['id', 'project', 'category', 'task_type', 'priority', 'status', 'acceptance_criteria', 'idempotency_key'];

function nowIso(ts = Date.now()) { return new Date(ts).toISOString(); }

export function validate(rec) {
  const errs = [];
  for (const k of REQUIRED) if (rec[k] === undefined || rec[k] === null || rec[k] === '') errs.push(`missing ${k}`);
  if (rec.category != null && (rec.category < 1 || rec.category > 50)) errs.push('category out of 1..50');
  if (rec.status && !STATUSES.includes(rec.status)) errs.push(`bad status ${rec.status}`);
  return errs;
}

export function readEvents() {
  if (!existsSync(LEDGER)) return [];
  return readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

// Reduce append-only events to latest state per task id.
export function state() {
  const byId = new Map();
  for (const e of readEvents()) byId.set(e.id, { ...(byId.get(e.id) || {}), ...e });
  return [...byId.values()];
}

function writeEvent(rec, ts = Date.now()) {
  mkdirSync(dirname(LEDGER), { recursive: true });
  appendFileSync(LEDGER, JSON.stringify({ ...rec, _ts: nowIso(ts) }) + '\n');
}

export function append(rec, ts) {
  const errs = validate(rec);
  if (errs.length) throw new Error('invalid task: ' + errs.join('; '));
  writeEvent(rec, ts);
  return rec;
}

// Idempotency guard: never re-perform an outward action already done for this key.
export function completeOnce(id, idempotency_key, patch = {}, ts) {
  const done = state().find((t) => t.idempotency_key === idempotency_key && t.status === 'done');
  if (done) return { skipped: true, reason: 'idempotent: already done', id: done.id };
  writeEvent({ id, idempotency_key, status: 'done', ...patch }, ts);
  return { skipped: false, id };
}

function main() {
  const [cmd, json] = process.argv.slice(2);
  const arg = json ? JSON.parse(json) : {};
  if (cmd === 'append') console.log(JSON.stringify(append(arg)));
  else if (cmd === 'update' || cmd === 'claim') writeEvent(arg), console.log('ok');
  else if (cmd === 'complete') console.log(JSON.stringify(completeOnce(arg.id, arg.idempotency_key, arg)));
  else if (cmd === 'state') console.log(JSON.stringify(state(), null, 2));
  else if (cmd === 'list') console.log(state().map((t) => `${t.status}\t#${t.category}\t${t.id}`).join('\n'));
  else { console.error('usage: task-ledger.mjs <append|claim|update|complete|state|list> <json>'); process.exit(2); }
}
if (import.meta.url === `file://${process.argv[1]}`) main();
