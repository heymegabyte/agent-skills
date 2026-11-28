import type { OpenSpecCompilerInput, PipelineAdapters } from './evidence-gated-orchestrator.ts';
import type { createModelOpenSpecPlanner } from './model-openspec-planner.ts';
import { validateTaskGraph, verifyArchitectAssignment, type CompiledArtifact, type ExecutionNode } from './swarm-execution-kernel.ts';

type Plan = Awaited<ReturnType<ReturnType<typeof createModelOpenSpecPlanner>>>;
type ApprovedChange = {
  assignment: OpenSpecCompilerInput['assignment'];
  execution: Omit<ExecutionNode, 'id' | 'title' | 'ownedPaths' | 'dependsOn'>;
};

export function createModelOpenSpecCompiler(options: {
  plan: ReturnType<typeof createModelOpenSpecPlanner>;
  approve: (input: OpenSpecCompilerInput, plan: Plan) => Promise<ReadonlyMap<string, ApprovedChange>>;
  materialize: (checkout: string, artifacts: CompiledArtifact[], sessionId: string) => Promise<void>;
}): PipelineAdapters['compileOpenSpec'] {
  return async (input) => {
    const plan = await options.plan(input);
    const approvals = await options.approve(input, structuredClone(plan));
    if (approvals.size !== plan.changes.length) throw new Error('OpenSpec plan requires host approval for every change');
    const changes = plan.changes.map((draft) => {
      const approved = approvals.get(draft.changeId);
      if (!approved) throw new Error(`Missing host approval for ${draft.changeId}`);
      verifyArchitectAssignment(approved.assignment, draft.changeId, input.assignment.authoritySourceDigest);
      if (approved.assignment.architectFamily !== input.assignment.architectFamily
        || approved.assignment.architectIdentity !== input.assignment.architectIdentity) {
        throw new Error(`OpenSpec draft for ${draft.changeId} must retain the architect that authored it`);
      }
      const { requirements, scenarios, traceabilityIds } = draft;
      const root = `openspec/changes/${draft.changeId}`;
      const artifacts = (['proposal', 'design', 'spec', 'tasks'] as const).map((kind) => ({
        kind, path: kind === 'spec' ? `${root}/specs/${draft.changeId}/spec.md` : `${root}/${kind}.md`,
        content: draft[kind], requirements, scenarios, traceabilityIds,
      }));
      const node: ExecutionNode = {
        ...approved.execution, id: draft.changeId, title: draft.title, ownedPaths: draft.ownedPaths, dependsOn: [],
      };
      return { assignment: approved.assignment, artifacts, nodes: [node], dependsOn: draft.dependsOn };
    });
    const [primary, ...additionalChanges] = changes;
    if (primary.assignment.receiptDigest !== input.assignment.receiptDigest) {
      throw new Error('OpenSpec host approval must retain the primary architect assignment');
    }
    validateTaskGraph(changes.map(({ nodes: [node], dependsOn }) => ({ ...node, dependsOn })));
    await options.materialize(input.checkout, changes.flatMap(({ artifacts }) => artifacts), plan.sessionId);
    return { ...primary, additionalChanges };
  };
}
