// growth-cron Worker — fires ST-1/ST-2 via the OpenClaw/run-the-loop runner. Session-independent.
// The Worker only TRIGGERS; generation + the quality gates run in the runner (blog-autopublish +
// yoast-seo-compliance + verification-loop). Idempotency is enforced by the task ledger downstream.
export interface Env {
  PRODUCT: string;
  TZ: string;
  GROWTH_RUNNER_URL: string;   // secret
  GROWTH_RUNNER_TOKEN: string; // secret
}

function etHour(now: Date, tz: string): number {
  // DST-safe local hour so the daily job lands ~08:00 ET regardless of EDT/EST.
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", hour12: false }).format(now));
}

async function trigger(env: Env, task: "daily-article" | "opportunity-discovery"): Promise<Response> {
  // idempotency_key is date-scoped so a retry / double-cron never double-runs the same day's slice.
  const day = new Date().toISOString().slice(0, 10);
  return fetch(env.GROWTH_RUNNER_URL, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${env.GROWTH_RUNNER_TOKEN}` },
    body: JSON.stringify({ product: env.PRODUCT, task, idempotency_key: `${env.PRODUCT}:${task}:${day}` }),
  });
}

export default {
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const now = new Date(event.scheduledTime);
    const hour = etHour(now, env.TZ);
    // Daily article only when it's ~08:00 ET (guards the two UTC crons that bracket the DST shift).
    if (hour === 8) ctx.waitUntil(trigger(env, "daily-article").then(() => {}));
    // Weekly discovery runs on the Monday cron (handler is day-agnostic; cron pins the day).
    if (event.cron === "23 13 * * 1") ctx.waitUntil(trigger(env, "opportunity-discovery").then(() => {}));
  },
  async fetch(): Promise<Response> {
    return new Response(JSON.stringify({ ok: true, service: "growth-cron" }), { headers: { "content-type": "application/json" } });
  },
};
