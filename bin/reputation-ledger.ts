#!/usr/bin/env node
/**
 * Agent Capability & Reputation Ledger
 * Tracks historical performance metrics (test pass rate, step efficiency, rollback rate) per agent role,
 * adjusting autonomous ROE privileges accordingly.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface AgentReputationRecord {
  agentRole: string;
  totalMissions: number;
  successfulMissions: number;
  totalStepsUsed: number;
  rollbacksTriggered: number;
  reputationScore: number; // 0 to 100
  grantedRoeTier: "GREEN" | "AMBER" | "RED";
}

export class ReputationLedger {
  private ledgerPath: string;
  private records: Map<string, AgentReputationRecord> = new Map();

  constructor(customPath?: string) {
    this.ledgerPath = customPath || path.join(process.cwd(), "logs", "agent-reputation.json");
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.ledgerPath)) {
      try {
        const raw = fs.readFileSync(this.ledgerPath, "utf-8");
        const list: AgentReputationRecord[] = JSON.parse(raw);
        for (const item of list) {
          this.records.set(item.agentRole, item);
        }
      } catch {
        // start empty
      }
    }
  }

  public recordMissionOutcome(
    agentRole: string,
    success: boolean,
    stepsUsed: number,
    causedRollback: boolean
  ): AgentReputationRecord {
    const existing = this.records.get(agentRole) || {
      agentRole,
      totalMissions: 0,
      successfulMissions: 0,
      totalStepsUsed: 0,
      rollbacksTriggered: 0,
      reputationScore: 75,
      grantedRoeTier: "AMBER",
    };

    existing.totalMissions += 1;
    if (success) existing.successfulMissions += 1;
    existing.totalStepsUsed += stepsUsed;
    if (causedRollback) existing.rollbacksTriggered += 1;

    // Calculate score
    const passRate = existing.successfulMissions / existing.totalMissions;
    const avgSteps = existing.totalStepsUsed / existing.totalMissions;
    const rollbackPenalty = (existing.rollbacksTriggered / existing.totalMissions) * 40;

    let score = Math.round(passRate * 80 + Math.max(0, 20 - avgSteps) - rollbackPenalty);
    score = Math.max(0, Math.min(100, score));

    // Dynamic ROE elevation
    let roe: "GREEN" | "AMBER" | "RED" = "AMBER";
    if (score >= 85 && existing.totalMissions >= 3) {
      roe = "GREEN";
    } else if (score < 50 || existing.rollbacksTriggered > 2) {
      roe = "RED";
    }

    existing.reputationScore = score;
    existing.grantedRoeTier = roe;
    this.records.set(agentRole, existing);

    const dir = path.dirname(this.ledgerPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.ledgerPath, JSON.stringify(Array.from(this.records.values()), null, 2), "utf-8");

    return existing;
  }

  public getRecord(agentRole: string): AgentReputationRecord | undefined {
    return this.records.get(agentRole);
  }
}

if (process.argv[1]?.endsWith("reputation-ledger.ts")) {
  console.log("Reputation Ledger ready.");
}
