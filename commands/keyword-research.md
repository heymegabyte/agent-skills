---
description: Autonomous keyword research for a domain — discovers + scores search opportunities (DataForSEO + Search Console + Google Trends + Exa), clusters by intent, and emits prioritized actions + evidence-backed content briefs. Deterministic scoring, cost-aware, no invented metrics.
argument-hint: "[domain] (e.g. projectsites.dev) — or a natural-language ask; omit to infer the current repo"
---

# /keyword-research

Delegates to the `keyword-researcher` agent (`agents/keyword-researcher.md`) and the control plane
in `services/keyword-research/`. Evidence-driven; never fabricates volume, difficulty, or rankings.

## Invocation

- `/keyword-research projectsites.dev`
- Natural language, all routed here:
  - "Research keywords for projectsites.dev"
  - "Find SEO opportunities for deskl.ink"
  - "What should we write about next?"
  - "Find low-difficulty commercial keywords"
  - "Analyze existing Search Console opportunities"
  - "Research local SEO for this business"
  - "Update this site's keyword plan"
  - "Create a content brief for the best opportunity"

If no domain is given, infer it from the current repo (git remote / wrangler `routes` / `.claude/CLAUDE.md`).
Default to the project's configured geography + language, else United States / English.

## CLI (implemented in `services/keyword-research/`, exposed as root scripts)

```
npm run seo:setup                               # detect + authenticate providers; prints a REAL status table
npm run seo:health                              # provider connection + data-freshness + budget status
npm run seo:research -- --domain=projectsites.dev
npm run seo:research -- --domain=projectsites.dev --dry-run   # plan + cost estimate, zero paid calls
npm run seo:research -- --help
```

`--help` lists: `--domain`, `--locale`, `--geo`, `--lang`, `--dry-run`, `--max-spend`, `--refresh`,
`--format=json|md|csv`, `--out=<dir>`.

## What a run does (phases A–I; each tolerates a missing provider)

A understand repo/domain/audience/pages/geo + cached research → B existing GSC opportunities →
C expand candidates (DataForSEO, small→selective) → D enrich screened candidates (volume/difficulty/
SERP/trends) → E competition (DataForSEO + Exa) → F cluster + intent-classify + deterministic score →
G prioritized actions + briefs + internal links + publish order → H persist versioned JSON + Markdown +
CSV (D1/R2 + local artifacts; update keyword→page map) → I learn from later GSC vs prior recs.

## Scoring (deterministic, 100 pts)

relevance 30 · intent/conversion 20 · organic feasibility 15 · GSC opportunity 15 · demand 10 ·
trend 5 · originality 5. No GSC → its 15 redistributes transparently across valid dimensions.
Exactly one action per opportunity: create_new | improve_existing | consolidate | supporting_blog |
comparison_content | monitor | reject.

## Guardrails

- Providers: DataForSEO, Search Console, Google Trends, Exa only. Never Ahrefs/Semrush/Serper/VebAPI/
  Keywords Everywhere/Tavily.
- `$20/mo` paid cap; free checks before paid calls; dedup + cache by freshness; `--dry-run` never spends.
- `null` for missing metrics — never a fabricated zero. Every brief claim carries a real source.
- The only interactive step is authentication (DataForSEO API creds / Google consent).

## Handoff

Briefs land in `keyword-briefs.json` (JewelBrief-compatible). `content-writer` consumes them; `seo-auditor`
uses the keyword→page map for targeting/overlap. Publication keeps existing accuracy/originality/deploy gates.
