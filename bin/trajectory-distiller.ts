#!/usr/bin/env node
/**
 * Trajectory Rollout Distiller & Compactor
 * Distills verbose execution logs into structured semantic summaries saving up to 90% context.
 */

export interface RawTrajectoryStep {
  stepIndex: number;
  toolName: string;
  arguments: Record<string, unknown>;
  output: string;
  error?: string;
}

export interface DistilledSummary {
  totalSteps: number;
  toolsUsed: string[];
  keyActions: string[];
  encounteredErrors: string[];
  outcomeSummary: string;
  estimatedTokensSaved: number;
}

export function distillTrajectory(steps: RawTrajectoryStep[]): DistilledSummary {
  const toolsUsedSet = new Set<string>();
  const keyActions: string[] = [];
  const errors: string[] = [];
  let totalRawChars = 0;

  for (const step of steps) {
    toolsUsedSet.add(step.toolName);
    totalRawChars += (step.output || "").length + JSON.stringify(step.arguments).length;

    if (step.error) {
      errors.push(`Step ${step.stepIndex} (${step.toolName}): ${step.error.slice(0, 100)}`);
    }

    if (step.toolName === "write_file" || step.toolName === "edit_file") {
      const p = (step.arguments.Path as string) || "unknown";
      keyActions.push(`Modified file ${p.split("/").pop()}`);
    } else if (step.toolName === "run_command") {
      const cmd = (step.arguments.CommandLine as string) || "";
      keyActions.push(`Ran command '${cmd.slice(0, 50)}'`);
    }
  }

  const outcome = errors.length === 0
    ? "Trajectory executed cleanly with no fatal errors."
    : `Trajectory encountered ${errors.length} recoverable errors before completion.`;

  const compressedChars = keyActions.join("; ").length + errors.join("; ").length;
  const charsSaved = Math.max(0, totalRawChars - compressedChars);
  const estimatedTokensSaved = Math.round(charsSaved / 4);

  return {
    totalSteps: steps.length,
    toolsUsed: Array.from(toolsUsedSet),
    keyActions: keyActions.slice(0, 10),
    encounteredErrors: errors.slice(0, 5),
    outcomeSummary: outcome,
    estimatedTokensSaved,
  };
}

if (process.argv[1]?.endsWith("trajectory-distiller.ts")) {
  console.log("Trajectory Distiller ready.");
}
