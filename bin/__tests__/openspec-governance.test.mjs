#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');

const rule = read('rules/openspec-operating-contract.md');
const entrypoints = ['AGENTS.md', 'CODEX.md', 'CLAUDE.md', 'GEMINI.md', 'AMP.md'];
const failures = [];

const requireText = (name, body, pattern, expectation) => {
  if (!pattern.test(body)) failures.push(`${name}: ${expectation}`);
};

requireText('canonical rule', rule, /every task/i, 'must classify every task');
requireText('canonical rule', rule, /durable (repository )?(change|mutation|state)/i, 'must govern every durable mutation');
requireText('canonical rule', rule, /read-only/i, 'must define the read-only no-change path');
requireText('canonical rule', rule, /emergency restoration/i, 'must define emergency restoration capture');
requireText('canonical rule', rule, /same (turn|work session)/i, 'must require same-session emergency capture');
requireText('canonical rule', rule, /reasonable assumptions/i, 'must direct agents to proceed with reasonable assumptions');
requireText('canonical rule', rule, /adjacent high-value work/i, 'must authorize adjacent high-value work');
requireText('canonical rule', rule, /propose.*apply.*verify.*sync.*archive/is, 'must define the complete autonomous lifecycle');
requireText('canonical rule', rule, /explicitly assigned.*architect.*role/i, 'must require explicit architect-role assignment');
requireText('canonical rule', rule, /model.*(alone|label).*insufficient/i, 'must reject model identity as role authorization');
requireText('canonical rule', rule, /Architect Role:\*\* assigned/i, 'must define the machine-verifiable role marker');

if (/Directly implement trivial typo, formatting, documentation and isolated configuration fixes\./i.test(rule)) {
  failures.push('canonical rule: retains the trivial-change bypass');
}

for (const path of entrypoints) {
  const body = read(path);
  requireText(path, body, /OpenSpec/i, 'must reference OpenSpec');
  requireText(path, body, /(every durable|all durable|durable repository)/i, 'must require OpenSpec for durable mutations');
  requireText(path, body, /(autonomous|without asking|without.*permission|continue.*lifecycle)/i, 'must preserve autonomous completion');
  if (/OpenSpec for material changes/i.test(body)) failures.push(`${path}: retains material-only OpenSpec language`);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `✗ ${failure}`).join('\n'));
  process.exit(1);
}

console.log(`✓ universal OpenSpec governance validated across ${entrypoints.length} harness entrypoints`);
