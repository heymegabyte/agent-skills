#!/usr/bin/env node
/** Bounded, read-only final validation loop required by AGENTS.md. */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRevision = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
const checks = [
  ['python3', ['-m', 'unittest', 'bin/__tests__/skill_router_test.py', '-v']],
  ['node', ['bin/check-route-health.mjs']],
  ['node', ['bin/gen-codex-skills.mjs', '--check']],
  ['node', ['bin/check-package-closure.mjs']],
  ['node', ['--experimental-strip-types', 'bin/gen-harness-manifests.mjs', '--check-publish-instructions', '--source-root', ROOT, '--expected-revision', sourceRevision]],
  ['bash', ['scripts/validate-skills.sh']],
  ['node', ['scripts/validate-packs.mjs']],
  ['node', ['bin/validate-skill-graph.mjs']],
  ['node', ['bin/validate-agents.mjs']],
  ['python3', ['bin/eval-skill-router.py']],
];

const started = Date.now();
const deadlineMs = Number(process.env.PERFECT_LOOP_TIMEOUT_MS || 300_000);
for (const [command, args] of checks) {
  const remaining = deadlineMs - (Date.now() - started);
  if (remaining <= 0) {
    console.error('✗ perfect loop: deadline exceeded before all required checks completed');
    process.exit(1);
  }
  console.log(`\n== ${command} ${args.join(' ')} ==`);
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit', timeout: remaining });
  if (result.error || result.status !== 0) {
    console.error(`✗ perfect loop stopped: ${result.error?.message || `exit ${result.status}`}`);
    process.exit(1);
  }
}
console.log(`\n✓ perfect loop: ${checks.length} checks passed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
