import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const run = (...args: string[]) => spawnSync(process.execPath, ['--experimental-strip-types', 'bin/openspec-delivery-trace.ts', ...args], { cwd: root, encoding: 'utf8' });

test('documented compile, validate, query, and MCP inventory commands execute against fixtures', () => {
  const output = mkdtempSync(join(tmpdir(), 'delivery-trace-docs-'));
  const compile = run('compile', '--scope', 'fixtures/delivery-trace/hydrated-scope.json', '--schema', 'schemas/delivery-trace.schema.json', '--output', output);
  assert.equal(compile.status, 0, compile.stderr); assert.equal(JSON.parse(compile.stdout).status, 'compiled');
  for (const path of ['proposal.md', 'design.md', 'specs/compiled-delivery/spec.md', 'tasks.md', 'delivery-trace.json']) assert.ok(readFileSync(join(output, path), 'utf8').length);
  const validate = run('validate', '--ledger', 'fixtures/delivery-trace/complete.json', '--schema', 'schemas/delivery-trace.schema.json');
  assert.equal(validate.status, 0, validate.stderr); assert.equal(JSON.parse(validate.stdout).valid, true);
  const query = run('query', '--ledger', 'fixtures/delivery-trace/complete.json', '--requirement', 'REQ-001');
  assert.equal(query.status, 0, query.stderr); assert.equal(JSON.parse(query.stdout).count, 1);
  const reconciliationPath = join(output, 'reconciliation-receipt.json');
  const reconcile = run('reconcile', '--ledger', join(output, 'delivery-trace.json'), '--evidence', 'fixtures/delivery-trace/task-evidence.json', '--schema', 'schemas/delivery-trace.schema.json', '--output', reconciliationPath);
  assert.equal(reconcile.status, 0, reconcile.stderr); assert.equal(JSON.parse(readFileSync(reconciliationPath, 'utf8')).complete, true);
  const mcp = run('validate-mcp', '--inventory', 'fixtures/mcp-catalog/inventory-positive.json', '--schema', 'schemas/mcp-inventory.schema.json');
  assert.equal(mcp.status, 0, mcp.stderr); assert.equal(JSON.parse(mcp.stdout).records, 2);
});

test('documentation defines IDs, lifecycle, no-manual-table rule, and evidence-safe archive semantics', () => {
  const docs = readFileSync(join(root, 'control-plane', 'DELIVERY-TRACE.md'), 'utf8');
  for (const marker of ['REQ-*', 'SCN-*', 'TASK-*', 'TRACE:<requirement>:<task>', 'Hydrate and compile', 'Implement and reconcile', 'Update', 'Sync', 'Archive', 'Never maintain a second manual trace table', 'selection-pending', 'execution: verified']) assert.ok(docs.includes(marker), marker);
  assert.match(docs, /Archiving never upgrades `pending`, `unverified`, controlled, or local evidence/);
  assert.match(readFileSync(join(root, 'rules', 'openspec-operating-contract.md'), 'utf8'), /control-plane\/DELIVERY-TRACE\.md/);
});
