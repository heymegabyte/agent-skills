import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { auditPseoDataset, type PseoRecord } from '../bin/pseo-quality-gate.ts';
import {
  validateLocaleCode,
  extractHreflangTagsFromHtml,
  auditPageHreflang,
  verifyReciprocalNetwork,
  type HreflangEntry,
} from '../bin/hreflang-auditor.ts';

describe('Programmatic SEO Quality Gate CLI', () => {
  it('validates a compliant pSEO dataset with >=4 attributes and diverse vocabulary', () => {
    const dataset: PseoRecord[] = [
      {
        slug: 'aws-to-cloudflare-migration',
        title: 'Migrate from AWS S3 to Cloudflare R2 with Zero Egress Fees',
        primaryEntity: 'AWS S3 vs Cloudflare R2',
        proprietaryData: {
          egressCostPerTb: 0,
          readLatencyP95Ms: 14,
          writeLatencyP95Ms: 22,
          s3CompatibilityScore: 0.99,
        },
        contentHtml: '<p>Zero egress pricing makes Cloudflare R2 ideal for read-heavy object workflows.</p>',
        schemaType: 'Dataset',
      },
      {
        slug: 'gcp-to-cloudflare-migration',
        title: 'Migrate from Google Cloud Storage to Cloudflare R2',
        primaryEntity: 'Google Cloud Storage vs Cloudflare R2',
        proprietaryData: {
          egressCostPerTb: 0,
          readLatencyP95Ms: 18,
          writeLatencyP95Ms: 25,
          s3CompatibilityScore: 0.98,
        },
        contentHtml: '<p>Direct Google Cloud inter-region interconnects reduce data transfer overhead.</p>',
        schemaType: 'Dataset',
      },
    ];

    const result = auditPseoDataset(dataset);
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.score, 100);
    assert.strictEqual(result.disqualifiedCount, 0);
    assert.ok(result.informationGainRatio >= 0.35);
  });

  it('rejects thin programmatic records with <4 proprietary attributes', () => {
    const thinDataset: PseoRecord[] = [
      {
        slug: 'thin-page',
        title: 'Thin Programmatic Page',
        primaryEntity: 'Thin Entity',
        proprietaryData: {
          onlyOneAttribute: 42,
        },
      },
    ];

    const result = auditPseoDataset(thinDataset);
    assert.strictEqual(result.passed, false);
    assert.strictEqual(result.disqualifiedCount, 1);
    assert.ok(result.errors.some((e) => e.includes('only 1/4 required proprietary attributes')));
  });

  it('rejects duplicate URL slugs across programmatic records', () => {
    const dupeDataset: PseoRecord[] = [
      {
        slug: 'same-slug',
        title: 'Version A',
        primaryEntity: 'Entity A',
        proprietaryData: { a: 1, b: 2, c: 3, d: 4 },
      },
      {
        slug: 'same-slug',
        title: 'Version B',
        primaryEntity: 'Entity B',
        proprietaryData: { a: 1, b: 2, c: 3, d: 4 },
      },
    ];

    const result = auditPseoDataset(dupeDataset);
    assert.strictEqual(result.passed, false);
    assert.ok(result.errors.some((e) => e.includes('Duplicate URL slug detected')));
  });
});

describe('Multilingual Hreflang Canonical Auditor CLI', () => {
  it('validates ISO-639-1 language codes and regional ISO-3166-1 extensions', () => {
    assert.strictEqual(validateLocaleCode('en'), true);
    assert.strictEqual(validateLocaleCode('en-US'), true);
    assert.strictEqual(validateLocaleCode('es-MX'), true);
    assert.strictEqual(validateLocaleCode('ja'), true);
    assert.strictEqual(validateLocaleCode('x-default'), true);

    // Invalid codes
    assert.strictEqual(validateLocaleCode('klingon'), false);
    assert.strictEqual(validateLocaleCode('en-12345'), false);
    assert.strictEqual(validateLocaleCode('not-a-code'), false);
  });

  it('extracts alternate hreflang links from HTML markup', () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="alternate" hreflang="en" href="https://example.com/en" />
        <link rel="alternate" hreflang="es" href="https://example.com/es" />
        <link rel="alternate" hreflang="x-default" href="https://example.com/en" />
      </head>
      <body></body>
      </html>
    `;

    const tags = extractHreflangTagsFromHtml(html);
    assert.strictEqual(tags.length, 3);
    assert.strictEqual(tags[0].lang, 'en');
    assert.strictEqual(tags[0].url, 'https://example.com/en');
    assert.strictEqual(tags[2].lang, 'x-default');
  });

  it('audits page hreflang tags for self-reference, x-default, and valid codes', () => {
    const tags: HreflangEntry[] = [
      { lang: 'en', url: 'https://example.com/en' },
      { lang: 'fr', url: 'https://example.com/fr' },
      { lang: 'x-default', url: 'https://example.com/en' },
    ];

    const audit = auditPageHreflang('https://example.com/en', tags);
    assert.strictEqual(audit.hasSelfRef, true);
    assert.strictEqual(audit.hasXDefault, true);
    assert.strictEqual(audit.errors.length, 0);
  });

  it('detects broken reciprocal relationships in a multi-locale network', () => {
    const pages = [
      {
        url: 'https://example.com/en',
        tags: [
          { lang: 'en', url: 'https://example.com/en' },
          { lang: 'es', url: 'https://example.com/es' },
        ],
      },
      {
        url: 'https://example.com/es',
        // Broken: Spanish page does NOT link back to English
        tags: [
          { lang: 'es', url: 'https://example.com/es' },
        ],
      },
    ];

    const result = verifyReciprocalNetwork(pages);
    assert.strictEqual(result.reciprocal, false);
    assert.strictEqual(result.missingReciprocalLinks.length, 1);
    assert.strictEqual(result.missingReciprocalLinks[0].source, 'https://example.com/en');
    assert.strictEqual(result.missingReciprocalLinks[0].target, 'https://example.com/es');
  });
});
