---
last_reviewed: 2026-10-10
superseded_by: null
name: "token-allocation-policy"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Token Allocation Policy

Baseline weighted allocation of **model-token spend** across 50 work categories for an actively
developed product. Describes long-term token usage — **NOT** fixed worker assignments (see
[[worker-pool-and-task-ledger]]). Machine-readable SSOT for the numbers:
`.claude/run-the-loop/token-allocation.categories.json`. The weighted-fair scheduler reads that file.

## [MUST] Invariants

- The 50 category weights total exactly **100%**. Any reweight recalculates to 100% — never add a band on top.
- **Protected floor:** the combined **5%** for SEO articles (#11, 3%) + keyword research (#21, 2%) is preserved where feasible, in every lifecycle stage.
- **Do not double-count** tokens for work spanning categories — attribute to the dominant category in the ledger.
- **Track actuals** where the provider exposes usage; label everything else an estimate. Image/video generation, external API, and infra costs are tracked **separately**, never inside the token budget.
- **No quota busywork** — never allocate marketing (or any) tokens to low-value filler merely to hit a band. An under-spent category is better than fabricated work.

## Category bands (exact % in the JSON SSOT)

- **Product / engineering** (#1 core features 9 · #2 bug repair 7 · #3 AI-native 4 · #10 refactor 3 · #14 APIs 2 · #15 DB 2 · #18 architecture 2) — the plurality every fire.
- **Testing** (#5 unit/integration 4 · #9 e2e/golden-path 3 · #17 visual-regression 2).
- **UX / design / a11y** (#4 visual+branding 4 · #8 UX/IA 3 · #16 FE perf 2 · #33 a11y 1 · #34 compat 1).
- **Growth / distribution** (#11 SEO articles 3 · #12 acquisition+onboarding 3 · #21 keyword research 2 · #23 analytics/experiments 2 · #41 content-refresh 1 · #42 tutorials 1 · #46–50 OSS/community/partnerships/launch/AI-answer 0.5 each).
- **Infra / ops / security** (#13 security 2.5 · #19 CI/CD 2 · #20 orchestration 2 · #27 reliability 1.5 · #37 observability 1 · #45 backup 0.5).
- **Strategy / discovery / knowledge** (#7 roadmap 3 · #25 user research 1.5 · #26 ideation 1.5 · #28 skills/evals 1.5 · #31 competitive 1 · #32 prototyping 1 · #38 model-routing 1 · #39 memory 1 · #44 portfolio 1).

Full enumerated list with per-category `group`/`protected` flags lives in the JSON.

## [MUST] Lifecycle reweighting (by product maturity)

Pick the stage from the product's real state; apply the multipliers in the JSON `lifecycle` block, then renormalize to 100% keeping the protected SEO floor.

- **Bootstrap** — over-weight #1 features, #5 tests, #18 architecture, #19 deploy; defer most growth.
- **Launch** — over-weight production-readiness, #4 design, #12 onboarding, #22 docs, discoverability + marketing prep.
- **Growth** — devote **~15–30% of total agent resources** (a reweight of existing growth categories, not an extra band) to qualified acquisition, integrations, content, conversion, distribution, retention. Adjust for measured performance + project economics.
- **Maturity** — over-weight optimization, #13 security, #27 reliability, #30 support, selective innovation.
- **Recovery** — temporarily prioritize #27 incidents, broken deploys, #13 security, restoration; suspend growth bands until green.

Growth-stage suballocation of the growth budget is governed by [[autonomous-growth-orchestrator]].
