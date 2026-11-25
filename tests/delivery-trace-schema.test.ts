import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';
import { validateDeliveryTraceInstance } from '../bin/validate-delivery-trace.ts';

const root = join(import.meta.dirname, '..');
const readJson = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const schema = readJson('schemas/delivery-trace.schema.json');
const complete = readJson('fixtures/delivery-trace/complete.json');
const negative = readJson('fixtures/delivery-trace/negative-mutations.json') as {
  mutations: Array<{ id: string; path: string; operation: 'delete' | 'replace'; value?: unknown }>;
};

function mutate(source: unknown, mutation: (typeof negative.mutations)[number]): unknown {
  const candidate = structuredClone(source) as Record<string, unknown>;
  const segments = mutation.path.split('.');
  let target: any = candidate;
  for (const segment of segments.slice(0, -1)) target = target[Number.isInteger(Number(segment)) ? Number(segment) : segment];
  const key = segments.at(-1)!;
  if (mutation.operation === 'delete') delete target[key]; else target[key] = mutation.value;
  return candidate;
}

test('complete requirement-to-production trace validates strictly', () => {
  assert.deepEqual(validateDeliveryTraceInstance(schema, complete), []);
});

test('every incomplete or ambiguous delivery edge fails validation for its intended mutation', () => {
  assert.ok(negative.mutations.length >= 24);
  for (const mutation of negative.mutations) {
    const errors = validateDeliveryTraceInstance(schema, mutate(complete, mutation));
    assert.ok(errors.length > 0, `${mutation.id} unexpectedly validated`);
    assert.ok(errors.some((error) => error.includes(mutation.path.split('.').at(-1)!) || error.includes('records[0]')), `${mutation.id} failed on an unrelated edge: ${errors.join('; ')}`);
  }
});

test('schema closes every delivery object against undeclared claims', () => {
  for (const definition of ['requirement', 'scenario', 'task', 'evidenceExpectation', 'implementation', 'verification', 'verificationReceipt', 'integration', 'remoteResult', 'delivery', 'release', 'consumer', 'production', 'blocker', 'record']) {
    assert.equal(schema.$defs[definition].additionalProperties, false, `${definition} must reject ambiguous extra fields`);
  }
});

test('duplicate exact trace records and scenario references are rejected', () => {
  const duplicateRecord = structuredClone(complete);
  duplicateRecord.records.push(structuredClone(duplicateRecord.records[0]));
  assert.ok(validateSchemaInstance(schema, duplicateRecord).some((error) => error.includes('uniqueItems')));
  const duplicateScenario = structuredClone(complete);
  duplicateScenario.records[0].scenarioIds.push(duplicateScenario.records[0].scenarioIds[0]);
  assert.ok(validateSchemaInstance(schema, duplicateScenario).some((error) => error.includes('uniqueItems')));
});

test('semantic validator rejects duplicate requirement and task identities even when records differ', () => {
  const duplicateIdentity = structuredClone(complete);
  const second = structuredClone(duplicateIdentity.records[0]);
  second.recordId = 'TRACE:REQ-001:TASK-002';
  second.task.id = 'TASK-002';
  second.requirement.observableBehavior = 'A conflicting behavior reuses the same requirement identity.';
  duplicateIdentity.records.push(second);
  assert.ok(validateDeliveryTraceInstance(schema, duplicateIdentity).some((error) => error.includes('duplicate requirement id')));
  second.requirement.id = 'REQ-002';
  second.task.id = duplicateIdentity.records[0].task.id;
  assert.ok(validateDeliveryTraceInstance(schema, duplicateIdentity).some((error) => error.includes('duplicate task id')));
});
