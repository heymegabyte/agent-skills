#!/usr/bin/env -S node --experimental-strip-types

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type Scenario = {
  readonly schemaVersion: string;
  readonly package: string;
  readonly source: { readonly repository: string; readonly commit: string; readonly version: string; readonly validated: boolean };
  readonly release: { readonly registryPath: string; readonly expectedVersion: string; readonly expectedIntegrity: string };
  readonly consumer: {
    readonly repository: string;
    readonly manifest: string;
    readonly lockfile: string;
    readonly expectedCommit: string;
    readonly verificationCommand: string;
  };
  readonly requiredEvidence: readonly string[];
};

type Args = { command: string; scenario: string; registry?: string; evidenceLevel?: string; json: boolean };

function parseArgs(argv: readonly string[]): Args {
  const [command = ''] = argv;
  let scenario = '';
  let registry: string | undefined;
  let evidenceLevel: string | undefined;
  let json = false;
  for (let index = 1; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--scenario') scenario = argv[++index] ?? '';
    else if (value === '--registry') registry = argv[++index];
    else if (value === '--evidence-level') evidenceLevel = argv[++index];
    else if (value === '--json') json = true;
    else throw new Error(`unknown argument: ${value}`);
  }
  if (command !== 'verify' || !scenario) throw new Error('usage: theme-tools-release-chain.ts verify --scenario PATH [--registry URL] [--evidence-level source-only] [--json]');
  return { command, scenario: resolve(scenario), registry, evidenceLevel, json };
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function packageRecord(lockfile: any, packageName: string): any {
  return lockfile.packages?.[`node_modules/${packageName}`];
}

function blockedReceipt(scenario: Scenario, missing: readonly string[]) {
  return {
    schemaVersion: '1.0.0',
    state: 'blocked',
    package: scenario.package,
    sourceVersion: scenario.source.version,
    pendingExternalEdge: {
      id: `${scenario.package}@${scenario.source.version}:release-to-consumer`,
      from: `source:${scenario.source.commit}`,
      to: `consumer:${scenario.consumer.repository}@${scenario.consumer.expectedCommit}`,
      missing,
      resumableCommand: `node --experimental-strip-types bin/theme-tools-release-chain.ts verify --scenario ${scenario.schemaVersion === '1.0.0' ? '<scenario>' : '<updated-scenario>'} --registry <registry-url> --json`
    },
    evidenceStrength: 'controlled-local-fixture',
    idempotencyKey: `${scenario.package}:${scenario.source.commit}:${scenario.consumer.expectedCommit}`
  };
}

export async function verifyReleaseChain(args: Args) {
  const scenario = readJson(args.scenario) as Scenario;
  if (args.evidenceLevel === 'source-only') {
    const provided = new Set(['source-validation', 'source-commit']);
    const missing = scenario.requiredEvidence.filter((edge) => !provided.has(edge));
    return { ok: false, receipt: blockedReceipt(scenario, missing) };
  }
  if (!scenario.source.validated) return { ok: false, receipt: blockedReceipt(scenario, ['source-validation']) };
  if (!args.registry) return { ok: false, receipt: blockedReceipt(scenario, ['registry-publication', 'published-version-observation']) };

  const response = await fetch(new URL(scenario.release.registryPath, args.registry));
  if (!response.ok) return { ok: false, receipt: blockedReceipt(scenario, ['registry-publication']) };
  const metadata = await response.json() as any;
  const publishedVersion = metadata['dist-tags']?.latest;
  const published = metadata.versions?.[scenario.release.expectedVersion];
  if (publishedVersion !== scenario.release.expectedVersion || published?.dist?.integrity !== scenario.release.expectedIntegrity) {
    return { ok: false, receipt: blockedReceipt(scenario, ['published-version-observation']) };
  }

  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const manifest = readJson(resolve(root, scenario.consumer.manifest));
  const lockfile = readJson(resolve(root, scenario.consumer.lockfile));
  const locked = packageRecord(lockfile, scenario.package);
  const consumerVersion = manifest.dependencies?.[scenario.package];
  const missing: string[] = [];
  if (consumerVersion !== scenario.release.expectedVersion) missing.push('consumer-manifest');
  if (locked?.version !== scenario.release.expectedVersion || locked?.integrity !== scenario.release.expectedIntegrity) missing.push('consumer-lockfile');
  if (missing.length) return { ok: false, receipt: blockedReceipt(scenario, missing) };

  const [program, ...commandArgs] = scenario.consumer.verificationCommand.split(/\s+/);
  const behavior = spawnSync(program, commandArgs, {
    cwd: dirname(resolve(root, scenario.consumer.manifest)),
    encoding: 'utf8',
    env: { ...process.env, THEME_TOOLS_PROBE_VERSION: scenario.release.expectedVersion }
  });
  if (behavior.status !== 0) return { ok: false, receipt: blockedReceipt(scenario, ['consumer-behavior']) };

  return {
    ok: true,
    receipt: {
      schemaVersion: '1.0.0',
      state: 'closed',
      package: scenario.package,
      observed: {
        sourceVersion: scenario.source.version,
        publishedVersion,
        consumerVersion: locked.version,
        behavior: 'verified'
      },
      evidence: {
        sourceRepository: scenario.source.repository,
        sourceCommit: scenario.source.commit,
        registry: args.registry,
        integrity: published.dist.integrity,
        consumerRepository: scenario.consumer.repository,
        consumerCommit: scenario.consumer.expectedCommit,
        behaviorOutput: behavior.stdout.trim()
      },
      evidenceStrength: 'controlled-local-fixture',
      idempotencyKey: `${scenario.package}:${scenario.source.commit}:${scenario.consumer.expectedCommit}`
    }
  };
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = await verifyReleaseChain(args);
    process.stdout.write(`${JSON.stringify(result.receipt, null, args.json ? 2 : 0)}\n`);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
