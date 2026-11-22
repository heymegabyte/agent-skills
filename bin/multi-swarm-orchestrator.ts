#!/usr/bin/env node
/**
 * Multi-Swarm Parallel Orchestrator (Claude + Codex + Gemini + OpenCode DeepSeek).
 *
 * Implements the Top 15 parallel swarm orchestration strategies:
 * - Topological DAG wave compiler from OpenSpec task-graph.json
 * - Disjoint file-ownership verification across parallel worktrees
 * - Deterministic per-worktree port leasing (4100 + workerIndex * 10)
 * - Automatic 80%+ throughput-safe offload to OpenCode (DeepSeek via LiteLLM / opencode-deepseek.sh)
 * - Heterogeneous Tri-Frontier ensemble scheduling (Claude + Codex + Gemini)
 * - Speculative dual-harness racing on critical-path bottleneck nodes
 * - Parallel Cloudflare Browser Run (@cloudflare/playwright) E2E & 100% unit test gate
 */
import { conveneScrumQuorum, type DagTaskNode, type SwarmHarness } from './scrum-deliberation-quorum.ts';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface SwarmWave {
  waveIndex: number;
  parallelWorkers: Array<{
    taskId: string;
    title: string;
    harness: SwarmHarness;
    launcherCommand: string;
    worktreeSlot: string;
    portLease: number;
    ownedFiles: string[];
    speculativeChallenger?: {
      harness: SwarmHarness;
      worktreeSlot: string;
      portLease: number;
    };
  }>;
}

export interface MultiSwarmExecutionManifest {
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
  '6. Automatic 80%+ OpenCode (DeepSeek via LiteLLM 4-Key Pool) Swarm Offload Engine',
  '7. Pre-Warmed Ephemeral Git Worktree Pool with Zero-Copy Symlink Hydration',
  '8. Deterministic Per-Worktree Port & Local D1/Miniflare Resource Leasing',
  '9. Speculative Dual-Harness Racing on Critical-Path Bottleneck Nodes',
  '10. Mid-Task Altitude Downgrade (Frontier Contract Lock -> OpenCode DeepSeek Volume Finish)',
  '11. 28-Library @theme.tools/* Thin-Shell Extraction & Consumer Convergence Swarm',
  '12. Parallel Cloudflare Browser Run (@cloudflare/playwright) 6-Breakpoint x 16-State E2E Swarm',
  '13. Cross-Family Adversarial Verification & AST Import Boundary Merge Gate',
  '14. Continuous Parallel Context, Inline Comment & Documentation Enrichment Swarm',
  '15. Autonomous Production Finish Line (main Commit + CF Bindings + Domain SSL + CDN Purge + Triad Sync)',
];

function buildLauncherCommand(task: DagTaskNode): string {
  if (task.assignedHarness === 'opencode-deepseek') {
    return `~/.agentskills/bin/opencode-deepseek.sh run --model litellm/deepseek-v4-pro --worktree ${task.worktreeSlot} --port ${task.portLease} --task "${task.id}"`;
  }
  if (task.assignedHarness === 'claude') {
    return `~/.agentskills/bin/with-subscription-cli.sh claude --worktree ${task.worktreeSlot} -p "Execute OpenSpec task ${task.id}: ${task.title}"`;
  }
  if (task.assignedHarness === 'codex') {
    return `~/.agentskills/bin/with-subscription-cli.sh codex exec --cd .worktrees/${task.worktreeSlot} "Execute OpenSpec task ${task.id}: ${task.title}"`;
  }
  return `gemini -p "Execute OpenSpec task ${task.id} in .worktrees/${task.worktreeSlot}: ${task.title}"`;
}

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
      launcherCommand: buildLauncherCommand(task),
      worktreeSlot: task.worktreeSlot,
      portLease: task.portLease,
      ownedFiles: task.ownedFiles,
      ...(waveIndex === 1 && task.classification === 'frontier-required'
        ? {
            speculativeChallenger: {
              harness: 'codex' as SwarmHarness,
              worktreeSlot: `${task.worktreeSlot}-challenger`,
              portLease: task.portLease + 5,
            },
          }
        : {}),
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

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const prompt = process.argv.slice(2).join(' ') || 'Build full SaaS feature with plugin catalog, settings, and Cloudflare Browser Run E2E';
  console.log(JSON.stringify(planMultiSwarmExecution(prompt), null, 2));
}
