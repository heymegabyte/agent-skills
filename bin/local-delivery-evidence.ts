import { execFileSync } from 'node:child_process';
import type { PipelineAdapters } from './evidence-gated-orchestrator.ts';
import { readDevelopmentCommitExcerpts } from './local-development-worktree.ts';

type VerificationInput = Parameters<PipelineAdapters['verify']>[0];

export function createLocalDeliveryEvidence(options: {
  checkout: string;
  approvePath: (nodeId: string, path: string) => boolean;
}) {
  return async ({ contract, executions }: VerificationInput): Promise<Record<string, string>> => {
    const evidence: Array<[string, string]> = [];
    for (const node of contract.nodes) {
      const execution = executions.find(({ nodeId }) => nodeId === node.id);
      const revision = execution?.integration?.integratedRevision;
      if (execution?.status !== 'integrated' || !revision || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(revision)) {
        throw new Error(`Delivery evidence requires an integrated Git commit for ${node.id}`);
      }
      execFileSync('git', ['-C', options.checkout, '--no-replace-objects', 'merge-base', '--is-ancestor', revision, 'HEAD'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const approved = execution.changedFiles.filter((path) => options.approvePath(node.id, path));
      const excerpts = readDevelopmentCommitExcerpts(options.checkout, revision, approved);
      if (!Object.keys(excerpts).length) throw new Error(`No approved integrated source evidence for ${node.id}`);
      for (const [path, content] of Object.entries(excerpts)) evidence.push([`${revision}:${path}`, content]);
    }
    return Object.fromEntries(evidence);
  };
}
