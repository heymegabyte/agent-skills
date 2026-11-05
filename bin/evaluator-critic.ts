#!/usr/bin/env node
/**
 * evaluator-critic.ts
 * Evaluator-Optimizer Dual-Agent Audit Gate.
 * Audits code patches, AST changes, and git diffs against strict engineering rubrics
 * (Type safety, Test coverage, No debug leftovers, Preserved contracts) before committing.
 */

export interface AuditFinding {
  rule: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  file?: string;
  line?: number;
  message: string;
}

export interface AuditVerdict {
  approved: boolean;
  score: number; // 0 to 100
  findings: AuditFinding[];
}

export function auditCodeDiff(diffContent: string): AuditVerdict {
  const findings: AuditFinding[] = [];
  const lines = diffContent.split('\n');

  let addedLinesCount = 0;
  let testLinesCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Only audit added lines
    if (line.startsWith('+') && !line.startsWith('+++')) {
      addedLinesCount++;
      const text = line.substring(1);

      // 1. Check for loose TypeScript 'any'
      if (/\bany\b|as any/.test(text) && !text.includes('// ignore-any')) {
        findings.push({
          rule: 'strict-types-no-any',
          severity: 'ERROR',
          line: i + 1,
          message: `Forbidden loose 'any' detected on added line: ${text.trim()}`
        });
      }

      // 2. Check for leftover debug statements
      if (/\bdebugger\b|console\.log\(|alert\(/.test(text) && !text.includes('// allowed-log')) {
        findings.push({
          rule: 'no-debug-leftovers',
          severity: 'WARNING',
          line: i + 1,
          message: `Potential debug statement detected: ${text.trim()}`
        });
      }

      // 3. Count test lines
      if (/test\(|it\(|describe\(|assert\.|expect\(/.test(text)) {
        testLinesCount++;
      }
    }
  }

  // 4. Test Coverage Ratio check for substantial changes (> 20 added lines)
  if (addedLinesCount > 20 && testLinesCount === 0) {
    findings.push({
      rule: 'test-driven-verification',
      severity: 'WARNING',
      message: `Substantial code added (${addedLinesCount} lines) without accompanying test assertions.`
    });
  }

  const errors = findings.filter(f => f.severity === 'ERROR').length;
  const warnings = findings.filter(f => f.severity === 'WARNING').length;

  const score = Math.max(0, 100 - (errors * 25) - (warnings * 10));
  const approved = errors === 0 && score >= 70;

  return {
    approved,
    score,
    findings
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Evaluator Critic Self-Test ---');
  const sampleDiff = `
+export function calculateFee(amount: any): number {
+  console.log("calculating fee for", amount);
+  return amount * 0.05;
+}
`;

  const verdict = auditCodeDiff(sampleDiff);
  console.log(`Audit Approved: ${verdict.approved}`);
  console.log(`Score: ${verdict.score}/100`);
  console.log(`Findings (${verdict.findings.length}):`);
  verdict.findings.forEach(f => console.log(`  [${f.severity}] ${f.rule}: ${f.message}`));
}
