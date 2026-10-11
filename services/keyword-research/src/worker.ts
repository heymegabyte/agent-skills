/**
 * Worker entrypoint stub for the keyword-research service (vertical slice).
 *
 * This phase ships the normalized model (`types.ts`) and the deterministic
 * scorer (`scoring.ts`) only. Provider adapters (DataForSEO, GSC, Trends, SERP)
 * and real bindings (D1/R2/Queues/Cron) land in a later phase — hence the empty
 * placeholder bindings in `wrangler.jsonc`.
 *
 * The one live route exposes the scorer so the slice is demonstrable end-to-end
 * without any network egress: POST a `RawSignals` body, get a `ScoreResult`.
 */
import { scoreKeyword } from './scoring';
import { RawSignals } from './types';

export interface Env {
  // Populated in the adapter phase; intentionally empty here.
  // DB: D1Database;
  // RAW_SIGNALS: R2Bucket;
  // HARVEST_QUEUE: Queue;
}

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/health') {
      return Response.json({ status: 'ok', service: 'keyword-research', phase: 'slice' });
    }

    if (request.method === 'POST' && url.pathname === '/score') {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: 'invalid_json' }, { status: 400 });
      }
      const parsed = RawSignals.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: 'invalid_signals', issues: parsed.error.issues },
          { status: 422 },
        );
      }
      return Response.json(scoreKeyword(parsed.data));
    }

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
