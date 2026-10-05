---
last_reviewed: 2026-10-04
superseded_by: null
name: "cost-per-request-accountability"
priority: 2
pack: "core"
triggers:
  - "cost"
  - "billing"
  - "free tier"
  - "D1 reads"
  - "KV ops"
  - "R2 GETs"
  - "napkin math"
  - "cost estimate"
  - "spend"
  - "monthly cost"
paths:
  - "worker/**"
  - "src/worker/**"
  - "wrangler.toml"
  - "inngest/**"
---

# Cost-Per-Request Accountability

Every feature carries an explicit cost estimate before it ships — napkin math inline. A naive cron querying D1 on every activation can exhaust the free tier in hours; no FinOps team catches runaway spend.

## The rule

- Cost comment is **mandatory** on every new: background job, AI call, queue consumer, cron trigger, D1 query inside a hot path, and R2 read/write
- Format: `// ~$X.XXX/run × N/day = ~$Y/month` (or `/request` for hot paths)
- Ceilings: **≤$0.001/request** for free-tier features; document the ceiling for paid features
- When a feature crosses $5/month, flag it in the commit message for review

## CF free tier reference (verified 2026-10-04)

| Primitive | Free allowance | Cost beyond |
|-----------|----------------|-------------|
| Workers requests | 100K/day | $0.30/million |
| Worker CPU | 10ms/request | $0.02/million CPU-ms |
| D1 rows read | 5M/day | $0.001/million |
| D1 rows written | 100K/day | $1.00/million |
| KV reads | 100K/day | $0.50/million |
| KV writes | 1K/day | $5.00/million |
| R2 Class A ops | 1M/month | $4.50/million |
| R2 Class B ops | 10M/month | $0.36/million |
| R2 storage | 10GB/month | $0.015/GB/month |
| Queues | 1M ops/month | $0.40/million |
| Durable Objects | 1M requests + 400K GB-s | pay-as-you-go |

- Workers bundle size: single **64 MiB uncompressed** limit on Free AND Paid (Sep 2026 — replaced the old 3 MB-gz free / 10 MB-gz paid compressed caps).

Inngest Free: 50K executions/mo (each step execution counts) + 500K events, 5 concurrent; Pro from $99/mo (1M execs). CF Workflows when unbound.

AI Gateway: proxied tokens billed at model rate; no Gateway surcharge.

## Example: cost comment pattern

```ts
// worker/crons/daily-digest.ts

export async function dailyDigest(env: Env) {
  // Cost: ~10 D1 reads/user × 500 users = 5K reads/run
  //       × 1 run/day = 5K reads/day → well within 5M free tier
  //       AI summary: ~800 in + ~300 out on Haiku 4.5 ($1/$5 per MTok, verified 2026-10)
  //       = 800×$1/M + 300×$5/M = ~$0.0023/user
  //       Total at 500 users: ~$1.15/day ≈ ~$35/month → CROSSES the $20/mo
  //       review-recommended tier (see below) — flag in the commit + feature-flags description
  const users = await env.DB.prepare('SELECT id, email FROM users WHERE digest_enabled = 1').all()
  for (const user of users.results) {
    await sendDigest(env, user)
  }
}
```

```ts
// worker/routes/ai-search.ts

// Cost: Workers AI Llama 4 Scout = $0.00/request (free tier 10K neurons/day)
//       Fallback to Claude Haiku 4.5: ~450 in + ~150 out ($1/$5 per MTok) = ~$0.0012/request
//       At 1K req/day → ~$1.20/day ≈ ~$36/month → crosses $20/mo review tier, flag it
export async function aiSearch(c: Context) { ... }
```

## Red flags that require cost review before merging

- Any cron that runs more than once per hour
- AI calls in the critical request path (not `waitUntil`)
- D1 queries that do a full table scan (no `WHERE` index hit)
- R2 reads on every page load without CF Cache API wrapping them
- Inngest steps that fan out to >1K sub-steps per trigger event

## Cost-estimator agent

Before shipping a new Worker feature, run the `cost-estimator` agent:

```
Agent({ subagent_type: 'cost-estimator', prompt: 'Estimate monthly cost for worker/routes/ai-search.ts at 10K req/day on CF free tier. Check D1, KV, R2, AI Gateway, and Inngest step usage.' })
```

The agent reads `wrangler.toml`, counts bindings, estimates usage, and warns on free tier breaches.

## Cross-links

- **[[cloudflare-lock-in-is-leverage]]** — CF request-based billing model; no idle server cost
- **[[solo-builder-doctrine]]** — solo builder; runaway spend has no FinOps safety net
- **[[background-jobs-and-workflows]]** — Inngest / Workflows step billing model
- **[[prompt-cache]]** — AI call caching cuts 90% of token spend on repeated prefixes
- **[[model-routing]]** — Haiku 4.5 (cheapest) for draft content; Sonnet for build; Opus for architecture only
- **[[autonomous-engineering]]** — >$20/month new recurring cost is `review-recommended` tier
