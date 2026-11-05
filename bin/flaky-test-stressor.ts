#!/usr/bin/env node
/**
 * Flaky Test Stressor & Statistical Verifier
 * Executes suspect test suites N times with randomized jitter to expose race conditions
 * and prevent premature "passed once" false positive declarations.
 */

import { execSync } from "node:child_process";

export interface StressTestOptions {
  iterations?: number;
  maxFailuresAllowed?: number;
  jitterMs?: number;
  command: string;
  cwd?: string;
}

export interface StressTestReport {
  command: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  passRate: number;
  isFlaky: boolean;
  isReliable: boolean;
  durationsMs: number[];
  averageDurationMs: number;
}

export function stressTest(options: StressTestOptions): StressTestReport {
  const iterations = options.iterations ?? 10;
  const maxFailures = options.maxFailuresAllowed ?? 0;
  const cwd = options.cwd ?? process.cwd();
  const durations: number[] = [];

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < iterations; i++) {
    if (options.jitterMs && options.jitterMs > 0) {
      const wait = Math.floor(Math.random() * options.jitterMs);
      const start = Date.now();
      while (Date.now() - start < wait) {
        // micro jitter
      }
    }

    const t0 = Date.now();
    try {
      execSync(options.command, {
        cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 15000,
      });
      passed++;
    } catch {
      failed++;
    }
    durations.push(Date.now() - t0);
  }

  const passRate = passed / iterations;
  const isFlaky = failed > 0 && passed > 0;
  const isReliable = failed <= maxFailures && passRate === 1.0;
  const averageDurationMs = Math.round(durations.reduce((a, b) => a + b, 0) / iterations);

  return {
    command: options.command,
    totalRuns: iterations,
    passedRuns: passed,
    failedRuns: failed,
    passRate,
    isFlaky,
    isReliable,
    durationsMs: durations,
    averageDurationMs,
  };
}

if (process.argv[1]?.endsWith("flaky-test-stressor.ts")) {
  console.log("Flaky Test Stressor ready.");
}
