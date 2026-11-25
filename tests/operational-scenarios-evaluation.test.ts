import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { evaluateOperationalScenarios } from '../bin/evaluate-operational-scenarios.ts';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas/operational-evaluation-report.schema.json'), 'utf8'));
const committed = JSON.parse(readFileSync(join(root, 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.1-evaluation.json'), 'utf8'));

test('task 10.1 scenarios produce the committed schema-valid requirement-level evaluation', async () => {
  const actual = await evaluateOperationalScenarios();
  assert.deepEqual(validateSchemaInstance(schema, actual), []);
  assert.deepEqual(actual, committed);
  assert.deepEqual(actual.results.map((result) => result.scenarioId), [
    'one-sentence-mcp-catalog', 'single-provider-fallback', 'narrow-bug-fix', 'scoped-correction',
  ]);
  assert.ok(actual.results.every((result) => result.status === 'PASS' && result.proportionality.status === 'PASS'));
  assert.equal(actual.results.find((result) => result.scenarioId === 'single-provider-fallback')?.provenance.independent, false);
});
