#!/usr/bin/env node
/** Explicit Prompt Hydration entry wrapper for harnesses without native prompt interception. */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateMaintenanceAdmission } from './maintenance-recursion.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const supported = new Set(['claude', 'codex', 'gemini', 'opencode', 'paperclip', 'openclaw', 'coordinator', 'worker']);
const harnessIndex = process.argv.indexOf('--harness');
const harness = harnessIndex >= 0 ? process.argv[harnessIndex + 1] : '';
if (!supported.has(harness)) {
  process.stderr.write(`Prompt Hydration wrapper requires --harness ${[...supported].join('|')}\n`);
  process.exit(2);
}

let input;
try {
  const raw = await new Promise((resolve) => {
    let value = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { value += chunk; });
    process.stdin.on('end', () => resolve(value));
  });
  input = JSON.parse(raw || '{}');
} catch {
  process.stderr.write('Prompt Hydration wrapper rejected invalid JSON.\n');
  process.exit(1);
}

const prompt = typeof input.prompt === 'string' ? input.prompt : '';
const cwd = typeof input.cwd === 'string' ? input.cwd : process.cwd();
if (!prompt.trim()) {
  process.stderr.write('Prompt Hydration wrapper requires a non-empty prompt.\n');
  process.exit(1);
}

const maintenance = input.maintenance && typeof input.maintenance === 'object' ? input.maintenance : null;
const admission = evaluateMaintenanceAdmission(maintenance ?? {}, process.env.MAINTENANCE_TRIGGER_IDENTITY || '');
if (!admission.admitted && admission.reason === 'equivalent-trigger-covered') {
  process.stdout.write(`${JSON.stringify({
    schemaVersion: '1.0.0', harness, support: 'explicit-wrapper', nativePromptHook: false,
    status: 'suppressed-recursive-maintenance', maintenance: admission,
  })}\n`);
  process.exit(0);
}
if (!admission.admitted && admission.reason === 'recursion-depth-exceeded') {
  process.stderr.write('Prompt Hydration wrapper rejected excessive maintenance recursion depth.\n');
  process.exit(1);
}

try {
  const output = execFileSync(process.execPath, [
    '--experimental-strip-types', join(root, 'bin', 'prompt-hydrator.ts'),
    '--prompt-stdin', '--checkout', cwd, '--format', 'json',
  ], {
    input: prompt,
    encoding: 'utf8',
    timeout: 15_000,
    maxBuffer: 4_000_000,
    env: { ...process.env, NODE_NO_WARNINGS: '1', PROMPT_HYDRATION_ACTIVE: '1' },
  });
  const hydrated = JSON.parse(output);
  process.stdout.write(`${JSON.stringify({
    schemaVersion: '1.0.0', harness, support: 'explicit-wrapper', nativePromptHook: false,
    status: 'hydrated', stage: hydrated.stage, hydrationId: hydrated.hydrationId,
    route: hydrated.route, focusedPlan: hydrated.focusedPlan, coverageMatrix: hydrated.coverageMatrix,
    maintenance: admission.triggerId ? { ...admission, coveredIdentities: [...new Set([...admission.covered, admission.identity])] } : null,
  })}\n`);
} catch (error) {
  const reason = error instanceof Error ? error.message.slice(0, 300) : 'unknown failure';
  process.stderr.write(`Prompt Hydration wrapper failed closed: ${reason}\n`);
  process.exit(1);
}
