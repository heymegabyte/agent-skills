import type { OpenSpecCompilerInput } from './evidence-gated-orchestrator.ts';

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
      'The host assigns authority, provider, and execution settings and materializes validated artifacts.',
      JSON.stringify(brief),
    ].join('\n'));
    if (!response.launcher.startsWith('approved:') || !response.sessionId?.trim()) {
      throw new Error('OpenSpec planning requires an approved architect session');
    }
    const plan: unknown = JSON.parse(response.output);
    if (!plan || typeof plan !== 'object' || !('changes' in plan) || !Array.isArray(plan.changes)
      || plan.changes[0]?.changeId !== input.changeId) {
      throw new Error('OpenSpec plan must start with the assigned change');
    }
    const changes = plan.changes;
    const ids = new Set<string>();
    for (const change of changes) {
      if (!change || !['changeId', 'title', 'proposal', 'design', 'spec', 'tasks'].every((key) =>
        typeof change[key] === 'string' && change[key].trim())
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(change.changeId) || ids.has(change.changeId)
        || !['dependsOn', 'ownedPaths'].every((key) => Array.isArray(change[key])
          && change[key].every((value: unknown) => typeof value === 'string' && value.trim()))
        || !change.ownedPaths.length) {
        throw new Error('OpenSpec plan contains a malformed or duplicate change');
      }
      ids.add(change.changeId);
    }
    if (changes.some(({ changeId, dependsOn }) => dependsOn.some((id: string) => id === changeId || !ids.has(id)))) {
      throw new Error('OpenSpec plan contains an invalid change dependency');
    }
    return { changes, launcher: response.launcher, sessionId: response.sessionId };
  };
}
