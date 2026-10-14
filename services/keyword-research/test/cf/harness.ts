/**
 * Test harness for the control-plane CF tests — assembles a fully in-memory
 * stack (better-sqlite3 D1 + in-memory R2 + in-memory Queue) wired to the real
 * Hono app, with an INJECTED fake Access verifier and a MOCK pipeline. No
 * network, no credentials, fully deterministic.
 */
import { buildApp, opportunityIdFor, type AppDeps } from '../../src/worker';
import type { Env, ResearchJobMessage } from '../../src/env';
import type { AccessJwtVerifier } from '../../src/access';
import type { ResearchResult, RunResearchInput } from '../../src/pipeline';
import type { ReportContext } from '../../src/report';
import type { JobRunnerDeps } from '../../src/queue';
import { FakeD1Database, FakeQueue, FakeR2Bucket } from './fakes';

/** A fixed clock for deterministic timestamps. */
export const FIXED_NOW = new Date('2026-10-14T12:00:00.000Z');

/** A fake verifier that accepts a token iff it equals `GOODTOKEN` (+ claims). */
export const fakeVerifier: AccessJwtVerifier = async (token) => {
  if (token === 'GOODTOKEN') return { email: 'dev@example.com', sub: 'u-1', aud: 'test-aud' };
  if (token.startsWith('TENANT:')) {
    // "TENANT:<id>" mints a token scoped to an explicit tenant id (for isolation
    // tests) — the claim drives the default tenant resolver.
    return { email: `dev@${token.slice('TENANT:'.length)}.example`, sub: token, aud: 'test-aud', tenant_id: token.slice('TENANT:'.length) };
  }
  return null;
};

/** A deterministic, monotonic id generator (so assertions are stable). */
export function counterIds(prefix = 'id'): () => string {
  let n = 0;
  return () => `${prefix}-${++n}`;
}

/** Default MOCK pipeline — returns a canned, schema-plausible result. */
export function mockPipeline(
  overrides: Partial<ResearchResult> = {},
): (input: RunResearchInput) => Promise<ResearchResult> {
  return async (input) => {
    const nowIso = input.now().toISOString();
    const base: ResearchResult = {
      opportunities: [
        {
          keyword: 'best crm for agencies',
          locale: input.project.locale,
          geography: input.project.geography,
          language: input.project.language,
          search_intent: 'comparison',
          intent_confidence: 0.8,
          topic_cluster: 'crm',
          monthly_search_volume: 2400,
          volume_source: 'dataforseo',
          organic_keyword_difficulty: 35,
          paid_competition: 0.6,
          cpc: 14,
          gsc_impressions: null,
          gsc_clicks: null,
          gsc_ctr: null,
          gsc_average_position: null,
          trend_direction: 'rising',
          trend_momentum: 0.5,
          seasonality: null,
          competitor_evidence: [],
          existing_matching_page: null,
          recommended_url: '/best-crm-for-agencies',
          recommended_action: 'create_new',
          opportunity_score: 72,
          scoring_explanation: 'mock',
          source_provenance: [],
          collected_at: nowIso,
          data_freshness: 1,
          confidence: 0.7,
        },
        {
          // A deliberately null-metric opportunity (proves null survives to D1).
          keyword: 'obscure crm tactic',
          locale: input.project.locale,
          geography: input.project.geography,
          language: input.project.language,
          search_intent: 'informational',
          intent_confidence: 0.6,
          topic_cluster: 'crm',
          monthly_search_volume: null,
          volume_source: null,
          organic_keyword_difficulty: null,
          paid_competition: null,
          cpc: null,
          gsc_impressions: null,
          gsc_clicks: null,
          gsc_ctr: null,
          gsc_average_position: null,
          trend_direction: null,
          trend_momentum: null,
          seasonality: null,
          competitor_evidence: [],
          existing_matching_page: null,
          recommended_url: '/obscure-crm-tactic',
          recommended_action: 'supporting_blog',
          opportunity_score: 41,
          scoring_explanation: 'mock',
          source_provenance: [],
          collected_at: nowIso,
          data_freshness: 1,
          confidence: 0.5,
        },
      ],
      clusters: [],
      keywordPageMap: { version: 1, entries: {} },
      costActual: 0.5,
      limitations: [],
      providerStatuses: [],
      evidence: [],
      ...overrides,
    };
    return base;
  };
}

/** A render that's a trivial, deterministic function of the result. */
export function mockRender(result: ResearchResult, ctx: ReportContext): string {
  return `# Report for ${ctx.domain}\n\n${result.opportunities.length} opportunities. Spent $${result.costActual}.`;
}

/** Options to tune the assembled stack. */
export interface HarnessOptions {
  env?: Partial<Env>;
  verifyJwt?: AccessJwtVerifier;
  now?: () => Date;
  newId?: () => string;
  pipeline?: (input: RunResearchInput) => Promise<ResearchResult>;
  render?: (result: ResearchResult, ctx: ReportContext) => string;
  /** Queue-deps overrides (maxAttempts/concurrency/cap/estimate). */
  queueDepsOverrides?: Partial<JobRunnerDeps>;
}

/** The assembled, ready-to-drive stack. */
export interface Harness {
  db: FakeD1Database;
  reports: FakeR2Bucket;
  queue: FakeQueue<ResearchJobMessage>;
  env: Env;
  deps: AppDeps;
  app: ReturnType<typeof buildApp>;
  /** Convenience: fetch against the app with the given headers. */
  request: (path: string, init?: RequestInit) => Promise<Response>;
}

/** Build a full in-memory stack with migrations applied. */
export function makeHarness(opts: HarnessOptions = {}): Harness {
  const db = new FakeD1Database();
  db.applyMigrations();
  const reports = new FakeR2Bucket();
  const queue = new FakeQueue<ResearchJobMessage>();

  const env: Env = {
    DB: db.asD1(),
    REPORTS: reports.asR2(),
    RESEARCH_QUEUE: queue.asQueue(),
    ACCESS_AUD: 'test-aud',
    ACCESS_TEAM: 'test-team',
    SERVICE_TOKEN: 'SVC-SECRET',
    MONTHLY_BUDGET_USD: '20',
    ...opts.env,
  };

  const now = opts.now ?? (() => FIXED_NOW);
  const newId = opts.newId ?? counterIds();

  const queueDeps: JobRunnerDeps = {
    runPipeline: opts.pipeline ?? mockPipeline(),
    renderReport: opts.render ?? mockRender,
    now,
    newId,
    opportunityId: opportunityIdFor,
    capUsd: 20,
    ...opts.queueDepsOverrides,
  };

  const deps: AppDeps = {
    verifyJwt: opts.verifyJwt ?? fakeVerifier,
    now,
    newId,
    queueDeps,
  };

  const app = buildApp(deps);

  const request = async (path: string, init?: RequestInit): Promise<Response> =>
    app.fetch(
      new Request(`https://kr.test${path}`, init),
      env as unknown as Record<string, unknown>,
    );

  return { db, reports, queue, env, deps, app, request };
}

/** Headers for a valid Access JWT request. */
export function jwtHeaders(token = 'GOODTOKEN'): Record<string, string> {
  return { 'Cf-Access-Jwt-Assertion': token, 'content-type': 'application/json' };
}

/** Headers for a valid service-token (bearer) request. */
export function bearerHeaders(token = 'SVC-SECRET'): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}
