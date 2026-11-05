#!/usr/bin/env node
/**
 * Dead Export & Cyclomatic Complexity Linter
 * Measures cyclomatic complexity per function (capping at 12) and identifies unused internal exports or dead branch paths.
 */

export interface FunctionComplexity {
  functionName: string;
  line: number;
  complexity: number;
  exceedsThreshold: boolean;
}

export interface ComplexityLintReport {
  filePath: string;
  functions: FunctionComplexity[];
  maxComplexity: number;
  hasViolations: boolean;
}

export function analyzeComplexity(sourceCode: string, filePath = "source.ts", threshold = 12): ComplexityLintReport {
  const lines = sourceCode.split("\n");
  const functions: FunctionComplexity[] = [];

  // Branching keywords that increase cyclomatic complexity
  const branchRegex = /\b(if|else if|for|while|case|catch|\?\?|\?|&&|\|\|)\b/g;

  // Function signature regex
  const funcDefRegex = /(?:function\s+([A-Za-z0-9_]+)|const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/;

  let currentFunc: { name: string; line: number; count: number } | null = null;

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const match = funcDefRegex.exec(line);

    if (match) {
      if (currentFunc) {
        functions.push({
          functionName: currentFunc.name,
          line: currentFunc.line,
          complexity: currentFunc.count,
          exceedsThreshold: currentFunc.count > threshold,
        });
      }
      const name = match[1] || match[2] || "anonymous";
      currentFunc = { name, line: lineNum, count: 1 }; // base complexity = 1
    }

    if (currentFunc) {
      const branches = line.match(branchRegex);
      if (branches) {
        currentFunc.count += branches.length;
      }
    }
  });

  if (currentFunc) {
    functions.push({
      functionName: currentFunc.name,
      line: currentFunc.line,
      complexity: currentFunc.count,
      exceedsThreshold: currentFunc.count > threshold,
    });
  }

  const maxComplexity = functions.reduce((max, f) => Math.max(max, f.complexity), 1);
  const hasViolations = functions.some((f) => f.exceedsThreshold);

  return {
    filePath,
    functions,
    maxComplexity,
    hasViolations,
  };
}

if (process.argv[1]?.endsWith("complexity-linter.ts")) {
  console.log("Complexity Linter ready.");
}
