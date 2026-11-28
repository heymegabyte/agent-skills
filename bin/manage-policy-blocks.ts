#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { isCliEntrypoint } from './cli-entrypoint.ts';

const BEGIN_PREFIX = '<!-- EMDASH:POLICY:BEGIN';
const END = '<!-- EMDASH:POLICY:END -->';
const BEGIN_PATTERN = /<!-- EMDASH:POLICY:BEGIN(?: [^\n]*?)? -->/g;
const END_PATTERN = /<!-- EMDASH:POLICY:END -->/g;

export type PolicyMetadata = {
  policyId: string;
  version: string;
  digest: string;
  sourceRevision: string;
};

export type Projection = {
  metadata: PolicyMetadata;
  content: string;
  block: string;
  changed: boolean;
};

export class ManagedPolicyError extends Error {
  readonly classification: string;

  constructor(classification: string, message: string) {
    super(message);
    this.name = 'ManagedPolicyError';
    this.classification = classification;
  }
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function frontmatterValue(content: string, key: string): string | undefined {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
  return frontmatter?.match(new RegExp(`^${key}:\\s*([^\\n]+)$`, 'm'))?.[1]?.trim();
}

export function canonicalMetadata(canonical: string, sourceRevision: string): PolicyMetadata {
  const policyId = frontmatterValue(canonical, 'policy_id');
  const version = frontmatterValue(canonical, 'policy_version') ?? frontmatterValue(canonical, 'version');
  if (!policyId || !version) {
    throw new ManagedPolicyError('invalid-canonical-policy', 'canonical policy requires policy_id and version frontmatter');
  }
  if (!/^[0-9a-f]{40}$/.test(sourceRevision)) {
    throw new ManagedPolicyError('invalid-source-revision', 'expected revision must be a full 40-character Git SHA');
  }
  return { policyId, version, digest: sha256(canonical), sourceRevision };
}

/**
 * Stable revision for the canonical policy source itself.
 *
 * A checkout HEAD cannot be embedded in files committed by that same HEAD: the
 * commit changes the value and creates perpetual post-commit drift.  This
 * content-addressed revision changes exactly when the canonical policy source
 * changes, while the separately verified selected checkout revision remains in
 * install/publish receipts.
 */
export function canonicalSourceRevision(canonical: string): string {
  return sha256(canonical).slice(0, 40);
}

function markers(target: string): { begin: RegExpMatchArray[]; end: RegExpMatchArray[] } {
  return {
    begin: [...target.matchAll(BEGIN_PATTERN)],
    end: [...target.matchAll(END_PATTERN)],
  };
}

function existingBounds(target: string): { start: number; end: number; begin: string } | null {
  const found = markers(target);
  if (found.begin.length > 1 || found.end.length > 1) {
    throw new ManagedPolicyError('duplicate-managed-block', 'target contains duplicate managed-policy delimiters');
  }
  if (found.begin.length !== found.end.length) {
    throw new ManagedPolicyError('malformed-managed-block', 'target contains an unmatched managed-policy delimiter');
  }
  if (found.begin.length === 0) return null;
  const start = found.begin[0].index!;
  const endStart = found.end[0].index!;
  if (endStart < start) {
    throw new ManagedPolicyError('malformed-managed-block', 'managed-policy end delimiter precedes begin delimiter');
  }
  return { start, end: endStart + END.length, begin: found.begin[0][0] };
}

function digestFromBegin(begin: string): string | undefined {
  return begin.match(/\bdigest="sha256:([0-9a-f]{64})"/)?.[1];
}

export function renderManagedBlock(canonical: string, metadata: PolicyMetadata): string {
  const compactCore = canonical.match(/^>\s+(.+)$/m)?.[1];
  const interpretationBoundary = canonical.match(/## Interpretation boundary\n\n([^\n]+)/)?.[1];
  const body = compactCore
    ? `${compactCore}${interpretationBoundary ? `\n\n${interpretationBoundary}` : ''}`
    : canonical.replace(/^---\n[\s\S]*?\n---\n?/, '').trimEnd();
  return `${BEGIN_PREFIX} id="${metadata.policyId}" version="${metadata.version}" digest="sha256:${metadata.digest}" source-revision="${metadata.sourceRevision}" -->\n${body}\n${END}`;
}

export function projectManagedPolicy(target: string, canonical: string, sourceRevision: string, previousCanonical?: string): Projection {
  const metadata = canonicalMetadata(canonical, sourceRevision);
  const bounds = existingBounds(target);
  if (bounds) {
    const installedDigest = digestFromBegin(bounds.begin);
    if (installedDigest && installedDigest !== metadata.digest) {
      const priorRevision = /source-revision="([0-9a-f]{40})"/.exec(bounds.begin)?.[1];
      if (!previousCanonical || !priorRevision || installedDigest !== sha256(previousCanonical)) {
        throw new ManagedPolicyError('foreign-managed-digest', `target digest ${installedDigest} differs from canonical ${metadata.digest}`);
      }
      const prior = checkManagedPolicy(target, previousCanonical, priorRevision);
      if (prior.metadata.policyId !== metadata.policyId) {
        throw new ManagedPolicyError('foreign-managed-digest', 'previous policy identity differs from canonical');
      }
    }
  }
  const block = renderManagedBlock(canonical, metadata);
  const content = bounds
    ? target.slice(0, bounds.start) + block + target.slice(bounds.end)
    : target + (target.endsWith('\n') || target.length === 0 ? '' : '\n') + block + '\n';
  return { metadata, content, block, changed: content !== target };
}

export function checkManagedPolicy(target: string, canonical: string, sourceRevision: string): Projection {
  const metadata = canonicalMetadata(canonical, sourceRevision);
  const bounds = existingBounds(target);
  if (!bounds) throw new ManagedPolicyError('missing-managed-block', 'target has no managed-policy block');
  const installedDigest = digestFromBegin(bounds.begin);
  if (!installedDigest) throw new ManagedPolicyError('missing-managed-digest', 'managed-policy block has no digest metadata');
  if (installedDigest !== metadata.digest) {
    throw new ManagedPolicyError('foreign-managed-digest', `target digest ${installedDigest} differs from canonical ${metadata.digest}`);
  }
  const expected = renderManagedBlock(canonical, metadata);
  const actual = target.slice(bounds.start, bounds.end);
  if (actual !== expected) throw new ManagedPolicyError('managed-block-drift', 'managed-policy block content or metadata has drifted');
  return { metadata, content: target, block: actual, changed: false };
}

export function verifySourceRevision(sourceRoot: string, expectedRevision: string): void {
  if (!sourceRoot) throw new ManagedPolicyError('explicit-source-required', '--source-root is required');
  const run = spawnSync('git', ['-C', sourceRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (run.status !== 0) throw new ManagedPolicyError('invalid-source-root', run.stderr.trim() || 'source root is not a Git checkout');
  const actual = run.stdout.trim();
  if (actual !== expectedRevision) {
    throw new ManagedPolicyError('source-revision-mismatch', `selected source is ${actual}, expected ${expectedRevision}`);
  }
}

type CliOptions = Record<string, string | boolean>;

function parseArgs(args: string[]): { mode: string; options: CliOptions } {
  const [mode, ...rest] = args;
  if (!['check', 'render', 'install'].includes(mode)) {
    throw new ManagedPolicyError('invalid-mode', 'usage: manage-policy-blocks.ts <check|render|install> --canonical FILE --target FILE --source-root DIR --expected-revision SHA [--previous-canonical FILE] [--output FILE] [--json]');
  }
  const options: CliOptions = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith('--')) throw new ManagedPolicyError('invalid-arguments', `unexpected argument: ${arg}`);
    const key = arg.slice(2);
    if (key === 'json' || key === 'in-place') options[key] = true;
    else {
      const value = rest[++index];
      if (!value || value.startsWith('--')) throw new ManagedPolicyError('invalid-arguments', `${arg} requires a value`);
      options[key] = value;
    }
  }
  return { mode, options };
}

function required(options: CliOptions, key: string): string {
  const value = options[key];
  if (typeof value !== 'string') throw new ManagedPolicyError('invalid-arguments', `--${key} is required`);
  return value;
}

function runCli(args: string[]): number {
  let json = args.includes('--json');
  try {
    const { mode, options } = parseArgs(args);
    json = options.json === true;
    const canonicalPath = resolve(required(options, 'canonical'));
    const targetPath = resolve(required(options, 'target'));
    const sourceRoot = resolve(required(options, 'source-root'));
    const expectedRevision = required(options, 'expected-revision');
    verifySourceRevision(sourceRoot, expectedRevision);
    const canonical = readFileSync(canonicalPath, 'utf8');
    const target = readFileSync(targetPath, 'utf8');
    const policySourceRevision = canonicalSourceRevision(canonical);
    const previousCanonical = typeof options['previous-canonical'] === 'string'
      ? readFileSync(resolve(options['previous-canonical']), 'utf8') : undefined;
    const projection = mode === 'check'
      ? checkManagedPolicy(target, canonical, policySourceRevision)
      : projectManagedPolicy(target, canonical, policySourceRevision, previousCanonical);
    let output: string | null = null;
    if (mode === 'install') {
      output = options['in-place'] === true ? targetPath : resolve(required(options, 'output'));
      writeFileSync(output, projection.content);
    }
    const receipt = {
      ok: true,
      mode,
      policyId: projection.metadata.policyId,
      version: projection.metadata.version,
      digest: `sha256:${projection.metadata.digest}`,
      sourceRoot,
      sourceRevision: projection.metadata.sourceRevision,
      selectedSourceRevision: expectedRevision,
      target: targetPath,
      output,
      changed: projection.changed,
      rendered: mode === 'render' ? projection.content : undefined,
    };
    process.stdout.write(json ? `${JSON.stringify(receipt)}\n` : mode === 'render' ? projection.content : `${mode}: ok\n`);
    return 0;
  } catch (error) {
    const managed = error instanceof ManagedPolicyError ? error : new ManagedPolicyError('unexpected-error', error instanceof Error ? error.message : String(error));
    const receipt = { ok: false, classification: managed.classification, message: managed.message };
    process.stderr.write(json ? `${JSON.stringify(receipt)}\n` : `${managed.classification}: ${managed.message}\n`);
    return 1;
  }
}

if (isCliEntrypoint(import.meta.url)) process.exitCode = runCli(process.argv.slice(2));
