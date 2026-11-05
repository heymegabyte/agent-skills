#!/usr/bin/env node
/**
 * roe-enforcer.ts
 * Rules of Engagement (ROE) validator and perimeter guard for fleet operations.
 *
 * Tiers:
 * - GREEN: Autonomous strike / free execution within assigned sector.
 * - AMBER: Audited operation requiring two-man rule sign-off (e.g. QA or DevSecOps verification).
 * - RED: Restricted high-blast-radius operation requiring supreme commander clearance.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

export interface RoeCheckResult {
  tier: 'GREEN' | 'AMBER' | 'RED';
  approved: boolean;
  violations: string[];
  recommendations: string[];
}

const RED_PATTERNS = [
  /drop\s+table/i,
  /drop\s+database/i,
  /truncate\s+table/i,
  /rm\s+-rf\s+(\/|~|\$HOME|\*)/i,
  /git\s+push.*--force.*(main|master)/i,
  /chmod\s+-R\s+777/i,
  /destroy.*production/i,
  /aws.*delete/i,
  /wrangler.*delete/i,
  /DROP\s+COLUMN/i
];

const AMBER_PATTERNS = [
  /ALTER\s+TABLE/i,
  /add\s+column/i,
  /npm\s+install/i,
  /pnpm\s+add/i,
  /git\s+tag/i,
  /export\s+[A-Z_]+_KEY=/i,
  /migrate/i
];

export function checkRoe(actionDescription: string, filesTouched: string[] = []): RoeCheckResult {
  const violations: string[] = [];
  const recommendations: string[] = [];

  // 1. Check for RED violations
  for (const pattern of RED_PATTERNS) {
    if (pattern.test(actionDescription)) {
      violations.push(`RED TIER TRIGGER: Action matched high-blast-radius pattern: ${pattern}`);
    }
  }

  // Check files for sensitive areas
  for (const file of filesTouched) {
    if (file.includes('.env') || file.includes('credentials') || file.includes('id_rsa') || file.includes('secret')) {
      violations.push(`RED TIER TRIGGER: Sensitive file mutation detected on ${file}`);
    }
  }

  if (violations.length > 0) {
    return {
      tier: 'RED',
      approved: false,
      violations,
      recommendations: [
        'Halt immediately; do not execute without explicit executive authorization.',
        'Consider non-destructive fallback (e.g. soft-delete, staging dry-run).'
      ]
    };
  }

  // 2. Check for AMBER triggers
  const amberTriggers: string[] = [];
  for (const pattern of AMBER_PATTERNS) {
    if (pattern.test(actionDescription)) {
      amberTriggers.push(`AMBER TIER: Action matched audited operation: ${pattern}`);
    }
  }

  if (amberTriggers.length > 0) {
    return {
      tier: 'AMBER',
      approved: true, // Approved under audit
      violations: amberTriggers,
      recommendations: [
        'Engage two-man rule: verify with QA-Verification or DevSecOps before merging.',
        'Run complete test suite and capture state snapshot before execution.'
      ]
    };
  }

  return {
    tier: 'GREEN',
    approved: true,
    violations: [],
    recommendations: ['Autonomous execution authorized within sector boundaries.']
  };
}

if (process.argv[1] && process.argv[1].endsWith('roe-enforcer.ts')) {
  const query = process.argv.slice(2).join(' ');
  if (!query || query === '--help') {
    console.log('Usage: node roe-enforcer.ts "<command or action description>" [file1 file2 ...]');
    process.exit(0);
  }

  const result = checkRoe(query);
  console.log(`[ROE STATUS]: ${result.tier} (Approved: ${result.approved})`);
  if (result.violations.length > 0) {
    console.log('Notes/Triggers:');
    result.violations.forEach(v => console.log(`  - ${v}`));
  }
  console.log('Directives:');
  result.recommendations.forEach(r => console.log(`  - ${r}`));

  if (!result.approved) {
    process.exit(1);
  }
}
