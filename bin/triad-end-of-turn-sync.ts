#!/usr/bin/env node
/**
 * @file bin/triad-end-of-turn-sync.ts
 * @description Parallel End-of-Turn Triad Synchronizer (`agent-skills`, `install.doctor`,
 * `theme.tools`, plus any additional repositories). Validates all specified OpenSpec changes
 * in parallel and registers/updates their linked issues in Paperclip (`ubuntu.megabyte.space`).
 */

import {
  syncChangeToPaperclip,
  validateOpenSpecChange,
  type OpenSpecValidationResult,
} from './openspec-paperclip-sync.ts';

export interface TriadSyncTarget {
  repoPath: string;
  repoName: string;
  changeId: string;
}

export const DEFAULT_TRIAD_TARGETS: TriadSyncTarget[] = [
  {
    repoPath: '/Users/Apple/emdash/repositories/agent-skills',
    repoName: 'agent-skills',
    changeId: 'total-convergence-openspec-paperclip-triad',
  },
  {
    repoPath: '/Users/Apple/emdash/repositories/install.doctor',
    repoName: 'install.doctor',
    changeId: 'triad-convergence-langfuse-resilience',
  },
  {
    repoPath: '/Users/Apple/emdash/repositories/theme.tools',
    repoName: 'theme.tools',
    changeId: 'widget-micro-loop-convergence-and-visual-states',
  },
  {
    repoPath: '/Users/Apple/emdash/repositories/legion.megabyte.space',
    repoName: 'legion.megabyte.space',
    changeId: 'workstation-triad-convergence-and-langfuse-failopen',
  },
];

export async function runParallelTriadSync(
  targets: TriadSyncTarget[] = DEFAULT_TRIAD_TARGETS,
  options: { dryRun?: boolean } = {},
): Promise<
  Array<{
    target: TriadSyncTarget;
    validation: OpenSpecValidationResult;
    sync: ReturnType<typeof syncChangeToPaperclip>;
  }>
> {
  return Promise.all(
    targets.map(async (target) => {
      const validation = validateOpenSpecChange(
        target.repoPath,
        target.changeId,
        target.repoName,
      );
      const sync = syncChangeToPaperclip(validation, { dryRun: options.dryRun });
      return { target, validation, sync };
    }),
  );
}

if (process.argv[1]?.endsWith('triad-end-of-turn-sync.ts') || (import.meta as { main?: boolean }).main) {
  const dryRun = process.argv.includes('--dry-run');
  runParallelTriadSync(DEFAULT_TRIAD_TARGETS, { dryRun })
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
      const allValid = results.every((r) => r.validation.valid && r.sync.synced);
      process.exit(allValid ? 0 : 1);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
