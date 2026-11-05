#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const PASS = new Set(['fresh_pass', 'valid_cache', 'not_applicable']);

export function reconcileGate(selection, evidence) {
  const byId = new Map(evidence.map((item) => [item.test_id, item]));
  const missing = selection.selected.filter((id) => !byId.has(id));
  const states = selection.selected.map((id) => byId.get(id)?.state ?? 'incomplete');
  const counts = Object.fromEntries([...new Set(states)].sort().map((state) => [state, states.filter((x) => x === state).length]));
  const blocked = missing.length > 0 || states.some((state) => !PASS.has(state));
  return {
    schema_version: '1.0.0', revision: selection.head, artifact: selection.artifact,
    selection_digest: selection.digest ?? 'unavailable', verdict: blocked ? 'block' : 'pass',
    counts, missing, generated_at: new Date().toISOString()
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const selection = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const evidence = JSON.parse(readFileSync(process.argv[3], 'utf8'));
  const verdict = reconcileGate(selection, evidence);
  process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
  if (verdict.verdict !== 'pass') process.exitCode = 1;
}
