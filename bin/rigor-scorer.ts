#!/usr/bin/env node
/**
 * rigor-scorer.ts
 * RigorBench Engineering Process & Discipline Scorer.
 * Evaluates an agent's execution trajectory against rigorous software engineering standards:
 * - Trajectory step efficiency (<= 20 steps)
 * - TDD Red-Green verification
 * - Deterministic proof of life
 * - Clean git working tree
 * - SITREP compliance
 */

export interface TrajectoryEvaluationInput {
  totalSteps: number;
  hasFailingTestFirst: boolean;
  hasPassingTestFinal: boolean;
  gitClean: boolean;
  hasSitrep: boolean;
  zeroAnyViolations: boolean;
}

export interface RigorScoreReport {
  score: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'F';
  metrics: {
    name: string;
    pointsEarned: number;
    maxPoints: number;
    passed: boolean;
  }[];
}

export function evaluateRigor(input: TrajectoryEvaluationInput): RigorScoreReport {
  const metrics = [
    {
      name: 'Trajectory Step Efficiency (<= 20 steps)',
      pointsEarned: input.totalSteps <= 10 ? 25 : input.totalSteps <= 20 ? 20 : 5,
      maxPoints: 25,
      passed: input.totalSteps <= 20
    },
    {
      name: 'Test-Driven Red-Green Cycle',
      pointsEarned: input.hasFailingTestFirst && input.hasPassingTestFinal ? 25 : input.hasPassingTestFinal ? 15 : 0,
      maxPoints: 25,
      passed: input.hasPassingTestFinal
    },
    {
      name: 'Strict Type Discipline (Zero any)',
      pointsEarned: input.zeroAnyViolations ? 20 : 0,
      maxPoints: 20,
      passed: input.zeroAnyViolations
    },
    {
      name: 'Standardized 9-Line SITREP Ingestion',
      pointsEarned: input.hasSitrep ? 15 : 0,
      maxPoints: 15,
      passed: input.hasSitrep
    },
    {
      name: 'Zero Git Working Tree Residue',
      pointsEarned: input.gitClean ? 15 : 0,
      maxPoints: 15,
      passed: input.gitClean
    }
  ];

  const score = metrics.reduce((acc, m) => acc + m.pointsEarned, 0);
  let grade: RigorScoreReport['grade'] = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 50) grade = 'C';

  return {
    score,
    grade,
    metrics
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- RigorBench Process Scorer Test ---');
  const sampleInput: TrajectoryEvaluationInput = {
    totalSteps: 8,
    hasFailingTestFirst: true,
    hasPassingTestFinal: true,
    gitClean: true,
    hasSitrep: true,
    zeroAnyViolations: true
  };

  const report = evaluateRigor(sampleInput);
  console.log(`Process Score: ${report.score}/100 [GRADE: ${report.grade}]`);
  report.metrics.forEach(m => {
    const sym = m.passed ? '✓' : '✗';
    console.log(`  ${sym} ${m.name.padEnd(45)}: ${m.pointsEarned}/${m.maxPoints} pts`);
  });
}
