import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { compileMcpCatalogScope } from '../bin/mcp-catalog-scope.ts';
import { compileHydratedDeliveryScope, compileMcpCatalogRequirements } from '../bin/openspec-delivery-compiler.ts';
import { hydratePrompt } from '../bin/prompt-hydrator.ts';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const fixture = JSON.parse(readFileSync(join(root, 'fixtures', 'mcp-catalog', 'one-sentence.json'), 'utf8'));
const scopeSchema = JSON.parse(readFileSync(join(root, 'schemas', 'mcp-catalog-scope.schema.json'), 'utf8'));
const deliverySchema = JSON.parse(readFileSync(join(root, 'schemas', 'delivery-trace.schema.json'), 'utf8'));
const checkout = () => {
  const path = mkdtempSync(join(tmpdir(), 'mcp-catalog-scope-')); mkdirSync(join(path, 'src')); mkdirSync(join(path, 'openspec'));
  writeFileSync(join(path, 'AGENTS.md'), 'Hydrate first.'); writeFileSync(join(path, 'package.json'), '{"dependencies":{}}');
  return path;
};

test('one-sentence MCP catalog request expands into complete schema-valid domain scope', () => {
  const catalog = compileMcpCatalogScope(fixture.prompt, ['ev-explicit']);
  assert.deepEqual(validateSchemaInstance(scopeSchema, catalog), []);
  assert.equal(catalog.applicability, 'applicable');
  for (const capability of fixture.requiredCapabilities) assert.ok(catalog.capabilities.includes(capability), capability);
  for (const quality of fixture.requiredOperationalQualities) assert.ok(catalog.operationalQualities.includes(quality), quality);
  assert.equal(catalog.accountsAndIntegrations.applicability, 'applicable');
  assert.equal(catalog.requirements.length, fixture.requiredCapabilities.length);
  assert.ok(catalog.requirements.every((requirement) => requirement.observableBehavior && requirement.acceptanceCriteria.length >= 2 && requirement.evidenceIds.length));
  assert.equal(catalog.records[0].status, 'selection-pending');
});

test('catalog scope compiles into queryable proposed delivery requirements without claiming selected MCP execution', () => {
  const catalog = compileMcpCatalogScope(fixture.prompt, ['ev-explicit']);
  const requirements = compileMcpCatalogRequirements(catalog);
  const bundle = compileHydratedDeliveryScope({ changeId: 'mcp-catalog', title: 'MCP catalog', summary: fixture.prompt, sourceRevision: '1'.repeat(40), architectIdentity: 'codex-architect', evidenceIds: ['ev-explicit'], requirements }, deliverySchema);
  assert.equal(bundle.ledger.records.length, fixture.requiredCapabilities.length);
  assert.ok(bundle.ledger.records.every((record: any) => record.implementation.state === 'proposed' && record.verification.status === 'unverified'));
  assert.match(bundle.artifacts.find((artifact) => artifact.kind === 'spec')!.content, /MCP catalog discovery/);
  assert.equal(catalog.records.length, 1, 'task 5.3 records selection scope only; per-MCP records remain task 5.4');
});

test('Prompt Hydration exposes the catalog domain inventory and keeps non-catalog requests inapplicable', async () => {
  const hydrated = await hydratePrompt({ prompt: fixture.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' });
  assert.equal(hydrated.domainInventory.mcpCatalog.applicability, 'applicable');
  assert.ok(hydrated.domainInventory.mcpCatalog.capabilities.includes('installation-guidance'));
  assert.ok(hydrated.domainInventory.mcpCatalog.records.length);
  const narrow = await hydratePrompt({ prompt: 'Fix the header hover color', checkout: checkout(), now: '2026-11-25T00:00:00.000Z' });
  assert.equal(narrow.domainInventory.mcpCatalog.applicability, 'not-applicable');
  assert.deepEqual(narrow.domainInventory.mcpCatalog.capabilities, []);
});
