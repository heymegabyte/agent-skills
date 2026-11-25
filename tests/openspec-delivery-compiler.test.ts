import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { compileHydratedDeliveryScope, queryDeliveryTrace, reconcileDeliveryTrace, writeCompiledDeliveryBundle, type HydratedDeliveryScope } from '../bin/openspec-delivery-compiler.ts';
import { validateDeliveryTraceInstance } from '../bin/validate-delivery-trace.ts';

const schema = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', 'delivery-trace.schema.json'), 'utf8'));
const scope: HydratedDeliveryScope = {
  changeId: 'compiled-delivery',
  title: 'Compile traceable delivery',
  summary: 'Turn hydrated outcome requirements into distinct OpenSpec artifacts and an evidence ledger.',
  sourceRevision: '1111111111111111111111111111111111111111',
  architectIdentity: 'codex-architect',
  evidenceIds: ['EVIDENCE:hydration-001'],
  requirements: [
    {
      id: 'REQ-001',
      title: 'Traceable delivery',
      observableBehavior: 'Operators can query every task from requirement through remote and delivery evidence.',
      decisions: ['Keep proposed and implemented state distinct.', 'Do not treat task checkboxes as delivery evidence.'],
      scenarios: [{ id: 'SCN-001', title: 'Evidence closes the trace', when: 'All required delivery evidence is observed', then: 'The requirement becomes complete' }],
      tasks: [{
        id: 'TASK-001', title: 'Implement the trace compiler', owner: 'OpenSpec compiler engineer', dependencies: [],
        affectedPaths: ['bin/openspec-delivery-compiler.ts'], packages: ['repository-local'], scenarioIds: ['SCN-001'],
        acceptanceCriteria: ['Distinct proposal, design, specification, and task artifacts are emitted', 'The ledger remains incomplete until integrated remote evidence exists'],
        expectedEvidence: [
          { kind: 'verification', strength: 'local', description: 'Compiler and reconciliation tests pass' },
          { kind: 'remote', strength: 'remote', description: 'The tested commit is observed on remote main' },
        ],
        releaseRequired: false, productionRequired: false,
      }],
    },
  ],
};

test('hydrated scope compiles into distinct OpenSpec artifacts and a valid proposed ledger', () => {
  const bundle = compileHydratedDeliveryScope(scope, schema);
  assert.deepEqual(bundle.artifacts.map((artifact) => artifact.kind), ['proposal', 'design', 'spec', 'tasks']);
  assert.equal(new Set(bundle.artifacts.map((artifact) => artifact.content)).size, 4);
  assert.match(bundle.artifacts.find((artifact) => artifact.kind === 'proposal')!.content, /Architect Role:\*\* assigned \(codex-architect\)/);
  assert.match(bundle.artifacts.find((artifact) => artifact.kind === 'spec')!.content, /Requirement: REQ-001/);
  assert.match(bundle.artifacts.find((artifact) => artifact.kind === 'tasks')!.content, /\[ \] \[TASK-001\].*requirements: REQ-001; scenarios: SCN-001/);
  assert.match(bundle.artifacts.find((artifact) => artifact.kind === 'tasks')!.content, /Concurrent documentation: update/);
  assert.match(bundle.artifacts.find((artifact) => artifact.kind === 'tasks')!.content, /Concurrent learning: route through/);
  assert.deepEqual(validateDeliveryTraceInstance(schema, bundle.ledger), []);
  assert.equal(bundle.ledger.records[0].implementation.state, 'proposed');
  assert.equal(bundle.ledger.records[0].verification.status, 'unverified');
  assert.equal(bundle.ledger.records[0].integration.status, 'pending');
});

test('compiled bundle writes separate files and the trace is queryable by requirement or task', () => {
  const bundle = compileHydratedDeliveryScope(scope, schema);
  const output = mkdtempSync(join(tmpdir(), 'openspec-delivery-'));
  writeCompiledDeliveryBundle(output, bundle);
  for (const path of ['proposal.md', 'design.md', 'specs/compiled-delivery/spec.md', 'tasks.md', 'delivery-trace.json']) assert.ok(readFileSync(join(output, path), 'utf8').length > 0, path);
  assert.equal(queryDeliveryTrace(bundle.ledger, { requirementId: 'REQ-001' }).length, 1);
  assert.equal(queryDeliveryTrace(bundle.ledger, { taskId: 'TASK-001' }).length, 1);
  assert.equal(queryDeliveryTrace(bundle.ledger, { taskId: 'TASK-999' }).length, 0);
});

test('a checked task cannot close without code, verification, and integrated remote commit evidence', () => {
  const bundle = compileHydratedDeliveryScope(scope, schema);
  const result = reconcileDeliveryTrace(bundle.ledger, [{ taskId: 'TASK-001', checkboxComplete: true }], schema);
  assert.equal(result.valid, true);
  assert.equal(result.complete, false);
  assert.equal(result.completion[0].checkboxComplete, true);
  assert.deepEqual(result.completion[0].missingEdges, ['code', 'verification', 'integrated-remote-commit']);
});

test('reconciliation closes only when code, verification, tested commit, and remote main agree', () => {
  const bundle = compileHydratedDeliveryScope(scope, schema);
  const commit = '2222222222222222222222222222222222222222';
  const evidence = [{
    taskId: 'TASK-001', checkboxComplete: true, codePaths: ['bin/openspec-delivery-compiler.ts'],
    verification: { status: 'pass', receipts: [{ id: 'VERIFY:TASK-001', command: 'node --test tests/openspec-delivery-compiler.test.ts', status: 'pass', evidenceDigest: `sha256:${'a'.repeat(64)}`, observedAt: '2026-11-25T00:00:00.000Z' }] },
    integration: { status: 'integrated', integratedCommit: commit, testedTree: commit, remote: { status: 'observed-main', repository: 'heymegabyte/agent-skills', branch: 'main', observedSha: commit, observedAt: '2026-11-25T00:05:00.000Z', ciStatus: 'pass' } },
  }];
  const result = reconcileDeliveryTrace(bundle.ledger, evidence, schema);
  assert.equal(result.valid, true);
  assert.equal(result.complete, true);
  assert.equal(result.ledger.records[0].implementation.state, 'implemented');
  assert.deepEqual(result.completion[0].missingEdges, []);

  const mismatch = structuredClone(evidence);
  mismatch[0].integration.remote.observedSha = '3333333333333333333333333333333333333333';
  const rejected = reconcileDeliveryTrace(bundle.ledger, mismatch, schema);
  assert.equal(rejected.valid, false);
  assert.equal(rejected.complete, false);
  assert.ok(rejected.errors.some((error) => error.includes('remote main')));
});

test('compilation rejects unresolved dependencies and scenario references before emitting artifacts', () => {
  const badDependency = structuredClone(scope); badDependency.requirements[0].tasks[0].dependencies = ['TASK-999'];
  assert.throws(() => compileHydratedDeliveryScope(badDependency, schema), /unknown dependency/);
  const badScenario = structuredClone(scope); badScenario.requirements[0].tasks[0].scenarioIds = ['SCN-999'];
  assert.throws(() => compileHydratedDeliveryScope(badScenario, schema), /scenario traceability/);
  const uncovered = structuredClone(scope); uncovered.requirements[0].scenarios.push({ id: 'SCN-002', title: 'Uncovered', when: 'Another state occurs', then: 'It must be traced' });
  assert.throws(() => compileHydratedDeliveryScope(uncovered, schema), /not traced to a task/);
});
