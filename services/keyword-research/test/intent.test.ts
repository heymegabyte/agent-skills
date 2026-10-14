import { describe, expect, it } from 'vitest';
import { classifyIntent } from '../src/intent';
import { SearchIntent } from '../src/types';

/** Every result must be schema-valid + confidence in [0,1]. */
function assertShape(r: ReturnType<typeof classifyIntent>) {
  expect(SearchIntent.safeParse(r.intent).success).toBe(true);
  expect(r.confidence).toBeGreaterThanOrEqual(0);
  expect(r.confidence).toBeLessThanOrEqual(1);
}

describe('classifyIntent — transactional', () => {
  it.each([
    'buy crm software',
    'crm pricing',
    'cheap project management tool',
    'asana coupon code',
    'notion cost per user',
    'best deal on figma',
  ])('classifies %j as transactional', (kw) => {
    const r = classifyIntent(kw);
    // "best deal" trips both comparison + transactional → mixed is acceptable,
    // but a pure price/buy cue must be transactional.
    if (kw === 'best deal on figma') {
      expect(r.intent).toBe('mixed');
    } else {
      expect(r.intent).toBe('transactional');
    }
    assertShape(r);
  });
});

describe('classifyIntent — comparison', () => {
  it.each([
    'best crm for agencies',
    'top project management tools',
    'asana vs monday',
    'notion versus obsidian',
    'figma alternative',
    'hubspot review',
    'crm comparison',
  ])('classifies %j as comparison', (kw) => {
    const r = classifyIntent(kw);
    expect(r.intent).toBe('comparison');
    assertShape(r);
  });
});

describe('classifyIntent — informational', () => {
  it.each([
    'how to migrate a crm',
    'what is a sales pipeline',
    'why use a crm',
    'crm setup guide',
    'kanban tutorial',
    'okr examples',
  ])('classifies %j as informational', (kw) => {
    const r = classifyIntent(kw);
    expect(r.intent).toBe('informational');
    assertShape(r);
  });
});

describe('classifyIntent — local', () => {
  it.each([
    'crm consultant near me',
    'seo agency austin tx',
    'web designer 90210',
  ])('classifies %j as local', (kw) => {
    const r = classifyIntent(kw);
    expect(r.intent).toBe('local');
    assertShape(r);
  });
});

describe('classifyIntent — navigational', () => {
  it.each(['stripe login', 'hubspot dashboard', 'projectsites.dev', 'salesforce account'])(
    'classifies %j as navigational',
    (kw) => {
      const r = classifyIntent(kw);
      expect(r.intent).toBe('navigational');
      assertShape(r);
    },
  );
});

describe('classifyIntent — commercial fallback', () => {
  it.each([
    'crm software',
    'marketing automation platform',
    'invoicing api',
    'help desk service',
  ])('classifies %j as commercial (software/tool/service/platform/api modifier)', (kw) => {
    const r = classifyIntent(kw);
    expect(r.intent).toBe('commercial');
    // Fallback → lower confidence than a direct strong cue.
    expect(r.confidence).toBeLessThan(0.8);
    assertShape(r);
  });
});

describe('classifyIntent — mixed on conflicting strong signals', () => {
  it('buy vs rent → mixed (transactional + comparison both fire)', () => {
    const r = classifyIntent('buy vs rent crm');
    expect(r.intent).toBe('mixed');
    assertShape(r);
  });

  it('best price → mixed (comparison + transactional)', () => {
    const r = classifyIntent('best price crm');
    expect(r.intent).toBe('mixed');
    assertShape(r);
  });
});

describe('classifyIntent — ultimate fallback + edge cases', () => {
  it('a bare noun phrase with no cue → informational (low confidence)', () => {
    const r = classifyIntent('customer relationship records');
    expect(r.intent).toBe('informational');
    expect(r.confidence).toBeLessThanOrEqual(0.4);
    assertShape(r);
  });

  it('empty string → informational, low confidence, no throw', () => {
    const r = classifyIntent('');
    expect(r.intent).toBe('informational');
    expect(r.confidence).toBeLessThanOrEqual(0.4);
    assertShape(r);
  });

  it('is PURE + deterministic (same input twice ⇒ identical output)', () => {
    const a = classifyIntent('best crm for agencies');
    const b = classifyIntent('best crm for agencies');
    expect(a).toEqual(b);
  });

  it('does not false-match substrings (e.g. "buyer" ≠ "buy")', () => {
    // "firstbuyer" should NOT trip the word-boundary "buy" matcher.
    const r = classifyIntent('firstbuyer personas');
    expect(r.intent).not.toBe('transactional');
    assertShape(r);
  });
});
