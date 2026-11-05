#!/usr/bin/env node
/**
 * trajectory-governor.ts
 * Trajectory Step Budget Governor for Autonomous Agent Tasks.
 * Enforces strict step horizons (max 20 tool invocations per sub-task)
 * to prevent runaway trial-and-error loops, context degradation, and token blowouts.
 */

export interface StepRecord {
  step: number;
  tool: string;
  argsSummary: string;
  timestamp: number;
}

export class TrajectoryGovernor {
  private steps: StepRecord[] = [];
  private maxSteps: number;

  constructor(maxSteps: number = 20) {
    this.maxSteps = maxSteps;
  }

  public recordStep(tool: string, argsSummary: string = ''): { allowed: boolean; currentStep: number; warning?: string; haltReason?: string } {
    const currentStep = this.steps.length + 1;
    this.steps.push({
      step: currentStep,
      tool,
      argsSummary,
      timestamp: Date.now()
    });

    if (currentStep > this.maxSteps) {
      return {
        allowed: false,
        currentStep,
        haltReason: `TRAJECTORY HALT: Step budget exceeded (${currentStep}/${this.maxSteps}). Agent must checkpoint state and request Evaluator review.`
      };
    }

    if (currentStep >= this.maxSteps - 3) {
      return {
        allowed: true,
        currentStep,
        warning: `WARNING: Trajectory near ceiling (${currentStep}/${this.maxSteps} steps). Wrap up action or checkpoint.`
      };
    }

    return {
      allowed: true,
      currentStep
    };
  }

  public getHistory(): StepRecord[] {
    return [...this.steps];
  }

  public reset(): void {
    this.steps = [];
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Trajectory Governor Self-Test ---');
  const gov = new TrajectoryGovernor(5);

  for (let i = 1; i <= 6; i++) {
    const res = gov.recordStep(`tool_${i}`, `action_${i}`);
    console.log(`Step ${i}: allowed=${res.allowed} ${res.warning || ''} ${res.haltReason || ''}`);
  }
}
