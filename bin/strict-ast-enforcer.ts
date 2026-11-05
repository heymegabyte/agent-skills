#!/usr/bin/env node
/**
 * Strict Type-Safety & Zero-Any AST Enforcer
 * Scans TypeScript source files, flagging 'any', unsafe casts, or '@ts-ignore' comments as fatal violations.
 */

export interface TypeSafetyViolation {
  rule: "NO_ANY" | "NO_TS_IGNORE" | "NO_UNCHECKED_CAST";
  line: number;
  snippet: string;
  recommendation: string;
}

export interface TypeSafetyReport {
  filePath: string;
  violations: TypeSafetyViolation[];
  isClean: boolean;
  score: number; // 0 to 100
}

export function enforceTypeSafety(sourceCode: string, filePath: string = "unnamed.ts"): TypeSafetyReport {
  const lines = sourceCode.split("\n");
  const violations: TypeSafetyViolation[] = [];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // Check for @ts-ignore
    if (/@ts-ignore/.test(lineText)) {
      violations.push({
        rule: "NO_TS_IGNORE",
        line: lineNum,
        snippet: lineText.trim(),
        recommendation: "Replace @ts-ignore with proper discriminated union typing or type assertion.",
      });
    }

    // Check for explicit : any or as any
    if (/:\s*any\b/.test(lineText) || /\bas\s+any\b/.test(lineText)) {
      violations.push({
        rule: "NO_ANY",
        line: lineNum,
        snippet: lineText.trim(),
        recommendation: "Replace 'any' with a strict interface, generic parameter, or unknown with type guard.",
      });
    }

    // Check for unchecked (foo as unknown as Bar)
    if (/as\s+unknown\s+as\s+[A-Za-z0-9_]/.test(lineText)) {
      violations.push({
        rule: "NO_UNCHECKED_CAST",
        line: lineNum,
        snippet: lineText.trim(),
        recommendation: "Avoid double assertion casting without validation.",
      });
    }
  });

  const penalty = violations.length * 20;
  const score = Math.max(0, 100 - penalty);

  return {
    filePath,
    violations,
    isClean: violations.length === 0,
    score,
  };
}

if (process.argv[1]?.endsWith("strict-ast-enforcer.ts")) {
  console.log("Strict AST Enforcer ready.");
}
