import assert from 'node:assert/strict';
import test from 'node:test';
import { analyticsDoctorProbes, boundedDriftProbe, existingDoctorProbes, fixtureProbes, runEstateDoctor } from '../bin/control-plane-doctor.ts';

const now = '2026-11-22T10:00:00Z';
test('all composable probe fixtures produce deterministic PASS snapshot', async () => {
  const first = await runEstateDoctor(fixtureProbes(now), now);
  const second = await runEstateDoctor(fixtureProbes(now), now);
  assert.equal(first.status, 'PASS');
  assert.equal(first.integrityDigest, second.integrityDigest);
  assert.equal(first.results.length, 9);
});

test('freshness and unavailable probes never become PASS', async () => {
  const report = await runEstateDoctor({ stale: () => ({ id: 'stale', status: 'PASS', observedAt: '2026-11-22T09:00:00Z', summary: 'was healthy' }), missing: () => { throw new Error('offline'); } }, now, 1000);
  assert.equal(report.status, 'UNVERIFIED');
  assert.deepEqual(report.results.map((r) => r.status), ['UNVERIFIED', 'UNVERIFIED']);
});

test('findings deduplicate and retain sanitized evidence', async () => {
  const report = await runEstateDoctor({ a: () => ({ id: 'a', status: 'FAIL', observedAt: now, summary: 'plugin doctor failed', evidenceRef: 'exit:1', findingKey: 'plugin:x' }), b: () => ({ id: 'b', status: 'FAIL', observedAt: now, summary: 'same', findingKey: 'plugin:x' }) }, now);
  assert.equal(report.results.length, 1);
  assert.equal(report.results[0]!.evidenceRef, 'exit:1');
  assert.equal(report.correctiveIssuePlan.length, 1);
});

test('existing focused doctors are composed without command rewriting', () => {
  assert.deepEqual(Object.keys(existingDoctorProbes(now)).sort(), ['bounded-instruction-drift', 'plugin-doctor', 'portfolio-health', 'skills-doctor']);
});

test('analytics destinations compose into doctor and absent credentials remain UNVERIFIED', async () => {
  const report = await runEstateDoctor(analyticsDoctorProbes(now, {}), now);
  assert.equal(report.status, 'UNVERIFIED');
  assert.equal(report.results.length, 5);
  assert.equal(JSON.stringify(report).includes('changeme'), false);
});

test('bounded drift probe preserves UNVERIFIED installed state without claiming PASS', async () => {
  const report = await runEstateDoctor({ drift: boundedDriftProbe(now) }, now);
  assert.equal(report.status, 'UNVERIFIED');
  assert.equal(report.results[0].evidenceRef, 'drift:unverified');
});
