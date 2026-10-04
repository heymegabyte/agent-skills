#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// sync-run-the-loop.mjs — propagate the SHARED run-the-loop machinery from the
// master (claude-skills plugin: run-the-loop/_shared) into each project's
// .claude/run-the-loop/. Project files (BACKLOG, LEDGER, DISCOVERIES, PROFILE,
// state, logs, leases) are NEVER touched. Dry-run by default.
//
//   node scripts/sync-run-the-loop.mjs                        # dry-run, ALL repos under root
//   node scripts/sync-run-the-loop.mjs --apply                # apply to all repos
//   node scripts/sync-run-the-loop.mjs --repo <path>          # one repo (dry-run)
//   node scripts/sync-run-the-loop.mjs --repo <path> --apply
//   node scripts/sync-run-the-loop.mjs --init <path> --apply  # create+seed a NEW repo's loop
//   --root <dir>   repo root to scan for the all-repos sweep (default ~/emdash/repositories)
//
// Global update workflow: edit a file in run-the-loop/_shared/ → commit → run this
// (dry-run to review the diff, then --apply). Human report → stderr; JSON → stdout.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url)); // claude-bootstrap/scripts
const ROOT = join(HERE, '..');                        // claude-bootstrap
const RTL = join(ROOT, 'run-the-loop');
const manifest = JSON.parse(readFileSync(join(RTL, 'manifest.json'), 'utf8'));
const expandHome = (p) => (p && p.startsWith('~') ? join(homedir(), p.slice(1)) : p);
const hash = (p) => (existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12) : null);
const log = (...a) => console.error(...a);
const masterSha = () => { try { return execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch { return 'unknown'; } };

function parseArgs() {
  const a = process.argv.slice(2);
  const o = { apply: false, all: false };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--apply') o.apply = true;
    else if (a[i] === '--all') o.all = true;
    else if (a[i] === '--repo') o.repo = expandHome(a[++i]);
    else if (a[i] === '--init') o.init = expandHome(a[++i]);
    else if (a[i] === '--root') o.root = expandHome(a[++i]);
  }
  return o;
}

function discoverRepos(root) {
  const out = [];
  let entries = [];
  try { entries = readdirSync(root); } catch { return out; }
  for (const n of entries) {
    const p = join(root, n);
    try { if (!statSync(p).isDirectory()) continue; } catch { continue; }
    if (existsSync(join(p, '.claude', 'run-the-loop'))) out.push(p);
  }
  return out;
}

function syncRepo(repo, { apply, init }) {
  const tgt = join(repo, manifest.targetDir);
  const res = { repo, created: false, shared: [], templates: [], project: [] };
  if (!existsSync(tgt)) {
    if (!init) { res.skipped = 'no .claude/run-the-loop/ (use --init to create)'; return res; }
    if (apply) mkdirSync(tgt, { recursive: true });
    res.created = true;
  }
  // SHARED — force master → repo (ADD new, UPDATE drifted, SAME = already current)
  for (const f of manifest.shared) {
    const m = join(RTL, manifest.sharedDir, f), t = join(tgt, f);
    const mh = hash(m); if (!mh) continue;
    const th = hash(t);
    const state = th === null ? 'ADD' : mh === th ? 'SAME' : 'UPDATE';
    if (state !== 'SAME' && apply) copyFileSync(m, t);
    res.shared.push({ f, state });
  }
  // TEMPLATES — seed ONLY if absent (then project-owned)
  for (const f of manifest.templates) {
    const m = join(RTL, manifest.templatesDir, f), t = join(tgt, f);
    if (!existsSync(m)) continue;
    if (existsSync(t)) { res.templates.push({ f, state: 'KEEP' }); continue; }
    if (apply) copyFileSync(m, t);
    res.templates.push({ f, state: 'SEED' });
  }
  // PROJECT — never touched; just report which are present/missing
  for (const f of manifest.projectOwned) res.project.push({ f, present: existsSync(join(tgt, f)) });

  if (apply) {
    writeFileSync(join(tgt, '_SYNCED.json'), JSON.stringify({
      syncedFrom: 'claude-skills/run-the-loop/_shared',
      masterSha: masterSha(),
      shared: manifest.shared,
      note: 'Do NOT hand-edit the shared files in this repo — edit the master in the claude-skills plugin (~/.claude/plugins/heymegabyte-agent-skills/run-the-loop/_shared) + re-run bin/sync-run-the-loop.mjs.',
    }, null, 2) + '\n');
  }
  return res;
}

function main() {
  const o = parseArgs();
  const root = o.root || join(homedir(), 'emdash', 'repositories');
  const repos = o.init ? [o.init] : o.repo ? [o.repo] : discoverRepos(root);
  if (!repos.length) { log('No target repos found. Use --repo <path> or --init <path>.'); process.exit(1); }
  const results = repos.map((r) => syncRepo(r, o));
  for (const r of results) {
    if (r.skipped) { log(`• ${r.repo} — skipped (${r.skipped})`); continue; }
    const upd = r.shared.filter((s) => s.state !== 'SAME').length;
    log(`• ${r.repo}${r.created ? ' (created)' : ''}`);
    log(`   shared: ${r.shared.map((s) => s.state[0] + ':' + s.f).join('  ') || 'none'}  ${upd ? `(${upd} ${o.apply ? 'synced' : 'to sync'})` : '(all current)'}`);
    if (r.templates.length) log(`   templates: ${r.templates.map((s) => s.state[0] + ':' + s.f).join('  ')}`);
    const miss = r.project.filter((p) => !p.present).map((p) => p.f);
    if (miss.length) log(`   project files MISSING (create per-repo): ${miss.join(', ')}`);
  }
  log(o.apply ? '\n✓ applied — shared machinery synced; project files untouched.' : '\n(dry-run — re-run with --apply to write)');
  process.stdout.write(JSON.stringify({ mode: o.apply ? 'apply' : 'dry-run', masterSha: masterSha(), results }, null, 2) + '\n');
}
main();
