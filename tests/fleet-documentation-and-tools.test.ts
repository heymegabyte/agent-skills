import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAcyclic, detectFileCollisions, getExecutionBatches, type DagNode } from '../bin/fleet-dag-runner.ts';
import { AgentCircuitBreaker } from '../bin/agent-circuit-breaker.ts';
import { diagnoseError } from '../bin/self-healing-runbook.ts';
import { runAgentPreflight } from '../bin/agent-preflight.ts';
import { TrajectoryGovernor } from '../bin/trajectory-governor.ts';
import { auditCodeDiff } from '../bin/evaluator-critic.ts';
import { verifyImportedSymbols } from '../bin/verify-ast-symbols.ts';
import { FleetBlackboard } from '../bin/fleet-blackboard.ts';
import { evaluateRigor } from '../bin/rigor-scorer.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOCS_AGENTS_DIR = resolve(__dirname, '..', 'docs', 'agents');
const SCHEMAS_DIR = resolve(__dirname, '..', 'schemas');

describe('Fleet Documentation & Field Manual Integrity', () => {
  it('validates that all 24 canonical agent roles possess comprehensive field manuals with Section 11', () => {
    assert.ok(existsSync(DOCS_AGENTS_DIR), 'docs/agents/ directory must exist');
    const files = readdirSync(DOCS_AGENTS_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');
    assert.equal(files.length, 24, `Expected exactly 24 field manuals in docs/agents/, found ${files.length}`);

    for (const f of files) {
      const content = readFileSync(resolve(DOCS_AGENTS_DIR, f), 'utf8');
      assert.ok(content.includes('Field Manual & Operational Doctrine'), `${f} missing Title`);
      assert.ok(content.includes('Call Sign'), `${f} missing Call Sign`);
      assert.ok(content.includes('Executive Summary & Tactical Role Profile'), `${f} missing Section 1`);
      assert.ok(content.includes('Inter-Agent Handshake Interfaces (A2A Protocol)'), `${f} missing Section 2`);
      assert.ok(content.includes('Strict Tool Permissions & Operational Boundaries'), `${f} missing Section 3`);
      assert.ok(content.includes('Standard Operating Procedure (4-Phase Kinetic Loop)'), `${f} missing Section 4`);
      assert.ok(content.includes('Top 30 Converged Tactical Capabilities'), `${f} missing Section 5`);
      assert.ok(content.includes('Self-Healing Error Recovery Runbook'), `${f} missing Section 6`);
      assert.ok(content.includes('Three-Tier Rules of Engagement (ROE)'), `${f} missing Section 7`);
      assert.ok(content.includes('PACE Communications Resilience Matrix'), `${f} missing Section 8`);
      assert.ok(content.includes('Machine-Verifiable Definition of Done'), `${f} missing Section 9`);
      assert.ok(content.includes('Operational Scenarios & Failure Mitigation Playbooks'), `${f} missing Section 10`);
      assert.ok(content.includes('RigorBench Trajectory Discipline & Evaluator-Optimizer Audit Protocols'), `${f} missing Section 11`);
    }
  });

  it('validates that docs/agents/README.md links all 24 canonical agents with command hierarchy', () => {
    const readmePath = resolve(DOCS_AGENTS_DIR, 'README.md');
    assert.ok(existsSync(readmePath), 'docs/agents/README.md must exist');
    const content = readFileSync(readmePath, 'utf8');

    assert.ok(content.includes('Fleet Command Hierarchy & Topology'));
    assert.ok(content.includes('24 Canonical Tactical Field Manuals'));
    assert.ok(content.includes('Inter-Agent Communication (A2A Protocol & 9-Line SITREP)'));
  });

  it('validates that schemas/a2a-handoff.schema.json exists and conforms to Draft 2020-12', () => {
    const schemaPath = resolve(SCHEMAS_DIR, 'a2a-handoff.schema.json');
    assert.ok(existsSync(schemaPath), 'schemas/a2a-handoff.schema.json must exist');
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));

    assert.equal(schema.type, 'object');
    assert.ok(schema.required.includes('missionId'));
    assert.ok(schema.required.includes('sender'));
    assert.ok(schema.required.includes('recipient'));
    assert.ok(schema.required.includes('proofOfLife'));
    assert.ok(schema.required.includes('artifacts'));
  });
});

describe('Fleet Autonomous Tooling & DAG Execution', () => {
  it('correctly resolves acyclic execution graphs and detects circular dependencies', () => {
    const acyclicNodes: DagNode[] = [
      { id: '1', agent: 'pm', title: 'spec', dependencies: [], inBounds: ['spec.md'], status: 'pending' },
      { id: '2', agent: 'arch', title: 'arch', dependencies: ['1'], inBounds: ['arch.md'], status: 'pending' },
      { id: '3', agent: 'be', title: 'be', dependencies: ['2'], inBounds: ['be.ts'], status: 'pending' }
    ];

    const validRes = validateAcyclic(acyclicNodes);
    assert.equal(validRes.valid, true);
    assert.deepEqual(validRes.order, ['1', '2', '3']);

    const batches = getExecutionBatches(acyclicNodes);
    assert.equal(batches.length, 3);

    // Cyclic nodes
    const cyclicNodes: DagNode[] = [
      { id: 'a', agent: 'pm', title: 'spec', dependencies: ['c'], inBounds: ['a.md'], status: 'pending' },
      { id: 'b', agent: 'arch', title: 'arch', dependencies: ['a'], inBounds: ['b.md'], status: 'pending' },
      { id: 'c', agent: 'be', title: 'be', dependencies: ['b'], inBounds: ['c.ts'], status: 'pending' }
    ];

    const cyclicRes = validateAcyclic(cyclicNodes);
    assert.equal(cyclicRes.valid, false);
    assert.ok(cyclicRes.cycle && cyclicRes.cycle.length > 0);
  });

  it('detects file collisions between parallel non-dependent tasks', () => {
    const collidingNodes: DagNode[] = [
      { id: 'task1', agent: 'fullstack', title: 'edit form', dependencies: [], inBounds: ['src/Form.tsx'], status: 'pending' },
      { id: 'task2', agent: 'ui', title: 'style form', dependencies: [], inBounds: ['src/Form.tsx'], status: 'pending' }
    ];

    const check = detectFileCollisions(collidingNodes);
    assert.equal(check.hasCollision, true);
    assert.ok(check.collisions[0].includes('Collision between task1'));
  });

  it('trips circuit breaker after 3 consecutive identical failures', () => {
    const breaker = new AgentCircuitBreaker(3);
    assert.equal(breaker.record('pnpm test', 1).tripped, false);
    assert.equal(breaker.record('pnpm test', 1).tripped, false);
    const tripRes = breaker.record('pnpm test', 1);
    assert.equal(tripRes.tripped, true);
    assert.ok(tripRes.reason?.includes('TRIPPED'));

    breaker.reset();
    assert.equal(breaker.record('pnpm test', 0).tripped, false);
  });

  it('matches error patterns in self-healing runbook and recommends recovery', () => {
    const diag = diagnoseError('Error [ERR_MODULE_NOT_FOUND]: Cannot find module "express"');
    assert.equal(diag.matched, true);
    assert.equal(diag.category, 'Missing Dependency or Broken Import');
    assert.equal(diag.autoFixable, true);
  });

  it('runs pre-flight inspection on canonical agent', () => {
    const report = runAgentPreflight('architect');
    assert.equal(report.passed, true);
    assert.ok(report.checks.some(c => c.name === 'Canonical Agent Profile' && c.passed));
    assert.ok(report.checks.some(c => c.name === 'Auftragstaktik Doctrine Compliance' && c.passed));
  });

  it('governs step budget and triggers halt at step ceiling', () => {
    const gov = new TrajectoryGovernor(5);
    assert.equal(gov.recordStep('read').allowed, true);
    assert.equal(gov.recordStep('grep').allowed, true);
    assert.equal(gov.recordStep('edit').allowed, true);
    assert.equal(gov.recordStep('test').allowed, true);
    assert.equal(gov.recordStep('verify').allowed, true);
    const halted = gov.recordStep('extra');
    assert.equal(halted.allowed, false);
    assert.ok(halted.haltReason?.includes('TRAJECTORY HALT'));
  });

  it('audits code diffs and rejects loose any and debug leftovers', () => {
    const cleanDiff = `+export function add(a: number, b: number): number { return a + b; }`;
    const cleanVerdict = auditCodeDiff(cleanDiff);
    assert.equal(cleanVerdict.approved, true);

    const dirtyDiff = `+export function add(a: any): any { console.log(a); return a; }`;
    const dirtyVerdict = auditCodeDiff(dirtyDiff);
    assert.equal(dirtyVerdict.approved, false);
    assert.ok(dirtyVerdict.findings.some(f => f.rule === 'strict-types-no-any'));
  });

  it('verifies AST imported symbols against target exports', () => {
    const testFile = resolve(__dirname, 'paramilitary-fleet.test.ts');
    const symbols = verifyImportedSymbols(testFile);
    assert.ok(symbols.length > 0);
    assert.ok(symbols.every(s => s.found));
  });

  it('posts and retrieves shared memory on the fleet blackboard', () => {
    FleetBlackboard.post('test:endpoint', 'https://api.swarml.ink', 'SRE', 'REACTION-01');
    const retrieved = FleetBlackboard.get('test:endpoint');
    assert.equal(retrieved, 'https://api.swarml.ink');
    FleetBlackboard.delete('test:endpoint');
  });

  it('computes RigorBench engineering process score and grade', () => {
    const scoreReport = evaluateRigor({
      totalSteps: 12,
      hasFailingTestFirst: true,
      hasPassingTestFinal: true,
      gitClean: true,
      hasSitrep: true,
      zeroAnyViolations: true
    });

    assert.ok(scoreReport.score >= 90);
    assert.ok(['A+', 'A'].includes(scoreReport.grade));
  });
});
