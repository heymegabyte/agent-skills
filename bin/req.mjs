#!/usr/bin/env node
/**
 * req.mjs — Requirement Ledger CLI (the Knowledge + Requirement Graph foundation).
 *
 * Operates on a PER-PROJECT append-friendly JSONL ledger at
 * `.pcc/ledger/requirements.jsonl` in whatever project it's run against (created
 * on first `add`). The TOOL is generic + lives in agent-skills; the DATA is
 * per-project. JSONL, not SQLite — one record per line, read-all/mutate/rewrite
 * (the ledger is small) so it stays diff-friendly, append-friendly, zero-dep.
 *
 * Record schema (one JSON object per line):
 *   { id, title, description, priority(must|should|could|wont),
 *     status(open|in-progress|blocked|closed), acceptance[] (strings),
 *     tests[] (paths), routes[] (strings), golden_paths[] (ids),
 *     decisions[] (ids), evidence[] (strings),
 *     provenance{intent,source}, created, updated }
 *
 * IDs are stable + monotonic: R-001, R-002, … (never reused, even after close).
 *
 * The coverage graph (upgrade spec §64 seed): each requirement carries the
 * forward edges to the artifacts that satisfy it — `tests[]`, `golden_paths[]`,
 * `routes[]`, `decisions[]`. A Golden-Path Grower binds a path to a requirement
 * with `req update R-NNN --link-golden-path <id>`; a test binds with
 * `--link-test <path>`. `req coverage` walks those edges to find the holes.
 *
 * Usage:
 *   req add --title "…" --priority must [--description "…"] [--acceptance "…" …]
 *           [--source "…"] [--intent "…"]
 *   req list [--status …] [--priority …] [--json]
 *   req show R-NNN [--json]
 *   req update R-NNN [--status …] [--title …] [--description …]
 *                    [--link-test <path>] [--link-golden-path <id>]
 *                    [--link-route <str>] [--link-decision <id>]
 *                    [--add-acceptance "…"] [--add-evidence "…"]
 *   req close R-NNN [--force]
 *   req coverage [--json]
 *
 * Exit codes: 0 ok · 1 usage/not-found/refused · 2 coverage gate failed
 * (a `must` requirement lacks BOTH a test and a golden-path).
 *
 * Styled output degrades to plain text when stdout is not a TTY (CI/pipes).
 * No `gum` dependency — the repo's bin/*.mjs use plain console + emoji; mirror that.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// ── presentation (TTY-aware; plain fallback matches repo convention) ──
const TTY = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (TTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = (s) => c('1', s);
const dim = (s) => c('2', s);
const cyan = (s) => c('36', s);
const green = (s) => c('32', s);
const yellow = (s) => c('33', s);
const red = (s) => c('31', s);

const PRIORITIES = ['must', 'should', 'could', 'wont'];
const STATUSES = ['open', 'in-progress', 'blocked', 'closed'];

const LEDGER_DIR = join(process.cwd(), '.pcc', 'ledger');
const LEDGER_PATH = join(LEDGER_DIR, 'requirements.jsonl');

// ── ledger I/O (read-all / mutate / rewrite — JSONL is small) ──
function readLedger() {
  if (!existsSync(LEDGER_PATH)) return [];
  const raw = readFileSync(LEDGER_PATH, 'utf8');
  const out = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      throw new Error(`corrupt ledger line (not valid JSON): ${t.slice(0, 80)}`);
    }
  }
  return out;
}

function writeLedger(records) {
  mkdirSync(LEDGER_DIR, { recursive: true });
  // one compact JSON object per line, trailing newline — append-friendly + stable.
  const body = records.map((r) => JSON.stringify(r)).join('\n');
  writeFileSync(LEDGER_PATH, records.length ? body + '\n' : '');
}

function appendRecord(record) {
  // true append when the file exists + is well-formed; else full rewrite via readLedger.
  const records = readLedger();
  records.push(record);
  writeLedger(records);
}

function nextId(records) {
  let max = 0;
  for (const r of records) {
    const m = /^R-(\d+)$/.exec(r.id || '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `R-${String(max + 1).padStart(3, '0')}`;
}

function normalizeId(raw) {
  if (!raw) return null;
  const s = String(raw).toUpperCase();
  const m = /^R-?(\d+)$/.exec(s);
  if (!m) return null;
  return `R-${String(Number(m[1])).padStart(3, '0')}`;
}

function findById(records, id) {
  const norm = normalizeId(id);
  return records.find((r) => r.id === norm) || null;
}

// ── arg parsing (supports repeated flags → arrays) ──
function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[key] = true; // boolean flag
      } else {
        // repeated → array; else scalar
        if (key in flags) {
          flags[key] = Array.isArray(flags[key]) ? [...flags[key], next] : [flags[key], next];
        } else {
          flags[key] = next;
        }
        i++;
      }
    } else {
      positional.push(a);
    }
  }
  return { flags, positional };
}

function asArray(v) {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function fail(msg, code = 1) {
  console.error(`${red('✗')} ${msg}`);
  process.exit(code);
}

function nowIso() {
  return new Date().toISOString();
}

// ── record factory (full schema, every field present) ──
function newRecord(id, { title, description, priority, acceptance, source, intent }) {
  const ts = nowIso();
  return {
    id,
    title,
    description: description || '',
    priority,
    status: 'open',
    acceptance: asArray(acceptance),
    tests: [],
    routes: [],
    golden_paths: [],
    decisions: [],
    evidence: [],
    provenance: { intent: intent || '', source: source || '' },
    created: ts,
    updated: ts,
  };
}

// ── coverage analysis (the §57 closure gate + §64 coverage-graph seed) ──
function analyzeCoverage(records) {
  const open = records.filter((r) => r.status !== 'closed');
  const noTest = open.filter((r) => (r.tests || []).length === 0);
  const noGolden = open.filter((r) => (r.golden_paths || []).length === 0);
  const noAcceptance = open.filter((r) => (r.acceptance || []).length === 0);
  const mustOpen = records.filter((r) => r.priority === 'must' && r.status === 'open');
  // the HARD gate: a `must` requirement with NO test AND NO golden-path is uncovered.
  const mustUncovered = records.filter(
    (r) =>
      r.priority === 'must' &&
      r.status !== 'closed' &&
      (r.tests || []).length === 0 &&
      (r.golden_paths || []).length === 0
  );
  return {
    total: records.length,
    open: open.length,
    closed: records.length - open.length,
    noTest,
    noGolden,
    noAcceptance,
    mustOpen,
    mustUncovered,
  };
}

// ── rendering ──
function statusColor(s) {
  if (s === 'closed') return green(s);
  if (s === 'blocked') return red(s);
  if (s === 'in-progress') return yellow(s);
  return dim(s);
}

function renderRow(r) {
  const idc = cyan(r.id.padEnd(6));
  const pri = r.priority.padEnd(6);
  const st = r.status.padEnd(11);
  const cov = `${(r.tests || []).length}t/${(r.golden_paths || []).length}g`;
  const title = r.title.length > 52 ? r.title.slice(0, 51) + '…' : r.title;
  return `  ${idc} ${pri} ${statusColor(st)} ${dim(cov.padEnd(8))} ${title}`;
}

// ── commands ──
function cmdAdd(flags) {
  const title = flags.title;
  if (!title || title === true) fail('`add` requires --title "…"');
  const priority = flags.priority || 'should';
  if (!PRIORITIES.includes(priority)) fail(`--priority must be one of: ${PRIORITIES.join(' | ')}`);
  const records = readLedger();
  const id = nextId(records);
  const record = newRecord(id, {
    title: String(title),
    description: flags.description && flags.description !== true ? String(flags.description) : '',
    priority,
    acceptance: asArray(flags.acceptance).filter((a) => a !== true),
    source: flags.source && flags.source !== true ? String(flags.source) : '',
    intent: flags.intent && flags.intent !== true ? String(flags.intent) : '',
  });
  appendRecord(record);
  console.log(`${green('✓')} added ${cyan(id)} ${bold(record.title)} ${dim(`[${priority}]`)}`);
  console.log(dim(`  ledger: ${LEDGER_PATH}`));
}

function cmdList(flags) {
  let records = readLedger();
  if (flags.status && flags.status !== true) records = records.filter((r) => r.status === flags.status);
  if (flags.priority && flags.priority !== true) records = records.filter((r) => r.priority === flags.priority);
  if (flags.json) {
    console.log(JSON.stringify(records, null, 2));
    return;
  }
  if (!records.length) {
    console.log(dim('no requirements match.'));
    return;
  }
  console.log(bold(`  ${'ID'.padEnd(6)} ${'PRI'.padEnd(6)} ${'STATUS'.padEnd(11)} ${'COV'.padEnd(8)} TITLE`));
  for (const r of records) console.log(renderRow(r));
  console.log(dim(`\n  ${records.length} requirement(s).`));
}

function cmdShow(positional, flags) {
  const records = readLedger();
  const r = findById(records, positional[0]);
  if (!r) fail(`no such requirement: ${positional[0] || '(missing id)'}`);
  if (flags.json) {
    console.log(JSON.stringify(r, null, 2));
    return;
  }
  console.log(`${cyan(bold(r.id))}  ${bold(r.title)}`);
  console.log(`  priority : ${r.priority}`);
  console.log(`  status   : ${statusColor(r.status)}`);
  if (r.description) console.log(`  desc     : ${r.description}`);
  const list = (label, arr) =>
    console.log(`  ${label.padEnd(9)}: ${arr && arr.length ? arr.join(', ') : dim('(none)')}`);
  list('accept', r.acceptance);
  list('tests', r.tests);
  list('routes', r.routes);
  list('golden', r.golden_paths);
  list('decisions', r.decisions);
  list('evidence', r.evidence);
  console.log(
    `  provenance: intent=${r.provenance?.intent || dim('—')} source=${r.provenance?.source || dim('—')}`
  );
  console.log(dim(`  created ${r.created} · updated ${r.updated}`));
}

function cmdUpdate(positional, flags) {
  const records = readLedger();
  const r = findById(records, positional[0]);
  if (!r) fail(`no such requirement: ${positional[0] || '(missing id)'}`);
  const changes = [];

  if (flags.status && flags.status !== true) {
    if (!STATUSES.includes(flags.status)) fail(`--status must be one of: ${STATUSES.join(' | ')}`);
    r.status = flags.status;
    changes.push(`status=${flags.status}`);
  }
  if (flags.title && flags.title !== true) {
    r.title = String(flags.title);
    changes.push('title');
  }
  if (flags.description && flags.description !== true) {
    r.description = String(flags.description);
    changes.push('description');
  }
  if (flags.priority && flags.priority !== true) {
    if (!PRIORITIES.includes(flags.priority)) fail(`--priority must be one of: ${PRIORITIES.join(' | ')}`);
    r.priority = flags.priority;
    changes.push(`priority=${flags.priority}`);
  }

  // link edges (de-duplicated) — these are the §64 coverage-graph edges.
  const addEdge = (field, raw, label) => {
    for (const v of asArray(raw).filter((x) => x !== true)) {
      if (!r[field].includes(v)) {
        r[field].push(v);
        changes.push(`${label}+${v}`);
      }
    }
  };
  addEdge('tests', flags['link-test'], 'test');
  addEdge('golden_paths', flags['link-golden-path'], 'golden');
  addEdge('routes', flags['link-route'], 'route');
  addEdge('decisions', flags['link-decision'], 'decision');
  addEdge('acceptance', flags['add-acceptance'], 'accept');
  addEdge('evidence', flags['add-evidence'], 'evidence');

  if (!changes.length) fail('nothing to update — pass --status / --link-test / --add-acceptance / etc.');

  r.updated = nowIso();
  writeLedger(records);
  console.log(`${green('✓')} updated ${cyan(r.id)}: ${changes.join(', ')}`);
}

function cmdClose(positional, flags) {
  const records = readLedger();
  const r = findById(records, positional[0]);
  if (!r) fail(`no such requirement: ${positional[0] || '(missing id)'}`);
  const force = flags.force === true;
  const hasAcceptance = (r.acceptance || []).length > 0;
  const hasCoverage = (r.tests || []).length > 0 || (r.golden_paths || []).length > 0;

  if (!force) {
    if (!hasAcceptance) {
      fail(
        `refusing to close ${r.id}: zero acceptance criteria.\n` +
          `  add one: req update ${r.id} --add-acceptance "…"  (or re-run close with --force)`
      );
    }
    if (!hasCoverage) {
      fail(
        `refusing to close ${r.id}: zero tests AND zero golden-paths (nothing proves it).\n` +
          `  bind proof: req update ${r.id} --link-test <path>  |  --link-golden-path <id>  (or --force)`
      );
    }
  }

  r.status = 'closed';
  r.updated = nowIso();
  writeLedger(records);
  const note = force && !(hasAcceptance && hasCoverage) ? dim(' (forced — unproven)') : '';
  console.log(`${green('✓')} closed ${cyan(r.id)}${note}`);
}

function cmdCoverage(flags) {
  const records = readLedger();
  const a = analyzeCoverage(records);
  const gatePass = a.mustUncovered.length === 0;

  if (flags.json) {
    console.log(
      JSON.stringify(
        {
          total: a.total,
          open: a.open,
          closed: a.closed,
          counts: {
            no_test: a.noTest.length,
            no_golden_path: a.noGolden.length,
            no_acceptance: a.noAcceptance.length,
            must_open: a.mustOpen.length,
            must_uncovered: a.mustUncovered.length,
          },
          no_test: a.noTest.map((r) => r.id),
          no_golden_path: a.noGolden.map((r) => r.id),
          no_acceptance: a.noAcceptance.map((r) => r.id),
          must_open: a.mustOpen.map((r) => r.id),
          must_uncovered: a.mustUncovered.map((r) => r.id),
          gate: gatePass ? 'pass' : 'fail',
          exit: gatePass ? 0 : 2,
        },
        null,
        2
      )
    );
    process.exit(gatePass ? 0 : 2);
  }

  console.log(bold('Requirement coverage'));
  console.log(
    `  total ${a.total} · ${green(`${a.closed} closed`)} · ${a.open} open` +
      ` · ${a.mustOpen.length} must-open`
  );
  const section = (label, arr, colorFn) => {
    if (!arr.length) {
      console.log(`  ${green('✓')} ${label}: none`);
      return;
    }
    console.log(`  ${colorFn('•')} ${label} (${arr.length}): ${arr.map((r) => r.id).join(', ')}`);
  };
  section('no test', a.noTest, yellow);
  section('no golden-path', a.noGolden, yellow);
  section('no acceptance criteria', a.noAcceptance, yellow);
  section('must-priority still open', a.mustOpen, yellow);

  console.log('');
  if (gatePass) {
    console.log(`  ${green('✓ GATE PASS')} — every \`must\` requirement has a test or a golden-path.`);
    process.exit(0);
  } else {
    console.log(
      `  ${red('✗ GATE FAIL')} — ${a.mustUncovered.length} \`must\` requirement(s) with ` +
        `NO test AND NO golden-path: ${red(a.mustUncovered.map((r) => r.id).join(', '))}`
    );
    process.exit(2);
  }
}

function usage() {
  console.log(`${bold('req')} — Requirement Ledger CLI  ${dim('(.pcc/ledger/requirements.jsonl)')}

${bold('Commands')}
  ${cyan('add')}       --title "…" [--priority must|should|could|wont] [--description "…"]
            [--acceptance "…" …] [--source "…"] [--intent "…"]
  ${cyan('list')}      [--status …] [--priority …] [--json]
  ${cyan('show')}      R-NNN [--json]
  ${cyan('update')}    R-NNN [--status …] [--title …] [--description …]
            [--link-test <path>] [--link-golden-path <id>] [--link-route <str>]
            [--link-decision <id>] [--add-acceptance "…"] [--add-evidence "…"]
  ${cyan('close')}     R-NNN [--force]   ${dim('(refuses w/o acceptance OR w/o test+golden-path)')}
  ${cyan('coverage')}  [--json]          ${dim('(closure gate; exit 2 if a must lacks test+golden-path)')}

Ledger lives per-project at ${dim('.pcc/ledger/requirements.jsonl')} (created on first add).`);
}

// ── dispatch ──
function main() {
  const [, , cmd, ...rest] = process.argv;
  const { flags, positional } = parseArgs(rest);
  try {
    switch (cmd) {
      case 'add':
        return cmdAdd(flags);
      case 'list':
      case 'ls':
        return cmdList(flags);
      case 'show':
        return cmdShow(positional, flags);
      case 'update':
        return cmdUpdate(positional, flags);
      case 'close':
        return cmdClose(positional, flags);
      case 'coverage':
      case 'cov':
        return cmdCoverage(flags);
      case 'help':
      case '--help':
      case '-h':
      case undefined:
        return usage();
      default:
        fail(`unknown command: ${cmd}\n  run \`req help\` for usage.`);
    }
  } catch (e) {
    fail(e.message);
  }
}

main();
