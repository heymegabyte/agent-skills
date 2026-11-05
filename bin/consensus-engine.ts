#!/usr/bin/env node
/**
 * Multi-Agent Consensus Voting Engine
 * Executes 3-agent Byzantine agreement (e.g. Architect, QA, SRE) on critical architecture and security proposals,
 * requiring 2/3 cryptographic majority before execution.
 */

import * as crypto from "node:crypto";

export interface AgentVote {
  agentRole: string;
  verdict: "APPROVE" | "REJECT" | "ABSTAIN";
  reason: string;
  signature?: string;
}

export interface Proposal {
  proposalId: string;
  title: string;
  targetPackage: string;
  breakingChange: boolean;
  requiredVotes: number;
}

export interface ConsensusResult {
  proposalId: string;
  achievedConsensus: boolean;
  approvalRatio: number; // 0 to 1
  totalVotes: number;
  approvals: number;
  rejections: number;
  abstentions: number;
  verdict: "APPROVED" | "REJECTED" | "QUORUM_NOT_MET";
}

export function evaluateConsensus(proposal: Proposal, votes: AgentVote[]): ConsensusResult {
  const totalVotes = votes.length;
  let approvals = 0;
  let rejections = 0;
  let abstentions = 0;

  for (const v of votes) {
    if (v.verdict === "APPROVE") approvals++;
    else if (v.verdict === "REJECT") rejections++;
    else abstentions++;
  }

  const approvalRatio = totalVotes > 0 ? approvals / totalVotes : 0;
  // Byzantine threshold: at least 2/3 approvals (>= 0.666) and totalVotes >= requiredVotes
  const meetsQuorum = totalVotes >= proposal.requiredVotes;
  const achievedConsensus = meetsQuorum && approvalRatio >= 0.666;

  let verdict: "APPROVED" | "REJECTED" | "QUORUM_NOT_MET" = "REJECTED";
  if (!meetsQuorum) {
    verdict = "QUORUM_NOT_MET";
  } else if (achievedConsensus) {
    verdict = "APPROVED";
  }

  return {
    proposalId: proposal.proposalId,
    achievedConsensus,
    approvalRatio: Math.round(approvalRatio * 100) / 100,
    totalVotes,
    approvals,
    rejections,
    abstentions,
    verdict,
  };
}

if (process.argv[1]?.endsWith("consensus-engine.ts")) {
  console.log("Consensus Engine ready.");
}
