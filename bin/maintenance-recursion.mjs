const KINDS = new Set(['maintenance', 'learning', 'triad-sync', 'improvement', 'prompt-hook']);

export function normalizeMaintenanceTrigger(input = {}) {
  const triggerId = typeof input.triggerId === 'string' ? input.triggerId.trim() : '';
  const inferredKind = triggerId.includes(':') ? triggerId.split(':', 1)[0] : 'maintenance';
  const kind = KINDS.has(input.kind) ? input.kind : (KINDS.has(inferredKind) ? inferredKind : 'maintenance');
  const evidenceRevision = typeof input.evidenceRevision === 'string' && input.evidenceRevision.trim()
    ? input.evidenceRevision.trim()
    : (triggerId.includes(':') ? triggerId.slice(triggerId.indexOf(':') + 1) : 'unversioned');
  const depth = Number.isInteger(input.depth) ? input.depth : (Number.isInteger(input.recursionDepth) ? input.recursionDepth : 0);
  const covered = [
    ...(Array.isArray(input.coveredTriggerIds) ? input.coveredTriggerIds : []),
    ...(Array.isArray(input.coveredIdentities) ? input.coveredIdentities : []),
  ].filter((value) => typeof value === 'string' && value.trim());
  const identity = `${kind}@${evidenceRevision}#${triggerId}`;
  return { kind, evidenceRevision, triggerId, identity, depth, covered: [...new Set(covered)] };
}

export function evaluateMaintenanceAdmission(input = {}, activeIdentity = '') {
  const trigger = normalizeMaintenanceTrigger(input);
  if (!trigger.triggerId) return { ...trigger, admitted: true, reason: 'not-maintenance' };
  if (trigger.depth > 4) return { ...trigger, admitted: false, reason: 'recursion-depth-exceeded' };
  const equivalentCovered = trigger.covered.includes(trigger.identity) || trigger.covered.includes(trigger.triggerId);
  if (equivalentCovered || (trigger.depth > 0 && activeIdentity === trigger.identity)) return { ...trigger, admitted: false, reason: 'equivalent-trigger-covered' };
  return { ...trigger, admitted: true, reason: 'new-trigger-or-evidence' };
}
