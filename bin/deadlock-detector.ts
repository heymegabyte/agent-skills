#!/usr/bin/env node
/**
 * Cross-Agent Deadlock & Livelock Detector
 * Monitors inter-agent dependencies, locks, and A2A waiting queues, detecting cyclic wait-for conditions.
 */

export interface WaitDependency {
  agentRole: string;
  waitingForRole: string;
  resourceOrTaskId: string;
  durationSeconds: number;
}

export interface DeadlockAnalysis {
  isDeadlocked: boolean;
  cycleDetected: string[];
  actionRecommendation: "NONE" | "PREEMPT_CYCLE" | "WARN_STALL";
}

export function detectAgentDeadlocks(
  dependencies: WaitDependency[],
  timeoutSeconds = 300
): DeadlockAnalysis {
  // Build adjacency list
  const adj = new Map<string, string[]>();
  for (const dep of dependencies) {
    if (!adj.has(dep.agentRole)) adj.set(dep.agentRole, []);
    adj.get(dep.agentRole)!.push(dep.waitingForRole);
  }

  // Detect cycle via DFS
  const visited = new Set<string>();
  const recStack = new Set<string>();
  let detectedCycle: string[] = [];

  function dfs(node: string, currentPath: string[]): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor, [...currentPath, neighbor])) return true;
      } else if (recStack.has(neighbor)) {
        detectedCycle = [...currentPath, neighbor];
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (dfs(node, [node])) break;
    }
  }

  const isDeadlocked = detectedCycle.length > 0;
  const hasStalledDependency = dependencies.some((d) => d.durationSeconds > timeoutSeconds);

  let recommendation: "NONE" | "PREEMPT_CYCLE" | "WARN_STALL" = "NONE";
  if (isDeadlocked) {
    recommendation = "PREEMPT_CYCLE";
  } else if (hasStalledDependency) {
    recommendation = "WARN_STALL";
  }

  return {
    isDeadlocked,
    cycleDetected: detectedCycle,
    actionRecommendation: recommendation,
  };
}

if (process.argv[1]?.endsWith("deadlock-detector.ts")) {
  console.log("Deadlock Detector ready.");
}
