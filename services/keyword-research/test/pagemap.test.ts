import { describe, expect, it } from 'vitest';
import {
  emptyPageMap,
  loadPageMap,
  matchExistingPage,
  savePageMap,
  upsertAssignment,
  type ExistingPage,
  type PageMapIo,
} from '../src/pagemap';

const NOW = '2026-10-14T00:00:00.000Z';

/** In-memory IO — zero disk access, fully deterministic. */
function memIo(seed: Record<string, string> = {}): PageMapIo & { files: Record<string, string> } {
  const files: Record<string, string> = { ...seed };
  return {
    files,
    async readFile(path) {
      return Object.prototype.hasOwnProperty.call(files, path) ? files[path]! : null;
    },
    async writeFile(path, data) {
      files[path] = data;
    },
  };
}

describe('pagemap — persistence round-trip', () => {
  it('a missing file loads as an empty map (no throw, no warning)', async () => {
    const io = memIo();
    const { map, warning } = await loadPageMap(io, '/nope.json');
    expect(map).toEqual(emptyPageMap());
    expect(warning).toBeNull();
  });

  it('saves then loads back an identical map', async () => {
    const io = memIo();
    let map = emptyPageMap();
    map = upsertAssignment(map, { keyword: 'crm pricing', url: '/pricing', intent: 'transactional', updated_at: NOW });
    map = upsertAssignment(map, { keyword: 'what is a crm', url: '/blog/crm', intent: 'informational', updated_at: NOW });
    await savePageMap(io, '/map.json', map);

    const { map: reloaded, warning } = await loadPageMap(io, '/map.json');
    expect(warning).toBeNull();
    expect(reloaded.entries['crm pricing']?.url).toBe('/pricing');
    expect(reloaded.entries['what is a crm']?.url).toBe('/blog/crm');
  });

  it('writes entries in sorted key order (stable diffs)', async () => {
    const io = memIo();
    let map = emptyPageMap();
    map = upsertAssignment(map, { keyword: 'zzz', url: '/z', intent: 'commercial', updated_at: NOW });
    map = upsertAssignment(map, { keyword: 'aaa', url: '/a', intent: 'commercial', updated_at: NOW });
    await savePageMap(io, '/map.json', map);
    const written = io.files['/map.json']!;
    expect(written.indexOf('"aaa"')).toBeLessThan(written.indexOf('"zzz"'));
  });

  it('a corrupt file loads as empty + returns a warning (fail-soft)', async () => {
    const io = memIo({ '/map.json': '{ this is not json' });
    const { map, warning } = await loadPageMap(io, '/map.json');
    expect(map).toEqual(emptyPageMap());
    expect(warning).toMatch(/unreadable/i);
  });

  it('upsertAssignment is pure (does not mutate the input)', () => {
    const base = emptyPageMap();
    const next = upsertAssignment(base, { keyword: 'k', url: '/k', intent: 'commercial', updated_at: NOW });
    expect(base.entries).toEqual({});
    expect(next.entries['k']?.url).toBe('/k');
  });
});

describe('matchExistingPage — improve vs create', () => {
  const inventory: ExistingPage[] = [
    { url: '/pricing', targetKeywords: ['crm pricing', 'crm cost'], intent: 'transactional' },
    { url: '/blog/what-is-crm', targetKeywords: ['what is a crm'], intent: 'informational' },
  ];

  it('improve_existing when a page serves the same stem + intent', () => {
    const r = matchExistingPage({ keyword: 'crm pricing', search_intent: 'transactional' }, inventory);
    expect(r.existing_matching_page).toBe('/pricing');
    expect(r.recommended_action).toBe('improve_existing');
    expect(r.cannibalization).toBe(false);
  });

  it('create_new when nothing targets the keyword', () => {
    const r = matchExistingPage({ keyword: 'crm integrations', search_intent: 'commercial' }, inventory);
    expect(r.existing_matching_page).toBeNull();
    expect(r.recommended_action).toBe('create_new');
    expect(r.rationale).toMatch(/content gap/i);
  });

  it('does NOT match on a loose substring (stem-based, not substring)', () => {
    // "criminal records" must not match a page targeting "crm".
    const r = matchExistingPage({ keyword: 'criminal records', search_intent: 'informational' }, inventory);
    expect(r.existing_matching_page).toBeNull();
    expect(r.recommended_action).toBe('create_new');
  });

  it('flags a weaker match when the stem matches but the intent differs', () => {
    // A transactional-intent page exists for the stem, but this query is informational.
    const r = matchExistingPage({ keyword: 'crm pricing', search_intent: 'informational' }, inventory);
    // Falls back to the stem page but notes the intent mismatch.
    expect(r.existing_matching_page).toBe('/pricing');
    expect(r.rationale).toMatch(/different intent/i);
    expect(r.cannibalization).toBe(false);
  });
});

describe('matchExistingPage — cannibalization safeguard (evidence-based)', () => {
  it('fires ONLY when 2+ pages serve the same stem AND same intent', () => {
    const cannibalizedInventory: ExistingPage[] = [
      { url: '/pricing', targetKeywords: ['crm pricing'], intent: 'transactional' },
      { url: '/plans', targetKeywords: ['crm pricing plans'], intent: 'transactional' }, // same stem? check below
      { url: '/buy-crm', targetKeywords: ['crm pricing'], intent: 'transactional' },
    ];
    const r = matchExistingPage(
      { keyword: 'crm pricing', search_intent: 'transactional' },
      cannibalizedInventory,
    );
    expect(r.cannibalization).toBe(true);
    // Evidence: the competing URLs are attached.
    expect(r.cannibalizing_urls.length).toBeGreaterThanOrEqual(2);
    expect(r.cannibalizing_urls).toContain('/pricing');
    expect(r.cannibalizing_urls).toContain('/buy-crm');
    expect(r.rationale).toMatch(/consolidate/i);
  });

  it('does NOT flag cannibalization when two pages share the stem but DIFFER in intent', () => {
    // One transactional, one informational page for the same stem = healthy
    // intent separation, NOT cannibalization.
    const healthyInventory: ExistingPage[] = [
      { url: '/pricing', targetKeywords: ['crm pricing'], intent: 'transactional' },
      { url: '/blog/crm-pricing-explained', targetKeywords: ['crm pricing'], intent: 'informational' },
    ];
    const r = matchExistingPage(
      { keyword: 'crm pricing', search_intent: 'transactional' },
      healthyInventory,
    );
    expect(r.cannibalization).toBe(false);
    expect(r.cannibalizing_urls).toEqual([]);
    // It still matches the correctly-intented page.
    expect(r.existing_matching_page).toBe('/pricing');
  });

  it('does NOT flag cannibalization for a single matching page', () => {
    const r = matchExistingPage(
      { keyword: 'crm pricing', search_intent: 'transactional' },
      [{ url: '/pricing', targetKeywords: ['crm pricing'], intent: 'transactional' }],
    );
    expect(r.cannibalization).toBe(false);
  });
});
