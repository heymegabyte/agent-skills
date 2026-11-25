import { digest } from './orchestration-run-state.ts';

export const ELIGIBLE_ARCHITECT_FAMILIES = ['claude', 'codex', 'gemini', 'antigravity'] as const;
export interface ArchitectAssignment { assignmentId: string; changeId: string; architectId: string; modelFamily: string; assignedBy: string; authorityEvidence: string; assignedAt: string; status: string; digest: string }
export interface TrustedAuthorityEvidence { source: 'host-user-message' | 'repository-owner-record' | 'approved-governance-record'; changeId: string; assignedBy: string; evidenceDigest: string }

export function validateArchitectAssignment(assignment: ArchitectAssignment, expectedChangeId: string, trusted: TrustedAuthorityEvidence): void {
  if (!assignment || typeof assignment !== 'object') throw new Error('architect assignment receipt is required');
  if (assignment.changeId !== expectedChangeId) throw new Error('architect assignment is not bound to this change');
  if (!(ELIGIBLE_ARCHITECT_FAMILIES as readonly string[]).includes(assignment.modelFamily)) throw new Error('ineligible architect model family');
  if (!assignment.assignmentId.trim() || !assignment.architectId.trim() || !assignment.assignedBy.trim() || !assignment.authorityEvidence.trim()) throw new Error('architect assignment lacks explicit authority evidence');
  if (assignment.status !== 'active' || Number.isNaN(Date.parse(assignment.assignedAt))) throw new Error('architect assignment is not active and dated');
  if (!trusted || trusted.changeId !== expectedChangeId || trusted.assignedBy !== assignment.assignedBy || trusted.evidenceDigest !== digest(assignment.authorityEvidence)) throw new Error('architect assignment lacks matching trusted authority evidence');
  const { digest: suppliedDigest, ...payload } = assignment;
  if (digest(payload) !== suppliedDigest) throw new Error('architect assignment digest mismatch');
}

export function createArchitectAssignment(input: Omit<ArchitectAssignment, 'digest' | 'status'>, trusted: TrustedAuthorityEvidence): ArchitectAssignment {
  const payload = { ...input, status: 'active' };
  const assignment = { ...payload, digest: digest(payload) };
  validateArchitectAssignment(assignment, input.changeId, trusted);
  return assignment;
}
