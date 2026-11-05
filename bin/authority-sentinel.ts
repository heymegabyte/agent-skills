#!/usr/bin/env node
/**
 * Authority Shift Activations Sentinel
 * Inspects agent prompt and reasoning chains for authority hijack patterns and aborts tainted trajectories.
 */

export interface AuthorityAuditResult {
  isCompromised: boolean;
  threatLevel: "NONE" | "LOW" | "HIGH" | "CRITICAL";
  detectedSignatures: string[];
  actionRecommendation: "PROCEED" | "QUARANTINE" | "TERMINATE";
}

const HIJACK_SIGNATURES: { pattern: RegExp; severity: "LOW" | "HIGH" | "CRITICAL"; name: string }[] = [
  { pattern: /ignore\s+(all\s+)?(previous\s+)?(instructions|directives|prompts)/i, severity: "CRITICAL", name: "Instruction Reset Directive" },
  { pattern: /you\s+are\s+now\s+(in\s+)?(developer\s+mode|dan\s+mode|god\s+mode|unrestricted)/i, severity: "CRITICAL", name: "Role Hijack Injection" },
  { pattern: /disregard\s+(the\s+)?(above|rules|safety|guidelines)/i, severity: "HIGH", name: "Disregard Directives" },
  { pattern: /system\s+prompt\s+override/i, severity: "CRITICAL", name: "System Override Attempt" },
  { pattern: /new\s+system\s+message:\s*you\s+must/i, severity: "CRITICAL", name: "Fake System Boundary Insertion" },
  { pattern: /from\s+now\s+on\s+you\s+will\s+act\s+as/i, severity: "HIGH", name: "Persona Drift Coercion" },
];

export function auditAuthorityStream(text: string): AuthorityAuditResult {
  const detected: string[] = [];
  let highestSeverity: "NONE" | "LOW" | "HIGH" | "CRITICAL" = "NONE";

  for (const sig of HIJACK_SIGNATURES) {
    if (sig.pattern.test(text)) {
      detected.push(sig.name);
      if (sig.severity === "CRITICAL") highestSeverity = "CRITICAL";
      else if (sig.severity === "HIGH" && highestSeverity !== "CRITICAL") highestSeverity = "HIGH";
      else if (highestSeverity === "NONE") highestSeverity = "LOW";
    }
  }

  let action: "PROCEED" | "QUARANTINE" | "TERMINATE" = "PROCEED";
  if (highestSeverity === "CRITICAL") action = "TERMINATE";
  else if (highestSeverity === "HIGH") action = "QUARANTINE";

  return {
    isCompromised: highestSeverity === "CRITICAL" || highestSeverity === "HIGH",
    threatLevel: highestSeverity,
    detectedSignatures: detected,
    actionRecommendation: action,
  };
}

if (process.argv[1]?.endsWith("authority-sentinel.ts")) {
  console.log("Authority Sentinel ready.");
}
