#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const canonicalDirs = readdirSync(root)
  .filter((name) => /^\d{2}-/.test(name) || name === 'terminal-development')
  .filter((name) => existsSync(join(root, name, 'SKILL.md')))
  .sort();

if (canonicalDirs.length !== 24) errors.push(`expected 24 canonical skills, found ${canonicalDirs.length}`);

const names = new Map();
for (const dir of canonicalDirs) {
  const source = readFileSync(join(root, dir, 'SKILL.md'), 'utf8');
  const name = source.match(/^name:\s*["']?([^"'\n]+)["']?$/m)?.[1]?.trim();
  const description = source.match(/^description:\s*["']?([^\n]+?)["']?$/m)?.[1]?.trim();
  if (!name) errors.push(`${dir}: missing name`);
  else if (names.has(name)) errors.push(`${dir}: duplicate name also used by ${names.get(name)}`);
  else names.set(name, dir);
  if (!description || description.length > 1024) errors.push(`${dir}: description must be 1-1024 characters`);
  const portable = join(root, '.agents', 'skills', name || '', 'SKILL.md');
  const ui = join(root, '.agents', 'skills', name || '', 'agents', 'openai.yaml');
  if (!existsSync(portable)) errors.push(`${dir}: missing generated Codex skill`);
  if (!existsSync(ui)) errors.push(`${dir}: missing generated Codex UI metadata`);
}

const agentGuide = readFileSync(join(root, 'AGENTS.md'), 'utf8');
if (Buffer.byteLength(agentGuide) > 12_000) errors.push('AGENTS.md exceeds the 12 KB repository-guidance budget');

const manifest = JSON.parse(readFileSync(join(root, '.codex-plugin', 'plugin.json'), 'utf8'));
if (manifest.skills !== './.agents/skills/') errors.push('Codex plugin must point to progressively disclosed skills');
if ('files' in manifest || 'instructions' in manifest) errors.push('Codex plugin must not always-load skill or rule files');

const forbidden = [
  /silence\s*=\s*approval/i,
  /supreme policy.*overrides all/i,
  /never cap effort/i,
  /mandatory deploy after every code change/i,
];
const tracked = execFileSync('git', ['ls-files', '-z'], { cwd: root })
  .toString('utf8').split('\0').filter(Boolean);
let scanned = 0;
for (const relative of tracked) {
  const path = join(root, relative);
  if (!existsSync(path) || !lstatSync(path).isFile()) continue;
  const bytes = readFileSync(path);
  if (bytes.includes(0)) continue;
  const text = bytes.toString('utf8');
  scanned += 1;
  if (relative.startsWith('docs/') || relative.startsWith('research/') || relative.includes('archive')) continue;
  for (const pattern of forbidden) {
    if (pattern.test(text)) errors.push(`${relative}: active instruction contains forbidden authority pattern ${pattern}`);
  }
}

if (errors.length) {
  console.error('Codex readiness failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`PASS Codex readiness (${canonicalDirs.length} skills, ${scanned} tracked text files scanned)`);
