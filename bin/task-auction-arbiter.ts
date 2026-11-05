#!/usr/bin/env node
/**
 * Decentralized Task Auction & Bidding Arbiter
 * Distributes subtasks across specialized agents based on agent skill match score, token backlog, and historical velocity.
 */

export interface AgentBid {
  agentRole: string;
  skillMatchScore: number; // 0 to 100
  currentContextTokens: number; // current load
  maxContextTokens: number;
  historicalPassRate: number; // 0 to 1.0
}

export interface TaskAuctionTicket {
  taskId: string;
  requiredDomain: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  complexityScore: number; // 1 to 10
}

export function arbitrateAuction(ticket: TaskAuctionTicket, bids: AgentBid[]): {
  winningRole: string | null;
  rankedBids: { role: string; compositeScore: number }[];
} {
  if (bids.length === 0) {
    return { winningRole: null, rankedBids: [] };
  }

  const scored = bids.map((b) => {
    // Available capacity ratio
    const capacityRatio = Math.max(0, 1 - b.currentContextTokens / b.maxContextTokens);
    // Composite scoring formula: 40% skill match, 30% capacity, 30% historical pass rate
    const compositeScore =
      b.skillMatchScore * 0.4 +
      capacityRatio * 100 * 0.3 +
      b.historicalPassRate * 100 * 0.3;

    return {
      role: b.agentRole,
      compositeScore: Math.round(compositeScore * 10) / 10,
    };
  });

  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  return {
    winningRole: scored[0]?.role || null,
    rankedBids: scored,
  };
}

if (process.argv[1]?.endsWith("task-auction-arbiter.ts")) {
  console.log("Task Auction Arbiter ready.");
}
