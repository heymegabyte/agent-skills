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

/** Read approved text from immutable Git blobs. The source receipt must identify the worker commit. */
export function readCommittedReuseEvidence(
  directory: string,
  sourceDigest: string,
  approvedPaths: readonly string[],
): { sourceDigest: string; excerpts: Record<string, string> } {
  const git = (args: string[], maxBuffer = 65_536): Buffer =>
    execFileSync('git', ['-C', directory, '--no-replace-objects', '--literal-pathspecs', ...args], {
      maxBuffer, stdio: ['ignore', 'pipe', 'pipe'],
    });
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(sourceDigest)
    || git(['rev-parse', '--verify', 'HEAD']).toString().trim() !== sourceDigest) {
    throw new Error('Reuse evidence requires the accepted Git HEAD');
  }

  const excerpts: Array<[string, string]> = [];
  let remaining = 32_768;
  for (const path of new Set(approvedPaths)) {
    if (!remaining) break;
    const tree = git(['ls-tree', '-z', '--full-tree', sourceDigest, '--', path]).toString();
    const metadata = /^(100644|100755) blob ([a-f0-9]+)\t([^\0]+)\0$/.exec(tree);
    if (!metadata || metadata[3] !== path) continue;
    const object = metadata[2];
    const size = Number(git(['cat-file', '-s', object]).toString().trim());
    if (!Number.isSafeInteger(size) || size < 1 || size > remaining) continue;
    const bytes = git(['cat-file', 'blob', object], remaining);
    const content = bytes.toString('utf8');
    if (content.includes('\0') || !Buffer.from(content).equals(bytes) || !content.trim()) continue;
    excerpts.push([path, content]);
    remaining -= bytes.byteLength;
  }
  return { sourceDigest, excerpts: Object.fromEntries(excerpts) };
}
