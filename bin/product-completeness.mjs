#!/usr/bin/env node
/**
 * product-completeness.mjs — §29 product-completeness metrics for a project.
 *
 * Scans a project directory for ACTUAL evidence (files/dirs present) and emits a
 * machine-readable JSON report. The governing rule (rules/product-completeness.md):
 * a feature is complete ONLY when requirement + implementation + tests + observed
 * behavior AGREE. This tool measures the first three from artifacts on disk and
 * reports observed-behavior as `unknown` unless a recorded run says otherwise —
 * it never fabricates a passing signal it cannot see.
 *
 * Evidence sources (each OPTIONAL — honest 0/unknown when absent):
 *   - OpenSpec `openspec/specs/<cap>/spec.md`  → required features (### Requirement:)
 *                                                 + required screens (#### Scenario:
 *                                                   / "screen"/"page"/"view" mentions)
 *   - OpenSpec `openspec/changes/<name>/tasks.md` → tasks defined/completed ([ ] / [x])
 *   - Implementation glob (components/routes/pages) → implemented feature surfaces
 *   - Golden paths: `golden-paths/`, `e2e/`, `tests/`, `*.spec.*`, `*.test.*`
 *                   → golden paths DEFINED (spec files) + a parallel impl check
 *   - Recorded runs: `*results*.json` / `*.last-run.json` with pass/fail counts
 *                    → golden paths PASSING + observed-behavior (else `unknown`)
 *   - Integrations: declared in spec/README vs wired in code (`integrations/`,
 *                   env keys, client imports) → integration completeness
 *
 * Node ESM, zero external deps.
 *
 * @example
 *   node bin/product-completeness.mjs <projectDir>          # pretty JSON (default)
 *   node bin/product-completeness.mjs <projectDir> --compact # single-line JSON
 *   node bin/product-completeness.mjs <projectDir> --ci      # exit 1 if gaps remain
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, basename, extname } from 'node:path';

// ── CLI args ─────────────────────────────────────────────────────────────────

const rawArgs = process.argv.slice(2);
const FLAGS = new Set(rawArgs.filter((a) => a.startsWith('--')));
const POSITIONAL = rawArgs.filter((a) => !a.startsWith('--'));
const COMPACT = FLAGS.has('--compact');
const CI = FLAGS.has('--ci');
const PROJECT_DIR = resolve(POSITIONAL[0] ?? process.cwd());

// Caps so a pathological tree cannot run unbounded / blow memory.
const MAX_WALK_DEPTH = 8;
const MAX_FILES = 25000;
const CODE_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.svelte', '.astro',
]);
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.turbo', '.cache',
  'coverage', '.wrangler', '.vercel', '.output', 'out', 'vendor', '__pycache__',
]);

// ── fs helpers ───────────────────────────────────────────────────────────────

/**
 * Read file bytes safely; returns empty string on any error.
 * @param {string} p - Absolute file path.
 * @returns {string}
 */
function safeRead(p) {
  try {
    return readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

/** @param {string} p @returns {boolean} */
function isDir(p) {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Recursively collect files under `dir`, honoring depth/count caps + skip-list.
 * @param {string} dir - Absolute start directory.
 * @param {(name: string) => boolean} [accept] - Keep a file when this returns true.
 * @returns {string[]} Absolute file paths.
 */
function walk(dir, accept = () => true) {
  const out = [];
  /** @param {string} d @param {number} depth */
  const recurse = (d, depth) => {
    if (depth > MAX_WALK_DEPTH || out.length >= MAX_FILES) return;
    let entries;
    try {
      entries = readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (out.length >= MAX_FILES) return;
      if (e.name.startsWith('.') && e.name !== '.gitkeep') {
        // Skip dotdirs (except we still allow explicit roots passed in) but let
        // dotfiles through so e.g. `.spec.ts` siblings are not lost.
        if (e.isDirectory()) continue;
      }
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        recurse(join(d, e.name), depth + 1);
      } else if (e.isFile() && accept(e.name)) {
        out.push(join(d, e.name));
      }
    }
  };
  if (isDir(dir)) recurse(dir, 0);
  return out;
}

/** @param {string} abs @returns {string} Path relative to PROJECT_DIR (posix-ish). */
function rel(abs) {
  return relative(PROJECT_DIR, abs) || basename(abs);
}

// ── OpenSpec: requirements + screens ─────────────────────────────────────────

/**
 * Parse OpenSpec spec.md files for required FEATURES (### Requirement: …) and
 * required SCREENS (#### Scenario: … plus explicit screen/page/view mentions).
 * Covers both the main specs tree and each change's delta specs.
 * @param {string} projectDir
 * @returns {{
 *   present: boolean,
 *   specFiles: string[],
 *   requiredFeatures: {name: string, source: string}[],
 *   requiredScreens: {name: string, source: string}[],
 * }}
 */
function scanOpenSpec(projectDir) {
  const specsRoot = join(projectDir, 'openspec', 'specs');
  const changesRoot = join(projectDir, 'openspec', 'changes');
  const specFiles = [];
  if (isDir(specsRoot)) specFiles.push(...walk(specsRoot, (n) => n === 'spec.md'));
  if (isDir(changesRoot)) specFiles.push(...walk(changesRoot, (n) => n === 'spec.md'));

  const requiredFeatures = [];
  const requiredScreens = [];
  const seenScreen = new Set();

  for (const file of specFiles) {
    const text = safeRead(file);
    const src = rel(file);
    for (const line of text.split('\n')) {
      // Features: OpenSpec requirement headers (### Requirement: Title).
      const reqMatch = line.match(/^#{2,4}\s*Requirement:\s*(.+?)\s*$/i);
      if (reqMatch) {
        requiredFeatures.push({ name: reqMatch[1].trim(), source: src });
        continue;
      }
      // Screens: scenario headers + prose naming a screen/page/view/route.
      const scenarioMatch = line.match(/^#{2,4}\s*Scenario:\s*(.+?)\s*$/i);
      if (scenarioMatch) {
        const name = scenarioMatch[1].trim();
        const key = `scenario:${name.toLowerCase()}`;
        if (!seenScreen.has(key)) {
          seenScreen.add(key);
          requiredScreens.push({ name, source: src });
        }
        continue;
      }
      const screenMatch = line.match(/\b([A-Z][\w /-]{2,40}?)\s+(screen|page|view)\b/);
      if (screenMatch) {
        const name = `${screenMatch[1].trim()} ${screenMatch[2].toLowerCase()}`;
        const key = name.toLowerCase();
        if (!seenScreen.has(key)) {
          seenScreen.add(key);
          requiredScreens.push({ name, source: src });
        }
      }
    }
  }
  return {
    present: specFiles.length > 0,
    specFiles: specFiles.map(rel),
    requiredFeatures,
    requiredScreens,
  };
}

/**
 * Parse OpenSpec `tasks.md` checkboxes across all changes.
 * @param {string} projectDir
 * @returns {{present: boolean, taskFiles: string[], defined: number, completed: number}}
 */
function scanTasks(projectDir) {
  const changesRoot = join(projectDir, 'openspec', 'changes');
  const taskFiles = isDir(changesRoot) ? walk(changesRoot, (n) => n === 'tasks.md') : [];
  let defined = 0;
  let completed = 0;
  for (const file of taskFiles) {
    for (const line of safeRead(file).split('\n')) {
      const m = line.match(/^\s*[-*]\s*\[( |x|X)\]/);
      if (!m) continue;
      defined += 1;
      if (m[1].toLowerCase() === 'x') completed += 1;
    }
  }
  return { present: taskFiles.length > 0, taskFiles: taskFiles.map(rel), defined, completed };
}

// ── Implementation surfaces (screens/features implemented) ───────────────────

/**
 * Collect implementation surfaces: component/route/page source files under the
 * conventional dirs. Each becomes one "implemented" surface for coverage ratios.
 * @param {string} projectDir
 * @returns {{present: boolean, dirs: string[], files: string[], names: Set<string>}}
 */
function scanImplementation(projectDir) {
  const roots = [
    'src/components', 'src/routes', 'src/pages', 'src/app', 'src/features',
    'app', 'components', 'routes', 'pages', 'packages',
  ]
    .map((r) => join(projectDir, r))
    .filter(isDir);
  const files = [];
  for (const r of roots) {
    files.push(...walk(r, (n) => CODE_EXT.has(extname(n)) && !/\.(spec|test)\./.test(n)));
  }
  const names = new Set();
  for (const f of files) {
    names.add(basename(f, extname(f)).toLowerCase().replace(/[^a-z0-9]/g, ''));
  }
  return {
    present: files.length > 0,
    dirs: roots.map(rel),
    files: files.map(rel),
    names,
  };
}

// ── Golden paths / tests (defined vs implemented vs passing) ─────────────────

/**
 * Discover golden-path / test spec files. "Defined" = spec files found; a parallel
 * heuristic marks each as having an implementation body (non-trivial, >1 assertion).
 * @param {string} projectDir
 * @returns {{present: boolean, dirs: string[], files: string[], defined: number, implemented: number}}
 */
function scanGoldenPaths(projectDir) {
  const roots = ['golden-paths', 'golden_paths', 'e2e', 'tests', 'test', '__tests__', 'spec']
    .map((r) => join(projectDir, r))
    .filter(isDir);
  const isSpec = (n) => /\.(spec|test)\.[cm]?[jt]sx?$/.test(n) || /\.(spec|test)\.py$/.test(n);
  const files = new Set();
  for (const r of roots) {
    for (const f of walk(r, (n) => isSpec(n) || CODE_EXT.has(extname(n)))) files.add(f);
  }
  // Also catch stray spec files living next to source anywhere in the tree.
  for (const f of walk(projectDir, isSpec)) files.add(f);

  const list = [...files];
  let implemented = 0;
  const assertRe = /\b(expect|assert|should|t\.(is|ok|deepEqual)|await\s+page\.)/g;
  for (const f of list) {
    const text = safeRead(f);
    const hits = (text.match(assertRe) || []).length;
    const hasBody = /\b(test|it|describe|scenario)\s*\(/.test(text) || hits > 0;
    // "Implemented" = a real body with ≥1 assertion/interaction, not an empty stub.
    if (hasBody && hits >= 1) implemented += 1;
  }
  return {
    present: list.length > 0,
    dirs: roots.map(rel),
    files: list.map(rel),
    defined: list.length,
    implemented,
  };
}

/**
 * Look for a RECORDED test run (JSON) that reports pass/fail counts. Only this
 * yields a "passing" number and the observed-behavior signal — absent it, both
 * stay `unknown` (we never infer green from the mere presence of specs).
 * @param {string} projectDir
 * @returns {{present: boolean, source: string|null, passed: number|null, failed: number|null, total: number|null}}
 */
function scanRecordedRuns(projectDir) {
  const candidates = walk(projectDir, (n) =>
    /(results|report|last-run|test-?results)\b.*\.json$/i.test(n) ||
    /\.last-run\.json$/i.test(n),
  ).slice(0, 50);

  for (const file of candidates) {
    let data;
    try {
      data = JSON.parse(safeRead(file));
    } catch {
      continue;
    }
    const counts = extractCounts(data);
    if (counts) return { present: true, source: rel(file), ...counts };
  }
  return { present: false, source: null, passed: null, failed: null, total: null };
}

/**
 * Pull {passed, failed, total} out of common run-report shapes (Playwright list
 * reporter `stats`, Vitest/Jest `numPassedTests`, or a flat {passed,failed}).
 * @param {any} data
 * @returns {{passed: number, failed: number, total: number}|null}
 */
function extractCounts(data) {
  if (!data || typeof data !== 'object') return null;
  const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

  // Playwright JSON reporter: { stats: { expected, unexpected, flaky, skipped } }
  if (data.stats && typeof data.stats === 'object') {
    const s = data.stats;
    const passed = num(s.expected) ?? num(s.passed);
    const failed = (num(s.unexpected) ?? 0) + (num(s.flaky) ?? 0);
    if (passed != null) return { passed, failed, total: passed + failed };
  }
  // Jest/Vitest: numPassedTests / numFailedTests / numTotalTests
  const jp = num(data.numPassedTests);
  const jf = num(data.numFailedTests);
  if (jp != null || jf != null) {
    const passed = jp ?? 0;
    const failed = jf ?? 0;
    return { passed, failed, total: num(data.numTotalTests) ?? passed + failed };
  }
  // Flat shape: { passed, failed } or { pass, fail }
  const fp = num(data.passed) ?? num(data.pass);
  const ff = num(data.failed) ?? num(data.fail);
  if (fp != null || ff != null) {
    const passed = fp ?? 0;
    const failed = ff ?? 0;
    return { passed, failed, total: num(data.total) ?? passed + failed };
  }
  return null;
}

// ── Integrations (declared vs wired) ─────────────────────────────────────────

/**
 * Compare integrations DECLARED (named in spec/README prose) against those WIRED
 * in code (a directory, a client import, or an env key). Honest zeros when neither
 * side is detectable.
 * @param {string} projectDir
 * @param {string[]} specFiles - Relative spec paths already discovered.
 * @returns {{declared: string[], wired: string[], present: boolean}}
 */
function scanIntegrations(projectDir, specFiles) {
  // A small, extensible catalog of integrations this estate commonly wires.
  const catalog = [
    'stripe', 'clerk', 'better-auth', 'betterauth', 'sentry', 'posthog', 'resend',
    'ses', 'd1', 'r2', 'kv', 'vectorize', 'workers ai', 'ai gateway', 'openai',
    'anthropic', 'deepseek', 'turnstile', 'cloudflare', 'drizzle', 'neon',
    'upstash', 'inngest', 'calendly', 'cal.com', 'twilio', 'github', 'google',
  ];
  const canon = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Declared: scan spec files + README/CLAUDE for catalog mentions.
  const declareText = [
    ...specFiles.map((f) => safeRead(join(projectDir, f))),
    safeRead(join(projectDir, 'README.md')),
    safeRead(join(projectDir, 'CLAUDE.md')),
  ]
    .join('\n')
    .toLowerCase();
  const declared = catalog.filter((name) => declareText.includes(name));

  // Wired: integrations/ dir names, package.json deps, env-example keys.
  const wiredSet = new Set();
  const intDir = join(projectDir, 'integrations');
  if (isDir(intDir)) {
    for (const n of readdirSync(intDir)) wiredSet.add(canon(n));
  }
  const pkg = safeRead(join(projectDir, 'package.json'));
  const envEx = [
    safeRead(join(projectDir, '.env.example')),
    safeRead(join(projectDir, '.dev.vars.example')),
  ].join('\n');
  const codeHay = `${pkg}\n${envEx}`.toLowerCase();
  const wired = catalog.filter(
    (name) => wiredSet.has(canon(name)) || codeHay.includes(canon(name)),
  );

  return {
    declared,
    wired,
    present: declared.length > 0 || wired.length > 0,
  };
}

// ── Scoring helpers ──────────────────────────────────────────────────────────

/**
 * Build a {count, ratio} coverage metric. `ratio` is null (not 0) when the
 * denominator is 0 — we distinguish "nothing required" from "0% done".
 * @param {number} numerator
 * @param {number} denominator
 * @returns {{implemented: number, required: number, ratio: number|null}}
 */
function coverage(numerator, denominator) {
  return {
    implemented: numerator,
    required: denominator,
    ratio: denominator > 0 ? round2(numerator / denominator) : null,
  };
}

/** @param {number} n @returns {number} */
function round2(n) {
  return Math.round(n * 100) / 100;
}

// ── Main ─────────────────────────────────────────────────────────────────────

/**
 * Assemble the full completeness report for a project directory.
 * @param {string} projectDir
 * @returns {object} JSON-serializable report.
 */
function buildReport(projectDir) {
  const generatedAt = new Date().toISOString();

  if (!isDir(projectDir)) {
    return {
      schema: 'product-completeness/1',
      generatedAt,
      project: projectDir,
      error: 'project directory not found',
      evidence: {},
      metrics: {},
      gaps: ['project directory not found'],
    };
  }

  const spec = scanOpenSpec(projectDir);
  const tasks = scanTasks(projectDir);
  const impl = scanImplementation(projectDir);
  const golden = scanGoldenPaths(projectDir);
  const runs = scanRecordedRuns(projectDir);
  const integ = scanIntegrations(projectDir, spec.specFiles);

  // Feature coverage: a required feature counts as "implemented" when a code
  // surface whose name token-overlaps the requirement exists. Honest heuristic.
  const featureImplemented = spec.requiredFeatures.filter((f) =>
    nameMatchesImpl(f.name, impl.names),
  ).length;

  // Screen coverage: same matching against implementation surfaces.
  const screenImplemented = spec.requiredScreens.filter((s) =>
    nameMatchesImpl(s.name, impl.names),
  ).length;

  // Golden-path passing: ONLY from a recorded run; else unknown.
  const goldenPassing =
    runs.present && runs.passed != null ? Math.min(runs.passed, golden.defined || runs.total || runs.passed) : null;

  const metrics = {
    features: {
      ...coverage(featureImplemented, spec.requiredFeatures.length),
      note: spec.present
        ? 'required = OpenSpec "### Requirement:" headers; implemented = matching code surface present'
        : 'no OpenSpec specs found — required features unmeasurable (0)',
    },
    screens: {
      ...coverage(screenImplemented, spec.requiredScreens.length),
      completed: screenImplemented,
      note: spec.present
        ? 'required = scenario/screen/page mentions in specs; completed = matching code surface present'
        : 'no OpenSpec specs found — required screens unmeasurable (0)',
    },
    goldenPaths: {
      defined: golden.defined,
      implemented: golden.implemented,
      passing: goldenPassing,
      passingSource: runs.source,
      note: runs.present
        ? 'passing from recorded run report'
        : 'no recorded run report found — passing is UNKNOWN (never inferred from spec presence)',
    },
    tasks: {
      defined: tasks.defined,
      completed: tasks.completed,
      ratio: tasks.defined > 0 ? round2(tasks.completed / tasks.defined) : null,
      note: tasks.present ? 'from OpenSpec changes/*/tasks.md checkboxes' : 'no tasks.md found',
    },
    integrations: {
      declared: integ.declared.length,
      wired: integ.wired.length,
      ...coverage(
        integ.declared.filter((d) => integ.wired.includes(d)).length,
        integ.declared.length,
      ),
      note: integ.present
        ? 'declared = named in spec/README; wired = deps/env/integrations-dir present'
        : 'no integrations declared or wired detected',
    },
  };

  const gaps = collectGaps({ spec, tasks, impl, golden, runs, integ, metrics });

  return {
    schema: 'product-completeness/1',
    generatedAt,
    project: projectDir,
    completenessRule:
      'a feature is complete only when requirement + implementation + tests + observed behavior agree',
    evidence: {
      openspec: {
        present: spec.present,
        specFiles: spec.specFiles,
        requiredFeatures: spec.requiredFeatures,
        requiredScreens: spec.requiredScreens,
      },
      tasks: { present: tasks.present, files: tasks.taskFiles },
      implementation: { present: impl.present, dirs: impl.dirs, fileCount: impl.files.length },
      goldenPaths: { present: golden.present, dirs: golden.dirs, fileCount: golden.files.length },
      recordedRuns: runs,
      integrations: { declared: integ.declared, wired: integ.wired },
    },
    metrics,
    gaps,
  };
}

/**
 * True when any token of a requirement/screen name (≥4 chars) matches an impl
 * surface name. Deliberately conservative — unmatched counts as a gap, not a pass.
 * @param {string} name
 * @param {Set<string>} implNames
 * @returns {boolean}
 */
function nameMatchesImpl(name, implNames) {
  if (implNames.size === 0) return false;
  const tokens = name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 4);
  if (tokens.length === 0) return false;
  for (const impl of implNames) {
    for (const t of tokens) {
      if (impl.includes(t)) return true;
    }
  }
  return false;
}

/**
 * Enumerate outstanding gaps as human-readable strings — honest about what is
 * unmeasurable vs genuinely incomplete.
 * @param {object} ctx
 * @returns {string[]}
 */
function collectGaps({ spec, tasks, impl, golden, runs, integ, metrics }) {
  const gaps = [];
  if (!spec.present) {
    gaps.push('No OpenSpec specs (openspec/specs/**/spec.md) — feature/screen requirements UNMEASURABLE.');
  } else {
    const f = metrics.features;
    if (f.required > 0 && f.implemented < f.required) {
      gaps.push(`Features: ${f.required - f.implemented}/${f.required} required features have no matching implementation surface.`);
    }
    const s = metrics.screens;
    if (s.required > 0 && s.implemented < s.required) {
      gaps.push(`Screens: ${s.required - s.implemented}/${s.required} required screens have no matching implementation surface.`);
    }
  }
  if (!impl.present) gaps.push('No implementation surfaces found (components/routes/pages) — nothing to verify against.');
  if (!golden.present) {
    gaps.push('No golden-path / test specs found — behavior is unverified.');
  } else if (golden.implemented < golden.defined) {
    gaps.push(`Golden paths: ${golden.defined - golden.implemented}/${golden.defined} spec files are stubs (no assertions).`);
  }
  if (!runs.present) {
    gaps.push('No recorded test-run report — observed behavior (passing) is UNKNOWN.');
  } else if (runs.failed != null && runs.failed > 0) {
    gaps.push(`Recorded run has ${runs.failed} failing test(s) — observed behavior disagrees with requirements.`);
  }
  if (tasks.present && tasks.defined > tasks.completed) {
    gaps.push(`Tasks: ${tasks.defined - tasks.completed}/${tasks.defined} OpenSpec tasks still open.`);
  }
  if (integ.present) {
    const unwired = integ.declared.filter((d) => !integ.wired.includes(d));
    if (unwired.length) gaps.push(`Integrations declared but not wired: ${unwired.join(', ')}.`);
  }
  return gaps;
}

// ── Emit ─────────────────────────────────────────────────────────────────────

const report = buildReport(PROJECT_DIR);
process.stdout.write(`${JSON.stringify(report, null, COMPACT ? 0 : 2)}\n`);

if (CI) {
  // Exit non-zero only on genuine incompleteness — NOT on "unmeasurable", which
  // is an honest state, not a failure. A measurable gap (open task, failing run,
  // required-but-unimplemented feature/screen, stub spec) trips CI.
  const m = report.metrics ?? {};
  const hardGap =
    (m.features?.required > 0 && m.features.implemented < m.features.required) ||
    (m.screens?.required > 0 && m.screens.implemented < m.screens.required) ||
    (m.tasks?.defined > 0 && m.tasks.completed < m.tasks.defined) ||
    (report.evidence?.recordedRuns?.failed > 0) ||
    (m.goldenPaths?.defined > 0 && m.goldenPaths.implemented < m.goldenPaths.defined);
  process.exit(hardGap ? 1 : 0);
}
