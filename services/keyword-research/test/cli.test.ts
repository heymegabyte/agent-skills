import { describe, expect, it } from 'vitest';
import {
  MONTHLY_BUDGET_USD,
  RESEARCH_PHASES,
  estimateRunCost,
  parseResearchArgs,
  run,
  type CliDeps,
} from '../src/cli';
import type { GetSecretExists } from '../src/providers';

/* ------------------------------------------------------------------ */
/* Test harness — capture every line; prove zero network egress.       */
/* ------------------------------------------------------------------ */

interface Harness {
  deps: CliDeps;
  /** All lines written to the normal output sink. */
  out: string[];
  /** All lines written to the error sink. */
  err: string[];
  /** Combined out+err as one string (convenient for `.toContain`). */
  all(): string;
  /** How many times the injected fetch was invoked (MUST stay 0 for dry runs). */
  fetchCalls: number;
}

/** A presence probe from an explicit "present" set. */
function probe(presentKeys: readonly string[]): GetSecretExists {
  const set = new Set(presentKeys);
  return (key) => set.has(key);
}

/**
 * Build a harness. The injected `fetchImpl` THROWS on any invocation, so if a
 * command accidentally performs network I/O the test fails loudly rather than
 * silently passing.
 */
function harness(presentKeys: readonly string[]): Harness {
  const out: string[] = [];
  const err: string[] = [];
  let fetchCalls = 0;
  const deps: CliDeps = {
    out: (l) => out.push(l),
    err: (l) => err.push(l),
    getSecretExists: probe(presentKeys),
    fetchImpl: async () => {
      fetchCalls++;
      throw new Error('NETWORK CALL ATTEMPTED — the dry run / offline path must make none');
    },
    now: () => new Date('2026-10-14T00:00:00.000Z'),
  };
  return {
    deps,
    out,
    err,
    all: () => [...out, ...err].join('\n'),
    get fetchCalls() {
      return fetchCalls;
    },
  };
}

/** The "reality" credential set used by the live CLI (DataForSEO absent). */
const REALITY = [
  'EXA_API_KEY',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_API_KEY',
  'CLOUDFLARE_EMAIL',
];

const ALL = ['DATAFORSEO_LOGIN', 'DATAFORSEO_PASSWORD', ...REALITY];

/* ------------------------------------------------------------------ */
/* setup                                                               */
/* ------------------------------------------------------------------ */

describe('setup', () => {
  it('renders a real provider table and the auth URL for each unconfigured provider', () => {
    const h = harness(REALITY);
    const code = run(['setup'], h.deps);
    expect(code).toBe(0);
    const text = h.all();
    // Table header + one row per provider.
    expect(text).toContain('PROVIDER');
    expect(text).toContain('DataForSEO');
    expect(text).toContain('ABSENT');
    expect(text).toContain('Exa');
    expect(text).toContain('Cloudflare');
    // Next-step URLs for the two not-present providers.
    expect(text).toContain('https://app.dataforseo.com/api-access');
    expect(text).toContain('webmasters.readonly');
    // And it never spent anything / never hit the network.
    expect(h.fetchCalls).toBe(0);
  });

  it('never prints a secret value (only presence)', () => {
    const h = harness(ALL);
    run(['setup'], h.deps);
    // The probe is boolean-only, so no value CAN leak — but assert the shape
    // regardless: a key name immediately assigned a value (KEY=xxx / KEY: xxx)
    // would be a leak. Bare key-NAMES in prose (e.g. "DATAFORSEO_PASSWORD
    // present") are fine; an assigned value is not.
    expect(h.all()).not.toMatch(/(?:API_KEY|PASSWORD|SECRET|TOKEN|LOGIN|EMAIL)\s*[:=]\s*\S/);
  });
});

/* ------------------------------------------------------------------ */
/* health                                                              */
/* ------------------------------------------------------------------ */

describe('health', () => {
  it('renders the provider table, freshness, and the budget line', () => {
    const h = harness(REALITY);
    const code = run(['health'], h.deps);
    expect(code).toBe(0);
    const text = h.all();
    expect(text).toContain('PROVIDER');
    expect(text).toContain('Data freshness:');
    expect(text).toContain('0 records');
    // Budget: $20 cap, $0 spent, $20 remaining.
    expect(text).toContain('Monthly cap: $20.00');
    expect(text).toContain('Spent this month: $0.00');
    expect(text).toContain('Remaining: $20.00');
    expect(h.fetchCalls).toBe(0);
  });

  it('skips the DataForSEO free self-test when creds are absent (never fabricates)', () => {
    const h = harness(REALITY); // DataForSEO absent
    run(['health'], h.deps);
    const text = h.all();
    expect(text).toContain('creds absent — skipping');
    expect(text).toContain('not fabricated');
    expect(h.fetchCalls).toBe(0);
  });

  it('exposes the $20 cap via the exported constant', () => {
    expect(MONTHLY_BUDGET_USD).toBe(20);
  });
});

/* ------------------------------------------------------------------ */
/* research --dry-run                                                  */
/* ------------------------------------------------------------------ */

describe('research --dry-run', () => {
  it('makes ZERO network calls while planning', () => {
    const h = harness(REALITY);
    const code = run(['research', '--domain=projectsites.dev', '--dry-run'], h.deps);
    expect(code).toBe(0);
    // The single most important assertion: the throwing fetch was never called.
    expect(h.fetchCalls).toBe(0);
  });

  it('lists every pipeline phase (A, C, D, E, F, G)', () => {
    const h = harness(REALITY);
    run(['research', '--domain=projectsites.dev', '--dry-run'], h.deps);
    const text = h.all();
    for (const id of ['A', 'C', 'D', 'E', 'F', 'G']) {
      expect(text).toContain(`[${id}]`);
    }
    // And the provider calls each phase WOULD make are listed.
    expect(text).toContain('keywords_for_site');
    expect(text).toContain('keyword_ideas');
    expect(text).toContain('Exa search');
  });

  it('shows an estimated total cost and the spend cap', () => {
    const h = harness(REALITY);
    run(['research', '--domain=projectsites.dev', '--dry-run'], h.deps);
    const text = h.all();
    const total = estimateRunCost(RESEARCH_PHASES);
    expect(text).toContain(`Estimated total cost: ~$${total.toFixed(2)}`);
    expect(text).toContain('spend cap: $20.00');
    // Honest about which providers are / are not ready.
    expect(text).toContain('Providers ready: Exa, Cloudflare');
    expect(text).toContain('DataForSEO (absent)');
  });

  it('honors --geo / --lang / --format and defaults to US/en/json', () => {
    const h1 = harness(REALITY);
    run(['research', '--domain=d.tld', '--dry-run'], h1.deps);
    expect(h1.all()).toContain('geo: US · lang: en');
    expect(h1.all()).toContain('format: json');

    const h2 = harness(REALITY);
    run(
      ['research', '--domain=d.tld', '--dry-run', '--geo=GB', '--lang=fr', '--format=md'],
      h2.deps,
    );
    expect(h2.all()).toContain('geo: GB · lang: fr');
    expect(h2.all()).toContain('format: md');
  });
});

/* ------------------------------------------------------------------ */
/* research (real run, no creds) → BLOCKED                             */
/* ------------------------------------------------------------------ */

describe('research without creds (non-dry-run)', () => {
  it('is BLOCKED, prints the provisioning URL, and exits non-zero', () => {
    const h = harness(REALITY); // DataForSEO absent
    const code = run(['research', '--domain=projectsites.dev'], h.deps);
    expect(code).not.toBe(0);
    const text = h.all();
    expect(text).toContain('BLOCKED');
    expect(text).toContain('DataForSEO API credentials are required');
    expect(text).toContain('https://app.dataforseo.com/api-access');
    expect(text).toContain('No results were fabricated');
    // Even the blocked path performs no network I/O.
    expect(h.fetchCalls).toBe(0);
  });

  it('runs the LIVE pipeline when creds are present (mocked transport + fs, zero real network)', async () => {
    // A mock fetch that returns minimal DataForSEO envelopes for every call,
    // so the live path exercises end-to-end without touching the network.
    const dfsEnvelope = (items: unknown[]) => ({
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          status_code: 20000,
          cost: 0.01,
          tasks: [{ id: 't', status_code: 20000, result: [{ items }] }],
        });
      },
      async json() {
        return {};
      },
    });
    let fetchCalls = 0;
    const fetchImpl = async (_url: string): Promise<Response> => {
      fetchCalls++;
      // keywords_for_site + keyword_ideas + search_volume etc. all read items[].
      return dfsEnvelope([
        { keyword: 'crm pricing', keyword_info: { search_volume: 1900, cpc: 22, competition: 0.8 }, keyword_properties: { keyword_difficulty: 30 } },
        { keyword: 'best crm for agencies', keyword_info: { search_volume: 2400 }, keyword_properties: { keyword_difficulty: 35 } },
      ]) as unknown as Response;
    };

    // In-memory filesystem — capture every written report; zero disk.
    const files: Record<string, string> = {};
    const dirs = new Set<string>();
    const out: string[] = [];
    const err: string[] = [];

    const code = await run(['research', '--domain=projectsites.dev', '--geo=US', '--lang=en'], {
      out: (l) => out.push(l),
      err: (l) => err.push(l),
      getSecretExists: probe(ALL), // DataForSEO present
      getSecretValue: (k) => (ALL.includes(k) ? `${k}-value` : null),
      fetchImpl,
      now: () => new Date('2026-10-14T00:00:00.000Z'),
      fs: {
        async readFile(path) {
          if (Object.prototype.hasOwnProperty.call(files, path)) return files[path]!;
          const e = new Error('ENOENT') as NodeJS.ErrnoException;
          e.code = 'ENOENT';
          throw e;
        },
        async writeFile(path, data) {
          files[path] = data;
        },
        async mkdir(path) {
          dirs.add(path);
          return undefined;
        },
      },
    });

    expect(code).toBe(0);
    // It actually used the (mock) transport.
    expect(fetchCalls).toBeGreaterThan(0);

    // All three reports were written under the default ./research/<domain>/<ts>/.
    const written = Object.keys(files);
    expect(written.some((p) => p.endsWith('report.json'))).toBe(true);
    expect(written.some((p) => p.endsWith('report.md'))).toBe(true);
    expect(written.some((p) => p.endsWith('opportunities.csv'))).toBe(true);
    // The page map was persisted.
    expect(written.some((p) => p.endsWith('keyword-page-map.json'))).toBe(true);

    // The JSON report parses and carries real opportunities (not fabricated).
    const jsonPath = written.find((p) => p.endsWith('report.json'))!;
    const report = JSON.parse(files[jsonPath]!);
    expect(report.schema_version).toBe(1);
    expect(report.site.domain).toBe('projectsites.dev');
    expect(report.summary.total_opportunities).toBeGreaterThan(0);

    // The summary was printed.
    expect(out.join('\n')).toContain('research (LIVE)');
    expect(out.join('\n')).toMatch(/Reports written to/);
  });
});

/* ------------------------------------------------------------------ */
/* --help / usage / arg errors                                         */
/* ------------------------------------------------------------------ */

describe('help + usage', () => {
  it('--help lists every command', () => {
    const h = harness(REALITY);
    const code = run(['--help'], h.deps);
    expect(code).toBe(0);
    const text = h.all();
    for (const cmd of ['setup', 'health', 'research']) {
      expect(text).toContain(cmd);
    }
  });

  it('no command prints usage and exits 0', () => {
    const h = harness(REALITY);
    const code = run([], h.deps);
    expect(code).toBe(0);
    expect(h.all()).toContain('USAGE');
  });
});

describe('argument errors', () => {
  it('an unknown flag is an error (exit 1) with usage', () => {
    const h = harness(REALITY);
    const code = run(['research', '--domain=d.tld', '--bogus'], h.deps);
    expect(code).toBe(1);
    const text = h.all();
    expect(text).toMatch(/error/i);
    expect(text).toContain('USAGE');
    expect(h.fetchCalls).toBe(0);
  });

  it('an unknown command is an error (exit 1)', () => {
    const h = harness(REALITY);
    const code = run(['frobnicate'], h.deps);
    expect(code).toBe(1);
    expect(h.all()).toContain('Unknown command');
  });

  it('research without --domain is an error (exit 1)', () => {
    const h = harness(REALITY);
    const code = run(['research', '--dry-run'], h.deps);
    expect(code).toBe(1);
    expect(h.all()).toMatch(/--domain/);
  });

  it('an invalid --format is rejected', () => {
    expect(() => parseResearchArgs(['--domain=d.tld', '--format=xml'])).toThrow(/format/i);
  });

  it('a negative --max-spend is rejected', () => {
    expect(() => parseResearchArgs(['--domain=d.tld', '--max-spend=-5'])).toThrow(
      /max-spend/i,
    );
  });
});
