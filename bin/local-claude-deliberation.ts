import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import type { ProviderLauncher } from './evidence-gated-deliberation.ts';

/** Read-only inference through the host-approved subscription launcher. */
export function createLocalClaudeDeliberation(options: {
  checkout: string;
  subscriptionLauncher: string;
  timeoutMs?: number;
}): ProviderLauncher {
  const timeout = options.timeoutMs ?? 120_000;
  if (!Number.isSafeInteger(timeout) || timeout < 1) throw new Error('Claude deliberation requires a positive timeout');
  return async (family, request) => {
    if (family !== 'claude') throw new Error(`Local Claude deliberation cannot serve ${family}`);
    const stdout = await new Promise<string>((resolveOutput, reject) => {
      const child = execFile(resolve(options.subscriptionLauncher), [
        'claude', '--print', '--output-format', 'json', '--tools', '',
        '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--setting-sources', '',
        '--disable-slash-commands', '--no-chrome', '--no-session-persistence',
      ], { cwd: resolve(options.checkout), timeout, encoding: 'utf8', maxBuffer: 4_000_000 }, (error, output) => {
        if (error) reject(new Error(`Local Claude deliberation failed (${error.code ?? 'process error'})`));
        else resolveOutput(output);
      });
      child.stdin?.on('error', reject);
      child.stdin?.end(request);
    });
    const result = JSON.parse(stdout);
    if (result?.type !== 'result' || result.subtype !== 'success' || result.is_error !== false
      || typeof result.session_id !== 'string' || !result.session_id.trim()
      || typeof result.result !== 'string' || !result.result.trim()) {
      throw new Error('Local Claude deliberation did not emit a completed session and response');
    }
    return { launcher: 'approved:local-claude-subscription', sessionId: result.session_id, output: result.result };
  };
}
