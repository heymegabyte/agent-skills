#!/usr/bin/env node
/**
 * Monte Carlo Tree Search Patch Selector
 * Scores candidate code patches along a verification tree using pass-rate heuristics and AST complexity deltas.
 */

export interface PatchNode {
  id: string;
  parentId?: string;
  patchSummary: string;
  testPassRate: number; // 0 to 1
  astComplexityDelta: number; // negative is simpler, positive is more complex
  linesAdded: number;
  linesRemoved: number;
  visits: number;
}

export function calculateUCB1(node: PatchNode, totalSimulations: number, explorationWeight = 1.414): number {
  if (node.visits === 0) return Infinity;
  // Exploit component: test pass rate penalized slightly by increased AST complexity
  const exploit = node.testPassRate - (node.astComplexityDelta > 5 ? 0.2 : 0);
  const explore = explorationWeight * Math.sqrt(Math.log(totalSimulations) / node.visits);
  return exploit + explore;
}

export function selectOptimalPatch(nodes: PatchNode[]): PatchNode | null {
  if (nodes.length === 0) return null;
  const totalSims = nodes.reduce((sum, n) => sum + Math.max(1, n.visits), 0);

  // Filter nodes with at least 100% test pass rate if available
  const fullyPassing = nodes.filter((n) => n.testPassRate === 1.0);
  const candidatePool = fullyPassing.length > 0 ? fullyPassing : nodes;

  return candidatePool.reduce((best, curr) => {
    const currScore = calculateUCB1(curr, totalSims);
    const bestScore = calculateUCB1(best, totalSims);
    if (currScore > bestScore) return curr;
    if (currScore === bestScore) {
      // Tie breaker: prefer lower complexity delta and fewer lines changed
      const currEff = curr.astComplexityDelta + curr.linesAdded;
      const bestEff = best.astComplexityDelta + best.linesAdded;
      return currEff < bestEff ? curr : best;
    }
    return best;
  });
}

if (process.argv[1]?.endsWith("mcts-patch-selector.ts")) {
  console.log("MCTS Patch Selector ready.");
}
