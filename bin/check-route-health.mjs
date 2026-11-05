#!/usr/bin/env node
/** Offline router integration health check against the current checkout. */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROUTER = join(ROOT, 'bin', 'skill-router.py');
const temp = mkdtempSync(join(tmpdir(), 'agent-skills-route-health-'));
const env = {
  ...process.env,
  EMDASH_SKILLS_ROOT: ROOT,
  EMDASH_ROUTER_DATA_DIR: join(temp, 'data'),
  EMDASH_ROUTER_PROJECTS_DIR: join(temp, 'projects'),
  // Offline deterministic route health must not read secrets or attempt embedding calls.
  EMDASH_DISABLE_EMBEDDINGS: '1',
};

function run(args) {
  const result = spawnSync('python3', [ROUTER, ...args], {
    cwd: ROOT,
    env,
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`router ${args[0]} failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

const cases = [
  {
    name: 'website build',
    prompt: 'build a website for acme dental in newark nj',
    required: ['rules/website-build-manifest', '02-goal-and-brief', '16-cinematic-website-prime-directive'],
    website: true,
  },
  {
    name: 'placeholder trigger',
    prompt: 'optimize example.com',
    required: ['15-site-generation'],
    website: true,
  },
  {
    name: 'unrelated simple task abstains from website profile',
    prompt: 'explain this integer addition',
    forbidden: ['rules/website-build-manifest', '16-cinematic-website-prime-directive'],
    website: false,
  },
];

let failures = 0;
try {
  run(['sync-metadata']);
  for (const item of cases) {
    const data = JSON.parse(run(['route', item.prompt, '--cwd', temp]));
    const selected = new Set((data.selected || []).map((entry) => entry.id));
    const missing = (item.required || []).filter((id) => !selected.has(id));
    const forbidden = (item.forbidden || []).filter((id) => selected.has(id));
    const websiteMismatch = Boolean(data.fingerprint?.is_website_build) !== item.website;
    const budgetBroken = data.status === 'unsatisfied-budget';
    if (missing.length || forbidden.length || websiteMismatch || budgetBroken) {
      failures += 1;
      console.error(`FAIL ${item.name}`);
      if (missing.length) console.error(`  missing: ${missing.join(', ')}`);
      if (forbidden.length) console.error(`  forbidden: ${forbidden.join(', ')}`);
      if (websiteMismatch) console.error(`  website intent: ${data.fingerprint?.is_website_build}`);
      if (budgetBroken) console.error(`  unsatisfied required: ${data.unsatisfied_required.join(', ')}`);
    } else {
      console.log(`PASS ${item.name}`);
    }
  }
} catch (error) {
  failures += 1;
  console.error(`FAIL router execution: ${error instanceof Error ? error.message : String(error)}`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}

if (failures) process.exit(1);
console.log(`PASS route-health (${cases.length} offline cases, checkout router, temporary state)`);
