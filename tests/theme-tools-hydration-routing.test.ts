import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { hydratePrompt } from '../bin/prompt-hydrator.ts';
import { validateSchemaInstance } from '../bin/validate-schema-instance.ts';

const root = join(import.meta.dirname, '..');
const fixture = JSON.parse(readFileSync(join(root, 'fixtures', 'prompt-hydration', 'operational-contract', 'theme-tools-routing.json'), 'utf8'));

function checkout(): string {
  const path = mkdtempSync(join(tmpdir(), 'theme-tools-routing-'));
  mkdirSync(join(path, 'src'), { recursive: true });
  writeFileSync(join(path, 'AGENTS.md'), '# Fixture\nUse canonical shared ownership.\n');
  writeFileSync(join(path, 'package.json'), '{"dependencies":{}}\n');
  writeFileSync(join(path, 'src', 'app.ts'), 'export const app = true;\n');
  return path;
}

test('reusable capability signals route through the canonical theme.tools map and emit a shared-owner edge', async () => {
  const hydrated = await hydratePrompt({ prompt: fixture.reusable.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' });
  assert.equal(hydrated.sharedOwnership.disposition, 'theme-tools-first');
  assert.deepEqual(hydrated.sharedOwnership.capabilityKinds, fixture.reusable.expectedKinds);
  assert.deepEqual([...hydrated.sharedOwnership.routeSkillIds].sort(), [...fixture.reusable.expectedRoutes].sort());
  for (const packageName of fixture.reusable.expectedPackages) assert.ok(hydrated.sharedOwnership.candidatePackages.includes(packageName), `missing mapped package ${packageName}`);
  assert.equal(hydrated.sharedOwnership.mappingPath, 'config/theme-tools-skill-map.json');
  assert.equal(hydrated.sharedOwnership.mappingVersion, 1);
  assert.match(hydrated.sharedOwnership.mappingDigest, /^sha256:[a-f0-9]{64}$/);
  assert.deepEqual(hydrated.sharedOwnership.traceEdge, {
    from: `hydration:${hydrated.hydrationId}`,
    to: 'repository:theme.tools',
    relation: 'shared-owner',
    status: 'pending-catalog-resolution',
    evidenceIds: hydrated.sharedOwnership.traceEdge.evidenceIds,
  });
  assert.ok(hydrated.sharedOwnership.traceEdge.evidenceIds.length);
  assert.equal(hydrated.coverageMatrix.find((row) => row.dimension === 'shared-ownership')?.applicability, 'applicable');
});

test('explicit product-specific composition stays in the consumer repository', async () => {
  const hydrated = await hydratePrompt({ prompt: fixture.local.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' });
  assert.equal(hydrated.sharedOwnership.disposition, 'consumer-local');
  assert.deepEqual(hydrated.sharedOwnership.capabilityKinds, []);
  assert.deepEqual(hydrated.sharedOwnership.routeSkillIds, []);
  assert.deepEqual(hydrated.sharedOwnership.candidatePackages, []);
  assert.equal(hydrated.sharedOwnership.traceEdge.to, fixture.local.expectedOwner);
  assert.equal(hydrated.sharedOwnership.traceEdge.relation, 'product-owner');
  assert.equal(hydrated.coverageMatrix.find((row) => row.dimension === 'shared-ownership')?.applicability, 'inapplicable');
});

test('theme.tools ownership output remains schema-valid', async () => {
  const hydrated = await hydratePrompt({ prompt: fixture.reusable.prompt, checkout: checkout(), now: '2026-11-25T00:00:00.000Z' });
  const schema = JSON.parse(readFileSync(join(root, 'schemas', 'hydrated-prompt.schema.json'), 'utf8'));
  assert.deepEqual(validateSchemaInstance(schema, hydrated), []);
});
