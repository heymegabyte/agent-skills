import type { ExecutionProvider, ProviderPreflight } from './swarm-execution-kernel.ts';

type Observation = { status: number; retryAfter?: string };

/** Share one in-flight observation and honor an HTTP cooldown across concurrent worker preflights. */
export function createProviderReadiness(
  probes: Partial<Record<ExecutionProvider, () => Promise<Observation>>>,
  now = Date.now,
): (provider: ExecutionProvider) => Promise<ProviderPreflight> {
  const pending = new Map<ExecutionProvider, Promise<ProviderPreflight>>();
  const cooldowns = new Map<ExecutionProvider, { until: number; result: ProviderPreflight }>();
  return async (provider) => {
    const probe = probes[provider];
    if (!probe) return { ok: true };
    const cached = cooldowns.get(provider);
    if (cached && cached.until > now()) return cached.result;
    const existing = pending.get(provider);
    if (existing) return existing;

    const current = (async (): Promise<ProviderPreflight> => {
      const { status, retryAfter } = await probe();
      if (status >= 200 && status < 300) return { ok: true };
      if (status !== 429) return { ok: false, reason: `Provider readiness returned HTTP ${status}` };
      const observedAt = now();
      const value = retryAfter?.trim() ?? '';
      const until = /^\d+$/.test(value) ? observedAt + Number(value) * 1000 : Date.parse(value);
      const retryAt = Number.isFinite(until) && until > observedAt && until <= 8.64e15
        ? new Date(until).toISOString() : undefined;
      const result = { ok: false, throttled: true, reason: 'Provider readiness returned HTTP 429', ...(retryAt ? { retryAt } : {}) };
      if (retryAt) cooldowns.set(provider, { until, result });
      return result;
    })();
    pending.set(provider, current);
    try {
      return await current;
    } finally {
      pending.delete(provider);
    }
  };
}
