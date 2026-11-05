#!/usr/bin/env node
/**
 * agent-circuit-breaker.ts
 * Deterministic Circuit Breaker for Autonomous Agent Execution.
 * Tracks consecutive tool/command failures and halts execution if an agent
 * repeats an identical failing action >= 3 times, preventing infinite token burn.
 */

export interface ActionRecord {
  command: string;
  exitCode: number;
  timestamp: number;
}

export class AgentCircuitBreaker {
  private history: ActionRecord[] = [];
  private maxConsecutiveFailures: number;

  constructor(maxConsecutiveFailures: number = 3) {
    this.maxConsecutiveFailures = maxConsecutiveFailures;
  }

  public record(command: string, exitCode: number): { tripped: boolean; reason?: string } {
    this.history.push({ command, exitCode, timestamp: Date.now() });

    if (exitCode === 0) {
      // Successful execution resets the circuit breaker
      this.history = [];
      return { tripped: false };
    }

    // Check last N actions
    if (this.history.length >= this.maxConsecutiveFailures) {
      const recent = this.history.slice(-this.maxConsecutiveFailures);
      const allFailed = recent.every(r => r.exitCode !== 0);
      const allIdentical = recent.every(r => r.command.trim() === recent[0].command.trim());

      if (allFailed && allIdentical) {
        return {
          tripped: true,
          reason: `Circuit Breaker TRIPPED: Command "${recent[0].command}" failed ${this.maxConsecutiveFailures} consecutive times with non-zero exit codes.`
        };
      }
    }

    return { tripped: false };
  }

  public reset(): void {
    this.history = [];
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Agent Circuit Breaker Test ---');
  const breaker = new AgentCircuitBreaker(3);

  console.log('Simulating 2 failures...');
  breaker.record('pnpm test', 1);
  breaker.record('pnpm test', 1);
  console.log('Breaker status after 2 failures: OK (not tripped)');

  console.log('Simulating 3rd identical failure...');
  const res = breaker.record('pnpm test', 1);
  console.log(`Breaker status after 3rd failure: ${res.tripped ? 'TRIPPED' : 'OK'}`);
  console.log(`Reason: "${res.reason}"`);
}
