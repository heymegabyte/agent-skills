import { execFileSync } from 'node:child_process';
import type { PipelineAdapters } from './evidence-gated-orchestrator.ts';
import { readDevelopmentCommitExcerpts } from './local-development-worktree.ts';

type VerificationInput = Parameters<PipelineAdapters['verify']>[0];

export function createLocalDeliveryEvidence(options: {
  checkout: string;
  approvePath: (nodeId: string, path: string) => boolean;
  /** Host-approved files used by the frozen acceptance checks. */
  acceptancePaths?: (nodeId: string) => readonly string[];
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
      const checks = options.acceptancePaths?.(node.id) ?? [];
      if (!checks.length) continue;
      const acceptedRevision = execution.sourceDigestAfter;
      if (!acceptedRevision || execution.integration?.sourceDigest !== acceptedRevision) {
        throw new Error(`Delivery evidence requires a bound acceptance commit for ${node.id}`);
      }
      const baseline = readDevelopmentCommitExcerpts(options.checkout, contract.frozenBaseRevision, approved);
      for (const [path, content] of Object.entries(baseline)) {
        evidence.push([`${contract.frozenBaseRevision}:${path}`, content]);
      }
      const accepted = readDevelopmentCommitExcerpts(options.checkout, acceptedRevision, checks);
      const integrated = readDevelopmentCommitExcerpts(options.checkout, revision, checks);
      for (const path of checks) {
        if (!Object.hasOwn(accepted, path) || accepted[path] !== integrated[path]) {
          throw new Error(`Acceptance evidence is missing or differs after integration: ${path}`);
        }
        evidence.push([`acceptance:${acceptedRevision}:${path}`, accepted[path]]);
      }
    }
    return Object.fromEntries(evidence);
  };
}
