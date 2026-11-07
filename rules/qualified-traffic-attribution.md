---
last_reviewed: 2026-10-10
superseded_by: null
name: "qualified-traffic-attribution"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Qualified-Traffic Attribution

Lets the [[autonomous-growth-orchestrator]] rank channels by **qualified activations**, never raw
impressions. Extends `13-observability-and-growth/activation-funnel.md` + `conversion-optimization.md`
(PostHog, first-party, cookie-free). **[MUST NOT]** optimize pageviews; **[MUST]** respect consent +
separate humans from bots/synthetic test traffic.

## [MUST] Qualified-visitor definition (per product)

A visitor who fires ≥1 **intent signal** within a session — not a bounce. Default signals (override per product):

- **GitLink:** opened a repo profile · ran a search · compared repos · viewed alternatives · used the MCP/recommendation API · installed an integration · returned for a 2nd research session.
- **SaaS/other:** reached the product's magic-moment event (per `activation-funnel.md`) or a defined core action.

Traffic-quality score `Q = Σ(signal_weight)`; `qualified = Q ≥ threshold`. Bot/UA-filtered + obvious synthetic excluded.

## [MUST] Attribution rollup (source → activation → revenue)

1. Capture first-party `source` on first touch: UTM params + referrer host + landing route → persisted to the person/session (not third-party cookies).
2. Join `source → activation_event → {trial, paid, revenue}` in PostHog/HogQL.
3. Report per channel: qualified visitors · activation rate · repeat rate · integration installs · **cost-per-qualified-activation (CPA_q)** · revenue conversion · a **compounding** flag (does the asset keep earning — extension/embed/cited report?).

HogQL shape (adapt to the product's events):

```sql
SELECT properties.$initial_utm_source AS source,
       countIf(event = 'activated') AS activations,
       countIf(event = 'signup_paid') AS paid
FROM events WHERE timestamp > now() - INTERVAL 30 DAY
GROUP BY source ORDER BY activations DESC
```

## [MUST] Channel ranking → feeds suballocation

Rank by **CPA_q** (lower is better) with a compounding bonus. Feed the ranking back into the growth
suballocation reweight ([[autonomous-growth-orchestrator]]): a channel delivering 100 qualified,
retained developers beats one delivering 10,000 irrelevant visits. **[SHOULD]** stop or redesign a
low-performer only on sufficient evidence (stable sample), never early noise. Record outcomes in the
task ledger `measured_outcomes` so [[worker-pool-and-task-ledger]] can reprioritize next fire.
