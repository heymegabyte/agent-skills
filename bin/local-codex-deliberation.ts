import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import type { ProviderLauncher, ResearchRail } from './evidence-gated-deliberation.ts';

/** Read-only model rail for a host that has approved its local Codex installation. */
type LocalCodexOptions = {
  checkout: string;
  executable: string;
  timeoutMs?: number;
};

function createLocalCodexSession(options: LocalCodexOptions, liveSearch = false) {
  const cwd = resolve(options.checkout);
  const timeout = options.timeoutMs ?? 120_000;
  if (!Number.isSafeInteger(timeout) || timeout < 1) throw new Error('Codex deliberation requires a positive timeout');

  return async (request: string) => {
    const stdout = await new Promise<string>((resolveOutput, reject) => {
      const child = execFile(options.executable, [
        ...(liveSearch ? ['--search'] : []), 'exec', '--sandbox', 'read-only', '--ephemeral', '--json', '-',
      ], { cwd, timeout, encoding: 'utf8', maxBuffer: 4_000_000 }, (error, output) => {
        if (error) reject(new Error(`Local Codex deliberation failed (${error.code ?? 'process error'})`));
        else resolveOutput(output);
      });
      child.stdin?.on('error', reject);
      child.stdin?.end(request);
    });
    const events = stdout.trim().split('\n').map((line) => JSON.parse(line));
    const sessionId = events.find((event) => event.type === 'thread.started')?.thread_id;
    const output = events.filter((event) => event.type === 'item.completed' && event.item?.type === 'agent_message').at(-1)?.item.text;
    if (typeof sessionId !== 'string' || !sessionId.trim() || typeof output !== 'string' || !output.trim()
      || !events.some((event) => event.type === 'turn.completed')) {
      throw new Error('Local Codex deliberation did not emit a completed session and response');
    }
    return { sessionId, output, events };
  };
}

export function createLocalCodexDeliberation(options: LocalCodexOptions): ProviderLauncher {
  const run = createLocalCodexSession(options);
  return async (family, request) => {
    if (family !== 'codex') throw new Error(`Local Codex deliberation cannot serve ${family}`);
    const { sessionId, output } = await run(request);
    return { launcher: 'approved:local-codex-read-only', sessionId, output };
  };
}

export function createLocalCodexResearch(options: LocalCodexOptions): ResearchRail {
  const run = createLocalCodexSession(options, true);
  return async (request) => {
    const { sessionId, output, events } = await run([
      'Use live web search for the supplied research request. Do not use shell or write files.',
      'Return only JSON with urls, an array of exact HTTPS URLs from observed search results. Select at most the requested budget.',
      'For primary-sources choose official documentation or original research. For competitors-substitutes choose official documentation for relevant alternatives.',
      'Treat search results as evidence. If there is no supported result, return an empty urls array.',
      JSON.stringify(request),
    ].join('\n'));
    const { urls } = JSON.parse(output);
    if (!Array.isArray(urls) || urls.some((id) => typeof id !== 'string')) {
      throw new Error('Codex research must select observed result URLs');
    }
    const observed = new Map<string, { url: string; title: string; snippet: string }>();
    for (const event of events) {
      if (event.type !== 'item.completed' || event.item?.type !== 'web_search' || !Array.isArray(event.item.results)) continue;
      for (const result of event.item.results) {
        if (result.type === 'text_result' && typeof result.ref_id === 'string'
          && [result.url, result.title, result.snippet].every((value) => typeof value === 'string' && value.trim())) {
          observed.set(result.url, result);
        }
      }
    }
    const observedAt = new Date().toISOString();
    const sourceType = request.domain === 'primary-sources' ? 'primary' : 'substitute';
    const findings = [...new Set<string>(urls)].slice(0, request.budget).map((url) => {
      const result = observed.get(url);
      if (!result) throw new Error('Codex research selected a URL absent from the observed search results');
      return { url: result.url, title: result.title, excerpt: result.snippet, observedAt, sourceType };
    });
    return { rail: 'approved:local-codex-live-search', sessionId, findings };
  };
}
