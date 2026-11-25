import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('conference doctrine defines fixed role contracts and routes procedure to one control-plane document', () => {
  const rule = read('rules/evidence-gated-autonomous-orchestration.md');
  const skill = read('01-operating-system/SKILL.md');
  for (const marker of ['Codex leads', 'product/completeness', 'architecture/verification', 'control-plane/CONFERENCE-REVIEW.md']) assert.match(rule, new RegExp(marker.replace('/', '\\/')));
  assert.match(skill, /control-plane\/CONFERENCE-REVIEW\.md/);
  assert.match(rule, /Runtime behavior remains authoritative/);
});

test('evidence-strength table distinguishes independent, combined, sequential, simulated, and live review', () => {
  const contract = read('control-plane/CONFERENCE-REVIEW.md');
  for (const label of ['independent-three-family', 'two-agent', 'combined-role', 'sequential-single-agent', 'simulated', 'live']) assert.ok(contract.includes(`| \`${label}\` |`), `missing evidence label ${label}`);
  assert.match(contract, /Mechanics verified; no live-provider or installed-policy claim/);
  assert.match(contract, /Procedural role coverage, not independent model evidence/);
  assert.match(contract, /Sequential self-review with honest limitation, not independent review/);
});

test('parallel-review guidance is proportional and protected-risk fallback remains fail closed', () => {
  const contract = read('control-plane/CONFERENCE-REVIEW.md');
  assert.match(contract, /Run independent reviews in parallel when/);
  assert.match(contract, /narrow, reversible, low-risk work/);
  assert.match(contract, /Never use fallback to bypass an authority, security, payment, destructive-operation, or external-communication gate/);
  const runtime = read('control-plane/RUNTIME.md');
  assert.match(runtime, /Combined-role and sequential-single-agent modes remain explicitly non-independent/);
});

test('documented JSON examples parse and the documented verification command targets this test', () => {
  const contract = read('control-plane/CONFERENCE-REVIEW.md');
  const blocks = [...contract.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) => JSON.parse(match[1]));
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks[0], {
    mode: 'sequential-single-agent',
    independent: false,
    limitation: 'Only one approved provider slot is available; responsibilities run sequentially and are not independent evidence.',
  });
  assert.equal(blocks[1].decision, 'block');
  assert.match(contract, /node --experimental-strip-types --test tests\/conference-policy-docs\.test\.ts/);
});
