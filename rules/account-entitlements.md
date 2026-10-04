---
last_reviewed: 2026-10-04
superseded_by: null
name: "account-entitlements"
priority: 2
pack: "ai"
triggers:
  - "promo credit"
  - "promotional credits"
  - "cloud session"
  - "claim credit"
  - "plan entitlements"
  - "expiring credits"
paths:
  - "rules/model-routing.md"
  - "agents/cost-estimator.md"
  - "agents/resource-broker.md"
---

# Account Entitlements — Spend Credits Before They Expire

Every paid account carries entitlements beyond the headline product: promotional credits, included quotas, bundled perks. Untracked entitlements expire unspent while we burn metered dollars — that is waste, not thrift.

## Spend order (always)

1. **Expiring promo credits** — free capacity with a deadline; route burst work here first.
2. **Included plan quota** — already paid; use before anything metered.
3. **Prepaid credit balances** — paid but not expiring soon.
4. **Metered API spend** — last resort for work a credit-backed surface could do.

## Live inventory (dated; prune at expiry; never fabricate — user-confirmed or web-verified only)

- **Claude Code cloud sessions** (verified 2026-10-04): one-time $250/account on Max, $100 on Pro — subscribers active 2026-09-23 (GA date). **CLAIM by 2026-10-07** via `/claim-credit` in Claude Code (≥2.1.281; claude.ai sign-in, not API key; GitHub linked) or claude.ai/code. **Expires 2026-11-04.** Credit sits OUTSIDE plan limits. Launch: `claude --cloud`, claude.ai/code, desktop "Cloud", or mobile Code tab.

## Cloud-session credit strategy (until 2026-11-04)

- Claim on EVERY eligible account immediately — one credit per account; multi-account = multiplied capacity.
- Route burst + unattended work there: round-sweeps, migration fan-outs, E2E farms, parallel subagent batches. Cloud sessions reward spec-file briefs (you are not watching).
- Local Opus quota is preserved for interactive judgment work; hitting local limits mid-task → move the task to a cloud session (see [[opus-quota-fallback]] — claimed cloud credit is the relief valve BEFORE deferring to the Monday reset).
- Zero Data Retention orgs: cloud sessions unavailable — inventory entry does not apply.

## Maintenance

- Cost-relevant session start: scan inventory; today past an `Expires` date → delete the entry (this file, same turn).
- New vendor/account onboarded: inventory its entitlements from the billing/credits dashboard; record claim-by + expiry dates here.
- New promo announced: verify (official source), add dated entry, cross-link the surface it subsidizes.

Related: [[model-routing]] · [[opus-quota-fallback]] · [[prompt-cache]].
