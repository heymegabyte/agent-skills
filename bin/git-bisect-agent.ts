#!/usr/bin/env node
/**
 * Autonomous Git Bisect Regression Localizer
 * Automates binary search over commit ranges to pinpoint the exact commit causing a test regression.
 */

import { execSync } from "node:child_process";

export interface BisectResult {
  culpritCommit: string | null;
  inspectedCommits: string[];
  stepsCount: number;
  success: boolean;
  summary: string;
}

export function simulateBisect(
  commitHistory: string[], // Ordered from oldest (good) to newest (bad)
  testFn: (commit: string) => boolean
): BisectResult {
  if (commitHistory.length < 2) {
    return {
      culpritCommit: null,
      inspectedCommits: [],
      stepsCount: 0,
      success: false,
      summary: "Insufficient commit history to perform bisect.",
    };
  }

  let low = 0;
  let high = commitHistory.length - 1;
  const inspected: string[] = [];
  let culpritIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const currentCommit = commitHistory[mid];
    inspected.push(currentCommit);

    const passes = testFn(currentCommit);

    if (passes) {
      // Good commit, regression must be newer
      low = mid + 1;
    } else {
      // Bad commit, this might be the culprit or it happened earlier
      culpritIndex = mid;
      high = mid - 1;
    }
  }

  const culprit = culpritIndex !== -1 ? commitHistory[culpritIndex] : null;

  return {
    culpritCommit: culprit,
    inspectedCommits: inspected,
    stepsCount: inspected.length,
    success: culprit !== null,
    summary: culprit
      ? `Isolated culprit commit ${culprit} in ${inspected.length} bisect steps.`
      : "No regression detected in provided commit range.",
  };
}

if (process.argv[1]?.endsWith("git-bisect-agent.ts")) {
  console.log("Git Bisect Agent ready.");
}
