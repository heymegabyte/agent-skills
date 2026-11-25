import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';
import {
  compileAndFreezeContract,
  createApprovedProcessAdapter,
  executeFrozenContract,
  issueArchitectAssignment,
  validateTaskGraph,
  type CompiledArtifact,
  type ExecutionNode,
  type ProcessReceipt,
  type SchedulerAdapter,
} from '../bin/swarm-execution-kernel.ts';

const processReceipt = (exitCode = 0): ProcessReceipt => ({ exitCode, stdout: '', stderr: '', startedAt: '2026-11-22T00:00:00Z', finishedAt: '2026-11-22T00:00:01Z' });

function fixture() {
  const checkout = mkdtempSync(join(tmpdir(), 'swarm-kernel-'));
  const paths = ['proposal.md', 'design.md', 'specs/capability/spec.md', 'tasks.md'];
  const contents = [
    '# Proposal\n\n## Why\n\nDeliver a verified execution pipeline.\n\n## What Changes\n\nCompile and execute bounded work safely.\n',
    '# Design\n\n**Architect Role:** assigned\n\n## Context\n\nThe execution contract requires semantic validation.\n\n## Goals / Non-Goals\n\nValidate all governed artifacts before launch.\n\n## Decisions\n\nUse content-derived traceability and isolated worktrees.\n',
    '# Spec\n\n### Requirement: R1\nThe system SHALL execute safely.\n\n#### Scenario: S1\n- **WHEN** work is ready\n- **THEN** it runs safely\n',
    '# Tasks\n\n- [ ] [bounded] Implement bounded work. (requirements: R1; scenarios: S1)\n- [ ] [integrate] Perform sensitive review. (requirements: R1; scenarios: S1)\n',
  ];
  for (const [index, path] of paths.entries()) { mkdirSync(join(checkout, path, '..'), { recursive: true }); writeFileSync(join(checkout, path), contents[index]); }
  const artifacts: CompiledArtifact[] = paths.map((path, index) => ({ kind: (['proposal', 'design', 'spec', 'tasks'] as const)[index], path, content: readFileSync(join(checkout, path), 'utf8'), requirements: ['SPOOFED'], scenarios: ['SPOOFED'], traceabilityIds: ['spoofed'] }));
  const authorityEvidence = 'Owner assigned Codex in the conversation';
  const authoritySourceDigest = createHash('sha256').update(authorityEvidence).digest('hex');
  const assignment = issueArchitectAssignment({ changeId: 'change', architectFamily: 'codex', architectIdentity: 'codex-root', assignedBy: 'owner', authorityEvidence, authoritySourceDigest, assignedAt: '2026-11-22T00:00:00Z' }, { digest: authoritySourceDigest });
  const nodes: ExecutionNode[] = [
    { id: 'bounded', title: 'bounded work', dependsOn: [], provider: 'opencode-deepseek', classification: 'bounded', worktree: 'w1', branch: 'swarm/bounded', port: 4100, ownedPaths: ['src/a.ts'], acceptance: [{ command: 'node', args: ['--test'] }], maxAttempts: 2, fallbackProviders: ['codex'] },
    { id: 'integrate', title: 'sensitive review', dependsOn: ['bounded'], provider: 'codex', classification: 'sensitive', worktree: 'w2', branch: 'swarm/integrate', port: 4110, ownedPaths: ['src/b.ts'], acceptance: [{ command: 'node', args: ['--test'] }] },
  ];
  return { checkout, artifacts, assignment, nodes };
}

function adapter(overrides: Partial<SchedulerAdapter> = {}): SchedulerAdapter & { calls: string[] } {
  const calls: string[] = []; let launchCount = 0;
  return {
    calls,
    async preflight(provider, node) { calls.push(`preflight:${provider}:${node.id}`); return { ok: true }; },
    async createWorktree(node) { calls.push(`worktree:${node.id}`); return { sourceDigest: `before-${node.id}` }; },
    async launch(provider, node) { calls.push(`launch:${provider}:${node.id}`); launchCount += 1; return processReceipt(); },
    async changedFiles(node) { calls.push(`changed:${node.id}`); return [`src/${node.id === 'bounded' ? 'a' : 'b'}.ts`]; },
    async runAcceptance(node) { calls.push(`accept:${node.id}`); return processReceipt(); },
    async sourceDigest(node) { return `after-${node.id}`; },
    async integrate(node, sourceDigest) { calls.push(`integrate:${node.id}`); return { sourceDigest }; },
    async preserveForRecovery(node) { calls.push(`preserve:${node.id}`); },
    ...overrides,
  };
}

test('assignment receipts are change-bound, tamper evident, and exclude OpenCode architecture', () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  assert.throws(() => compileAndFreezeContract({ checkout, changeId: 'other', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes }), /bound to change/);
  assert.throws(() => compileAndFreezeContract({ checkout, changeId: 'change', assignment: { ...assignment, architectIdentity: 'forged' }, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes }), /digest mismatch/);
  assert.throws(() => issueArchitectAssignment({ changeId: 'x', architectFamily: 'codex', architectIdentity: 'x', assignedBy: 'x', authorityEvidence: '', authoritySourceDigest: '', assignedAt: 'x' }, { digest: '' }), /authority evidence/);
  assert.throws(() => issueArchitectAssignment({ changeId: 'x', architectFamily: 'attacker' as never, architectIdentity: 'x', assignedBy: 'x', authorityEvidence: 'trusted', authoritySourceDigest: 'trusted', assignedAt: 'x' }, { digest: 'trusted' }), /Ineligible architect family/);
  assert.throws(() => compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: 'forged', evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes }), /trusted authority mismatch/);
});

test('compiler requires fixed point, current repository paths, traceability, and complete artifacts', () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  assert.throws(() => compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: ['auth decision'], artifacts, nodes }), /fixed point/);
  assert.throws(() => compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts: artifacts.filter((a) => a.kind !== 'design'), nodes }), /Missing OpenSpec design/);
  const contract = compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes });
  assert.equal(contract.nodes.length, 2);
  assert.equal(contract.contractDigest.length, 64);
  assert.deepEqual(contract.artifacts[0].requirements, ['R1']);
  assert.deepEqual(contract.artifacts[0].scenarios, ['S1']);
  assert.deepEqual(contract.artifacts[0].traceabilityIds, ['bounded', 'integrate']);
});

test('compiler rejects caller-metadata spoofing when artifact semantics or mappings are absent or hostile', () => {
  const missing = fixture();
  missing.artifacts.find((artifact) => artifact.kind === 'spec')!.content = '# Spec\n';
  writeFileSync(join(missing.checkout, 'specs/capability/spec.md'), '# Spec\n');
  assert.throws(() => compileAndFreezeContract({ checkout: missing.checkout, changeId: 'change', assignment: missing.assignment, trustedAuthoritySourceDigest: missing.assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts: missing.artifacts, nodes: missing.nodes }), /contains no requirements/);

  const spoof = fixture();
  const tasks = spoof.artifacts.find((artifact) => artifact.kind === 'tasks')!;
  tasks.content = '# Tasks\n\n- [ ] [bounded] Fake mapping. (requirements: INVENTED; scenarios: S1)\n- [ ] [integrate] Fake mapping. (requirements: R1; scenarios: S1)\n';
  writeFileSync(join(spoof.checkout, 'tasks.md'), tasks.content);
  assert.throws(() => compileAndFreezeContract({ checkout: spoof.checkout, changeId: 'change', assignment: spoof.assignment, trustedAuthoritySourceDigest: spoof.assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts: spoof.artifacts, nodes: spoof.nodes }), /unknown requirement: INVENTED/);

  const escaped = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'hostile-artifact-'));
  const outsideSpec = join(outside, 'spec.md');
  const spec = escaped.artifacts.find((artifact) => artifact.kind === 'spec')!;
  writeFileSync(outsideSpec, spec.content);
  rmSync(join(escaped.checkout, spec.path));
  symlinkSync(outsideSpec, join(escaped.checkout, spec.path));
  assert.throws(() => compileAndFreezeContract({ checkout: escaped.checkout, changeId: 'change', assignment: escaped.assignment, trustedAuthoritySourceDigest: escaped.assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts: escaped.artifacts, nodes: escaped.nodes }), /resolves outside repository/);
});

test('hostile graphs fail before launch', () => {
  const { nodes } = fixture();
  assert.throws(() => validateTaskGraph([{ ...nodes[0], ownedPaths: ['../secret'] }]), /Unsafe owned path/);
  assert.throws(() => validateTaskGraph([{ ...nodes[0], provider: 'codex', providerExceptionReason: undefined }]), /requires OpenCode/);
  assert.throws(() => validateTaskGraph([{ ...nodes[0], dependsOn: ['missing'] }]), /unknown dependency/);
  const collision = [{ ...nodes[0] }, { ...nodes[1], dependsOn: [], ownedPaths: ['src'], worktree: 'w3', branch: 'swarm/collision', port: 4120 }];
  assert.throws(() => validateTaskGraph(collision), /ownership collision/);
});

test('scheduler runs dependency waves and only integrates launched, accepted exact source', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  const contract = compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes });
  const fake = adapter(); const receipts = await executeFrozenContract(contract, fake);
  assert.deepEqual(receipts.map((r) => `${r.nodeId}:${r.status}`), ['bounded:integrated', 'integrate:integrated']);
  assert.ok(fake.calls.indexOf('integrate:bounded') < fake.calls.indexOf('launch:codex:integrate'));
  assert.ok(fake.calls.includes('launch:opencode-deepseek:bounded'));
});

test('failed launch is preserved, retried with PACE fallback, and cannot release dependents unless integrated', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture(); let first = true;
  const contract = compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes });
  const fake = adapter({ async launch(provider, node) { fake.calls.push(`launch:${provider}:${node.id}`); if (node.id === 'bounded' && first) { first = false; return processReceipt(1); } return processReceipt(); } });
  const receipts = await executeFrozenContract(contract, fake);
  assert.equal(receipts[0].status, 'failed');
  assert.equal(receipts[1].provider, 'codex');
  assert.equal(receipts[1].status, 'integrated');
  assert.ok(fake.calls.includes('preserve:bounded'));
  assert.equal(receipts.at(-1)?.nodeId, 'integrate');
});

test('ownership violation fails closed, preserves recovery, and blocks dependents', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture(); nodes[0].maxAttempts = 1;
  const contract = compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes });
  const fake = adapter({ async changedFiles() { return ['secrets.env']; } });
  const receipts = await executeFrozenContract(contract, fake);
  assert.equal(receipts.find((r) => r.nodeId === 'bounded')?.status, 'failed');
  assert.equal(receipts.find((r) => r.nodeId === 'integrate')?.status, 'blocked');
  assert.ok(!fake.calls.includes('integrate:bounded'));
});

test('timeout-shaped provider failure and partial integration mismatch preserve recovery and block dependents', async () => {
  const first = fixture(); first.nodes[0].maxAttempts = 1;
  const timedContract = compileAndFreezeContract({ checkout: first.checkout, changeId: 'change', assignment: first.assignment, trustedAuthoritySourceDigest: first.assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts: first.artifacts, nodes: first.nodes });
  const timed = adapter({ async launch(_provider, node) { timed.calls.push(`launch:timeout:${node.id}`); return { ...processReceipt(1), stderr: 'ETIMEDOUT' }; } });
  const timedReceipts = await executeFrozenContract(timedContract, timed);
  assert.equal(timedReceipts.find((receipt) => receipt.nodeId === 'bounded')?.status, 'failed');
  assert.equal(timedReceipts.find((receipt) => receipt.nodeId === 'integrate')?.status, 'blocked');
  assert.ok(timed.calls.includes('preserve:bounded'));

  const second = fixture(); second.nodes[0].maxAttempts = 1;
  const partialContract = compileAndFreezeContract({ checkout: second.checkout, changeId: 'change', assignment: second.assignment, trustedAuthoritySourceDigest: second.assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts: second.artifacts, nodes: second.nodes });
  const partial = adapter({ async integrate(node, sourceDigest) { partial.calls.push(`integrate:${node.id}`); return { sourceDigest: `${sourceDigest}-mismatch` }; } });
  const partialReceipts = await executeFrozenContract(partialContract, partial);
  assert.equal(partialReceipts.find((receipt) => receipt.nodeId === 'bounded')?.status, 'failed');
  assert.equal(partialReceipts.find((receipt) => receipt.nodeId === 'integrate')?.status, 'blocked');
  assert.ok(partial.calls.includes('preserve:bounded'));
});

test('unapproved or budget-missing provider preflight fails without launcher invocation', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  const contract = compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes });
  const fake = adapter({ async preflight(provider, node) { fake.calls.push(`preflight:${provider}:${node.id}`); return { ok: false, reason: 'launcher not approved or budget receipt missing' }; } });
  const receipts = await executeFrozenContract(contract, fake);
  assert.equal(receipts[0].status, 'failed');
  assert.match(receipts[0].failure ?? '', /budget receipt/);
  assert.ok(!fake.calls.some((call) => call.startsWith('launch:')));
});

test('process adapter rejects unapproved launchers, absent budgets, secrets, and unenforced egress', async () => {
  const { checkout, nodes } = fixture();
  nodes[0].secretReferences = ['secret://providers/deepseek'];
  nodes[0].allowedEgressHosts = ['api.deepseek.com'];
  const make = (launcher: Parameters<typeof createApprovedProcessAdapter>[0]['launchers']['opencode-deepseek'], secret?: string) => createApprovedProcessAdapter({
    checkout,
    safeWorktreeRoots: [checkout],
    launchers: { 'opencode-deepseek': launcher },
    allowedAcceptanceExecutables: ['node'],
    resolveSecretReference: () => secret,
    async createWorktree() { return { directory: checkout, sourceDigest: 'before' }; },
    async listChangedFiles() { return []; }, async sourceDigest() { return 'after'; },
    async integrate(_node, _directory, sourceDigest) { return { sourceDigest }; }, async preserveForRecovery() {},
  });
  assert.equal((await make(undefined).preflight('opencode-deepseek', nodes[0])).ok, false);
  assert.match((await make({ executable: 'false', fixedArgs: [], approved: true, enforcesWorktreeIsolation: true, enforcesBoundedEgress: true }).preflight('opencode-deepseek', nodes[0])).reason ?? '', /budget/);
  assert.match((await make({ executable: 'false', fixedArgs: [], approved: true, budgetReceipt: 'budget-1', enforcesWorktreeIsolation: true, enforcesBoundedEgress: true }).preflight('opencode-deepseek', nodes[0])).reason ?? '', /secret/);
  assert.match((await make({ executable: 'false', fixedArgs: [], approved: true, budgetReceipt: 'budget-1', enforcesWorktreeIsolation: true, enforcesBoundedEgress: false }, 'resolved').preflight('opencode-deepseek', nodes[0])).reason ?? '', /egress/);
});

test('accepted source mutation is fenced before integration', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture(); nodes[0].maxAttempts = 1;
  const contract = compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes, frozenBaseRevision: 'base-revision-1' });
  let reads = 0;
  const fake = adapter({ async sourceDigest(node) { reads += 1; return reads === 1 ? `after-${node.id}` : `mutated-${node.id}`; } });
  const receipts = await executeFrozenContract(contract, fake);
  assert.match(receipts.find((receipt) => receipt.nodeId === 'bounded')?.failure ?? '', /changed before integration/);
  assert.ok(!fake.calls.includes('integrate:bounded'));
});

test('central integration is serialized and receives the frozen base revision', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  nodes[1] = { ...nodes[1], dependsOn: [] };
  const contract = compileAndFreezeContract({ checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest, evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes, frozenBaseRevision: 'base-revision-1' });
  let active = 0; let peak = 0; const bases: string[] = [];
  const fake = adapter({ async integrate(node, sourceDigest, base) { active += 1; peak = Math.max(peak, active); bases.push(base); await new Promise((resolve) => setTimeout(resolve, 5)); active -= 1; fake.calls.push(`integrate:${node.id}`); return { sourceDigest }; } });
  const receipts = await executeFrozenContract(contract, fake);
  assert.ok(receipts.every((receipt) => receipt.status === 'integrated'));
  assert.equal(peak, 1);
  assert.deepEqual(bases, ['base-revision-1', 'base-revision-1']);
});

test('process adapter rejects hostile acceptance arguments beyond executable allowlisting', async () => {
  const { checkout, nodes } = fixture();
  const processAdapter = createApprovedProcessAdapter({
    checkout,
    safeWorktreeRoots: [checkout],
    launchers: {},
    allowedAcceptanceExecutables: ['node'],
    resolveSecretReference: () => undefined,
    async createWorktree() { return { directory: checkout, sourceDigest: 'before' }; },
    async listChangedFiles() { return []; }, async sourceDigest() { return 'after'; },
    async integrate(_node, _directory, sourceDigest) { return { sourceDigest }; }, async preserveForRecovery() {},
  });
  await processAdapter.createWorktree(nodes[0]);
  await assert.rejects(() => processAdapter.runAcceptance(nodes[0], { command: 'node', args: ['--eval', 'process.exit(0)'] }, new AbortController().signal), /Unsafe Node acceptance flag/);
  await assert.rejects(() => processAdapter.runAcceptance(nodes[0], { command: 'node', args: ['tests/a.test.ts;touch', 'owned'] }, new AbortController().signal), /Unsafe acceptance argument/);
});

test('process adapter rejects worktrees outside safe roots and symlink swaps before commands', async () => {
  const { checkout, nodes } = fixture();
  const outside = mkdtempSync(join(tmpdir(), 'hostile-worktree-'));
  const link = join(checkout, 'worktree-link');
  symlinkSync(outside, link);
  const hostile = createApprovedProcessAdapter({
    checkout,
    safeWorktreeRoots: [checkout],
    launchers: {}, allowedAcceptanceExecutables: ['node'], resolveSecretReference: () => undefined,
    async createWorktree() { return { directory: link, sourceDigest: 'before' }; },
    async listChangedFiles() { return []; }, async sourceDigest() { return 'after'; },
    async integrate(_node, _directory, sourceDigest) { return { sourceDigest }; }, async preserveForRecovery() {},
  });
  await assert.rejects(() => hostile.createWorktree(nodes[0]), /outside configured safe roots/);

  const initiallySafe = join(checkout, 'initially-safe');
  mkdirSync(initiallySafe);
  let callbackReached = false;
  const swapped = createApprovedProcessAdapter({
    checkout,
    safeWorktreeRoots: [checkout],
    launchers: {}, allowedAcceptanceExecutables: ['node'], resolveSecretReference: () => undefined,
    async createWorktree() { return { directory: initiallySafe, sourceDigest: 'before' }; },
    async listChangedFiles() { callbackReached = true; return []; }, async sourceDigest() { return 'after'; },
    async integrate(_node, _directory, sourceDigest) { return { sourceDigest }; }, async preserveForRecovery() {},
  });
  await swapped.createWorktree(nodes[0]);
  rmSync(initiallySafe, { recursive: true });
  symlinkSync(outside, initiallySafe);
  await assert.rejects(() => swapped.changedFiles(nodes[0]), /outside configured safe roots/);
  assert.equal(callbackReached, false);

  const missingRoots = createApprovedProcessAdapter({
    checkout,
    safeWorktreeRoots: [], launchers: {}, allowedAcceptanceExecutables: ['node'], resolveSecretReference: () => undefined,
    async createWorktree() { return { directory: checkout, sourceDigest: 'before' }; },
    async listChangedFiles() { return []; }, async sourceDigest() { return 'after'; },
    async integrate(_node, _directory, sourceDigest) { return { sourceDigest }; }, async preserveForRecovery() {},
  });
  await assert.rejects(() => missingRoots.createWorktree(nodes[0]), /safe worktree root is required/);
});
