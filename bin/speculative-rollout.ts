#!/usr/bin/env node
/**
 * Speculative Rollout Engine
 * Spawns isolated candidate branches or temporary scratchpads to evaluate alternative code paths concurrently.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

export interface CandidatePath {
  id: string;
  description: string;
  diffContent?: string;
  commandToTest: string;
  scratchFile?: string;
}

export interface RolloutResult {
  candidateId: string;
  success: boolean;
  exitCode: number;
  durationMs: number;
  score: number;
  stdout: string;
  stderr: string;
}

export function evaluateCandidate(candidate: CandidatePath, cwd: string = process.cwd()): RolloutResult {
  const startTime = Date.now();
  let success = false;
  let exitCode = 1;
  let stdout = "";
  let stderr = "";

  try {
    stdout = execSync(candidate.commandToTest, {
      cwd,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 10000,
    });
    success = true;
    exitCode = 0;
  } catch (err: unknown) {
    const error = err as { status?: number; stdout?: string; stderr?: string };
    exitCode = error.status ?? 1;
    stdout = error.stdout ?? "";
    stderr = error.stderr ?? "";
  }

  const durationMs = Date.now() - startTime;
  // Score formula: 100 for passing, adjusted down by execution latency
  const score = success ? Math.max(70, 100 - Math.floor(durationMs / 200)) : 0;

  return {
    candidateId: candidate.id,
    success,
    exitCode,
    durationMs,
    score,
    stdout: stdout.trim(),
    stderr: stderr.trim(),
  };
}

export function runSpeculativeTournament(candidates: CandidatePath[], cwd: string = process.cwd()): {
  winner: RolloutResult | null;
  results: RolloutResult[];
} {
  const results = candidates.map((cand) => evaluateCandidate(cand, cwd));
  const passing = results.filter((r) => r.success);
  passing.sort((a, b) => b.score - a.score || a.durationMs - b.durationMs);

  return {
    winner: passing[0] ?? null,
    results,
  };
}

if (process.argv[1]?.endsWith("speculative-rollout.ts")) {
  console.log("Speculative Rollout Engine ready.");
}
