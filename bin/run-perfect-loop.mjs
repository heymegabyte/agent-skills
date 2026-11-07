#!/usr/bin/env node
/** Bounded, resumable validation loop for the agent-skills repository. */
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, process.env.CONVERGENCE_REPORT || '.agent/perfect-loop-report.json');
const maxPasses = Math.min(6, Math.max(1, Number(process.env.CONVERGENCE_MAX_PASSES || 3)));
const maxMinutes = Math.min(90, Math.max(1, Number(process.env.CONVERGENCE_MAX_MINUTES || 90)));
const deadline = Date.now() + maxMinutes * 60_000;
const state = mkdtempSync(resolve(tmpdir(), 'agent-skills-loop-'));
const runId = process.env.CONVERGENCE_RUN_ID || randomUUID();

function git(...args) {
  return spawnSync('git', args, { cwd: root, encoding: 'utf8' }).stdout.trim();
}

function run(name, command, args, required = true) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    timeout: Math.min(300_000, Math.max(1, deadline - Date.now())),
    env: {
      ...process.env,
      AGENT_SKILLS_ROOT: root,
      EMDASH_SKILLS_ROOT: root,
      EMDASH_ROUTER_DATA_DIR: resolve(state, 'data'),
      EMDASH_ROUTER_PROJECTS_DIR: resolve(state, 'projects'),
      EMDASH_DISABLE_EMBEDDINGS: '1',
    },
  });
  let status = 'PASS';
  let reason = '';
  if (result.error?.code === 'ENOENT' && !required) {
    status = 'UNVERIFIED';
    reason = 'optional runtime unavailable';
  } else if (result.error || result.status !== 0) {
    status = required ? 'FAIL' : 'BLOCKED';
    reason = result.error?.message || `exit ${result.status}`;
  }
  return {
    name,
    required,
    status,
    reason,
    command: [command, ...args].join(' '),
    exit_code: result.status,
    duration_ms: Date.now() - started,
    stdout: (result.stdout || '').slice(-4000),
    stderr: (result.stderr || '').slice(-4000),
  };
}

const checks = [
  ['skill-validation', 'bash', ['scripts/validate-skills.sh'], true],
  ['pack-validation', 'node', ['scripts/validate-packs.mjs'], true],
  ['router-regressions', 'python3', ['-m', 'unittest', 'bin/__tests__/skill_router_test.py', '-v'], true],
  ['route-health', 'node', ['bin/check-route-health.mjs'], true],
  ['portable-generation', 'node', ['bin/gen-codex-skills.mjs', '--check'], true],
  ['package-closure', 'node', ['bin/check-package-closure.mjs'], true],
  ['openspec', 'openspec', ['validate', '--all', '--strict'], false],
];

const passes = [];
let stopReason = 'pass-limit';
let cleanStreak = 0;
try {
  for (let pass = 1; pass <= maxPasses; pass += 1) {
    if (Date.now() >= deadline) {
      stopReason = 'time-budget';
      break;
    }
    const results = checks.map(([...spec]) => run(...spec));
    const requiredFailures = results.filter((item) => item.required && item.status !== 'PASS');
    const signature = createHash('sha256')
      .update(JSON.stringify(results.map(({ name, status, exit_code }) => ({ name, status, exit_code }))))
      .digest('hex');
    passes.push({ pass, at: new Date().toISOString(), checks: results, signature });
    cleanStreak = requiredFailures.length ? 0 : cleanStreak + 1;
    if (requiredFailures.length) {
      stopReason = 'required-check-failed';
      break;
    }
    if (cleanStreak >= 2) {
      stopReason = 'local-validation-converged';
      break;
    }
  }
} finally {
  rmSync(state, { recursive: true, force: true });
}

const requiredGreen = passes.length > 0 && passes.at(-1).checks
  .filter((item) => item.required)
  .every((item) => item.status === 'PASS');
const converged = stopReason === 'local-validation-converged' && requiredGreen;
const report = {
  schema_version: 2,
  run_id: runId,
  repository: 'https://github.com/heymegabyte/agent-skills.git',
  root,
  base_commit: git('rev-parse', 'HEAD'),
  branch: git('branch', '--show-current'),
  dirty_state_hash: createHash('sha256').update(git('status', '--porcelain=v1')).digest('hex'),
  budgets: { max_passes: maxPasses, max_minutes: maxMinutes },
  started_at: passes[0]?.at || new Date().toISOString(),
  finished_at: new Date().toISOString(),
  stop_reason: stopReason,
  converged,
  scope_note: 'Local deterministic validation convergence only; not universal quality convergence.',
  passes,
};
await mkdir(dirname(out), { recursive: true });
await writeFile(out, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ report: out, converged, passes: passes.length, stop_reason: stopReason }));
process.exitCode = converged ? 0 : 1;
