#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative, sep } from 'node:path';
import { listDevelopmentChangedFiles, readCommittedReuseEvidence } from './local-development-worktree.ts';

export type ArchitectFamily = 'claude' | 'codex' | 'gemini' | 'antigravity';
export type ExecutionProvider = ArchitectFamily | 'opencode-deepseek';
export type NodeStatus = 'pending' | 'running' | 'accepted' | 'integrated' | 'failed' | 'blocked' | 'cancelled';

export interface ArchitectAssignmentReceipt {
  schemaVersion: 1;
  changeId: string;
  architectFamily: ArchitectFamily;
  architectIdentity: string;
  assignedBy: string;
  authorityEvidence: string;
  authoritySourceDigest: string;
  assignedAt: string;
  receiptDigest: string;
}

export interface CompiledArtifact {
  kind: 'proposal' | 'design' | 'spec' | 'tasks';
  path: string;
  content: string;
  requirements: string[];
  scenarios: string[];
  traceabilityIds: string[];
}

export interface ExecutionNode {
  id: string;
  title: string;
  /** Task details supplied by the approved compiler and bound by the graph digest. */
  workerPrompt?: string;
  dependsOn: string[];
  provider: ExecutionProvider;
  classification: 'architecture' | 'sensitive' | 'bounded';
  providerExceptionReason?: string;
  worktree: string;
  branch: string;
  port: number;
  ownedPaths: string[];
  acceptance: Array<{ command: string; args: string[] }>;
  maxAttempts?: number;
  fallbackProviders?: ExecutionProvider[];
  secretReferences?: string[];
  allowedEgressHosts?: string[];
}

export interface FrozenContract {
  schemaVersion: 1;
  changeId: string;
  assignmentDigest: string;
  evidenceDigest: string;
  fixedPointDigest: string;
  artifactDigest: string;
  graphDigest: string;
  contractDigest: string;
  frozenBaseRevision: string;
  artifacts: CompiledArtifact[];
  nodes: ExecutionNode[];
}

export interface ProcessReceipt {
  exitCode: number;
  stdout: string;
  stderr: string;
  startedAt: string;
  finishedAt: string;
}

export interface IndependentReviewReceipt {
  readonly reviewer: string;
  readonly sourceDigest: string;
  readonly approved: boolean;
}

export interface NodeExecutionReceipt {
  runId: string;
  nodeId: string;
  provider: ExecutionProvider;
  attempt: number;
  status: NodeStatus;
  worktree: string;
  sourceDigestBefore: string;
  sourceDigestAfter?: string;
  changedFiles: string[];
  launcher?: ProcessReceipt;
  acceptance: ProcessReceipt[];
  review?: IndependentReviewReceipt;
  integration?: { baseRevision: string; sourceDigest: string; integratedRevision?: string };
  failure?: string;
  recoveryAction?: string;
}

export interface SchedulerAdapter {
  readAcceptedReuseEvidence?: (node: ExecutionNode, receipt: Readonly<NodeExecutionReceipt>, signal: AbortSignal) =>
    Promise<{ sourceDigest: string; excerpts: Record<string, string> }>;
  preflight(provider: ExecutionProvider, node: ExecutionNode): Promise<{ ok: boolean; reason?: string }>;
  createWorktree(node: ExecutionNode, frozenBaseRevision?: string, prerequisiteRevisions?: Readonly<Record<string, string>>): Promise<{ sourceDigest: string }>;
  launch(provider: ExecutionProvider, node: ExecutionNode, correlationId: string, signal: AbortSignal): Promise<ProcessReceipt>;
  changedFiles(node: ExecutionNode): Promise<string[]>;
  runAcceptance(node: ExecutionNode, check: { command: string; args: string[] }, signal: AbortSignal): Promise<ProcessReceipt>;
  sourceDigest(node: ExecutionNode): Promise<string>;
  integrate(node: ExecutionNode, expectedSourceDigest: string, frozenBaseRevision: string): Promise<{ sourceDigest: string; integratedRevision?: string }>;
  preserveForRecovery(node: ExecutionNode, reason: string): Promise<void>;
}

export interface ApprovedLauncher {
  executable: string;
  runtimeProfile?: 'isolated-opencode';
  fixedArgs: string[];
  taskArgs?: (node: ExecutionNode, correlationId: string, worktree: string) => string[];
  approved: boolean;
  budgetReceipt?: string;
  enforcesWorktreeIsolation: boolean;
  enforcesBoundedEgress: boolean;
}

export interface ProcessAdapterOptions {
  checkout: string;
  /** Existing directories inside which provider and acceptance processes may run. */
  safeWorktreeRoots: string[];
  launchers: Partial<Record<ExecutionProvider, ApprovedLauncher>>;
  allowedAcceptanceExecutables: string[];
  allowedAcceptanceArgs?: (command: string, args: string[]) => boolean;
  processTimeoutMs?: number;
  resolveSecretReference: (reference: string) => string | undefined;
  createWorktree: (node: ExecutionNode, frozenBaseRevision?: string, prerequisiteRevisions?: Readonly<Record<string, string>>) => Promise<{ directory: string; sourceDigest: string }>;
  /** Opt in only for paths approved for disclosure to the reuse reviewer. */
  approveReusePath?: (node: ExecutionNode, path: string) => boolean;
  listChangedFiles?: (node: ExecutionNode, directory: string) => Promise<string[]>;
  sourceDigest: (node: ExecutionNode, directory: string) => Promise<string>;
  integrate: (node: ExecutionNode, directory: string, expectedSourceDigest: string, frozenBaseRevision: string) => Promise<{ sourceDigest: string; integratedRevision?: string }>;
  preserveForRecovery: (node: ExecutionNode, directory: string | undefined, reason: string) => Promise<void>;
}

const stable = (value: unknown): string => JSON.stringify(value, (_key, item) => {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return Object.fromEntries(Object.entries(item as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
  }
  return item;
});
const digest = (value: unknown): string => createHash('sha256').update(typeof value === 'string' ? value : stable(value)).digest('hex');
const ELIGIBLE_ARCHITECT_FAMILIES = new Set<ArchitectFamily>(['claude', 'codex', 'gemini', 'antigravity']);

export function issueArchitectAssignment(input: Omit<ArchitectAssignmentReceipt, 'schemaVersion' | 'receiptDigest'>, trustedAuthoritySource: { digest: string }): ArchitectAssignmentReceipt {
  if (!ELIGIBLE_ARCHITECT_FAMILIES.has(input.architectFamily)) throw new Error(`Ineligible architect family: ${String(input.architectFamily)}`);
  if (!input.changeId.trim() || !input.architectIdentity.trim() || !input.assignedBy.trim() || !input.authorityEvidence.trim()) {
    throw new Error('Architect assignment requires a change, identity, assigner, and authority evidence');
  }
  if (!trustedAuthoritySource?.digest || input.authoritySourceDigest !== trustedAuthoritySource.digest || input.authoritySourceDigest !== digest(input.authorityEvidence)) throw new Error('Architect assignment requires matching injected trusted authority evidence');
  const unsigned = { schemaVersion: 1 as const, ...input };
  return { ...unsigned, receiptDigest: digest(unsigned) };
}

export function verifyArchitectAssignment(receipt: ArchitectAssignmentReceipt, changeId: string, trustedAuthoritySourceDigest: string): void {
  if (!ELIGIBLE_ARCHITECT_FAMILIES.has(receipt.architectFamily)) throw new Error(`Ineligible architect family: ${String(receipt.architectFamily)}`);
  if (receipt.changeId !== changeId) throw new Error(`Architect assignment is bound to ${receipt.changeId}, not ${changeId}`);
  const { receiptDigest, ...unsigned } = receipt;
  if (digest(unsigned) !== receiptDigest) throw new Error('Architect assignment digest mismatch');
  if (!receipt.authorityEvidence.trim()) throw new Error('Label-only architect assignment is invalid');
  if (receipt.authoritySourceDigest !== trustedAuthoritySourceDigest || receipt.authoritySourceDigest !== digest(receipt.authorityEvidence)) throw new Error('Architect assignment trusted authority mismatch');
}

function assertRepositoryPath(checkout: string, path: string): void {
  const absolute = resolve(checkout, path);
  const rel = relative(resolve(checkout), absolute);
  if (rel.startsWith(`..${sep}`) || rel === '..' || rel.startsWith(sep)) throw new Error(`Path escapes repository: ${path}`);
  if (!existsSync(absolute)) throw new Error(`Artifact path does not exist: ${path}`);
  const realCheckout = realpathSync(checkout);
  const realArtifact = realpathSync(absolute);
  if (!isContainedBy(realCheckout, realArtifact)) throw new Error(`Artifact path resolves outside repository: ${path}`);
}

function isContainedBy(root: string, candidate: string): boolean {
  const rel = relative(root, candidate);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !rel.startsWith(sep));
}

function assertSafeWorktree(directory: string, safeRoots: string[]): string {
  if (!safeRoots.length) throw new Error('At least one safe worktree root is required');
  let resolvedDirectory: string;
  try { resolvedDirectory = realpathSync(directory); } catch { throw new Error(`Worktree does not resolve to an existing directory: ${directory}`); }
  const roots = safeRoots.map((root) => {
    try { return realpathSync(root); } catch { throw new Error(`Safe worktree root does not resolve: ${root}`); }
  });
  if (!roots.some((root) => isContainedBy(root, resolvedDirectory))) {
    throw new Error(`Worktree resolves outside configured safe roots: ${directory}`);
  }
  return resolvedDirectory;
}

export function validateTaskGraph(nodes: ExecutionNode[]): void {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error('Task identifiers must be unique');
  const worktrees = new Set<string>();
  const branches = new Set<string>();
  const ports = new Set<number>();
  for (const node of nodes) {
    if (!node.id.trim() || !node.title.trim()) throw new Error('Every task requires an identifier and title');
    if (node.workerPrompt !== undefined && (typeof node.workerPrompt !== 'string' || !node.workerPrompt.trim() || node.workerPrompt.includes('\0'))) {
      throw new Error(`Invalid worker prompt in task ${node.id}`);
    }
    if (!node.acceptance.length) throw new Error(`Task ${node.id} has no acceptance command`);
    if (worktrees.has(node.worktree)) throw new Error(`Duplicate worktree lease: ${node.worktree}`);
    if (!/^[-a-zA-Z0-9/_]+$/.test(node.branch) || node.branch.startsWith('/') || node.branch.includes('..')) throw new Error(`Unsafe branch lease: ${node.branch}`);
    if (branches.has(node.branch)) throw new Error(`Duplicate branch lease: ${node.branch}`);
    if (ports.has(node.port)) throw new Error(`Duplicate port lease: ${node.port}`);
    worktrees.add(node.worktree); branches.add(node.branch); ports.add(node.port);
    for (const dep of node.dependsOn) if (!byId.has(dep)) throw new Error(`Task ${node.id} has unknown dependency ${dep}`);
    if (node.provider === 'opencode-deepseek' && node.classification !== 'bounded') throw new Error(`OpenCode cannot own ${node.classification} task ${node.id}`);
    if (node.classification === 'bounded' && node.provider !== 'opencode-deepseek' && !node.providerExceptionReason?.trim()) {
      throw new Error(`Bounded task ${node.id} requires OpenCode or a concrete exception receipt`);
    }
    for (const path of node.ownedPaths) {
      if (path.startsWith('/') || path.split('/').includes('..')) throw new Error(`Unsafe owned path in ${node.id}: ${path}`);
    }
    for (const reference of node.secretReferences ?? []) if (!/^secret:\/\/[a-zA-Z0-9/_-]+$/.test(reference)) throw new Error(`Unsafe secret reference in ${node.id}: ${reference}`);
    for (const host of node.allowedEgressHosts ?? []) if (!/^[a-z0-9.-]+$/i.test(host) || host.includes('..')) throw new Error(`Unsafe egress host in ${node.id}: ${host}`);
  }
  const visiting = new Set<string>();
  const prerequisites = new Map<string, Set<string>>();
  const visit = (id: string): Set<string> => {
    if (visiting.has(id)) throw new Error(`Cycle detected at ${id}`);
    const known = prerequisites.get(id);
    if (known) return known;
    visiting.add(id);
    const ancestors = new Set<string>();
    for (const dependency of byId.get(id)!.dependsOn) {
      ancestors.add(dependency);
      for (const ancestor of visit(dependency)) ancestors.add(ancestor);
    }
    visiting.delete(id);
    prerequisites.set(id, ancestors);
    return ancestors;
  };
  for (const id of byId.keys()) visit(id);
  for (let i = 0; i < nodes.length; i += 1) for (let j = i + 1; j < nodes.length; j += 1) {
    const a = nodes[i]; const b = nodes[j];
    const ordered = prerequisites.get(a.id)!.has(b.id) || prerequisites.get(b.id)!.has(a.id);
    const overlap = a.ownedPaths.some((left) => b.ownedPaths.some((right) => left === right || left.startsWith(`${right}/`) || right.startsWith(`${left}/`)));
    if (overlap && !ordered) throw new Error(`Parallel ownership collision: ${a.id} and ${b.id}`);
  }
}

function validateAcceptanceArgs(command: string, args: string[]): void {
  const unsafeNodeFlags = new Set(['-e', '--eval', '-p', '--print', '-r', '--require']);
  for (const arg of args) {
    if (!arg || /[\0\r\n;&|`$<>]/.test(arg) || arg.split(/[\\/]/).includes('..')) throw new Error(`Unsafe acceptance argument for ${command}`);
    if ((command === 'node' || command.endsWith('/node')) && unsafeNodeFlags.has(arg)) throw new Error(`Unsafe Node acceptance flag: ${arg}`);
  }
}

function runProcess(executable: string, args: string[], cwd: string, env: NodeJS.ProcessEnv, signal: AbortSignal, timeoutMs: number): Promise<ProcessReceipt> {
  const startedAt = new Date().toISOString();
  return new Promise((resolveReceipt) => {
    const child = spawn(executable, args, { cwd, env, shell: false, signal, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = ''; let settled = false; let timedOut = false;
    const append = (current: string, chunk: unknown) => (current + String(chunk)).slice(-8 * 1024 * 1024);
    child.stdout?.on('data', (chunk) => { stdout = append(stdout, chunk); });
    child.stderr?.on('data', (chunk) => { stderr = append(stderr, chunk); });
    const finish = (exitCode: number, error?: unknown) => {
      if (settled) return; settled = true; clearTimeout(timer);
      resolveReceipt({ exitCode, stdout, stderr: `${stderr}${error ? `\n${String(error)}` : ''}${timedOut ? '\nETIMEDOUT' : ''}`.trim(), startedAt, finishedAt: new Date().toISOString() });
    };
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, timeoutMs);
    child.once('error', (error) => finish(1, error));
    child.once('close', (code) => finish(timedOut ? 124 : (code ?? 1)));
  });
}

async function runIsolatedOpenCode(
  ownedPaths: readonly string[],
  launch: (environment: NodeJS.ProcessEnv) => Promise<ProcessReceipt>,
): Promise<ProcessReceipt> {
  const editRules: Record<string, 'deny' | 'allow'> = { '*': 'deny' };
  for (const path of ownedPaths) {
    if (/[?*~{}\[\]\\]/.test(path) || (path === '$HOME' || path.startsWith('$HOME/'))
      || path.split('/').some((segment) => !segment || segment === '.' || segment === '..')) {
      throw new Error('OpenCode edit permissions require literal repository-relative owned paths');
    }
    editRules[path] = 'allow';
    editRules[`${path}/*`] = 'allow';
  }
  const directory = await mkdtemp(join(tmpdir(), 'opencode-worker-'));
  try {
    const config = join(directory, 'opencode.json');
    await writeFile(config, JSON.stringify({
      permission: { '*': 'deny', read: 'allow', edit: editRules },
      provider: {
        litellm: {
          npm: '@ai-sdk/openai-compatible',
          name: 'LiteLLM',
          options: { baseURL: 'https://llm.megabyte.space/v1', apiKey: '{env:LITELLM_API_KEY}' },
          models: { 'deepseek-flash': { name: 'DeepSeek Flash', tool_call: true } },
        },
      },
    }), { mode: 0o600 });
    return await launch({
      OPENCODE_CONFIG: config,
      OPENCODE_CONFIG_DIR: directory,
      OPENCODE_DISABLE_PROJECT_CONFIG: '1',
      XDG_CONFIG_HOME: join(directory, 'config'),
      XDG_DATA_HOME: join(directory, 'data'),
      XDG_STATE_HOME: join(directory, 'state'),
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

/**
 * Production execution adapter. Launchers must be explicit broker/subscription
 * executables; no shell is used, secret values are resolved just-in-time, and
 * only references are persisted in the node contract.
 */
export function createApprovedProcessAdapter(options: ProcessAdapterOptions): SchedulerAdapter {
  const directories = new Map<string, string>();
  const verifiedHeads = new Map<string, string>();
  const worktreeBases = new Map<string, string>();
  const git = (directory: string, ...args: string[]) =>
    execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const directoryFor = (node: ExecutionNode): string => {
    const directory = directories.get(node.id);
    if (!directory) throw new Error(`Worktree ${node.worktree} was not created`);
    // Resolve immediately before every filesystem callback or child process. This
    // also detects a directory replaced by a hostile symlink after creation.
    return assertSafeWorktree(directory, options.safeWorktreeRoots);
  };
  return {
    async preflight(provider, node) {
      const launcher = options.launchers[provider];
      if (!launcher?.approved) return { ok: false, reason: `No approved launcher for ${provider}` };
      if (!launcher.budgetReceipt?.trim()) return { ok: false, reason: `Missing budget receipt for ${provider}` };
      if (!launcher.enforcesWorktreeIsolation) return { ok: false, reason: `${provider} launcher does not enforce worktree isolation` };
      if ((node.allowedEgressHosts?.length ?? 0) > 0 && !launcher.enforcesBoundedEgress) return { ok: false, reason: `${provider} launcher cannot enforce bounded egress` };
      for (const reference of node.secretReferences ?? []) if (options.resolveSecretReference(reference) === undefined) return { ok: false, reason: `Unresolved secret reference ${reference}` };
      return { ok: true };
    },
    async createWorktree(node, frozenBaseRevision, prerequisiteRevisions) {
      const created = await options.createWorktree(node, frozenBaseRevision, prerequisiteRevisions);
      const directory = assertSafeWorktree(created.directory, options.safeWorktreeRoots);
      directories.delete(node.id);
      verifiedHeads.delete(node.id);
      if (prerequisiteRevisions && Object.keys(prerequisiteRevisions).length) {
        const head = git(directory, 'rev-parse', '--verify', 'HEAD');
        for (const revision of [frozenBaseRevision, ...Object.values(prerequisiteRevisions)]) {
          if (!revision || !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(revision)) {
            throw new Error('Dependent worktree requires full Git commit identities');
          }
          try {
            git(directory, 'merge-base', '--is-ancestor', revision, head);
          } catch {
            throw new Error(`Dependent worktree HEAD does not contain required revision ${revision}`);
          }
        }
        if (created.sourceDigest !== head) throw new Error('Dependent worktree source receipt does not match Git HEAD');
        verifiedHeads.set(node.id, head);
      }
      if (!options.listChangedFiles && git(directory, 'rev-parse', '--verify', 'HEAD') !== created.sourceDigest) {
        throw new Error('Git ownership evidence requires the returned base to match the created worktree HEAD');
      }
      directories.set(node.id, directory);
      worktreeBases.set(node.id, created.sourceDigest);
      return { sourceDigest: created.sourceDigest };
    },
    async launch(provider, node, correlationId, signal) {
      const launcher = options.launchers[provider];
      if (!launcher?.approved) throw new Error(`Launcher ${provider} was not approved`);
      const directory = directoryFor(node);
      const verifiedHead = verifiedHeads.get(node.id);
      if (verifiedHead && git(directory, 'rev-parse', '--verify', 'HEAD') !== verifiedHead) {
        throw new Error('Dependent worktree HEAD changed before launch');
      }
      const secretEnv = Object.fromEntries((node.secretReferences ?? []).map((reference, index) => [`BROKERED_SECRET_REF_${index}`, reference]));
      const taskArgs = launcher.taskArgs?.(node, correlationId, directory)
        ?? ['--task-id', node.id, '--correlation-id', correlationId, '--worktree', directory];
      const launch = (runtimeEnvironment: NodeJS.ProcessEnv) => runProcess(launcher.executable, [...launcher.fixedArgs, ...taskArgs], directory, {
        PATH: process.env.PATH,
        ...((provider === 'claude' || provider === 'codex') && {
          HOME: process.env.HOME,
          USER: process.env.USER,
          LOGNAME: process.env.LOGNAME,
          XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
        }),
        ...secretEnv,
        ...runtimeEnvironment,
        SWARM_ALLOWED_EGRESS_HOSTS: (node.allowedEgressHosts ?? []).join(','),
      }, signal, options.processTimeoutMs ?? 30 * 60_000);
      return launcher.runtimeProfile === 'isolated-opencode' ? runIsolatedOpenCode(node.ownedPaths, launch) : launch({});
    },
    ...(options.approveReusePath && {
      async readAcceptedReuseEvidence(node: ExecutionNode, receipt: Readonly<NodeExecutionReceipt>, signal: AbortSignal) {
        signal.throwIfAborted();
        const approve = options.approveReusePath!;
        const paths = receipt.changedFiles.filter((path) => approve(node, path));
        if (!receipt.sourceDigestAfter) throw new Error('Missing accepted source digest');
        return paths.length ? readCommittedReuseEvidence(directoryFor(node), receipt.sourceDigestAfter, paths)
          : { sourceDigest: receipt.sourceDigestAfter, excerpts: {} };
      },
    }),
    async changedFiles(node) {
      const directory = directoryFor(node);
      return options.listChangedFiles?.(node, directory)
        ?? listDevelopmentChangedFiles(directory, worktreeBases.get(node.id)!);
    },
    async runAcceptance(node, check, signal) {
      if (!options.allowedAcceptanceExecutables.includes(check.command)) throw new Error(`Acceptance executable is not allowlisted: ${check.command}`);
      validateAcceptanceArgs(check.command, check.args);
      if (options.allowedAcceptanceArgs && !options.allowedAcceptanceArgs(check.command, check.args)) throw new Error(`Acceptance arguments are not allowlisted for ${check.command}`);
      const directory = directoryFor(node);
      return runProcess(check.command, check.args, directory, { PATH: process.env.PATH, CI: '1' }, signal, options.processTimeoutMs ?? 30 * 60_000);
    },
    async sourceDigest(node) { return options.sourceDigest(node, directoryFor(node)); },
    async integrate(node, expected, frozenBaseRevision) { return options.integrate(node, directoryFor(node), expected, frozenBaseRevision); },
    async preserveForRecovery(node, reason) {
      const directory = directories.has(node.id) ? directoryFor(node) : undefined;
      await options.preserveForRecovery(node, directory, reason);
    },
  };
}

interface ParsedOpenSpec {
  requirements: string[];
  scenarios: string[];
  traceabilityIds: string[];
}

function substantiveSection(content: string, heading: RegExp, artifact: string): void {
  const match = heading.exec(content);
  if (!match) throw new Error(`${artifact} lacks required semantic section`);
  const body = content.slice(match.index + match[0].length).split(/^##\s+/m, 1)[0].replace(/\s+/g, ' ').trim();
  if (body.length < 12) throw new Error(`${artifact} has an empty or superficial semantic section`);
}

function parseOpenSpecArtifacts(artifacts: CompiledArtifact[], nodes: ExecutionNode[]): CompiledArtifact[] {
  const byKind = new Map(artifacts.map((artifact) => [artifact.kind, artifact]));
  if (byKind.size !== artifacts.length) throw new Error('OpenSpec artifact kinds must be unique');
  const proposal = byKind.get('proposal')!;
  substantiveSection(proposal.content, /^##\s+Why\s*$/im, 'OpenSpec proposal');
  substantiveSection(proposal.content, /^##\s+(?:What Changes|Scope)\s*$/im, 'OpenSpec proposal');

  const design = byKind.get('design')!;
  if (!/^\s*(?:>|\*\*)?\s*\*\*?Architect Role:\*\*?\s*assigned\b/im.test(design.content)) throw new Error('OpenSpec design lacks an assigned architect declaration');
  substantiveSection(design.content, /^##\s+Context\s*$/im, 'OpenSpec design');
  substantiveSection(design.content, /^##\s+Goals(?:\s*\/\s*Non-Goals)?\s*$/im, 'OpenSpec design');
  substantiveSection(design.content, /^##\s+Decisions\s*$/im, 'OpenSpec design');

  const requirements = new Map<string, string[]>();
  let currentRequirement = '';
  for (const line of byKind.get('spec')!.content.split(/\r?\n/)) {
    const requirement = /^###\s+Requirement:\s*(.+?)\s*$/.exec(line);
    if (requirement) {
      currentRequirement = requirement[1].trim();
      if (!currentRequirement || requirements.has(currentRequirement)) throw new Error(`Duplicate or empty OpenSpec requirement: ${currentRequirement}`);
      requirements.set(currentRequirement, []);
      continue;
    }
    const scenario = /^####\s+Scenario:\s*(.+?)\s*$/.exec(line);
    if (scenario) {
      if (!currentRequirement) throw new Error(`OpenSpec scenario is not nested under a requirement: ${scenario[1]}`);
      requirements.get(currentRequirement)!.push(scenario[1].trim());
    }
  }
  if (!requirements.size) throw new Error('OpenSpec specification contains no requirements');
  for (const [requirement, scenarios] of requirements) if (!scenarios.length) throw new Error(`OpenSpec requirement lacks a scenario: ${requirement}`);

  const taskMappings = new Map<string, { requirements: string[]; scenarios: string[] }>();
  const taskPattern = /^\s*-\s+\[[ xX]\]\s+\[([^\]]+)\].*?\(requirements:\s*([^;\)]+);\s*scenarios:\s*([^\)]+)\)\s*$/gm;
  for (const match of byKind.get('tasks')!.content.matchAll(taskPattern)) {
    const id = match[1].trim();
    if (taskMappings.has(id)) throw new Error(`Duplicate OpenSpec task traceability id: ${id}`);
    taskMappings.set(id, {
      requirements: match[2].split(',').map((item) => item.trim()).filter(Boolean),
      scenarios: match[3].split(',').map((item) => item.trim()).filter(Boolean),
    });
  }
  if (!taskMappings.size) throw new Error('OpenSpec tasks contain no semantic traceability mappings');
  const allScenarios = new Set([...requirements.values()].flat());
  for (const [id, mapping] of taskMappings) {
    for (const requirement of mapping.requirements) if (!requirements.has(requirement)) throw new Error(`Task ${id} references unknown requirement: ${requirement}`);
    for (const scenario of mapping.scenarios) if (!allScenarios.has(scenario)) throw new Error(`Task ${id} references unknown scenario: ${scenario}`);
  }
  for (const node of nodes) if (!taskMappings.has(node.id)) throw new Error(`Task ${node.id} lacks content-derived requirement traceability`);
  for (const requirement of requirements.keys()) if (![...taskMappings.values()].some((mapping) => mapping.requirements.includes(requirement))) throw new Error(`Requirement is not traced to an execution task: ${requirement}`);
  for (const scenario of allScenarios) if (![...taskMappings.values()].some((mapping) => mapping.scenarios.includes(scenario))) throw new Error(`Scenario is not traced to an execution task: ${scenario}`);

  const parsed: ParsedOpenSpec = { requirements: [...requirements.keys()], scenarios: [...allScenarios], traceabilityIds: [...taskMappings.keys()] };
  return artifacts.map((artifact) => ({ ...artifact, ...parsed }));
}

export function compileAndFreezeContract(input: {
  checkout: string;
  changeId: string;
  assignment: ArchitectAssignmentReceipt;
  trustedAuthoritySourceDigest: string;
  evidenceDigest: string;
  fixedPointDigest: string;
  unresolvedMaterialDeltas: string[];
  artifacts: CompiledArtifact[];
  nodes: ExecutionNode[];
  frozenBaseRevision?: string;
}): FrozenContract {
  verifyArchitectAssignment(input.assignment, input.changeId, input.trustedAuthoritySourceDigest);
  const frozenBaseRevision = input.frozenBaseRevision ?? input.trustedAuthoritySourceDigest;
  if (!/^[a-zA-Z0-9._:-]{7,128}$/.test(frozenBaseRevision)) throw new Error('A valid frozen base revision is required');
  if (input.unresolvedMaterialDeltas.length) throw new Error(`Architecture fixed point is unresolved: ${input.unresolvedMaterialDeltas.join(', ')}`);
  const kinds = new Set(input.artifacts.map((artifact) => artifact.kind));
  for (const required of ['proposal', 'design', 'spec', 'tasks']) if (!kinds.has(required as CompiledArtifact['kind'])) throw new Error(`Missing OpenSpec ${required} artifact`);
  for (const artifact of input.artifacts) {
    assertRepositoryPath(input.checkout, artifact.path);
    if (readFileSync(resolve(input.checkout, artifact.path), 'utf8') !== artifact.content) throw new Error(`Artifact content is stale: ${artifact.path}`);
  }
  const parsedArtifacts = parseOpenSpecArtifacts(input.artifacts, input.nodes);
  validateTaskGraph(input.nodes);
  const artifactDigest = digest(parsedArtifacts);
  const graphDigest = digest(input.nodes);
  const basis = { changeId: input.changeId, assignmentDigest: input.assignment.receiptDigest, evidenceDigest: input.evidenceDigest, fixedPointDigest: input.fixedPointDigest, artifactDigest, graphDigest, frozenBaseRevision };
  return { schemaVersion: 1, ...basis, contractDigest: digest(basis), artifacts: parsedArtifacts, nodes: input.nodes };
}

function pathsAreOwned(changed: string[], owned: string[]): boolean {
  return changed.every((file) => owned.some((scope) => file === scope || file.startsWith(`${scope}/`)));
}

function freezeTaskInput(value: unknown): void {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return;
  Object.freeze(value);
  for (const child of Object.values(value)) freezeTaskInput(child);
}

type SchedulerOptions = {
    cancelled?: () => boolean;
    signal?: AbortSignal;
    concurrency?: number;
    providerConcurrency?: Partial<Record<ExecutionProvider, number>>;
    observeAcceptedSource?: (node: ExecutionNode, receipt: Readonly<NodeExecutionReceipt>, signal: AbortSignal) => Promise<void>;
    reviewBeforeIntegration?: (node: ExecutionNode, receipt: Readonly<NodeExecutionReceipt>, signal: AbortSignal) => Promise<IndependentReviewReceipt>;
  };

function verifiedContractNodes(contract: FrozenContract): ExecutionNode[] {
  const nodes = structuredClone(contract.nodes);
  if (digest(nodes) !== contract.graphDigest || digest(contract.artifacts) !== contract.artifactDigest) {
    throw new Error('Frozen contract contents do not match their digests');
  }
  const expected = digest({ changeId: contract.changeId, assignmentDigest: contract.assignmentDigest, evidenceDigest: contract.evidenceDigest, fixedPointDigest: contract.fixedPointDigest, artifactDigest: contract.artifactDigest, graphDigest: contract.graphDigest, frozenBaseRevision: contract.frozenBaseRevision });
  if (expected !== contract.contractDigest) throw new Error('Frozen contract digest mismatch');
  return nodes;
}

export async function executeFrozenContract(
  contract: FrozenContract,
  adapter: SchedulerAdapter,
  options: SchedulerOptions = {},
): Promise<NodeExecutionReceipt[]> {
  return executeNodes(verifiedContractNodes(contract), contract.frozenBaseRevision, adapter, options);
}

/** Run independently frozen changes from one repository through a shared execution queue. */
export async function executeFrozenChanges(
  changes: ReadonlyArray<{ contract: FrozenContract; dependsOn: readonly string[] }>,
  adapter: SchedulerAdapter,
  options: SchedulerOptions = {},
): Promise<NodeExecutionReceipt[]> {
  if (!changes.length) return [];
  const frozenBaseRevision = changes[0].contract.frozenBaseRevision;
  const ownerNodes = new Map<string, ExecutionNode>();
  for (const { contract } of changes) {
    const nodes = verifiedContractNodes(contract);
    if (nodes.length !== 1 || nodes[0].dependsOn.length) throw new Error(`Change ${contract.changeId} must have one whole-change node`);
    if (contract.frozenBaseRevision !== frozenBaseRevision) throw new Error('Queued changes must share a frozen repository revision');
    if (ownerNodes.has(contract.changeId)) throw new Error(`Duplicate queued change: ${contract.changeId}`);
    ownerNodes.set(contract.changeId, nodes[0]);
  }
  const nodes = changes.map(({ contract, dependsOn }) => ({
    ...ownerNodes.get(contract.changeId)!,
    dependsOn: dependsOn.map((changeId) => {
      const dependency = ownerNodes.get(changeId);
      if (!dependency) throw new Error(`Unknown change dependency: ${changeId}`);
      return dependency.id;
    }),
  }));
  return executeNodes(nodes, frozenBaseRevision, adapter, options, true);
}

async function executeNodes(
  nodes: ExecutionNode[],
  frozenBaseRevision: string,
  adapter: SchedulerAdapter,
  options: SchedulerOptions,
  bindPrerequisites = false,
): Promise<NodeExecutionReceipt[]> {
  const concurrency = options.concurrency ?? 8;
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) throw new Error('Concurrency must be a positive integer');
  const providerConcurrency = { ...options.providerConcurrency };
  for (const limit of Object.values(providerConcurrency)) {
    if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Provider concurrency must be a positive integer');
  }

  validateTaskGraph(nodes);
  freezeTaskInput(nodes);
  const runId = randomUUID(); const receipts: NodeExecutionReceipt[] = []; const integrated = new Set<string>();
  const integratedRevisions = new Map<string, string>();
  const controller = new AbortController();
  if (options.signal?.aborted) controller.abort(options.signal.reason);
  else options.signal?.addEventListener('abort', () => controller.abort(options.signal?.reason), { once: true });
  let integrationFence = Promise.resolve();
  const withIntegrationLock = async <T>(operation: () => Promise<T>): Promise<T> => {
    const prior = integrationFence; let release!: () => void;
    integrationFence = new Promise<void>((resolveLock) => { release = resolveLock; });
    await prior; try { return await operation(); } finally { release(); }
  };
  const launches = new Map<ExecutionProvider, { active: number; waiting: Array<() => void> }>();
  const withProviderSlot = async (provider: ExecutionProvider, operation: () => Promise<ProcessReceipt>): Promise<ProcessReceipt> => {
    const limit = providerConcurrency[provider];
    if (limit === undefined) return operation();
    const slots = launches.get(provider) ?? { active: 0, waiting: [] };
    launches.set(provider, slots);
    if (slots.active < limit) slots.active += 1;
    else await new Promise<void>((resolve) => slots.waiting.push(resolve));
    try {
      controller.signal.throwIfAborted();
      return await operation();
    } finally {
      const next = slots.waiting.shift();
      if (next) next();
      else slots.active -= 1;
    }
  };
  const runNode = async (node: ExecutionNode) => {
    let provider = node.provider; let terminal: NodeExecutionReceipt | undefined;
    const providers = [provider, ...(node.fallbackProviders ?? [])];
    const maxAttempts = Math.max(1, node.maxAttempts ?? 1);
    for (let attempt = 1; attempt <= maxAttempts && !terminal; attempt += 1) {
      provider = providers[Math.min(attempt - 1, providers.length - 1)];
      const receipt: NodeExecutionReceipt = { runId, nodeId: node.id, provider, attempt, status: 'running', worktree: node.worktree, sourceDigestBefore: '', changedFiles: [], acceptance: [] };
      try {
        const preflight = await adapter.preflight(provider, node);
        if (!preflight.ok) {
          terminal = { ...receipt, status: 'failed', failure: `Preflight rejected: ${preflight.reason ?? 'unknown'}`, recoveryAction: 'Correct approved launcher, budget, or provider policy and resume the node' };
          break;
        }
        if (options.cancelled?.()) controller.abort('Run cancelled');
        controller.signal.throwIfAborted();
        const prerequisiteRevisions = bindPrerequisites && node.dependsOn.length
          ? Object.fromEntries(node.dependsOn.map((id) => {
            const revision = integratedRevisions.get(id);
            if (!revision) throw new Error(`Prerequisite ${id} has no integrated revision receipt`);
            return [id, revision];
          }))
          : undefined;
        const created = await adapter.createWorktree(node, frozenBaseRevision, prerequisiteRevisions);
        receipt.sourceDigestBefore = created.sourceDigest;
        controller.signal.throwIfAborted();
        receipt.launcher = await withProviderSlot(provider, () =>
          adapter.launch(provider, node, `${runId}:${node.id}:${attempt}`, controller.signal));
        if (receipt.launcher.exitCode !== 0) throw new Error(`Launcher exited ${receipt.launcher.exitCode}`);
        receipt.changedFiles = await adapter.changedFiles(node);
        if (!pathsAreOwned(receipt.changedFiles, node.ownedPaths)) throw new Error('Worker changed files outside its ownership contract');
        for (const check of node.acceptance) {
          const result = await adapter.runAcceptance(node, check, controller.signal); receipt.acceptance.push(result);
          if (result.exitCode !== 0) throw new Error(`Acceptance failed: ${check.command} ${check.args.join(' ')}`);
        }
        receipt.sourceDigestAfter = await adapter.sourceDigest(node);
        receipt.status = 'accepted';
        if (options.reviewBeforeIntegration) {
          if (!receipt.changedFiles.length || !receipt.acceptance.length) {
            throw new Error('Independent review requires an owned diff and executed acceptance');
          }
          controller.signal.throwIfAborted();
          const review = await options.reviewBeforeIntegration(structuredClone(node), structuredClone(receipt), controller.signal);
          receipt.review = review;
          if (!review.approved || !review.reviewer.trim() || review.sourceDigest !== receipt.sourceDigestAfter) {
            throw new Error('Independent review did not approve the accepted source');
          }
        }
        if (options.observeAcceptedSource) {
          controller.signal.throwIfAborted();
          await options.observeAcceptedSource(structuredClone(node), structuredClone(receipt), controller.signal);
        }
        // Dependent worktrees start at a verified descendant of the original base.
        const integrationBase = prerequisiteRevisions ? created.sourceDigest : frozenBaseRevision;
        const integration = await withIntegrationLock(async () => {
          controller.signal.throwIfAborted();
          const sourceImmediatelyBeforeMerge = await adapter.sourceDigest(node);
          if (sourceImmediatelyBeforeMerge !== receipt.sourceDigestAfter) throw new Error('Accepted source changed before integration');
          return adapter.integrate(node, receipt.sourceDigestAfter!, integrationBase);
        });
        if (integration.sourceDigest !== receipt.sourceDigestAfter) throw new Error('Integrated source differs from accepted source');
        const integratedRevision = integration.integratedRevision?.trim() || undefined;
        if (integratedRevision) integratedRevisions.set(node.id, integratedRevision);
        receipt.integration = { baseRevision: integrationBase, sourceDigest: integration.sourceDigest, integratedRevision };
        receipt.status = 'integrated'; integrated.add(node.id); terminal = receipt;
      } catch (error) {
        receipt.status = 'failed'; receipt.failure = error instanceof Error ? error.message : String(error);
        receipt.recoveryAction = `Resume ${node.id} from preserved worktree ${node.worktree}`;
        try {
          await adapter.preserveForRecovery(node, receipt.failure);
        } catch (recoveryError) {
          receipt.recoveryAction = `Recovery also failed: ${String(recoveryError)}`;
        }
        if (controller.signal.aborted) receipt.status = 'cancelled';
        if (attempt === maxAttempts || controller.signal.aborted) terminal = receipt;
        else receipts.push(receipt);
      }
    }
    if (terminal) receipts.push(terminal);
  };

  const remaining = new Map(nodes.map((node) => [node.id, node]));
  const active = new Map<string, ExecutionProvider>();
  let wakeScheduler: (() => void) | undefined;
  let schedulerFailure: { error: unknown } | undefined;
  const finishNode = (nodeId: string) => {
    active.delete(nodeId);
    wakeScheduler?.();
  };
  while (remaining.size || active.size) {
    const cancelled = options.cancelled?.() || controller.signal.aborted;
    if (cancelled || schedulerFailure) {
      controller.abort('Run cancelled');
      for (const node of remaining.values()) receipts.push({ runId, nodeId: node.id, provider: node.provider, attempt: 0, status: 'cancelled', worktree: node.worktree, sourceDigestBefore: '', changedFiles: [], acceptance: [], failure: 'Run cancelled before launch' });
      remaining.clear();
    } else {
      const admitted = new Map<ExecutionProvider, number>();
      for (const provider of active.values()) admitted.set(provider, (admitted.get(provider) ?? 0) + 1);
      for (const node of remaining.values()) {
        if (active.size === concurrency) break;
        if (!node.dependsOn.every((dep) => integrated.has(dep))) continue;
        const providerCount = admitted.get(node.provider) ?? 0;
        if (providerCount >= (providerConcurrency[node.provider] ?? concurrency)) continue;
        admitted.set(node.provider, providerCount + 1);
        remaining.delete(node.id);
        active.set(node.id, node.provider);
        void runNode(node).then(
          () => finishNode(node.id),
          (error: unknown) => {
            schedulerFailure ??= { error };
            finishNode(node.id);
          },
        );
      }
    }
    if (active.size) {
      // Subscribe once per task, so a slow worker does not accumulate
      // Promise.race handlers while other slots cycle through a backlog.
      await new Promise<void>((resolve) => { wakeScheduler = resolve; });
      wakeScheduler = undefined;
    } else if (remaining.size) {
      for (const node of remaining.values()) receipts.push({ runId, nodeId: node.id, provider: node.provider, attempt: 0, status: 'blocked', worktree: node.worktree, sourceDigestBefore: '', changedFiles: [], acceptance: [], failure: 'Dependency did not integrate' });
      break;
    }
  }
  if (schedulerFailure) throw schedulerFailure.error;
  return receipts;
}
