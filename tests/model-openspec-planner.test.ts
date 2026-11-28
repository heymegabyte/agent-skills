import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createModelOpenSpecPlanner } from '../bin/model-openspec-planner.ts';
import type { OpenSpecCompilerInput } from '../bin/evidence-gated-orchestrator.ts';

test('assigned architect proposes independent changes before host materialization', async () => {
  const input = { checkout: '/private/checkout', changeId: 'first', assignment: { changeId: 'first' } } as OpenSpecCompilerInput;
  const change = { changeId: 'first', title: 'First', dependsOn: [], ownedPaths: ['src/first.ts'], proposal: '# Proposal', design: '# Design', spec: '# Spec', tasks: '# Tasks' };
  const changes = [change, { ...change, changeId: 'second', ownedPaths: ['src/second.ts'] }];
  let output = JSON.stringify({ changes });
  const plan = createModelOpenSpecPlanner(async (assignment, prompt) => {
    assert.equal(assignment, input.assignment);
    assert.ok(!prompt.includes(input.checkout));
    assert.ok(prompt.includes("### Requirement: <requirement>"));
    assert.ok(prompt.includes("End the line at the closing parenthesis"));
    return { launcher: 'approved:fixture', sessionId: 'fixture', output };
  });
  assert.deepEqual((await plan(input)).changes, changes);
  output = JSON.stringify({ changes: [change, change] });
  await assert.rejects(plan(input), /duplicate change/);
});
