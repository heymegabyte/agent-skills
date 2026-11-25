import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';

const root = join(import.meta.dirname, '..');
const fixtureRoot = join(root, 'fixtures', 'theme-tools-release', 'controlled-registry');

function runVerifier(args: string[]): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--experimental-strip-types', 'bin/theme-tools-release-chain.ts', ...args], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (status) => resolve({ status, stdout, stderr }));
  });
}

test('controlled registry closes source, publication, consumer, behavior, and commit evidence', async () => {
  const metadata = JSON.parse(readFileSync(join(fixtureRoot, 'registry-metadata.json'), 'utf8'));
  const server = createServer((request, response) => {
    if (request.url === '/@theme.tools%2fprompt-hydration-probe') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(metadata));
      return;
    }
    response.writeHead(404).end();
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address === 'object');
    const run = await runVerifier([
      'verify',
      '--scenario',
      join(fixtureRoot, 'scenario.json'),
      '--registry',
      `http://127.0.0.1:${address.port}`,
      '--json'
    ]);
    assert.equal(run.status, 0, `release-chain verifier failed:\n${run.stderr || run.stdout}`);
    const receipt = JSON.parse(run.stdout);
    assert.equal(receipt.state, 'closed');
    assert.deepEqual(receipt.observed, {
      sourceVersion: '1.0.1',
      publishedVersion: '1.0.1',
      consumerVersion: '1.0.1',
      behavior: 'verified'
    });
    assert.equal(receipt.evidence.sourceCommit, '1111111111111111111111111111111111111111');
    assert.equal(receipt.evidence.consumerCommit, '2222222222222222222222222222222222222222');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('source-only evidence cannot satisfy the release-to-consumer chain', () => {
  const scenario = JSON.parse(readFileSync(join(fixtureRoot, 'scenario.json'), 'utf8'));
  const sourceOnly = new Set(['source-validation', 'source-commit']);
  const missing = scenario.requiredEvidence.filter((edge: string) => !sourceOnly.has(edge));
  assert.deepEqual(missing, [
    'registry-publication',
    'published-version-observation',
    'consumer-manifest',
    'consumer-lockfile',
    'consumer-behavior',
    'consumer-commit'
  ]);
});

test('blocked release preserves one exact idempotent resumable edge', async () => {
  const arguments_ = [
    'verify',
    '--scenario',
    join(fixtureRoot, 'scenario.json'),
    '--evidence-level',
    'source-only',
    '--json'
  ];
  const first = await runVerifier(arguments_);
  const second = await runVerifier(arguments_);
  assert.equal(first.status, 1);
  assert.equal(second.status, 1);
  const firstReceipt = JSON.parse(first.stdout);
  const secondReceipt = JSON.parse(second.stdout);
  assert.deepEqual(secondReceipt, firstReceipt);
  assert.equal(firstReceipt.state, 'blocked');
  assert.equal(firstReceipt.pendingExternalEdge.id, '@theme.tools/prompt-hydration-probe@1.0.1:release-to-consumer');
  assert.deepEqual(firstReceipt.pendingExternalEdge.missing, [
    'registry-publication',
    'published-version-observation',
    'consumer-manifest',
    'consumer-lockfile',
    'consumer-behavior',
    'consumer-commit'
  ]);
  assert.match(firstReceipt.pendingExternalEdge.resumableCommand, /--registry <registry-url> --json$/);
});
