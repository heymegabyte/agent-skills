#!/usr/bin/env node
/**
 * fleet-dag-runner.ts
 * Multi-Agent Directed Acyclic Graph (DAG) Execution Engine.
 * Resolves acyclic dependency order, detects cycles, isolates workspaces,
 * and orchestrates parallel agent squad execution under Auftragstaktik.
 */

export interface DagNode {
  id: string;
  agent: string;
  title: string;
  dependencies: string[];
  inBounds: string[];
  command?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  output?: string;
}

export interface DagExecutionPlan {
  missionId: string;
  title: string;
  nodes: DagNode[];
}

export function validateAcyclic(nodes: DagNode[]): { valid: boolean; order?: string[]; cycle?: string[] } {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  const nodeMap = new Map<string, DagNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    inDegree[node.id] = 0;
    adjList[node.id] = [];
  }

  for (const node of nodes) {
    for (const dep of node.dependencies) {
      if (!nodeMap.has(dep)) {
        throw new Error(`Node ${node.id} references missing dependency: ${dep}`);
      }
      adjList[dep].push(node.id);
      inDegree[node.id]++;
    }
  }

  const queue: string[] = [];
  for (const [id, deg] of Object.entries(inDegree)) {
    if (deg === 0) queue.push(id);
  }

  const sortedOrder: string[] = [];
  while (queue.length > 0) {
    const curr = queue.shift()!;
    sortedOrder.push(curr);

    for (const neighbor of adjList[curr]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sortedOrder.length !== nodes.length) {
    // Cycle detected
    const cycleNodes = nodes.filter(n => inDegree[n.id] > 0).map(n => n.id);
    return { valid: false, cycle: cycleNodes };
  }

  return { valid: true, order: sortedOrder };
}

export function detectFileCollisions(nodes: DagNode[]): { hasCollision: boolean; collisions: string[] } {
  const collisions: string[] = [];
  const fileToNode = new Map<string, string>();

  // Check parallel execution groups (nodes that share 0 dependencies)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      // If neither depends on the other, they can execute in parallel
      const isDependent = a.dependencies.includes(b.id) || b.dependencies.includes(a.id);
      if (!isDependent) {
        for (const fileA of a.inBounds) {
          if (b.inBounds.includes(fileA)) {
            collisions.push(`Collision between ${a.id} (${a.agent}) and ${b.id} (${b.agent}) on path: ${fileA}`);
          }
        }
      }
    }
  }

  return { hasCollision: collisions.length > 0, collisions };
}

export function getExecutionBatches(nodes: DagNode[]): DagNode[][] {
  const validation = validateAcyclic(nodes);
  if (!validation.valid) {
    throw new Error(`Cannot batch cyclic DAG: ${validation.cycle?.join(' -> ')}`);
  }

  const completed = new Set<string>();
  const remaining = new Map(nodes.map(n => [n.id, n]));
  const batches: DagNode[][] = [];

  while (remaining.size > 0) {
    const currentBatch: DagNode[] = [];
    for (const [id, node] of remaining.entries()) {
      const allDepsMet = node.dependencies.every(d => completed.has(d));
      if (allDepsMet) {
        currentBatch.push(node);
      }
    }

    if (currentBatch.length === 0) {
      throw new Error('Deadlock detected during execution batching');
    }

    for (const node of currentBatch) {
      remaining.delete(node.id);
      completed.add(node.id);
    }
    batches.push(currentBatch);
  }

  return batches;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('--- Fleet DAG Runner Self-Test ---');
  const sampleNodes: DagNode[] = [
    { id: 'recon', agent: 'product-manager', title: 'User Story Recon', dependencies: [], inBounds: ['docs/prd.md'], status: 'pending' },
    { id: 'arch', agent: 'architect', title: 'System Blueprint', dependencies: ['recon'], inBounds: ['docs/arch.md'], status: 'pending' },
    { id: 'backend', agent: 'backend-engineer', title: 'API Service', dependencies: ['arch'], inBounds: ['src/api/'], status: 'pending' },
    { id: 'ui', agent: 'ui-designer', title: 'Design Tokens', dependencies: ['arch'], inBounds: ['src/ui/tokens.css'], status: 'pending' },
    { id: 'fullstack', agent: 'fullstack-engineer', title: 'Feature Slice', dependencies: ['backend', 'ui'], inBounds: ['src/components/'], status: 'pending' },
    { id: 'qa', agent: 'qa-verification', title: 'E2E Proof of Life', dependencies: ['fullstack'], inBounds: ['tests/e2e/'], status: 'pending' },
    { id: 'release', agent: 'release-manager', title: 'Canary Deployment', dependencies: ['qa'], inBounds: ['ops/release/'], status: 'pending' }
  ];

  const result = validateAcyclic(sampleNodes);
  console.log(`DAG Valid: ${result.valid}`);
  console.log(`Topological Order: ${result.order?.join(' -> ')}`);

  const collisionCheck = detectFileCollisions(sampleNodes);
  console.log(`Disjoint Battlespaces (No Collisions): ${!collisionCheck.hasCollision}`);

  const batches = getExecutionBatches(sampleNodes);
  console.log(`Batched Execution Phases (${batches.length} phases):`);
  batches.forEach((b, i) => console.log(`  Phase ${i + 1}: ${b.map(n => `${n.id} (${n.agent})`).join(', ')}`));
}
