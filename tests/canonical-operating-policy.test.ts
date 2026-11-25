import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const policyPath = join(root, 'policies', 'operational-prompt-hydration.md');
const compactCore = 'Hydrate engineering requests into complete intended outcomes using repository context, current research, explicit requirements, and recorded assumptions. Use a small team of role-based agents to challenge the architecture, then express the work in OpenSpec and execute independent tasks in parallel. Build reusable capabilities in theme.tools and consume its packages. Verify behavior, update documentation, and promptly commit and push coherent changes to main. Learn reusable lessons and user preferences from evidence. After delivering the requested outcome, implement applicable improvements and repeat across the product until no justified work remains or execution must pause. Preserve exact resumable state. Respect explicit scope, current user corrections, platform constraints, and existing authorization.';
const expectedDigest = '05ee082f51394e1ad5e106e7991c504903412d64487eb7a62dcd2185bdb9bd65';

function markdownFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (entry === '.git' || entry === 'node_modules' || entry === 'openspec') continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...markdownFiles(path));
    else if (path.endsWith('.md')) files.push(path);
  }
  return files;
}

test('canonical compact core is verbatim and digest-addressed', () => {
  const policy = readFileSync(policyPath, 'utf8');
  assert.ok(policy.includes(`> ${compactCore}`));
  assert.match(policy, /^policy_id: operational-prompt-hydration$/m);
  assert.match(policy, /^policy_version: 1\.0\.0$/m);
  assert.match(policy, new RegExp(`^core_digest: ${expectedDigest}$`, 'm'));
  assert.equal(createHash('sha256').update(compactCore).digest('hex'), expectedDigest);
});

test('no second canonical compact-core copy exists outside generated managed blocks', () => {
  const copies = markdownFiles(root).filter((path) => readFileSync(path, 'utf8').includes(compactCore));
  assert.ok(copies.includes(policyPath));
  for (const path of copies.filter((candidate) => candidate !== policyPath)) {
    const source = readFileSync(path, 'utf8');
    const coreIndex = source.indexOf(compactCore);
    const beginIndex = source.lastIndexOf('<!-- EMDASH:POLICY:BEGIN', coreIndex);
    const endIndex = source.indexOf('<!-- EMDASH:POLICY:END -->', coreIndex);
    assert.ok(beginIndex >= 0 && endIndex > coreIndex, `${relative(root, path)} contains an unmanaged compact-core copy`);
    assert.doesNotMatch(source, /^status: canonical$/m, `${relative(root, path)} falsely claims canonical status`);
  }
});

test('policy links resolve to focused procedures and states provider boundary', () => {
  const policy = readFileSync(policyPath, 'utf8');
  for (const link of policy.matchAll(/\]\(\.\.\/([^\)]+)\)/g)) {
    assert.ok(statSync(join(root, link[1])).isFile(), `missing focused procedure ${link[1]}`);
  }
  assert.match(policy, /never claims to replace provider-controlled system or developer instructions/);
  assert.doesNotMatch(policy, /ignore (?:higher-priority|system|developer) instructions/i);
});
