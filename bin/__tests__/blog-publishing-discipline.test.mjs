import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateBlogCatalog } from '../blog-publishing/validate-blog-catalog.mjs';

function catalogFixture() {
  return JSON.parse(readFileSync(new URL('../../blog-publishing/references/blog-publishing-360-catalog.json', import.meta.url)));
}

test('catalog contains exact complete A01-L30 identity space', () => {
  assert.deepEqual(validateBlogCatalog(catalogFixture()), { categories: 12, recommendations: 360, unique: 360 });
});

test('catalog rejects missing and generic directives', () => {
  const catalog = catalogFixture();
  catalog.categories[0].recommendations[0].directive = 'placeholder';
  assert.throws(() => validateBlogCatalog(catalog), /missing directive|generic placeholder/);
});

test('catalog rejects duplicated directives and missing IDs', () => {
  const catalog = catalogFixture();
  catalog.categories[0].recommendations[0].directive = catalog.categories[0].recommendations[1].directive;
  assert.throws(() => validateBlogCatalog(catalog), /uniquely bound/);
  const missing = catalogFixture();
  missing.categories[0].recommendations[0].id = 'A02';
  assert.throws(() => validateBlogCatalog(missing), /360 unique IDs|missing A01/);
});

test('policy encoding does not misstate application rollout as verified', () => {
  const catalog = catalogFixture();
  for (const category of catalog.categories) for (const entry of category.recommendations) {
    assert.equal(entry.policy_state, 'implemented');
    assert.equal(entry.rollout_state, 'planned');
    assert.deepEqual(entry.evidence, []);
  }
});

test('primary-source provenance covers S01-S54 with URLs', () => {
  const provenance = readFileSync(new URL('../../blog-publishing/references/primary-sources.md', import.meta.url), 'utf8');
  const ids = [...provenance.matchAll(/\*\*(S\d{2}) —/g)].map((match) => match[1]);
  assert.equal(ids.length, 54);
  assert.equal(new Set(ids).size, 54);
  assert.equal(ids[0], 'S01');
  assert.equal(ids.at(-1), 'S54');
  assert.equal((provenance.match(/https:\/\//g) ?? []).length, 54);
});
