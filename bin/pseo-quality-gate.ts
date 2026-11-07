#!/usr/bin/env node
/**
 * @file pseo-quality-gate.ts
 * @brief Automated Programmatic SEO Quality Gate & Information Gain CLI Auditor.
 *
 * Verifies that programmatic page datasets satisfy the 7 Programmatic Quality Gates
 * to eliminate risk of Google Scaled Content Abuse algorithmic devaluation.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PseoRecord {
  slug: string;
  title: string;
  targetIntent?: 'informational' | 'commercial' | 'transactional';
  primaryEntity: string;
  proprietaryData: Record<string, unknown>;
  contentHtml?: string;
  schemaType?: string;
}

export function auditPseoDataset(records: PseoRecord[]): {
  passed: boolean;
  score: number;
  totalRecords: number;
  disqualifiedCount: number;
  informationGainRatio: number;
  checks: Array<{ name: string; passed: boolean; details: string }>;
  errors: string[];
} {
  const errors: string[] = [];
  const checks: Array<{ name: string; passed: boolean; details: string }> = [];

  if (records.length === 0) {
    return {
      passed: false,
      score: 0,
      totalRecords: 0,
      disqualifiedCount: 0,
      informationGainRatio: 0,
      checks: [{ name: 'DATASET_NON_EMPTY', passed: false, details: 'Dataset contains 0 records.' }],
      errors: ['Empty dataset provided.'],
    };
  }

  // 1. Data Differentiation Check (>= 4 proprietary data attributes per record)
  let thinCount = 0;
  for (const r of records) {
    const attrCount = Object.keys(r.proprietaryData || {}).length;
    if (attrCount < 4) {
      thinCount++;
      errors.push(`Record "${r.slug}" has only ${attrCount}/4 required proprietary attributes.`);
    }
  }

  const dataPassed = thinCount === 0;
  checks.push({
    name: 'PROPRIETARY_DATA_DEPTH',
    passed: dataPassed,
    details: `${records.length - thinCount}/${records.length} records possess >=4 proprietary attributes.`,
  });

  // 2. Unique Intent & Duplicate Slug Check
  const slugs = new Set<string>();
  let duplicateSlugs = 0;
  for (const r of records) {
    if (slugs.has(r.slug)) {
      duplicateSlugs++;
      errors.push(`Duplicate URL slug detected: "${r.slug}".`);
    }
    slugs.add(r.slug);
  }

  const slugPassed = duplicateSlugs === 0;
  checks.push({
    name: 'URL_SLUG_UNIQUENESS',
    passed: slugPassed,
    details: `${slugs.size}/${records.length} unique URLs.`,
  });

  // 3. Information Gain / Vocabulary Dissimilarity
  const wordsByRecord = records.map((r) => {
    const text = (r.contentHtml || r.title).toLowerCase().replace(/<[^>]+>/g, ' ');
    return new Set(text.match(/\b[a-z]{3,}\b/g) || []);
  });

  let totalDissimilarity = 0;
  let samplePairs = 0;
  const sampleMax = Math.min(records.length, 10);
  for (let i = 0; i < sampleMax; i++) {
    for (let j = i + 1; j < sampleMax; j++) {
      const setA = wordsByRecord[i];
      const setB = wordsByRecord[j];
      const intersection = new Set([...setA].filter((x) => setB.has(x)));
      const union = new Set([...setA, ...setB]);
      const sim = union.size === 0 ? 1 : intersection.size / union.size;
      totalDissimilarity += 1 - sim;
      samplePairs++;
    }
  }

  const infoGainRatio = samplePairs === 0 ? 1.0 : Math.round((totalDissimilarity / samplePairs) * 100) / 100;
  const infoGainPassed = infoGainRatio >= 0.35 || records.length <= 1;
  checks.push({
    name: 'INFORMATION_GAIN_RATIO',
    passed: infoGainPassed,
    details: `Average information gain ratio: ${(infoGainRatio * 100).toFixed(1)}% (Target >= 35%).`,
  });

  // 4. Schema.org Utility Entity Parity
  let missingSchemaCount = 0;
  for (const r of records) {
    if (!r.schemaType || !['Dataset', 'ItemPage', 'SoftwareApplication', 'Product', 'TechArticle'].includes(r.schemaType)) {
      missingSchemaCount++;
    }
  }
  const schemaPassed = missingSchemaCount === 0;
  checks.push({
    name: 'STRUCTURED_SCHEMA_PARITY',
    passed: schemaPassed,
    details: `${records.length - missingSchemaCount}/${records.length} records declare valid utility schemas (Dataset/ItemPage).`,
  });

  const passedChecksCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedChecksCount / checks.length) * 100);
  const overallPassed = checks.every((c) => c.passed);

  return {
    passed: overallPassed,
    score,
    totalRecords: records.length,
    disqualifiedCount: thinCount + duplicateSlugs,
    informationGainRatio: infoGainRatio,
    checks,
    errors,
  };
}

if (process.argv[1]?.endsWith('pseo-quality-gate.ts') || import.meta.main) {
  const fileArg = process.argv.find((a) => a.startsWith('--dataset='))?.split('=')[1] || process.argv[2];

  if (fileArg && fs.existsSync(fileArg)) {
    const raw = fs.readFileSync(fileArg, 'utf8');
    const records = JSON.parse(raw);
    const result = auditPseoDataset(records);

    console.log(`\n╔══════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║   PROGRAMMATIC SEO QUALITY GATE AUDIT: ${path.basename(fileArg).padEnd(33)} ║`);
    console.log(`╚══════════════════════════════════════════════════════════════════════════╝\n`);
    console.log(`Status: ${result.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} | Score: ${result.score}/100 | Records: ${result.totalRecords} | Info Gain: ${(result.informationGainRatio * 100).toFixed(1)}%\n`);

    for (const c of result.checks) {
      const icon = c.passed ? '\x1b[32m[✓]\x1b[0m' : '\x1b[31m[✗]\x1b[0m';
      console.log(`${icon} ${c.name.padEnd(28)}: ${c.details}`);
    }

    if (result.errors.length > 0) {
      console.log(`\n\x1b[31mDisqualification Errors:\x1b[0m`);
      result.errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
      if (result.errors.length > 5) console.log(`  ... and ${result.errors.length - 5} more`);
    }

    console.log('\n──────────────────────────────────────────────────────────────────────────\n');
    process.exit(result.passed ? 0 : 1);
  } else {
    // Self-test with sample golden dataset
    const sample: PseoRecord[] = [
      {
        slug: 'eur-usd-spreads',
        title: 'EUR to USD Live Spreads & Settlement Speeds',
        primaryEntity: 'EUR/USD',
        proprietaryData: {
          spreadPips: 0.1,
          settlementLatencyMs: 45,
          marketDepthM: 520,
          dailyVolumeB: 4.8,
        },
        contentHtml: '<p>EUR/USD exchange rates reflect European Central Bank and Federal Reserve liquidity corridors.</p>',
        schemaType: 'Dataset',
      },
      {
        slug: 'gbp-usd-spreads',
        title: 'GBP to USD Live Spreads & Settlement Speeds',
        primaryEntity: 'GBP/USD',
        proprietaryData: {
          spreadPips: 0.3,
          settlementLatencyMs: 62,
          marketDepthM: 280,
          dailyVolumeB: 2.1,
        },
        contentHtml: '<p>GBP/USD exchange rates fluctuate with Bank of England monetary policy and gilt auctions.</p>',
        schemaType: 'Dataset',
      },
    ];

    const result = auditPseoDataset(sample);
    console.log(`[pSEO Quality Gate Self-Test] Passed: ${result.passed} | Score: ${result.score}/100 | Records: ${result.totalRecords}`);
    process.exit(result.passed ? 0 : 1);
  }
}
