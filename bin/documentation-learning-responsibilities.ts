import { createHash } from 'node:crypto';

export interface ConcurrentResponsibility {
  kind: 'documentation' | 'learning';
  applicability: 'required' | 'not-applicable';
  targets: string[];
  acceptance: string[];
}
export interface ConcurrentResponsibilityPlan { behavioralChange: boolean; responsibilities: [ConcurrentResponsibility, ConcurrentResponsibility] }
export interface ConcurrentResponsibilityReceipt {
  kind: 'documentation' | 'learning';
  status: 'updated' | 'verified-no-change' | 'blocked';
  targets: string[];
  evidenceIds: string[];
  obsoleteGuidanceRemoved: string[];
  rationale: string;
  sourceRevision: string;
  recordedAt: string;
  receiptDigest: string;
}

const digest = (value: unknown): string => `sha256:${createHash('sha256').update(JSON.stringify(value, Object.keys(value as object).sort())).digest('hex')}`;
export function planConcurrentResponsibilities(input: { affectedPaths: readonly string[]; behavioralChange?: boolean; documentationPaths?: readonly string[]; learningScope?: string }): ConcurrentResponsibilityPlan {
  const behavioralChange = input.behavioralChange ?? input.affectedPaths.some((path) => /(?:^|\/)(?:src|bin|lib|packages|schemas)\//.test(path) || /\.(?:ts|tsx|js|mjs|py|sh|json)$/.test(path));
  return { behavioralChange, responsibilities: [
    { kind: 'documentation', applicability: behavioralChange ? 'required' : 'not-applicable', targets: [...new Set(input.documentationPaths?.length ? input.documentationPaths : ['nearest canonical skill or control-plane documentation'])], acceptance: ['Update affected guidance or record verified-no-change.', 'Remove guidance made obsolete by the behavior change.', 'Keep executable examples aligned with runtime behavior.'] },
    { kind: 'learning', applicability: behavioralChange ? 'required' : 'not-applicable', targets: [input.learningScope ?? 'scoped learning router'], acceptance: ['Route reusable procedure, project fact, or preference to its canonical destination.', 'Record provenance/confidence/revision or verified-no-change.', 'Reject secrets and private context.'] },
  ] };
}
export function issueConcurrentResponsibilityReceipt(input: Omit<ConcurrentResponsibilityReceipt, 'receiptDigest'>): ConcurrentResponsibilityReceipt {
  if (!input.targets.length || !input.evidenceIds.length || !input.rationale.trim() || !/^[a-f0-9]{40}$/.test(input.sourceRevision)) throw new Error(`${input.kind} receipt is incomplete`);
  const receiptDigest = digest(input); return { ...input, receiptDigest };
}
export function verifyConcurrentResponsibilityReceipts(plan: ConcurrentResponsibilityPlan, receipts: readonly ConcurrentResponsibilityReceipt[]): void {
  for (const responsibility of plan.responsibilities) {
    if (responsibility.applicability !== 'required') continue;
    const receipt = receipts.find((candidate) => candidate.kind === responsibility.kind);
    if (!receipt) throw new Error(`missing ${responsibility.kind} receipt`);
    const { receiptDigest, ...payload } = receipt;
    if (digest(payload) !== receiptDigest) throw new Error(`${responsibility.kind} receipt digest mismatch`);
    if (receipt.status === 'blocked') throw new Error(`${responsibility.kind} responsibility is blocked`);
    if (receipt.status === 'updated' && !receipt.targets.length) throw new Error(`${responsibility.kind} update requires targets`);
    if (receipt.status === 'verified-no-change' && receipt.obsoleteGuidanceRemoved.length) throw new Error(`${responsibility.kind} no-change receipt contradicts removals`);
  }
}
