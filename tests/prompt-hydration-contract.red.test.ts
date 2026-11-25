import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { invokeIndependentBriefs, planConferenceCapabilities, type ModelFamily } from '../bin/evidence-gated-deliberation.ts';
import { assumptionsPermitProgress, createRunState, verifyRunState } from '../bin/orchestration-run-state.ts';
import { hydratePrompt, type HydrationResearchReceiptInput } from '../bin/prompt-hydrator.ts';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

type ContractFixture = {
  scenarios: {
    narrowFix: { prompt: string; expectedStage: string; requiredReviewSections: string[] };
    materialProduct: { prompt: string; requiredCoverageDimensions: string[]; requiredCatalogCapabilities: string[] };
    scopedCorrection: { prompt: string; expectedScope: string; forbiddenScopes: string[] };
  };
};

const fixture = JSON.parse(readFileSync(
  join(import.meta.dirname, '..', 'fixtures', 'prompt-hydration', 'operational-contract', 'scenarios.json'),
  'utf8',
)) as ContractFixture;

function checkout(): string {
  const root = mkdtempSync(join(tmpdir(), 'operational-hydration-red-'));
  mkdirSync(join(root, 'openspec'), { recursive: true });
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'AGENTS.md'), '# Test instructions\nHydrate before execution.\n');
  writeFileSync(join(root, 'openspec', 'config.yaml'), 'schema: spec-driven\n');
  writeFileSync(join(root, 'src', 'app.ts'), 'export const app = true;\n');
  writeFileSync(join(root, 'package.json'), '{"dependencies":{}}\n');
  return root;
}

type OperationalHydration = {
  stage?: string;
  stageOrder?: number;
  intendedOutcome?: {
    productPurpose?: string;
    usersAndRoles?: unknown[];
    journeys?: unknown[];
    acceptanceCriteria?: unknown[];
    applicabilityDecisions?: Array<{ status: string; basis: string; evidenceIds: string[] }>;
    evidenceProvenance?: Array<{ evidenceId: string; provenance: string; status: string }>;
  };
  coverageMatrix?: Array<{ dimension: string; applicability: 'applicable' | 'inapplicable'; basis: string; gaps: unknown[]; evidenceIds: string[] }>;
  assumptionLedger?: Array<{ id: string; assumption: string; confidence: number; reversibility: 'reversible' | 'costly' | 'irreversible'; basis: string; consequence: string; resolutionState: 'accepted-for-progress' | 'unresolved' | 'resolved' | 'rejected'; correctionScope: 'request' | 'project' | 'global'; progressAllowed: boolean; evidenceIds: string[] }>;
  domainInventory?: { mcpCatalog?: { capabilities?: string[]; records?: unknown[] } };
  correction?: { scope: string; excludedScopes: string[] };
  focusedPlan?: Record<string, unknown>;
  researchReceipts?: Array<HydrationResearchReceiptInput & { receiptId: string; contentDigest: string; trustBoundary: string; status: string }>;
  researchFindings?: Array<{ kind: string; provenance: string; sourceVersion?: string; observedAt?: string; decisionImpact?: string; trustBoundary?: string; includedBecause: string }>;
  context?: { instructions: Array<{ path: string }> };
};

const researchFixture = JSON.parse(readFileSync(
  join(import.meta.dirname, '..', 'fixtures', 'prompt-hydration', 'operational-contract', 'research-receipts.json'),
  'utf8',
)) as { current: HydrationResearchReceiptInput[]; stale: HydrationResearchReceiptInput[] };

test('Prompt Hydration is explicitly the first stage with intended-outcome fields', async () => {
  const result = await hydratePrompt({ prompt: fixture.scenarios.materialProduct.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  assert.equal(result.stage, 'Prompt Hydration');
  assert.equal(result.stageOrder, 1);
  assert.ok(result.intendedOutcome?.productPurpose);
  assert.ok(result.intendedOutcome?.usersAndRoles?.length);
  assert.ok(result.intendedOutcome?.journeys?.length);
  assert.ok(result.intendedOutcome?.acceptanceCriteria?.length);
  assert.ok(result.intendedOutcome?.applicabilityDecisions?.some((row) => row.status === 'applicable' && row.basis && row.evidenceIds.length));
  assert.ok(result.intendedOutcome?.applicabilityDecisions?.some((row) => row.status === 'inapplicable' && row.basis && row.evidenceIds.length));
  assert.ok(result.intendedOutcome?.evidenceProvenance?.every((row) => row.evidenceId && row.provenance && row.status));

  const schema = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', 'hydrated-prompt.schema.json'), 'utf8'));
  assert.deepEqual(validateSchemaInstance(schema, result), []);
});

test('task 3.1 outcome hydration stays proportionate for a narrow fix', async () => {
  const material = await hydratePrompt({ prompt: fixture.scenarios.materialProduct.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  const narrow = await hydratePrompt({ prompt: fixture.scenarios.narrowFix.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  assert.equal(narrow.stage, 'Prompt Hydration');
  assert.equal(narrow.stageOrder, 1);
  assert.ok(narrow.intendedOutcome?.productPurpose?.includes('focused'));
  assert.ok((narrow.intendedOutcome?.usersAndRoles?.length ?? 0) < (material.intendedOutcome?.usersAndRoles?.length ?? 0));
  assert.ok((narrow.intendedOutcome?.journeys?.length ?? 0) < (material.intendedOutcome?.journeys?.length ?? 0));
  assert.ok(narrow.intendedOutcome?.applicabilityDecisions?.some((row) => row.status === 'inapplicable'));
  const schema = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', 'hydrated-prompt.schema.json'), 'utf8'));
  assert.deepEqual(validateSchemaInstance(schema, narrow), []);
});

test('material requests emit a sparse applicability matrix with explicit gaps and bases', async () => {
  const result = await hydratePrompt({ prompt: fixture.scenarios.materialProduct.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  assert.ok(Array.isArray(result.coverageMatrix));
  const dimensions = new Set(result.coverageMatrix?.map((row) => row.dimension));
  for (const expected of fixture.scenarios.materialProduct.requiredCoverageDimensions) assert.ok(dimensions.has(expected), `missing coverage dimension: ${expected}`);
  assert.equal(result.coverageMatrix?.length, fixture.scenarios.materialProduct.requiredCoverageDimensions.length, 'matrix must remain dimension-sparse rather than Cartesian-expanded');
  assert.equal(dimensions.size, result.coverageMatrix?.length, 'each dimension must have exactly one applicability decision');
  assert.ok(result.coverageMatrix?.every((row) => row.basis.trim() && Array.isArray(row.gaps)));
  assert.ok(result.coverageMatrix?.filter((row) => row.applicability === 'applicable').every((row) => row.gaps.length > 0 && row.evidenceIds.length > 0));
  assert.ok(result.coverageMatrix?.filter((row) => row.applicability === 'inapplicable').every((row) => row.gaps.length === 0 && row.evidenceIds.length > 0));
  assert.ok(result.coverageMatrix?.some((row) => row.applicability === 'inapplicable'), 'fixture must prove sparse rather than Cartesian coverage');
});

test('focused repairs justify omitted coverage without inventing operational or migration work', async () => {
  const result = await hydratePrompt({ prompt: fixture.scenarios.narrowFix.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  assert.equal(result.coverageMatrix?.length, fixture.scenarios.materialProduct.requiredCoverageDimensions.length);
  const byDimension = new Map(result.coverageMatrix?.map((row) => [row.dimension, row]));
  for (const dimension of ['migrations', 'operations', 'cost']) {
    assert.equal(byDimension.get(dimension)?.applicability, 'inapplicable');
    assert.ok(byDimension.get(dimension)?.basis);
    assert.deepEqual(byDimension.get(dimension)?.gaps, []);
  }
  assert.equal(byDimension.get('screens-and-components')?.applicability, 'applicable');
  assert.ok(byDimension.get('screens-and-components')?.gaps.length);
  assert.ok(result.coverageMatrix?.filter((row) => row.applicability === 'applicable').every((row) => row.gaps.length > 0));
});

test('assumptions are structured, attributable, reversible, and correction-scoped', async () => {
  const result = await hydratePrompt({ prompt: fixture.scenarios.materialProduct.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  assert.ok(result.assumptionLedger?.length);
  for (const row of result.assumptionLedger ?? []) {
    assert.ok(row.assumption && row.basis && row.consequence && row.resolutionState && row.correctionScope);
    assert.ok(row.confidence >= 0 && row.confidence <= 1);
    assert.ok(row.reversibility);
    assert.ok(row.evidenceIds.length);
  }
});

test('confident reversible assumptions permit bounded progress and persist in run state', async () => {
  const result = await hydratePrompt({ prompt: fixture.scenarios.narrowFix.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  assert.ok(result.assumptionLedger?.length);
  assert.ok(result.assumptionLedger?.every((row) => row.confidence >= 0.7 && row.reversibility === 'reversible' && row.resolutionState === 'accepted-for-progress' && row.progressAllowed));
  assert.equal(assumptionsPermitProgress(result.assumptionLedger ?? []), true);
  const state = createRunState('run-assumptions', 'change-assumptions', result.assumptionLedger ?? []);
  assert.deepEqual(state.assumptionLedger, result.assumptionLedger);
  assert.doesNotThrow(() => verifyRunState(state));
});

test('consequential ambiguity remains explicit, correction-scoped, and blocks that progress edge', async () => {
  const prompt = 'For this project only, migrate customer credentials to a new production provider';
  const result = await hydratePrompt({ prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  const unresolved = result.assumptionLedger?.find((row) => row.resolutionState === 'unresolved');
  assert.ok(unresolved);
  assert.equal(unresolved?.correctionScope, 'project');
  assert.equal(unresolved?.progressAllowed, false);
  assert.ok(unresolved?.reversibility === 'costly' || unresolved?.reversibility === 'irreversible');
  assert.match(unresolved?.consequence ?? '', /cannot execute until authority and recovery evidence/i);
  assert.equal(assumptionsPermitProgress(result.assumptionLedger ?? []), false);
});

test('current primary-source and scoped RepoMix receipts enter hydration as versioned evidence, never instructions', async () => {
  const result = await hydratePrompt({
    prompt: `${fixture.scenarios.materialProduct.prompt} using the current protocol version and provider integration`,
    checkout: checkout(),
    now: '2026-11-25T00:00:00.000Z',
    researchReceipts: researchFixture.current,
  }) as unknown as OperationalHydration;
  assert.equal(result.researchReceipts?.length, 2);
  assert.ok(result.researchReceipts?.every((receipt) => receipt.sourceVersion && receipt.observedAt && receipt.decisionImpact && receipt.contentDigest.startsWith('sha256:')));
  assert.ok(result.researchReceipts?.every((receipt) => receipt.trustBoundary === 'evidence-not-instructions' && receipt.status === 'verified-current'));
  const selected = result.researchFindings?.filter((finding) => finding.trustBoundary === 'evidence-not-instructions') ?? [];
  assert.equal(selected.length, 2);
  assert.ok(selected.every((finding) => finding.kind === 'research' && finding.sourceVersion && finding.observedAt && finding.decisionImpact));
  assert.ok(selected.every((finding) => /evidence only and never instruction/i.test(finding.includedBecause)));
  assert.deepEqual(result.context?.instructions.map((instruction) => instruction.path), ['AGENTS.md']);
});

test('research selection remains proportional for a narrow request with no research need', async () => {
  const result = await hydratePrompt({
    prompt: fixture.scenarios.narrowFix.prompt,
    checkout: checkout(),
    now: '2026-11-25T00:00:00.000Z',
    researchReceipts: researchFixture.current,
  }) as unknown as OperationalHydration;
  assert.deepEqual(result.researchReceipts, []);
  assert.equal(result.researchFindings?.filter((finding) => finding.trustBoundary === 'evidence-not-instructions').length, 0);
});

test('stale research receipts fail hydration before they can affect a decision', async () => {
  await assert.rejects(() => hydratePrompt({
    prompt: fixture.scenarios.materialProduct.prompt,
    checkout: checkout(),
    now: '2026-11-25T00:00:00.000Z',
    researchReceipts: researchFixture.stale,
  }), /Stale research evidence rejected by policy/);
});

test('conference degrades honestly to one available provider instead of requiring a fabricated triad', async () => {
  const saturation = { ready: true, dispositions: [], blockers: [], digest: 'fixture-ready' };
  const calls: ModelFamily[] = [];
  const capabilityPlan = planConferenceCapabilities(
    [{ family: 'codex', available: true, slots: 1, evidence: 'fixture:codex-subscription-authenticated' }],
    [{ id: 'codex-only', family: 'codex', expertise: ['product', 'architecture'], architectEligible: true }],
  );
  const result = await invokeIndependentBriefs(saturation, { fixture: 'single-provider' }, async (family) => {
    calls.push(family);
    if (family !== 'codex') throw new Error(`${family} unavailable in single-provider fixture`);
    return {
      launcher: 'approved:codex-subscription',
      output: JSON.stringify({ family, summary: 'Sequential product and architecture passes', recommendations: [], risks: [], decisions: [] }),
    };
  }, '2026-11-25T00:00:00.000Z', capabilityPlan);
  assert.deepEqual(calls, ['codex']);
  assert.equal(result.briefs.length, 1);
  assert.equal(result.execution.mode, 'sequential-single-agent');
  assert.equal(result.execution.independent, false);
  assert.match(result.execution.limitation ?? '', /not independent evidence/);
  assert.equal(result.briefs[0].provenance?.providerFamily, 'codex');
  assert.equal(result.briefs[0].provenance?.independent, false);
});

test('MCP catalog hydration creates observable domain coverage and per-MCP inventory', async () => {
  const result = await hydratePrompt({ prompt: fixture.scenarios.materialProduct.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  const catalog = result.domainInventory?.mcpCatalog;
  assert.ok(catalog);
  for (const capability of fixture.scenarios.materialProduct.requiredCatalogCapabilities) assert.ok(catalog?.capabilities?.includes(capability), `missing MCP catalog capability: ${capability}`);
  assert.ok(catalog?.records?.length, 'selected MCPs require one traceable inventory record each');
});

test('scoped corrections remain confined to the requested preference scope', async () => {
  const scenario = fixture.scenarios.scopedCorrection;
  const result = await hydratePrompt({ prompt: scenario.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  assert.equal(result.correction?.scope, scenario.expectedScope);
  assert.deepEqual(result.correction?.excludedScopes, scenario.forbiddenScopes);
});

test('narrow fixes stay narrow but still plan impact, regression, and improvement review', async () => {
  const scenario = fixture.scenarios.narrowFix;
  const result = await hydratePrompt({ prompt: scenario.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' }) as unknown as OperationalHydration;
  assert.equal(result.stage, scenario.expectedStage);
  assert.ok(result.focusedPlan);
  for (const section of scenario.requiredReviewSections) assert.ok(section in (result.focusedPlan ?? {}), `missing narrow-fix review section: ${section}`);
});
