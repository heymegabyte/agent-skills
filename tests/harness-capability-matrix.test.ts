import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas/harness-capability-matrix.schema.json'), 'utf8'));
const matrix = JSON.parse(readFileSync(join(root, 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-9.4-capability-matrix.json'), 'utf8'));

test('task 9.4 capability matrix is schema-valid and keeps evidence strengths distinct', () => {
  assert.deepEqual(validateSchemaInstance(schema, matrix), []);
  assert.deepEqual(matrix.targets.map((target: { id: string }) => target.id), ['codex', 'claude', 'gemini', 'opencode', 'paperclip', 'openclaw']);
  assert.deepEqual(matrix.targets.filter((target: { nativePromptHook: { status: string } }) => target.nativePromptHook.status === 'passed').map((target: { id: string }) => target.id), ['claude']);
  assert.ok(matrix.targets.every((target: { explicitWrapper: { status: string } }) => target.explicitWrapper.status === 'passed'));
  assert.ok(matrix.targets.every((target: { liveProviderExecution: { status: string }; evidenceStrength: string[] }) => target.liveProviderExecution.status !== 'passed' && !target.evidenceStrength.includes('live-provider')));
  assert.equal(matrix.summary.liveExecutionsObserved, 0);
  assert.equal(matrix.probePolicy.secretsExposed, false);
});

