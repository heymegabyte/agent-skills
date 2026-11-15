/**
 * @module test/provisioning
 * @description Provisioning safety contract: plan-first, no shell, no secret leakage.
 *
 * The CLI is a throwaway shell script written to a temp dir at test time, so the
 * suite never needs wrangler, Cloudflare credentials, or the network.
 */
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  attachBinding,
  listD1Databases,
  provisionD1,
  provisionKv,
  provisionR2,
  renderBindingToml,
  runCli,
  setWorkerSecret,
} from '../src/provisioning.js';
import type { Runtime } from '../src/http.js';

const NO_FETCH = (async () => {
  throw new Error('provisioning must never call fetch');
}) as typeof fetch;

const rt = (env: NodeJS.ProcessEnv = {}): Runtime => ({ fetchImpl: NO_FETCH, env });

let dir: string;
let bin: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'psmcp-'));
  bin = join(dir, 'fake-wrangler');

  // Prints argv and stdin as JSON. Deliberately echoes the secret so the
  // redaction test proves the value cannot escape through stdout.
  const script = `#!/bin/sh
{
  printf '{"argv":['
  first=1
  for a in "$@"; do
    if [ $first -eq 0 ]; then printf ','; fi
    first=0
    printf '"%s"' "$a"
  done
  printf '],"stdin":"'
  cat
  printf '"}\\n'
  exit \${FAKE_EXIT:-0}
}
`;
  writeFileSync(bin, script);
  chmodSync(bin, 0o755);
  process.env.WRANGLER_BIN = bin;
});

afterEach(() => {
  delete process.env.WRANGLER_BIN;
  delete process.env.FAKE_EXIT;
  delete process.env.SECRET_FOR_TEST;
});

describe('runCli', () => {
  it('passes shell metacharacters as inert argv, never through a shell', async () => {
    const hostile = 'x; rm -rf / #';
    const result = await runCli(bin, ['d1', 'create', hostile]);
    assert.equal(result.code, 0);
    const parsed = JSON.parse(result.stdout) as { argv: string[] };
    assert.deepEqual(parsed.argv, ['d1', 'create', hostile]);
  });

  it('reports a non-zero exit without throwing', async () => {
    process.env.FAKE_EXIT = '2';
    const result = await runCli(bin, ['nope']);
    assert.equal(result.code, 2);
  });
});

describe('plan-first create tools', () => {
  it('cf_provision_d1 only plans by default', async () => {
    const out = (await provisionD1(rt(), { name: 'njsk-db', confirm: false })) as {
      applied: boolean;
      plan: { bin: string; argv: string[] };
    };
    assert.equal(out.applied, false);
    assert.deepEqual(out.plan.argv, ['d1', 'create', 'njsk-db']);
  });

  it('cf_provision_d1 applies when confirmed and parses JSON', async () => {
    const out = (await provisionD1(rt(), { name: 'njsk-db', confirm: true })) as {
      ok: boolean;
      parsed: { argv: string[] };
    };
    assert.equal(out.ok, true);
    assert.deepEqual(out.parsed.argv, ['d1', 'create', 'njsk-db']);
  });

  it('cf_provision_kv and cf_provision_r2 build the right argv', async () => {
    const kv = (await provisionKv(rt(), { title: 'njsk-cache', confirm: false })) as { plan: { argv: string[] } };
    assert.deepEqual(kv.plan.argv, ['kv', 'namespace', 'create', 'njsk-cache']);

    const r2 = (await provisionR2(rt(), { name: 'njsk-assets', confirm: false })) as { plan: { argv: string[] } };
    assert.deepEqual(r2.plan.argv, ['r2', 'bucket', 'create', 'njsk-assets']);
  });

  it('list_d1_databases is read-only and passes --json', async () => {
    const out = (await listD1Databases(rt())) as { parsed: { argv: string[] } };
    assert.deepEqual(out.parsed.argv, ['d1', 'list', '--json']);
  });
});

describe('cf_set_worker_secret', () => {
  it('refuses when the source env var is unset', async () => {
    const out = (await setWorkerSecret(rt({}), {
      worker: 'njsk',
      name: 'SESSION_SECRET',
      from_env: 'SECRET_FOR_TEST',
      confirm: true,
    })) as { ok: boolean; error: string };
    assert.equal(out.ok, false);
    assert.match(out.error, /unset or empty/);
  });

  it('pipes the value on stdin and scrubs it from the result', async () => {
    const secret = 'super-secret-value-123';
    const out = (await setWorkerSecret(rt({ SECRET_FOR_TEST: secret }), {
      worker: 'njsk',
      name: 'SESSION_SECRET',
      from_env: 'SECRET_FOR_TEST',
      confirm: true,
    })) as { stdout?: string; output?: string; applied?: boolean };

    const serialised = JSON.stringify(out);
    assert.ok(!serialised.includes(secret), 'secret must not appear anywhere in the result');
    assert.match(serialised, /\[redacted\]/);
  });

  it('plans without reading the secret into argv', async () => {
    const out = (await setWorkerSecret(rt({ SECRET_FOR_TEST: 'abc' }), {
      worker: 'njsk',
      name: 'SESSION_SECRET',
      from_env: 'SECRET_FOR_TEST',
      confirm: false,
    })) as { plan: { argv: string[] }; secret_source: string };
    assert.deepEqual(out.plan.argv, ['secret', 'put', 'SESSION_SECRET', '--name', 'njsk']);
    assert.equal(out.secret_source, 'SECRET_FOR_TEST');
  });
});

describe('cf_attach_binding', () => {
  const input = {
    config_path: '',
    kind: 'd1' as const,
    binding: 'DB',
    resource_id: '11111111-2222-3333-4444-555555555555',
    resource_name: 'njsk-db',
    confirm: false,
  };

  it('renders a TOML array-of-tables block', () => {
    assert.equal(
      renderBindingToml(input),
      [
        '[[d1_databases]]',
        'binding = "DB"',
        'database_name = "njsk-db"',
        'database_id = "11111111-2222-3333-4444-555555555555"',
      ].join('\n'),
    );
  });

  it('plans without touching the file, then appends on confirm', async () => {
    const config = join(dir, 'wrangler.toml');
    const original = 'name = "njsk"\nmain = "src/index.ts"\n';
    writeFileSync(config, original);

    const planned = (await attachBinding(rt(), { ...input, config_path: config })) as { applied: boolean };
    assert.equal(planned.applied, false);
    assert.equal(readFileSync(config, 'utf8'), original, 'dry run must not write');

    const applied = (await attachBinding(rt(), { ...input, config_path: config, confirm: true })) as {
      applied: boolean;
    };
    assert.equal(applied.applied, true);
    const written = readFileSync(config, 'utf8');
    assert.ok(written.startsWith(original), 'existing content preserved verbatim');
    assert.match(written, /\[\[d1_databases\]\]/);
  });

  it('refuses to duplicate an existing binding', async () => {
    const config = join(dir, 'wrangler.toml');
    writeFileSync(config, '[[d1_databases]]\nbinding = "DB"\ndatabase_id = "x"\n');
    const out = (await attachBinding(rt(), { ...input, config_path: config, confirm: true })) as {
      applied: boolean;
      note: string;
    };
    assert.equal(out.applied, false);
    assert.match(out.note, /already present/);
  });

  it('fails closed when the config does not exist', async () => {
    const out = (await attachBinding(rt(), { ...input, config_path: join(dir, 'nope.toml') })) as {
      ok: boolean;
    };
    assert.equal(out.ok, false);
  });
});
