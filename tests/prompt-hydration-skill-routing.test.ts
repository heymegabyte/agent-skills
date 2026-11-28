import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const canonicalSkills = [
  '01-operating-system',
  '02-goal-and-brief',
  '04-preference-and-memory',
  '05-architecture-and-stack',
  '06-build-and-slice-loop',
  '07-quality-and-verification',
  '08-deploy-and-runtime-verification',
  '14-independent-idea-engine',
];

function route(prompt: string): string[] {
  const run = spawnSync('python3', ['bin/skill-router.py', 'route', prompt, '--cwd', root, '--offline'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 15_000,
  });
  assert.equal(run.status, 0, run.stderr);
  return (JSON.parse(run.stdout).selected as Array<{ id: string }>).map((entry) => entry.id);
}

test('canonical lifecycle skills consume Prompt Hydration artifacts without copied orchestration doctrine', () => {
  for (const skill of canonicalSkills) {
    const source = readFileSync(join(root, skill, 'SKILL.md'), 'utf8');
    assert.match(source, /Prompt Hydration/i, `${skill} must name the canonical first stage`);
    assert.doesNotMatch(source, /^## Multi-Swarm Parallelization & OpenCode/m, `${skill} must reference rather than copy orchestration procedure`);
    assert.equal((source.match(/^## Theme\.tools ecosystem contract \(required\)$/gm) ?? []).length, 1, `${skill} must retain exactly one canonical shared-owner marker`);
    assert.doesNotMatch(source, /Massive OpenCode \(DeepSeek\) Offload/, `${skill} must reference rather than copy orchestration procedure`);
  }
});

test('narrow repair routing stays on the smallest lifecycle set', { timeout: 20_000 }, () => {
  const selected = route('Fix the mega menu title changing on hover');
  for (const required of ['01-operating-system', '04-preference-and-memory', '07-quality-and-verification']) assert.ok(selected.includes(required));
  for (const excluded of ['02-goal-and-brief', '05-architecture-and-stack', '06-build-and-slice-loop', '08-deploy-and-runtime-verification', '14-independent-idea-engine']) assert.ok(!selected.includes(excluded), `narrow repair unexpectedly loaded ${excluded}`);
});

test('architecture and improvement prompts add only their coherent lifecycle specialization', { timeout: 35_000 }, () => {
  const architecture = route('Architect the provider runtime');
  assert.ok(architecture.includes('05-architecture-and-stack'));
  for (const excluded of ['02-goal-and-brief', '06-build-and-slice-loop', '08-deploy-and-runtime-verification', '14-independent-idea-engine']) assert.ok(!architecture.includes(excluded), `architecture prompt unexpectedly loaded ${excluded}`);

  const improvement = route('what else?');
  assert.ok(improvement.includes('14-independent-idea-engine'));
  for (const excluded of ['05-architecture-and-stack', '06-build-and-slice-loop', '08-deploy-and-runtime-verification']) assert.ok(!improvement.includes(excluded), `improvement prompt unexpectedly loaded ${excluded}`);
});
