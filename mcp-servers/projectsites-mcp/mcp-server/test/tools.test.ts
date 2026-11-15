/**
 * @module test/tools
 * @description Schema + dispatch tests for the tool manifest.
 *
 * These are contract tests, not implementation tests: they pin the public shape
 * (tool names, counts, required fields, defaults) that an MCP client sees, so a
 * careless edit cannot silently rename or drop a tool.
 */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { listToolsPayload, TOOL_DEFINITIONS, TOOLS_BY_NAME, toolCounts, toJsonSchema } from '../src/tools.js';
import type { Runtime } from '../src/http.js';

/** Minimal fake runtime whose fetch is supplied per test. */
const runtimeWith = (fetchImpl: typeof fetch): Runtime => ({ fetchImpl, env: {} });

/** Capture the request a handler made. */
interface Call {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

/** Build a fetch that records calls and returns `payload` as JSON. */
function recorder(payload: unknown = { ok: true }, status = 200) {
  const calls: Call[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({
      url: String(input),
      method: init?.method ?? 'GET',
      headers,
      body: typeof init?.body === 'string' ? JSON.parse(init.body) : init?.body,
    });
    return new Response(JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

/** Invoke a tool by name through the manifest, as the MCP layer would. */
async function call(name: string, args: Record<string, unknown>, rt: Runtime) {
  const tool = TOOLS_BY_NAME.get(name);
  assert.ok(tool, `tool ${name} must exist`);
  const parsed = tool.inputSchema.parse(args);
  return tool.handler(rt, parsed as never);
}

beforeEach(() => {
  process.env.PROJECT_SITES_API_KEY = 'psk_live_test';
  process.env.PROJECT_SITES_API_URL = 'https://api.example.test';
});

afterEach(() => {
  delete process.env.PROJECT_SITES_API_KEY;
  delete process.env.PROJECT_SITES_API_URL;
  delete process.env.PROJECT_SITES_ENDPOINT_GET_SSO_CONFIG;
});

describe('manifest', () => {
  it('exposes 34 tools in the 17/9/8 grouping', () => {
    assert.equal(TOOL_DEFINITIONS.length, 34);
    assert.deepEqual(toolCounts(), { core: 17, sdk: 9, provisioning: 8 });
  });

  it('has unique, snake_case tool names', () => {
    const names = TOOL_DEFINITIONS.map((t) => t.name);
    assert.equal(new Set(names).size, names.length, 'tool names must be unique');
    for (const name of names) assert.match(name, /^[a-z][a-z0-9_]*$/, `${name} must be snake_case`);
  });

  it('carries every tool named in agent-skills#5', () => {
    const required = [
      // new SDK-covered
      'auth_me',
      'update_site',
      'delete_site',
      'list_snapshots',
      'list_media',
      'list_form_submissions',
      'get_site_trust_profile',
      'update_site_trust_profile',
      'list_audit_exports',
      'get_sso_config',
      'update_sso_config',
      'append_sla_snapshot',
      // Cloudflare provisioning
      'cf_provision_d1',
      'list_d1_databases',
      'cf_provision_kv',
      'list_kv_namespaces',
      'cf_provision_r2',
      'list_r2_buckets',
      'add_domain',
      'get_site_health',
      'get_site_status',
      // one-prompt entry point
      'launch_site',
    ];
    for (const name of required) assert.ok(TOOLS_BY_NAME.has(name), `missing ${name}`);
  });

  it("uses the cf_provision_* names from agent-skills#5 verbatim", () => {
    for (const name of ['cf_provision_d1', 'cf_provision_kv', 'cf_provision_r2']) {
      assert.ok(TOOLS_BY_NAME.has(name), `missing ${name}`);
      assert.equal(TOOLS_BY_NAME.get(name)!.category, 'provisioning');
    }
    for (const retired of ['provision_d1', 'provision_kv', 'provision_r2']) {
      assert.equal(TOOLS_BY_NAME.has(retired), false, `${retired} was renamed to cf_${retired}`);
    }
  });

  it('advertises object schemas with properties for every tool', () => {
    for (const tool of listToolsPayload()) {
      assert.equal(tool.inputSchema.type, 'object', `${tool.name} must be an object schema`);
      assert.equal(typeof tool.inputSchema.properties, 'object', `${tool.name} needs properties`);
      assert.ok(Array.isArray(tool.inputSchema.required), `${tool.name} needs a required array`);
    }
  });

  it('marks business_name required on create_site only', () => {
    const create = toJsonSchema(TOOLS_BY_NAME.get('create_site')!.inputSchema);
    assert.deepEqual(create.required, ['business_name']);
    const list = toJsonSchema(TOOLS_BY_NAME.get('list_sites')!.inputSchema);
    assert.deepEqual(list.required, []);
  });

  it('defaults destructive-ish flags to false', () => {
    for (const name of ['cf_provision_d1', 'cf_provision_kv', 'cf_provision_r2', 'cf_attach_binding', 'delete_site']) {
      const properties = toJsonSchema(TOOLS_BY_NAME.get(name)!.inputSchema).properties as Record<
        string,
        { default?: unknown }
      >;
      assert.equal(properties.confirm?.default, false, `${name}.confirm must default to false`);
    }
  });
});

describe('core handlers', () => {
  it('list_sites sends the bearer token and pagination query', async () => {
    const { calls, fetchImpl } = recorder({ data: [], total: 0 });
    const out = await call('list_sites', { limit: 10, offset: 20 }, runtimeWith(fetchImpl));

    assert.deepEqual(out, { data: [], total: 0 });
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.url, 'https://api.example.test/api/sites?limit=10&offset=20');
    assert.equal(calls[0]!.headers.Authorization, 'Bearer psk_live_test');
  });

  it('get_site encodes the id into the path', async () => {
    const { calls, fetchImpl } = recorder({ id: 'abc' });
    await call('get_site', { id: 'a/b c' }, runtimeWith(fetchImpl));
    assert.equal(calls[0]!.url, 'https://api.example.test/api/sites/a%2Fb%20c');
  });

  it('update_site sends only the patch fields', async () => {
    const { calls, fetchImpl } = recorder({ ok: true });
    await call('update_site', { id: 's1', business_name: 'New Name', status: 'published' }, runtimeWith(fetchImpl));
    assert.equal(calls[0]!.method, 'PATCH');
    assert.deepEqual(calls[0]!.body, { business_name: 'New Name', status: 'published' });
  });

  it('delete_site refuses to fire without confirm', async () => {
    const { calls, fetchImpl } = recorder({ ok: true });
    const out = (await call('delete_site', { id: 's1' }, runtimeWith(fetchImpl))) as {
      ok: boolean;
      plan: unknown;
    };
    assert.equal(calls.length, 0, 'must not call the API');
    assert.equal(out.ok, false);
    assert.deepEqual(out.plan, { method: 'DELETE', path: '/api/sites/s1' });
  });

  it('delete_site fires with confirm', async () => {
    const { calls, fetchImpl } = recorder({ deleted: true });
    await call('delete_site', { id: 's1', confirm: true }, runtimeWith(fetchImpl));
    assert.equal(calls[0]!.method, 'DELETE');
  });

  it('add_domain posts the hostname body', async () => {
    const { calls, fetchImpl } = recorder({ ok: true });
    await call('add_domain', { siteId: 's1', hostname: 'njsk.org', make_primary: true }, runtimeWith(fetchImpl));
    assert.equal(calls[0]!.url, 'https://api.example.test/api/sites/s1/hostnames');
    assert.deepEqual(calls[0]!.body, { hostname: 'njsk.org', make_primary: true });
  });

  it('launch_site creates then reads workflow status', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      const payload = url.endsWith('/workflow') ? { status: 'building' } : { id: 'site-1' };
      return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;

    const out = (await call('launch_site', { business_name: 'Soup Kitchen' }, runtimeWith(fetchImpl))) as {
      id: string;
      status: unknown;
    };
    assert.equal(out.id, 'site-1');
    assert.deepEqual(out.status, { status: 'building' });
    assert.deepEqual(calls, [
      'https://api.example.test/api/sites',
      'https://api.example.test/api/sites/site-1/workflow',
    ]);
  });
});

describe('sdk passthrough', () => {
  it('maps each passthrough to its documented endpoint', async () => {
    const expected: Array<[string, string, string]> = [
      ['list_snapshots', 'GET', '/api/sites/s1/snapshots'],
      ['list_media', 'GET', '/api/media/assets'],
      ['list_form_submissions', 'GET', '/api/sites/s1/form-submissions'],
      ['get_site_trust_profile', 'GET', '/api/sites/s1/trust-profile'],
      ['list_audit_exports', 'GET', '/api/audit-exports'],
      ['get_sso_config', 'GET', '/api/sso/config'],
    ];
    for (const [name, method, path] of expected) {
      const { calls, fetchImpl } = recorder({ ok: true });
      await call(name, { siteId: 's1' }, runtimeWith(fetchImpl));
      assert.equal(calls[0]!.method, method, `${name} method`);
      assert.ok(calls[0]!.url.endsWith(path), `${name} path — got ${calls[0]!.url}`);
    }
  });

  it('sends a body for the mutating passthroughs', async () => {
    const update = recorder({ ok: true });
    await call('update_site_trust_profile', { siteId: 's1', profile: { badge: 'verified' } }, runtimeWith(update.fetchImpl));
    assert.equal(update.calls[0]!.method, 'PUT');
    assert.deepEqual(update.calls[0]!.body, { badge: 'verified' });

    const sso = recorder({ ok: true });
    await call('update_sso_config', { config: { provider: 'okta' } }, runtimeWith(sso.fetchImpl));
    assert.equal(sso.calls[0]!.method, 'PUT');
    assert.deepEqual(sso.calls[0]!.body, { provider: 'okta' });
  });

  it('honours a per-tool endpoint override', async () => {
    process.env.PROJECT_SITES_ENDPOINT_GET_SSO_CONFIG = 'GET /api/v2/sso';
    const { calls, fetchImpl } = recorder({ ok: true });
    await call('get_sso_config', {}, runtimeWith(fetchImpl));
    assert.ok(calls[0]!.url.endsWith('/api/v2/sso'), calls[0]!.url);
  });
});

describe('validation', () => {
  it('rejects an invalid slug before any request', () => {
    const tool = TOOLS_BY_NAME.get('create_site')!;
    const result = tool.inputSchema.safeParse({ business_name: 'X', slug: 'Not A Slug' });
    assert.equal(result.success, false);
  });

  it('rejects a path parameter that would be left literal', async () => {
    // :siteId with no value must never reach the network as ":siteId".
    await assert.rejects(
      () => call('list_snapshots', {}, runtimeWith(recorder().fetchImpl)),
      (error: Error) => /siteId/.test(error.message),
    );
  });
});
