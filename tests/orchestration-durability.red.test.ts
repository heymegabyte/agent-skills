import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import * as runState from '../bin/orchestration-run-state.ts';
import * as improvement from '../bin/recursive-improvement.ts';

interface Scenario {
  id: string;
  operation: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}

const fixture = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'orchestration', 'operational-contract', 'durability-scenarios.json'), 'utf8')) as {
  schemaVersion: number;
  scenarios: Scenario[];
};

const byId = (id: string) => {
  const scenario = fixture.scenarios.find((candidate) => candidate.id === id);
  assert.ok(scenario, `missing controlled scenario ${id}`);
  return scenario;
};

test('duplicate dispatch returns the existing execution instead of launching twice', async () => {
  const scenario = byId('duplicate-dispatch');
  const operation = (runState as Record<string, unknown>)[scenario.operation];
  assert.equal(typeof operation, 'function', 'missing stable idempotent dispatch operation');
  const dispatch = operation as (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  const first = await dispatch(scenario.input);
  const second = await dispatch(scenario.input);
  assert.deepEqual({ launchCount: Number(first.launched === true) + Number(second.launched === true), secondDisposition: second.disposition }, scenario.expected);
});

test('competing integration writers produce one lease holder and a recoverable waiter', async () => {
  const scenario = byId('competing-integration-writers');
  const operation = (runState as Record<string, unknown>)[scenario.operation];
  assert.equal(typeof operation, 'function', 'missing renewable per-repository integration-writer lease operation');
  const claim = operation as (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  const result = await claim(scenario.input);
  assert.deepEqual({ granted: result.granted, waiting: result.waiting, collisionReceipt: Boolean(result.collisionReceipt) }, scenario.expected);
});

test('interruption resumes only unfinished ready work and reuses completed receipts', async () => {
  const scenario = byId('interruption-resume');
  const operation = (runState as Record<string, unknown>)[scenario.operation];
  assert.equal(typeof operation, 'function', 'missing digest-validated exact-resume operation');
  const resume = operation as (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  assert.deepEqual(await resume(scenario.input), scenario.expected);
});

test('an equivalent maintenance trigger is suppressed without blocking unrelated work', async () => {
  const scenario = byId('maintenance-recursion');
  const operation = (runState as Record<string, unknown>)[scenario.operation];
  assert.equal(typeof operation, 'function', 'missing maintenance trigger identity and recursion admission operation');
  const admit = operation as (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  assert.deepEqual(await admit(scenario.input), scenario.expected);
});

test('an unpublished shared package preserves the exact resumable release edge', async () => {
  const scenario = byId('blocked-release');
  const operation = (runState as Record<string, unknown>)[scenario.operation];
  assert.equal(typeof operation, 'function', 'missing typed external delivery-edge operation');
  const record = operation as (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  assert.deepEqual(await record(scenario.input), scenario.expected);
});

test('Git delivery remains incomplete when tested, local, and remote commits differ', async () => {
  const scenario = byId('exact-git-traceability');
  const operation = (runState as Record<string, unknown>)[scenario.operation];
  assert.equal(typeof operation, 'function', 'missing exact Git integration trace operation');
  const record = operation as (input: Record<string, unknown>) => Promise<Record<string, unknown>> | Record<string, unknown>;
  assert.deepEqual(await record(scenario.input), scenario.expected);
});

test('improvement convergence requires two refreshed no-winner rounds', () => {
  const scenario = byId('two-refreshed-no-winner-rounds');
  let refreshes = 0;
  const result = improvement.runBoundedImprovementRounds([], () => {
    refreshes += 1;
    return [];
  }, { confidenceFloor: 0.7, valueFloor: 0.6, maxCost: 1, maxWip: 1 }, 4);
  assert.deepEqual({ rounds: result.rounds, terminated: result.terminated, reason: result.reason }, scenario.expected);
  assert.equal(refreshes, 1, 'evidence must be refreshed between the two empty rounds');
});
