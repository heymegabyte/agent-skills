import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createDetachedDevelopmentWorktree } from '../bin/local-development-worktree.ts';
import { localDevelopmentLauncher } from '../bin/local-development-launchers.ts';
import {
  compileAndFreezeContract,
  createApprovedProcessAdapter,
  executeFrozenContract,
  executeFrozenChanges,
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
    async integrate(node, sourceDigest) { calls.push(`integrate:${node.id}`); return { sourceDigest, integratedRevision: `revision-${node.id}` }; },
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

test('local development worktree starts at the frozen commit and preserves local edits', async () => {
  const root = mkdtempSync(join(tmpdir(), 'development-worktree-test-'));
  const checkout = join(root, 'source');
  mkdirSync(checkout);
  const git = (directory: string, ...args: string[]) =>
    execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  try {
    git(checkout, 'init', '-q');
    const source = join(checkout, 'fixture.txt');
    writeFileSync(source, 'frozen source');
    git(checkout, 'add', 'fixture.txt');
    git(checkout, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', 'Frozen fixture');
    const base = git(checkout, 'rev-parse', 'HEAD');
    writeFileSync(source, 'concurrent local edits');

    const created = createDetachedDevelopmentWorktree(checkout, root, base);

    assert.equal(created.sourceDigest, base);
    assert.equal(git(created.directory, 'rev-parse', 'HEAD'), base);
    assert.equal(git(created.directory, 'status', '--porcelain'), '');
    assert.equal(readFileSync(join(created.directory, 'fixture.txt'), 'utf8'), 'frozen source');
    assert.equal(readFileSync(source, 'utf8'), 'concurrent local edits');
    assert.throws(() => createDetachedDevelopmentWorktree(checkout, root, 'HEAD'), /full Git commit identity/);
    git(checkout, 'add', 'fixture.txt');
    const commit = (message: string) =>
      git(checkout, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.test', 'commit', '-qm', message);
    commit('Integrate first prerequisite');
    const first = git(checkout, 'rev-parse', 'HEAD');
    writeFileSync(join(checkout, 'second.txt'), 'second prerequisite');
    git(checkout, 'add', 'second.txt');
    commit('Integrate second prerequisite');
    const second = git(checkout, 'rev-parse', 'HEAD');
    const dependent = createDetachedDevelopmentWorktree(checkout, root, base, { first, second });
    assert.equal(dependent.sourceDigest, second);
    assert.equal(readFileSync(join(dependent.directory, 'fixture.txt'), 'utf8'), 'concurrent local edits');
    assert.equal(readFileSync(join(dependent.directory, 'second.txt'), 'utf8'), 'second prerequisite');

    const { nodes } = fixture();
    let selected = created;
    const processAdapter = createApprovedProcessAdapter({
      checkout, safeWorktreeRoots: [root], launchers: {}, allowedAcceptanceExecutables: [],
      resolveSecretReference: () => undefined,
      async createWorktree() { return selected; },
      async listChangedFiles() { return []; },
      async sourceDigest() { return selected.sourceDigest; },
      async integrate(_, __, sourceDigest) { return { sourceDigest }; },
      async preserveForRecovery() {},
    });
    await assert.rejects(() => processAdapter.createWorktree(nodes[0], base, { first, second }), /does not contain required revision/);
    selected = dependent;
    assert.equal((await processAdapter.createWorktree(nodes[0], base, { first, second })).sourceDigest, second);

    git(checkout, 'switch', '--detach', base);
    writeFileSync(source, 'divergent source');
    git(checkout, 'add', 'fixture.txt');
    commit('Divergent prerequisite');
    const divergent = git(checkout, 'rev-parse', 'HEAD');
    assert.throws(() => createDetachedDevelopmentWorktree(checkout, root, base, { second, divergent }), /contains the frozen base and every prerequisite/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('local dispatch maps each supported provider to its canonical wrapper', () => {
  const { checkout, nodes } = fixture();
  nodes[0].workerPrompt = 'Add the bounded fixture.\nCover the empty result.';
  const evidence = {
    agentSkillsCheckout: checkout,
    budgetReceipt: 'fixture-budget',
    enforcesWorktreeIsolation: true,
    enforcesBoundedEgress: false,
  };
  const paths = [
    ['codex', 'with-subscription-cli.sh', ['codex', 'exec', '--sandbox', 'workspace-write', '--cd', checkout]],
    ['claude', 'with-subscription-cli.sh', ['claude', '--print', '--permission-mode', 'acceptEdits', '--strict-mcp-config']],
    ['opencode-deepseek', 'opencode-deepseek.sh', ['run', '--pure', '-m', 'litellm/deepseek-v4-pro', '--dir', checkout]],
  ] as const;

  for (const [provider, wrapper, prefix] of paths) {
    const launcher = localDevelopmentLauncher(provider, evidence);
    const args = [...launcher.fixedArgs, ...launcher.taskArgs!(nodes[0], 'fixture', checkout)];
    assert.equal(launcher.executable, join(checkout, 'bin', wrapper));
    assert.deepEqual(args.slice(0, -2), [...prefix]);
    assert.equal(args.at(-2), '--');
    const prompt = args.at(-1)!;
    assert.match(prompt, /Restrict edits to the owned paths/);
    assert.match(prompt, /assigns independent changes concurrently, defaults to OpenCode with DeepSeek via LiteLLM/);
    assert.match(prompt, /do not change provider, permissions, ownership, or acceptance requirements/);
    assert.deepEqual(JSON.parse(prompt.split('\n').at(-1)!), {
      task: nodes[0].title,
      details: nodes[0].workerPrompt,
      ownedPaths: nodes[0].ownedPaths,
      acceptance: nodes[0].acceptance,
    });
    assert.equal(launcher.budgetReceipt, evidence.budgetReceipt);
  }
});

test('scheduler rejects changes to frozen task inputs before adapter calls', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  nodes[0].workerPrompt = 'Cover the fixture edge case.';
  const invalid = structuredClone(nodes);
  invalid[0].workerPrompt = '   ';
  assert.throws(() => validateTaskGraph(invalid), /Invalid worker prompt/);
  const contract = compileAndFreezeContract({
    checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest,
    evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes,
  });
  contract.nodes[0].workerPrompt = 'Changed after approval';
  const runner = adapter();

  await assert.rejects(executeFrozenContract(contract, runner), /do not match their digests/);
  assert.deepEqual(runner.calls, []);
});

test('verified worker prompt and nested task inputs stay fixed through adapter dispatch', async (t) => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  t.after(() => rmSync(checkout, { recursive: true, force: true }));
  nodes[0].workerPrompt = 'Implement the approved fixture.';
  const contract = compileAndFreezeContract({
    checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest,
    evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes,
  });
  const launched: string[] = [];
  const runner = adapter({
    async preflight(_provider, node) {
      if (node.id === 'bounded') {
        assert.throws(() => { node.workerPrompt = 'Changed during launch preparation'; }, TypeError);
        assert.throws(() => { node.ownedPaths.push('src/other.ts'); }, TypeError);
        assert.throws(() => { node.acceptance[0].args.push('--help'); }, TypeError);
      }
      return { ok: true };
    },
    async launch(_provider, node) {
      if (node.workerPrompt) launched.push(node.workerPrompt);
      return processReceipt();
    },
  });
  const receipts = await executeFrozenContract(contract, runner);
  assert.deepEqual(launched, ['Implement the approved fixture.']);
  assert.deepEqual(receipts.map(({ status }) => status), ['integrated', 'integrated']);
});

test('scheduler bounds independent ready work to the configured wave size', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  nodes[1].dependsOn = [];
  const contract = compileAndFreezeContract({
    checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest,
    evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes,
  });
  const runner = adapter();

  await assert.rejects(executeFrozenContract(contract, runner, { concurrency: 0 }), /positive integer/);
  assert.deepEqual(runner.calls, []);
  const receipts = await executeFrozenContract(contract, runner, { concurrency: 1 });

  assert.deepEqual(receipts.map(({ status }) => status), ['integrated', 'integrated']);
  assert(runner.calls.indexOf('integrate:bounded') < runner.calls.indexOf('preflight:codex:integrate'));
});

test('scheduler fills freed capacity after a dependency integrates while unrelated work continues', async (t) => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  t.after(() => rmSync(checkout, { recursive: true, force: true }));
  const slowNode: ExecutionNode = {
    ...nodes[0], id: 'slow', worktree: 'w3', branch: 'swarm/slow', port: 4120, ownedPaths: ['src/slow.ts'],
  };
  nodes.splice(1, 0, slowNode);
  const tasks = artifacts.find(({ kind }) => kind === 'tasks')!;
  tasks.content += '- [ ] [slow] Run the independent fixture task. (requirements: R1; scenarios: S1)\n';
  writeFileSync(join(checkout, tasks.path), tasks.content);
  const contract = compileAndFreezeContract({
    checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest,
    evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes,
  });
  const events: string[] = [];
  let releaseSlow!: () => void;
  let markFirstIntegration!: () => void;
  const slow = new Promise<void>((resolve) => { releaseSlow = resolve; });
  const firstIntegration = new Promise<void>((resolve) => { markFirstIntegration = resolve; });
  const runner = adapter({
    async launch(_provider, node) {
      events.push('launch:' + node.id);
      if (node.id === 'slow') await slow;
      return processReceipt();
    },
    async changedFiles(node) { return [...node.ownedPaths]; },
    async integrate(node, sourceDigest) {
      events.push('integrate:' + node.id);
      if (node.id === 'bounded') markFirstIntegration();
      return { sourceDigest };
    },
  });
  const execution = executeFrozenContract(contract, runner, { concurrency: 2 });
  await firstIntegration;
  await new Promise<void>((resolve) => setImmediate(resolve));
  const dependentStartedEarly = events.includes('launch:integrate');
  releaseSlow();
  const receipts = await execution;
  assert.equal(dependentStartedEarly, true);
  assert(events.indexOf('integrate:bounded') < events.indexOf('launch:integrate'));
  assert.equal(receipts.filter(({ status }) => status === 'integrated').length, 3);
});

test('configured 8, 24 and 76 worker caps are enforced across a ready backlog', async () => {
  const { checkout, artifacts, assignment } = fixture();
  const nodes: ExecutionNode[] = Array.from({ length: 77 }, (_, index) => ({
    id: `task-${index}`, title: 'Fixture task', provider: 'opencode-deepseek', classification: 'bounded',
    dependsOn: [], worktree: `worktree-${index}`, branch: `swarm/task-${index}`, port: 4300 + index,
    ownedPaths: [`src/file-${index}.ts`], acceptance: [{ command: 'node', args: ['--test'] }],
  }));
  const tasks = artifacts.find(({ kind }) => kind === 'tasks')!;
  tasks.content = nodes.map(({ id }) => `- [ ] [${id}] Run fixture (requirements: R1; scenarios: S1)`).join('\n');
  writeFileSync(join(checkout, tasks.path), tasks.content);
  const contract = compileAndFreezeContract({
    checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest,
    evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes,
  });

  for (const concurrency of [8, 24, 76]) {
    let active = 0;
    let peak = 0;
    const runner = adapter({
      async launch() {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise<void>((resolve) => setImmediate(resolve));
        active -= 1;
        return processReceipt();
      },
      async changedFiles(node) { return node.ownedPaths; },
    });
    const receipts = await executeFrozenContract(contract, runner, { concurrency });
    assert.equal(peak, concurrency);
    assert.equal(receipts.length, nodes.length);
    assert(receipts.every(({ status }) => status === 'integrated'));
  }
});

test('provider launch limits isolate constrained rails and also fence fallbacks', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  nodes[1].dependsOn = [];
  const contract = compileAndFreezeContract({
    checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest,
    evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes,
  });
  const launched: string[] = [];
  let codexActive = 0;
  let codexPeak = 0;
  const runner = adapter({
    async launch(provider, node) {
      launched.push(`${provider}:${node.id}`);
      if (provider === 'opencode-deepseek') return processReceipt(1);
      codexActive += 1;
      codexPeak = Math.max(codexPeak, codexActive);
      await new Promise<void>((resolve) => setImmediate(resolve));
      codexActive -= 1;
      return processReceipt();
    },
  });
  const receipts = await executeFrozenContract(contract, runner, {
    concurrency: 2, providerConcurrency: { codex: 1, 'opencode-deepseek': 1 },
  });

  assert.deepEqual(launched.slice(0, 2).sort(), ['codex:integrate', 'opencode-deepseek:bounded']);
  assert(launched.includes('codex:bounded'));
  assert.equal(codexPeak, 1);
  assert.equal(receipts.filter(({ status }) => status === 'integrated').length, 2);
  await assert.rejects(executeFrozenContract(contract, runner, { providerConcurrency: { claude: 0 } }), /positive integer/);
});

test('provider setup failures leave independent ready work running', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  nodes[0].maxAttempts = 1;
  nodes[1].dependsOn = [];
  const contract = compileAndFreezeContract({
    checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest,
    evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes,
  });

  for (const phase of ['preflight', 'createWorktree'] as const) {
    const runner = adapter();
    if (phase === 'preflight') {
      const original = runner.preflight;
      runner.preflight = async (provider, node) => {
        if (node.id === 'bounded') throw new Error('Fixture setup failed');
        return original(provider, node);
      };
    } else {
      const original = runner.createWorktree;
      runner.createWorktree = async (node) => {
        if (node.id === 'bounded') throw new Error('Fixture setup failed');
        return original(node);
      };
    }
    const receipts = await executeFrozenContract(contract, runner);

    assert.equal(receipts.find(({ nodeId }) => nodeId === 'bounded')?.failure, 'Fixture setup failed');
    assert.equal(receipts.find(({ nodeId }) => nodeId === 'integrate')?.status, 'integrated');
    assert(runner.calls.includes('preserve:bounded'));
    assert(!runner.calls.includes('launch:opencode-deepseek:bounded'));
  }

  const cancelled = adapter();
  const receipts = await executeFrozenContract(contract, cancelled, { signal: AbortSignal.abort('already cancelled') });
  assert.deepEqual(receipts.map(({ status }) => status), ['cancelled', 'cancelled']);
  assert.deepEqual(cancelled.calls, []);
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

test('pre-integration review is bound to accepted source and requires observed work', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  nodes[0].maxAttempts = 1;
  const contract = compileAndFreezeContract({
    checkout, changeId: 'change', assignment, trustedAuthoritySourceDigest: assignment.authoritySourceDigest,
    evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts, nodes,
  });

  const accepted = adapter();
  const passing = await executeFrozenContract(contract, accepted, {
    async reviewBeforeIntegration(node, receipt) {
      assert(accepted.calls.includes(`accept:${node.id}`));
      assert(!accepted.calls.includes(`integrate:${node.id}`));
      return { reviewer: 'fixture-independent', approved: true, sourceDigest: receipt.sourceDigestAfter! };
    },
  });
  assert.deepEqual(passing.map(({ status }) => status), ['integrated', 'integrated']);
  assert.equal(passing[0].review?.reviewer, 'fixture-independent');

  const rejected = adapter();
  const failing = await executeFrozenContract(contract, rejected, {
    async reviewBeforeIntegration() {
      return { reviewer: 'fixture-independent', approved: true, sourceDigest: 'different-source' };
    },
  });
  assert.match(failing[0].failure ?? '', /did not approve the accepted source/);
  assert(!rejected.calls.some((call) => call.startsWith('integrate:')));

  const empty = adapter({ async changedFiles() { return []; } });
  const noDiff = await executeFrozenContract(contract, empty, {
    async reviewBeforeIntegration() { throw new Error('No diff must be rejected before review'); },
  });
  assert.match(noDiff[0].failure ?? '', /requires an owned diff and executed acceptance/);
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

test('headless process adapter closes standard input for child commands', async () => {
  const { checkout, nodes } = fixture();
  writeFileSync(join(checkout, 'read-stdin.mjs'), 'for await (const _ of process.stdin) {} console.log("stdin ended");');
  const processAdapter = createApprovedProcessAdapter({
    checkout,
    safeWorktreeRoots: [checkout],
    launchers: {},
    allowedAcceptanceExecutables: ['node'],
    processTimeoutMs: 1500,
    resolveSecretReference: () => undefined,
    async createWorktree() { return { directory: checkout, sourceDigest: 'before' }; },
    async listChangedFiles() { return []; },
    async sourceDigest() { return 'after'; },
    async integrate(_node, _directory, sourceDigest) { return { sourceDigest }; },
    async preserveForRecovery() {},
  });

  await processAdapter.createWorktree(nodes[0]);
  const receipt = await processAdapter.runAcceptance(
    nodes[0], { command: 'node', args: ['read-stdin.mjs'] }, new AbortController().signal,
  );

  assert.equal(receipt.exitCode, 0);
  assert.equal(receipt.stdout.trim(), 'stdin ended');
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

test('whole-change queue validates each frozen contract and follows inter-change dependencies', async () => {
  const { checkout, artifacts, assignment, nodes } = fixture();
  const { receiptDigest: _, schemaVersion: __, ...authority } = assignment;
  const contracts = nodes.map((node, index) => {
    const changeId = `change-${index}`;
    const assigned = issueArchitectAssignment({ ...authority, changeId }, { digest: authority.authoritySourceDigest });
    return compileAndFreezeContract({
      checkout, changeId, assignment: assigned, trustedAuthoritySourceDigest: authority.authoritySourceDigest,
      evidenceDigest: 'e', fixedPointDigest: 'f', unresolvedMaterialDeltas: [], artifacts,
      nodes: [{ ...node, dependsOn: [] }],
    });
  });
  const scheduler = adapter({
    async createWorktree(node, _, prerequisites) {
      assert.deepEqual(prerequisites, node.id === 'integrate' ? { bounded: 'revision-bounded' } : undefined);
      return { sourceDigest: prerequisites?.bounded ?? `before-${node.id}` };
    },
    async integrate(node, sourceDigest, base) {
      assert.equal(base, node.id === 'integrate' ? 'revision-bounded' : contracts[0].frozenBaseRevision);
      scheduler.calls.push(`integrate:${node.id}`);
      return { sourceDigest, integratedRevision: `revision-${node.id}` };
    },
  });
  const changes = contracts.map((contract, index) => ({ contract, dependsOn: index ? [contracts[0].changeId] : [] }));
  await assert.rejects(() => executeFrozenChanges([{ ...changes[1] }], scheduler), /Unknown change dependency/);
  assert.equal(scheduler.calls.length, 0);
  const receipts = await executeFrozenChanges(changes, scheduler);
  assert.ok(receipts.every(({ status }) => status === 'integrated'));
  assert.ok(scheduler.calls.indexOf('integrate:bounded') < scheduler.calls.indexOf('launch:codex:integrate'));
  const missingRevision = adapter({ async integrate(_, sourceDigest) { return { sourceDigest }; } });
  const missingReceipts = await executeFrozenChanges(changes, missingRevision);
  assert.match(missingReceipts.find(({ nodeId }) => nodeId === 'integrate')?.failure ?? '', /no integrated revision receipt/);
  assert.ok(!missingRevision.calls.includes('launch:codex:integrate'));
  let active = 0;
  let peak = 0;
  let bothStarted!: () => void;
  const ready = new Promise<void>((resolve) => { bothStarted = resolve; });
  const parallel = adapter({
    async launch() {
      active += 1;
      peak = Math.max(peak, active);
      if (active === 2) bothStarted();
      await ready;
      active -= 1;
      return processReceipt();
    },
  });
  await executeFrozenChanges(contracts.map((contract) => ({ contract, dependsOn: [] })), parallel, { concurrency: 2 });
  assert.equal(peak, 2);
});

test('ownership validation permits shared paths across a transitive dependency only', () => {
  const { nodes } = fixture();
  const [first, middle] = nodes;
  const final = { ...first, id: 'final', worktree: 'w3', branch: 'swarm/final', port: 4120, dependsOn: [middle.id] };
  assert.doesNotThrow(() => validateTaskGraph([first, middle, final]));
  assert.throws(() => validateTaskGraph([first, { ...middle, dependsOn: [] }, final]), /Parallel ownership collision/);
});
