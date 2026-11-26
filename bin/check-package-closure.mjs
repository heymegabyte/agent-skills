#!/usr/bin/env node
/** Verify that canonical skills and pack members are both present and publishable. */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = new Set(['package.json', 'README.md', 'LICENSE', 'CLAUDE.md']);

for (const path of ['.codex-plugin/plugin.json', '.opencode/config.json', '.kimi-plugin/plugin.json']) {
  required.add(path);
  const location = join(ROOT, path);
  if (!existsSync(location)) continue;
  const manifest = JSON.parse(readFileSync(location, 'utf8'));
  required.add(manifest.policy.source);
  for (const file of manifest.files ?? []) required.add(file);
  if (Array.isArray(manifest.instructions)) {
    for (const file of manifest.instructions) required.add(file);
  }
  const base = path === '.kimi-plugin/plugin.json' ? posix.dirname(path) : '.';
  for (const { path: file } of manifest.skills ?? []) {
    required.add(posix.normalize(posix.join(base, file)));
  }
}


for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^(?:\d\d-|openclaw-integration$)/.test(entry.name)) continue;
  const canonical = `${entry.name}/SKILL.md`;
  if (!existsSync(join(ROOT, canonical))) continue;
  const text = readFileSync(join(ROOT, canonical), 'utf8');
  const name = text.match(/^name:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1];
  if (!name) throw new Error(`Missing skill name in ${canonical}`);
  required.add(canonical);
  required.add(`.agents/skills/${entry.name}.md`);
  required.add(`.agents/skills/${name}/SKILL.md`);
  const submodules = text.match(/^submodules:\n((?:  - [^\n]+\n)+)/m)?.[1] ?? '';
  for (const [, file] of submodules.matchAll(/^  - ([^\s]+\.md)$/gm)) {
    required.add(`${entry.name}/${file}`);
  }
}
for (const pack of readdirSync(join(ROOT, '_packs')).filter((name) => name.endsWith('.yml'))) {
  const text = readFileSync(join(ROOT, '_packs', pack), 'utf8');
  for (const match of text.matchAll(/^  - (.+)$/gm)) {
    const member = match[1].trim();
    if (/^rules\//.test(member)) required.add(`${member}.md`);
    else if (/^\d\d-/.test(member)) required.add(`${member}/SKILL.md`);
    else {
      const candidates = [member, ...['.mjs', '.js', '.ts', '.py', '.sh'].map((extension) => `${member}${extension}`)];
      const existing = candidates.find((candidate) => existsSync(join(ROOT, candidate)));
      if (existing) required.add(existing);
    }
  }
}

const missing = [...required].filter((path) => !existsSync(join(ROOT, path)));
const [archive] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], {
  cwd: ROOT,
  encoding: 'utf8',
}));
const archivePaths = new Set(archive.files.map(({ path }) => path));
const excluded = [...required].filter((path) => !archivePaths.has(path));
if (missing.length || excluded.length) {
  console.error(JSON.stringify({ status: 'fail', missing, excluded }, null, 2));
  process.exit(1);
}
console.log(`✓ package closure: ${required.size} required files are present in the npm pack manifest`);
