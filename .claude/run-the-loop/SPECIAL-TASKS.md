# Standing tasks — consider on EVERY fire

Each is a live workstream with its own acceptance, not a one-off. Allocate ≥1 fan-out agent per active
item and record what it advanced (counts / slugs / SHAs) in `CONVERGENCE.md` + `ledger.ndjson`.

## ST-1 — Daily article per eligible product
One original research-driven article/day/product with a configured blog (`blog-autopublish` + `yoast-seo-compliance`).
**Acceptance:** ≥1000 meaningful words · evidence-backed keyword · 4–8 original images + hero · internal/external links · JSON-LD · **Yoast green (SEO + readability)** · deployed + prod-verified · published via OpenClaw/CF cron ~08:00 America/New_York — **not** a manual session. Shortfall → record it, never silently skip or exceed budget.

## ST-2 — Growth-opportunity discovery + scoring
Spawn `growth-strategist`; run DISCOVER→SCORE against the 50-strategy registry for each active product.
**Acceptance:** ≥3 fresh, deduplicated, evidence-cited opportunities appended to that product's `BACKLOG.md` with the §10 score + measurement + verification + permission notes.

## ST-3 — Allocation rebalance check
Compare recent actual category share (from `ledger.ndjson`) vs `token-allocation.categories.json`.
**Acceptance:** any category starved across the last ~3 fires is over-weighted THIS fire until rebalanced; protected 5% SEO floor intact; note the deltas.

## ST-4 — GitLink priority slices (ref BACKLOG G-1…G-3)
GitLink is in growth stage; advance its smallest-coherent highest-value slice per fire.
**Acceptance:** one of — SSR `/repo/:owner/:name` (SEO fix) · public+register the MCP server · embeddable `/embed/:owner/:name` scorecard — shipped + prod-verified in the `gitl.ink` repo, per its own loop home.

## ST-5 — Loop self-improvement (≥1 every fire)
Leave the loop measurably better: sharpen a rule/brief, harden a gate, promote a proven dynamic role,
or retire a recurring shortcoming. Name it in the report.

## ST-6 — Keyword research (gated; never a paid pass every fire)
Canonical capability: the `keyword-researcher` agent + `services/keyword-research/` control plane (`npm run seo:research`). Reuse the CENTRAL scheduler — no per-repo cron.
**Activate ONLY when** a product has an SEO-eligible public site AND (research is stale · a new GSC/trend opportunity appeared · or research is explicitly requested). Otherwise skip this fire.
**Cadence:** daily = FREE GSC refresh + reassess (no paid calls); weekly = selected DataForSEO metrics + cluster refresh; periodic = trend/seasonal shifts within budget; on-demand = immediate.
**Acceptance:** respect the $20/mo paid cap (free checks first; `--dry-run` to plan); dedupe + cache by freshness (never re-run unchanged expensive research); emit scored opportunities + briefs (`keyword-briefs.json`) into the product's content workflow (publication keeps existing gates). BLOCKED until DataForSEO creds exist → record blocked, never fabricate. Honours ST-3's 5% SEO floor. Full contract: `run-the-loop/keyword-researcher/LOOP-INTEGRATION.md`.
