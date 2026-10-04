#!/usr/bin/env node
/**
 * collapse-forged-commands.mjs — inverse of forge-skill-from-openapi.mjs.
 *
 * Forged integration skills (skills/<name>/) ship one commands/<method-path>.md
 * page per API endpoint — thousands of files. Those pages are:
 *   - GENERATED (regenerable any time via bin/forge-skill-from-openapi.mjs),
 *   - UNROUTED (no _router.md / _packs/*.yml / plugin.json references them),
 *   - REDUNDANT with Context7 (live API docs), the typed client.ts, and (for
 *     several integrations) a live MCP server available at runtime.
 *
 * The endpoint INVENTORY already lives in each SKILL.md ("## Slash Commands").
 * This tool removes the redundant per-endpoint pages and drops a pointer in
 * SKILL.md, collapsing ~4,150 files -> ~8 with no realized product-value loss.
 *
 * Reversible: `git revert` the commit, or re-forge from the OpenAPI spec.
 * Idempotent: re-running skips already-collapsed skills (safe inside a loop).
 *
 * Usage: node bin/collapse-forged-commands.mjs [--dry]
 */
import {
  readdirSync, existsSync, statSync, readFileSync, writeFileSync, rmSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = join(ROOT, 'skills');
const DRY = process.argv.includes('--dry');
const SENTINEL = '<!-- commands-collapsed -->';

if (!existsSync(SKILLS)) {
  console.error(`no skills/ dir at ${SKILLS}`);
  process.exit(1);
}

let removedFiles = 0;
let touchedSkills = 0;
const report = [];

for (const name of readdirSync(SKILLS).sort()) {
  const dir = join(SKILLS, name);
  if (!statSync(dir).isDirectory()) continue;
  const cmds = join(dir, 'commands');
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(cmds) || !existsSync(skillMd)) continue;

  const count = readdirSync(cmds).filter((f) => f.endsWith('.md')).length;

  // 1. Idempotently insert a pointer into SKILL.md after its H1.
  let md = readFileSync(skillMd, 'utf8');
  if (!md.includes(SENTINEL)) {
    const note = [
      '',
      SENTINEL,
      `> **Per-endpoint pages collapsed.** The ${count} \`commands/*.md\` files (one per endpoint) were removed to cut file count — they were forge-generated, unrouted, and reproduce what Context7 (live API docs) and the typed \`client.ts\` already provide (some integrations also expose a live MCP server). The **Slash Commands** inventory below is retained.`,
      `> Restore full offline curl/param detail any time: \`node bin/forge-skill-from-openapi.mjs <spec-url> skills/${name} --name ${name}\`.`,
      '',
    ].join('\n');
    const lines = md.split('\n');
    const h1 = lines.findIndex((l) => /^#\s/.test(l));
    if (h1 >= 0) lines.splice(h1 + 1, 0, note);
    else lines.unshift(note);
    md = lines.join('\n');
    if (!DRY) writeFileSync(skillMd, md);
    touchedSkills += 1;
  }

  // 2. Remove the redundant commands/ directory.
  if (!DRY) rmSync(cmds, { recursive: true, force: true });
  removedFiles += count;
  report.push(`  ${name.padEnd(12)} -${count} pages`);
}

const tag = DRY ? '[dry-run] ' : '';
console.log(`${tag}collapse-forged-commands:`);
console.log(report.join('\n') || '  (nothing to collapse — already done)');
console.log(`${tag}SKILL.md pointers added: ${touchedSkills} | command pages removed: ${removedFiles}`);
