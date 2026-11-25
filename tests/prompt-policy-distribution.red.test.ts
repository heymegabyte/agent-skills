import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { canonicalSourceRevision, checkManagedPolicy, ManagedPolicyError, projectManagedPolicy } from '../bin/manage-policy-blocks.ts';

const root = join(import.meta.dirname, '..');
const fixtureRoot = join(root, 'bin', '__tests__', 'fixtures', 'prompt-policy-distribution');
const cli = join(root, 'bin', 'manage-policy-blocks.ts');
const canonical = readFileSync(join(fixtureRoot, 'canonical-policy.md'), 'utf8');
const revision = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const fixture = (name: string) => readFileSync(join(fixtureRoot, name), 'utf8');

function classification(error: unknown): string | undefined {
  return error instanceof ManagedPolicyError ? error.classification : undefined;
}

test('render binds canonical identity, digest, and selected source revision', () => {
  const projected = projectManagedPolicy('', canonical, revision);
  assert.match(projected.block, /id="emdash-operational-core" version="1\.0\.0"/);
  assert.match(projected.block, /digest="sha256:[0-9a-f]{64}"/);
  assert.match(projected.block, new RegExp(`source-revision="${revision}"`));
});

test('embedded policy source revision is stable across unrelated commits and changes with canonical policy', () => {
  const sourceRevision = canonicalSourceRevision(canonical);
  const installed = projectManagedPolicy('', canonical, sourceRevision).content;
  assert.equal(checkManagedPolicy(installed, canonical, canonicalSourceRevision(canonical)).changed, false);
  assert.equal(canonicalSourceRevision(canonical), sourceRevision, 'an unrelated checkout commit cannot affect policy projection');
  const changedCanonical = canonical.replace('Prompt Hydration', 'Prompt Hydration updated');
  assert.notEqual(canonicalSourceRevision(changedCanonical), sourceRevision);
  assert.throws(() => checkManagedPolicy(installed, changedCanonical, canonicalSourceRevision(changedCanonical)),
    (error) => classification(error) === 'foreign-managed-digest');
});

test('install projection preserves all bytes outside exact managed delimiters', () => {
  const target = fixture('target-unmanaged.md');
  const projected = projectManagedPolicy(target, canonical, revision);
  const [prefix] = target.split('<!-- EMDASH:POLICY:BEGIN');
  const suffix = target.slice(target.indexOf('<!-- EMDASH:POLICY:END -->') + '<!-- EMDASH:POLICY:END -->'.length);
  assert.equal(projected.content.slice(0, prefix.length), prefix);
  assert.equal(projected.content.slice(-suffix.length), suffix);
});

for (const [name, expected] of [
  ['target-duplicate.md', 'duplicate-managed-block'],
  ['target-malformed.md', 'malformed-managed-block'],
  ['target-foreign-digest.md', 'foreign-managed-digest'],
] as const) {
  test(`${expected} fails closed`, () => {
    assert.throws(() => projectManagedPolicy(fixture(name), canonical, revision), (error) => classification(error) === expected);
  });
}

test('check accepts an exact projection and rejects drift', () => {
  const installed = projectManagedPolicy('', canonical, revision).content;
  assert.equal(checkManagedPolicy(installed, canonical, revision).changed, false);
  assert.throws(() => checkManagedPolicy(installed.replace('Prompt Hydration', 'Prompt mutation'), canonical, revision),
    (error) => classification(error) === 'managed-block-drift');
});

test('CLI install binds explicit source and revision in its receipt', () => {
  const output = join(mkdtempSync(join(tmpdir(), 'managed-policy-')), 'AGENTS.md');
  const run = spawnSync(process.execPath, [
    '--experimental-strip-types', cli, 'install',
    '--canonical', join(fixtureRoot, 'canonical-policy.md'),
    '--target', join(fixtureRoot, 'target-unmanaged.md'),
    '--output', output,
    '--source-root', root,
    '--expected-revision', revision,
    '--json',
  ], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.sourceRoot, root);
  assert.equal(receipt.selectedSourceRevision, revision);
  assert.equal(receipt.sourceRevision, canonicalSourceRevision(canonical));
  assert.match(readFileSync(output, 'utf8'), /EMDASH:POLICY:BEGIN/);
});

test('CLI render is non-mutating and check validates an installed golden file', () => {
  const directory = mkdtempSync(join(tmpdir(), 'managed-policy-roundtrip-'));
  const installed = join(directory, 'AGENTS.md');
  const common = [
    '--canonical', join(fixtureRoot, 'canonical-policy.md'),
    '--source-root', root,
    '--expected-revision', revision,
    '--json',
  ];
  const render = spawnSync(process.execPath, [
    '--experimental-strip-types', cli, 'render',
    '--target', join(fixtureRoot, 'target-unmanaged.md'), ...common,
  ], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(render.status, 0, render.stderr);
  assert.match(JSON.parse(render.stdout).rendered, /digest="sha256:[0-9a-f]{64}"/);

  const install = spawnSync(process.execPath, [
    '--experimental-strip-types', cli, 'install',
    '--target', join(fixtureRoot, 'target-unmanaged.md'), '--output', installed, ...common,
  ], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(install.status, 0, install.stderr);

  const check = spawnSync(process.execPath, [
    '--experimental-strip-types', cli, 'check', '--target', installed, ...common,
  ], { encoding: 'utf8', timeout: 10_000 });
  assert.equal(check.status, 0, check.stderr);
  assert.equal(JSON.parse(check.stdout).changed, false);
});

test('CLI rejects a source revision mismatch', () => {
  const run = spawnSync(process.execPath, [
    '--experimental-strip-types', cli, 'render',
    '--canonical', join(fixtureRoot, 'canonical-policy.md'),
    '--target', join(fixtureRoot, 'target-unmanaged.md'),
    '--source-root', root,
    '--expected-revision', '0123456789abcdef0123456789abcdef01234567',
    '--json',
  ], { encoding: 'utf8', timeout: 10_000 });
  assert.notEqual(run.status, 0);
  assert.equal(JSON.parse(run.stderr).classification, 'source-revision-mismatch');
});
