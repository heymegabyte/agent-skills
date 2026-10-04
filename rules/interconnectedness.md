# Interconnectedness — No Orphan Code, Everything Reachable

Every major branch of code must be **represented + reachable in the UI**; every artifact strives to
link to what it relates to. Disconnected code (built but unwired) is a latent defect that silently
rots or vanishes — like the projectsites SQL editor a consolidation de-referenced and nearly lost
unnoticed. Strive for interconnectedness everywhere: code→UI, page→page, doc→doc, record→detail.

Cross-links: `[[fully-built-feature-can-be-completely-unwired]]` · `[[cinematic-component-must-be-wired-same-fire]]` · `[[consolidation-diff-capabilities-before-deleting-source-surface]]` · `[[drift-detection]]` · `[[context-spillover]]` · `[[extra-mile]]` · `[[predictive-completeness]]`

## The mandate

- Every major code unit — component/panel/page, feature module, worker route/handler, MCP tool,
  adapter, service — MUST have a reachable path to a user-facing surface (import→render, route, nav
  entry, registration). **Built-but-unwired = not done.**
- A feature is DONE only when reachable in the UI from an obvious entry point. "Merged" ≠ "reachable."
- **Never de-reference/replace a substantial code unit** without EITHER deleting it deliberately
  (with rationale, per look-before-delete) OR re-wiring it into the new surface **the same fire**.
  "Kept for later" is exactly how code disappears.
- **Recycle proven code over shipping a thinner reimplementation.** The SQL-editor lesson: a
  consolidation replaced a rich editor with a thin one AND orphaned the original — a regression AND
  an orphan in one move.

## Opportunistic reconnection (spillover)

- While working ANY area, surface adjacent orphaned/disconnected code and wire it up in the same fire
  (bounded by the `context-spillover` cost ceiling). Known-orphaned code is fixed now, never deferred.
- Every fire asks: **"what existing-but-unconnected code can I connect while I'm here?"** — and does it.

## Detection (make orphans impossible to miss)

- Run an orphan sweep on significant changes + periodically: major units with no
  import/route/render/registration reference. Tools: import-graph (ts-morph), knip/ts-prune for
  unused exports (`[[knip-unused-not-always-dead]]` — verify + classify, don't blind-delete), the
  feature-module drift gate, route↔UI manifests.
- Prefer a **deterministic gate** (hooks > rules): a detector that flags / fails CI on any NEW
  orphaned major unit. Reference impl: projectsites `scripts/detect-orphans.mjs`.

## Broader interconnectedness (the web-of-links ethos)

- **Websites:** internal backlinks, breadcrumbs, related-content, prev/next — every page reachable,
  zero orphan pages (extends SEO internal-linking).
- **Docs/memories:** liberal `[[wikilinks]]` between related notes.
- **Admin / data surfaces:** every resource links to its detail + related resources ("what uses
  this?"); every table links to the forms/functions/bindings that use it. Everything relevant links
  to everything relevant.

## Anti-patterns

- A refactor/consolidation that drops the last reference to substantial code + "keeps the file for later."
- Shipping a thin reimplementation while a richer proven version sits orphaned.
- A component/route/tool/adapter built but never wired to a surface.
- A website page with no inbound links; a data record with no path to its detail/actions.
- Deferring known-orphaned code to a "later" fire that never comes.
