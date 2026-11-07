import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname;
const dir = mkdtempSync(join(tmpdir(), 'opencode-swarm-'));
const tasks = join(dir, 'tasks.json');
const log = join(dir, 'runs.ndjson');
const runner = join(dir, 'runner.sh');

writeFileSync(tasks, JSON.stringify([
  { id: 'tests', task: 'write parser tests', cwd: dir },
  { id: 'docs', task: 'update parser docs', cwd: dir },
  { id: 'audit', task: 'audit parser edge cases', cwd: dir },
]));
writeFileSync(runner, '#!/usr/bin/env bash\nprintf \'%s|%s|%s\\n\' "$OPENCODE_SWARM_TASK_ID" "$PWD" "$*" >> "$OPENCODE_SWARM_TEST_LOG"\n');
chmodSync(runner, 0o700);

const output = JSON.parse(execFileSync('node', [
  join(root, 'bin/opencode-swarm.mjs'), '--tasks', tasks, '--max-workers', '200',
  '--runner', runner, '--report', join(dir, 'report.json'),
], { encoding: 'utf8', env: { ...process.env, OPENCODE_SWARM_TEST_LOG: log } }));

assert.equal(output.total, 3);
assert.equal(output.succeeded, 3);
assert.equal(output.failed, 0);
assert.equal(output.worker_limit, 3);
assert.equal(readFileSync(log, 'utf8').trim().split('\n').length, 3);

const dryRun = JSON.parse(execFileSync('node', [
  join(root, 'bin/opencode-swarm.mjs'), '--tasks', tasks, '--dry-run', '--max-workers', '500',
], { encoding: 'utf8' }));
assert.equal(dryRun.worker_limit, 3);
assert.equal(dryRun.configured_max_workers, 200);
assert.equal(dryRun.transport, 'litellm/deepseek');

console.log('opencode-swarm tests passed');
