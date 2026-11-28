#!/usr/bin/env node
// Advisory dependency waves for prompt hydration. Execution is owned by the evidence-gated coordinator.
import { conveneScrumQuorum, type DagTaskNode, type SwarmHarness } from './scrum-deliberation-quorum.ts';
import { isCliEntrypoint } from './cli-entrypoint.ts';

export interface SwarmWave {
  waveIndex: number;
  parallelWorkers: Array<{
    taskId: string;
    title: string;
    harness: SwarmHarness;
    worktreeSlot: string;
    portLease: number;
    ownedFiles: string[];
  }>;
}

export interface MultiSwarmExecutionManifest {
  planningOnly: true;
  executionEntrypoint: string;
  prompt: string;
  scrumMeetingId: string;
  top15StrategiesEnabled: string[];
  waves: SwarmWave[];
  offloadSummary: {
    totalTasks: number;
    opencodeDeepseekTasks: number;
    frontierTriadTasks: number;
    offloadRatio: number;
  };
  finishLineChecklist: {
    unitCoverageTarget: '100%';
    e2eEngine: '@cloudflare/playwright (Cloudflare Browser Run)';
    e2eBreakpoints: number[];
    gitTargetBranch: 'main';
    cloudflareDeployAndDomainVerify: boolean;
    triadSync: string[];
  };
}

export const TOP_15_SWARM_STRATEGIES: string[] = [
  '1. Zero-Latency UserPromptSubmit Hyper-Saturation & Codebase Gap Audit',
  '2. Recursive Categorical Web-Research Saturation & Parallel Plugin-Catalog Factory',
  '3. Dynamic Right-Sized SCRUM Deliberation Quorum (Minimum Required Specialists)',
  '4. Heterogeneous Tri-Frontier Cognitive Division (Claude + Codex + Gemini)',
  '5. Contract-First OpenSpec DAG Compiler (Locked Zod/Hono/OpenAPI Schemas)',
  '6. OpenCode with DeepSeek via LiteLLM for suitable bounded changes',
  '7. Pre-Warmed Ephemeral Git Worktree Pool with Zero-Copy Symlink Hydration',
  '8. Deterministic Per-Worktree Port & Local D1/Miniflare Resource Leasing',
  '9. Independent review for critical-path changes',
  '10. Mid-Task Altitude Downgrade (Frontier Contract Lock -> OpenCode DeepSeek Volume Finish)',
  '11. 28-Library @theme.tools/* Thin-Shell Extraction & Consumer Convergence Swarm',
  '12. Parallel Cloudflare Browser Run (@cloudflare/playwright) 6-Breakpoint x 16-State E2E Swarm',
  '13. Cross-Family Adversarial Verification & AST Import Boundary Merge Gate',
  '14. Continuous Parallel Context, Inline Comment & Documentation Enrichment Swarm',
  '15. Autonomous Production Finish Line (main Commit + CF Bindings + Domain SSL + CDN Purge + Triad Sync)',
];

export function compileSwarmWaves(tasks: DagTaskNode[]): SwarmWave[] {
  const completed = new Set<string>();
  const remaining = [...tasks];
  const waves: SwarmWave[] = [];
  let waveIndex = 1;

  while (remaining.length > 0) {
    const ready = remaining.filter((task) => task.dependsOn.every((dep) => completed.has(dep)));
    if (ready.length === 0) {
      throw new Error(`Cycle detected in OpenSpec DAG tasks: ${remaining.map((t) => t.id).join(', ')}`);
    }

    const parallelWorkers = ready.map((task) => ({
      taskId: task.id,
      title: task.title,
      harness: task.assignedHarness,
      worktreeSlot: task.worktreeSlot,
      portLease: task.portLease,
      ownedFiles: task.ownedFiles,
    }));

    waves.push({ waveIndex, parallelWorkers });
    for (const item of ready) {
      completed.add(item.id);
      const idx = remaining.findIndex((r) => r.id === item.id);
      if (idx !== -1) remaining.splice(idx, 1);
    }
    waveIndex += 1;
  }

  return waves;
}

export function planMultiSwarmExecution(prompt: string, missingSurfaces: string[] = []): MultiSwarmExecutionManifest {
  const scrum = conveneScrumQuorum(prompt, missingSurfaces);
  const waves = compileSwarmWaves(scrum.dagTasks);
  return {
    planningOnly: true,
    executionEntrypoint: 'bin/evidence-gated-orchestrator.ts',
    prompt,
    scrumMeetingId: scrum.meetingId,
    top15StrategiesEnabled: TOP_15_SWARM_STRATEGIES,
    waves,
    offloadSummary: {
      totalTasks: scrum.offloadMetrics.totalTasks,
      opencodeDeepseekTasks: scrum.offloadMetrics.opencodeDeepseekTasks,
      frontierTriadTasks: scrum.offloadMetrics.frontierTasks,
      offloadRatio: scrum.offloadMetrics.offloadPercentage / 100,
    },
    finishLineChecklist: {
      unitCoverageTarget: '100%',
      e2eEngine: '@cloudflare/playwright (Cloudflare Browser Run)',
      e2eBreakpoints: [320, 375, 768, 1024, 1440, 1920],
      gitTargetBranch: 'main',
      cloudflareDeployAndDomainVerify: true,
      triadSync: ['heymegabyte/agent-skills', 'heymegabyte/install.doctor', 'heymegabyte/theme.tools'],
    },
  };
}

if (isCliEntrypoint(import.meta.url)) {
  const prompt = process.argv.slice(2).join(' ') || 'Build full SaaS feature with plugin catalog, settings, and Cloudflare Browser Run E2E';
  console.log(JSON.stringify(planMultiSwarmExecution(prompt), null, 2));
}
