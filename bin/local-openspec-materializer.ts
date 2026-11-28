import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CompiledArtifact } from './swarm-execution-kernel.ts';

/** Commit one approved batch in an isolated index and fast-forward the local host checkout. */
export async function materializeLocalOpenSpec(
  checkout: string, artifacts: CompiledArtifact[], sessionId: string,
): Promise<string> {
  const allowedPath = /^openspec\/changes\/([a-z0-9]+(?:-[a-z0-9]+)*)\/(?:proposal\.md|design\.md|tasks\.md|specs\/\1\/spec\.md)$/;
  if (!artifacts.length || artifacts.some(({ path }) => !allowedPath.test(path))
    || new Set(artifacts.map(({ path }) => path)).size !== artifacts.length
    || !/^[a-zA-Z0-9._:-]+$/.test(sessionId)) {
    throw new Error('Invalid OpenSpec materialization batch');
  }
  const temporary = mkdtempSync(join(tmpdir(), 'openspec-index-'));
  try {
    const git = (args: string[], input?: string, useTemporaryIndex = false) =>
      execFileSync('git', ['-C', checkout, '--no-replace-objects', '--literal-pathspecs',
        '-c', 'core.hooksPath=/dev/null', ...args], {
        encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'pipe'],
        ...(useTemporaryIndex ? { env: { ...process.env, GIT_INDEX_FILE: join(temporary, 'index') } } : {}),
      });
    const head = () => git(['rev-parse', '--verify', 'HEAD']).trim();
    const requireClean = () => {
      if (git(['status', '--porcelain=v1', '--untracked-files=all', '--ignore-submodules=none'])) {
        throw new Error('OpenSpec materialization requires a clean host checkout');
      }
    };
    requireClean();
    const base = head();
    git(['read-tree', base], undefined, true);
    for (const { path, content } of artifacts) {
      if (git(['ls-tree', base, '--', path])) throw new Error(`OpenSpec artifact already exists: ${path}`);
      const blob = git(['hash-object', '-w', '--stdin'], content).trim();
      git(['update-index', '--add', '--cacheinfo', '100644', blob, path], undefined, true);
    }
    const tree = git(['write-tree'], undefined, true).trim();
    const paths = git(['diff', '--name-only', '--no-renames', '-z', base, tree, '--']).split('\0').filter(Boolean);
    if (JSON.stringify(paths.sort()) !== JSON.stringify(artifacts.map(({ path }) => path).sort())) {
      throw new Error('OpenSpec materialization would modify unrelated paths');
    }
    git(['diff', '--check', base, tree, '--']);
    const revision = git(['-c', 'user.name=OpenSpec Host', '-c', 'user.email=openspec@localhost',
      'commit-tree', '--no-gpg-sign', tree, '-p', base, '-m', 'Materialize approved OpenSpec changes',
      '-m', `Architect-Session: ${sessionId}`]).trim();
    requireClean();
    if (head() !== base) throw new Error('Host checkout advanced during OpenSpec materialization');
    git(['merge', '--ff-only', '--no-overwrite-ignore', revision]);
    if (head() !== revision) throw new Error('Host checkout did not reach the materialized revision');
    return revision;
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}
