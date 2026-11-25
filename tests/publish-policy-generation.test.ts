import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { canonicalSourceRevision, checkManagedPolicy, projectManagedPolicy } from '../bin/manage-policy-blocks.ts';

const root = join(import.meta.dirname, '..');
const workflowPath = join(root, '.github', 'workflows', 'publish.yml');
const workflow = readFileSync(workflowPath, 'utf8');
const canonical = readFileSync(join(root, 'policies', 'operational-prompt-hydration.md'), 'utf8');
const revision = spawnSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim();

test('publish workflow uses canonical managed-block projection instead of destructive heredocs or cursorrules derivation', () => {
  assert.match(workflow, /gen-harness-manifests\.mjs \\\n\s+--publish-instructions/);
  assert.match(workflow, /--source-root "\$GITHUB_WORKSPACE"/);
  assert.match(workflow, /--expected-revision "\$REVISION"/);
  assert.doesNotMatch(workflow, /cat\s+>\s+AGENTS\.md/);
  assert.doesNotMatch(workflow, /cat\s+>\s+\.cursorrules/);
  assert.doesNotMatch(workflow, /(?:sed .*|cp )\.cursorrules/);
});

test('publish projection preserves unrelated target bytes and produces a checkable canonical block', () => {
  const prefix = '# Tool-owned instructions\n\nDo not rewrite this paragraph.\n\n';
  const suffix = '\n\nKeep this trailing paragraph and final newline.\n';
  const old = `${prefix}<!-- EMDASH:POLICY:BEGIN -->\nstale generated policy\n<!-- EMDASH:POLICY:END -->${suffix}`;
  const policyRevision = canonicalSourceRevision(canonical);
  const projected = projectManagedPolicy(old, canonical, policyRevision);
  assert.equal(projected.content.slice(0, prefix.length), prefix);
  assert.equal(projected.content.slice(-suffix.length), suffix);
  assert.equal(checkManagedPolicy(projected.content, canonical, policyRevision).changed, false);
});

test('publish workflow remains valid YAML syntax', () => {
  const parsed = spawnSync('ruby', ['-e', "require 'yaml'; YAML.parse_file(ARGV.fetch(0)); puts 'yaml-valid'", workflowPath], {
    encoding: 'utf8', timeout: 10_000,
  });
  assert.equal(parsed.status, 0, parsed.stderr || parsed.stdout);
  assert.match(parsed.stdout, /yaml-valid/);
});

test('generator check mode verifies every repository-managed target without writing', () => {
  const checked = spawnSync(process.execPath, [
    '--experimental-strip-types', join(root, 'bin', 'gen-harness-manifests.mjs'),
    '--check-publish-instructions', '--source-root', root,
    '--expected-revision', revision, '--json',
  ], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  const receipt = JSON.parse(checked.stdout);
  assert.equal(receipt.mode, 'check');
  assert.equal(receipt.expectedRevision, revision);
  assert.equal(receipt.policySourceRevision, canonicalSourceRevision(canonical));
  assert.equal(receipt.targets.length, 32);
  assert.ok(receipt.targets.every((target: { changed: boolean }) => target.changed === false));
});
