import { DatabaseSync } from 'node:sqlite';

export type WorkClass = 'committed' | 'repair' | 'optional';
export interface WorkCandidate { id: string; companyId: string; projectId: string; agentId: string; provider: string; repository: string; class: WorkClass; priority: number; expectedValue: number; urgency: number; risk: number; estimatedCost: number; dependencyReadiness: number; capacityFit: number; deadlineAt?: string; verification: number; novelty: number; reversibility: number; evidence: number; createdAt: string; protectedEffect?: 'auth-security' | 'payments' | 'destructive-operation' | 'external-authority'; authorityEvidence?: string; riskReviewEvidence?: string[] }
export interface AdmissionLimits { company: number; project: number; agent: number; provider: number; repository: number }
export interface ReliabilityState { incident: boolean; errorBudgetBurn: number; burnThreshold: number }
export interface AdmissionExplanation { admitted: boolean; score: number; reason: string; expansionAllowed: boolean }

export function score(candidate: WorkCandidate, now: string): number {
  const deadline = candidate.deadlineAt ? Math.max(0, 1 - Math.max(0, Date.parse(candidate.deadlineAt) - Date.parse(now)) / 86_400_000) : 0;
  const ageBoost = Math.min(200, Math.max(0, Date.parse(now) - Date.parse(candidate.createdAt)) / 86_400_000);
  const commitment = candidate.class === 'committed' ? 1000 : candidate.class === 'repair' ? 900 : 0;
  return commitment + ageBoost + candidate.priority * 10 + candidate.expectedValue * 8 + candidate.urgency * 6 + deadline * 8 + candidate.dependencyReadiness * 5 + candidate.capacityFit * 4 + candidate.verification * 5 - candidate.risk * 7 - candidate.estimatedCost * 3;
}
export function expansionAllowed(candidate: WorkCandidate, reliability: ReliabilityState): boolean {
  return !reliability.incident && reliability.errorBudgetBurn < reliability.burnThreshold && candidate.evidence >= .8 && candidate.expectedValue >= .7 && candidate.novelty >= .6 && candidate.reversibility >= .7 && candidate.verification >= .8;
}

export class DurableWorkLedger {
  readonly db: DatabaseSync;
  constructor(db: DatabaseSync) {
    this.db = db;
    db.exec(`CREATE TABLE IF NOT EXISTS work_items(id TEXT PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL, score REAL NOT NULL, explanation TEXT NOT NULL, lease_owner TEXT, lease_until TEXT, attempts INTEGER NOT NULL DEFAULT 0, acknowledged_at TEXT);
      CREATE TABLE IF NOT EXISTS work_outbox(event_id TEXT PRIMARY KEY, work_id TEXT NOT NULL, kind TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending', lease_owner TEXT, lease_until TEXT, acknowledged_at TEXT);
      CREATE INDEX IF NOT EXISTS work_ready ON work_items(state, score DESC);`);
  }
  enqueue(candidate: WorkCandidate, explanation: AdmissionExplanation): boolean {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const changed = this.db.prepare(`INSERT OR IGNORE INTO work_items(id,payload,state,score,explanation) VALUES(?,?,'queued',?,?)`).run(candidate.id, JSON.stringify(candidate), explanation.score, JSON.stringify(explanation)).changes === 1;
      if (changed) this.db.prepare(`INSERT INTO work_outbox(event_id,work_id,kind) VALUES(?,?,'work.queued')`).run(`queued:${candidate.id}`, candidate.id);
      this.db.exec('COMMIT'); return changed;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  lease(owner: string, now: string, leaseMs: number): WorkCandidate | undefined {
    const until = new Date(Date.parse(now) + leaseMs).toISOString(); this.db.exec('BEGIN IMMEDIATE');
    try {
      const row = this.db.prepare(`SELECT * FROM work_items WHERE state='queued' OR (state='leased' AND lease_until < ?) ORDER BY score DESC,id LIMIT 1`).get(now) as any;
      if (row) this.db.prepare(`UPDATE work_items SET state='leased',lease_owner=?,lease_until=?,attempts=attempts+1 WHERE id=?`).run(owner, until, row.id);
      this.db.exec('COMMIT'); return row ? JSON.parse(row.payload) : undefined;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  acknowledge(id: string, owner: string): void { this.db.prepare(`UPDATE work_items SET state='acknowledged',acknowledged_at=?,lease_owner=NULL,lease_until=NULL WHERE id=? AND lease_owner=?`).run(new Date().toISOString(), id, owner); }
  cancel(id: string): void { this.db.prepare(`UPDATE work_items SET state='cancelled',lease_owner=NULL,lease_until=NULL WHERE id=? AND state!='acknowledged'`).run(id); }
  replay(id: string): void { this.db.prepare(`UPDATE work_items SET state='queued',lease_owner=NULL,lease_until=NULL WHERE id=? AND state NOT IN ('acknowledged','cancelled')`).run(id); }
  inspect(): Array<{ id: string; state: string; score: number; explanation: AdmissionExplanation; attempts: number }> { return (this.db.prepare(`SELECT id,state,score,explanation,attempts FROM work_items ORDER BY score DESC,id`).all() as any[]).map(r => ({ ...r, explanation: JSON.parse(r.explanation) })); }
  leaseOutbox(owner: string, now: string, leaseMs: number, limit = 25): Array<{ eventId: string; workId: string; kind: string }> {
    const until = new Date(Date.parse(now) + leaseMs).toISOString(); this.db.exec('BEGIN IMMEDIATE');
    try {
      const rows = this.db.prepare(`SELECT * FROM work_outbox WHERE state='pending' OR (state='leased' AND lease_until < ?) ORDER BY event_id LIMIT ?`).all(now, limit) as any[];
      const update = this.db.prepare(`UPDATE work_outbox SET state='leased',lease_owner=?,lease_until=? WHERE event_id=?`);
      for (const row of rows) update.run(owner, until, row.event_id);
      this.db.exec('COMMIT'); return rows.map(r => ({ eventId: r.event_id, workId: r.work_id, kind: r.kind }));
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  acknowledgeOutbox(eventId: string, owner: string): void { this.db.prepare(`UPDATE work_outbox SET state='acknowledged',acknowledged_at=?,lease_owner=NULL,lease_until=NULL WHERE event_id=? AND lease_owner=?`).run(new Date().toISOString(), eventId, owner); }
  replayOutbox(eventId: string): void { this.db.prepare(`UPDATE work_outbox SET state='pending',lease_owner=NULL,lease_until=NULL WHERE event_id=? AND state!='acknowledged'`).run(eventId); }
}

export function admit(candidate: WorkCandidate, active: WorkCandidate[], limits: AdmissionLimits, reliability: ReliabilityState, now: string): AdmissionExplanation {
  const candidateScore = score(candidate, now); const expansion = expansionAllowed(candidate, reliability);
  if (candidate.protectedEffect && (!candidate.authorityEvidence?.trim() || !(candidate.riskReviewEvidence?.length))) return { admitted: false, score: candidateScore, reason: `protected-effect-blocked:${candidate.protectedEffect}:authority-and-risk-review-required`, expansionAllowed: false };
  if (candidate.class === 'optional' && !expansion) return { admitted: false, score: candidateScore, reason: reliability.incident || reliability.errorBudgetBurn >= reliability.burnThreshold ? 'reliability-pressure-pauses-expansion' : 'insufficient-improvement-evidence', expansionAllowed: false };
  const scopes: Array<[keyof AdmissionLimits, (w: WorkCandidate) => boolean]> = [['company', w => w.companyId === candidate.companyId], ['project', w => w.projectId === candidate.projectId], ['agent', w => w.agentId === candidate.agentId], ['provider', w => w.provider === candidate.provider], ['repository', w => w.repository === candidate.repository]];
  for (const [scope, matches] of scopes) if (active.filter(matches).length >= limits[scope]) return { admitted: false, score: candidateScore, reason: `${scope}-wip-limit`, expansionAllowed: expansion };
  return { admitted: true, score: candidateScore, reason: candidate.class === 'repair' && reliability.errorBudgetBurn >= reliability.burnThreshold ? 'repair-prioritized-by-error-budget' : 'capacity-and-policy-available', expansionAllowed: expansion };
}
