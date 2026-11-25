#!/usr/bin/env -S node --experimental-strip-types

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { invokeIndependentBriefs, planConferenceCapabilities, type ModelFamily } from './evidence-gated-deliberation.ts';
import { compileMcpCatalogScope } from './mcp-catalog-scope.ts';
import { hydratePrompt } from './prompt-hydrator.ts';
import { applyScopedLearning, createLearningStore, type LearningCandidate } from './scoped-learning-router.ts';
import { validateSchemaInstance } from './validate-schema-instance.ts';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const scenarioPath = 'fixtures/prompt-hydration/operational-contract/scenarios.json';
const catalogPath = 'fixtures/mcp-catalog/one-sentence.json';
const learningPath = 'fixtures/prompt-hydration/operational-contract/scoped-learning.json';
const evaluatedAt = '2026-11-25T07:00:00.000Z';

const readJson = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const digest = (path: string) => createHash('sha256').update(readFileSync(join(root, path))).digest('hex');

function checkout(): string {
  const path = mkdtempSync(join(tmpdir(), 'operational-evaluation-'));
  mkdirSync(join(path, 'src')); mkdirSync(join(path, 'openspec'));
  writeFileSync(join(path, 'AGENTS.md'), 'Hydrate before execution.\n');
  writeFileSync(join(path, 'package.json'), '{"dependencies":{}}\n');
  return path;
}

export async function evaluateOperationalScenarios() {
  const scenarios = readJson(scenarioPath).scenarios;
  const catalogFixture = readJson(catalogPath);
  const learningFixture = readJson(learningPath) as { sourceRevision: string; recordedAt: string; candidates: Array<Omit<LearningCandidate, 'sourceRevision'>> };
  const catalogSchema = readJson('schemas/mcp-catalog-scope.schema.json');

  const catalog = compileMcpCatalogScope(catalogFixture.prompt, ['ev-explicit']);
  assert.deepEqual(validateSchemaInstance(catalogSchema, catalog), []);
  assert.ok(catalogFixture.requiredCapabilities.every((capability: string) => catalog.capabilities.includes(capability)));
  assert.ok(catalogFixture.requiredOperationalQualities.every((quality: string) => catalog.operationalQualities.includes(quality)));
  assert.equal(catalog.records[0].status, 'selection-pending');

  const capabilityPlan = planConferenceCapabilities(
    [{ family: 'codex', available: true, slots: 1, evidence: 'fixture:codex-subscription-capability' }],
    [{ id: 'codex-only', family: 'codex', expertise: ['product', 'architecture'], architectEligible: true }],
  );
  const calls: ModelFamily[] = [];
  const conference = await invokeIndependentBriefs(
    { ready: true, dispositions: [], blockers: [], digest: 'fixture-ready' },
    { fixture: 'single-provider' },
    async (family) => {
      calls.push(family);
      return { launcher: 'approved:controlled-codex-subscription-fixture', output: JSON.stringify({ family, summary: 'Sequential product and architecture passes', recommendations: [], risks: [], decisions: [] }) };
    },
    evaluatedAt,
    capabilityPlan,
  );
  assert.deepEqual(calls, ['codex']);
  assert.equal(conference.execution.mode, 'sequential-single-agent');
  assert.equal(conference.execution.independent, false);

  const narrow = await hydratePrompt({ prompt: scenarios.narrowFix.prompt, checkout: checkout(), now: evaluatedAt });
  assert.equal(narrow.stage, 'Prompt Hydration');
  assert.equal(narrow.route, 'focused-change');
  assert.deepEqual(narrow.researchReceipts, []);
  assert.equal(narrow.domainInventory.mcpCatalog.applicability, 'not-applicable');
  for (const section of scenarios.narrowFix.requiredReviewSections) assert.ok(section in narrow.focusedPlan);
  const narrowCoverage = new Map(narrow.coverageMatrix.map((row) => [row.dimension, row]));
  for (const dimension of ['migrations', 'operations', 'cost']) assert.equal(narrowCoverage.get(dimension)?.applicability, 'inapplicable');

  const correctionHydration = await hydratePrompt({ prompt: scenarios.scopedCorrection.prompt, checkout: checkout(), now: evaluatedAt });
  assert.equal(correctionHydration.correction?.scope, 'project');
  assert.deepEqual(correctionHydration.correction?.excludedScopes, ['global', 'other-projects']);
  const candidate = (index: number): LearningCandidate => ({ ...learningFixture.candidates[index], sourceRevision: learningFixture.sourceRevision });
  let store = createLearningStore();
  for (let index = 0; index < learningFixture.candidates.length; index += 1) store = applyScopedLearning(store, candidate(index), { recordedAt: learningFixture.recordedAt }).store;
  const beforeOtherRecords = store.records.filter((record) => record.key !== 'catalog-taxonomy');
  const corrected = applyScopedLearning(store, { ...candidate(1), value: 'Retain the existing catalog taxonomy.', provenanceIds: ['EVIDENCE:SCOPED-CORRECTION'] }, { recordedAt: evaluatedAt, expectedRevision: 1 });
  assert.equal(corrected.record.revision, 2);
  assert.deepEqual(corrected.store.records.filter((record) => record.key !== 'catalog-taxonomy'), beforeOtherRecords);

  return {
    schemaVersion: 1,
    evaluationId: 'operational-prompt-hydration-task-10.1',
    changeId: 'operational-prompt-hydration-workflow',
    evaluatedAt,
    execution: {
      mode: 'controlled-deterministic', runtimeRevision: 'unintegrated-agent-skills-working-tree', networkUsed: false, liveProvidersUsed: false,
      fixtureDigests: [scenarioPath, catalogPath, learningPath].map((path) => ({ path, sha256: digest(path) })),
    },
    results: [
      {
        scenarioId: 'one-sentence-mcp-catalog', requirementIds: ['prompt-hydration-workflow.openspec-coverage', 'mcp-catalog.complete-domain-inventory'], status: 'PASS',
        assertions: [
          { id: 'catalog-schema-valid', status: 'PASS', observed: `Compiled scope is schema-valid with ${catalog.capabilities.length} required capabilities and ${catalog.operationalQualities.length} operational qualities.` },
          { id: 'catalog-selection-honest', status: 'PASS', observed: 'Inventory remains selection-pending and does not claim an MCP is connected or executable.' },
        ],
        proportionality: { status: 'PASS', basis: 'One sentence expands only the applicable catalog domain and one selection-pending inventory record, not fabricated per-provider execution.' },
        provenance: { strength: 'controlled', runtime: 'compileMcpCatalogScope', fixtures: [catalogPath], providerFamilies: [], independent: false },
      },
      {
        scenarioId: 'single-provider-fallback', requirementIds: ['prompt-hydration-workflow.adaptive-conference', 'multi-model-convergence.frontier-fallback'], status: 'PASS',
        assertions: [
          { id: 'single-provider-call', status: 'PASS', observed: 'Exactly one controlled Codex-family invocation occurred.' },
          { id: 'independence-not-fabricated', status: 'PASS', observed: 'Execution mode is sequential-single-agent and independent is false.' },
        ],
        proportionality: { status: 'PASS', basis: 'Unavailable model families are not invoked; complementary responsibilities are sequenced through the sole declared capability.' },
        provenance: { strength: 'controlled', runtime: 'planConferenceCapabilities + invokeIndependentBriefs', fixtures: ['inline single-provider capability fixture'], providerFamilies: ['codex'], independent: false },
      },
      {
        scenarioId: 'narrow-bug-fix', requirementIds: ['prompt-hydration-workflow.first-stage', 'prompt-hydration-workflow.sparse-coverage'], status: 'PASS',
        assertions: [
          { id: 'focused-plan-complete', status: 'PASS', observed: 'Prompt Hydration emits context, impact, regression evidence, and improvement review before focused execution.' },
          { id: 'irrelevant-expansion-omitted', status: 'PASS', observed: 'Research and MCP inventory are omitted; migrations, operations, and cost are explicitly inapplicable.' },
        ],
        proportionality: { status: 'PASS', basis: 'The repair stays on focused-change while retaining direct impact and regression coverage.' },
        provenance: { strength: 'controlled', runtime: 'hydratePrompt', fixtures: [scenarioPath], providerFamilies: [], independent: false },
      },
      {
        scenarioId: 'scoped-correction', requirementIds: ['prompt-hydration-workflow.sparse-coverage', 'autonomous-mission-expansion.scoped-learning'], status: 'PASS',
        assertions: [
          { id: 'correction-scope-explicit', status: 'PASS', observed: 'Hydration records project scope and excludes global and other-project scopes.' },
          { id: 'unrelated-learning-preserved', status: 'PASS', observed: 'Only catalog-taxonomy advances to revision 2; unrelated procedure and preference records remain byte-equivalent.' },
        ],
        proportionality: { status: 'PASS', basis: 'The explicit correction updates one project key without promotion to global guidance or mutation of unrelated records.' },
        provenance: { strength: 'controlled', runtime: 'hydratePrompt + applyScopedLearning', fixtures: [scenarioPath, learningPath], providerFamilies: [], independent: false },
      },
    ],
    summary: { status: 'PASS', passed: 4, failed: 0 },
    claimLimits: ['Controlled deterministic evaluation only; no live model-provider independence is claimed.', 'No installed-policy, remote-integration, package-publication, consumer-adoption, or production evidence is claimed.'],
  } as const;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.stdout.write(`${JSON.stringify(await evaluateOperationalScenarios(), null, 2)}\n`);
