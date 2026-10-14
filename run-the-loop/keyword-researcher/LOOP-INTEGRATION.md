# /run-the-loop Integration — Keyword Research (§15)

How the `keyword-researcher` capability plugs into the existing loop WITHOUT replacing its
orchestration or creating redundant per-repo cron. Durable contract; the live registry entry
(ST-6) is mirrored below.

## Precedence (respect it — never override)

- A project's own `.claude/commands/run-the-loop.md` ALWAYS wins. This repo has none → the global
  `/run-the-loop` governs. Keyword research is a participant, never a replacement for loop orchestration.
- Reuse the CENTRAL scheduler (`.claude/run-the-loop/SPECIAL-TASKS.md` ST-6). Do NOT add a per-repo
  cron workflow — one logical control plane (`services/keyword-research/`) serves all projects.

## Activate ONLY when (all gates)

- The project has an SEO-eligible PUBLIC website, AND
- at least one of: cached research is STALE (per freshness policy) · a new GSC/trend opportunity
  appeared · research is explicitly requested.
- Otherwise: skip this fire. Never a full paid research pass every 15-minute tick.

## Cadence

- **Daily** — FREE Google Search Console performance refresh + reassess cached research + surface
  content actions. No paid calls.
- **Weekly** — refresh selected DataForSEO keyword metrics + strategic clusters (paid, budgeted).
- **Periodic** — evaluate meaningful trend/seasonal shifts within budget + freshness thresholds.
- **On-demand** — explicit `/keyword-research <domain>` runs immediately.

## Cost + freshness gating

- Enforce the global **$20/mo paid-research cap** (ledger circuit breaker in `src/ledger.ts`).
- Free checks first (`/v3/appendix/user_data`); `seo:research --dry-run` to plan + estimate with ZERO spend.
- Dedupe + cache by data freshness/volatility — do NOT re-run unchanged expensive research.
- **BLOCKED state:** DataForSEO creds absent → record blocked in `CONVERGENCE.md`, never fabricate.

## Handoff

- Output = scored opportunities + evidence-backed briefs (`keyword-briefs.json`) fed into the
  EXISTING content workflow (`blog-and-content-engine`, `content-writer`). Publication keeps the
  existing accuracy / originality / editorial / deploy gates. `seo-auditor` consumes the keyword→page map.

## Live registry entry (ST-6) — mirror of `.claude/run-the-loop/SPECIAL-TASKS.md`

```markdown
## ST-6 — Keyword research (gated; never a paid pass every fire)
Canonical capability: the `keyword-researcher` agent + `services/keyword-research/` control plane
(`npm run seo:research`). Reuse the CENTRAL scheduler — no per-repo cron.
**Activate ONLY when** a product has an SEO-eligible public site AND (research is stale · a new
GSC/trend opportunity appeared · or research is explicitly requested). Otherwise skip this fire.
**Cadence:** daily = FREE GSC refresh + reassess (no paid calls); weekly = selected DataForSEO
metrics + cluster refresh; periodic = trend/seasonal shifts within budget; on-demand = immediate.
**Acceptance:** respect the $20/mo paid cap (free checks first; `--dry-run` to plan); dedupe + cache
by freshness (never re-run unchanged expensive research); emit scored opportunities + briefs
(`keyword-briefs.json`) into the product's content workflow (publication keeps existing gates).
BLOCKED until DataForSEO creds exist → record blocked, never fabricate. Honours ST-3's 5% SEO floor.
Full contract: `run-the-loop/keyword-researcher/LOOP-INTEGRATION.md`.
```

> Registration status: ST-6 is added to the LIVE `.claude/run-the-loop/SPECIAL-TASKS.md` (that
> registry is untracked in-flight work, so ST-6 is active locally but is NOT part of this feature's
> scoped commits — this file is its durable source of truth). When the in-flight loop feature is
> committed, ST-6 rides along; if the registry is regenerated, re-paste the block above.
