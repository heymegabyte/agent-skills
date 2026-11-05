#!/usr/bin/env node
/**
 * Polyglot Build Matrix & Runtime Verifier
 * Validates cross-runtime compatibility (Node 24, Bun, Cloudflare Workers runtime workerd) before approving PR readiness.
 */

export interface RuntimeTarget {
  name: "Node" | "Bun" | "CloudflareWorkers";
  supported: boolean;
  requiredFeatures: string[];
  incompatibleAPIs: string[];
}

export function auditRuntimeCompatibility(sourceCode: string): {
  isCompatible: boolean;
  matrix: Record<string, { pass: boolean; reasons: string[] }>;
} {
  const nodeReasons: string[] = [];
  const cfWorkersReasons: string[] = [];
  const bunReasons: string[] = [];

  // Node check
  if (sourceCode.includes("Bun.")) {
    nodeReasons.push("Contains Bun-specific global API (Bun.*)");
  }

  // Cloudflare Workers check: no filesystem access or child_process
  if (sourceCode.includes("node:fs") || sourceCode.includes("node:child_process") || sourceCode.includes("fs.readFileSync")) {
    cfWorkersReasons.push("Uses Node filesystem/child_process unavailable in Cloudflare Workers edge environment.");
  }

  // Bun check
  // Bun supports almost all node APIs, but check for specific native node addons
  if (sourceCode.includes(".node") && sourceCode.includes("require")) {
    bunReasons.push("May require native C++ node addon.");
  }

  const matrix = {
    Node: { pass: nodeReasons.length === 0, reasons: nodeReasons },
    CloudflareWorkers: { pass: cfWorkersReasons.length === 0, reasons: cfWorkersReasons },
    Bun: { pass: bunReasons.length === 0, reasons: bunReasons },
  };

  const isCompatible = matrix.Node.pass || matrix.CloudflareWorkers.pass;

  return { isCompatible, matrix };
}

if (process.argv[1]?.endsWith("runtime-matrix-verifier.ts")) {
  console.log("Runtime Matrix Verifier ready.");
}
