import { execFile } from 'node:child_process';
import { createProviderReadiness } from './provider-readiness.ts';

/** Opt-in probe for the same LiteLLM route used by isolated OpenCode workers. */
export function createLocalDeepSeekReadiness(options: {
  /** Resolve the worker credential from the host's approved broker at probe time. */
  resolveCredential: () => string | undefined | Promise<string | undefined>;
  curlExecutable: string;
  timeoutMs?: number;
}) {
  const timeout = options.timeoutMs ?? 15_000;
  if (!Number.isSafeInteger(timeout) || timeout < 1) throw new Error('DeepSeek readiness requires a positive timeout');

  return createProviderReadiness({
    async 'opencode-deepseek'() {
      const credential = await options.resolveCredential();
      if (!credential || !/^[a-zA-Z0-9_./+=-]+$/.test(credential)) {
        throw new Error('DeepSeek readiness requires a usable LiteLLM credential');
      }
      const response = await new Promise<string>((resolve, reject) => {
        const failed = () => reject(new Error('DeepSeek readiness request failed'));
        const child = execFile(options.curlExecutable, [
          '--disable', '--config', '-', '--silent', '--proto', '=https',
          '--header', 'Content-Type: application/json',
          '--data', JSON.stringify({
            model: 'deepseek-flash', messages: [{ role: 'user', content: 'Reply OK.' }], max_tokens: 5,
          }),
          '--output', '/dev/null', '--write-out', '%{http_code}\n%header{retry-after}',
          'https://llm.megabyte.space/v1/chat/completions',
        ], { timeout, encoding: 'utf8', maxBuffer: 4096 }, (error, output) => {
          if (error) failed();
          else resolve(output);
        });
        child.stdin?.on('error', failed);
        child.stdin?.end(`header = "Authorization: Bearer ${credential}"\n`);
      });
      const [status, retryAfter] = response.trim().split('\n');
      if (!/^\d{3}$/.test(status)) throw new Error('DeepSeek readiness did not return an HTTP status');
      return { status: Number(status), retryAfter };
    },
  });
}
