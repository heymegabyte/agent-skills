import { strict as assert } from 'node:assert';
import test from 'node:test';
import { createModelOpenSpecPlanner } from '../bin/model-openspec-planner.ts';
import type { OpenSpecCompilerInput } from '../bin/evidence-gated-orchestrator.ts';

test('assigned architect proposes independent changes before host materialization', async () => {
  const input = { checkout: '/private/checkout', changeId: 'first', assignment: { changeId: 'first' } } as OpenSpecCompilerInput;
  const change = {
    changeId: 'first', title: 'First', dependsOn: [], ownedPaths: ['src/first.ts'],
    proposal: '# Proposal\n## Why\nProvide predictable results.\n## What Changes\nImplement the fixture behavior.',
    design: '**Architect Role:** assigned\n## Context\nThe fixture needs a bounded change.\n## Goals / Non-Goals\nVerify observable behavior.\n## Decisions\nKeep implementation and tests together.',
    spec: '### Requirement: Normalize input\n#### Scenario: Padded input\nReturn trimmed text.',
    tasks: '- [ ] [first] Normalize input (requirements: Normalize input; scenarios: Padded input)',
  };
  const changes = [change, { ...change, changeId: 'second', ownedPaths: ['src/second.ts'], tasks: change.tasks.replace('[first]', '[second]') }];
  let output = JSON.stringify({ changes: changes.map((draft) => ({ ...draft, provider: 'unapproved', acceptance: ['unapproved'] })) });
  const plan = createModelOpenSpecPlanner(async (assignment, prompt) => {
    assert.equal(assignment, input.assignment);
    assert.ok(!prompt.includes(input.checkout));
    assert.ok(prompt.includes("### Requirement: <requirement>"));
    assert.ok(prompt.includes("End the line at the closing parenthesis"));
    return { launcher: 'approved:fixture', sessionId: 'fixture', output };
  });
  assert.deepEqual((await plan(input)).changes, changes.map((draft) => ({
    ...draft, requirements: ['Normalize input'], scenarios: ['Padded input'], traceabilityIds: [draft.changeId],
  })));
  const improvement = { id: 'follow-up', title: 'Verify cleanup', tasks: [{ id: 'check-cleanup' }] };
  await assert.rejects(plan({
    ...input, admittedImprovements: [improvement] as OpenSpecCompilerInput['admittedImprovements'],
  }), /Admitted improvement follow-up is missing/);
  output = JSON.stringify({ changes: [{ ...change, tasks: change.tasks + '.' }] });
  await assert.rejects(plan(input), /no semantic traceability mappings/);
  output = JSON.stringify({ changes: [change, change] });
  await assert.rejects(plan(input), /duplicate change/);
  output = JSON.stringify({ changes: [{ ...changes[0], dependsOn: ['second'] }, { ...changes[1], dependsOn: ['first'] }] });
  await assert.rejects(plan(input), /Cycle detected/);
  output = JSON.stringify({ changes: [change, { ...changes[1], ownedPaths: ['src'] }] });
  await assert.rejects(plan(input), /Parallel ownership collision/);
  output = JSON.stringify({ changes: [{ ...change, ownedPaths: ['../outside.ts'] }] });
  await assert.rejects(plan(input), /unsafe owned path/);
});
