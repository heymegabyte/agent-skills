#!/usr/bin/env node
/**
 * Revision-Aware Evidence Ledger
 * Maintains an immutable cryptographically stamped record of which exact commit hash,
 * git tree OID, and test runner execution proved each requirement.
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export interface EvidenceEntry {
  proofId: string;
  requirementId: string;
  commitHash: string;
  treeOid: string;
  testCommand: string;
  exitCode: number;
  outputDigest: string;
  verifiedAt: string;
}

export class EvidenceLedger {
  private ledgerPath: string;
  private entries: EvidenceEntry[] = [];

  constructor(customPath?: string) {
    this.ledgerPath = customPath || path.join(process.cwd(), "logs", "evidence-ledger.jsonl");
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.ledgerPath)) {
      const lines = fs.readFileSync(this.ledgerPath, "utf-8").trim().split("\n");
      this.entries = lines.filter(Boolean).map((line) => JSON.parse(line));
    }
  }

  public recordProof(
    requirementId: string,
    commitHash: string,
    treeOid: string,
    testCommand: string,
    exitCode: number,
    rawOutput: string
  ): EvidenceEntry {
    const outputDigest = crypto.createHash("sha256").update(rawOutput).digest("hex").slice(0, 16);
    const proofId = `PROOF-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`.toUpperCase();

    const entry: EvidenceEntry = {
      proofId,
      requirementId,
      commitHash,
      treeOid,
      testCommand,
      exitCode,
      outputDigest,
      verifiedAt: new Date().toISOString(),
    };

    this.entries.push(entry);

    const dir = path.dirname(this.ledgerPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(this.ledgerPath, JSON.stringify(entry) + "\n", "utf-8");

    return entry;
  }

  public isRequirementVerified(requirementId: string, currentCommitHash: string): boolean {
    const proofs = this.entries.filter(
      (e) => e.requirementId === requirementId && e.commitHash === currentCommitHash && e.exitCode === 0
    );
    return proofs.length > 0;
  }

  public getProofs(): EvidenceEntry[] {
    return [...this.entries];
  }
}

if (process.argv[1]?.endsWith("evidence-ledger.ts")) {
  console.log("Revision-Aware Evidence Ledger ready.");
}
