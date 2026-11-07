---
name: "frontend-judgeable-no-orphan-code"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Frontend-Judgeable, No Orphan Code

Every surface the project contains must be reachable + judgeable from the FRONTEND, and every line of code must be utilized — or removed. Brian directive 2026-10-24: *"Make sure all the code is connected to the project so that I can judge it from the front end… Make sure all the code contained in the project is utilized some way otherwise remove it."*

## The mandate

- **Judgeable from the UI** — if a feature / route / component / asset exists, there must be a visible, reachable path to it from the running frontend. Brian judges the product by USING it; code he can't reach from the UI is invisible work that doesn't count as shipped.
- **No dangling claims** — every CTA, caption, badge, stat, or copy line that promises something (a download, a press kit, a feature, "coming soon") MUST be backed by a REAL, working, reachable action. A caption "Press kit ready for editorial feature placement" with no actual press kit is a lie the user WILL catch. Wire the claim to a real artifact/action, or remove the claim. (Reference incident: bz.rocks `/press` 2026-10-24 — a magazine-mockup caption promised a press kit that didn't exist; fixed by wiring a real "request the kit" action + an accurate caption.)
- **Utilize or remove** — every file, export, component, route, asset, and dependency is either (a) reachable + used in the shipped product, or (b) deleted. No orphan modules, dead exports, unreferenced assets, or "we'll wire it later" code sitting dark. Adds the FRONTEND-reachability lens on top of `[[drift-detection]]`'s dead-code rules.

## How to apply

- When you build backend/logic, wire it to a visible UI surface the SAME turn — never leave a route/feature/endpoint with no frontend entry point.
- Audit cadence: run `knip` (unused files/exports/deps) + grep for registered-but-unreachable routes/components/assets; for each hit, wire it up or delete it.
- Before declaring done: walk the feature from the homepage AS A USER — can you REACH + SEE + JUDGE it with clicks/keyboard alone? If not, it is not connected, not done.
- Every claim in shipped copy is a contract: grep user-visible strings for promises ("download", "kit", "coming", "available", "ready", counts/stats) and verify each resolves to a real, reachable action or a true value.

Cross-links: [[drift-detection]] (dead code = merge-blocker), [[product-completeness]] (requirement+impl+tests+behavior agree), [[verification-loop]] (prove it live), [[first-time-excellence]] (every state built + reachable), [[extra-mile]] (surface extracted value in the UI).
