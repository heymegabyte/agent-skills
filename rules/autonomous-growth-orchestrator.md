---
last_reviewed: 2026-10-10
superseded_by: null
name: "autonomous-growth-orchestrator"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Autonomous Growth Orchestrator

A successful product is one the right people **discover, understand, trust, adopt, and keep using** —
so autonomous distribution is a first-class peer of autonomous engineering. This is the reusable
growth capability `/run-the-loop` folds in whenever a product is in launch/growth/maturity. Extends
`13-observability-and-growth/*` (activation-funnel, conversion-optimization, analytics), `15-site-generation/pseo-templates`,
`09-brand-and-content-system/social-automation`, and the content skills (`blog-autopublish`, `yoast-seo-compliance`).

## [MUST] Optimize for QUALIFIED outcomes, never raw pageviews

Qualified visitors · meaningful product exploration · activation · return visits · relevant integration
installs · genuine opt-in subscribers · trial→paid · sustainable CAC · real community recognition ·
revenue + retention where measurable.

## [MUST NOT] — distribution integrity (Part IX safeguards)

Fake visits/clicks/installs/stars/reviews · purchased bot engagement · mass unsolicited DMs ·
scraped-address email · automated promo comments across unrelated threads · repetitive Awesome-List PRs ·
misleading endorsements · fabricated benchmarks/testimonials · doorway/low-value SEO pages · undisclosed
affiliation where disclosure is due · circumventing platform anti-abuse limits.

## The growth loop

**DISCOVER DEMAND → IDENTIFY AUDIENCE → MATCH PRODUCT VALUE → BUILD DISTRIBUTION ASSET → PUBLISH/DISTRIBUTE → VERIFY → MEASURE → IMPROVE.**
Maintain a durable, scored opportunity backlog (per-product, in that repo's `.claude/run-the-loop/BACKLOG.md`).
Discover + score from real search data, public technical discussions, product analytics, competitor
intel, ecosystem directories, and prior channel performance. Build the actual assets/integrations for
high-value opportunities — don't just file ideas.

## [MUST] Growth suballocation (of the resources actually allocated to growth)

Not a second global budget — a split of the growth slice from [[token-allocation-policy]].

| Activity | Share |
|---|---:|
| Search demand capture | 25% |
| Product-sharing + referral flywheels | 25% |
| Developer ecosystem integrations | 20% |
| Educational content + syndication | 15% |
| Community / partnerships / outreach | 10% |
| Paid acquisition experiments | 5% |

Reweight by MEASURED performance. **[MUST NOT]** auto-spend on ads without an explicitly configured
budget + authorization; with no paid budget, redirect that 5% to the strongest organic opportunity.

## [MUST] Qualified-traffic measurement

Define per-product activation events (extend `13-observability-and-growth/activation-funnel.md`). Measure
qualified-visitor count, activation rate, repeat rate, integration activations, referral source, organic
clicks, newsletter conversion, cost-per-activated-visitor, trial/signup/revenue conversion. First-party +
consent-respecting; separate humans from bots/synthetic test traffic. **Prefer compounding channels**
(a used extension, a recurring-referral embed, a cited research report) over one-shot impressions. Stop or
redesign low-performers on sufficient evidence, not early noise.

## Retention IS growth — loops, product-as-distribution, expansion (2026)

Acquisition without retention is a leaking bucket; CAC is up ~60% since 2020, so the cheapest growth is keeping + expanding existing users. **Fix retention BEFORE opening the acquisition tap.** (Added 2026-10-25, estate-upgrade audit — `[[estate-upgrade-audit]]`.)

- **Build distribution INTO the product (virality, not bolt-on):** shareable templates (Notion), collaboration-as-the-core-loop (Figma — you can't use it well without inviting teammates), embeddable widgets/scorecards, shared reports. Place referral prompts AFTER a high-satisfaction moment; make the invite improve the inviter's experience (Dropbox: the reward WAS the product). Measure the **viral coefficient (k)** = invites/user × invite-conversion; k>1 compounds. Generic gift-card referrals underperform — tie the reward to product value.
- **Loops, not funnels:** a Referral loop (retained user → new acquisition) + a Content loop (user data → new SEO/GEO pages → awareness) on OWNED channels, never platform exploits. Compounding > one-shot.
- **Retention measurement (most teams are blind here):** track churn **by cohort** (73% of SaaS don't — flying blind); compute a **customer health score** (usage signals) that predicts churn 30–60 days out (15–25% reduction); community-active users churn 30–40% less (community as a retention channel, cheap for low-ACV). Expansion mechanics live in `[[payments]]` § Product-led expansion; involuntary-churn recovery (smart dunning) is there too. AI-first support that RESOLVES (not deflects) is itself a retention lever → `[[customer-support-doctrine]]`.
- **Roadmap allocation heuristic:** ~40% expansion / 30% retention / 30% acquisition features (expansion is the highest-ROI channel at scale).

## Growth Opportunity Registry (permanent — 50 strategies)

Research eligibility + expected value per product before implementing; **never blindly run all 50.** Each
chosen strategy gets reusable specialist tasks + scheduling + measurement + verification. Score with §10 below.

- **A. Capture search demand** — 1 repo-intelligence landing pages · 2 head-to-head comparison pages · 3 OSS-alternatives explorer · 4 best-tools-by-use-case directories · 5 problem→solution pages · 6 migration/replacement guides · 7 ecosystem-compatibility pages · 8 license explorer · 9 repo-health intelligence · 10 public benchmark lab (reproducible, measured).
- **B. User-generated distribution** — 11 shareable intelligence reports · 12 embeddable scorecards/badges · 13 embeddable comparison tables · 14 curated tech stacks · 15 public curation profiles · 16 README recommendation snippets · 17 verified maintainer profiles · 18 shareable release highlights · 19 Find-Alternatives bookmarklet · 20 exportable comparison graphics.
- **C. Developer ecosystem integrations** — 21 MCP registry presence · 22 Claude Code skill · 23 OpenClaw skill · 24 GitHub Marketplace app · 25 VS Code extension · 26 Chrome extension · 27 GitHub Action · 28 npm CLI · 29 Raycast extension · 30 recommendation API (with attribution).
- **D. Educational + content distribution** — 31 daily original SEO article · 32 syndication (DEV/Hashnode, canonical attribution) · 33 opt-in segmented newsletters · 34 RSS/JSON feeds · 35 authentic demo videos · 36 short technical explainers · 37 scheduled educational social · 38 original research reports · 39 release explainers · 40 creator research kits.
- **E. Community + distribution** — 41 Awesome-List submissions (policy below) · 42 developer-directory listings · 43 Product Hunt launches · 44 Hacker News prep (human-submitted) · 45 Reddit needs research (no mass commenting) · 46 Stack Overflow answers (disclosed) · 47 newsletter partnerships · 48 maintainer collaborations · 49 paid experiments (authorized only) · 50 cross-product discovery (no artificial cross-linking).

## §10 Opportunity scoring

Score each candidate: qualified reach · intent relevance · user value · differentiation · supporting
evidence · implementation complexity · distribution potential · compounding benefit · maintenance burden ·
financial cost · confidence · security/compliance risk · cross-product reuse · verification feasibility.
**Favor compounding + reusable.** "Unconventional" ≠ "valuable."

## 1000-cell discovery matrix (fuzzy expansion — Part VII)

For significant product/growth planning, expand a **10×10×10** matrix (≥1000 cells):
Axis A opportunity domains · Axis B audience perspectives · Axis C creative transformations (full axes in
`14-independent-idea-engine`). **[MUST]** generate→score→dedupe→cluster EFFICIENTLY — never burn 1000
expensive model calls on repetitive brainstorming. Deep-research the strongest ~30%; implement the
strongest feasible + essential supporting work. Record explored cells + rejection reasons so later loops resume.

## [MUST] Outreach + Awesome-List policy

- Routine publishing to **owned** properties may auto-publish after the quality gates (`yoast-seo-compliance`, verification-loop) pass.
- Third-party submissions/messages/community interactions follow platform policy + the project's authorized outreach settings. Where autonomous submission is **not** permitted → prepare a high-quality evidence-backed draft + destination and **queue for human action**.
- Awesome-List: ≤ **2** new external listing PRs per OSS product per **month**; no repeat unsolicited submission to the same destination within **90 days**; respect stricter repo rules; never resubmit a rejected promotion unless invited; record status + maintainer feedback. A real technical contribution beats a promotional listing.
- **[MUST NOT]** unexpected paid spend or irreversible third-party account actions.

GitLink's prioritized instance of this registry → `.claude/run-the-loop/BACKLOG.md`. Spawn the
`growth-strategist` specialist to discover/score/plan; it never auto-executes outreach.
