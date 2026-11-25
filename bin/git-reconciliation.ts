import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export interface GitBlocker {
  code: 'invalid-input' | 'worktree-not-clean' | 'task-patch-conflict' | 'remote-main-advanced' | 'tested-tree-mismatch' | 'push-rejected' | 'remote-observation-mismatch' | 'ci-not-green';
  summary: string;
  repository: string;
  worktree?: string;
  expected?: string;
  observed?: string;
  conflictedPaths?: string[];
  nextAction: string;
}

export interface ReconciliationReceipt {
  worktree: string;
  baseCommit: string;
  replayedCommits: string[];
  integratedCommit: string;
  changedPaths: string[];
  invalidatedChecks: string[];
}

function git(cwd: string, args: string[], allowFailure = false) {
  const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  if (!allowFailure && result.status !== 0) throw new Error((result.stderr || result.stdout).trim() || `git ${args.join(' ')} failed`);
  return { status: result.status ?? 1, stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

function remoteSha(checkout: string, remote: string, branch: string): string {
  const result = git(checkout, ['ls-remote', '--heads', remote, `refs/heads/${branch}`]);
  const sha = result.stdout.split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/.test(sha)) throw new Error(`remote branch ${remote}/${branch} has no observable SHA`);
  return sha;
}

export function affectedChecks(paths: string[]): string[] {
  const checks = new Set<string>(['task-focused-tests']);
  for (const path of paths) {
    if (path.startsWith('schemas/')) checks.add('schema-validation');
    if (/(^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?)$/.test(path)) checks.add('dependency-install-and-build');
    if (path.startsWith('.github/workflows/')) checks.add('workflow-syntax-and-actionlint');
    if (path.startsWith('bin/') || path.startsWith('tests/')) checks.add('runtime-unit-tests');
    if (/^(?:AGENTS|CLAUDE|CODEX|GEMINI)\.md$/.test(path) || path.startsWith('policies/')) checks.add('instruction-policy-drift');
    if (path.startsWith('.changeset/') || path.startsWith('releases/')) checks.add('release-validation');
  }
  return [...checks].sort();
}

export function prepareReconciliationWorktree(input: { editCheckout: string; worktree: string; remote?: string; branch?: string }): { worktree: string; baseCommit: string; editStatus: string } {
  const editCheckout = resolve(input.editCheckout);
  const worktree = resolve(input.worktree);
  const remote = input.remote ?? 'origin';
  const branch = input.branch ?? 'main';
  if (!existsSync(editCheckout) || existsSync(worktree)) throw new Error('reconciliation requires an existing edit checkout and an absent worktree path');
  const editStatus = git(editCheckout, ['status', '--porcelain=v1']).stdout;
  git(editCheckout, ['fetch', remote, branch]);
  const baseCommit = git(editCheckout, ['rev-parse', '--verify', `${remote}/${branch}`]).stdout;
  git(editCheckout, ['worktree', 'add', '--detach', worktree, baseCommit]);
  if (git(worktree, ['status', '--porcelain=v1']).stdout) throw new Error('new reconciliation worktree is not clean');
  return { worktree, baseCommit, editStatus };
}

export function replayTaskCommits(input: { editCheckout: string; worktree: string; baseCommit: string; taskCommits: string[] }): { receipt?: ReconciliationReceipt; blocker?: GitBlocker } {
  const beforeStatus = git(input.worktree, ['status', '--porcelain=v1']).stdout;
  if (beforeStatus) return { blocker: { code: 'worktree-not-clean', summary: 'Reconciliation worktree contains unexpected changes.', repository: input.editCheckout, worktree: input.worktree, observed: beforeStatus, nextAction: 'Preserve and classify the worktree changes before replay.' } };
  for (const commit of input.taskCommits) {
    if (!/^[0-9a-f]{40}$/.test(commit)) return { blocker: { code: 'invalid-input', summary: `Task commit is not a full SHA: ${commit}`, repository: input.editCheckout, worktree: input.worktree, nextAction: 'Resolve the exact task commit SHA.' } };
    const replay = git(input.worktree, ['cherry-pick', commit], true);
    if (replay.status !== 0) {
      const conflictedPaths = git(input.worktree, ['diff', '--name-only', '--diff-filter=U'], true).stdout.split('\n').filter(Boolean);
      git(input.worktree, ['cherry-pick', '--abort'], true);
      return { blocker: { code: 'task-patch-conflict', summary: `Task patch ${commit} conflicts with current remote main.`, repository: input.editCheckout, worktree: input.worktree, conflictedPaths, nextAction: 'Resolve only the listed task-owned conflicts against current main, then rerun affected checks.' } };
    }
  }
  const integratedCommit = git(input.worktree, ['rev-parse', 'HEAD']).stdout;
  const changedPaths = git(input.worktree, ['diff', '--name-only', `${input.baseCommit}..${integratedCommit}`]).stdout.split('\n').filter(Boolean);
  return { receipt: { worktree: input.worktree, baseCommit: input.baseCommit, replayedCommits: [...input.taskCommits], integratedCommit, changedPaths, invalidatedChecks: affectedChecks(changedPaths) } };
}

export interface NormalPushPlan { repository: string; worktree: string; remote: string; branch: string; remoteBefore: string; testedCommit: string; args: string[] }

export function planTestedTreePush(input: { repository: string; worktree: string; remote?: string; branch?: string; expectedRemoteBefore: string; testedCommit: string }): { plan?: NormalPushPlan; blocker?: GitBlocker } {
  const remote = input.remote ?? 'origin';
  const branch = input.branch ?? 'main';
  const head = git(input.worktree, ['rev-parse', 'HEAD']).stdout;
  if (head !== input.testedCommit) return { blocker: { code: 'tested-tree-mismatch', summary: 'Worktree HEAD differs from the commit bound to verification.', repository: input.repository, worktree: input.worktree, expected: input.testedCommit, observed: head, nextAction: 'Rerun invalidated checks on the exact current HEAD.' } };
  const observedBefore = remoteSha(input.worktree, remote, branch);
  if (observedBefore !== input.expectedRemoteBefore) return { blocker: { code: 'remote-main-advanced', summary: 'Remote main advanced after reconciliation.', repository: input.repository, worktree: input.worktree, expected: input.expectedRemoteBefore, observed: observedBefore, nextAction: 'Create a new clean reconciliation worktree from observed remote main, replay task commits, and rerun invalidated checks.' } };
  return { plan: { repository: input.repository, worktree: input.worktree, remote, branch, remoteBefore: observedBefore, testedCommit: input.testedCommit, args: ['push', remote, `HEAD:refs/heads/${branch}`] } };
}

export function executeTestedTreePush(plan: NormalPushPlan): { pushed?: { remoteBefore: string; remoteAfter: string; testedCommit: string }; blocker?: GitBlocker } {
  if (plan.args.some((arg) => arg.includes('force'))) throw new Error('force push is prohibited');
  const pushed = git(plan.worktree, plan.args, true);
  if (pushed.status !== 0) return { blocker: { code: 'push-rejected', summary: pushed.stderr || pushed.stdout || 'Normal push was rejected.', repository: plan.repository, worktree: plan.worktree, nextAction: 'Fetch current remote main and reconcile normally; never force-push.' } };
  const remoteAfter = remoteSha(plan.worktree, plan.remote, plan.branch);
  if (remoteAfter !== plan.testedCommit) return { blocker: { code: 'remote-observation-mismatch', summary: 'Observed remote SHA differs from tested commit.', repository: plan.repository, worktree: plan.worktree, expected: plan.testedCommit, observed: remoteAfter, nextAction: 'Stop delivery claims and inspect remote branch protection or competing writes.' } };
  return { pushed: { remoteBefore: plan.remoteBefore, remoteAfter, testedCommit: plan.testedCommit } };
}

export function pushTestedTree(input: { repository: string; worktree: string; remote?: string; branch?: string; expectedRemoteBefore: string; testedCommit: string }): { pushed?: { remoteBefore: string; remoteAfter: string; testedCommit: string }; blocker?: GitBlocker } {
  const planned = planTestedTreePush(input);
  return planned.blocker ? { blocker: planned.blocker } : executeTestedTreePush(planned.plan!);
}

export function observeRemoteAndCi(input: { repository: string; checkout: string; remote?: string; branch?: string; testedCommit: string; ci: { status: 'success' | 'failure' | 'pending' | 'unavailable'; url?: string } }): { remoteSha: string; ci: typeof input.ci; delivered: boolean; blocker?: GitBlocker } {
  const observed = remoteSha(input.checkout, input.remote ?? 'origin', input.branch ?? 'main');
  if (observed !== input.testedCommit) return { remoteSha: observed, ci: input.ci, delivered: false, blocker: { code: 'remote-observation-mismatch', summary: 'Remote branch does not contain the tested commit as its current SHA.', repository: input.repository, expected: input.testedCommit, observed, nextAction: 'Reconcile current remote main and verify the resulting tested commit.' } };
  if (input.ci.status !== 'success') return { remoteSha: observed, ci: input.ci, delivered: false, blocker: { code: 'ci-not-green', summary: `CI observation is ${input.ci.status}.`, repository: input.repository, observed: input.ci.url ?? input.ci.status, nextAction: 'Wait for or repair the exact commit CI result before claiming delivery.' } };
  return { remoteSha: observed, ci: input.ci, delivered: true };
}

export function recordGitIntegration(input: { testedTree: string; localCommit: string; remoteCommit: string }): { complete: boolean; reason: string } {
  if (input.testedTree !== input.localCommit) return { complete: false, reason: 'tested-tree-mismatch' };
  if (input.localCommit !== input.remoteCommit) return { complete: false, reason: 'remote-commit-mismatch' };
  return { complete: true, reason: 'exact-commit-observed' };
}
