import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import type { CompiledArtifact } from './swarm-execution-kernel.ts';
import type { McpCatalogScope } from './mcp-catalog-scope.ts';
import { validateDeliveryTraceInstance } from './validate-delivery-trace.ts';

export interface ScopeScenario { id: string; title: string; when: string; then: string }
export interface ScopeEvidenceExpectation { kind: 'behavior' | 'verification' | 'commit' | 'remote' | 'release' | 'consumer' | 'production' | 'blocker'; strength: 'controlled' | 'local' | 'installed' | 'remote' | 'published' | 'consumer-adopted' | 'production-observed'; description: string }
export interface ScopeTask {
  id: string;
  title: string;
  owner: string;
  dependencies: string[];
  affectedPaths: string[];
  packages: string[];
  acceptanceCriteria: string[];
  expectedEvidence: ScopeEvidenceExpectation[];
  scenarioIds: string[];
  releaseRequired: boolean;
  productionRequired: boolean;
  behavioralChange?: boolean;
  documentationPaths?: string[];
  learningScope?: string;
}
export interface ScopeRequirement { id: string; title: string; observableBehavior: string; scenarios: ScopeScenario[]; decisions: string[]; tasks: ScopeTask[] }
export interface HydratedDeliveryScope { changeId: string; title: string; summary: string; sourceRevision: string; architectIdentity: string; evidenceIds: string[]; requirements: ScopeRequirement[] }
export interface CompiledDeliveryBundle { artifacts: CompiledArtifact[]; ledgerPath: 'delivery-trace.json'; ledger: Record<string, any> }
export interface TaskDeliveryEvidence {
  taskId: string;
  checkboxComplete?: boolean;
  codePaths?: string[];
  verification?: Record<string, any>;
  integration?: Record<string, any>;
  delivery?: Record<string, any>;
  blockers?: Record<string, any>[];
}

export function compileMcpCatalogRequirements(catalog: McpCatalogScope): ScopeRequirement[] {
  if (catalog.applicability !== 'applicable') return [];
  return catalog.requirements.map((requirement): ScopeRequirement => ({
    id: requirement.requirementId,
    title: `MCP catalog ${requirement.capability}`,
    observableBehavior: requirement.observableBehavior,
    decisions: [`Treat ${requirement.capability} as an explicit product capability with its own observable states and evidence.`],
    scenarios: [{ id: `SCN-${requirement.taskId.slice(5)}`, title: `${requirement.capability} works end to end`, when: `A permitted actor enters the ${requirement.capability} journey`, then: requirement.observableBehavior }],
    tasks: [{
      id: requirement.taskId, title: `Implement and verify MCP catalog ${requirement.capability}`, owner: requirement.capability === 'operational-qualities' ? 'operations and verification owner' : 'catalog domain owner', dependencies: [],
      affectedPaths: [`src/catalog/${requirement.capability}/`], packages: ['repository-local'], acceptanceCriteria: requirement.acceptanceCriteria,
      expectedEvidence: [{ kind: 'behavior', strength: 'controlled', description: `Controlled ${requirement.capability} scenario evidence` }, { kind: 'verification', strength: 'local', description: `Focused ${requirement.capability} checks pass` }],
      scenarioIds: [`SCN-${requirement.taskId.slice(5)}`], releaseRequired: false, productionRequired: true,
    }],
  }));
}

const pendingAt = '1970-01-01T00:00:00.000Z';
const safe = (value: string) => {
  if (!/^[A-Za-z][A-Za-z0-9._:-]{2,127}$/.test(value)) throw new Error(`Invalid trace identifier: ${value}`);
  return value;
};
const markdown = (value: string) => value.replace(/[\r\n]+/g, ' ').trim();

function proposedRecord(requirement: ScopeRequirement, task: ScopeTask) {
  const scenarios = requirement.scenarios.filter((scenario) => task.scenarioIds.includes(scenario.id));
  if (!scenarios.length || scenarios.length !== task.scenarioIds.length) throw new Error(`Task ${task.id} has incomplete or unknown scenario traceability`);
  const expectedIds = task.expectedEvidence.map((_, index) => `EVIDENCE:${task.id}:${index + 1}`);
  return {
    recordId: `TRACE:${requirement.id}:${task.id}`,
    requirement: { id: requirement.id, observableBehavior: requirement.observableBehavior, scenarios: scenarios.map(({ id, when, then }) => ({ id, when, then })) },
    scenarioIds: task.scenarioIds,
    task: { id: task.id, owner: task.owner, dependencies: task.dependencies, affectedPaths: task.affectedPaths, packages: task.packages, acceptanceCriteria: task.acceptanceCriteria, expectedEvidence: task.expectedEvidence },
    implementation: { state: 'proposed', codePaths: [] },
    verification: { status: 'unverified', receipts: [] },
    integration: { status: 'pending', integratedCommit: 'pending', testedTree: 'pending', remote: { status: 'pending', repository: 'pending', branch: 'main', observedSha: 'pending', observedAt: pendingAt, ciStatus: 'unverified' } },
    delivery: {
      release: { applicability: task.releaseRequired ? 'required' : 'not-applicable', status: task.releaseRequired ? 'pending' : 'not-applicable', package: task.packages.join(','), version: 'pending', artifactDigest: 'pending', evidenceIds: expectedIds },
      consumers: [{ id: `CONSUMER:${task.id}`, status: task.releaseRequired ? 'pending' : 'not-applicable', resolvedVersion: 'pending', lockfilePath: `pending/${task.id}.lock`, verificationReceiptIds: [`VERIFY:${task.id}:pending`], integratedCommit: 'pending' }],
      production: { applicability: task.productionRequired ? 'required' : 'not-applicable', status: task.productionRequired ? 'pending' : 'not-applicable', environment: task.productionRequired ? 'production' : 'not-applicable', deploymentId: 'pending', observedAt: pendingAt, evidenceIds: expectedIds },
    },
    blockers: [],
  };
}

export function compileHydratedDeliveryScope(scope: HydratedDeliveryScope, schema: Record<string, unknown>): CompiledDeliveryBundle {
  safe(scope.changeId);
  if (!/^[a-f0-9]{40}$/.test(scope.sourceRevision)) throw new Error('Hydrated scope requires an exact 40-character source revision');
  if (!scope.requirements.length) throw new Error('Hydrated scope requires at least one requirement');
  const requirementIds = new Set<string>(); const taskIds = new Set<string>(); const records: any[] = [];
  for (const requirement of scope.requirements) {
    safe(requirement.id);
    if (requirementIds.has(requirement.id)) throw new Error(`Duplicate requirement id: ${requirement.id}`);
    requirementIds.add(requirement.id);
    if (!requirement.scenarios.length || !requirement.tasks.length) throw new Error(`Requirement ${requirement.id} requires scenarios and tasks`);
    const coveredScenarios = new Set<string>();
    for (const task of requirement.tasks) {
      safe(task.id);
      if (taskIds.has(task.id)) throw new Error(`Duplicate task id: ${task.id}`);
      taskIds.add(task.id); task.scenarioIds.forEach((scenarioId) => coveredScenarios.add(scenarioId)); records.push(proposedRecord(requirement, task));
    }
    for (const scenario of requirement.scenarios) if (!coveredScenarios.has(scenario.id)) throw new Error(`Scenario ${scenario.id} is not traced to a task`);
  }
  for (const record of records) for (const dependency of record.task.dependencies) if (!taskIds.has(dependency)) throw new Error(`Task ${record.task.id} references unknown dependency: ${dependency}`);
  const proposal = `# Proposal: ${markdown(scope.title)}\n\n**Architect Role:** assigned (${markdown(scope.architectIdentity)})\n\n## Why\n\n${markdown(scope.summary)}\n\n## What Changes\n\n${scope.requirements.map((requirement) => `- ${requirement.id}: ${markdown(requirement.observableBehavior)}`).join('\n')}\n`;
  const design = `# Design\n\n**Architect Role:** assigned (${markdown(scope.architectIdentity)})\n\n## Context\n\n${markdown(scope.summary)}\n\n## Decisions\n\n${scope.requirements.flatMap((requirement) => requirement.decisions.map((decision) => `- **${requirement.id}:** ${markdown(decision)}`)).join('\n')}\n`;
  const spec = `# Specification\n\n${scope.requirements.map((requirement) => `### Requirement: ${requirement.id} — ${markdown(requirement.title)}\n${markdown(requirement.observableBehavior)}\n\n${requirement.scenarios.map((scenario) => `#### Scenario: ${scenario.id} — ${markdown(scenario.title)}\n- **WHEN** ${markdown(scenario.when)}\n- **THEN** ${markdown(scenario.then)}`).join('\n\n')}`).join('\n\n')}\n`;
  const tasks = `# Tasks\n\n${scope.requirements.flatMap((requirement) => requirement.tasks.map((task) => `- [ ] [${task.id}] ${markdown(task.title)} (requirements: ${requirement.id}; scenarios: ${task.scenarioIds.join(', ')})\n  - Owner: ${markdown(task.owner)}\n  - Dependencies: ${task.dependencies.length ? task.dependencies.join(', ') : 'none'}\n  - Paths: ${task.affectedPaths.join(', ')}\n  - Packages: ${task.packages.join(', ')}\n  - Acceptance: ${task.acceptanceCriteria.map(markdown).join('; ')}\n  - Expected evidence: ${task.expectedEvidence.map((item) => `${item.kind}/${item.strength}`).join(', ')}\n  - Concurrent documentation: update ${task.documentationPaths?.join(', ') || 'nearest canonical skill/control-plane guidance'}, remove obsolete guidance, and verify executable examples\n  - Concurrent learning: route through ${task.learningScope || 'the scoped learning router'} with provenance/confidence/revision or a verified-no-change receipt`)).join('\n')}\n`;
  const requirements = [...requirementIds]; const scenarios = scope.requirements.flatMap((requirement) => requirement.scenarios.map((scenario) => scenario.id)); const traceabilityIds = [...taskIds];
  const artifacts: CompiledArtifact[] = [
    { kind: 'proposal', path: 'proposal.md', content: proposal, requirements, scenarios, traceabilityIds },
    { kind: 'design', path: 'design.md', content: design, requirements, scenarios, traceabilityIds },
    { kind: 'spec', path: `specs/${scope.changeId}/spec.md`, content: spec, requirements, scenarios, traceabilityIds },
    { kind: 'tasks', path: 'tasks.md', content: tasks, requirements, scenarios, traceabilityIds },
  ];
  const ledger = { schemaVersion: 1, traceId: `TRACE:${scope.changeId}`, changeId: scope.changeId, sourceRevision: scope.sourceRevision, records };
  const errors = validateDeliveryTraceInstance(schema, ledger);
  if (errors.length) throw new Error(`Compiled delivery trace is invalid: ${errors.join('; ')}`);
  return { artifacts, ledgerPath: 'delivery-trace.json', ledger };
}

export function writeCompiledDeliveryBundle(output: string, bundle: CompiledDeliveryBundle): void {
  for (const artifact of bundle.artifacts) {
    const target = join(output, artifact.path); mkdirSync(dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.tmp`; writeFileSync(temporary, artifact.content); renameSync(temporary, target);
  }
  const ledgerTarget = join(output, bundle.ledgerPath); mkdirSync(dirname(ledgerTarget), { recursive: true });
  const temporary = `${ledgerTarget}.${process.pid}.tmp`; writeFileSync(temporary, `${JSON.stringify(bundle.ledger, null, 2)}\n`); renameSync(temporary, ledgerTarget);
}

export function reconcileDeliveryTrace(ledger: Record<string, any>, evidence: TaskDeliveryEvidence[], schema: Record<string, unknown>) {
  const next = structuredClone(ledger);
  const byTask = new Map(evidence.map((item) => [item.taskId, item]));
  const completion: Array<{ requirementId: string; taskId: string; checkboxComplete: boolean; complete: boolean; missingEdges: string[] }> = [];
  for (const record of next.records) {
    const observed = byTask.get(record.task.id);
    if (observed?.codePaths) record.implementation = { state: 'implemented', codePaths: observed.codePaths };
    if (observed?.verification) record.verification = observed.verification;
    if (observed?.integration) record.integration = observed.integration;
    if (observed?.delivery) record.delivery = observed.delivery;
    if (observed?.blockers) record.blockers = observed.blockers;
    const missingEdges: string[] = [];
    if (record.implementation.state !== 'implemented' || !record.implementation.codePaths.length) missingEdges.push('code');
    if (record.verification.status !== 'pass' || !record.verification.receipts.length) missingEdges.push('verification');
    if (record.integration.status !== 'integrated' || record.integration.integratedCommit !== record.integration.testedTree || record.integration.remote.status !== 'observed-main' || record.integration.remote.observedSha !== record.integration.integratedCommit) missingEdges.push('integrated-remote-commit');
    if (record.delivery.release.applicability === 'required' && record.delivery.release.status !== 'published') missingEdges.push('release');
    if (record.delivery.release.applicability === 'required' && record.delivery.consumers.some((consumer: any) => consumer.status !== 'adopted' || consumer.resolvedVersion !== record.delivery.release.version)) missingEdges.push('consumer');
    if (record.delivery.production.applicability === 'required' && record.delivery.production.status !== 'observed') missingEdges.push('production');
    if (record.blockers.some((blocker: any) => blocker.status === 'active')) missingEdges.push('blocker');
    completion.push({ requirementId: record.requirement.id, taskId: record.task.id, checkboxComplete: observed?.checkboxComplete === true, complete: missingEdges.length === 0, missingEdges });
  }
  const errors = validateDeliveryTraceInstance(schema, next);
  return { ledger: next, completion, valid: errors.length === 0, errors, complete: errors.length === 0 && completion.every((item) => item.complete) };
}

export function queryDeliveryTrace(ledger: Record<string, any>, query: { requirementId?: string; taskId?: string }) {
  return ledger.records.filter((record: any) => (!query.requirementId || record.requirement.id === query.requirementId) && (!query.taskId || record.task.id === query.taskId));
}
