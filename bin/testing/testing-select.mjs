#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

export function selectTests(input) {
  const uncertain = !input.baseline || input.graph_error || input.stale_mapping || input.unknown_inputs?.length > 0;
  const selected = new Set(input.mandatory ?? []);
  for (const path of input.changed_inputs ?? []) {
    for (const test of input.mappings?.[path] ?? []) selected.add(test);
  }
  if (uncertain) for (const test of input.fallback_suite ?? []) selected.add(test);
  if (selected.size === 0) throw new Error('selection cannot be empty; add a sentinel or widen the fallback suite');
  const manifest = {
    schema_version: '1.0.0', baseline: input.baseline ?? null, head: input.head,
    application: input.application, artifact: input.artifact, graph_version: input.graph_version,
    changed_inputs: input.changed_inputs ?? [], selected: [...selected].sort(),
    reasons: uncertain ? ['uncertainty-widened', 'mandatory-sentinels'] : ['validated-mapping', 'mandatory-sentinels'],
    fallbacks: uncertain ? ['full-relevant-suite'] : [], tier: input.tier ?? 'required_ci',
    estimated_seconds: input.estimated_seconds ?? 0, mandatory: input.mandatory ?? []
  };
  return { ...manifest, digest: createHash('sha256').update(JSON.stringify(manifest)).digest('hex') };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  process.stdout.write(`${JSON.stringify(selectTests(input), null, 2)}\n`);
}
