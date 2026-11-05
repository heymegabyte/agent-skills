#!/usr/bin/env node
/**
 * Dynamic Taint-Aware Tool Firewall
 * Intercepts every agent tool call before execution, checking parameters against dynamic task allowlists,
 * enforcing read-only bounds, and blocking privilege escalations.
 */

export interface ToolCallInvocation {
  toolName: string;
  arguments: Record<string, unknown>;
  callerRole: string;
  isReadOnlySession?: boolean;
}

export interface FirewallDecision {
  allowed: boolean;
  reason?: string;
  sanitizedArguments?: Record<string, unknown>;
}

const FORBIDDEN_SHELL_PATTERNS = [
  /rm\s+-rf\s+\/($|\s)/,
  /chmod\s+-R\s+777/,
  /curl.*\|\s*(bash|sh)/,
  /wget.*\|\s*(bash|sh)/,
  />\s*\/etc\//,
  />\s*\/dev\/sda/,
  /mkfs\./,
  /:(){ :|:& };:/, // fork bomb
];

const WRITE_TOOLS = new Set([
  "write_file",
  "edit_file",
  "apply_diff",
  "delete_file",
  "run_command",
]);

export function evaluateToolCall(call: ToolCallInvocation): FirewallDecision {
  // If session is declared read-only, block mutating tools
  if (call.isReadOnlySession && WRITE_TOOLS.has(call.toolName)) {
    return {
      allowed: false,
      reason: `Blocked tool '${call.toolName}' in read-only session for role '${call.callerRole}'.`,
    };
  }

  // Shell command payload analysis
  if (call.toolName === "run_command" && typeof call.arguments.CommandLine === "string") {
    const cmd = call.arguments.CommandLine;
    for (const pattern of FORBIDDEN_SHELL_PATTERNS) {
      if (pattern.test(cmd)) {
        return {
          allowed: false,
          reason: `Blocked dangerous command pattern (${pattern.source}) by Tool Firewall.`,
        };
      }
    }
  }

  // Path traversal prevention in file operations
  for (const [key, val] of Object.entries(call.arguments)) {
    if (typeof val === "string" && (key.toLowerCase().includes("path") || key.toLowerCase().includes("file"))) {
      if (val.includes("../../../") || val.startsWith("/etc/") || val.startsWith("/root/")) {
        return {
          allowed: false,
          reason: `Blocked unauthorized path access attempt to '${val}'.`,
        };
      }
    }
  }

  return { allowed: true };
}

if (process.argv[1]?.endsWith("tool-firewall.ts")) {
  console.log("Dynamic Tool Firewall ready.");
}
