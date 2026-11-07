#!/usr/bin/env node
/**
 * bundle-diff.ts
 * JavaScript Bundle Size & Differential Budget Analyzer.
 * Measures build asset sizes and enforces <150KB initial client bundle budgets.
 */

export interface BundleAsset {
  name: string;
  sizeBytes: number;
}

export interface BundleBudgetReport {
  passed: boolean;
  totalSizeBytes: number;
  totalSizeKb: number;
  budgetKb: number;
  assets: { name: string; sizeKb: number }[];
  error?: string;
}

export function auditBundleBudget(assets: BundleAsset[], maxBudgetKb: number = 150): BundleBudgetReport {
  const totalSizeBytes = assets.reduce((acc, a) => acc + a.sizeBytes, 0);
  const totalSizeKb = Math.round(totalSizeBytes / 1024);
  const passed = totalSizeKb <= maxBudgetKb;

  return {
    passed,
    totalSizeBytes,
    totalSizeKb,
    budgetKb: maxBudgetKb,
    assets: assets.map(a => ({ name: a.name, sizeKb: Math.round(a.sizeBytes / 1024) })),
    error: passed ? undefined : `Bundle budget exceeded: ${totalSizeKb}KB exceeds ${maxBudgetKb}KB limit.`
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Bundle Budget Analyzer Test ---');
  const sampleAssets: BundleAsset[] = [
    { name: 'main.js', sizeBytes: 85 * 1024 },
    { name: 'vendor.js', sizeBytes: 45 * 1024 },
    { name: 'styles.css', sizeBytes: 12 * 1024 }
  ];

  console.log(auditBundleBudget(sampleAssets, 150));
}
