import { createHash } from 'node:crypto';

export const MCP_CATALOG_CORE_CAPABILITIES = ['discovery', 'categories', 'search-filter', 'detail-pages', 'ingestion', 'deduplication', 'updates', 'submissions', 'moderation', 'administration', 'installation-guidance'] as const;
export type McpCatalogCapability = typeof MCP_CATALOG_CORE_CAPABILITIES[number] | 'accounts-integrations' | 'operational-qualities';
export interface McpCatalogScopeRequirement { capability: McpCatalogCapability; requirementId: string; taskId: string; observableBehavior: string; acceptanceCriteria: string[]; evidenceIds: string[] }
export interface McpCatalogScope {
  applicability: 'applicable' | 'not-applicable'; capabilities: McpCatalogCapability[];
  accountsAndIntegrations: { applicability: 'applicable' | 'inapplicable'; basis: string };
  operationalQualities: string[]; requirements: McpCatalogScopeRequirement[];
  records: Array<{ selectionId: string; status: 'selection-pending'; scopeRequirementIds: string[] }>;
}
const id = (prefix: string, value: string) => `${prefix}-${createHash('sha256').update(value).digest('hex').slice(0, 12)}`;
const behaviors: Record<McpCatalogCapability, string> = {
  discovery: 'Visitors can discover trustworthy MCPs through browsable, evidence-backed catalog entry points.',
  categories: 'Visitors can browse stable categories and see category membership consistently across listing and detail views.',
  'search-filter': 'Visitors can search and combine filters with deterministic URLs, empty states, and accessible result counts.',
  'detail-pages': 'Each MCP detail page explains purpose, provenance, transports, installation context, and current catalog status.',
  ingestion: 'Operators can ingest candidate MCP metadata with provenance and validation receipts before publication.',
  deduplication: 'Ingestion detects canonical duplicates and preserves an auditable merge or rejection decision.',
  updates: 'Catalog entries refresh from their provenance without discarding moderation history or stable identifiers.',
  submissions: 'Contributors can submit MCP candidates and observe validation and review state.',
  moderation: 'Moderators can approve, reject, request changes, and retain attributable decisions.',
  administration: 'Administrators can manage taxonomy, sources, policies, and operational exceptions with audit evidence.',
  'installation-guidance': 'Visitors receive transport- and environment-appropriate installation guidance without fabricated executability.',
  'accounts-integrations': 'Authenticated contributors, moderators, and administrators receive least-privilege account and integration journeys.',
  'operational-qualities': 'The catalog defines accessibility, performance, security, reliability, freshness, observability, moderation auditability, maintenance, and cost expectations.',
};
export function compileMcpCatalogScope(prompt: string, evidenceIds: string[]): McpCatalogScope {
  const applicable = /\bmcp\b[\s\S]*\bcatalog\b|\bcatalog\b[\s\S]*\bmcp\b/i.test(prompt);
  if (!applicable) return { applicability: 'not-applicable', capabilities: [], accountsAndIntegrations: { applicability: 'inapplicable', basis: 'The request does not ask for an MCP catalog.' }, operationalQualities: [], requirements: [], records: [] };
  const accountsApplicable = /\b(submission|submit|moderation|moderator|admin|account|sign[- ]?in|integration)\b/i.test(prompt);
  const capabilities: McpCatalogCapability[] = [...MCP_CATALOG_CORE_CAPABILITIES, ...(accountsApplicable ? ['accounts-integrations' as const] : []), 'operational-qualities'];
  const requirements = capabilities.map((capability): McpCatalogScopeRequirement => ({ capability, requirementId: id('REQ-MCP', capability), taskId: id('TASK-MCP', capability), observableBehavior: behaviors[capability], acceptanceCriteria: [`The ${capability} behavior is observable through a controlled product scenario.`, `Failure, empty, loading, permission, and recovery states applicable to ${capability} are verified.`], evidenceIds }));
  return {
    applicability: 'applicable', capabilities,
    accountsAndIntegrations: { applicability: accountsApplicable ? 'applicable' : 'inapplicable', basis: accountsApplicable ? 'Submissions, moderation, or administration require authenticated least-privilege roles and integrations.' : 'The request does not include contributor, moderator, administrator, or connected-account behavior.' },
    operationalQualities: ['accessibility', 'performance', 'security', 'reliability', 'data-freshness', 'observability', 'moderation-auditability', 'maintenance', 'cost'],
    requirements,
    records: [{ selectionId: id('MCP-SELECTION', prompt), status: 'selection-pending', scopeRequirementIds: requirements.map((requirement) => requirement.requirementId) }],
  };
}
