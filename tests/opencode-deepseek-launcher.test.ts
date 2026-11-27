import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const launcher = fileURLToPath(new URL('../bin/opencode-deepseek.sh', import.meta.url));

test('the launcher resolves the selected provider and never substitutes credentials', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'opencode-provider-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  writeFileSync(join(directory, 'get-secret'), [
    '#!/bin/sh',
    'printf "broker:%s\\n" "$1" >&2',
    '[ "$1" = "$FIXTURE_PROVIDER" ] || exit 1',
    'printf "%s" fixture-broker-key',
  ].join('\n'), { mode: 0o755 });
  writeFileSync(join(directory, 'opencode'), [
    '#!/bin/sh',
    'if [ "$1" = "--help" ]; then printf "help\\n"; exit 0; fi',
    'printf "%s|%s\\n" "${LITELLM_API_KEY:-unset}" "${DEEPSEEK_API_KEY:-unset}"',
    'printf "%s\\n" "$@"',
  ].join('\n'), { mode: 0o755 });
  const fixtureEnv = { PATH: [directory, '/usr/bin', '/bin'].join(delimiter) };
  const run = (args: string[], env: Record<string, string> = {}) =>
    spawnSync('/bin/bash', [launcher, ...args], { encoding: 'utf8', env: { ...fixtureEnv, ...env } });

  const gateway = run(['run', '--pure', '-m', 'litellm/deepseek-v4-pro', '--', '--model=deepseek/ignored'], {
    FIXTURE_PROVIDER: 'LITELLM_API_KEY',
  });
  assert.equal(gateway.status, 0);
  assert.equal(gateway.stdout, 'fixture-broker-key|unset\nrun\n--pure\n-m\nlitellm/deepseek-v4-pro\n--\n--model=deepseek/ignored\n');

  const direct = run(['run', '--model=deepseek/deepseek-chat', 'reply OK'], { FIXTURE_PROVIDER: 'DEEPSEEK_API_KEY' });
  assert.equal(direct.status, 0);
  assert.match(direct.stdout, /^unset\|fixture-broker-key\n/);

  const wrongGatewayCredential = run(['run', '-m', 'litellm/deepseek-v4-pro'], { DEEPSEEK_API_KEY: 'fixture-direct-key' });
  assert.equal(wrongGatewayCredential.status, 4);
  assert.equal(wrongGatewayCredential.stdout, '');
  assert.match(wrongGatewayCredential.stderr, /LITELLM_API_KEY unavailable/);

  const wrongDirectCredential = run(['run', '--model=deepseek/deepseek-chat'], { LITELLM_API_KEY: 'fixture-gateway-key' });
  assert.equal(wrongDirectCredential.status, 4);
  assert.equal(wrongDirectCredential.stdout, '');
  assert.match(wrongDirectCredential.stderr, /DEEPSEEK_API_KEY unavailable/);

  const help = run(['--help']);
  assert.equal(help.status, 0);
  assert.equal(help.stdout, 'help\n');
});
