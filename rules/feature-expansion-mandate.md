---
name: feature-expansion-mandate
description: Every product/app/site goes FAR beyond the literal prompt — automatically SCAFFOLD every generally-recommendable feature (not just prompt-named screens) as a gorgeous prototype, then gate only CODING on approval. Products must become full-featured, secure, backwards-compatible, Enterprise-grade AI suites that make AI easier/smarter/safer/faster/more profitable. Use on any app/dashboard/SaaS/website build, feature planning, "what else", scaffolding, or roadmap.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Feature Expansion Mandate

The prompt is the FLOOR, never the ceiling. Every product is EXPECTED to be carried far past the literal
ask by AUTOMATICALLY implementing the AI-recommended features / upgrades / enhancements / improvements
across EVERY category the product belongs to — until it is a full-featured, secure, backwards-compatible,
**Enterprise-grade AI software suite**. The requirements must be met; then the product must go much further.
(Brian directive, browse.tools 2026-10-30.) This is the stronger, operational form of [[expand-context-always]]
+ [[first-time-excellence]] + [[improvement-audit]] + [[predictive-completeness]].

## The core correction — AUTO-IMPLEMENT the full Top-30 cohort end-to-end

- **Never present AI feature or improvement ideas as a passive Rec list and ask "which should I build?"** Brian is in favor of almost all (~90–95%+) of the ideas in any Top 30 list (calibration anchors: `browse.tools` 15/15 accepted; `legion.megabyte.space` 29/30 accepted, excluding only `Superset` and `onlykey`/`fido2`).
- **Auto-implement the full aligned cohort (~25–30 of 30) in the same turn**:
  - For **workstations, servers, CLI tooling, and infrastructure**: implement all safe, non-blocklisted items end-to-end in the same turn (using Eager-Minimum + Lazy-Everywhere shims via `cnf-build-shims` for optional CLIs so zero bloat is added) and sync reusable configs to `heymegabyte/install.doctor`.
  - For **applications, SaaS dashboards, and websites**: implement all safe features end-to-end (behind feature flags per [[feature-flags]] when experimental) and scaffold any remaining visual surfaces as gorgeous interactive prototypes per [[progressive-screen-scaffold-approval]].
  - Parallelize implementation across `~/.agentskills/bin/opencode-swarm.mjs` so shipping 25–30 items completes in a single turn.
- **What is excluded**: ONLY items on the explicit negative blocklist (`Superset`, `onlykey`, `fido2`, `Biome`, `Resend`, isolated XFCE desktop replacements) or genuinely destructive/irreversible actions (`approval-required` tier in `autonomous-engineering.md`).

## Always expand to every "generally recommendable" feature

- On EVERY build + FREQUENTLY mid-build, re-analyze context and make architecture decisions that EXPAND the
  surface to include every feature a discerning user/operator of this product CLASS would expect — plus the
  differentiators that set it apart. Meeting the spec is table stakes.
- **AI-everywhere ([[ai-permanence]] + [[ai-abundance-maximalism]]):** incorporate AI ANY time it abstracts
  unnecessary complexity away from the user — a step removed, a config inferred, a decision made for them,
  a blank field filled, a natural-language path over a form. An AI affordance that simplifies is default-scaffolded.
- **Enterprise-grade baseline is assumed:** auth + RBAC + SSO/SAML + audit log + data export/portability +
  API + SDK + CLI + MCP + webhooks + observability/analytics + feature-flag admin + notifications + onboarding +
  status/trust page + backups/retention + rate-limits + secrets-as-references. Secure, backwards-compatible
  ([[backwards-compatibility-removal-cadence]]), and instrumented for profitability (usage/billing/cost controls).
- **Powerful/risky AI features ship as enable/disable flags** defaulted OFF/experimental ([[feature-flags]]);
  the user promotes via admin. (browse.tools auto-heal / ask-your-data / smart-routing / agent-memory = toggles.)

## The shared, GROWING baseline catalog (so every product inherits + compounds)

- The canonical "generally-recommendable feature set" lives in the `saas-feature-completeness` skill — the
  growing catalog EVERY product auto-inherits and every build EXPANDS. A new baseline-worthy feature built
  for one product flows BACK there ([[prompt-as-training-signal]] §5) so all future products get it for free.
- This is what makes the estate's apps "step apart from the rest": a compounding, shared, enterprise-grade
  feature floor + per-product differentiators, not one-off builds.

## Reference incident (browse.tools, 2026-10-30)

Offered Brian a "top 15 features" Rec list and asked which to implement. Brian: all 15 were brilliant and
should have been SCAFFOLDED automatically (and ~the next 45) before asking — the few he skipped still have
value to end-users; the AI must go far past the prompt by default. Lesson = this rule: auto-scaffold the
full recommendable set, gate only the coding, and treat enterprise-grade AI-suite completeness as the floor.

## Cross-links

[[expand-context-always]] · [[improvement-audit]] (generate+rank the set) · [[first-time-excellence]] ·
[[predictive-completeness]] · [[extra-mile]] · [[auto-integrate-recs]] (the code-ship filter) ·
[[progressive-screen-scaffold-approval]] (scaffold→review→code, with optional Figma) · [[feature-flags]] (toggles) ·
[[competitor-research]] (the floor to beat) · [[ai-permanence]] · [[ai-abundance-maximalism]] (AI-everywhere) ·
[[backwards-compatibility-removal-cadence]] · `saas-feature-completeness` skill (the growing catalog).
