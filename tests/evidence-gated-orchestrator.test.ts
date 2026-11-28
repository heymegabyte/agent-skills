import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { runEvidenceGatedPipeline, type PipelineAdapters, type ReuseProposal } from '../bin/evidence-gated-orchestrator.ts';
import { issueArchitectAssignment, type ProcessReceipt, type SchedulerAdapter } from '../bin/swarm-execution-kernel.ts';
import type { ModelFamily, Specialist } from '../bin/evidence-gated-deliberation.ts';
import { createHash } from 'node:crypto';

const completedProcess = (): ProcessReceipt => ({ exitCode: 0, stdout: '', stderr: '', startedAt: '2026-11-22T00:00:00Z', finishedAt: '2026-11-22T00:00:01Z' });

function fixture() {
  const checkout = mkdtempSync(join(tmpdir(), 'governed-orchestrator-'));
  mkdirSync(join(checkout, 'openspec', 'specs', 'capability'), { recursive: true });
  mkdirSync(join(checkout, 'src'), { recursive: true });
  writeFileSync(join(checkout, 'AGENTS.md'), 'governed instructions');
  writeFileSync(join(checkout, 'src', 'app.ts'), 'export {};');
  const paths = ['openspec/proposal.md', 'openspec/design.md', 'openspec/specs/capability/spec.md', 'openspec/tasks.md'];
  const contents = [
    '# Proposal\n## Why\nCurrent behavior lacks a governed production path.\n## What Changes\nImplement the complete evidence-gated behavior.\n',
    '# Design\n**Architect Role:** assigned\n## Context\nThe pipeline needs immutable evidence and authority.\n## Goals / Non-Goals\nDeliver governed execution without fabricated proof.\n## Decisions\nUse receipt-bound contracts and fail-closed gates.\n',
    '# Specification\n### Requirement: Governed delivery\n#### Scenario: Complete bounded slice\n- **WHEN** execution is authorized\n- **THEN** evidence is retained\n',
    '# Tasks\n- [ ] [implement] Implement bounded slice (requirements: Governed delivery; scenarios: Complete bounded slice)\n',
  ];
  paths.forEach((path, index) => writeFileSync(join(checkout, path), contents[index]));
  const specialists: Specialist[] = [
    { id: 'claude-architect', expertise: ['product'], family: 'claude', architectEligible: true },
    { id: 'codex-engineer', expertise: ['product'], family: 'codex', architectEligible: false },
    { id: 'gemini-researcher', expertise: ['product'], family: 'gemini', architectEligible: false },
  ];
  return { checkout, paths, specialists };
}

function configured(checkout: string, paths: string[], calls: string[]): PipelineAdapters {
  const scheduler: SchedulerAdapter = {
    async preflight(provider, node) { calls.push(`preflight:${provider}:${node.id}`); return { ok: true }; },
    async createWorktree(node) { calls.push(`worktree:${node.id}`); return { sourceDigest: 'before' }; },
    async launch(provider, node) { calls.push(`launch:${provider}:${node.id}`); return completedProcess(); },
    async changedFiles() { return ['src/app.ts']; },
    async runAcceptance(node) { calls.push(`accept:${node.id}`); return completedProcess(); },
    async sourceDigest() { return 'accepted-source'; },
    async integrate(node, expected) { calls.push(`integrate:${node.id}`); return { sourceDigest: expected, integratedRevision: `revision-${node.id}` }; },
    async preserveForRecovery() {},
  };
  return {
    async research(request) {
      calls.push(`research:${request.domain}`);
      return { rail: 'approved:fake-research', findings: [{ url: `https://evidence.test/${request.domain}`, title: request.domain, observedAt: new Date(Date.now() - 1_000).toISOString(), excerpt: 'cited current evidence', sourceType: request.domain === 'primary-sources' ? 'primary' : 'competitor' }] };
    },
    async provider(family: ModelFamily, input: string) {
      calls.push(`provider:${family}`);
      if (input?.startsWith('{')) {
        const participant = JSON.parse(input).participant;
        calls.push(`critique:${participant.id}`);
        return { launcher: `approved:fake-${family}`, output: JSON.stringify({ family, participantId: participant.id, materialDeltas: [], dissent: [] }) };
      }
      if (input.startsWith('Enhance these instructions')) {
        const { topic } = JSON.parse(input.split('\n').at(-1)!);
        calls.push(`slice:${topic}`);
        return { launcher: `approved:fake-${family}`, output: JSON.stringify({ summary: `Principal prompt for ${topic}` }) };
      }
      calls.push(`brief:${family}`);
      return { launcher: `approved:fake-${family}`, output: JSON.stringify({ family, summary: `${family} independent brief`, recommendations: [], risks: [], decisions: [] }) };
    },
    async assignArchitect({ changeId }) {
      calls.push('assign:codex');
      const authorityEvidence = 'explicit test authority';
      const authoritySourceDigest = createHash('sha256').update(authorityEvidence).digest('hex');
      return issueArchitectAssignment({ changeId, architectFamily: 'codex', architectIdentity: 'codex-architect', assignedBy: 'owner', authorityEvidence, authoritySourceDigest, assignedAt: '2026-11-22T00:00:00Z' }, { digest: authoritySourceDigest });
    },
    async compileOpenSpec() {
      calls.push('compile:openspec');
      return {
        artifacts: paths.map((path, index) => ({ kind: (['proposal', 'design', 'spec', 'tasks'] as const)[index], path, content: readFileSync(join(checkout, path), 'utf8'), requirements: ['REQ-1'], scenarios: ['SCENARIO-1'], traceabilityIds: ['implement'] })),
        nodes: [{ id: 'implement', title: 'Implement bounded slice', dependsOn: [], provider: 'opencode-deepseek' as const, classification: 'bounded' as const, worktree: 'swarm-implement', branch: 'swarm/implement', port: 4100, ownedPaths: ['src/app.ts'], acceptance: [{ command: 'node', args: ['--test'] }] }],
      };
    },
    scheduler,
    async verify({ contract, executions }) {
      calls.push('verify:adversarial');
      const receipt = (reviewerFamily: 'claude' | 'gemini') => ({ reviewerFamily, launcher: `approved:fake-${reviewerFamily}`, inputDigest: 'a'.repeat(64), outputDigest: 'b'.repeat(64), reviewedContractDigest: contract.contractDigest, passed: true });
      return { passed: executions.every((execution) => execution.status === 'integrated'), receipts: [receipt('claude'), receipt('gemini')] };
    },
  };
}

function input(checkout: string, specialists: Specialist[]) {
  return {
    prompt: 'Build product workflow', checkout, changeId: 'governed-change', sourceRevision: 'abc1234', specialists,
    trustedAuthoritySourceDigest: createHash('sha256').update('explicit test authority').digest('hex'),
    requiredEvidence: ['repository-instructions', 'source-tests', 'primary-sources', 'competitors-substitutes'] as const,
    researchRequests: [
      { domain: 'primary-sources' as const, query: 'official product documentation', budget: 2 },
      { domain: 'competitors-substitutes' as const, query: 'product competitors', budget: 2 },
    ],
    conferenceSeed: 'stable-test-seed',
    approvedResearchRails: ['approved:fake-research'],
  };
}

test('composition root executes the receipt-gated production sequence through verification', async () => {
  const { checkout, paths, specialists } = fixture(); const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const provider = adapters.provider;
  adapters.routeSliceSkills = async ({ topic }) => [{ id: 'verification', guidance: `Verify ${topic}` }];
  adapters.provider = (family, request) => {
    if (request.startsWith('Enhance these instructions')) {
      const { topic, skills } = JSON.parse(request.split('\n').at(-1)!);
      assert.deepEqual(skills, [{ id: 'verification', guidance: `Verify ${topic}` }]);
    }
    return provider(family, request);
  };
  const { assignArchitect, compileOpenSpec } = adapters;
  let architectEvidenceDigest: string | undefined;
  adapters.assignArchitect = (request) => {
    assert.equal(request.hydratedBrief.evidence.intake.prompt, request.prompt);
    assert.equal(request.hydratedBrief.evidence.research.length, 2);
    assert.deepEqual(request.hydratedBrief.slices.map(({ topic }) => topic), ['official product documentation', 'product competitors']);
    for (const [index, slice] of request.hydratedBrief.slices.entries()) {
      assert.deepEqual(slice.researchDigests, [request.hydratedBrief.evidence.research[index].digest]);
      assert.equal(slice.brief, `Principal prompt for ${slice.topic}`);
      assert.deepEqual(slice.skillDigests, [{
        id: 'verification',
        digest: createHash('sha256').update(JSON.stringify(`Verify ${slice.topic}`)).digest('hex'),
      }]);
    }
    assert.equal(request.hydratedBrief.synthesis.briefs.length, 3);
    assert.equal(request.hydratedBrief.synthesis.receipts.length, 3);
    architectEvidenceDigest = request.evidenceDigest;
    request.hydratedBrief.synthesis.briefs.length = 0;
    return assignArchitect(request);
  };
  adapters.compileOpenSpec = (request) => {
    assert.equal(request.hydratedBrief.synthesis.briefs.length, 3);
    assert.equal(request.evidenceDigest, architectEvidenceDigest);
    assert.equal(createHash('sha256').update(JSON.stringify(request.hydratedBrief)).digest('hex'), request.evidenceDigest);
    return compileOpenSpec(request);
  };
  const result = await runEvidenceGatedPipeline(input(checkout, specialists), adapters);
  assert.equal(result.contract.evidenceDigest, architectEvidenceDigest);
  assert.ok(result.contract.nodes[0].workerPrompt?.includes(result.contract.artifacts.find(({ kind }) => kind === 'tasks')!.content));
  assert.equal(result.status, 'complete');
  assert.equal(result.state.phase, 'complete');
  assert.equal(result.state.receipts.length, 13);
  assert.deepEqual(calls.slice(0, 2), ['research:primary-sources', 'research:competitors-substitutes']);
  assert.ok(calls.indexOf('slice:product competitors') < calls.indexOf('brief:gemini'));
  assert.ok(calls.indexOf('brief:gemini') < calls.indexOf('critique:claude-architect'));
  assert.ok(calls.indexOf('compile:openspec') < calls.indexOf('launch:opencode-deepseek:implement'));
  assert.ok(calls.indexOf('integrate:implement') < calls.indexOf('verify:adversarial'));
  assert.equal(result.conferenceResolution.lead.family, 'codex');
  assert.equal(result.conferenceResolution.exchanges.length, 3);
});

test('composition root applies the host pre-integration review gate', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  adapters.schedulerOptions = {
    concurrency: 1,
    async reviewBeforeIntegration(node, receipt) {
      calls.push(`review:${node.id}`);
      return { approved: true, reviewer: 'independent-host-review', sourceDigest: receipt.sourceDigestAfter! };
    },
  };

  const result = await runEvidenceGatedPipeline(input(checkout, specialists), adapters);

  assert.equal(result.executions[0].review?.reviewer, 'independent-host-review');
  assert.ok(calls.indexOf('accept:implement') < calls.indexOf('review:implement'));
  assert.ok(calls.indexOf('review:implement') < calls.indexOf('integrate:implement'));
});

test('a recovered execution attempt remains in history without blocking verification', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const compile = adapters.compileOpenSpec;
  const launch = adapters.scheduler.launch;
  let attempts = 0;
  adapters.compileOpenSpec = async (request) => {
    const compiled = await compile(request);
    return { ...compiled, nodes: compiled.nodes.map((node) => ({ ...node, maxAttempts: 2 })) };
  };
  adapters.scheduler.launch = (...args) => ++attempts === 1
    ? Promise.resolve({ ...completedProcess(), exitCode: 1 })
    : launch(...args);

  const result = await runEvidenceGatedPipeline(input(checkout, specialists), adapters);

  assert.equal(result.status, 'complete');
  assert.deepEqual(result.executions.map(({ attempt, status }) => ({ attempt, status })), [
    { attempt: 1, status: 'failed' },
    { attempt: 2, status: 'integrated' },
  ]);
  assert(calls.includes('verify:adversarial'));
});

test('low-risk pipeline completes with one provider through labeled sequential responsibilities', async () => {
  const { checkout, paths } = fixture(); const calls: string[] = [];
  const specialists: Specialist[] = [{ id: 'codex-only', expertise: ['product', 'architecture'], family: 'codex', architectEligible: true }];
  const request = {
    ...input(checkout, specialists),
    providerCapabilitySnapshot: {
      claude: { installed: true, authenticated: false, available: false },
      codex: { installed: true, authenticated: true, available: true },
      gemini: { installed: false, authenticated: false, available: false },
    },
    providerSlotLimits: { codex: 1 },
  };
  const adapters = configured(checkout, paths, calls);
  const provider = adapters.provider;
  let active = 0;
  let peak = 0;
  adapters.provider = async (...args) => {
    active += 1;
    peak = Math.max(peak, active);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return await provider(...args);
    } finally {
      active -= 1;
    }
  };
  adapters.verify = async ({ contract, executions }) => ({
    passed: executions.every((execution) => execution.status === 'integrated'),
    receipts: [{ reviewerFamily: 'codex', launcher: 'approved:codex-subscription', inputDigest: 'a'.repeat(64), outputDigest: 'b'.repeat(64), reviewedContractDigest: contract.contractDigest, passed: true }],
  });
  const result = await runEvidenceGatedPipeline(request, adapters);
  assert.equal(result.status, 'complete');
  assert.equal(peak, 1);
  assert.equal(result.conferenceExecution.mode, 'sequential-single-agent');
  assert.equal(result.conferenceExecution.independent, false);
  assert.match(result.conferenceExecution.limitation ?? '', /not independent evidence/);
  assert.equal(result.conferenceResolution.lead.family, 'codex');
  assert.equal(result.conferenceResolution.exchanges.length, 3);
  assert.ok(!calls.some((call) => call === 'provider:claude' || call === 'provider:gemini'));
});

test('high-risk conference invokes two distinct architect participants through approved provider calls', async () => {
  const { checkout, paths } = fixture(); const calls: string[] = [];
  const specialists: Specialist[] = [
    { id: 'claude-architect', expertise: ['security'], family: 'claude', architectEligible: true },
    { id: 'codex-architect', expertise: ['security'], family: 'codex', architectEligible: true },
    { id: 'gemini-researcher', expertise: ['security'], family: 'gemini', architectEligible: false },
  ];
  const request = {
    ...input(checkout, specialists), prompt: 'Design security architecture',
    riskReview: {
      authorized: true,
      authorityEvidence: 'receipt:explicit-test-authority',
      grantedScopes: ['auth-security' as const],
      reviewerFamilies: ['codex' as const, 'claude' as const],
      passed: true,
      evidence: ['review:codex', 'review:claude'],
    },
  };
  await runEvidenceGatedPipeline(request, configured(checkout, paths, calls));
  assert.ok(calls.includes('critique:claude-architect'));
  assert.ok(calls.includes('critique:codex-architect'));
});

test('production entrypoint requires mandatory research domains and explicit rail allowlist', async () => {
  const { checkout, paths, specialists } = fixture();
  const base = input(checkout, specialists);
  await assert.rejects(() => runEvidenceGatedPipeline({ ...base, approvedResearchRails: [] }, configured(checkout, paths, [])), /explicit approved research rail allowlist/);
  await assert.rejects(() => runEvidenceGatedPipeline({ ...base, requiredEvidence: ['repository-instructions', 'source-tests', 'primary-sources'] }, configured(checkout, paths, [])), /competitors-substitutes/);
});

test('production pipeline rejects unresolved research conflicts and unbound dissent resolution', async () => {
  const { checkout, paths, specialists } = fixture();
  const conflicted = configured(checkout, paths, []);
  const baseResearch = conflicted.research;
  conflicted.research = async (request) => ({ ...(await baseResearch(request)), conflicts: ['sources materially disagree'] });
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), conflicted), /unresolved research conflict/);

  const tampered = configured(checkout, paths, []);
  const baseProvider = tampered.provider;
  tampered.provider = async (family, providerInput) => {
    const result = await baseProvider(family, providerInput);
    if (!providerInput.startsWith('{')) return result;
    const parsed = JSON.parse(result.output);
    parsed.dissent = [{ topic: 'authority', position: 'retain server check', evidence: ['receipt'], resolutionOwner: parsed.participantId, providerReceipt: 'forged' }];
    return { ...result, output: JSON.stringify(parsed) };
  };
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), tampered), /not bound to the approved provider call/);
});

test('composition root fails closed when any production adapter is absent', async () => {
  const { checkout, specialists } = fixture();
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), {}), /missing research adapter/);
});

test('planning or successful launch cannot complete without integration and verification receipts', async () => {
  const { checkout, paths, specialists } = fixture(); const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  adapters.scheduler.integrate = async () => ({ sourceDigest: 'different-source' });
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), adapters), /did not integrate every node/);

  const second = configured(checkout, paths, []);
  second.verify = async () => ({ passed: true, receipts: [] });
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), second), /missing verification receipts/);
});

test('cross-family verification rejects a single family and forged receipts', async () => {
  const { checkout, paths, specialists } = fixture();
  const single = configured(checkout, paths, []);
  single.verify = async ({ contract }) => ({ passed: true, receipts: [{ reviewerFamily: 'claude', launcher: 'approved:claude', inputDigest: 'a'.repeat(64), outputDigest: 'b'.repeat(64), reviewedContractDigest: contract.contractDigest, passed: true }] });
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), single), /two distinct frontier model families/);

  const forged = configured(checkout, paths, []);
  forged.verify = async ({ contract }) => ({ passed: true, receipts: [
    { reviewerFamily: 'claude', launcher: 'approved:claude', inputDigest: 'not-a-digest', outputDigest: 'b'.repeat(64), reviewedContractDigest: contract.contractDigest, passed: true },
    { reviewerFamily: 'gemini', launcher: 'approved:gemini', inputDigest: 'a'.repeat(64), outputDigest: 'b'.repeat(64), reviewedContractDigest: contract.contractDigest, passed: true },
  ] });
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), forged), /Invalid cross-family verification receipt/);
});

test('invalid slice synthesis prevents architecture assignment and execution', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const provider = adapters.provider;
  adapters.provider = (family, request) => request.startsWith('Enhance these instructions')
    ? Promise.resolve({ launcher: 'approved:fixture', output: '{"summary":" "}' })
    : provider(family, request);
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), adapters), /Invalid prompt synthesis brief/);
  assert.ok(!calls.some((call) => /^(assign|compile|launch):/.test(call)));
});

test('automatic topic planning researches and synthesizes separate requested outcomes', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const provider = adapters.provider;
  const compile = adapters.compileOpenSpec;
  const prompt = 'Build a product catalog and add shipment tracking';
  adapters.provider = (family, request) => {
    if (!request.startsWith('Decompose the user request')) return provider(family, request);
    assert.equal(family, 'codex');
    assert.equal(JSON.parse(request.split('\n').at(-1)!).intake.prompt, prompt);
    return Promise.resolve({
      launcher: 'approved:fixture-codex',
      output: JSON.stringify([
        { topic: 'Product catalog', primaryQuery: 'catalog documentation', alternativesQuery: 'catalog alternatives' },
        { topic: 'Shipment tracking', primaryQuery: 'shipment documentation', alternativesQuery: 'shipment alternatives' },
      ]),
    });
  };
  adapters.compileOpenSpec = (request) => {
    assert.equal(request.hydratedBrief.evidence.research.length, 4);
    assert.equal(request.hydratedBrief.evidence.topicPlanReceipt?.launcher, 'approved:fixture-codex');
    assert.deepEqual(request.hydratedBrief.slices.map(({ topic }) => topic), ['Product catalog', 'Shipment tracking']);
    assert.ok(request.hydratedBrief.slices.every(({ researchDigests }) => researchDigests.length === 2));
    return compile(request);
  };
  await runEvidenceGatedPipeline({ ...input(checkout, specialists), prompt, researchRequests: undefined }, adapters);
});

test('production compilation refuses to spread a change across implementation nodes', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const compile = adapters.compileOpenSpec;
  adapters.compileOpenSpec = async (request) => {
    const compiled = await compile(request);
    return { ...compiled, nodes: [...compiled.nodes, { ...compiled.nodes[0], id: 'docs' }] };
  };
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), adapters), /exactly one implementation node/);
  assert.ok(!calls.some((call) => call.startsWith('launch:')));
});

test('reuse extraction overlaps implementation and supplies OpenSpec findings before verification', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const { launch } = adapters.scheduler;
  let startExtraction!: () => void;
  let startImplementation!: () => void;
  const extractionStarted = new Promise<void>((resolve) => { startExtraction = resolve; });
  const implementationStarted = new Promise<void>((resolve) => { startImplementation = resolve; });
  adapters.scheduler.launch = async (...args) => {
    startImplementation();
    await extractionStarted;
    return launch(...args);
  };
  adapters.extractReuse = async ({ contract }) => {
    startExtraction();
    await implementationStarted;
    calls.push('reuse:captured');
    return {
      ownerSession: 'fixture-reuse-owner',
      reviewedContractDigest: contract.contractDigest,
      findings: [{ destination: 'agent-skills', proposalPath: 'openspec/changes/reuse-fixture/proposal.md', evidence: ['Shared verification pattern'] }],
    };
  };
  const result = await runEvidenceGatedPipeline(input(checkout, specialists), adapters);
  assert.equal(result.reuseExtraction?.findings[0].destination, 'agent-skills');
  assert.ok(calls.indexOf('reuse:captured') < calls.indexOf('verify:adversarial'));
});

test('architect output queues all compiled changes and verifies each against its own contract', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const { compileOpenSpec, verify } = adapters;
  adapters.compileOpenSpec = async (request) => {
    const primary = await compileOpenSpec(request);
    const { schemaVersion: _, receiptDigest: __, ...authority } = request.assignment;
    const assignment = issueArchitectAssignment({ ...authority, changeId: 'follow-up' }, { digest: authority.authoritySourceDigest });
    const artifacts = primary.artifacts.map((artifact) => {
      const path = `follow-up-${artifact.path.replaceAll('/', '-')}`;
      const content = artifact.kind === 'tasks' ? artifact.content.replace('[implement]', '[follow-up]') : artifact.content;
      writeFileSync(join(checkout, path), content);
      return { ...artifact, path, content };
    });
    return {
      ...primary,
      additionalChanges: [{
        assignment, artifacts, dependsOn: [request.changeId],
        nodes: [{ ...primary.nodes[0], id: 'follow-up', branch: 'swarm/follow-up', worktree: 'follow-up', port: 4200, ownedPaths: ['src/follow-up.ts'] }],
      }],
    };
  };
  adapters.scheduler.changedFiles = async (node) => node.ownedPaths;
  adapters.verify = (request) => {
    assert.deepEqual(request.executions.map(({ nodeId }) => nodeId), request.contract.nodes.map(({ id }) => id));
    return verify(request);
  };
  adapters.extractReuse = async ({ contract }) => ({
    ownerSession: `fixture-reuse-${contract.changeId}`, reviewedContractDigest: contract.contractDigest, findings: [],
  });
  const result = await runEvidenceGatedPipeline(input(checkout, specialists), adapters);
  assert.deepEqual(result.contracts.map(({ changeId }) => changeId), ['governed-change', 'follow-up']);
  assert.deepEqual(result.reuseExtractions.map(({ reviewedContractDigest }) => reviewedContractDigest), result.contracts.map(({ contractDigest }) => contractDigest));
  assert.equal(new Set(result.verificationReceipts.map(({ reviewedContractDigest }) => reviewedContractDigest)).size, 2);
  assert.ok(calls.indexOf('integrate:implement') < calls.indexOf('launch:opencode-deepseek:follow-up'));
});

test('an admitted improvement must appear in the OpenSpec artifacts before dispatch', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const compile = adapters.compileOpenSpec;
  adapters.assessImprovements = async () => ({
    policy: { confidenceFloor: 0.8, valueFloor: 0.5, maxCost: 1, maxWip: 1 },
    candidates: [{
      id: 'reuse', title: 'Reuse the validator', summary: 'Both workflows use the same validator',
      evidence: 1, expectedValue: 1, novelty: 1, reversibility: 1, verifiability: 1, cost: 0.1, risk: 0,
      evidenceIds: ['repo-fixture'], authority: { decision: 'allowed', evidenceIds: ['request-fixture'] },
      verification: { method: 'Exercise both workflows', objective: true },
      conflictsWith: [], affectedPaths: ['src/app.ts'], packages: [], acceptanceCriteria: ['Both workflows pass'],
    }],
  });
  const originalArtifacts = paths.map((path) => readFileSync(join(checkout, path), 'utf8'));
  let includeImprovement = false;
  adapters.compileOpenSpec = async (request) => {
    if (!request.admittedImprovements?.length) return compile(request);
    assert.equal(request.admittedImprovements.length, 1);
    const [improvement] = request.admittedImprovements!;
    assert.equal(improvement.title, 'Reuse the validator');
    const compiled = await compile(request);
    if (includeImprovement) {
      for (const artifact of compiled.artifacts) {
        if (artifact.kind === 'spec') artifact.content += `\n### Requirement: ${improvement.id} — ${improvement.title}\n\n#### Scenario: Reuse checked\n`;
        if (artifact.kind === 'tasks') artifact.content += `\n- [ ] [${improvement.tasks[0].id}] Verify reuse. (requirements: ${improvement.id} — ${improvement.title}; scenarios: Reuse checked)\n`;
        writeFileSync(join(checkout, artifact.path), artifact.content);
      }
    }
    return compiled;
  };
  const request = { ...input(checkout, specialists), sourceRevision: 'a'.repeat(40) };
  await assert.rejects(() => runEvidenceGatedPipeline(request, adapters), /Admitted improvement .* is missing/);
  assert.ok(!calls.some((call) => call.startsWith('launch:')));
  includeImprovement = true;
  const result = await runEvidenceGatedPipeline(request, adapters);
  assert.equal(result.status, 'complete');
  assert.match(result.contract.nodes[0].workerPrompt ?? '', /Verify reuse/);
  paths.forEach((path, index) => writeFileSync(join(checkout, path), originalArtifacts[index]));
  const git = (...args: string[]) => execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8' }).trim();
  git('init', '-q');
  git('add', '.');
  git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'Integration fixture');
  const integratedRevision = git('rev-parse', 'HEAD');
  adapters.scheduler.integrate = async (_, sourceDigest) => ({ sourceDigest, integratedRevision });
  let nextRevision = 'b'.repeat(40);
  const assess = adapters.assessImprovements;
  adapters.assessImprovements = undefined;
  const refreshRounds: number[] = [];
  adapters.refreshImprovements = async ({ round, executions }) => {
    refreshRounds.push(round);
    assert.ok(executions.some(({ status }) => status === 'integrated'));
    const { candidates, policy } = await assess!({} as never);
    return {
      next: { ...request, changeId: 'improvement-wave', sourceRevision: nextRevision },
      candidates: round === 1 ? candidates : [],
      policy,
      refresh: {
        evidenceIds: [round < 3 ? 'initial-evidence' : 'updated-evidence'],
        coverageIds: ['fixture-coverage'],
        refreshedAt: new Date().toISOString(),
      },
    };
  };
  await assert.rejects(() => runEvidenceGatedPipeline(request, adapters), /current integrated Git revision/);
  refreshRounds.length = 0;
  nextRevision = integratedRevision;
  const withWave = await runEvidenceGatedPipeline(request, adapters);
  assert.deepEqual(refreshRounds, [1, 2, 3, 4]);
  assert.deepEqual(withWave.contracts.map(({ changeId }) => changeId), [request.changeId, 'improvement-wave']);
  assert.match(withWave.contracts[1].nodes[0].workerPrompt ?? '', /Verify reuse/);
});

test('configured proposal capture invokes a dedicated provider and records cited reuse', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const provider = adapters.provider;
  const roots = {
    'agent-skills': mkdtempSync(join(tmpdir(), 'reuse-skills-')),
    'theme.tools': mkdtempSync(join(tmpdir(), 'reuse-theme-')),
    'install.doctor': mkdtempSync(join(tmpdir(), 'reuse-install-')),
  };
  adapters.reuseProposalRoots = roots;
  adapters.provider = async (family, request) => {
    if (!request.startsWith('Review the OpenSpec evidence')) return provider(family, request);
    return {
      launcher: 'approved:fixture-reuse', sessionId: 'reuse-session-1',
      output: JSON.stringify(Object.keys(roots).map((destination) => ({
        destination, title: 'Share verification guidance', problem: 'Guidance is duplicated',
        benefit: 'One source', scope: 'Agent verification guidance', priority: 'high', dependencies: ['Confirm ownership'], acceptance: 'Both routes resolve to the same guidance',
        evidence: [paths[0]],
      }))),
    };
  };
  const result = await runEvidenceGatedPipeline(input(checkout, specialists), adapters);
  assert.equal(result.reuseExtraction?.ownerSession, 'reuse-session-1');
  assert.equal(result.reuseExtraction?.findings.length, 3);
  for (const finding of result.reuseExtraction!.findings) {
    const text = readFileSync(join(roots[finding.destination], finding.proposalPath), 'utf8');
    assert.match(text, /Guidance is duplicated/);
    assert.match(text, /## Priority\n\nhigh\n/);
    assert.match(text, /## Dependencies\n\n- Confirm ownership/);
    assert.ok(text.includes(paths[0]));
  }
  const repeated = await runEvidenceGatedPipeline(input(checkout, specialists), adapters);
  assert.deepEqual(repeated.reuseExtraction?.findings, result.reuseExtraction?.findings);
});

test('a forged architect assignment fails before OpenSpec compilation', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const assign = adapters.assignArchitect;
  adapters.assignArchitect = async (request) => ({
    ...await assign(request), architectIdentity: 'unverified-architect',
  });
  await assert.rejects(() => runEvidenceGatedPipeline(input(checkout, specialists), adapters), /Architect assignment digest mismatch/);
  assert.ok(!calls.includes('compile:openspec'));
});

test('an authorized but unavailable architect cannot start OpenSpec compilation', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const assign = adapters.assignArchitect;
  adapters.assignArchitect = async (request) => {
    const assignment = await assign(request);
    const { changeId, architectIdentity, assignedBy, authorityEvidence, authoritySourceDigest, assignedAt } = assignment;
    return issueArchitectAssignment({ changeId, architectFamily: 'antigravity', architectIdentity, assignedBy, authorityEvidence, authoritySourceDigest, assignedAt }, { digest: authoritySourceDigest });
  };
  await assert.rejects(() => runEvidenceGatedPipeline({
    ...input(checkout, specialists),
    providerCapabilitySnapshot: { codex: { available: true }, antigravity: { available: false } },
  }, adapters), /Architect provider is unavailable: antigravity/);
  assert.ok(!calls.includes('compile:openspec'));
});

test('an unavailable architect on an additional change prevents all worker launches', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const compile = adapters.compileOpenSpec;
  adapters.compileOpenSpec = async (request) => {
    const primary = await compile(request);
    const { schemaVersion: _, receiptDigest: __, ...authority } = request.assignment;
    const assignment = issueArchitectAssignment({
      ...authority, changeId: 'follow-up', architectFamily: 'antigravity', architectIdentity: 'antigravity-architect',
    }, { digest: authority.authoritySourceDigest });
    return { ...primary, additionalChanges: [{ ...primary, assignment }] };
  };

  await assert.rejects(() => runEvidenceGatedPipeline({
    ...input(checkout, specialists),
    providerCapabilitySnapshot: { codex: { available: true }, antigravity: { available: false } },
  }, adapters), /Architect provider is unavailable: antigravity/);
  assert.ok(calls.includes('compile:openspec'));
  assert.ok(calls.every((call) => !call.startsWith('launch:')));
});

test('accepted implementation reuse is reviewed before integration and captured afterward', async () => {
  const { checkout, paths, specialists } = fixture();
  const calls: string[] = [];
  const adapters = configured(checkout, paths, calls);
  const provider = adapters.provider;
  const proposals: ReuseProposal[] = [];
  adapters.captureReuseProposal = async (proposal) => {
    assert.ok(calls.includes('integrate:implement'));
    proposals.push(proposal);
    return 'openspec/changes/shared-component/proposal.md';
  };
  adapters.scheduler.readAcceptedReuseEvidence = async (_node, receipt) => ({
    sourceDigest: receipt.sourceDigestAfter!,
    excerpts: { 'src/app.ts': 'export const sharedComponent = true;' },
  });
  adapters.provider = async (family, request) => {
    if (!request.startsWith('Review the OpenSpec evidence')) return provider(family, request);
    const { evidence } = JSON.parse(request.split('\n').at(-1)!);
    const path = Object.keys(evidence).find((key) => key.endsWith(':src/app.ts'));
    if (path) {
      assert.ok(!calls.includes('integrate:implement'));
      assert.equal(evidence[path], 'export const sharedComponent = true;');
    }
    return { launcher: 'approved:fixture-reuse', sessionId: 'implementation-reuse', output: JSON.stringify(path ? [{
      destination: 'theme.tools', title: 'Share component', problem: 'Repeated behavior', benefit: 'One source',
      scope: 'Component export', priority: 'high', dependencies: [], acceptance: 'Consumers use the export', evidence: [path],
    }] : []) };
  };
  const run = () => runEvidenceGatedPipeline(input(checkout, specialists), adapters);
  const result = await run();
  assert.equal(result.reuseExtractions[1].findings.length, 1);
  assert.match(proposals[0].evidence[0], /:src\/app\.ts$/);

  calls.length = 0;
  adapters.scheduler.readAcceptedReuseEvidence = async (_node, receipt) => ({
    sourceDigest: receipt.sourceDigestAfter!,
    excerpts: { 'src/unowned.ts': 'unowned' },
  });
  await assert.rejects(run, /did not integrate/);
  assert.ok(!calls.includes('integrate:implement'));
  assert.equal(proposals.length, 1);

  adapters.scheduler.readAcceptedReuseEvidence = async () => ({
    sourceDigest: 'stale-source',
    excerpts: { 'src/app.ts': 'stale' },
  });
  await assert.rejects(run, /did not integrate/);
  assert.ok(!calls.includes('integrate:implement'));
  assert.equal(proposals.length, 1);
});
