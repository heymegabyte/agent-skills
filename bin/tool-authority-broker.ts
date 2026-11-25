import { createHash, timingSafeEqual } from 'node:crypto';

export type ToolDecision = 'allow' | 'deny' | 'rate-limited';
export interface ToolAuthorityReceipt { id: string; runId: string; actorId: string; risks: string[]; expiresAt: string; evidence: string }
export interface ToolCall { runId: string; actorId: string; companyId: string; projectId?: string; issueId?: string; toolId: string; schemaHash: string; risk: string; arguments: unknown; at: string; authorityReceipt?: ToolAuthorityReceipt }
export interface ToolPolicy { id: string; effect: 'allow' | 'deny'; toolId: string; actors?: string[]; projects?: string[]; risks?: string[]; argumentConditions?: Record<string, string | number | boolean>; rateLimit?: { calls: number; windowMs: number } }
export interface ToolProfile { gatewayId: string; tools: Array<{ toolId: string; schemaHash: string; policies: ToolPolicy[] }> }
export interface ToolDecisionRecord { decision: ToolDecision; reason: string; policyIds: string[]; argumentHash: string }

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  return JSON.stringify(value);
}
export function canonicalArgumentHash(value: unknown): string { return `sha256:${createHash('sha256').update(canonical(value)).digest('hex')}`; }
function conditionMatches(args: unknown, conditions: ToolPolicy['argumentConditions']): boolean {
  if (!conditions) return true;
  if (!args || typeof args !== 'object') return false;
  return Object.entries(conditions).every(([key, expected]) => (args as Record<string, unknown>)[key] === expected);
}

export class ToolAuthorityBroker {
  private profile?: ToolProfile;
  private calls = new Map<string, number[]>();
  syncProfile(profile: ToolProfile): void {
    const ids = profile.tools.flatMap(t => t.policies.map(p => p.id));
    if (new Set(ids).size !== ids.length) throw new Error('duplicate policy id');
    this.profile = structuredClone(profile);
  }
  evaluate(call: ToolCall, options: { sideEffects?: boolean } = {}): ToolDecisionRecord {
    const argumentHash = canonicalArgumentHash(call.arguments);
    if (['auth-security', 'payments', 'destructive-operation', 'external-authority'].includes(call.risk)) {
      const receipt = call.authorityReceipt;
      const authorized = receipt && receipt.runId === call.runId && receipt.actorId === call.actorId && receipt.risks.includes(call.risk) && receipt.evidence.trim() && Date.parse(call.at) < Date.parse(receipt.expiresAt);
      if (!authorized) return { decision: 'deny', reason: 'protected-risk-authority-required', policyIds: [], argumentHash };
    }
    const tool = this.profile?.tools.find(t => t.toolId === call.toolId);
    if (!tool || tool.schemaHash !== call.schemaHash) return { decision: 'deny', reason: tool ? 'schema-drift' : 'default-deny', policyIds: [], argumentHash };
    const matches = tool.policies.filter(p => p.toolId === call.toolId && (!p.actors || p.actors.includes(call.actorId)) && (!p.projects || (!!call.projectId && p.projects.includes(call.projectId))) && (!p.risks || p.risks.includes(call.risk)) && conditionMatches(call.arguments, p.argumentConditions));
    const deny = matches.find(p => p.effect === 'deny');
    if (deny) return { decision: 'deny', reason: 'explicit-deny', policyIds: [deny.id], argumentHash };
    const allow = matches.find(p => p.effect === 'allow');
    if (!allow) return { decision: 'deny', reason: 'default-deny', policyIds: [], argumentHash };
    if (allow.rateLimit) {
      const now = Date.parse(call.at); const key = `${allow.id}\0${call.actorId}`;
      const recent = (this.calls.get(key) ?? []).filter(t => t > now - allow.rateLimit!.windowMs);
      if (recent.length >= allow.rateLimit.calls) return { decision: 'rate-limited', reason: 'rate-limit', policyIds: [allow.id], argumentHash };
      if (options.sideEffects !== false) this.calls.set(key, [...recent, now]);
    }
    return { decision: 'allow', reason: 'scoped-policy', policyIds: [allow.id], argumentHash };
  }
  simulate(candidate: ToolProfile, calls: ToolCall[]): Array<{ callHash: string; before: ToolDecision; after: ToolDecision }> {
    const original = this.profile; const results = calls.map(call => {
      this.profile = original; const before = this.evaluate(call, { sideEffects: false }).decision;
      this.profile = candidate; const after = this.evaluate(call, { sideEffects: false }).decision;
      return { callHash: canonicalArgumentHash(call), before, after };
    }).filter(result => result.before !== result.after).sort((a, b) => a.callHash.localeCompare(b.callHash));
    this.profile = original; return results;
  }
}

export interface SecretGrant { alias: string; runId: string; actorId: string; minimumTrust: number; expiresAt: string }
export class JitSecretBroker {
  private grants = new Map<string, SecretGrant>(); private values = new Map<string, string>();
  readonly audit: Array<{ alias: string; runId: string; allowed: boolean; reason: string; at: string }> = [];
  register(alias: string, value: string): void { this.values.set(alias, value); }
  grant(grant: SecretGrant): void { this.grants.set(`${grant.runId}\0${grant.alias}`, structuredClone(grant)); }
  read(input: { alias: string; runId: string; actorId: string; trust: number; at: string }): string | undefined {
    const grant = this.grants.get(`${input.runId}\0${input.alias}`); let reason = 'granted';
    if (!grant) reason = 'no-grant'; else if (grant.actorId !== input.actorId) reason = 'actor-mismatch'; else if (Date.parse(input.at) >= Date.parse(grant.expiresAt)) reason = 'expired'; else if (input.trust < grant.minimumTrust) reason = 'insufficient-trust'; else if (!this.values.has(input.alias)) reason = 'unknown-alias';
    const allowed = reason === 'granted'; this.audit.push({ alias: input.alias, runId: input.runId, allowed, reason, at: input.at });
    return allowed ? this.values.get(input.alias) : undefined;
  }
}

export interface TrustEnvelope { actorId: string; toolId: string; schemaHash: string; argumentHash: string; risk: string; expiresAt: string }
export function promoteTrust(call: ToolCall, evidence: { verifiedCalls: number; regressions: number; minimumVerifiedCalls: number }, expiresAt: string): TrustEnvelope | undefined {
  if (evidence.regressions > 0 || evidence.verifiedCalls < evidence.minimumVerifiedCalls || Date.parse(expiresAt) <= Date.parse(call.at)) return undefined;
  return { actorId: call.actorId, toolId: call.toolId, schemaHash: call.schemaHash, argumentHash: canonicalArgumentHash(call.arguments), risk: call.risk, expiresAt };
}
export function trustAuthorizes(envelope: TrustEnvelope, call: ToolCall, health: { anomaly: boolean; sloBurn: boolean; regression: boolean }): boolean {
  if (health.anomaly || health.sloBurn || health.regression || Date.parse(call.at) >= Date.parse(envelope.expiresAt)) return false;
  const equal = (a: string, b: string) => { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); };
  return envelope.actorId === call.actorId && envelope.toolId === call.toolId && envelope.schemaHash === call.schemaHash && envelope.risk === call.risk && equal(envelope.argumentHash, canonicalArgumentHash(call.arguments));
}
