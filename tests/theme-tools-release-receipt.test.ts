import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas/theme-tools-release-receipt.schema.json'), 'utf8'));
const receipt = JSON.parse(readFileSync(join(root, 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-8.3-blocked-release.json'), 'utf8'));

test('task 8.3 blocked release receipt remains schema-valid and exactly resumable', () => {
  assert.deepEqual(validateSchemaInstance(schema, receipt), []);
  assert.equal(receipt.state, 'BLOCKED');
  assert.equal(receipt.package.expectedNextVersion, '1.0.1');
  assert.equal(receipt.registryObservation.observedVersion, '1.0.0');
  assert.equal(receipt.registryObservation.expectedVersionPresent, false);
  assert.equal(receipt.releaseWorkflow.manualRerunSafe, false);
  assert.deepEqual(receipt.releaseWorkflow.matchingRuns, []);
  assert.equal(receipt.qualificationRuns.length, 3);
  assert.ok(receipt.qualificationRuns.every((run: { stepsStarted: boolean }) => run.stepsStarted === false));
  assert.ok(receipt.blockers.some((blocker: { id: string }) => blocker.id === 'github-actions-billing'));
  assert.match(receipt.resumableAction.stopCondition, /Remain BLOCKED/);
  assert.ok(receipt.claimLimits.includes('Package publication and consumer adoption are not claimed.'));
});
