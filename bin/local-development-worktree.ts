import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

export function createDetachedDevelopmentWorktree(
  checkout: string,
  worktreeRoot: string,
  frozenBaseRevision: string,
): { directory: string; sourceDigest: string } {
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(frozenBaseRevision)) {
    throw new Error('Local development requires a full Git commit identity');
  }
  const git = (directory: string, ...args: string[]): string =>
    execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();

  const commit = git(checkout, 'rev-parse', '--verify', `${frozenBaseRevision}^{commit}`);
  if (commit !== frozenBaseRevision) throw new Error('The frozen Git identity is not the resolved commit');

  const lease = mkdtempSync(join(realpathSync(worktreeRoot), 'development-task-'));
  const directory = join(lease, 'checkout');
  git(checkout, 'worktree', 'add', '--detach', directory, commit);
  if (git(directory, 'rev-parse', 'HEAD') !== commit
    || git(directory, 'status', '--porcelain=v1', '--untracked-files=all')) {
    throw new Error(`Worktree did not start clean at the frozen commit: ${directory}`);
  }
  return { directory, sourceDigest: commit };
}
