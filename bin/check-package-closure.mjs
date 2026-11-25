#!/usr/bin/env node
/** Verify that canonical skills and pack members are both present and publishable. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const patterns = pkg.files || [];

function patternRegex(pattern) {
  let source = '';
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === '*' && pattern[index + 1] === '*') { source += '.*'; index += 1; }
    else if (char === '*') source += '[^/]*';
    else if (char === '?') source += '[^/]';
    else source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${source}$`);
}

const matchers = patterns.map(patternRegex);
const publishable = (path) => matchers.some((matcher) => matcher.test(path));
const required = new Set(['package.json', 'README.md', 'LICENSE']);

for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
  if (entry.isDirectory() && /^\d\d-/.test(entry.name) && existsSync(join(ROOT, entry.name, 'SKILL.md'))) {
    required.add(`${entry.name}/SKILL.md`);
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
const excluded = [...required].filter((path) => !['package.json', 'README.md', 'LICENSE'].includes(path) && !publishable(path));
if (missing.length || excluded.length) {
  console.error(JSON.stringify({ status: 'fail', missing, excluded }, null, 2));
  process.exit(1);
}
console.log(`✓ package closure: ${required.size} required files exist and are covered by package.json files`);
