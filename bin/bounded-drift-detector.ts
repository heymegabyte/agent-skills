#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { isCliEntrypoint } from './cli-entrypoint.ts';

import { canonicalSourceRevision, checkManagedPolicy, ManagedPolicyError } from './manage-policy-blocks.ts';

export type DriftClass = 'canonical' | 'generated' | 'installed' | 'publish';
export interface DriftTarget { id: string; class: DriftClass; targetPath: string; mode: 'canonical-digest' | 'managed-block' | 'exact'; expectedPath?: string; expectedDigest?: string; sourceRevision?: string; optional?: boolean }
export interface DriftManifest { schemaVersion: 1; baselineRevision: string; canonicalPath: string; targets: DriftTarget[] }
export interface DriftFinding { id: string; class: DriftClass; status: 'PASS' | 'DRIFT' | 'UNVERIFIED'; classification: string; target: string; repair: { sourceRoot: string; sourceRevision: string; canonical: string; target: string; command: string; mutatesUnmanagedContent: false; requiresExplicitExecution: true } }

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const pathAt = (root: string, path: string) => isAbsolute(path) ? path : join(root, path);
export function detectBoundedDrift(input: { sourceRoot: string; sourceRevision: string; manifest: DriftManifest; installedRoot?: string }): { status: 'PASS' | 'DRIFT' | 'UNVERIFIED'; baselineRevision: string; sourceRevision: string; findings: DriftFinding[] } {
  if (!/^[a-f0-9]{40}$/.test(input.sourceRevision)) throw new Error('sourceRevision must be an exact Git SHA');
  const canonicalPath = pathAt(input.sourceRoot, input.manifest.canonicalPath); const canonical = readFileSync(canonicalPath, 'utf8');
  const findings = input.manifest.targets.map((target): DriftFinding => {
    const truthRevision = input.sourceRevision;
    const policySourceRevision = canonicalSourceRevision(canonical);
    const root = target.class === 'installed' ? input.installedRoot : input.sourceRoot;
    const targetPath = root ? pathAt(root, target.targetPath) : target.targetPath;
    const repair = { sourceRoot: input.sourceRoot, sourceRevision: truthRevision, canonical: canonicalPath, target: targetPath, command: `node --experimental-strip-types bin/manage-policy-blocks.ts install --canonical ${JSON.stringify(canonicalPath)} --target ${JSON.stringify(targetPath)} --source-root ${JSON.stringify(input.sourceRoot)} --expected-revision ${truthRevision} --in-place`, mutatesUnmanagedContent: false as const, requiresExplicitExecution: true as const };
    if (!root && target.optional) return { id: target.id, class: target.class, status: 'UNVERIFIED', classification: 'installed-root-not-supplied', target: targetPath, repair };
    try {
      const actual = readFileSync(targetPath, 'utf8');
      if (target.mode === 'canonical-digest') {
        if (sha256(actual) !== target.expectedDigest?.replace(/^sha256:/, '')) throw new Error('canonical-digest-drift');
      } else if (target.mode === 'exact') {
        if (!target.expectedPath) throw new Error('exact-target-missing-expected-path');
        if (actual !== readFileSync(pathAt(input.sourceRoot, target.expectedPath), 'utf8')) throw new Error('generated-output-drift');
      } else checkManagedPolicy(actual, canonical, policySourceRevision);
      return { id: target.id, class: target.class, status: 'PASS', classification: 'in-sync', target: targetPath, repair };
    } catch (error) {
      if (target.optional && error instanceof Error && 'code' in error && error.code === 'ENOENT') return { id: target.id, class: target.class, status: 'UNVERIFIED', classification: 'optional-target-unavailable', target: targetPath, repair };
      const classification = error instanceof ManagedPolicyError ? error.classification : error instanceof Error ? error.message : 'drift-check-failed';
      return { id: target.id, class: target.class, status: 'DRIFT', classification, target: targetPath, repair };
    }
  });
  const status = findings.some((finding) => finding.status === 'DRIFT') ? 'DRIFT' : findings.some((finding) => finding.status === 'UNVERIFIED') ? 'UNVERIFIED' : 'PASS';
  return { status, baselineRevision: input.manifest.baselineRevision, sourceRevision: input.sourceRevision, findings };
}

function cli(): void {
  const args = process.argv.slice(2); const value = (flag: string) => { const index = args.indexOf(flag); return index >= 0 ? args[index + 1] : undefined; };
  const sourceRoot = resolve(value('--source-root') ?? '.'); const sourceRevision = value('--source-revision');
  if (!sourceRevision) throw new Error('--source-revision is required');
  const manifest = JSON.parse(readFileSync(resolve(value('--manifest') ?? join(sourceRoot, 'config/bounded-drift-targets.json')), 'utf8')) as DriftManifest;
  const result = detectBoundedDrift({ sourceRoot, sourceRevision, manifest, installedRoot: value('--installed-root') ? resolve(value('--installed-root')!) : undefined });
  process.stdout.write(`${JSON.stringify(result, null, args.includes('--json') ? 2 : 0)}\n`); process.exitCode = result.status === 'DRIFT' ? 1 : 0;
}
if (isCliEntrypoint(import.meta.url)) try { cli(); } catch (error) { console.error(error instanceof Error ? error.message : error); process.exitCode = 2; }
