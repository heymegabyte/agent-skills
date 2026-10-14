/// <reference types="node" />
/**
 * `kr` — the CLI for the keyword-research control plane.
 *
 * Commands:
 *   setup     Print a REAL provider status table + the exact auth URL for every
 *             missing / needs-consent provider. Never spends, never buys.
 *   health    Provider table + data-freshness + budget line. FREE endpoints only;
 *             a paid self-test is DESCRIBED, not performed.
 *   research  Plan + (eventually) execute a research run for a domain.
 *             `--dry-run` prints the plan with ZERO network calls.
 *
 * Doctrine honored here:
 *  - Args parsed with node:util `parseArgs` — NO new dependency.
 *  - `setup` / `health` are OFFLINE-safe: they make NO paid calls and NEVER print
 *    a secret value (presence is the only signal consumed, via detectProviders).
 *  - `research --dry-run` makes ZERO network calls (it never touches `fetch`).
 *  - Without creds, a real research run is BLOCKED with a clear message + the
 *    URL to unblock it, and exits non-zero. We NEVER fabricate results.
 *  - Every side-effecting dependency (stdout/stderr writer, secret probe, fetch,
 *    clock) is injectable so tests capture output and prove no network egress.
 */
import { parseArgs } from 'node:util';
import {
  defaultGetSecretValue,
  detectProviders,
  providerById,
  type GetSecretExists,
  type GetSecretValue,
  type ProviderStatus,
} from './providers';
import { runResearch as runPipeline, type ResearchProviders } from './pipeline';
import { buildDataForSeoProviders, buildCrawledInventory } from './cli-providers';
import { toCsv, toJsonReport, toMarkdownReport, type ReportContext } from './report';
import { emptyPageMap, loadPageMap, savePageMap, nodeFsIo } from './pagemap';

/* ------------------------------------------------------------------ */
/* Injectable environment.                                             */
/* ------------------------------------------------------------------ */

/** A line sink. Defaults wrap `console.log` / `console.error`. */
export type Writer = (line: string) => void;

/** Everything the CLI touches that isn't pure — all injectable for tests. */
export interface CliDeps {
  /** Normal output sink. */
  out: Writer;
  /** Error/diagnostic sink. */
  err: Writer;
  /** Presence-only secret probe, forwarded to detectProviders. */
  getSecretExists?: GetSecretExists;
  /**
   * Fetch impl. Present ONLY so (non-dry-run) network work is injectable.
   * Dry-run + setup + health NEVER call it. Tests pass a fetch that throws to
   * prove zero egress on the offline paths.
   */
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
  /** Injectable clock for deterministic timestamps. */
  now?: () => Date;
  /**
   * Secret VALUE reader — used ONLY on the live harvest path to read the
   * credentials the adapters need. Never called on setup/health/dry-run/blocked.
   * Defaults to the real `get-secret <KEY>` reader.
   */
  getSecretValue?: GetSecretValue;
  /** Injectable filesystem for writing reports + persisting the page map. */
  fs?: ResearchFs;
}

/** The filesystem surface the live `research` path writes through (injectable). */
export interface ResearchFs {
  readFile: (path: string, enc: 'utf8') => Promise<string>;
  writeFile: (path: string, data: string, enc: 'utf8') => Promise<void>;
  mkdir: (path: string, opts: { recursive: true }) => Promise<string | undefined>;
}

/** Build the default (real) dependency set. */
export function defaultDeps(): CliDeps {
  return {
    out: (line) => console.log(line),
    err: (line) => console.error(line),
    now: () => new Date(),
    getSecretValue: defaultGetSecretValue,
    // Lazy-load node:fs/promises only when the live path actually writes.
    fs: {
      async readFile(path, enc) {
        const { readFile } = await import('node:fs/promises');
        return readFile(path, enc);
      },
      async writeFile(path, data, enc) {
        const { writeFile } = await import('node:fs/promises');
        return writeFile(path, data, enc);
      },
      async mkdir(path, opts) {
        const { mkdir } = await import('node:fs/promises');
        return mkdir(path, opts);
      },
    },
  };
}

/* ------------------------------------------------------------------ */
/* Constants (budget, defaults, phases).                               */
/* ------------------------------------------------------------------ */

/** Hard monthly spend cap for the whole control plane. */
export const MONTHLY_BUDGET_USD = 20;

/** Default geography / language when the caller doesn't specify. */
export const DEFAULT_GEO = 'US';
export const DEFAULT_LANG = 'en';

/** Output formats `research` can emit. */
export const RESEARCH_FORMATS = ['json', 'md', 'csv'] as const;
export type ResearchFormat = (typeof RESEARCH_FORMATS)[number];

/** The research pipeline phases, in execution order (A, C, D, E, F, G). */
export interface Phase {
  id: string;
  title: string;
  /** Which providers this phase WOULD call (names only; informational). */
  providerCalls: string[];
  /** Rough estimated cost in USD for this phase on a typical domain. */
  estimatedCostUsd: number;
}

export const RESEARCH_PHASES: Phase[] = [
  {
    id: 'A',
    title: 'Understand — seed the domain, classify business + existing pages',
    providerCalls: [
      'DataForSEO keywords_for_site (what the domain already ranks for)',
      'Google Search Console searchAnalytics (first-party impressions/clicks)',
    ],
    estimatedCostUsd: 0.05,
  },
  {
    id: 'C',
    title: 'Expand — grow the seed set into candidate keywords',
    providerCalls: [
      'DataForSEO keyword_ideas',
      'DataForSEO keyword_suggestions',
      'DataForSEO related_keywords',
    ],
    estimatedCostUsd: 0.3,
  },
  {
    id: 'D',
    title: 'Enrich — attach demand, difficulty, CPC, and trend to each candidate',
    providerCalls: [
      'DataForSEO search_volume (batched ≤1000)',
      'DataForSEO bulk_keyword_difficulty (batched ≤1000)',
      'Google Trends / DataForSEO trends_explore (direction + seasonality)',
    ],
    estimatedCostUsd: 0.4,
  },
  {
    id: 'E',
    title: 'Compete — map the SERP + competitor coverage, gather citation evidence',
    providerCalls: [
      'DataForSEO serp/google/organic (per priority keyword)',
      'Exa search + contents (citation evidence only, never metrics)',
    ],
    estimatedCostUsd: 0.25,
  },
  {
    id: 'F',
    title: 'Cluster + Score — group by intent, run the deterministic 100-pt scorer',
    providerCalls: ['(local) scoreKeyword — pure, no network'],
    estimatedCostUsd: 0,
  },
  {
    id: 'G',
    title: 'Recommend — emit prioritized actions + evidence-backed content briefs',
    providerCalls: ['(local) ranking + brief assembly — no network'],
    estimatedCostUsd: 0,
  },
];

/** Sum of every phase's estimated cost (the baseline dry-run estimate). */
export function estimateRunCost(phases: readonly Phase[] = RESEARCH_PHASES): number {
  return phases.reduce((sum, p) => sum + p.estimatedCostUsd, 0);
}

/* ------------------------------------------------------------------ */
/* Presentation helpers.                                               */
/* ------------------------------------------------------------------ */

/** A short, aligned glyph per status for the table. */
function statusGlyph(kind: ProviderStatus['status']): string {
  switch (kind) {
    case 'present':
      return 'OK';
    case 'needs_consent':
      return 'CONSENT';
    case 'absent':
      return 'ABSENT';
  }
}

/** Pad a string to a fixed width (left-aligned) for table columns. */
function pad(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

/** Render the provider status table to `out`. Pure w.r.t. the injected probe. */
function renderProviderTable(out: Writer, statuses: readonly ProviderStatus[]): void {
  const labelW = Math.max(8, ...statuses.map((s) => s.label.length));
  const stateW = 7; // "CONSENT"
  out(`${pad('PROVIDER', labelW)}  ${pad('STATUS', stateW)}  DETAIL`);
  out(`${'-'.repeat(labelW)}  ${'-'.repeat(stateW)}  ${'-'.repeat(6)}`);
  for (const s of statuses) {
    out(`${pad(s.label, labelW)}  ${pad(statusGlyph(s.status), stateW)}  ${s.detail}`);
  }
}

/* ------------------------------------------------------------------ */
/* Commands.                                                           */
/* ------------------------------------------------------------------ */

/**
 * `setup` — print the real provider table and, for each provider that is not
 * `present`, the exact URL the user visits to finish wiring it. Never spends.
 */
export function runSetup(deps: CliDeps): number {
  const statuses = detectProviders({ getSecretExists: deps.getSecretExists });
  deps.out('keyword-research · setup');
  deps.out('');
  renderProviderTable(deps.out, statuses);

  const actionable = statuses.filter((s) => s.status !== 'present');
  deps.out('');
  if (actionable.length === 0) {
    deps.out('All providers are configured. Nothing to do.');
    return 0;
  }

  deps.out('Next steps (no purchase required):');
  for (const s of actionable) {
    const verb = s.status === 'needs_consent' ? 'Authorize' : 'Provision';
    deps.out(`  • ${s.label} — ${verb}: ${s.authUrl}`);
    if (s.missingKeys.length > 0) {
      deps.out(`      missing: ${s.missingKeys.join(', ')}`);
    }
  }
  return 0;
}

/**
 * `health` — provider table + data-freshness + budget. FREE endpoints only.
 * If DataForSEO creds were present we WOULD validate via the free
 * /v3/appendix/user_data endpoint; absent, we say so and skip (never fabricate).
 */
export function runHealth(deps: CliDeps): number {
  const statuses = detectProviders({ getSecretExists: deps.getSecretExists });
  deps.out('keyword-research · health');
  deps.out('');
  renderProviderTable(deps.out, statuses);

  // --- Data freshness (nothing cached yet in this phase) ---
  deps.out('');
  deps.out('Data freshness:');
  deps.out('  • No research runs cached yet — freshness: n/a (0 records).');

  // --- Credential self-test (FREE only; described, never charged) ---
  deps.out('');
  deps.out('Credential checks (free endpoints only):');
  const dfs = providerById(statuses, 'dataforseo');
  if (dfs && dfs.status === 'present' && dfs.freeValidationEndpoint) {
    // NOTE: even when present, we DESCRIBE the free check here rather than
    // perform egress inside `health`; health stays offline-safe by contract.
    deps.out(
      `  • DataForSEO: creds present — would validate via ${dfs.freeValidationEndpoint} (free).`,
    );
  } else if (dfs) {
    deps.out(
      `  • DataForSEO: creds absent — skipping ${dfs.freeValidationEndpoint ?? 'validation'} (would validate once provisioned; not fabricated).`,
    );
  }

  // --- Budget ---
  deps.out('');
  deps.out('Budget:');
  deps.out(
    `  • Monthly cap: $${MONTHLY_BUDGET_USD.toFixed(2)} · Spent this month: $0.00 · Remaining: $${MONTHLY_BUDGET_USD.toFixed(2)}.`,
  );
  return 0;
}

/** Parsed, validated options for a research run. */
export interface ResearchOptions {
  domain: string;
  dryRun: boolean;
  locale?: string;
  geo: string;
  lang: string;
  format: ResearchFormat;
  maxSpend?: number;
  /** Output directory; default ./research/<domain>/<timestamp>/. */
  out?: string;
}

/**
 * `research` — plan (and, in a later phase, execute) a run for one domain.
 *
 * `--dry-run` prints the plan, the provider calls each phase WOULD make, and an
 * estimated cost, making ZERO network calls (this function never touches
 * `deps.fetchImpl` on the dry-run path).
 *
 * Without `--dry-run`, a real run requires DataForSEO; when it's absent we print
 * a BLOCKED message (+ the provisioning URL) and return non-zero. We never
 * fabricate results.
 */
export function runResearch(deps: CliDeps, opts: ResearchOptions): number | Promise<number> {
  const statuses = detectProviders({ getSecretExists: deps.getSecretExists });
  const dfs = providerById(statuses, 'dataforseo');

  if (opts.dryRun) {
    const estimate = estimateRunCost();
    const cap = opts.maxSpend ?? MONTHLY_BUDGET_USD;
    deps.out('keyword-research · research (DRY RUN — no network calls)');
    deps.out('');
    deps.out(
      `Domain: ${opts.domain} · geo: ${opts.geo} · lang: ${opts.lang}${
        opts.locale ? ` · locale: ${opts.locale}` : ''
      } · format: ${opts.format}`,
    );
    deps.out('');
    deps.out('Planned phases:');
    for (const p of RESEARCH_PHASES) {
      deps.out(`  [${p.id}] ${p.title}`);
      for (const call of p.providerCalls) {
        deps.out(`        - ${call}`);
      }
      deps.out(`        ~ est. $${p.estimatedCostUsd.toFixed(2)}`);
    }
    deps.out('');
    deps.out(`Estimated total cost: ~$${estimate.toFixed(2)} (spend cap: $${cap.toFixed(2)}).`);
    deps.out('');
    // Honestly report which providers would actually be reachable.
    const available = statuses.filter((s) => s.status === 'present').map((s) => s.label);
    const blocked = statuses
      .filter((s) => s.status !== 'present')
      .map((s) => `${s.label} (${s.status})`);
    deps.out(`Providers ready: ${available.length ? available.join(', ') : 'none'}.`);
    if (blocked.length) {
      deps.out(`Providers NOT ready: ${blocked.join(', ')}.`);
    }
    deps.out('Dry run complete — zero network calls made, nothing spent.');
    return 0;
  }

  // --- Real run gating: DataForSEO is mandatory. ---
  if (!dfs || dfs.status !== 'present') {
    deps.err('keyword-research · research — BLOCKED');
    deps.err('');
    deps.err(
      'Cannot start a real research run: DataForSEO API credentials are required ' +
        '(DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD).',
    );
    deps.err(`Provision them here: ${dfs?.authUrl ?? 'https://app.dataforseo.com/api-access'}`);
    deps.err('Then re-run, or use `research --domain=<d> --dry-run` to plan offline.');
    deps.err('No results were fabricated.');
    return 2;
  }

  // Creds ARE present and this is NOT a dry run → execute the live pipeline.
  return executeResearch(deps, opts);
}

/* ------------------------------------------------------------------ */
/* Live execution (async). Reads cred VALUES, builds adapters, runs the */
/* pipeline, writes JSON+MD+CSV, persists the page map, prints a summary.*/
/* ------------------------------------------------------------------ */

/** Default output root: ./research/<domain>/<timestamp>/ (timestamp is clock-injected). */
export function defaultOutDir(domain: string, at: Date): string {
  const ts = at.toISOString().replace(/[:.]/g, '-');
  const safeDomain = domain.replace(/[^a-z0-9.-]+/gi, '_');
  return `research/${safeDomain}/${ts}`;
}

/**
 * The live run. Separated from the sync gating so the sync paths (dry-run,
 * blocked, errors) keep returning a plain number and the existing synchronous
 * tests are untouched. Returns a process exit code.
 */
export async function executeResearch(deps: CliDeps, opts: ResearchOptions): Promise<number> {
  const getSecretValue = deps.getSecretValue ?? defaultGetSecretValue;
  const fetchImpl = deps.fetchImpl ?? ((input: string, init?: RequestInit) => fetch(input, init));
  const fs = deps.fs;
  const now = deps.now ?? (() => new Date());

  // Read the credential VALUES (only here, never logged).
  const login = getSecretValue('DATAFORSEO_LOGIN');
  const password = getSecretValue('DATAFORSEO_PASSWORD');
  if (!login || !password) {
    // Presence said yes but the value read failed — fail honestly, never fake.
    deps.err('keyword-research · research — BLOCKED');
    deps.err('DataForSEO credentials could not be read at runtime. No results were fabricated.');
    return 2;
  }
  const exaApiKey = getSecretValue('EXA_API_KEY');

  if (!fs) {
    deps.err('keyword-research · research — cannot write output (no filesystem available).');
    return 4;
  }

  const providers: ResearchProviders = buildDataForSeoProviders(
    { dataForSeo: { login, password }, exaApiKey },
    fetchImpl,
    { location_name: opts.geo, language_code: opts.lang },
  );

  // Load (or start) the persistent keyword→page map.
  const io = nodeFsIo(fs);
  const mapPath = `research/${opts.domain.replace(/[^a-z0-9.-]+/gi, '_')}/keyword-page-map.json`;
  const { map: pageMap, warning } = await loadPageMap(io, mapPath);

  deps.out('keyword-research · research (LIVE)');
  deps.out(`Domain: ${opts.domain} · geo: ${opts.geo} · lang: ${opts.lang}`);
  if (warning) deps.out(`Note: ${warning}`);

  // Build the REAL page inventory by crawling the site (no credentials). This is
  // total: a crawl failure degrades to an empty inventory + a limitation note, so
  // existing-page matching stays HONEST (every keyword a content gap) and the run
  // never aborts. The crawl reuses the SAME injected `fetchImpl`, so the mocked-
  // transport tests stay hermetic (zero real network).
  const origin = /^https?:\/\//i.test(opts.domain) ? opts.domain : `https://${opts.domain}`;
  const { inventory: pageInventory, limitations: crawlLimitations } = await buildCrawledInventory(
    fetchImpl,
    origin,
  );
  deps.out(`Site inventory: ${pageInventory.length} page(s) crawled from ${origin}.`);

  // Run the pipeline against the crawled inventory.
  const result = await runPipeline({
    providers,
    project: {
      domain: opts.domain,
      locale: opts.locale ?? `${opts.lang}-${opts.geo}`,
      geography: opts.geo,
      language: opts.lang,
    },
    pageInventory,
    pageMap: pageMap ?? emptyPageMap(),
    budget: { maxSpendUsd: opts.maxSpend ?? MONTHLY_BUDGET_USD },
    now,
  });

  // Fold crawl limitations into the run's limitations so the report + summary
  // carry them (the crawl runs before the pipeline, so they're prepended).
  result.limitations.unshift(...crawlLimitations);

  // Build the three report formats.
  const ctx: ReportContext = {
    domain: opts.domain,
    locale: opts.locale ?? `${opts.lang}-${opts.geo}`,
    geography: opts.geo,
    language: opts.lang,
    budgetUsd: opts.maxSpend ?? MONTHLY_BUDGET_USD,
    generatedAt: now().toISOString(),
  };
  const json = toJsonReport(result, ctx);
  const md = toMarkdownReport(result, ctx);
  const csv = toCsv(result.opportunities);

  // Write everything under --out (default ./research/<domain>/<timestamp>/).
  const outDir = opts.out ?? defaultOutDir(opts.domain, now());
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(`${outDir}/report.json`, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
  await fs.writeFile(`${outDir}/report.md`, md, 'utf8');
  await fs.writeFile(`${outDir}/opportunities.csv`, `${csv}\n`, 'utf8');

  // Persist the updated keyword→page map.
  await savePageMap(io, mapPath, result.keywordPageMap);

  // Print a concise summary.
  deps.out('');
  deps.out(`Opportunities: ${result.opportunities.length} · Clusters: ${result.clusters.length}`);
  deps.out(
    `Spent: $${result.costActual.toFixed(2)} of $${(opts.maxSpend ?? MONTHLY_BUDGET_USD).toFixed(2)} cap.`,
  );
  if (result.limitations.length > 0) {
    deps.out(`Limitations (${result.limitations.length}):`);
    for (const lim of result.limitations) deps.out(`  • ${lim}`);
  }
  deps.out(`Reports written to ${outDir}/ (report.json, report.md, opportunities.csv).`);
  deps.out(`Keyword→page map persisted to ${mapPath}.`);
  return 0;
}

/* ------------------------------------------------------------------ */
/* Usage.                                                              */
/* ------------------------------------------------------------------ */

export const USAGE = `keyword-research — the CLI for the keyword-research control plane

USAGE
  kr <command> [options]

COMMANDS
  setup                 Show real provider status + the exact auth URL for each
                        missing / needs-consent provider. Never spends.
  health                Provider status + data freshness + budget. Free checks only.
  research --domain=<d> Plan or run keyword research for a domain.
  --help, -h            Show this help.

RESEARCH OPTIONS
  --domain=<d>          (required) The domain to research, e.g. projectsites.dev
  --dry-run             Print the plan + estimated cost. Makes ZERO network calls.
  --locale=<l>          Optional BCP-47 locale, e.g. en-US.
  --geo=<g>             Geography (default: ${DEFAULT_GEO}), e.g. US, GB, 90210.
  --lang=<l>            Language (default: ${DEFAULT_LANG}), ISO 639-1, e.g. en.
  --format=<f>          Output format: ${RESEARCH_FORMATS.join(' | ')} (default: json).
  --max-spend=<n>       Spend cap in USD for this run (default: monthly cap $${MONTHLY_BUDGET_USD}).
  --out=<dir>           Output directory (default: ./research/<domain>/<timestamp>/).

NOTES
  • setup and health are OFFLINE-safe: no paid calls, secret VALUES never printed.
  • A real research run requires DataForSEO credentials; absent, it is BLOCKED
    (exit ≠ 0) and never fabricates results. Use --dry-run to plan offline.`;

/** Print usage to `out`. */
export function printUsage(deps: CliDeps): void {
  deps.out(USAGE);
}

/* ------------------------------------------------------------------ */
/* Argument parsing + dispatch.                                        */
/* ------------------------------------------------------------------ */

/** Thrown for a bad argument so `run` can map it to exit code 1 + usage. */
export class CliUsageError extends Error {}

/** Coerce + validate the `--format` flag. */
function parseFormat(raw: string | undefined): ResearchFormat {
  if (raw === undefined) return 'json';
  if ((RESEARCH_FORMATS as readonly string[]).includes(raw)) {
    return raw as ResearchFormat;
  }
  throw new CliUsageError(
    `invalid --format '${raw}' (expected one of: ${RESEARCH_FORMATS.join(', ')})`,
  );
}

/** Coerce + validate the numeric `--max-spend` flag. */
function parseMaxSpend(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    throw new CliUsageError(`invalid --max-spend '${raw}' (expected a non-negative number)`);
  }
  return n;
}

/**
 * Parse the `research` sub-flags out of an argv slice (everything AFTER the
 * `research` command token). Centralized so it's unit-testable and `strict`
 * parseArgs surfaces unknown flags as errors.
 */
export function parseResearchArgs(argv: string[]): ResearchOptions {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      options: {
        domain: { type: 'string' },
        'dry-run': { type: 'boolean', default: false },
        locale: { type: 'string' },
        geo: { type: 'string' },
        lang: { type: 'string' },
        format: { type: 'string' },
        'max-spend': { type: 'string' },
        out: { type: 'string' },
      },
      allowPositionals: false,
      strict: true,
    });
  } catch (e) {
    // parseArgs throws a TypeError on unknown flags / bad shapes.
    throw new CliUsageError((e as Error).message);
  }

  const { values } = parsed;
  const domain = values.domain;
  if (!domain || domain.trim() === '') {
    throw new CliUsageError('research requires --domain=<d> (e.g. --domain=projectsites.dev)');
  }

  return {
    domain: domain.trim(),
    dryRun: Boolean(values['dry-run']),
    locale: values.locale,
    geo: values.geo ?? DEFAULT_GEO,
    lang: values.lang ?? DEFAULT_LANG,
    format: parseFormat(values.format),
    maxSpend: parseMaxSpend(values['max-spend']),
    out: values.out,
  };
}

/**
 * Parse argv and run the selected command. Returns a process exit code (or a
 * Promise of one for the live `research` run). `argv` is the slice AFTER
 * `node script.js` (i.e. `process.argv.slice(2)`).
 *
 * The OFFLINE paths (setup, health, dry-run, blocked, help, errors) return a
 * plain `number` synchronously — so the existing synchronous tests are untouched.
 * Only a live harvest returns a `Promise<number>`.
 */
export function run(argv: string[], deps: CliDeps = defaultDeps()): number | Promise<number> {
  const [command, ...rest] = argv;

  // No command, or an explicit help request → usage (exit 0).
  if (command === undefined || command === '--help' || command === '-h' || command === 'help') {
    printUsage(deps);
    return 0;
  }

  try {
    switch (command) {
      case 'setup':
        return runSetup(deps);
      case 'health':
        return runHealth(deps);
      case 'research': {
        // A help flag anywhere in the research args → usage, exit 0.
        if (rest.includes('--help') || rest.includes('-h')) {
          printUsage(deps);
          return 0;
        }
        const opts = parseResearchArgs(rest);
        return runResearch(deps, opts);
      }
      default:
        deps.err(`Unknown command: ${command}`);
        deps.err('');
        printUsage(deps);
        return 1;
    }
  } catch (e) {
    if (e instanceof CliUsageError) {
      deps.err(`Error: ${e.message}`);
      deps.err('');
      printUsage(deps);
      return 1;
    }
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* Entrypoint — only runs when invoked directly, never on import.      */
/* ------------------------------------------------------------------ */

/**
 * Detect "am I the entry module?" without top-level await or import.meta.main
 * (not yet stable across runtimes). Compare the resolved argv[1] to this file.
 */
function isMain(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  // import.meta.url is a file:// URL; strip the scheme for a path compare.
  const self = new URL(import.meta.url).pathname;
  return entry === self || entry.endsWith('/cli.ts') || entry.endsWith('/cli.js');
}

if (isMain()) {
  // `run` may return a Promise on the live research path; await it either way.
  Promise.resolve(run(process.argv.slice(2)))
    .then((code) => process.exit(code))
    .catch((err: unknown) => {
      console.error(err instanceof Error ? err.stack ?? err.message : String(err));
      process.exit(1);
    });
}
