#!/usr/bin/env node
/** Build the npm artifact without lifecycle scripts and verify required source families. */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const temp = mkdtempSync(join(tmpdir(), 'agent-skills-pack-'));
const required = [
  'package/01-operating-system/SKILL.md',
  'package/15-site-generation/SKILL.md',
  'package/16-cinematic-website-prime-directive/SKILL.md',
  'package/21-app-foundation/SKILL.md',
  'package/28-cf-integrations-reference/SKILL.md',
  'package/terminal-development/SKILL.md',
  'package/rules/agent-provider-policy.md',
  'package/_packs/core.yml',
  'package/_kernel/standards.md',
  'package/control-plane/README.md',
  'package/requirements-router.txt',
];

try {
  const raw = execFileSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: join(temp, 'npm-cache') },
  });
  const report = JSON.parse(raw)[0];
  const paths = new Set(report.files.map((entry) => `package/${entry.path}`));
  const missing = required.filter((path) => !paths.has(path));
  if (missing.length) {
    console.error(`FAIL package closure: ${missing.length} required artifact path(s) missing`);
    for (const path of missing) console.error(`  - ${path}`);
    process.exitCode = 1;
  } else {
    console.log(
      `PASS package closure (${report.entryCount} files, ${report.unpackedSize} unpacked bytes, ${required.length} required paths)`,
    );
  }
} catch (error) {
  console.error(`FAIL package closure: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  rmSync(temp, { recursive: true, force: true });
}
