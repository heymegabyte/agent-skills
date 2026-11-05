#!/usr/bin/env node
/**
 * Context Window Token Budget Allocator
 * Dynamically partitions the LLM context window into fixed quotas, preventing starvation.
 */

export interface BudgetQuotas {
  maxTotalTokens: number;
  systemPromptQuota: number; // typically 15%
  astSymbolsQuota: number; // typically 30%
  conversationQuota: number; // typically 25%
  scratchpadQuota: number; // typically 30%
}

export interface BudgetUsage {
  systemPromptTokens: number;
  astSymbolsTokens: number;
  conversationTokens: number;
  scratchpadTokens: number;
}

export interface BudgetAuditResult {
  isWithinBudget: boolean;
  totalTokensUsed: number;
  utilizationRate: number;
  overflowSectors: string[];
  recommendations: string[];
}

export function computeTokenQuotas(maxTotalTokens = 128000): BudgetQuotas {
  return {
    maxTotalTokens,
    systemPromptQuota: Math.floor(maxTotalTokens * 0.15),
    astSymbolsQuota: Math.floor(maxTotalTokens * 0.30),
    conversationQuota: Math.floor(maxTotalTokens * 0.25),
    scratchpadQuota: Math.floor(maxTotalTokens * 0.30),
  };
}

export function auditTokenBudget(usage: BudgetUsage, quotas: BudgetQuotas): BudgetAuditResult {
  const total = usage.systemPromptTokens + usage.astSymbolsTokens + usage.conversationTokens + usage.scratchpadTokens;
  const overflows: string[] = [];
  const recs: string[] = [];

  if (usage.systemPromptTokens > quotas.systemPromptQuota) {
    overflows.push("systemPrompt");
    recs.push(`Trim static instructions by ${usage.systemPromptTokens - quotas.systemPromptQuota} tokens.`);
  }
  if (usage.astSymbolsTokens > quotas.astSymbolsQuota) {
    overflows.push("astSymbols");
    recs.push(`Compress AST symbol indexing by ${usage.astSymbolsTokens - quotas.astSymbolsQuota} tokens.`);
  }
  if (usage.conversationTokens > quotas.conversationQuota) {
    overflows.push("conversation");
    recs.push(`Trigger conversation compaction (/compact) to free ${usage.conversationTokens - quotas.conversationQuota} tokens.`);
  }
  if (usage.scratchpadTokens > quotas.scratchpadQuota) {
    overflows.push("scratchpad");
    recs.push(`Distill verification scratchpad traces by ${usage.scratchpadTokens - quotas.scratchpadQuota} tokens.`);
  }

  const isWithinBudget = total <= quotas.maxTotalTokens && overflows.length === 0;
  const utilizationRate = Math.round((total / quotas.maxTotalTokens) * 100) / 100;

  return {
    isWithinBudget,
    totalTokensUsed: total,
    utilizationRate,
    overflowSectors: overflows,
    recommendations: recs,
  };
}

if (process.argv[1]?.endsWith("token-budget-allocator.ts")) {
  console.log("Token Budget Allocator ready.");
}
