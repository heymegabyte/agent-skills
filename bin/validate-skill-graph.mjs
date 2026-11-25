#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function frontmatter(path) {
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---/);
  const block = match?.[1] || '';
  const result = {};
  let list;
  for (const line of block.split('\n')) {
    if (line.startsWith('  - ') && list) { result[list].push(line.slice(4).replace(/^['"]|['"]$/g, '')); continue; }
    const field = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!field) continue;
    const [, key, raw] = field;
    if (!raw) { result[key] = []; list = key; }
    else {
      const value = raw.replace(/^['"]|['"]$/g, '');
      if (raw.startsWith('[') && raw.endsWith(']')) {
        try { result[key] = JSON.parse(raw.replaceAll("'", '"')); }
        catch { result[key] = value; }
      } else result[key] = value;
      list = undefined;
    }
  }
  return result;
}

function discover() {
  const nodes = new Map();
  for (const entry of readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^\d\d-/.test(entry.name)) continue;
    const path = join(ROOT, entry.name, 'SKILL.md');
    if (existsSync(path)) nodes.set(entry.name, { id: entry.name, path, ...frontmatter(path) });
  }
  for (const name of readdirSync(join(ROOT, 'rules')).filter((item) => item.endsWith('.md'))) {
    const path = join(ROOT, 'rules', name);
    const id = `rules/${name.slice(0, -3)}`;
    nodes.set(id, { id, path, ...frontmatter(path) });
  }
  return nodes;
}

function packMembers(path) {
  return [...readFileSync(path, 'utf8').matchAll(/^  - (.+)$/gm)].map((match) => match[1].trim());
}

function memberExists(member) {
  if (nodes.has(member)) return true;
  return ['', '.mjs', '.js', '.ts', '.py', '.sh'].some((extension) => existsSync(join(ROOT, `${member}${extension}`)));
}

const nodes = discover();
const errors = [];
const warnings = [];
for (const node of nodes.values()) {
  for (const dependency of node.dependsOn || []) {
    if (!nodes.has(dependency)) errors.push({ code: 'missing-dependency', skill: node.id, dependency });
  }
  if (!node.description) warnings.push({ code: 'missing-description', skill: node.id });
}

const visiting = new Set();
const visited = new Set();
function visit(id, chain = []) {
  if (visiting.has(id)) { errors.push({ code: 'dependency-cycle', chain: [...chain, id] }); return; }
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dependency of nodes.get(id)?.dependsOn || []) visit(dependency, [...chain, id]);
  visiting.delete(id);
  visited.add(id);
}
for (const id of nodes.keys()) visit(id);

const packed = new Set();
for (const name of readdirSync(join(ROOT, '_packs')).filter((item) => item.endsWith('.yml'))) {
  for (const member of packMembers(join(ROOT, '_packs', name))) {
    packed.add(member);
    if (!memberExists(member)) errors.push({ code: 'unknown-pack-member', pack: name, member });
  }
}
for (const node of nodes.values()) {
  if (node.pack && node.pack !== 'none' && !packed.has(node.id)) errors.push({ code: 'orphan-skill', skill: node.id, declaredPack: node.pack });
}

const report = { status: errors.length ? 'fail' : 'pass', nodes: nodes.size, errors, warnings };
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const warningCounts = Object.fromEntries([...new Set(warnings.map((item) => item.code))].sort().map((code) => [code, warnings.filter((item) => item.code === code).length]));
  console.log(`${errors.length ? '✗' : '✓'} skill graph: ${nodes.size} nodes, ${errors.length} errors, ${warnings.length} warnings`);
  for (const item of errors) console.error(`  ${item.code}: ${JSON.stringify(item)}`);
  for (const [code, count] of Object.entries(warningCounts)) console.log(`  warning ${code}: ${count}`);
}
process.exitCode = errors.length ? 1 : 0;
