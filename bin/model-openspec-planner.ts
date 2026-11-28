import { parseProviderJson } from './evidence-gated-deliberation.ts';
import { parseOpenSpecArtifacts, validateOwnershipGraph } from './swarm-execution-kernel.ts';
import type { OpenSpecCompilerInput } from './evidence-gated-orchestrator.ts';

interface ArchitectDraft {
  changeId: string;
  title: string;
  dependsOn: string[];
  ownedPaths: string[];
  proposal: string;
  design: string;
  spec: string;
  tasks: string;
}

type ArchitectSession = { launcher: string; sessionId?: string; output: string };

/** Obtain a plan from the assigned architect before the host materializes its artifacts. */
export function createModelOpenSpecPlanner(
  launch: (assignment: OpenSpecCompilerInput['assignment'], prompt: string) => Promise<ArchitectSession>,
) {
  return async (input: OpenSpecCompilerInput) => {
    const { checkout: _checkout, ...brief } = input;
    const response = await launch(input.assignment, [
      'Design the OpenSpec changes for the supplied request and evidence. Return JSON only. Do not use tools or write files.',
      'Return an object with a changes array. Each change has changeId, title, dependsOn (array of change IDs), ownedPaths (array of repository-relative paths), proposal, design, spec, and tasks (Markdown strings).',
      'Use the supplied changeId for the first change. Split independent outcomes into separate changes with distinct ownership and verifiable acceptance. Give each change one owner for all tasks. Include every admitted improvement in the spec and checklist with its exact requirement and task identifiers.',
      'Use these exact Markdown forms. Proposal sections: ## Why and ## What Changes. Design declaration: **Architect Role:** assigned. Design sections: ## Context, ## Goals / Non-Goals, and ## Decisions. Give each section substantive text.',
      'In spec use ### Requirement: <requirement> and #### Scenario: <scenario>. In tasks use one checklist line per task: - [ ] [task-id] Description (requirements: <requirement>; scenarios: <scenario>). Include a checklist line whose task-id equals the changeId for the whole-change owner. End the line at the closing parenthesis, with no trailing punctuation. Match requirement and scenario titles exactly, using comma-separated lists when needed.',
      'Every requirement needs at least one nested scenario. Trace every requirement and scenario to a checklist line. Keep implementation notes with the applicable requirement instead of creating untested requirements. For a documentation deliverable that is a requirement, include an observable review scenario and trace it to a checklist line.',
      'The host assigns authority, provider, and execution settings and materializes validated artifacts.',
      JSON.stringify(brief),
    ].join('\n'));
    if (!response.launcher.startsWith('approved:') || !response.sessionId?.trim()) {
      throw new Error('OpenSpec planning requires an approved architect session');
    }
    const plan: unknown = parseProviderJson(response.output);
    if (!plan || typeof plan !== 'object' || !('changes' in plan) || !Array.isArray(plan.changes)
      || plan.changes[0]?.changeId !== input.changeId) {
      throw new Error('OpenSpec plan must start with the assigned change');
    }
    const changes: ArchitectDraft[] = [];
    const ids = new Set<string>();
    for (const change of plan.changes) {
      if (!change || !['changeId', 'title', 'proposal', 'design', 'spec', 'tasks'].every((key) =>
        typeof change[key] === 'string' && change[key].trim())
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(change.changeId) || ids.has(change.changeId)
        || !['dependsOn', 'ownedPaths'].every((key) => Array.isArray(change[key])
          && change[key].every((value: unknown) => typeof value === 'string' && value.trim()))
        || !change.ownedPaths.length) {
        throw new Error('OpenSpec plan contains a malformed or duplicate change');
      }
      const { changeId, title, dependsOn, ownedPaths, proposal, design, spec, tasks } = change;
      ids.add(changeId);
      changes.push({ changeId, title, dependsOn, ownedPaths, proposal, design, spec, tasks });
    }
    for (const { ownedPaths } of changes) {
      if (ownedPaths.some((path: string) =>
        path.includes('\\') || path.includes('\0') || path.split('/').some((part) => !part || part === '.' || part === '..'))) {
        throw new Error('OpenSpec plan contains an unsafe owned path');
      }
    }
    validateOwnershipGraph(changes.map(({ changeId, dependsOn, ownedPaths }) => ({ id: changeId, dependsOn, ownedPaths })));
    const tracedChanges = changes.map((change) => {
      const artifacts = (['proposal', 'design', 'spec', 'tasks'] as const).map((kind) => ({
        kind, path: `${kind}.md`, content: change[kind], requirements: [], scenarios: [], traceabilityIds: [],
      }));
      const parsed = parseOpenSpecArtifacts(artifacts, [{ id: change.changeId }]);
      const { requirements, scenarios, traceabilityIds } = parsed[0];
      return { ...change, requirements, scenarios, traceabilityIds };
    });
    for (const improvement of input.admittedImprovements ?? []) {
      const heading = `${improvement.id} — ${improvement.title}`;
      if (!tracedChanges.some(({ requirements, traceabilityIds }) =>
        requirements.includes(heading) && improvement.tasks.every(({ id }) => traceabilityIds.includes(id)))) {
        throw new Error(`Admitted improvement ${improvement.id} is missing from the OpenSpec drafts`);
      }
    }
    return { changes: tracedChanges, launcher: response.launcher, sessionId: response.sessionId };
  };
}
