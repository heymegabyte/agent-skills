import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { compileMcpInventory, validateMcpInventory } from '../bin/mcp-inventory-compiler.ts';

const root = join(import.meta.dirname, '..');
const read = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const schema = read('schemas/mcp-inventory.schema.json');
const positive = read('fixtures/mcp-catalog/inventory-positive.json');
const negatives = read('fixtures/mcp-catalog/inventory-negative-mutations.json');

function mutate(source: any, mutation: any) {
  const result = structuredClone(source); const parts = mutation.path.split('.'); let target = result;
  for (const part of parts.slice(0, -1)) target = target[Number.isInteger(Number(part)) ? Number(part) : part];
  const key = parts.at(-1); if (mutation.operation === 'delete') delete target[key]; else if (mutation.operation === 'delete-array') target.splice(Number(key), 1); else target[key] = mutation.value;
  return result;
}

test('one strict record exists for every selected MCP with complete traceability', () => {
  assert.deepEqual(validateMcpInventory(schema, positive), []);
  const compiled = compileMcpInventory(positive, schema);
  assert.deepEqual(compiled.selectedMcpIds, compiled.records.map((record) => record.mcpId));
  assert.equal(compiled.records[0].status.execution, 'verified');
  assert.equal(compiled.records[1].status.execution, 'unverified');
  assert.ok(compiled.records[1].unknowns.length >= 6);
});

test('omitted, incomplete, pending-selection, and falsely executable records fail', () => {
  for (const mutation of negatives.mutations) {
    const errors = validateMcpInventory(schema, mutate(positive, mutation));
    assert.ok(errors.length, `${mutation.id} unexpectedly validated`);
  }
});

test('selected-record cardinality rejects extra, duplicate, and unselected records', () => {
  const extra = structuredClone(positive); const record = structuredClone(extra.records[0]); record.mcpId = 'MCP:gamma'; extra.records.push(record);
  assert.ok(validateMcpInventory(schema, extra).some((error) => error.includes('unselected')));
  const duplicate = structuredClone(positive); duplicate.records.push(structuredClone(duplicate.records[0]));
  assert.ok(validateMcpInventory(schema, duplicate).some((error) => error.includes('duplicate') || error.includes('uniqueItems')));
});

test('selection-pending scope remains distinct from selected MCP inventory', () => {
  assert.throws(() => compileMcpInventory({ ...positive, catalogScopeId: 'MCP-SELECTION-pending' }, schema), /Selection-pending scope/);
  assert.ok(validateMcpInventory(schema, { ...positive, records: [{ selectionId: 'MCP-SELECTION-a', status: 'selection-pending', scopeRequirementIds: ['REQ-MCP-a'] }] }).length);
});
