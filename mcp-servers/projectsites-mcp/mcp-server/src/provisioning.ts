/**
 * @module provisioning
 * @description Cloudflare provisioning tools — the "give my new site real edge
 * resources" half of the one-prompt launch flow.
 *
 * Safety model (deliberate, tested):
 *  1. **Plan first.** Every mutating tool runs as a dry run unless the caller
 *     passes `confirm: true`. The dry run returns the exact argv that *would*
 *     run, so a reviewer can approve a concrete command rather than a promise.
 *  2. **No shell.** Commands are `spawn(bin, argv)` — nothing is ever
 *     interpolated into a shell string, so a slug like `x; rm -rf /` is inert.
 *  3. **Secrets never travel through argv.** `cf_set_worker_secret` reads the
 *     value from a *named* env var and writes it to the child's stdin. The value
 *     is never logged, echoed, or returned; an unset var fails closed.
 *  4. **Config edits are additive.** `cf_attach_binding` refuses to edit when the
 *     binding name already exists, and otherwise appends a TOML array-of-tables
 *     at EOF — a valid TOML position — so no existing content is rewritten.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';
import { cloudflare } from './config.js';
import type { Runtime } from './http.js';

/** Truncate CLI output so a verbose wrangler log cannot flood context. */
const MAX_OUTPUT = 8_000;

const trim = (value: string): string =>
  value.length > MAX_OUTPUT ? `${value.slice(0, MAX_OUTPUT)}… [truncated]` : value;

/** Result of one child-process invocation. */
export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

/**
 * Run a binary with an argv array. No shell, no interpolation.
 *
 * @param bin  Executable name or absolute path.
 * @param argv Arguments, each already a distinct string.
 * @param opts `stdin` is written then closed; `timeoutMs` kills a wedged child.
 */
export function runCli(
  bin: string,
  argv: string[],
  opts: { stdin?: string; timeoutMs?: number } = {},
): Promise<CliResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(bin, argv, { shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGKILL'), opts.timeoutMs ?? 120_000);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, stdout, stderr });
    });

    if (opts.stdin !== undefined) child.stdin.write(opts.stdin);
    child.stdin.end();
  });
}

/** Parse `stdout` as JSON when possible, else `undefined`. */
function parseJson(stdout: string): unknown {
  const text = stdout.trim();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    // Wrangler sometimes prefixes a banner line before the JSON payload.
    const start = text.search(/[[{]/);
    if (start > 0) {
      try {
        return JSON.parse(text.slice(start));
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}

/** Shape a completed CLI run into a tool result. */
function result(tool: string, r: CliResult) {
  if (r.code !== 0) {
    return {
      ok: false as const,
      tool,
      exitCode: r.code,
      error: trim(r.stderr || r.stdout || `exit ${r.code}`),
    };
  }
  return {
    ok: true as const,
    tool,
    exitCode: 0,
    parsed: parseJson(r.stdout),
    output: trim(r.stdout.trim()),
  };
}

/** Dry-run envelope: the exact command that would run. */
function plan(tool: string, bin: string, argv: string[], note: string) {
  return {
    ok: true as const,
    applied: false as const,
    tool,
    plan: { bin, argv },
    note,
  };
}

// ── input schemas ────────────────────────────────────────────────────────────

/** Cloudflare resource names: lowercase, digits, dashes — safe on every surface. */
const resourceName = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Use lowercase letters, digits, and dashes (no leading dash).');

export const ProvisionD1Input = z.object({
  name: resourceName.describe('D1 database name, e.g. "njsk-db".'),
  confirm: z.boolean().default(false).describe('Actually create the database. Default false = dry run.'),
});
export const ListD1Input = z.object({});

export const ProvisionKvInput = z.object({
  title: resourceName.describe('KV namespace title, e.g. "njsk-cache".'),
  confirm: z.boolean().default(false),
});
export const ListKvInput = z.object({});

export const ProvisionR2Input = z.object({
  name: resourceName.describe('R2 bucket name, e.g. "njsk-assets".'),
  confirm: z.boolean().default(false),
});
export const ListR2Input = z.object({});

export const AttachBindingInput = z.object({
  config_path: z.string().min(1).default('wrangler.toml').describe('Path to the wrangler config to edit.'),
  kind: z.enum(['d1', 'kv', 'r2']).describe('Binding family.'),
  binding: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Bindings are conventionally UPPER_SNAKE, e.g. DB.')
    .describe('Binding name as referenced in code, e.g. DB.'),
  resource_id: z.string().min(1).describe('D1 database id, KV namespace id, or R2 bucket name.'),
  resource_name: z.string().min(1).optional().describe('Human name recorded alongside the id (D1 only).'),
  confirm: z.boolean().default(false),
});

export const SetWorkerSecretInput = z.object({
  worker: z.string().min(1).describe('Worker script name (wrangler --name).'),
  name: z
    .string()
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Secret names are UPPER_SNAKE, e.g. SESSION_SECRET.')
    .describe('Secret name as it appears in the Worker env.'),
  from_env: z
    .string()
    .min(1)
    .describe('Name of the *local* env var holding the value. The value itself is never sent to the model or argv.'),
  config_path: z.string().min(1).optional().describe('Optional --config path.'),
  confirm: z.boolean().default(false),
});

export type ProvisionD1Input = z.infer<typeof ProvisionD1Input>;
export type ProvisionKvInput = z.infer<typeof ProvisionKvInput>;
export type ProvisionR2Input = z.infer<typeof ProvisionR2Input>;
export type AttachBindingInput = z.infer<typeof AttachBindingInput>;
export type SetWorkerSecretInput = z.infer<typeof SetWorkerSecretInput>;

// ── handlers ─────────────────────────────────────────────────────────────────

/** Create a D1 database. Dry run unless `confirm`. */
export async function provisionD1(rt: Runtime, input: ProvisionD1Input) {
  const { wranglerBin } = cloudflare();
  const argv = ['d1', 'create', input.name];
  if (!input.confirm) return plan('provision_d1', wranglerBin, argv, 'Re-call with confirm: true to create.');
  return result('provision_d1', await runCli(wranglerBin, argv));
}

/** List D1 databases. Read-only. */
export async function listD1Databases(rt: Runtime) {
  const { wranglerBin } = cloudflare();
  return result('list_d1_databases', await runCli(wranglerBin, ['d1', 'list', '--json']));
}

/** Create a KV namespace. Dry run unless `confirm`. */
export async function provisionKv(rt: Runtime, input: ProvisionKvInput) {
  const { wranglerBin } = cloudflare();
  const argv = ['kv', 'namespace', 'create', input.title];
  if (!input.confirm) return plan('provision_kv', wranglerBin, argv, 'Re-call with confirm: true to create.');
  return result('provision_kv', await runCli(wranglerBin, argv));
}

/** List KV namespaces. Read-only. */
export async function listKvNamespaces(rt: Runtime) {
  const { wranglerBin } = cloudflare();
  return result('list_kv_namespaces', await runCli(wranglerBin, ['kv', 'namespace', 'list']));
}

/** Create an R2 bucket. Dry run unless `confirm`. */
export async function provisionR2(rt: Runtime, input: ProvisionR2Input) {
  const { wranglerBin } = cloudflare();
  const argv = ['r2', 'bucket', 'create', input.name];
  if (!input.confirm) return plan('provision_r2', wranglerBin, argv, 'Re-call with confirm: true to create.');
  return result('provision_r2', await runCli(wranglerBin, argv));
}

/** List R2 buckets. Read-only. */
export async function listR2Buckets(rt: Runtime) {
  const { wranglerBin } = cloudflare();
  return result('list_r2_buckets', await runCli(wranglerBin, ['r2', 'bucket', 'list']));
}

/** Render the TOML array-of-tables block for one binding. */
export function renderBindingToml(input: AttachBindingInput): string {
  switch (input.kind) {
    case 'd1':
      return [
        '[[d1_databases]]',
        `binding = "${input.binding}"`,
        `database_name = "${input.resource_name ?? input.resource_id}"`,
        `database_id = "${input.resource_id}"`,
      ].join('\n');
    case 'kv':
      return ['[[kv_namespaces]]', `binding = "${input.binding}"`, `id = "${input.resource_id}"`].join('\n');
    case 'r2':
      return ['[[r2_buckets]]', `binding = "${input.binding}"`, `bucket_name = "${input.resource_id}"`].join('\n');
  }
}

/**
 * Append a binding to a wrangler config.
 *
 * Refuses when the binding name is already present (idempotence is the caller's
 * job to observe, not ours to silently dedupe), and never rewrites existing
 * content — TOML allows array-of-tables at EOF.
 */
export async function attachBinding(rt: Runtime, input: AttachBindingInput) {
  const block = renderBindingToml(input);
  const snippet = `${block}\n`;

  if (!existsSync(input.config_path)) {
    return { ok: false as const, tool: 'cf_attach_binding', error: `No such config: ${input.config_path}` };
  }
  const current = readFileSync(input.config_path, 'utf8');
  const already = new RegExp(`^\\s*binding\\s*=\\s*"${input.binding}"\\s*$`, 'm').test(current);
  if (already) {
    return {
      ok: true as const,
      applied: false as const,
      tool: 'cf_attach_binding',
      note: `Binding "${input.binding}" already present in ${input.config_path}; nothing to do.`,
      snippet,
    };
  }
  if (!input.confirm) {
    return {
      ok: true as const,
      applied: false as const,
      tool: 'cf_attach_binding',
      plan: { append_to: input.config_path, snippet },
      note: 'Re-call with confirm: true to append this block.',
    };
  }

  const separator = current.endsWith('\n') || current === '' ? '' : '\n';
  writeFileSync(input.config_path, `${current}${separator}\n${snippet}`);
  return {
    ok: true as const,
    applied: true as const,
    tool: 'cf_attach_binding',
    config_path: input.config_path,
    appended: snippet,
  };
}

/**
 * Upload a Worker secret.
 *
 * The value comes from `process.env[from_env]` and is piped to the child's
 * stdin. It is never placed in argv, the plan, the result, or a log line.
 */
export async function setWorkerSecret(rt: Runtime, input: SetWorkerSecretInput) {
  const { wranglerBin } = cloudflare();
  const value = rt.env[input.from_env];
  if (value === undefined || value === '') {
    return {
      ok: false as const,
      tool: 'cf_set_worker_secret',
      error: `Env var "${input.from_env}" is unset or empty — refusing to upload an empty secret.`,
    };
  }
  const argv = ['secret', 'put', input.name, '--name', input.worker];
  if (input.config_path) argv.push('--config', input.config_path);

  if (!input.confirm) {
    const planned = plan('cf_set_worker_secret', wranglerBin, argv, 'Re-call with confirm: true to upload.');
    return { ...planned, secret_source: input.from_env, secret_bytes: Buffer.byteLength(value) };
  }

  const r = await runCli(wranglerBin, argv, { stdin: `${value}\n` });
  // Scrub defensively: if wrangler echoed the value, it must not leave this frame.
  const scrub = (text: string) => text.split(value).join('[redacted]');
  return result('cf_set_worker_secret', {
    code: r.code,
    stdout: scrub(r.stdout),
    stderr: scrub(r.stderr),
  });
}
