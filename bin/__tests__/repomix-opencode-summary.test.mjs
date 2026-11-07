import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../..', import.meta.url).pathname;
const temp = mkdtempSync(join(tmpdir(), 'repomix-summary-'));
const repo = join(temp, 'repo');
const bin = join(temp, 'bin');
mkdirSync(repo);
mkdirSync(bin);
execFileSync('git', ['init', '-q'], { cwd: repo });
writeFileSync(join(repo, 'index.ts'), 'export const answer = 42;\n');
execFileSync('git', ['add', '.'], { cwd: repo });
execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-qm', 'init'], { cwd: repo });

const packTool = join(bin, 'pack.sh');
writeFileSync(packTool, `#!/usr/bin/env bash
out=""
for arg in "$@"; do [[ "$arg" == --out=* ]] && out="\${arg#--out=}"; done
printf '<files><file path="index.ts">export const answer = 42;</file></files>' > "$out"
printf '{"pack":{"action":"generated","token_count":17,"out":"%s"},"summary":{"exit":0}}\n' "$out"
`);
chmodSync(packTool, 0o700);

const runner = join(bin, 'runner.sh');
const valid = {
  schema_version: '1.0.0', kind: 'repomix_context_summary', status: 'complete',
  task: 'analyze answer', executive_summary: 'The repository exports the number 42.',
  findings: [{ id: 'F-1', severity: 'info', title: 'Answer export', detail: 'index.ts exports answer.', evidence: [{ path: 'index.ts', line: 1 }] }],
  changes: [], risks: [], verification: [{ command: 'inspection', status: 'passed', detail: 'Source inspected.' }],
  next_actions: [], provenance: { repository: repo, revision: 'test-sha', repomix_tokens: 17, sources: ['index.ts'] },
  hydration: { estimated_input_tokens: 17, omitted: [], unavailable: [] },
  compatibility: { minimum_consumer_version: '1.0.0', producer: 'opencode-deepseek' },
  extensions: {},
};
writeFileSync(runner, `#!/usr/bin/env bash
printf '%s\n' '${JSON.stringify({ type: 'text', part: { type: 'text', text: JSON.stringify(valid) } })}'
`);
chmodSync(runner, 0o700);

const outputPath = join(temp, 'summary.json');
const stdout = execFileSync('node', [join(root, 'bin/repomix-opencode-summary.mjs'),
  '--task', 'analyze answer', '--repo', repo, '--out', outputPath,
  '--pack-tool', packTool, '--runner', runner, '--allow-local',
], { encoding: 'utf8' });
const result = JSON.parse(stdout);
assert.equal(result.schema_version, '1.0.0');
assert.equal(result.kind, 'repomix_context_summary');
assert.equal(result.findings[0].evidence[0].path, 'index.ts');
assert.deepEqual(JSON.parse(readFileSync(outputPath, 'utf8')), result);

const invalidRunner = join(bin, 'invalid-runner.sh');
const invalid = { ...valid, findings: [{ evidence: [{ path: 'index.ts' }] }] };
writeFileSync(invalidRunner, `#!/usr/bin/env bash
printf '%s\n' '${JSON.stringify({ type: 'text', part: { type: 'text', text: JSON.stringify(invalid) } })}'
`);
chmodSync(invalidRunner, 0o700);
assert.throws(() => execFileSync('node', [join(root, 'bin/repomix-opencode-summary.mjs'),
  '--task', 'invalid', '--repo', repo, '--out', join(temp, 'invalid.json'),
  '--pack-tool', packTool, '--runner', invalidRunner, '--allow-local',
], { stdio: 'pipe' }));

console.log('repomix-opencode-summary tests passed');
