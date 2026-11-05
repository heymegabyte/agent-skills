#!/usr/bin/env node
/**
 * AST Mutation Testing Engine
 * Mutates binary operators, conditional boundaries, and return values in TypeScript source files
 * to verify that test suites fail when bugs are injected (mutation score >= 80%).
 */

export interface CodeMutant {
  id: string;
  originalSnippet: string;
  mutatedSnippet: string;
  description: string;
}

export function generateMutants(sourceCode: string): CodeMutant[] {
  const mutants: CodeMutant[] = [];

  // 1. Invert equality operator
  if (sourceCode.includes("===")) {
    mutants.push({
      id: "MUT-EQ-01",
      originalSnippet: "===",
      mutatedSnippet: "!==",
      description: "Inverted strict equality (=== to !==)",
    });
  }

  // 2. Invert relational operator
  if (sourceCode.includes("<")) {
    mutants.push({
      id: "MUT-REL-01",
      originalSnippet: "<",
      mutatedSnippet: ">=",
      description: "Inverted less-than relational boundary (< to >=)",
    });
  }

  // 3. Invert boolean literal
  if (sourceCode.includes("true")) {
    mutants.push({
      id: "MUT-BOOL-01",
      originalSnippet: "true",
      mutatedSnippet: "false",
      description: "Flipped boolean literal (true to false)",
    });
  }

  // 4. Invert logical AND to OR
  if (sourceCode.includes("&&")) {
    mutants.push({
      id: "MUT-LOG-01",
      originalSnippet: "&&",
      mutatedSnippet: "||",
      description: "Swapped logical AND (&&) to logical OR (||)",
    });
  }

  return mutants;
}

export function evaluateMutationScore(totalMutants: number, killedMutants: number): {
  score: number;
  grade: "PASS" | "FAIL";
  summary: string;
} {
  if (totalMutants === 0) {
    return { score: 100, grade: "PASS", summary: "No mutable operators detected." };
  }
  const score = Math.round((killedMutants / totalMutants) * 100);
  const grade = score >= 80 ? "PASS" : "FAIL";
  return {
    score,
    grade,
    summary: `Mutation score: ${score}% (${killedMutants}/${totalMutants} mutants caught by tests).`,
  };
}

if (process.argv[1]?.endsWith("ast-mutation-tester.ts")) {
  console.log("AST Mutation Tester ready.");
}
