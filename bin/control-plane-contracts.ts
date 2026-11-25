import { createHash } from 'node:crypto';

export const CONTROL_PLANE_SCHEMA_VERSION = '1.0.0' as const;
export const EXECUTION_OUTCOMES = ['succeeded', 'failed', 'cancelled', 'blocked', 'dead-lettered'] as const;
export const READINESS_STATUSES = ['PASS', 'FAIL', 'SKIP', 'BLOCKED', 'UNVERIFIED'] as const;
export const RECOVERY_ROUTES = ['primary', 'alternate', 'contingency', 'emergency'] as const;

export type ExecutionOutcome = (typeof EXECUTION_OUTCOMES)[number];
export type ReadinessStatus = (typeof READINESS_STATUSES)[number];
export type RecoveryRoute = (typeof RECOVERY_ROUTES)[number];

export interface ExecutionIdentity {
  companyId: string;
  projectId: string;
  issueId: string;
  runId: string;
  correlationId: string;
  causationId?: string;
  agentId: string;
  skillVersion?: string;
  provider: string;
  model: string;
  environment: string;
}

export interface AuthorityDecision {
  decision: 'allow' | 'deny' | 'rate-limited' | 'defer' | 'ceo-escalation';
  reasonCode: string;
  policyIds: string[];
  argumentDigest?: string;
}

export interface BudgetReservation {
  reservationId: string;
  idempotencyKey: string;
  amountCentsExact: string;
  status: 'reserved' | 'settled' | 'released' | 'unpriced';
  companyId: string;
  projectId?: string;
  agentId?: string;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  sampled: boolean;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface RecoveryState {
  route: RecoveryRoute;
  attempt: number;
  maxAttempts: number;
  deadline: string;
  checkpointRef?: string;
  nextEligibleAt?: string;
}

export interface EvaluationRecord {
  evaluationId: string;
  runId: string;
  taskClass: string;
  agentVersion: string;
  skillVersion: string;
  promptPolicyVersion: string;
  model: string;
  provider: string;
  environment: string;
  evaluatorVersion: string;
  accepted: boolean;
  escapedDefects: number;
  rollbacks: number;
  humanReworkMinutes: number;
  cycleTimeMs: number;
  costCentsExact: string;
  safetyFindings: number;
  recoverySucceeded?: boolean;
}

export interface DoctorFinding {
  checkId: string;
  status: ReadinessStatus;
  summary: string;
  observedAt: string;
  evidenceDigest?: string;
}

export interface ExecutionEnvelope {
  schemaVersion: typeof CONTROL_PLANE_SCHEMA_VERSION;
  identity: ExecutionIdentity;
  authority: AuthorityDecision;
  budget?: BudgetReservation;
  trace?: TraceContext;
  recovery?: RecoveryState;
  outcome?: ExecutionOutcome;
  startedAt: string;
  finishedAt?: string;
}

const ALLOWED_TELEMETRY_KEYS = new Set([
  'schemaVersion', 'companyId', 'projectId', 'issueId', 'runId', 'correlationId',
  'agentId', 'skillVersion', 'provider', 'model', 'environment', 'decision',
  'reasonCode', 'traceId', 'spanId', 'sampled', 'classification', 'outcome',
  'startedAt', 'finishedAt', 'durationMs', 'costCentsExact', 'status', 'checkId',
]);

const SENSITIVE_KEY = /(?:secret|token|password|authorization|cookie|api[-_]?key|prompt|arguments?|response|source|content)/i;
const SENSITIVE_VALUE = /(?:bearer\s+[a-z0-9._~+\/-]+=*|gocspx-[a-z0-9_-]+|sk-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]+PRIVATE KEY-----)/i;

export function digest(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

export function serializeTelemetry(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_TELEMETRY_KEYS.has(key) || SENSITIVE_KEY.test(key)) continue;
    if (typeof value === 'string' && SENSITIVE_VALUE.test(value)) {
      output[key] = '[REDACTED]';
      continue;
    }
    if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) output[key] = value;
  }
  return output;
}

export function flattenEnvelope(envelope: ExecutionEnvelope): Record<string, unknown> {
  return serializeTelemetry({
    schemaVersion: envelope.schemaVersion,
    ...envelope.identity,
    decision: envelope.authority.decision,
    reasonCode: envelope.authority.reasonCode,
    traceId: envelope.trace?.traceId,
    spanId: envelope.trace?.spanId,
    sampled: envelope.trace?.sampled,
    classification: envelope.trace?.classification,
    outcome: envelope.outcome,
    startedAt: envelope.startedAt,
    finishedAt: envelope.finishedAt,
    costCentsExact: envelope.budget?.amountCentsExact,
  });
}
