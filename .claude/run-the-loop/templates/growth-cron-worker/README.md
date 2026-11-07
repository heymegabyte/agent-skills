# growth-cron (deployable template)

Session-independent scheduler for the growth loop's standing tasks (`SPECIAL-TASKS.md` ST-1/ST-2).
Closes the audit gap where daily publishing needed a live Claude Code session or a per-repo GH-Actions key.

## Architecture
CF Cron Worker (deterministic trigger, **not** an AI worker slot) → POST to the OpenClaw / run-the-loop
runner (`GROWTH_RUNNER_URL`) → runner executes the slice through `blog-autopublish` + `yoast-seo-compliance`
+ `verification-loop`. The downstream task ledger ([[worker-pool-and-task-ledger]]) enforces idempotency
via the date-scoped `idempotency_key`, so a double-fire never double-publishes.

## Deploy (per product) — NOT deployed by this fire
1. `cp -r` this template into the product repo; set `PRODUCT` in `wrangler.toml`.
2. `wrangler secret put GROWTH_RUNNER_URL` (OpenClaw gateway webhook or a Queue producer) and `GROWTH_RUNNER_TOKEN`.
3. `wrangler deploy`.
4. Verify: `curl https://growth-cron.<subdomain>.workers.dev/` → `{ok:true}`; confirm the next cron POSTs to the runner (runner log) and an article publishes with **no** Claude session open.

Status: **template ready, not yet deployed** — deployment needs each product's CF account + a live runner endpoint.
