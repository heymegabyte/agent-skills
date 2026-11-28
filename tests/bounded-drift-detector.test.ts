import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { detectBoundedDrift, type DriftManifest } from '../bin/bounded-drift-detector.ts';
import { canonicalSourceRevision, projectManagedPolicy } from '../bin/manage-policy-blocks.ts';

const revision = '89e5c7d747db31572768c0c449701f5b4a80d5b9';
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'bounded-drift-')); const installed = join(root, 'installed');
  mkdirSync(join(root, 'policies'), { recursive: true }); mkdirSync(join(root, 'generated'), { recursive: true }); mkdirSync(join(root, 'publish'), { recursive: true }); mkdirSync(installed);
  const canonical = '---\npolicy_id: fixture-policy\npolicy_version: 1.0.0\n---\n\n> Fixture compact core.\n';
  writeFileSync(join(root, 'policies/policy.md'), canonical);
  const target = projectManagedPolicy('user-owned prefix\nuser-owned suffix\n', canonical, canonicalSourceRevision(canonical)).content;
  writeFileSync(join(root, 'generated/AGENTS.md'), target); writeFileSync(join(root, 'publish/output.md'), target); writeFileSync(join(installed, 'CODEX.md'), target);
  const manifest: DriftManifest = { schemaVersion: 1, baselineRevision: revision, canonicalPath: 'policies/policy.md', targets: [
    { id: 'canonical', class: 'canonical', targetPath: 'policies/policy.md', mode: 'canonical-digest', expectedDigest: `sha256:${awaitHash(canonical)}` },
    { id: 'generated', class: 'generated', targetPath: 'generated/AGENTS.md', mode: 'managed-block' },
    { id: 'installed', class: 'installed', targetPath: 'CODEX.md', mode: 'managed-block', sourceRevision: revision, optional: true },
    { id: 'publish', class: 'publish', targetPath: 'publish/output.md', mode: 'managed-block' },
  ] };
  return { root, installed, canonical, manifest };
}
import { createHash } from 'node:crypto';
function awaitHash(value: string) { return createHash('sha256').update(value).digest('hex'); }

describe('bounded drift detector', () => {
  it('covers canonical, generated, installed, and publish outputs read-only', () => {
    const f = fixture(); const result = detectBoundedDrift({ sourceRoot: f.root, sourceRevision: revision, installedRoot: f.installed, manifest: f.manifest });
    assert.equal(result.status, 'PASS'); assert.deepEqual(result.findings.map(({ class: kind }) => kind), ['canonical', 'generated', 'installed', 'publish']);
  });
  it('does not report drift when only the selected Git revision advances', () => {
    const f = fixture();
    const laterRevision = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const result = detectBoundedDrift({ sourceRoot: f.root, sourceRevision: laterRevision, installedRoot: f.installed, manifest: f.manifest });
    assert.equal(result.status, 'PASS');
    assert.equal(result.findings.find((item) => item.id === 'generated')?.repair.sourceRevision, laterRevision);
  });
  it('preserves unmanaged content and detects only managed-block drift', () => {
    const f = fixture(); const path = join(f.root, 'generated/AGENTS.md');
    writeFileSync(path, readFileSync(path, 'utf8').replace('user-owned prefix', 'new user-owned prefix'));
    assert.equal(detectBoundedDrift({ sourceRoot: f.root, sourceRevision: revision, installedRoot: f.installed, manifest: f.manifest }).findings.find((item) => item.id === 'generated')?.status, 'PASS');
    writeFileSync(path, readFileSync(path, 'utf8').replace('Fixture compact core.', 'drifted managed core'));
    const finding = detectBoundedDrift({ sourceRoot: f.root, sourceRevision: revision, installedRoot: f.installed, manifest: f.manifest }).findings.find((item) => item.id === 'generated')!;
    assert.equal(finding.status, 'DRIFT'); assert.equal(finding.classification, 'managed-block-drift');
    assert.deepEqual({ sourceRoot: finding.repair.sourceRoot, sourceRevision: finding.repair.sourceRevision, target: finding.repair.target, mutatesUnmanagedContent: finding.repair.mutatesUnmanagedContent, requiresExplicitExecution: finding.repair.requiresExplicitExecution }, { sourceRoot: f.root, sourceRevision: revision, target: path, mutatesUnmanagedContent: false, requiresExplicitExecution: true });
    assert.match(finding.repair.command, /manage-policy-blocks\.ts install/);
  });
  it('reports installed truth as unverified without probing or mutating globals', () => {
    const f = fixture(); const result = detectBoundedDrift({ sourceRoot: f.root, sourceRevision: revision, manifest: f.manifest });
    assert.equal(result.status, 'UNVERIFIED'); assert.equal(result.findings.find((item) => item.id === 'installed')?.classification, 'installed-root-not-supplied');
  });
});


it('runs installed workflow CLIs through a symlinked skills checkout', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'workflow-cli-symlink-'));
  const checkout = join(import.meta.dirname, '..');
  const installed = join(temporary, 'installed');
  symlinkSync(checkout, installed, 'dir');
  try {
    for (const [name, expected] of [
      ['bounded-drift-detector', /source-revision is required/],
      ['manage-policy-blocks', /invalid-mode/],
      ['compile-operational-change-trace', /SOURCE_REVISION/],
      ['evidence-gated-orchestrator', /trusted-local-module/],
    ] as const) {
      const result = spawnSync('node', [join(installed, 'bin', `${name}.ts`)], { encoding: 'utf8', timeout: 10_000 });
      assert.notEqual(result.status, 0, name);
      assert.match(result.stderr, expected);
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
