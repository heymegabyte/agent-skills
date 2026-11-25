import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const schema = JSON.parse(readFileSync(join(root, 'schemas', 'instruction-targets.schema.json'), 'utf8'));
const config = JSON.parse(readFileSync(join(root, 'config', 'instruction-targets.json'), 'utf8'));
const expectedTargets = [
  'repository', 'plugin', 'manifest', 'coordinator', 'worker',
  'paperclip', 'openclaw', 'codex', 'claude', 'gemini', 'opencode',
];

test('instruction target config is schema valid and enumerates every supported target exactly once', () => {
  assert.deepEqual(validateSchemaInstance(schema, config), []);
  assert.deepEqual(config.targets.map((target: { id: string }) => target.id).sort(), expectedTargets.sort());
  assert.equal(new Set(config.targets.map((target: { id: string }) => target.id)).size, expectedTargets.length);
});

test('every target binds the current canonical source digest', () => {
  const source = readFileSync(join(root, config.canonicalPolicy.sourcePath));
  const digest = `sha256:${createHash('sha256').update(source).digest('hex')}`;
  assert.equal(config.canonicalPolicy.sourceDigest, digest);
  for (const target of config.targets) assert.equal(target.canonicalSourceDigest, digest, target.id);
});

test('authority and hook capability claims remain honest', () => {
  assert.equal(config.authorityBoundary.providerControlledAuthorityClaimed, false);
  assert.match(config.authorityBoundary.statement, /do not replace or claim control/);
  for (const target of config.targets) assert.equal(target.authority, 'user-controlled-customization-only');
  const nativeHooks = config.targets.filter((target: { nativePromptHook: boolean }) => target.nativePromptHook).map((target: { id: string }) => target.id);
  assert.deepEqual(nativeHooks, ['claude']);
  for (const id of ['paperclip', 'openclaw']) {
    const target = config.targets.find((candidate: { id: string }) => candidate.id === id);
    assert.equal(target.supportLevel, 'profile-wrapper');
    assert.equal(target.deliveryMechanism, 'explicit-wrapper');
  }
});
