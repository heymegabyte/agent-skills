#!/usr/bin/env node
/** Run independent throughput tasks through OpenCode -> LiteLLM -> rotating DeepSeek. */
import { spawn } from 'node:child_process';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const HARD_MAX_WORKERS = 200;
const { values } = parseArgs({ options: {
  tasks: { type: 'string' },
  'max-workers': { type: 'string' },
  runner: { type: 'string' },
  report: { type: 'string' },
  'dry-run': { type: 'boolean' },
}, strict: true });

function fail(message) {
  process.stderr.write(`opencode-swarm: ${message}\n`);
  process.exit(64);
}

if (!values.tasks) fail('--tasks <manifest.json> is required');
const manifestPath = resolve(values.tasks);
const parsed = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!Array.isArray(parsed) || parsed.length === 0) fail('task manifest must be a non-empty JSON array');

const seen = new Set();
const tasks = parsed.map((item, index) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) fail(`task ${index} must be an object`);
  if (typeof item.id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(item.id)) fail(`task ${index} has an invalid id`);
  if (seen.has(item.id)) fail(`duplicate task id: ${item.id}`);
  seen.add(item.id);
  if (typeof item.task !== 'string' || item.task.trim().length === 0) fail(`task ${item.id} has no task brief`);
  const cwd = typeof item.cwd === 'string' && item.cwd ? (isAbsolute(item.cwd) ? item.cwd : resolve(dirname(manifestPath), item.cwd)) : process.cwd();
  return { id: item.id, task: item.task.trim(), cwd };
});

const requested = Number(values['max-workers'] || process.env.OPENCODE_SWARM_MAX_WORKERS || HARD_MAX_WORKERS);
if (!Number.isInteger(requested) || requested < 1) fail('max workers must be a positive integer');
const configuredMax = Math.min(requested, HARD_MAX_WORKERS);
const workerLimit = Math.min(configuredMax, tasks.length);
const runner = resolve(values.runner || new URL('./opencode-task.sh', import.meta.url).pathname);
const startedAt = new Date().toISOString();

const summary = {
  transport: 'litellm/deepseek', configured_max_workers: configuredMax,
  worker_limit: workerLimit, total: tasks.length, succeeded: 0, failed: 0,
  started_at: startedAt, finished_at: null, results: [],
};

function runTask(task) {
  return new Promise((done) => {
    const child = spawn(runner, [task.task], {
      cwd: task.cwd,
      env: { ...process.env, OPENCODE_SWARM_TASK_ID: task.id, OPENCODE_DEEPSEEK_RAIL: 'litellm' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => done({ id: task.id, ok: false, exit_code: null, error: error.message }));
    child.on('close', (code, signal) => done({
      id: task.id, ok: code === 0, exit_code: code, signal: signal || null,
      stdout: stdout.slice(-8_192), stderr: stderr.slice(-8_192),
    }));
  });
}

if (!values['dry-run']) {
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++;
      summary.results[index] = await runTask(tasks[index]);
    }
  }
  await Promise.all(Array.from({ length: workerLimit }, () => worker()));
  summary.succeeded = summary.results.filter((result) => result.ok).length;
  summary.failed = summary.total - summary.succeeded;
}

summary.finished_at = new Date().toISOString();
if (values.report) {
  const reportPath = resolve(values.report);
  await mkdir(dirname(reportPath), { recursive: true });
  const temporary = `${reportPath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, reportPath);
}
process.stdout.write(`${JSON.stringify(summary)}\n`);
if (summary.failed > 0) process.exitCode = 1;
