import { validateSchemaInstance } from './validate-schema-instance.ts';

export interface SelectedMcpRecord extends Record<string, any> { mcpId: string; selectionStatus: 'selected' }
export interface McpInventory { schemaVersion: 1; catalogScopeId: string; selectedMcpIds: string[]; records: SelectedMcpRecord[] }

export function validateMcpInventory(schema: Record<string, unknown>, inventory: McpInventory): string[] {
  const errors = validateSchemaInstance(schema, inventory);
  if (errors.length) return errors;
  const selected = new Set(inventory.selectedMcpIds); const recordIds = inventory.records.map((record) => record.mcpId);
  if (new Set(recordIds).size !== recordIds.length) errors.push('$.records: duplicate MCP record');
  for (const id of inventory.selectedMcpIds) if (!recordIds.includes(id)) errors.push(`$.records: selected MCP is omitted: ${id}`);
  for (const id of recordIds) if (!selected.has(id)) errors.push(`$.records: unselected MCP record: ${id}`);
  for (const [index, record] of inventory.records.entries()) {
    const base = `$.records[${index}]`;
    const unknownFields = new Set(record.unknowns.map((unknown: any) => unknown.field));
    if (record.transport.kind === 'unknown' && !unknownFields.has('transport')) errors.push(`${base}.unknowns: transport unknown is not explicit`);
    if (record.installation.status === 'unknown' && !unknownFields.has('installation')) errors.push(`${base}.unknowns: installation unknown is not explicit`);
    if ((record.authentication.kind === 'unknown' || record.authentication.status === 'unknown') && !unknownFields.has('authentication')) errors.push(`${base}.unknowns: authentication unknown is not explicit`);
    if (record.updateBehavior.strategy === 'unknown' && !unknownFields.has('updateBehavior')) errors.push(`${base}.unknowns: update behavior unknown is not explicit`);
    if (record.status.connection === 'unverified' && !unknownFields.has('connection')) errors.push(`${base}.unknowns: connection uncertainty is not explicit`);
    if (record.status.execution === 'unverified' && !unknownFields.has('execution')) errors.push(`${base}.unknowns: execution uncertainty is not explicit`);
    if (record.status.execution === 'verified') {
      if (record.transport.kind === 'unknown' || record.installation.status !== 'verified' || !['verified'].includes(record.authentication.status) || record.status.connection !== 'verified') errors.push(`${base}.status.execution: falsely executable prerequisite state`);
      if (!record.verification.some((receipt: any) => receipt.kind === 'live' && receipt.outcome === 'pass')) errors.push(`${base}.status.execution: verified execution requires a passing live receipt`);
    }
    const requirementIds = new Set([...record.sharedRequirementIds, ...record.uniqueRequirementIds]);
    for (const task of record.tasks) for (const requirementId of task.requirementIds) if (!requirementIds.has(requirementId)) errors.push(`${base}.tasks: task references unknown requirement ${requirementId}`);
  }
  return errors;
}

export function compileMcpInventory(input: { catalogScopeId: string; selectedMcpIds: string[]; records: SelectedMcpRecord[] }, schema: Record<string, unknown>): McpInventory {
  if (/selection-pending/i.test(input.catalogScopeId)) throw new Error('Selection-pending scope is not a selected MCP inventory');
  const inventory: McpInventory = { schemaVersion: 1, catalogScopeId: input.catalogScopeId, selectedMcpIds: input.selectedMcpIds, records: input.records };
  const errors = validateMcpInventory(schema, inventory);
  if (errors.length) throw new Error(`Invalid MCP inventory: ${errors.join('; ')}`);
  return inventory;
}
