import { validateSchemaInstance } from './validate-schema-instance.ts';

type Schema = Record<string, unknown>;
type TraceRecord = Record<string, any>;

export function validateDeliveryTraceInstance(schema: Schema, value: unknown): string[] {
  const errors = validateSchemaInstance(schema, value);
  if (errors.length || !value || typeof value !== 'object') return errors;
  const records = (value as { records?: TraceRecord[] }).records ?? [];
  const unique = (label: string, values: string[]) => {
    const duplicates = values.filter((item, index) => values.indexOf(item) !== index);
    if (duplicates.length) errors.push(`$.records: duplicate ${label}: ${[...new Set(duplicates)].join(', ')}`);
  };
  unique('recordId', records.map((record) => record.recordId));
  unique('task id', records.map((record) => record.task.id));
  const requirements = new Map<string, string>();
  for (const record of records) {
    const serialized = JSON.stringify(record.requirement);
    const prior = requirements.get(record.requirement.id);
    if (prior && prior !== serialized) errors.push(`$.records: conflicting requirement definition: ${record.requirement.id}`);
    else requirements.set(record.requirement.id, serialized);
  }
  for (const [index, record] of records.entries()) {
    const base = `$.records[${index}]`;
    const scenarioIds = new Set(record.requirement.scenarios.map((scenario: any) => scenario.id));
    for (const scenarioId of record.scenarioIds) if (!scenarioIds.has(scenarioId)) errors.push(`${base}.scenarioIds: unknown scenario ${scenarioId}`);
    if (record.task.dependencies.includes(record.task.id)) errors.push(`${base}.task.dependencies: task cannot depend on itself`);
    if (record.implementation.state === 'implemented' && !record.implementation.codePaths.length) errors.push(`${base}.implementation.codePaths: implemented state requires code paths`);
    if (record.verification.status === 'pass' && !record.verification.receipts.length) errors.push(`${base}.verification.receipts: pass requires receipts`);
    if (record.verification.status === 'pass' && record.verification.receipts.some((receipt: any) => receipt.status !== 'pass')) errors.push(`${base}.verification: aggregate pass conflicts with receipt status`);
    if (record.integration.status === 'integrated') {
      if (record.integration.integratedCommit !== record.integration.testedTree) errors.push(`${base}.integration: integrated commit differs from tested tree`);
      if (record.integration.remote.status !== 'observed-main' || record.integration.remote.observedSha !== record.integration.integratedCommit) errors.push(`${base}.integration.remote: remote main does not contain integrated commit`);
    }
    if (record.delivery.release.status === 'published') {
      for (const consumer of record.delivery.consumers.filter((item: any) => item.status === 'adopted')) {
        if (consumer.resolvedVersion !== record.delivery.release.version) errors.push(`${base}.delivery.consumers: adopted version differs from published release`);
      }
    }
    if (record.delivery.production.status === 'observed' && record.delivery.production.applicability !== 'required') errors.push(`${base}.delivery.production: observed production cannot be not-applicable`);
  }
  return errors;
}
