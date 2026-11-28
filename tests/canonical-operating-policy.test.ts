import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const policyPath = join(root, 'policies', 'operational-prompt-hydration.md');
const compactCore = 'Split material engineering requests into research-backed briefs guided by repository context and applicable skills. Have a frontier architect compile independently verifiable OpenSpec changes. Give each change one owner through verification. Dispatch ready changes concurrently within approved capacity, using OpenCode with DeepSeek through LiteLLM where suitable and recording provider exceptions. During implementation, capture and admit justified improvements in OpenSpec, and route reusable application code, host configuration, and agent procedures to theme.tools, install.doctor, and agent-skills respectively. Verify integrated results, update documentation and consumers, and deliver authorized changes. Refresh evidence until no justified in-scope work remains and preserve resumable state.';
const expectedDigest = '11c96ba6b77b7e166047bdf15b5277c59ce32e9418f0d15a5809591ee734429d';

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
  assert.match(policy, /^policy_version: 1\.3\.0$/m);
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
