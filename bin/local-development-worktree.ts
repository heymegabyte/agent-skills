import { execFileSync } from 'node:child_process';
import { mkdtempSync, realpathSync } from 'node:fs';
import { join } from 'node:path';

export function createDetachedDevelopmentWorktree(
  checkout: string,
  worktreeRoot: string,
  frozenBaseRevision: string,
  prerequisiteRevisions: Readonly<Record<string, string>> = {},
): { directory: string; sourceDigest: string } {
  const git = (directory: string, ...args: string[]): string =>
    execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd();
  const prerequisites = [...new Set(Object.values(prerequisiteRevisions))];
  for (const revision of [frozenBaseRevision, ...prerequisites]) {
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(revision)) {
      throw new Error('Local development requires a full Git commit identity');
    }
    if (git(checkout, 'rev-parse', '--verify', `${revision}^{commit}`) !== revision) {
      throw new Error('The supplied Git identity is not the resolved commit');
    }
  }
  const isAncestor = (ancestor: string, descendant: string): boolean => {
    try {
      git(checkout, 'merge-base', '--is-ancestor', ancestor, descendant);
      return true;
    } catch (error) {
      if ((error as { status?: number }).status === 1) return false;
      throw error;
    }
  };
  const commit = prerequisites.length
    ? prerequisites.find((candidate) => isAncestor(frozenBaseRevision, candidate)
      && prerequisites.every((revision) => isAncestor(revision, candidate)))
    : frozenBaseRevision;
  if (!commit) throw new Error('No integrated prerequisite revision contains the frozen base and every prerequisite');

  const lease = mkdtempSync(join(realpathSync(worktreeRoot), 'development-task-'));
  const directory = join(lease, 'checkout');
  git(checkout, 'worktree', 'add', '--detach', directory, commit);
  if (git(directory, 'rev-parse', 'HEAD') !== commit
    || git(directory, 'status', '--porcelain=v1', '--untracked-files=all')) {
    throw new Error(`Worktree did not start clean at the selected commit: ${directory}`);
  }
  return { directory, sourceDigest: commit };
}
