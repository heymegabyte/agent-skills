import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectTests } from '../testing/testing-select.mjs';
import { reconcileGate } from '../testing/testing-gate.mjs';
import { validateCatalog } from '../testing/validate-testing-catalog.mjs';

test('catalog has exactly 15 families and 450 unique complete IDs', () => {
  const catalog = JSON.parse(readFileSync(new URL('../../07-quality-and-verification/references/testing-catalog.json', import.meta.url)));
  assert.deepEqual(validateCatalog(catalog), { families: 15, recommendations: 450, unique: 450 });
});

test('catalog rejects missing and generic recommendation content', () => {
  const catalog = JSON.parse(readFileSync(new URL('../../07-quality-and-verification/references/testing-catalog.json', import.meta.url)));
  catalog.families[0].recommendations[0].directive = 'Apply catalog obligation F01.01';
  assert.throws(() => validateCatalog(catalog), /generic placeholder/);
  catalog.families[0].recommendations[0].directive = '';
  assert.throws(() => validateCatalog(catalog), /missing title or directive/);
});

test('catalog rejects accidental duplicate titles or directives', () => {
  const catalog = JSON.parse(readFileSync(new URL('../../07-quality-and-verification/references/testing-catalog.json', import.meta.url)));
  catalog.families[0].recommendations[0].title = catalog.families[0].recommendations[1].title;
  assert.throws(() => validateCatalog(catalog), /uniquely bound/);
  catalog.families[0].recommendations[0].title = 'Independent examples';
  catalog.families[0].recommendations[0].directive = catalog.families[0].recommendations[1].directive;
  assert.throws(() => validateCatalog(catalog), /uniquely bound/);
});

test('missing baseline widens selection rather than passing empty', () => {
  const result = selectTests({ baseline: null, head: 'abc1234', application: 'pilot', artifact: 'build-1', graph_version: 'nx-24', changed_inputs: [], mappings: {}, mandatory: ['critical-smoke'], fallback_suite: ['auth', 'tenant'] });
  assert.deepEqual(result.selected, ['auth', 'critical-smoke', 'tenant']);
  assert.ok(result.fallbacks.includes('full-relevant-suite'));
});

test('isolated mapped change excludes unrelated live spec', () => {
  const result = selectTests({ baseline: 'base', head: 'head', application: 'pilot', artifact: 'build', graph_version: 'nx-24', changed_inputs: ['feature-a.ts'], mappings: { 'feature-a.ts': ['feature-a.spec'] }, mandatory: ['critical-smoke'], fallback_suite: ['unrelated-live.spec'] });
  assert.deepEqual(result.selected, ['critical-smoke', 'feature-a.spec']);
});

test('gate blocks missing, skipped, cancelled, and incomplete results', () => {
  const selection = { head: 'head', artifact: 'build', digest: 'digest', selected: ['a', 'b'] };
  assert.equal(reconcileGate(selection, [{ test_id: 'a', state: 'fresh_pass' }]).verdict, 'block');
  assert.equal(reconcileGate(selection, [{ test_id: 'a', state: 'fresh_pass' }, { test_id: 'b', state: 'blocked' }]).verdict, 'block');
});

test('gate passes only complete fresh or provenance-valid cached evidence', () => {
  const selection = { head: 'head', artifact: 'build', digest: 'digest', selected: ['a', 'b'] };
  const result = reconcileGate(selection, [{ test_id: 'a', state: 'fresh_pass' }, { test_id: 'b', state: 'valid_cache' }]);
  assert.equal(result.verdict, 'pass');
});
