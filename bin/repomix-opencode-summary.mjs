#!/usr/bin/env node
/** Compile a Repomix repository pack into a compact, validated parent-safe JSON summary. */
import { spawnSync } from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const root = resolve(new URL('..', import.meta.url).pathname);
const { values } = parseArgs({ options: {
  task: { type: 'string' }, repo: { type: 'string' }, out: { type: 'string' },
  include: { type: 'string' },
  'max-tokens': { type: 'string' }, 'max-summary-bytes': { type: 'string' },
  'pack-tool': { type: 'string' }, runner: { type: 'string' }, model: { type: 'string' },
  'allow-local': { type: 'boolean' }, 'allow-npx': { type: 'boolean' },
}, strict: true });

function die(message, code = 1) {
  process.stderr.write(`repomix-opencode-summary: ${message}\n`);
  process.exit(code);
}

if (!values.task?.trim()) die('--task is required', 64);
const repo = resolve(values.repo || process.cwd());
const output = resolve(values.out || join(repo, '.agent', 'context-summary.json'));
const maxTokens = Number(values['max-tokens'] || 900_000);
const maxSummaryBytes = Number(values['max-summary-bytes'] || 65_536);
if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 900_000) die('--max-tokens must be 1..900000', 64);
if (!Number.isInteger(maxSummaryBytes) || maxSummaryBytes < 1) die('--max-summary-bytes must be positive', 64);

const packTool = resolve(values['pack-tool'] || join(root, 'bin', 'repomix-pack.sh'));
const runner = resolve(values.runner || join(root, 'bin', 'opencode-deepseek.sh'));
const schemaPath = join(root, 'schemas', 'repomix-context-summary.v1.schema.json');
const schema = JSON.parse(await readFile(schemaPath, 'utf8'));
const validateAgainstSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const temporaryDir = await import('node:fs/promises').then(({ mkdtemp }) => mkdtemp(join(tmpdir(), 'repomix-context-')));
const packPath = join(temporaryDir, 'repository.xml');

try {
  const packArgs = [`--repo=${repo}`, `--out=${packPath}`, `--max-tokens=${maxTokens}`, '--json', '--force'];
  if (values.include) packArgs.push(`--include=${values.include}`);
  if (values['allow-local']) packArgs.push('--allow-local');
  if (values['allow-npx']) packArgs.push('--allow-npx');
  const packed = spawnSync(packTool, packArgs, { encoding: 'utf8', env: process.env, maxBuffer: 4 * 1024 * 1024 });
  if (packed.status !== 0) die(`Repomix pack failed: ${packed.stderr.trim() || packed.stdout.trim()}`);
  let packReceipt;
  try { packReceipt = JSON.parse(packed.stdout.trim()); } catch { die('Repomix pack did not return its JSON receipt'); }

  const prompt = JSON.stringify({
    task: values.task.trim(), schema: 'repomix-context-summary.v1',
    instructions: [
      'Analyze the attached Repomix repository pack deeply. Do not echo source or the pack.',
      'Return exactly one JSON object conforming to the attached JSON Schema; no Markdown or commentary.',
      'Cite findings with repository-relative paths and line/symbol references instead of copied code.',
      'Keep the executive summary decision-dense and the complete JSON below the parent-safe size ceiling.',
      'Set schema_version to 1.0.0, kind to repomix_context_summary, and preserve additive v1 compatibility.',
    ],
    parent_safe_max_bytes: maxSummaryBytes,
    pack_receipt: { token_count: packReceipt.pack?.token_count ?? 0 },
  });
  const runArgs = values.runner
    ? [packPath, schemaPath, prompt]
    : ['run', prompt, '--pure', '--format', 'json', '-m', values.model || 'litellm/deepseek-v4-pro', '-f', packPath, '-f', schemaPath];
  const analyzed = spawnSync(runner, runArgs, { cwd: repo, encoding: 'utf8', env: process.env, maxBuffer: 128 * 1024 * 1024 });
  if (analyzed.status !== 0) die(`OpenCode analysis failed: ${analyzed.stderr.trim()}`);
  const text = analyzed.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
    try { const event = JSON.parse(line); return event?.type === 'text' && event?.part?.type === 'text' ? event.part.text : ''; }
    catch { return ''; }
  }).join('').trim();
  let summary;
  try { summary = JSON.parse(text); } catch { die('OpenCode did not return a parseable JSON summary'); }
  validateSummary(summary);
  if (!validateAgainstSchema(summary)) {
    const errors = validateAgainstSchema.errors?.slice(0, 8).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
    die(`summary failed JSON Schema validation: ${errors || 'unknown validation error'}`);
  }
  const serialized = `${JSON.stringify(summary, null, 2)}\n`;
  if (Buffer.byteLength(serialized) > maxSummaryBytes) die(`summary exceeds ${maxSummaryBytes} bytes`);
  await mkdir(dirname(output), { recursive: true });
  const temporaryOutput = `${output}.${process.pid}.tmp`;
  await writeFile(temporaryOutput, serialized, { mode: 0o600 });
  await rename(temporaryOutput, output);
  process.stdout.write(serialized);
} finally {
  await rm(temporaryDir, { recursive: true, force: true });
}

function validateSummary(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) die('summary must be an object');
  const requiredStrings = ['schema_version', 'kind', 'status', 'task', 'executive_summary'];
  for (const key of requiredStrings) if (typeof value[key] !== 'string' || value[key].length === 0) die(`summary.${key} is required`);
  if (!/^1\.\d+\.\d+$/.test(value.schema_version)) die(`unsupported schema_version: ${value.schema_version}`);
  if (value.kind !== 'repomix_context_summary') die('summary.kind is invalid');
  if (!['complete', 'partial', 'blocked', 'failed'].includes(value.status)) die('summary.status is invalid');
  for (const key of ['findings', 'changes', 'risks', 'verification', 'next_actions']) if (!Array.isArray(value[key])) die(`summary.${key} must be an array`);
  for (const key of ['provenance', 'hydration', 'compatibility', 'extensions']) if (!value[key] || typeof value[key] !== 'object' || Array.isArray(value[key])) die(`summary.${key} must be an object`);
  if (!/^1\.\d+\.\d+$/.test(value.compatibility.minimum_consumer_version || '')) die('compatibility.minimum_consumer_version must be v1 semver');
  if (typeof value.compatibility.producer !== 'string') die('compatibility.producer is required');
  if (!Number.isInteger(value.provenance.repomix_tokens) || !Array.isArray(value.provenance.sources)) die('provenance is invalid');
  if (!Number.isInteger(value.hydration.estimated_input_tokens) || !Array.isArray(value.hydration.omitted) || !Array.isArray(value.hydration.unavailable)) die('hydration is invalid');
  for (const finding of value.findings) {
    if (!finding || typeof finding !== 'object' || !Array.isArray(finding.evidence)) die('finding evidence is required');
    for (const evidence of finding.evidence) if (!evidence || typeof evidence.path !== 'string') die('evidence.path is required');
  }
}
