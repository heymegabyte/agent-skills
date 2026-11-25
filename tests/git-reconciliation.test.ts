import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { affectedChecks, observeRemoteAndCi, planTestedTreePush, prepareReconciliationWorktree, pushTestedTree, replayTaskCommits } from '../bin/git-reconciliation.ts';

function git(cwd: string, args: string[]): string {
  const result = spawnSync('git', ['-C', cwd, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function commitFile(repo: string, path: string, content: string, message: string): string {
  writeFileSync(join(repo, path), content);
  git(repo, ['add', path]);
  git(repo, ['commit', '-m', message]);
  return git(repo, ['rev-parse', 'HEAD']);
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'git-reconcile-'));
  const remote = join(root, 'remote.git');
  const seed = join(root, 'seed');
  const edit = join(root, 'edit');
  const competitor = join(root, 'competitor');
  git(root, ['init', '--bare', '--initial-branch=main', remote]);
  git(root, ['init', '--initial-branch=main', seed]);
  for (const repo of [seed]) { git(repo, ['config', 'user.name', 'Fixture']); git(repo, ['config', 'user.email', 'fixture@example.invalid']); }
  commitFile(seed, 'shared.txt', 'base\n', 'base');
  git(seed, ['remote', 'add', 'origin', remote]); git(seed, ['push', '-u', 'origin', 'main']);
  git(root, ['clone', remote, edit]); git(root, ['clone', remote, competitor]);
  for (const repo of [edit, competitor]) { git(repo, ['config', 'user.name', 'Fixture']); git(repo, ['config', 'user.email', 'fixture@example.invalid']); }
  return { root, remote, edit, competitor };
}

test('divergent remote main reconciles in a clean worktree while dirty edit checkout is preserved', () => {
  const state = fixture();
  const taskCommit = commitFile(state.edit, 'task.txt', 'task patch\n', 'task patch');
  writeFileSync(join(state.edit, 'user-notes.txt'), 'unrelated dirty work\n');
  writeFileSync(join(state.edit, 'shared.txt'), 'base\nlocal uncommitted note\n');
  const dirtyBefore = git(state.edit, ['status', '--porcelain=v1']);
  commitFile(state.competitor, 'remote.txt', 'remote advance\n', 'remote advance');
  git(state.competitor, ['push', 'origin', 'main']);

  const worktree = join(state.root, 'integration');
  const prepared = prepareReconciliationWorktree({ editCheckout: state.edit, worktree });
  const replayed = replayTaskCommits({ editCheckout: state.edit, worktree, baseCommit: prepared.baseCommit, taskCommits: [taskCommit] });
  assert.ok(replayed.receipt, replayed.blocker?.summary);
  assert.deepEqual(replayed.receipt!.changedPaths, ['task.txt']);
  assert.equal(git(state.edit, ['status', '--porcelain=v1']), dirtyBefore);

  const pushInput = { repository: 'fixture/repo', worktree, expectedRemoteBefore: prepared.baseCommit, testedCommit: replayed.receipt!.integratedCommit };
  const plan = planTestedTreePush(pushInput).plan!;
  assert.deepEqual(plan.args, ['push', 'origin', 'HEAD:refs/heads/main']);
  assert.ok(plan.args.every((arg) => !arg.includes('force')));
  const pushed = pushTestedTree(pushInput);
  assert.ok(pushed.pushed, pushed.blocker?.summary);
  assert.equal(pushed.pushed!.remoteAfter, replayed.receipt!.integratedCommit);
  assert.equal(git(state.edit, ['status', '--porcelain=v1']), dirtyBefore);
  assert.equal(readFileSync(join(state.edit, 'user-notes.txt'), 'utf8'), 'unrelated dirty work\n');
});

test('competing remote write blocks normal push with an exact resumable action', () => {
  const state = fixture();
  const taskCommit = commitFile(state.edit, 'task.txt', 'task patch\n', 'task patch');
  writeFileSync(join(state.edit, 'user-notes.txt'), 'preserve me\n');
  const dirtyBefore = git(state.edit, ['status', '--porcelain=v1']);
  const worktree = join(state.root, 'integration');
  const prepared = prepareReconciliationWorktree({ editCheckout: state.edit, worktree });
  const replayed = replayTaskCommits({ editCheckout: state.edit, worktree, baseCommit: prepared.baseCommit, taskCommits: [taskCommit] }).receipt!;
  const competingSha = commitFile(state.competitor, 'remote.txt', 'competing write\n', 'competing write');
  git(state.competitor, ['push', 'origin', 'main']);
  const result = pushTestedTree({ repository: 'fixture/repo', worktree, expectedRemoteBefore: prepared.baseCommit, testedCommit: replayed.integratedCommit });
  assert.equal(result.blocker?.code, 'remote-main-advanced');
  assert.equal(result.blocker?.observed, competingSha);
  assert.match(result.blocker!.nextAction, /new clean reconciliation worktree/);
  assert.equal(git(state.edit, ['status', '--porcelain=v1']), dirtyBefore);
});

test('task patch conflict reports only unresolved paths and aborts cherry-pick', () => {
  const state = fixture();
  const taskCommit = commitFile(state.edit, 'shared.txt', 'task version\n', 'task conflict');
  commitFile(state.competitor, 'shared.txt', 'remote version\n', 'remote conflict');
  git(state.competitor, ['push', 'origin', 'main']);
  const worktree = join(state.root, 'integration');
  const prepared = prepareReconciliationWorktree({ editCheckout: state.edit, worktree });
  const result = replayTaskCommits({ editCheckout: state.edit, worktree, baseCommit: prepared.baseCommit, taskCommits: [taskCommit] });
  assert.equal(result.blocker?.code, 'task-patch-conflict');
  assert.deepEqual(result.blocker?.conflictedPaths, ['shared.txt']);
  assert.equal(git(worktree, ['status', '--porcelain=v1']), '');
});

test('affected paths invalidate narrow required checks', () => {
  assert.deepEqual(affectedChecks(['schemas/run.json', 'pnpm-lock.yaml', '.github/workflows/publish.yml', 'policies/core.md', '.changeset/next.md']), [
    'dependency-install-and-build', 'instruction-policy-drift', 'release-validation', 'schema-validation', 'task-focused-tests', 'workflow-syntax-and-actionlint',
  ]);
});

test('remote and CI observation close only the exact tested commit', () => {
  const state = fixture();
  const testedCommit = git(state.edit, ['rev-parse', 'HEAD']);
  const success = observeRemoteAndCi({ repository: 'fixture/repo', checkout: state.edit, testedCommit, ci: { status: 'success', url: 'fixture://ci/success' } });
  assert.equal(success.delivered, true);
  const pending = observeRemoteAndCi({ repository: 'fixture/repo', checkout: state.edit, testedCommit, ci: { status: 'pending', url: 'fixture://ci/pending' } });
  assert.equal(pending.delivered, false);
  assert.equal(pending.blocker?.code, 'ci-not-green');
});
