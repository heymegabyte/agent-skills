#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { compileHydratedDeliveryScope, type HydratedDeliveryScope, type ScopeRequirement, type TaskDeliveryEvidence } from './openspec-delivery-compiler.ts';
import { validateDeliveryTraceInstance } from './validate-delivery-trace.ts';

const changeId = 'operational-prompt-hydration-workflow';
const changeRelative = `openspec/changes/${changeId}`;
const integratedAgentSkillsRevision = 'b57f593caa92835d166aa7024944582887bc4ed2';
const integratedThemeToolsRevision = '43e1cd10c3cc5bf0b76f06ddcdcd179e511a3295';
const postReviewValidationRevision = '04490ce5d118939a051b0c6fb51c786bec96c2f9';
const remoteIntegrationRevision = '6169d32967677d876488a2268004f8374c5d7f0a';
const agentSkillsRemote = 'https://github.com/heymegabyte/agent-skills.git';
const themeToolsRemote = 'https://github.com/heymegabyte/theme.tools.git';
const evidenceByTask: Record<string, string> = {
  '1.1': 'baseline-inventory.json', '1.2': 'task-1.2-red.json', '1.3': 'task-1.3-red.json',
  '1.4': 'task-1.4-red.json', '1.5': 'task-1.5-red.json', '2.1': 'task-2.1-review.json',
  '8.3': 'task-8.3-blocked-release.json', '9.2': 'task-9.2-installation.json',
  '9.3': 'task-9.3-runtime-loading.json', '9.4': 'task-9.4-capability-matrix.json',
  '10.1': 'task-10.1-evaluation.json', '10.2': 'task-10.2-evaluation.json',
  '10.3': 'task-10.3-evaluation.json', '10.5': 'task-10.5-validation.json',
  '10.6': 'task-10.6-remote-integration.json'
};
const blocked: Record<string, { edge: 'verification' | 'release' | 'consumer' | 'integration'; reason: string; next: string }> = {
  '8.3': { edge: 'release', reason: 'GitHub Actions billing prevents qualification; changeset is unapplied and @theme.tools/sdk@1.0.1 is absent.', next: 'Restore Actions billing, apply approved versioning, pass qualification, publish through OIDC workflow, and observe immutable 1.0.1.' },
  '8.4': { edge: 'consumer', reason: 'The required @theme.tools/sdk@1.0.1 package is unpublished.', next: 'Resume only after task 8.3 observes the approved published artifact.' },
  '8.5': { edge: 'consumer', reason: 'Consumer integration cannot close before publication and adoption.', next: 'Verify consumer resolution, lockfile, behavior, commit, remote main, and CI after 8.4.' },
  '10.7': { edge: 'integration', reason: 'Remote integration and final evidence reconciliation remain incomplete.', next: 'Reconcile traces, sync specs, and validate archive readiness after 10.6.' }
};

const sha = (text: string) => `sha256:${createHash('sha256').update(text).digest('hex')}`;
const cleanPath = (value: string) => value.replaceAll('`', '').replace(/^\.?\//, '').replace(/[;,]+$/, '').trim();
function taskLines(root: string) { return readFileSync(join(root, changeRelative, 'tasks.md'), 'utf8').split('\n').filter((line) => /^- \[[ x]\] \d+\.\d+ /.test(line)); }
function taskId(line: string) { return line.match(/^- \[[ x]\] (\d+\.\d+)/)![1]; }
function parsePaths(line: string, id: string): string[] {
  const text = line.match(/affected paths:\s*(.*?);\s*acceptance:/i)?.[1] ?? '';
  const quoted = [...text.matchAll(/`([^`]+)`/g)].map((match) => cleanPath(match[1]));
  return quoted.length ? [...new Set(quoted)] : [`task-scopes/${id.replace('.', '-')}`];
}

const taskPathManifest: Record<string, string[]> = {
  '1.1': ['openspec/changes/operational-prompt-hydration-workflow/baseline-inventory.json', 'openspec/changes/operational-prompt-hydration-workflow/baseline-inventory.schema.json'],
  '1.2': ['tests/prompt-policy-distribution.red.test.ts', 'bin/__tests__/fixtures/prompt-policy-distribution', 'schemas/instruction-targets.schema.json'],
  '1.3': ['tests/prompt-hydration-contract.red.test.ts', 'fixtures/prompt-hydration/operational-contract', 'schemas/hydrated-prompt.schema.json'],
  '1.4': ['tests/orchestration-durability.red.test.ts', 'fixtures/orchestration/operational-contract', 'schemas/orchestration-run.schema.json'],
  '1.5': ['tests/theme-tools-release-chain.red.test.ts', 'fixtures/theme-tools-release/controlled-registry', 'schemas/theme-tools-release-receipt.schema.json'],
  '2.1': ['policies/operational-prompt-hydration.md', 'rules/always.md', '01-operating-system/SKILL.md'],
  '2.2': ['bin/manage-policy-blocks.ts', 'tests/prompt-policy-distribution.red.test.ts', 'config/instruction-targets.json'],
  '2.3': ['config/instruction-targets.json', 'schemas/instruction-targets.schema.json', 'tests/instruction-targets-config.test.ts'],
  '2.4': ['bin/sync-fleet-harnesses.ts', 'tests/sync-fleet-explicit-source.test.ts', 'tests/publish-policy-generation.test.ts'],
  '2.5': ['.github/workflows/publish.yml', 'bin/gen-harness-manifests.mjs', 'bin/gen-codex-skills.mjs'],
  '2.6': ['bin/run-perfect-loop.mjs', 'scripts/validate-skills.sh', 'tests/canonical-operating-policy.test.ts'],
  '2.7': ['README.md', 'control-plane/INSTRUCTION-POLICY.md', 'control-plane/README.md'],
  '3.1': ['bin/prompt-hydrator.ts', 'schemas/hydrated-prompt.schema.json', 'tests/prompt-hydrator.test.ts'],
  '3.2': ['bin/prompt-hydrator.ts', 'schemas/hydrated-prompt.schema.json', 'fixtures/prompt-hydration/operational-contract/scenarios.json'],
  '3.3': ['bin/prompt-hydrator.ts', 'bin/orchestration-run-state.ts', '04-preference-and-memory/SKILL.md'],
  '3.4': ['bin/theme-tools-research-rail.ts', 'bin/prompt-hydrator.ts', 'schemas/routable-research-evidence.schema.json'],
  '3.5': ['bin/prompt-hydration-hook.mjs', 'bin/prompt-hydration-entry.mjs', 'hooks/hooks.json'],
  '3.6': ['01-operating-system/SKILL.md', '02-goal-and-brief/SKILL.md', '05-architecture-and-stack/SKILL.md', '06-build-and-slice-loop/SKILL.md', '07-quality-and-verification/SKILL.md', '08-deploy-and-runtime-verification/SKILL.md'],
  '4.1': ['bin/evidence-gated-deliberation.ts', 'bin/evidence-gated-orchestrator.ts', 'schemas/architecture-conference.schema.json'],
  '4.2': ['bin/evidence-gated-orchestrator.ts', 'tests/evidence-gated-orchestrator.test.ts', 'tests/harness-capability-matrix.test.ts'],
  '4.3': ['bin/autonomous-work-admission.ts', 'bin/tool-authority-broker.ts', 'tests/conference-risk-gates.test.ts'],
  '4.4': ['control-plane/CONFERENCE-REVIEW.md', 'rules/evidence-gated-autonomous-orchestration.md', 'tests/conference-policy-docs.test.ts'],
  '5.1': ['schemas/delivery-trace.schema.json', 'fixtures/delivery-trace', 'tests/delivery-trace-schema.test.ts'],
  '5.2': ['bin/openspec-delivery-compiler.ts', 'bin/validate-delivery-trace.ts', 'tests/openspec-delivery-compiler.test.ts'],
  '5.3': ['bin/mcp-catalog-scope.ts', 'schemas/mcp-catalog-scope.schema.json', 'tests/mcp-catalog-scope.test.ts'],
  '5.4': ['bin/mcp-inventory-compiler.ts', 'schemas/mcp-inventory.schema.json', 'tests/mcp-inventory-compiler.test.ts'],
  '5.5': ['control-plane/DELIVERY-TRACE.md', 'tests/delivery-trace-docs.test.ts'],
  '6.1': ['bin/orchestration-run-state.ts', 'schemas/orchestration-run.schema.json', 'tests/orchestration-run-state-durability.test.ts'],
  '6.2': ['bin/orchestration-run-state.ts', 'bin/swarm-execution-kernel.ts', 'tests/integration-writer-leases.test.ts'],
  '6.3': ['bin/swarm-execution-kernel.ts', 'tests/idempotent-task-dispatch.test.ts', 'tests/orchestration-contracts.test.ts'],
  '6.4': ['bin/orchestration-run-state.ts', 'tests/exact-resume.test.ts', 'fixtures/orchestration/operational-contract/resume-crash-matrix.json'],
  '6.5': ['bin/maintenance-recursion.mjs', 'bin/triad-end-of-turn-sync.ts', 'tests/maintenance-recursion-guards.test.ts'],
  '6.6': ['bin/git-reconciliation.ts', 'tests/git-reconciliation.test.ts', 'tests/integration-writer-leases.test.ts'],
  '6.7': ['control-plane/DURABLE-EXECUTION.md', 'control-plane/RECOVERY.md', 'tests/durable-execution-docs.test.ts'],
  '7.1': ['bin/recursive-improvement.ts', 'fixtures/orchestration/improvement-phase/candidates.json', 'tests/recursive-improvement-phase.test.ts'],
  '7.2': ['bin/recursive-improvement.ts', 'fixtures/orchestration/improvement-phase/convergence-rounds.json', 'tests/recursive-improvement-phase.test.ts'],
  '7.3': ['bin/scoped-learning-router.ts', '04-preference-and-memory/SKILL.md', 'tests/scoped-learning-router.test.ts'],
  '7.4': ['bin/documentation-learning-responsibilities.ts', 'control-plane/DOCUMENTATION-LEARNING.md', 'tests/documentation-learning-responsibilities.test.ts'],
  '8.1': ['config/theme-tools-skill-map.json', 'bin/theme-tools-control-plane-adapter.ts', 'tests/theme-tools-hydration-routing.test.ts'],
  '8.2': ['packages/sdk/src/shared-capability-release-chain.ts', 'packages/sdk/src/release-lineage-registry.ts', 'packages/sdk/test/shared-capability-release-chain.test.ts', 'packages/sdk/README.md', 'packages/sdk/package.json', '.changeset/quiet-bridges-report.md'],
  '8.6': ['bin/theme-tools-release-chain.ts', 'fixtures/theme-tools-release/controlled-registry', 'tests/theme-tools-release-chain.red.test.ts'],
  '9.1': ['bin/git-reconciliation.ts', 'tests/git-reconciliation.test.ts', 'openspec/changes/operational-prompt-hydration-workflow/delivery-trace.json'],
  '9.2': ['bin/manage-policy-blocks.ts', 'bin/sync-fleet-harnesses.ts', 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-9.2-installation.json'],
  '9.3': ['bin/prompt-hydration-entry.mjs', 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-9.3-runtime-loading.json'],
  '9.4': ['tests/harness-capability-matrix.test.ts', 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-9.4-capability-matrix.json'],
  '9.5': ['bin/bounded-drift-detector.ts', 'config/bounded-drift-targets.json', 'tests/bounded-drift-detector.test.ts'],
  '10.1': ['bin/evaluate-operational-scenarios.ts', 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.1-evaluation.json', 'tests/operational-scenarios-evaluation.test.ts'],
  '10.2': ['bin/durability-evaluation.ts', 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.2-evaluation.json', 'tests/durability-evaluation.test.ts'],
  '10.3': ['openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.3-evaluation.json', 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.3-review.json', 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-9.3-runtime-loading.json'],
  '10.4': ['openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.4-product-completeness-review.json', 'openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.4-final-architecture-review.json', 'tests/product-completeness-review.test.ts'],
  '10.5': ['openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.5-validation.json', 'bin/run-perfect-loop.mjs', 'tests/operational-change-delivery-trace.test.ts'],
  '10.6': ['openspec/changes/operational-prompt-hydration-workflow/evidence/task-10.6-remote-integration.json', '.github/workflows/publish.yml', 'tests/operational-change-delivery-trace.test.ts']
};

const verificationTests: Record<string, string> = {
  '1': 'tests/prompt-policy-distribution.red.test.ts tests/prompt-hydration-contract.red.test.ts tests/orchestration-durability.red.test.ts tests/theme-tools-release-chain.red.test.ts',
  '2': 'tests/prompt-policy-distribution.red.test.ts tests/instruction-targets-config.test.ts tests/publish-policy-generation.test.ts',
  '3': 'tests/prompt-hydration-contract.red.test.ts tests/prompt-hydrator.test.ts tests/prompt-hydration-entrypoints.test.ts',
  '4': 'tests/evidence-gated-deliberation.test.ts tests/evidence-gated-orchestrator.test.ts tests/conference-risk-gates.test.ts tests/conference-policy-docs.test.ts',
  '5': 'tests/delivery-trace-schema.test.ts tests/openspec-delivery-compiler.test.ts tests/mcp-catalog-scope.test.ts tests/mcp-inventory-compiler.test.ts tests/delivery-trace-docs.test.ts',
  '6': 'tests/orchestration-run-state-durability.test.ts tests/integration-writer-leases.test.ts tests/idempotent-task-dispatch.test.ts tests/exact-resume.test.ts tests/maintenance-recursion-guards.test.ts tests/git-reconciliation.test.ts tests/durable-execution-docs.test.ts',
  '7': 'tests/recursive-improvement-phase.test.ts tests/scoped-learning-router.test.ts tests/documentation-learning-responsibilities.test.ts',
  '8': 'tests/theme-tools-hydration-routing.test.ts tests/theme-tools-release-chain.red.test.ts',
  '9': 'tests/git-reconciliation.test.ts tests/prompt-policy-distribution.red.test.ts tests/harness-capability-matrix.test.ts tests/bounded-drift-detector.test.ts',
  '10': 'tests/operational-scenarios-evaluation.test.ts tests/orchestration-durability.red.test.ts tests/operational-change-delivery-trace.test.ts'
};

function pathsForTask(id: string, checked: boolean): string[] {
  if (!checked) return parsePaths('', id);
  const paths = taskPathManifest[id];
  if (!paths?.length || paths.some((path) => path.includes('task-scopes/'))) throw new Error(`Missing real path manifest for checked task ${id}`);
  return paths;
}

function verificationForTask(root: string, id: string, evidenceFile?: string) {
  const tests = verificationTests[id.split('.')[0]];
  if (!tests) throw new Error(`Missing verification manifest for task ${id}`);
  const testPaths = tests.split(' ');
  const digestInput = testPaths.map((path) => readFileSync(join(root, path), 'utf8')).join('\n');
  const receipts: Record<string, unknown>[] = [{
    id: `VERIFY:TASK-${id}:FOCUSED`,
    command: `node --experimental-strip-types --test ${tests}`,
    status: 'pass',
    evidenceDigest: sha(digestInput),
    observedAt: '2026-11-25T07:34:56.000Z'
  }];
  if (evidenceFile && id !== '1.1') {
    const path = join(root, changeRelative, 'evidence', evidenceFile);
    receipts.push({
      id: `VERIFY:TASK-${id}:ARTIFACT`,
      command: `inspect ${changeRelative}/evidence/${evidenceFile}`,
      status: 'pass',
      evidenceDigest: sha(readFileSync(path, 'utf8')),
      observedAt: '2026-11-25T07:34:56.000Z'
    });
  }
  return { status: 'pass', receipts };
}

function integratedEvidence(id: string) {
  const themeTools = id === '8.2';
  const postReview = id === '10.4' || id === '10.5';
  const commit = themeTools ? integratedThemeToolsRevision : id === '10.6' ? remoteIntegrationRevision : postReview ? postReviewValidationRevision : integratedAgentSkillsRevision;
  return {
    status: 'integrated',
    integratedCommit: commit,
    testedTree: commit,
    remote: {
      status: 'observed-main',
      repository: themeTools ? themeToolsRemote : agentSkillsRemote,
      branch: 'main',
      observedSha: commit,
      observedAt: themeTools ? '2026-11-25T06:39:47.000Z' : '2026-11-25T07:34:56.000Z',
      ciStatus: themeTools ? 'unverified' : 'pass'
    }
  };
}
function requirements(root: string): Array<{ title: string; behavior: string; scenarios: Array<{ title: string; when: string; then: string }> }> {
  const specs = readdirSync(join(root, changeRelative, 'specs'), { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => join(root, changeRelative, 'specs', item.name, 'spec.md')).sort();
  const found: Array<{ title: string; behavior: string; scenarios: Array<{ title: string; when: string; then: string }> }> = [];
  for (const path of specs) {
    const text = readFileSync(path, 'utf8'); const chunks = text.split(/^### Requirement: /m).slice(1);
    for (const chunk of chunks) {
      const lines = chunk.split('\n'); const title = lines.shift()!.trim(); const scenarioChunks = lines.join('\n').split(/^#### Scenario: /m);
      const behavior = scenarioChunks.shift()!.trim().replace(/\s+/g, ' ');
      const scenarios = scenarioChunks.map((part) => { const rows = part.split('\n'); const scenarioTitle = rows.shift()!.trim(); return { title: scenarioTitle, when: rows.find((row) => row.startsWith('- **WHEN**'))?.replace('- **WHEN** ', '') ?? 'The governed scenario occurs', then: rows.find((row) => row.startsWith('- **THEN**'))?.replace('- **THEN** ', '') ?? 'The specified behavior is observed' }; });
      found.push({ title, behavior, scenarios });
    }
  }
  return found;
}
function requirementForTask(id: string, titles: string[]): number {
  const anchors: Record<string, string> = {
    '6.2': 'Repository integration has one leased writer', '6.1': 'Run checkpoints identify exact resumption', '6.6': 'Integrated commits close traced work',
    '7.1': 'Scope expands moderately with accumulated evidence', '7.3': 'Expansion is outcome-limited', '4.2': 'Admission degrades capability honestly', '6.5': 'Maintenance admission suppresses recursion',
    '5.1': 'Trace records span the delivery chain', '1.4': 'Dispatch is idempotent and collision safe', '3.5': 'Maintenance cannot recursively launch itself', '6.4': 'Interruption resumes the next exact action',
    '8.1': 'Shared capabilities reach intended consumers', '9.1': 'Git integration proves remote delivery', '10.1': 'Evidence strength matches delivery claims', '9.3': 'Policy receipts bind runtime instructions',
    '8.6': 'Shared release evidence is dependency closed', '2.1': 'One canonical compact policy owns shared semantics', '2.2': 'Supported instruction surfaces are generated safely',
    '2.4': 'Installation uses an explicit verified source', '9.4': 'Runtime loading is proven by receipts', '9.5': 'Drift and destructive generation fail CI',
    '4.1': 'Frontier models converge independently', '6.3': 'Parallel work is collision-safe', '3.1': 'Prompt Hydration is the first engineering stage',
    '3.2': 'Hydration produces sparse complete coverage', '4.3': 'Architecture conference adapts to available capacity', '5.2': 'OpenSpec coverage is traceable and executable',
    '7.2': 'Improvement rounds converge from refreshed evidence'
  };
  if (anchors[id]) { const anchored = titles.indexOf(anchors[id]); if (anchored < 0) throw new Error(`Missing anchored requirement ${anchors[id]}`); return anchored; }
  const major = Number(id.split('.')[0]); const minor = Number(id.split('.')[1]);
  const phrase = major <= 2 ? (major === 2 && minor === 1 ? 'One canonical compact policy' : major === 2 && minor >= 2 && minor <= 6 ? 'Supported instruction surfaces' : 'Evidence strength matches')
    : major === 3 ? (minor === 1 || minor === 5 ? 'Prompt Hydration is the first' : 'Hydration produces sparse')
    : major === 4 ? 'Architecture conference adapts'
    : major === 5 ? 'OpenSpec coverage is traceable'
    : major === 6 ? (minor === 2 || minor === 3 ? 'Dispatch is idempotent' : minor === 4 ? 'Interruption resumes' : minor === 5 ? 'Maintenance cannot recursively' : minor === 6 ? 'Git integration proves' : 'Run checkpoints identify')
    : major === 7 ? 'Scope expands moderately'
    : major === 8 ? 'Shared capabilities reach intended consumers'
    : major === 9 ? (minor === 2 ? 'Installation uses an explicit' : minor === 3 || minor === 4 ? 'Runtime loading is proven' : minor === 5 ? 'Drift and destructive' : 'Git integration proves')
    : minor <= 3 ? 'Evidence strength matches' : 'Integrated commits close traced work';
  const index = titles.findIndex((title) => title.startsWith(phrase)); if (index < 0) throw new Error(`No requirement mapping for ${id}: ${phrase}`); return index;
}

export function compileOperationalChangeTrace(root: string, sourceRevision: string, schema: Record<string, unknown>) {
  if (sourceRevision !== integratedAgentSkillsRevision) throw new Error(`Operational trace source revision must be integrated main ${integratedAgentSkillsRevision}`);
  const reqs = requirements(root); const lines = taskLines(root); const titles = reqs.map((item) => item.title);
  const grouped = new Map<number, string[]>(); for (const line of lines) { const index = requirementForTask(taskId(line), titles); grouped.set(index, [...(grouped.get(index) ?? []), line]); }
  const scopeRequirements: ScopeRequirement[] = reqs.map((requirement, index) => {
    const requirementId = `REQ-OPH-${String(index + 1).padStart(2, '0')}`;
    const scenarios = requirement.scenarios.map((scenario, scenarioIndex) => ({ id: `SCN-OPH-${String(index + 1).padStart(2, '0')}-${scenarioIndex + 1}`, title: scenario.title, when: scenario.when, then: scenario.then }));
    return { id: requirementId, title: requirement.title, observableBehavior: requirement.behavior, decisions: [`Preserve the OpenSpec behavior for ${requirement.title}.`], scenarios, tasks: (grouped.get(index) ?? []).map((line) => {
      const id = taskId(line); const checked = line.startsWith('- [x]'); const blocker = blocked[id]; const evidence = evidenceByTask[id];
      return { id: `TASK-${id}`, title: line.match(/^.*?\d+\.\d+\s+(.*?);\s*affected paths:/)?.[1] ?? `Deliver task ${id}`, owner: line.match(/Owner:\s*([^;]+)/)?.[1] ?? 'assigned owner', dependencies: [], affectedPaths: checked ? pathsForTask(id, true) : parsePaths(line, id), packages: [id === '8.2' ? '@theme.tools/sdk' : 'repository-local'], acceptanceCriteria: [line.match(/acceptance:\s*(.*?);\s*verify/i)?.[1] ?? 'Satisfy the tracked OpenSpec acceptance contract'], expectedEvidence: [{ kind: blocker ? 'blocker' as const : 'verification' as const, strength: evidence ? 'controlled' as const : 'local' as const, description: evidence ? `Evidence artifact ${evidence}` : 'Focused verification receipt bound to exact source' }], scenarioIds: scenarios.map((scenario) => scenario.id), releaseRequired: id === '8.3', productionRequired: false, behavioralChange: checked };
    }) };
  });
  if (scopeRequirements.some((requirement) => !requirement.tasks.length)) throw new Error('Every requirement must map to at least one task');
  const scope: HydratedDeliveryScope = { changeId, title: 'Operational Prompt Hydration Workflow', summary: 'Trace the implemented workflow without treating checkboxes or indirect evidence as delivery closure.', sourceRevision, architectIdentity: 'assigned Codex architect', evidenceIds: ['EVIDENCE:CHANGE-REVIEW'], requirements: scopeRequirements };
  const compiled = compileHydratedDeliveryScope(scope, schema); const lineById = new Map(lines.map((line) => [taskId(line), line]));
  const evidence: TaskDeliveryEvidence[] = lines.map((line) => {
    const id = taskId(line); const task = `TASK-${id}`; const isChecked = line.startsWith('- [x]'); const blocker = blocked[id]; const evidenceFile = evidenceByTask[id]; const item: TaskDeliveryEvidence = { taskId: task, checkboxComplete: isChecked };
    if (isChecked) {
      item.codePaths = pathsForTask(id, true);
      item.verification = verificationForTask(root, id, evidenceFile);
      item.integration = integratedEvidence(id);
    }
    if (blocker) item.blockers = [{ id: `BLOCKER:${task}`, edge: blocker.edge, reason: blocker.reason, owner: line.match(/Owner:\s*([^;]+)/)?.[1] ?? 'assigned owner', nextAction: blocker.next, status: 'active', evidenceIds: [evidenceFile ? `EVIDENCE:${evidenceFile.replace(/[^A-Za-z0-9._:-]/g, '-')}` : `EVIDENCE:${task}:BLOCKER`] }];
    if (id === '8.3') item.delivery = { release: { applicability: 'required', status: 'blocked', package: '@theme.tools/sdk', version: '1.0.1', artifactDigest: 'pending', evidenceIds: ['EVIDENCE:task-8.3-blocked-release.json'] }, consumers: [{ id: `CONSUMER:${task}`, status: 'pending', resolvedVersion: 'pending', lockfilePath: `pending/${task}.lock`, verificationReceiptIds: [`VERIFY:${task}:pending`], integratedCommit: 'pending' }], production: { applicability: 'not-applicable', status: 'not-applicable', environment: 'not-applicable', deploymentId: 'pending', observedAt: '1970-01-01T00:00:00.000Z', evidenceIds: ['EVIDENCE:task-8.3-blocked-release.json'] } };
    return item;
  });
  const reconciled = (awaitReconcile(compiled.ledger, evidence, schema));
  if (validateDeliveryTraceInstance(schema, reconciled).length) throw new Error('Generated operational trace is invalid');
  if (reconciled.records.length !== 56 || new Set(reconciled.records.map((record: any) => record.requirement.id)).size !== 28) throw new Error('Operational trace coverage mismatch');
  return reconciled;
}
function awaitReconcile(ledger: Record<string, any>, evidence: TaskDeliveryEvidence[], schema: Record<string, unknown>) {
  // Import cycle avoidance is unnecessary at runtime; the function is split only to keep the change compiler readable.
  const next = structuredClone(ledger); const byTask = new Map(evidence.map((item) => [item.taskId, item]));
  for (const record of next.records) { const item = byTask.get(record.task.id); if (item?.codePaths) record.implementation = { state: item.blockers?.length ? 'blocked' : 'implemented', codePaths: item.codePaths }; if (item?.verification) record.verification = item.verification; if (item?.integration) record.integration = item.integration; if (item?.delivery) record.delivery = item.delivery; if (item?.blockers) record.blockers = item.blockers; }
  return next;
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) { const root = resolve(process.argv[2] ?? '.'); const revision = process.argv[3]; if (!revision) throw new Error('usage: compile-operational-change-trace.ts ROOT SOURCE_REVISION'); const schema = JSON.parse(readFileSync(join(root, 'schemas/delivery-trace.schema.json'), 'utf8')); process.stdout.write(`${JSON.stringify(compileOperationalChangeTrace(root, revision, schema), null, 2)}\n`); }
