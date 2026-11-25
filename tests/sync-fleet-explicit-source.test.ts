import assert from 'node:assert/strict';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const cli = join(root, 'bin', 'sync-fleet-harnesses.ts');

function run(command: string, args: string[], cwd?: string): string {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

function fixture(): { source: string; other: string; revision: string; installedLink: string } {
  const directory = mkdtempSync(join(tmpdir(), 'fleet-source-'));
  const remote = join(directory, 'remote.git');
  const seed = join(directory, 'seed');
  const source = join(directory, 'source');
  const other = join(directory, 'other');
  const installedLink = join(directory, 'installed-agent-skills');
  run('git', ['init', '--bare', '--initial-branch=main', remote]);
  run('git', ['init', '--initial-branch=main', seed]);
  run('git', ['config', 'user.name', 'Fixture'], seed);
  run('git', ['config', 'user.email', 'fixture@example.invalid'], seed);
  writeFileSync(join(seed, 'AGENTS.md'), 'fixture\n');
  run('git', ['add', 'AGENTS.md'], seed);
  run('git', ['commit', '-m', 'fixture'], seed);
  run('git', ['remote', 'add', 'origin', remote], seed);
  run('git', ['push', '-u', 'origin', 'main'], seed);
  run('git', ['clone', remote, source]);
  run('git', ['clone', remote, other]);
  const revision = run('git', ['rev-parse', 'HEAD'], source);
  return { source, other, revision, installedLink };
}

function probe(source: string, revision: string, installedLink: string) {
  return spawnSync(process.execPath, [
    '--experimental-strip-types', cli, '--check-source',
    '--source-root', source,
    '--expected-revision', revision,
    '--installed-link', installedLink,
    '--json',
  ], { encoding: 'utf8', timeout: 10_000 });
}

test('clean explicit source emits a revision-bound receipt without syncing', () => {
  const state = fixture();
  const result = probe(state.source, state.revision, state.installedLink);
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, 'verified');
  assert.equal(receipt.actualRevision, state.revision);
  assert.equal(receipt.remoteMainRevision, state.revision);
  assert.equal(receipt.dirty, false);
  assert.equal(receipt.installedLinkState, 'absent');
});

test('dirty selected source fails closed', () => {
  const state = fixture();
  writeFileSync(join(state.source, 'AGENTS.md'), 'dirty\n');
  const result = probe(state.source, state.revision, state.installedLink);
  assert.notEqual(result.status, 0);
  assert.equal(JSON.parse(result.stderr).classification, 'dirty-selected-source');
});

test('source divergent from origin/main fails closed', () => {
  const state = fixture();
  run('git', ['config', 'user.name', 'Fixture'], state.source);
  run('git', ['config', 'user.email', 'fixture@example.invalid'], state.source);
  writeFileSync(join(state.source, 'LOCAL.md'), 'ahead\n');
  run('git', ['add', 'LOCAL.md'], state.source);
  run('git', ['commit', '-m', 'local ahead'], state.source);
  const aheadRevision = run('git', ['rev-parse', 'HEAD'], state.source);
  const result = probe(state.source, aheadRevision, state.installedLink);
  assert.notEqual(result.status, 0);
  assert.equal(JSON.parse(result.stderr).classification, 'divergent-selected-source');
});

test('installed symlink resolving to another checkout fails closed', () => {
  const state = fixture();
  symlinkSync(state.other, state.installedLink);
  const result = probe(state.source, state.revision, state.installedLink);
  assert.notEqual(result.status, 0);
  assert.equal(JSON.parse(result.stderr).classification, 'ambiguous-installed-source');
});

test('implicit source discovery is rejected', () => {
  const result = spawnSync(process.execPath, ['--experimental-strip-types', cli, '--check-source', '--json'], {
    encoding: 'utf8', timeout: 10_000,
  });
  assert.notEqual(result.status, 0);
  assert.equal(JSON.parse(result.stderr).classification, 'explicit-source-required');
});
