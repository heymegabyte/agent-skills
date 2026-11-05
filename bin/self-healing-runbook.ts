#!/usr/bin/env node
/**
 * self-healing-runbook.ts
 * Automated Self-Healing Runbook Executor.
 * Ingests terminal error outputs from failed agent actions, matches patterns against
 * the canonical self-healing runbook, and generates/executes immediate diagnostic & recovery plans.
 */

export interface RunbookEntry {
  pattern: RegExp;
  category: string;
  diagnostic: string;
  recoveryAction: string;
  autoFixable: boolean;
}

export const CANONICAL_RUNBOOK: RunbookEntry[] = [
  {
    pattern: /ERR_MODULE_NOT_FOUND|Cannot find module/i,
    category: 'Missing Dependency or Broken Import',
    diagnostic: 'node -e "console.log(import.meta.resolve(\'<module>\'))"',
    recoveryAction: 'pnpm install or verify relative import path resolution',
    autoFixable: true
  },
  {
    pattern: /rate limit|HTTP 429|Too Many Requests/i,
    category: 'Provider Rate Limit / Quota Exhaustion',
    diagnostic: 'check-pricing.sh / inspect rate limit headers',
    recoveryAction: 'Trigger PACE Alternate channel failover and apply exponential backoff jitter',
    autoFixable: true
  },
  {
    pattern: /Type error|TS\d{4}:/i,
    category: 'TypeScript Type Checking Failure',
    diagnostic: 'npx tsc --noEmit --pretty',
    recoveryAction: 'Narrow types, replace loose any with discriminated union, verify Zod schema',
    autoFixable: true
  },
  {
    pattern: /syntax error|SyntaxError/i,
    category: 'Parser Syntax Error',
    diagnostic: 'node --check <file>',
    recoveryAction: 'Inspect file AST and fix malformed bracket, quote, or comma syntax',
    autoFixable: true
  },
  {
    pattern: /ECONNREFUSED|ENOTFOUND|fetch failed/i,
    category: 'Network Unreachability / Offline Service',
    diagnostic: 'curl -I <endpoint> / ping host',
    recoveryAction: 'Verify local dev server is listening, check port forwarding, or enable mock service worker',
    autoFixable: true
  },
  {
    pattern: /EACCES|permission denied/i,
    category: 'File System Permission Violation',
    diagnostic: 'ls -ld <path>',
    recoveryAction: 'Verify file ownership or invoke bypassPermissions/chmod within allowed scope',
    autoFixable: false
  },
  {
    pattern: /git conflict|CONFLICT \(content\)/i,
    category: 'Git Merge / Rebase Conflict',
    diagnostic: 'git status --porcelain / git diff --check',
    recoveryAction: 'Abort merge, re-fetch origin/master, isolate into clean worktree',
    autoFixable: true
  }
];

export function diagnoseError(errorOutput: string): {
  matched: boolean;
  category?: string;
  diagnostic?: string;
  recoveryAction?: string;
  autoFixable?: boolean;
} {
  for (const entry of CANONICAL_RUNBOOK) {
    if (entry.pattern.test(errorOutput)) {
      return {
        matched: true,
        category: entry.category,
        diagnostic: entry.diagnostic,
        recoveryAction: entry.recoveryAction,
        autoFixable: entry.autoFixable
      };
    }
  }

  return {
    matched: false
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Self-Healing Runbook Test ---');
  const sampleError = `Error: Cannot find module '@theme.tools/workflows' imported from /Users/Apple/src/index.ts`;
  const diagnosis = diagnoseError(sampleError);

  console.log(`Error String: "${sampleError}"`);
  console.log(`Matched: ${diagnosis.matched}`);
  console.log(`Category: ${diagnosis.category}`);
  console.log(`Diagnostic: ${diagnosis.diagnostic}`);
  console.log(`Recovery Action: ${diagnosis.recoveryAction}`);
}
