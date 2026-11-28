import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import type { ProviderLauncher } from './evidence-gated-deliberation.ts';

/** Read-only model rail for a host that has approved its local Codex installation. */
export function createLocalCodexDeliberation(options: {
  checkout: string;
  executable: string;
  timeoutMs?: number;
}): ProviderLauncher {
  const cwd = resolve(options.checkout);
  const timeout = options.timeoutMs ?? 120_000;
  if (!Number.isSafeInteger(timeout) || timeout < 1) throw new Error('Codex deliberation requires a positive timeout');

  return async (family, request) => {
    if (family !== 'codex') throw new Error(`Local Codex deliberation cannot serve ${family}`);
    const stdout = await new Promise<string>((resolveOutput, reject) => {
      const child = execFile(options.executable, [
        'exec', '--sandbox', 'read-only', '--ephemeral', '--json', '-',
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
    return { launcher: 'approved:local-codex-read-only', sessionId, output };
  };
}
