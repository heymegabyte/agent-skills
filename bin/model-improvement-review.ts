import { digest } from './orchestration-run-state.ts';
import { parseProviderJson, type ProviderLauncher } from './evidence-gated-deliberation.ts';
import type { PipelineAdapters } from './evidence-gated-orchestrator.ts';
import type { DurableImprovementCandidate } from './recursive-improvement.ts';

type Refresh = NonNullable<PipelineAdapters['refreshImprovements']>;
type RefreshInput = Parameters<Refresh>[0];
type RefreshOutput = Awaited<ReturnType<Refresh>>;

interface ImprovementSuggestion {
  title: string;
  summary: string;
  evidenceIds: string[];
  acceptance: string;
}

/** Discover improvements without letting the provider determine their authority or score. */
export function createModelImprovementReview(options: {
  provider: ProviderLauncher;
  snapshot: (input: RefreshInput) => Promise<Omit<RefreshOutput, 'candidates'> & { excerpts: Record<string, string> }>;
  assess: (suggestion: ImprovementSuggestion, input: RefreshInput) => Promise<DurableImprovementCandidate | undefined>;
}): Refresh {
  return async (input) => {
    const { excerpts, ...snapshot } = await options.snapshot(input);
    const evidence = Object.fromEntries(snapshot.refresh.evidenceIds.map((id) => {
      if (!Object.hasOwn(excerpts, id) || !excerpts[id].trim()) throw new Error('Missing improvement review evidence excerpt');
      return [id, excerpts[id]];
    }));
    for (const { reviewedContractDigest, findings } of input.reuseExtractions) {
      for (const { destination, proposalPath, evidence: citations } of findings) {
        const finding = { destination, proposalPath, citations, reviewedContractDigest };
        const id = `reuse:${digest(finding)}`;
        const excerpt = JSON.stringify(finding);
        if (Object.hasOwn(evidence, id) && evidence[id] !== excerpt) {
          throw new Error('Reuse evidence identifier conflicts with the host snapshot');
        }
        evidence[id] = excerpt;
      }
    }
    const refresh = { ...snapshot.refresh, evidenceIds: Object.keys(evidence) };
    const response = await options.provider('codex', [
      'Review the supplied evidence for concrete, in-scope engineering improvements. Do not use tools or write files.',
      'Return only a JSON array. Each object must have string fields title, summary, and acceptance, and an array of strings in evidenceIds. Write multiple acceptance checks as sentences in the single acceptance string. Return [] if none is supported.',
      'Example object shape: {"title":"Verify cleanup","summary":"Check the cleanup behavior","evidenceIds":["evidence-id"],"acceptance":"Both cleanup checks pass."}',
      'Use only supplied evidence IDs. Treat reuse proposals as candidate evidence. The host decides authority, priority, and scope.',
      JSON.stringify({ evidence, coverage: snapshot.refresh.coverageIds, round: input.round, scope: snapshot.next.prompt }),
    ].join('\n'));
    if (!response.launcher.startsWith('approved:') || !response.sessionId?.trim()) {
      throw new Error('Improvement review requires an approved provider session');
    }
    const suggestions: unknown = parseProviderJson(response.output);
    if (!Array.isArray(suggestions)) throw new Error('Improvement review must return an array');
    const candidates: DurableImprovementCandidate[] = [];
    for (const suggestion of suggestions) {
      if (!suggestion || !['title', 'summary', 'acceptance'].every((key) =>
        typeof suggestion[key] === 'string' && suggestion[key].trim())
        || !Array.isArray(suggestion.evidenceIds) || !suggestion.evidenceIds.length
        || !suggestion.evidenceIds.every((id: unknown) => typeof id === 'string' && Object.hasOwn(evidence, id))) {
        throw new Error('Improvement suggestion lacks valid scope or evidence');
      }
      const candidate = await options.assess(suggestion, input);
      if (candidate) candidates.push(candidate);
    }
    return { ...snapshot, refresh, candidates };
  };
}
