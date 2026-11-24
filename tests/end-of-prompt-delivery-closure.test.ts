import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { enforceAcrossRoot } from '../bin/enforce-multi-swarm-across-skills.ts';
import { formatHydratedBrief, hydratePrompt } from '../bin/prompt-hydrator.ts';

test('delivery closure is propagated once to existing skill and agent sections', () => {
  const root = mkdtempSync(join(tmpdir(), 'delivery-closure-'));
  mkdirSync(join(root, 'sample'), { recursive: true });
  mkdirSync(join(root, 'agents'), { recursive: true });
  writeFileSync(join(root, 'sample', 'SKILL.md'), '# Sample\n\n## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate\n');
  writeFileSync(join(root, 'agents', 'sample.md'), '# Sample agent\n\n## 8. End-of-Round Parallel Meaning & Preference Triad Extraction & Multi-Swarm Mandate\n');

  assert.deepEqual(enforceAcrossRoot(root), { skillsUpdated: 1, agentsUpdated: 1 });
  assert.deepEqual(enforceAcrossRoot(root), { skillsUpdated: 0, agentsUpdated: 0 });
  for (const path of [join(root, 'sample', 'SKILL.md'), join(root, 'agents', 'sample.md')]) {
    const content = readFileSync(path, 'utf8');
    assert.equal(content.match(/\*\*Concurrent End-of-Prompt Delivery Closure\*\*/g)?.length, 1);
    assert.match(content, /revalidate the exact final tree/i);
  }
  assert.match(readFileSync(join(root, 'sample', 'SKILL.md'), 'utf8'), /End-of-Round Parallel Meaning & Preference Triad Extraction/);
});

test('hydrated briefs carry the exact-tree production closure contract', async () => {
  const root = mkdtempSync(join(tmpdir(), 'delivery-hydrator-'));
  writeFileSync(join(root, 'package.json'), '{"dependencies":{}}');
  const brief = formatHydratedBrief(await hydratePrompt({ prompt: 'Implement a feature', checkout: root, now: '2026-11-24T00:00:00.000Z' }));
  assert.match(brief, /Concurrent End-of-Prompt Delivery Closure/);
  assert.match(brief, /Revalidate the exact final tree after reconciliation/);
  assert.match(brief, /push it normally to `main`/);
});
