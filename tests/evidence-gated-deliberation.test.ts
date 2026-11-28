import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assignConferenceResponsibilities, convergeArchitecture, discoverProviderSlotCapabilities, evaluateSaturation, executeResearch, inventoryRepository,
  invokeIndependentBriefs, invokeProviderCritiqueRound, planConferenceCapabilities, resolveCodexLedConference, selectConferenceRoster, type ModelFamily, type Specialist,
} from '../bin/evidence-gated-deliberation.ts';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'estate-'));
  mkdirSync(join(root, 'openspec'), { recursive: true });
  mkdirSync(join(root, 'src'), { recursive: true });
  mkdirSync(join(root, 'tests'), { recursive: true });
  writeFileSync(join(root, 'AGENTS.md'), 'Use theme.tools and ui.theme.tools.');
  writeFileSync(join(root, 'openspec', 'design.md'), 'architecture');
  writeFileSync(join(root, 'src', 'app.ts'), 'export {};');
  writeFileSync(join(root, 'tests', 'app.test.ts'), 'test');
  writeFileSync(join(root, 'package.json'), '{}');
  writeFileSync(join(root, 'wrangler.toml'), 'name = "fixture"');
  return root;
}

test('inventory captures provenance and shared-estate gaps', () => {
  const inventory = inventoryRepository(fixture(), 'abc123');
  assert.ok(inventory.entries.some((e) => e.domain === 'repository-instructions'));
  assert.ok(inventory.entries.some((e) => e.domain === 'openspec-architecture'));
  assert.ok(inventory.entries.some((e) => e.domain === 'source-tests'));
  assert.ok(inventory.entries.some((e) => e.domain === 'deployment'));
  assert.deepEqual(inventory.sharedServices.map((s) => s.name).sort(), ['theme.tools', 'ui.theme.tools']);
  assert.ok(inventory.entries.every((e) => e.digest && e.provenance));
});

test('research requires approved rail, citations, freshness, and more than canned queries', async () => {
  const requests = [
    { domain: 'primary-sources' as const, query: 'official docs', budget: 2 },
    { domain: 'competitors-substitutes' as const, query: 'competitors', budget: 2 },
  ];
  const receipts = await executeResearch(requests, async (request) => ({
    rail: 'approved:fake-browser', findings: [{ url: `https://example.test/${request.domain}`, title: request.domain, observedAt: '2026-11-22T00:00:00.000Z', excerpt: 'observed evidence', sourceType: request.domain === 'primary-sources' ? 'primary' : 'competitor' }],
  }), Date.parse('2026-11-22T01:00:00.000Z'));
  assert.equal(receipts.length, 2);
  assert.ok(receipts.every((receipt) => receipt.coverage.satisfied && receipt.coverage.citedSources <= receipt.coverage.budget));
  await assert.rejects(() => executeResearch([requests[0]], async () => ({ rail: 'approved:fake-browser', findings: [] })));
  await assert.rejects(() => executeResearch([requests[0]], async () => ({ rail: 'unapproved', findings: [] })));
});

test('research rejects forged rails, unsafe URLs, future/stale dates, wrong source types, and conflicting duplicates', async () => {
  const request = { domain: 'primary-sources' as const, query: 'official docs', budget: 3 };
  const now = Date.parse('2026-11-22T01:00:00.000Z');
  const finding = { url: 'https://docs.example.test/guide', title: 'Guide', observedAt: '2026-11-22T00:00:00.000Z', excerpt: 'evidence', sourceType: 'primary' as const };
  await assert.rejects(() => executeResearch([request], async () => ({ rail: 'approved:browser:forged', findings: [finding] }), now), /Unapproved/);
  await assert.rejects(() => executeResearch([request], async () => ({ rail: 'approved:browser', findings: [{ ...finding, url: 'http://docs.example.test' }] }), now), /Untrusted/);
  await assert.rejects(() => executeResearch([request], async () => ({ rail: 'approved:browser', findings: [{ ...finding, observedAt: '2027-01-01T00:00:00Z' }] }), now), /Invalid research finding/);
  await assert.rejects(() => executeResearch([request], async () => ({ rail: 'approved:browser', findings: [{ ...finding, sourceType: 'competitor' }] }), now), /cannot satisfy/);
  await assert.rejects(() => executeResearch([request], async () => ({ rail: 'approved:browser', findings: [finding, { ...finding, url: `${finding.url}#fragment`, excerpt: 'contradiction' }] }), now), /Conflicting duplicate/);
  await assert.rejects(() => executeResearch([request], async () => ({ rail: 'approved:browser', findings: [finding] }), now, 30 * 86400_000, new Set(['approved:other'])), /Unapproved/);
});

test('saturation fails closed before conference', async () => {
  const inventory = inventoryRepository(fixture());
  const saturation = evaluateSaturation(inventory, [], ['repository-instructions', 'primary-sources']);
  assert.equal(saturation.ready, false);
  await assert.rejects(() => invokeIndependentBriefs(saturation, {}, async () => ({ launcher: 'approved:fake', output: '{}' })), /blocked/);
  const incompleteBlocker = evaluateSaturation(inventory, [], ['primary-sources'], {
    'primary-sources': { status: 'externally-blocked', reason: 'browser rail unavailable' },
  });
  assert.equal(incompleteBlocker.ready, false);
  const provenBlocker = evaluateSaturation(inventory, [], ['primary-sources'], {
    'primary-sources': { status: 'externally-blocked', reason: 'browser rail unavailable', independentPrerequisitesComplete: true },
  });
  assert.equal(provenBlocker.ready, false);
  await assert.rejects(() => invokeIndependentBriefs(provenBlocker, {}, async () => ({ launcher: 'approved:fake', output: '{}' })), /blocked/);
});

test('research conflicts block saturation until explicitly dispositioned with evidence', async () => {
  const inventory = inventoryRepository(fixture());
  const observedAt = '2026-11-22T00:00:00Z';
  const research = await executeResearch([{ domain: 'primary-sources', query: 'official facts', budget: 1 }], async () => ({
    rail: 'approved:browser',
    findings: [{ url: 'https://example.test/fact', title: 'Fact', observedAt, excerpt: 'documented fact', sourceType: 'primary' }],
    conflicts: ['official sources disagree on retention'],
  }), Date.parse('2026-11-22T01:00:00Z'));
  assert.equal(evaluateSaturation(inventory, research, ['primary-sources']).ready, false);
  assert.equal(evaluateSaturation(inventory, research, ['primary-sources'], {}, [{ conflict: 'official sources disagree on retention', resolution: 'Use the newer versioned contract', evidence: [research[0].digest] }]).ready, true);
});

test('three approved launchers receive identical evidence without peer output leakage', async () => {
  const inventory = inventoryRepository(fixture());
  const saturation = evaluateSaturation(inventory, [], ['repository-instructions']);
  const inputs: Array<{ family: ModelFamily; input: string }> = [];
  const result = await invokeIndependentBriefs(saturation, { immutable: 'bundle' }, async (family, input) => {
    inputs.push({ family, input });
    return { launcher: `approved:fake-${family}`, output: JSON.stringify({ family, summary: `${family} view`, recommendations: [], risks: [], decisions: [] }) };
  });
  assert.equal(result.briefs.length, 3);
  assert.equal(new Set(result.receipts.map((r) => r.family)).size, 3);
  assert.ok(inputs.every(({ input }) => input.includes('"immutable":"bundle"') && !input.includes(' view')));
});

const candidates: Specialist[] = [
  { id: 'claude-architect', expertise: ['architecture', 'auth'], family: 'claude', architectEligible: true },
  { id: 'codex-architect', expertise: ['architecture', 'security'], family: 'codex', architectEligible: true },
  { id: 'gemini-market', expertise: ['competitor', 'architecture'], family: 'gemini', architectEligible: true },
  { id: 'codex-payments', expertise: ['payment'], family: 'codex', architectEligible: false },
  { id: 'gemini-seo', expertise: ['seo'], family: 'gemini', architectEligible: false },
];

test('seeded roster is reproducible, varies by seed, excludes irrelevant roles, and adds second architect for risk', () => {
  const a = selectConferenceRoster('seed-a', 'payment auth architecture', candidates);
  const repeated = selectConferenceRoster('seed-a', 'payment auth architecture', candidates);
  const b = selectConferenceRoster('seed-b', 'payment auth architecture', candidates);
  assert.deepEqual(a, repeated);
  assert.notDeepEqual(a.participants.map((p) => p.id), b.participants.map((p) => p.id));
  assert.equal(a.secondArchitect, true);
  assert.ok(!a.participants.some((p) => p.id === 'gemini-seo'));
  assert.ok(a.diversity.families >= 2);
});

test('high-risk roster fails closed when no second eligible architect exists', () => {
  assert.throws(() => selectConferenceRoster('seed', 'payment security migration', candidates.filter((item) => item.id !== 'codex-architect' && item.id !== 'gemini-market')), /second eligible architect/);
});

test('Codex-led conference assigns complementary responsibilities and emits typed exchange and resolution receipts', async () => {
  const participants = candidates.slice(0, 3);
  const assignments = assignConferenceResponsibilities(participants);
  assert.equal(assignments.find((item) => item.responsibility === 'lead-resolution')?.family, 'codex');
  assert.ok(assignments.some((item) => item.responsibility === 'product-completeness'));
  assert.ok(assignments.some((item) => item.responsibility === 'architecture-verification'));
  const briefs = (['claude', 'codex', 'gemini'] as ModelFamily[]).map((family) => ({ family, summary: family, recommendations: [], risks: [], decisions: [] }));
  const invoked = await invokeProviderCritiqueRound(1, briefs, [], participants, async (family, input) => {
    const parsed = JSON.parse(input);
    return { launcher: `approved:fixture-${family}`, output: JSON.stringify({
      family,
      materialDeltas: [],
      dissent: [{ topic: 'scope', position: `${parsed.responsibility} view`, evidence: [`evidence:${family}`], resolutionOwner: 'codex-architect' }],
      decisions: [{ topic: 'scope', position: `decision:${family}` }],
      alternatives: [{ topic: 'scope', option: `alternative:${family}`, disposition: 'retain', basis: `basis:${family}` }],
      evidence: [`receipt:${family}`],
      unresolvedAssumptions: [`assumption:${family}`],
      revision: `revision:${family}`,
    }) };
  }, '2026-11-25T00:00:00.000Z', assignments);
  assert.equal(invoked.exchanges.length, 3);
  assert.ok(invoked.exchanges.every((exchange) => exchange.receiptId.length === 64 && exchange.providerReceipt.length === 64));
  const resolution = resolveCodexLedConference(assignments, invoked.exchanges, true);
  assert.equal(resolution.lead.family, 'codex');
  assert.equal(resolution.decisions.length, 3);
  assert.equal(resolution.alternatives.length, 3);
  assert.equal(resolution.disagreements.length, 3);
  assert.equal(resolution.evidence.length, 6);
  assert.equal(resolution.unresolvedAssumptions.length, 3);
  const schema = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'schemas', 'architecture-conference.schema.json'), 'utf8'));
  assert.deepEqual(validateSchemaInstance(schema, resolution), []);
});

test('capability planning distinguishes two-agent, combined-role, and sequential single-agent provenance', () => {
  const twoAgentParticipants: Specialist[] = [
    { id: 'codex-lead', family: 'codex', expertise: ['architecture'], architectEligible: true },
    { id: 'claude-product', family: 'claude', expertise: ['product'], architectEligible: true },
  ];
  const twoAgent = planConferenceCapabilities([
    { family: 'codex', available: true, slots: 1, evidence: 'codex-auth' },
    { family: 'claude', available: true, slots: 1, evidence: 'claude-auth' },
  ], twoAgentParticipants);
  assert.equal(twoAgent.mode, 'two-agent');
  assert.equal(twoAgent.independent, true);
  assert.deepEqual(new Set(twoAgent.assignments.map((assignment) => assignment.responsibility)), new Set(['lead-resolution', 'product-completeness', 'architecture-verification']));

  const oneParticipant = [{ id: 'codex-only', family: 'codex' as const, expertise: ['product', 'architecture'], architectEligible: true }];
  const combined = planConferenceCapabilities([{ family: 'codex', available: true, slots: 2, evidence: 'two-codex-slots' }], oneParticipant);
  assert.equal(combined.mode, 'combined-role');
  assert.equal(combined.independent, false);
  const sequential = planConferenceCapabilities([{ family: 'codex', available: true, slots: 1, evidence: 'one-codex-slot' }], oneParticipant);
  assert.equal(sequential.mode, 'sequential-single-agent');
  assert.equal(sequential.independent, false);
  assert.match(sequential.limitation ?? '', /not independent evidence/);
});

test('provider discovery treats installation without authenticated availability as unavailable', () => {
  const capabilities = discoverProviderSlotCapabilities({
    claude: { installed: true },
    codex: { installed: true, authenticated: true, available: true },
    gemini: { installed: false },
  }, { codex: 2 });
  assert.deepEqual(capabilities.map(({ family, available, slots }) => ({ family, available, slots })), [
    { family: 'claude', available: false, slots: 0 },
    { family: 'codex', available: true, slots: 2 },
    { family: 'gemini', available: false, slots: 0 },
  ]);
  assert.ok(capabilities.every((capability) => capability.evidence.startsWith('provider-capability-snapshot:')));
});

test('explicit inference unavailability overrides installation and authentication', () => {
  const [claude, codex, gemini] = discoverProviderSlotCapabilities({
    claude: { installed: true, authenticated: true },
    codex: { available: true },
    gemini: { installed: true, authenticated: true, available: false },
  }, { gemini: 4 });
  assert.equal(claude.slots, 1);
  assert.equal(codex.slots, 1);
  assert.equal(gemini.available, false);
  assert.equal(gemini.slots, 0);
  assert.match(gemini.evidence, /available=false$/);
});

test('cross-critique preserves dissent and blocks compilation until architecture fixed point', async () => {
  const briefs = (['claude', 'codex', 'gemini'] as ModelFamily[]).map((family) => ({ family, summary: family, recommendations: [], risks: [], decisions: [] }));
  const result = await convergeArchitecture(briefs, async (round) => (['claude', 'codex', 'gemini'] as ModelFamily[]).map((family) => ({
    family, materialDeltas: round === 1 ? ['tenant contract unresolved'] : [], dissent: [{ topic: 'tenant contract', position: `${family} position`, evidence: [`${family}-receipt`], ...(round > 1 ? { resolutionOwner: 'codex-architect', providerReceipt: `${family}-resolution-receipt` } : {}) }],
  })));
  assert.equal(result.converged, true);
  assert.equal(result.rounds.length, 2);
  assert.equal(result.dissent.length, 3);
  const unresolved = await convergeArchitecture(briefs, async () => (['claude', 'codex', 'gemini'] as ModelFamily[]).map((family) => ({ family, materialDeltas: [], dissent: [{ topic: 'auth', position: family, evidence: ['receipt'] }] })), 2);
  assert.equal(unresolved.converged, false);
  assert.equal(unresolved.dissent.length, 3);
  const blocked = await convergeArchitecture(briefs, async () => (['claude', 'codex', 'gemini'] as ModelFamily[]).map((family) => ({ family, materialDeltas: ['still material'], dissent: [] })), 2);
  assert.equal(blocked.converged, false);
  assert.match(blocked.blocker!, /OpenSpec compilation is blocked/);
});

test('roster fallback uses architect eligibility and retains an eligible Codex lead', () => {
  const lead = { id: 'local-reviewer', expertise: ['git'], family: 'codex' as const, architectEligible: true };
  const specialist = { id: 'documentation-reviewer', expertise: ['markdown'], family: 'claude' as const, architectEligible: false };
  assert.deepEqual(selectConferenceRoster('fixture', 'Organize folders', [lead]).participants, [lead]);
  const selected = selectConferenceRoster('fixture', 'Review Markdown', [lead, specialist]).participants;
  assert.ok(selected.includes(lead));
  assert.ok(selected.includes(specialist));

  const conferenceLead = { ...lead, architectEligible: false };
  const independentArchitect = { ...specialist, architectEligible: true };
  const fallback = selectConferenceRoster('fixture', 'Review Markdown', [conferenceLead, independentArchitect]);
  assert.ok(fallback.participants.includes(conferenceLead));
  assert.equal(fallback.secondArchitect, false);
  assert.throws(
    () => selectConferenceRoster('fixture', 'Review Markdown migration', [conferenceLead, independentArchitect]),
    /requires a second eligible architect/,
  );
});

test('research dispatch overlaps independent queries without reordering their receipts', async () => {
  const requests = ['first', 'second', 'third'].map((query) => ({ domain: 'primary-sources' as const, query, budget: 1 }));
  const now = Date.now();
  let active = 0;
  let peak = 0;
  const receipts = await executeResearch(requests, async ({ query }) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, query === 'first' ? 8 : 1));
    active -= 1;
    return { rail: 'approved:fixture', findings: [{ url: `https://example.test/${query}`, title: query, excerpt: 'Verified fixture', observedAt: new Date(now).toISOString(), sourceType: 'primary' }] };
  }, now, undefined, undefined, 2);
  assert.equal(peak, 2);
  assert.deepEqual(receipts.map(({ request }) => request.query), ['first', 'second', 'third']);
});

test('live research observations are checked when the reply arrives', async () => {
  const [receipt] = await executeResearch([{ domain: 'primary-sources', query: 'fixture', budget: 1 }], async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { rail: 'approved:fixture', findings: [{
      url: 'https://example.test/fixture', title: 'Fixture', excerpt: 'Observed after dispatch',
      observedAt: new Date().toISOString(), sourceType: 'primary',
    }] };
  });
  assert.equal(receipt.coverage.satisfied, true);
});
