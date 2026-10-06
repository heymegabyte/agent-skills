#!/usr/bin/env node
/**
 * req.test.mjs — tests for the Requirement Ledger CLI (bin/req.mjs).
 *
 * Uses node:test (built-in, zero-dep). Each test runs `req.mjs` as a child
 * process inside a throwaway temp dir so the ledger is created at
 * `<tmp>/.pcc/ledger/requirements.jsonl` — never the repo. Covers:
 *   - round-trip: add → list → show → update(link) → close
 *   - stable monotonic R-IDs
 *   - coverage detects an uncovered `must` (exit 2) and passes once covered
 *   - close refuses without acceptance, and without test+golden-path
 *   - ledger file is well-formed JSONL (one parseable object per line)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'req.mjs');

/** Run the CLI in `cwd`; returns {status, stdout, stderr}. Never throws on non-zero. */
function run(cwd, args) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1' },
    });
    return { status: 0, stdout, stderr: '' };
  } catch (e) {
    return { status: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

function withTmp(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'req-test-'));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function ledgerPath(dir) {
  return join(dir, '.pcc', 'ledger', 'requirements.jsonl');
}

function readRecords(dir) {
  const raw = readFileSync(ledgerPath(dir), 'utf8');
  return raw
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l)); // throws if a line is not well-formed JSON
}

test('add creates a well-formed ledger with a stable R-001 id + full schema', () =>
  withTmp((dir) => {
    const r = run(dir, ['add', '--title', 'Users can sign in', '--priority', 'must']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /R-001/);
    assert.ok(existsSync(ledgerPath(dir)), 'ledger file created on first add');

    const recs = readRecords(dir);
    assert.equal(recs.length, 1);
    const rec = recs[0];
    assert.equal(rec.id, 'R-001');
    assert.equal(rec.title, 'Users can sign in');
    assert.equal(rec.priority, 'must');
    assert.equal(rec.status, 'open');
    // every schema field present
    for (const f of ['acceptance', 'tests', 'routes', 'golden_paths', 'decisions', 'evidence']) {
      assert.ok(Array.isArray(rec[f]), `${f} is an array`);
    }
    assert.ok(rec.provenance && 'intent' in rec.provenance && 'source' in rec.provenance);
    assert.ok(rec.created && rec.updated);
  }));

test('ids are monotonic + stable across multiple adds', () =>
  withTmp((dir) => {
    run(dir, ['add', '--title', 'First', '--priority', 'should']);
    run(dir, ['add', '--title', 'Second', '--priority', 'could']);
    run(dir, ['add', '--title', 'Third', '--priority', 'must']);
    const ids = readRecords(dir).map((r) => r.id);
    assert.deepEqual(ids, ['R-001', 'R-002', 'R-003']);
  }));

test('full round-trip: add → list → show → update(link) → close', () =>
  withTmp((dir) => {
    // add with acceptance up front
    const add = run(dir, [
      'add',
      '--title',
      'Checkout works',
      '--priority',
      'must',
      '--acceptance',
      'card charged',
    ]);
    assert.equal(add.status, 0, add.stderr);

    // list (JSON) shows it
    const list = run(dir, ['list', '--json']);
    assert.equal(list.status, 0);
    const listed = JSON.parse(list.stdout);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, 'R-001');

    // show (JSON)
    const show = run(dir, ['show', 'R-001', '--json']);
    const rec = JSON.parse(show.stdout);
    assert.equal(rec.title, 'Checkout works');

    // update: link a test + a golden-path + a route (the coverage-graph edges)
    const up = run(dir, [
      'update',
      'R-001',
      '--link-test',
      'e2e/checkout.spec.ts',
      '--link-golden-path',
      'gp-checkout',
      '--link-route',
      '/checkout',
      '--status',
      'in-progress',
    ]);
    assert.equal(up.status, 0, up.stderr);
    const afterUpdate = readRecords(dir)[0];
    assert.deepEqual(afterUpdate.tests, ['e2e/checkout.spec.ts']);
    assert.deepEqual(afterUpdate.golden_paths, ['gp-checkout']);
    assert.deepEqual(afterUpdate.routes, ['/checkout']);
    assert.equal(afterUpdate.status, 'in-progress');

    // link dedup: re-linking the same test does not duplicate
    run(dir, ['update', 'R-001', '--link-test', 'e2e/checkout.spec.ts']);
    assert.deepEqual(readRecords(dir)[0].tests, ['e2e/checkout.spec.ts']);

    // close succeeds (has acceptance + has test/golden)
    const close = run(dir, ['close', 'R-001']);
    assert.equal(close.status, 0, close.stderr);
    assert.equal(readRecords(dir)[0].status, 'closed');

    // id accepted case-insensitively / without zero-pad
    const showLoose = run(dir, ['show', 'r-1', '--json']);
    assert.equal(showLoose.status, 0);
    assert.equal(JSON.parse(showLoose.stdout).id, 'R-001');
  }));

test('coverage gate FAILS (exit 2) on an uncovered must, PASSES once covered', () =>
  withTmp((dir) => {
    run(dir, ['add', '--title', 'Critical thing', '--priority', 'must', '--acceptance', 'it works']);

    // uncovered must → exit 2, listed under must_uncovered + no_test + no_golden_path
    const bad = run(dir, ['coverage', '--json']);
    assert.equal(bad.status, 2, 'uncovered must must fail the gate');
    const badJson = JSON.parse(bad.stdout);
    assert.equal(badJson.gate, 'fail');
    assert.deepEqual(badJson.must_uncovered, ['R-001']);
    assert.deepEqual(badJson.no_test, ['R-001']);
    assert.deepEqual(badJson.no_golden_path, ['R-001']);

    // link a test → gate passes (a test satisfies coverage)
    run(dir, ['update', 'R-001', '--link-test', 'e2e/critical.spec.ts']);
    const good = run(dir, ['coverage', '--json']);
    assert.equal(good.status, 0, 'covered must passes the gate');
    const goodJson = JSON.parse(good.stdout);
    assert.equal(goodJson.gate, 'pass');
    assert.deepEqual(goodJson.must_uncovered, []);
  }));

test('coverage gate ignores must requirements once closed', () =>
  withTmp((dir) => {
    run(dir, ['add', '--title', 'Done must', '--priority', 'must', '--acceptance', 'ok']);
    run(dir, ['update', 'R-001', '--link-golden-path', 'gp-x']);
    run(dir, ['close', 'R-001']);
    const cov = run(dir, ['coverage', '--json']);
    assert.equal(cov.status, 0);
    assert.equal(JSON.parse(cov.stdout).must_uncovered.length, 0);
  }));

test('close REFUSES without acceptance (exit 1), --force overrides', () =>
  withTmp((dir) => {
    // no --acceptance; give it a test so only the acceptance guard trips
    run(dir, ['add', '--title', 'No criteria', '--priority', 'should']);
    run(dir, ['update', 'R-001', '--link-test', 'e2e/x.spec.ts']);

    const refused = run(dir, ['close', 'R-001']);
    assert.equal(refused.status, 1, 'close must refuse with zero acceptance');
    assert.match(refused.stderr, /acceptance/i);
    assert.equal(readRecords(dir)[0].status, 'open', 'record stays open after refusal');

    const forced = run(dir, ['close', 'R-001', '--force']);
    assert.equal(forced.status, 0, forced.stderr);
    assert.equal(readRecords(dir)[0].status, 'closed');
  }));

test('close REFUSES without test+golden-path even when acceptance exists', () =>
  withTmp((dir) => {
    run(dir, ['add', '--title', 'Has criteria only', '--priority', 'should', '--acceptance', 'spec']);
    const refused = run(dir, ['close', 'R-001']);
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /test.*golden|golden.*path/i);
    assert.equal(readRecords(dir)[0].status, 'open');
  }));

test('empty ledger: list is empty, coverage passes (no musts to fail)', () =>
  withTmp((dir) => {
    const list = run(dir, ['list', '--json']);
    assert.equal(list.status, 0);
    assert.deepEqual(JSON.parse(list.stdout), []);
    const cov = run(dir, ['coverage', '--json']);
    assert.equal(cov.status, 0);
    assert.equal(JSON.parse(cov.stdout).gate, 'pass');
  }));

test('unknown command and missing id fail with a clear non-zero', () =>
  withTmp((dir) => {
    assert.equal(run(dir, ['frobnicate']).status, 1);
    assert.equal(run(dir, ['show', 'R-999']).status, 1);
  }));
