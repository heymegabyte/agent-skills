/**
 * @module test/server-info
 * @description Pins the `initialize` handshake identity to the package manifest.
 *
 * `SERVER_INFO.version` cannot be imported from `package.json` (the JSON lives
 * outside `rootDir`), so it is duplicated in `src/index.ts`. This test is the
 * guard that keeps the copy honest: bumping `package.json` without bumping the
 * constant — or the reverse — fails here instead of shipping a server that
 * reports the wrong version to every MCP client.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { SERVER_INFO } from '../src/index.js';

/** The package manifest, resolved from the compiled test file in `dist/test`. */
const manifest = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { name: string; version: string };

describe('server info', () => {
  it('reports the package name', () => {
    assert.equal(SERVER_INFO.name, manifest.name);
  });

  it('reports the package version', () => {
    assert.equal(
      SERVER_INFO.version,
      manifest.version,
      'SERVER_INFO.version drifted from package.json — bump both',
    );
  });
});
