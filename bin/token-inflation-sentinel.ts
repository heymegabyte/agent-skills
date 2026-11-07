#!/usr/bin/env node
/**
 * token-inflation-sentinel.ts
 * Prompt Context Inflation Sentinel.
 * Inspects prompt lengths and context window utilization, flagging tasks
 * where static instructions exceed 65% of context or approach the 900K token upper limit.
 */

export interface ContextAuditResult {
  estimatedTokens: number;
  maxContextTokens: number;
  utilizationPercent: number;
  inflated: boolean;
  recommendation: string;
}

export function auditContextInflation(rawText: string, maxContextTokens: number = 200000): ContextAuditResult {
  // Approximate 4 characters per token
  const estimatedTokens = Math.ceil(rawText.length / 4);
  const utilizationPercent = Math.round((estimatedTokens / maxContextTokens) * 100);
  const inflated = utilizationPercent > 65;

  let recommendation = 'Context utilization healthy';
  if (inflated) {
    recommendation = `Context inflated (${utilizationPercent}%). Trigger prompt compression via Repomix or compact history before dispatch.`;
  } else if (utilizationPercent > 50) {
    recommendation = `Context approaching threshold (${utilizationPercent}%). Monitor subagent spawn fan-out.`;
  }

  return {
    estimatedTokens,
    maxContextTokens,
    utilizationPercent,
    inflated,
    recommendation
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Context Inflation Sentinel Test ---');
  const normalText = 'Small operational prompt for testing';
  console.log('Normal Prompt:', auditContextInflation(normalText));

  const hugeText = 'A'.repeat(600000); // ~150,000 tokens
  console.log('Large Prompt:', auditContextInflation(hugeText, 200000));
}
