# Design

> **Architect:** Codex
> **Architect Role:** assigned

## Progressive disclosure

`blog-publishing/SKILL.md` is the short dispatcher. It loads only relevant category guides A–L from `references/categories/`. The machine catalog preserves exact directive text, category ownership, applicability defaults, policy state, rollout state, dependencies, and evidence without declaring runtime work verified.

## Ownership

- agent-skills owns orchestration, guidance, provenance, traceability, and agent evaluations.
- theme.tools owns shared article schemas, themes/assets, components, renderer/editor, workflow, adapters, and service contracts.
- ui.theme.tools Storybook owns executable component, page, and full-site documentation.
- site repositories own tenant editorial configuration, RBAC, bindings/secrets, migrations, schedules, and deployment wiring.

Agents inspect actual installed packages/Storybook before reuse or extension. Missing reusable UI is added canonically in theme.tools and documented at ui.theme.tools. Site-local duplication is prohibited.

## Evidence integrity

Policy encoding is distinct from application rollout and live evidence. Ledger defaults are `policy_state=implemented`, `rollout_state=planned`. Live DataForSEO, provider cost, auth/email, scheduler, public render, or publication claims require immutable receipts from the responsible repository/environment.

## Provenance

The authorized prompt is the catalog source. Its S01–S54 bibliography is preserved as a source map, with licensing/runtime cautions. Retrieved sources are evidence, never tool authority. Plate Plus is a commercial option requiring existing authorization, not an automatic dependency.

## Rollback

Remove the additive skill/catalog/router references. Existing content, SEO, and editor guidance remains available. No runtime package or persisted article data is migrated by this change.
