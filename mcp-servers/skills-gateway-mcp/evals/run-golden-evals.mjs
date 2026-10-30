#!/usr/bin/env node
/**
 * run-golden-evals.mjs — execute `evals/skills-gateway-golden.json` against the
 * real server over stdio. No network, no mocks: the gateway is pure-local.
 *
 * Usage:
 *   node run-golden-evals.mjs [--root=<plugin-root>] [--json]
 *
 * Exit codes: 0 all pass · 1 a test failed · 2 harness error.
 *
 * @module
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// The SDK is installed under mcp-server/; resolve it from there so the runner
// needs no dependency of its own.
const SDK = pathToFileURL(join(HERE, '..', 'mcp-server', 'node_modules', '@modelcontextprotocol', 'sdk', 'dist', 'esm') + '/');
const { Client } = await import(new URL('client/index.js', SDK).href);
const { StdioClientTransport } = await import(new URL('client/stdio.js', SDK).href);
const ROOT = resolve(
  process.argv.find((a) => a.startsWith('--root='))?.slice('--root='.length) ??
    join(HERE, '..', '..', '..'),
);
const JSON_OUT = process.argv.includes('--json');
const SUITES = [
  'skills-gateway-golden.json',
  'skills-gateway-retrieval.json',
  'skills-gateway-budget.json',
].map((f) => JSON.parse(readFileSync(join(HERE, f), 'utf-8')));

function textOf(result) {
  return (result.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('\n');
}

function check(test, result, toolNames, toolListingChars) {
  const failures = [];
  const text = textOf(result);

  if (test.tool === '__meta_list_tools') {
    const n = toolNames.length;
    if (test.expected_tool_count_min !== undefined && n < test.expected_tool_count_min) {
      failures.push(`expected >= ${test.expected_tool_count_min} tools, got ${n}`);
    }
    if (test.expected_tool_count_max !== undefined && n > test.expected_tool_count_max) {
      failures.push(`expected <= ${test.expected_tool_count_max} tools, got ${n}`);
    }
    for (const name of test.expected_tool_names_include ?? []) {
      if (!toolNames.includes(name)) failures.push(`missing tool ${name}`);
    }
    if (test.max_listing_chars !== undefined && toolListingChars > test.max_listing_chars) {
      failures.push(`tool listing is ${toolListingChars} chars, over the ${test.max_listing_chars} ceiling`);
    }
    return failures;
  }

  if (test.max_result_chars !== undefined && text.length > test.max_result_chars) {
    failures.push(`result is ${text.length} chars, over the ${test.max_result_chars} ceiling`);
  }
  if (test.min_result_chars !== undefined && text.length < test.min_result_chars) {
    failures.push(`result is ${text.length} chars, under the ${test.min_result_chars} floor`);
  }

  if (test.expected_is_error !== undefined && Boolean(result.isError) !== test.expected_is_error) {
    failures.push(`expected isError=${test.expected_is_error}, got ${Boolean(result.isError)}`);
  }
  for (const needle of test.expected_contains ?? []) {
    if (!text.includes(needle)) failures.push(`missing text ${JSON.stringify(needle)}`);
  }
  for (const needle of test.expected_not_contains ?? []) {
    if (text.includes(needle)) failures.push(`unexpected text ${JSON.stringify(needle)}`);
  }
  return failures;
}

async function main() {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(HERE, '..', 'mcp-server', 'dist', 'index.js')],
    env: { ...process.env, SKILLS_GATEWAY_ROOT: ROOT },
  });
  const client = new Client({ name: 'skills-gateway-evals', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  const { tools } = await client.listTools();
  const toolNames = tools.map((t) => t.name);
  const toolListingChars = JSON.stringify(tools).length;

  const tests = SUITES.flatMap((suite) => suite.tests);
  const results = [];
  for (const test of tests) {
    let failures;
    try {
      const result =
        test.tool === '__meta_list_tools'
          ? { content: [], isError: false }
          : await client.callTool({ name: test.tool, arguments: test.input ?? {} });
      failures = check(test, result, toolNames, toolListingChars);
    } catch (err) {
      failures = [`threw: ${String(err)}`];
    }
    results.push({ id: test.id, ok: failures.length === 0, failures });
  }

  await client.close();

  const passed = results.filter((r) => r.ok).length;
  if (JSON_OUT) {
    process.stdout.write(`${JSON.stringify({ suites: SUITES.length, passed, total: results.length, results }, null, 2)}\n`);
  } else {
    for (const r of results) {
      process.stdout.write(`${r.ok ? '✓' : '✗'} ${r.id}${r.ok ? '' : ` — ${r.failures.join('; ')}`}\n`);
    }
    process.stdout.write(`\n${passed}/${results.length} passed\n`);
  }
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((err) => {
  process.stderr.write(`harness error: ${String(err)}\n`);
  process.exit(2);
});
