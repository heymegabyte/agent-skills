import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { buildDurabilityEvaluationReport } from '../bin/durability-evaluation.ts';
import { digest } from '../bin/orchestration-run-state.ts';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas', 'durability-evaluation-report.schema.json'), 'utf8'));
const recorded = JSON.parse(readFileSync(join(root, 'openspec', 'changes', 'operational-prompt-hydration-workflow', 'evidence', 'task-10.2-evaluation.json'), 'utf8'));

test('recorded durability evaluation is schema-valid and reproducible', async () => {
  assert.deepEqual(validateSchemaInstance(schema, recorded), []);
  assert.deepEqual(await buildDurabilityEvaluationReport(), recorded);
  const { evaluationId, ...unsigned } = recorded;
  assert.equal(evaluationId, digest(unsigned));
});

test('every required fault records exact state, ownership, evidence, and next action', () => {
  const expected = ['interruption-resume', 'duplicate-dispatch', 'competing-writers', 'blocked-release', 'remote-main-advance', 'maintenance-recursion'];
  assert.deepEqual(recorded.summary.scenarioIds, expected);
  assert.equal(recorded.summary.total, 6);
  assert.equal(recorded.summary.passed, 6);
  for (const scenario of recorded.scenarios) {
    assert.equal(scenario.status, 'pass', scenario.scenarioId);
    assert.ok(scenario.observations.length > 0, scenario.scenarioId);
    for (const observation of scenario.observations) {
      assert.match(observation.state.stateDigest, /^sha256:[0-9a-f]{64}$/);
      assert.ok(observation.state.checkpointRef);
      assert.ok(observation.ownership.repository);
      assert.ok(observation.evidence.length > 0);
      assert.ok(observation.nextAction.action);
      assert.ok(observation.nextAction.target);
      assert.equal(observation.nextAction.resumable, true);
    }
  }
});

test('fault-specific invariants remain explicit in the ledger', () => {
  const byId = new Map(recorded.scenarios.map((scenario: any) => [scenario.scenarioId, scenario.observations[0]]));
  assert.equal(byId.get('duplicate-dispatch').state.disposition, 'existing-execution');
  assert.deepEqual(byId.get('competing-writers').ownership.waitingOwners, ['run-b']);
  assert.match(byId.get('blocked-release').state.blockedEdges[0], /release-to-consumer/);
  assert.equal(byId.get('remote-main-advance').state.disposition, 'remote-commit-mismatch');
  assert.equal(byId.get('maintenance-recursion').state.disposition, 'equivalent-trigger-covered');
  assert.match(byId.get('interruption-resume').evidence[0].observation, /only unfinished ready task launched/);
});
