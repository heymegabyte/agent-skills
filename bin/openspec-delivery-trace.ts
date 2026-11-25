#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

import { compileMcpInventory } from './mcp-inventory-compiler.ts';
import { compileHydratedDeliveryScope, queryDeliveryTrace, reconcileDeliveryTrace, writeCompiledDeliveryBundle } from './openspec-delivery-compiler.ts';
import { validateDeliveryTraceInstance } from './validate-delivery-trace.ts';

const args = process.argv.slice(2);
const command = args.shift();
const option = (name: string, required = true) => {
  const index = args.indexOf(name); const value = index >= 0 ? args[index + 1] : undefined;
  if (required && !value) throw new Error(`Missing ${name}`); return value;
};
const json = (path: string) => JSON.parse(readFileSync(path, 'utf8'));
const emit = (value: unknown, output?: string) => {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (output && output !== '-') writeFileSync(output, serialized); else process.stdout.write(serialized);
};

try {
  if (command === 'compile') {
    const bundle = compileHydratedDeliveryScope(json(option('--scope')!), json(option('--schema')!));
    const output = option('--output')!; writeCompiledDeliveryBundle(output, bundle);
    emit({ status: 'compiled', output, artifacts: bundle.artifacts.map((artifact) => artifact.path), ledger: bundle.ledgerPath });
  } else if (command === 'query') {
    const ledger = json(option('--ledger')!);
    const records = queryDeliveryTrace(ledger, { requirementId: option('--requirement', false), taskId: option('--task', false) });
    emit({ count: records.length, records }, option('--output', false));
  } else if (command === 'reconcile') {
    const schema = json(option('--schema')!); const result = reconcileDeliveryTrace(json(option('--ledger')!), json(option('--evidence')!), schema);
    emit(result, option('--output', false)); if (!result.valid) process.exitCode = 1;
  } else if (command === 'validate') {
    const errors = validateDeliveryTraceInstance(json(option('--schema')!), json(option('--ledger')!)); emit({ valid: errors.length === 0, errors }); if (errors.length) process.exitCode = 1;
  } else if (command === 'validate-mcp') {
    const inventory = json(option('--inventory')!); compileMcpInventory(inventory, json(option('--schema')!)); emit({ valid: true, selectedMcpIds: inventory.selectedMcpIds, records: inventory.records.length });
  } else {
    throw new Error('Usage: openspec-delivery-trace.ts compile|query|reconcile|validate|validate-mcp [options]');
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1;
}
