#!/usr/bin/env node
/**
 * Episodic Failure Memory & Negative Constraints Engine
 * Records anti-patterns, failed hypotheses, and dead-end fixes in logs/episodic-memory.jsonl
 * so subagents do not repeat prior mistakes within the same project.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export interface EpisodicFailureRecord {
  recordId: string;
  projectPath: string;
  failedHypothesis: string;
  attemptedFix: string;
  observedError: string;
  negativeConstraint: string; // e.g. "Do not import from @pkg/foo in worker context"
  timestamp: string;
}

export class EpisodicMemoryJournal {
  private logPath: string;
  private records: EpisodicFailureRecord[] = [];

  constructor(customPath?: string) {
    this.logPath = customPath || path.join(process.cwd(), "logs", "episodic-memory.jsonl");
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.logPath)) {
      const lines = fs.readFileSync(this.logPath, "utf-8").trim().split("\n");
      this.records = lines.filter(Boolean).map((l) => JSON.parse(l));
    }
  }

  public recordFailure(
    projectPath: string,
    failedHypothesis: string,
    attemptedFix: string,
    observedError: string,
    negativeConstraint: string
  ): EpisodicFailureRecord {
    const recordId = `FAIL-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`.toUpperCase();
    const entry: EpisodicFailureRecord = {
      recordId,
      projectPath,
      failedHypothesis,
      attemptedFix,
      observedError,
      negativeConstraint,
      timestamp: new Date().toISOString(),
    };

    this.records.push(entry);

    const dir = path.dirname(this.logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(this.logPath, JSON.stringify(entry) + "\n", "utf-8");

    return entry;
  }

  public getConstraintsForProject(projectPath: string): string[] {
    return this.records
      .filter((r) => r.projectPath === projectPath)
      .map((r) => r.negativeConstraint);
  }

  public getAllRecords(): EpisodicFailureRecord[] {
    return [...this.records];
  }
}

if (process.argv[1]?.endsWith("episodic-memory.ts")) {
  console.log("Episodic Memory Journal ready.");
}
