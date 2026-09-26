# _REARCH_LEDGER — Skill-Library Re-Architecture (loop steering doc)

> **Read this FIRST** on every `/loop` fire of the re-architecture task. It records the
> map, the plan, and what is already done — so each fire *continues* instead of
> re-analyzing from scratch. Sits beside `_router.md` / `_kernel/` / `_packs/`.

## Mission (distilled from the loop prompt)

- Re-architect every skill/rule in `~/.claude` + `~/.agentskills` to **same product value, fewer files, less space, better for AI + humans**.
- **Collapse contradictions** using web research + explicit confidence intervals (quantitative choices, not taste).
- **Markdown lists** everywhere; one idea per bullet, ≤2 lines.
- **Fewer files, but files-as-routing** — leverage structure for dynamic prompt→skill routing.
- Preserve 100% of directives (coverage-checked); nothing load-bearing is lost.

## Map (established 2026-09-25 — don't re-recon)

- **Two populations:**
  - **A) Doctrine** (hand-authored): 28 numbered skills (`01`…`28`) + `rules/` (160) + `reference/` (42) + policies + kernel/packs/router. ~566 md files / ~92K lines *after* WS-1. This is where contradictions + prose-bloat live. **Tracked in git.**
  - **B) Generated API refs**: `skills/<int>/commands/*.md` — one page per endpoint, forge-generated, **`skills/` is gitignored** (git tracks 0), regenerable via `bin/forge-skill-from-openapi.mjs`, unrouted, redundant with live MCP + Context7. **Was 4,154 files — collapsed in WS-1.**
- **Routing spine (5 overlapping artifacts — WS-4 unifies):** `_router.md` (skill index), `routing-matrix.md` (where-a-lesson-goes), `_kernel/{index,routing,standards}.md`, `_packs/*.yml` (18 packs, resolved by `~/.claude/bin/skill-router.py`), `SKILL_PROFILES.md` (domain→profile→skill-set).
- **Canonical defs live in `_kernel/standards.md`** by anchor: `#wcag22 #ada #owasp2025 #cwv #breakpoints #budget #brand #ailen #aicrawlers #jsonld #stack #integrations #model #cmdk #hooks`. Dedup target: files that inline these instead of citing.
- **Biggest doctrine files (compression targets):** `15-site-generation/build-breaking-rules.md` (1684), `CONVENTIONS.md` (1001), `15-site-generation/build-prompts.md` (939), `template-system.md` (805). (`CHANGELOG.md` 5480 is an append-log, not a target.)
- **Reversibility:** doctrine edits → `git revert`. `skills/` collapse → re-forge (gitignored, never committed).

## 14-Workstream master plan (the prompt, expanded 14×)

1. **Collapse forged API-command pages** — `skills/*/commands/*.md` → keep SKILL.md inventory + client/types + generator; drop pointer to MCP/Context7. Risk: LOW. ✅ **DONE.**
2. **Finish kernel-citation dedup** — migrate every inline WCAG/OWASP/CWV/`#brand`/`#stack`/`#breakpoints`/`#budget`/`#ailen`/`#model` definition to `_kernel/standards.md#anchor`. Removes ~40 dup blocks. Risk: LOW.
3. **Resolve contradictions w/ web-research + confidence intervals** — **verify each candidate against the file first** (fonts flagged by recon was a FALSE POSITIVE). Then resolve once in kernel + cite. Risk: MED (some are product decisions — research, state confidence, surface if <0.7).
4. **Unify routing spine** — reconcile the 5 artifacts into one human `ROUTING.md` + generated machine `routing.json` (read by hook + `skill-router.py`). Single source of prompt→skill truth. Risk: MED (a loader reads these — keep back-compat).
5. **Prose → markdown lists** — convert tier-1/always-loaded files to scannable bullets (one idea/bullet, ≤2 lines). Biggest per-prompt token win. Risk: LOW.
6. **Frontmatter tiering + token budget** — ensure every skill/rule has `tier|priority|triggers|pack`; enforce a cap on the always-loaded tier. Risk: LOW.
7. **Extract code/examples → `reference/`** — router-invisible; keep instruction bodies lean. Risk: LOW.
8. **Frontmatter schema + CI validator** — fail on missing frontmatter, dangling `[[links]]`, orphaned skills, dead cross-refs. Risk: LOW.
9. **Merge micro-rules into thematic packs** — consolidate the 160 rules' siblings into anchored sections; coverage-checked so no directive is dropped. Risk: MED.
10. **Prune dead/superseded tech refs** — Supabase, Twilio-SMS, Lago/Unkey/Nango/Inngest/Postiz/Novu, AI-Agents, Resend send-rail → `archives/` + pointer. Risk: LOW.
11. **Repair `[[wikilink]]` graph** — fix dangling links; every cross-ref resolves to a real slug. Risk: LOW.
12. **Single human+AI entrypoint** — refreshed `llms.txt` / top `INDEX.md` "start here" mapping the system in lists. Risk: LOW.
13. **Coverage guarantee** — before/after directive checklist; assert compression lost no product value. The anti-regression gate for WS 2/5/9/10. Risk: LOW.
14. **De-dup multi-assistant mirrors** — ensure `.cursor/.windsurf/.roo/…` are generated from canonical by `sync_agents.py` (gitignored if pure derivatives), not hand-maintained copies. Risk: MED (verify sync script owns them first).

## Convergence state

| WS | Status | Result / next action |
|----|--------|----------------------|
| 1  | ✅ done | `bin/collapse-forged-commands.mjs` removed 4,154 pages. Files 4,720→566 (−88%), lines 406,259→92,228 (−77%). Reversible via re-forge. |
| 2  | 🔄 wip | Fires 2/4: `CONVENTIONS.md` brand→`#brand`; `image-optimization.md` budgets→`#budget` cite; CWV→`#cwv` (perf-profiler). `wcag-2-2-2026.md` KEPT (adds axe-testability mapping — value-add, not dup). Next: incidental brand/budget restatements in non-subject files. |
| 3  | ✅ done | Fires 3/4/5: Capacitor 6→8; Playwright v1.59+; React/Angular reframed as context-split (routing-matrix + CLAUDE.md); **PrimeNG→Spartan (Brian ruled, 41 files)**; i18n→`@angular/localize` (dashboard-cockpit aligned + claim corrected). Contradiction cluster RESOLVED. Pending (outside plugin repo): global `~/.claude/CLAUDE.md` (React-default, Capacitor 6, i18n). |
| 14 | ✅ V1 | Mirror single-source generator `bin/sync-mirrors.mjs` (fire 6) — stack-line synced across 31 targets + `--check`. Next: extend to full shared block; wire `--check` into lefthook (needs `/improve-lint` auth). |
| 4–13 | 🔄 active | Brian (fire 6): KEEP loop + token-efficiency · capability · usability · FOSS; MODERATE compression. Fire 7: ✅ **usability entrypoint** — `llms.txt` refreshed (stale counts 14→23 skills / 18→26 agents fixed; added routing spine + `rules/`/`_kernel`/`_packs` + the omitted skills 15/16/21–28; all links validate-skills-green). `doc-counts` gates README not llms.txt (left README alone). Next: capability-gap skills; finish safe fire-6 dedups (Bun 1.2→1.3, Opus cache-min 4.7→4.8, Hono pin). |

## Contradiction candidates (UNVERIFIED — verify before acting; recon can be wrong)

- **Frontend default** — ✅ RESOLVED (fires 4/5): reframed as a CONTEXT-SPLIT (not either/or) — Angular preferred for apps/admin/SaaS, React 19+Vite for marketing/generated-sites/bolt. Fixed `routing-matrix.md` + `CLAUDE.md:98-100` (React "(default)"→"marketing/generated/bolt"; Angular "(when chosen)"→"preferred for apps"), aligning to supreme-principle #3 + commit d406. Conf 0.9. FOLLOW-UP: global `~/.claude/CLAUDE.md` still says "Default: React / Optional: Angular" — add the context-split there too (outside plugin repo).
- **Capacitor** — ✅ RESOLVED (fire 3): web-verified current stable **8.5.1** (npm, Sept 2026); `CONVENTIONS.md` "8" was right, the 4 files' "6" was ~2yr stale. Standardized on **Capacitor 8** in `rules/frontend-stack.md` + `rules/angular-nx-monorepo.md`. Conf 0.8. OPEN: global `~/.claude/CLAUDE.md:100` still says "Capacitor 6" (outside plugin repo/gates — bump later).
- **PrimeNG vs Spartan** — ✅ RESOLVED (fire 4, **Brian ruled Spartan UI only** via AskUserQuestion). Aligned 41 stale promotions to Spartan: 39-file uniform sweep (mirrors + CONVENTIONS + CLAUDE.md + README + llms-full + publish.yml + skill 16) via `tmp/align-primeng-to-spartan.mjs` + skill 10 component bullet + `commands/dashboard-cockpit.md`. The Spartan-only rules + the documented 2026-05-29 PrimeNG→Spartan reversal (`rules/spartan-ui-only.md`) were already correct — kept. Conf 0.95. FOLLOW-UP: `01-operating-system/architecture-thought-loop.md:129` names PrimeNG in a bundle-size example (illustrative — left).
- **i18n library** — ✅ RESOLVED (fire 5): 3-way drift (`@angular/localize` rule vs `Transloco` in CLAUDE.md vs `ngx-translate` in dashboard-cockpit). Web-research confirmed `@angular/localize` is compile-time only (no in-app no-reload switch). Honored the rule → `@angular/localize` everywhere: fixed CLAUDE.md (Transloco→localize) + dashboard-cockpit (ngx-translate→localize, corrected the impossible "no-reload switch" claim to per-locale navigation). Conf 0.8. OPEN for Brian: if admin needs an in-app language toggle, soften the rule to a runtime lib for admin only (context-split).
- **Playwright** — ✅ RESOLVED (fire 3): plugin uniformly "v1.59+" (the "1.56" was only in global `~/.claude/CLAUDE.md`). Current stable 1.62.1; "v1.59+" (`+`) already admits it → no file churn. Bump floor when mirrors regenerate (WS-14).
- **Model IDs** — ✅ RESOLVED (fire 2): kernel `#model` Opus 4.7→4.8, defers to `rules/model-routing.md`. OPEN for Brian: **Fable 5** (`claude-fable-5`) exists in the live env but has no defined role in `rules/model-routing.md` — needs a routing decision (what is Fable 5 for vs Opus 4.8?).
- **Email** — SES-sole is settled; residual Resend send-rail refs in `README`/`email-templates.md` → prune (WS-10).
- **Brand purple** — skill 10 `--accent-purple:#8B5CF6` vs `_kernel#brand` `#7C3AED`. → align skill 10 to kernel (verify not intentional first).
- **Fonts** — ✅ RESOLVED (fire 2): real culprit was `CONVENTIONS.md` (Heading/Body reversed vs kernel + skills 10/22), NOT skill 10 (recon mis-attributed). CONVENTIONS.md brand block now points to `#brand`. Lesson: verify recon per-item.

## Fire-6 drift sweep (2026-09-25 — 9 findings, ~5% drift, mostly doc-sync not architectural)

- ✅ **RESOLVED (fire 9):** Bun `CLAUDE.md` 1.2+→1.3+; Opus prompt-cache min `CONVENTIONS.md` 4.7/4.6/4.5→4.8/4.7/4.6; Hono `rules/hono-api.md` v4.12.x→v4.12.12+ (matches CONVENTIONS security pin).
- **Dead/forbidden tech still shown as live** — Resend (README examples), Postiz (CONVENTIONS MCP list :293/:308), Supabase (cf-hyperdrive/cf-rag examples), Twilio (shared-api-pool, no SMS qualifier). Reframe as removed/legacy or qualify (WS-10). SCOPE-CHECK: Resend MCP *as a customer feature* is KEPT (per project CLAUDE.md) — only the send-rail is removed; Twilio voice/WhatsApp OK, SMS/phone-OTP forbidden.
- **Brand purple** — skill 10 `#8B5CF6` vs kernel `#7C3AED` → verify skill 10 intent, then align. clean-fix (pending verify).
- **Inngest vs CF Workflows v2** — `CLAUDE.md` "Inngest / Workflows v2" vs `CONVENTIONS.md` "Inngest v4" vs CF-native doctrine (projectsites REMOVED Inngest) → **Brian-decision** (in the question set).
- CLEAN on versions: Angular 21 · Nx 20+ · Node 22 · TS 5.9 · ESLint 9 · Playwright v1.59+ · Tailwind v4 · Clerk Core 3 · Drizzle v1 — all uniform.

## Dedup candidates (→ cite `_kernel/standards.md#anchor`)

- `CONVENTIONS.md` — brand hex `#brand`, stack table `#stack`, OWASP list `#owasp2025`, Playwright `#stack`.
- `07-quality-and-verification/wcag-2-2-2026.md` — WCAG 9-criteria list → `#wcag22`.
- `12-media-orchestration/image-optimization.md` — asset budgets → `#budget`.
- `agents/performance-profiler.md` — CWV targets (softer than kernel) → `#cwv`.

## Web-research log (quantitative choices + confidence)

- **Capacitor** (fire 3, 2026-09-25) — current stable **8.5.1** per npm `@capacitor/core` (8.x is the active major line). Choice: **Capacitor 8**. Confidence **0.8** (npm-verified current; no intentional-"6"-pin note anywhere; CONVENTIONS.md already at 8). Source: npmjs.com/package/@capacitor/core.
- **Playwright** (fire 3) — current stable **1.62.1** (1.63 landing) per npm + Wikipedia. Choice: keep **v1.59+** (the `+` admits current — no churn across 9 mirror files). Confidence **0.9**. Source: npmjs.com/package/@playwright/test.
- **Angular i18n** (fire 5) — `@angular/localize` is **compile-time only**: no in-app no-reload language switch (each locale = separate build/URL); runtime switch needs ngx-translate/Transloco (both rule-banned). Choice: honor the rule → `@angular/localize` everywhere; corrected dashboard-cockpit's impossible "no-reload switch" claim. Confidence **0.8**. Source: angular.dev i18n guide + angular/angular#56318.

## User direction (fire 6 — via AskUserQuestion)

- **Keep the 15-min loop running** — improving/compressing/enhancing/expanding, NOT winding down.
- **Invest in:** token/cost efficiency · capability coverage (new skills) · human+AI usability · **leverage FOSS**. (Did NOT pick a dedicated evals/quality track.)
- **Compression:** MODERATE — keep kernel+packs+trigger/fingerprint routing; no risky stub+on-demand.
- **Mirrors:** single-source generator (chosen) → `bin/sync-mirrors.mjs` shipped V1 (31 targets, `--check`).
- **FOSS mirror tools** (leverage-FOSS, for a fuller build): `lunetics/agent_sync` (13 tools) · `PanisHandsome/ai-rules-sync` (zero-dep + git hook). Neither covers all ~30 niche targets here AND both overwrite dirs — adopt only if the target set is trimmed to a covered subset. ⚠️ Windsurf caps rule files at 6K chars / 12K total; Codex 32KiB — guard when syncing multi-line blocks.
- **Enforcement gap:** wiring `sync-mirrors --check` into `lefthook.yml` was blocked by `config-protection` — needs `/improve-lint` or `CLAUDE_CONFIG_CHANGE_AUTHORIZED=1`. Until then, run `node bin/sync-mirrors.mjs` manually.

## Always-loaded reduction (fire 8 — Brian: provider-aware core + validate-first)

- **Diagnosis:** the ~55-rule preamble is Claude Code auto-loading plugin rules; **44 carry `paths:["*"]`** (force every prompt). Both router hooks only emit TEXT hints, not file loads. `~/.agentskills` is a **symlink → the plugin** (already unified — just canonicalize refs; nothing to merge). All 44 verified reachable via pack/triggers → dropping `paths:["*"]` is safe (0 orphans, reversible).
- **Levers:** supreme core = 11 `priority:1` rules (+ `01-operating-system`). Most of the 44 are `pack:core` (load via the core pack regardless of `paths`) → real levers are (a) demote **non-core-pack** `paths:["*"]` rules, (b) trim the core pack itself.
- **Decision (Brian):** **provider-aware** core — lean (~11) on DeepSeek, fuller (~20) on Claude (needs a small router-logic change → `/improve-lint` auth); **validate the lever first**.
- ⚠️ **Validation DISPROVED the `paths` lever (fire 9):** ran `bin/skill-router.py route` on a generic prompt — the 3 demoted rules were STILL selected, and **59 rules / 68,957 tokens** total. `paths:["*"]` is NOT what drives the load. (The 3 demotions are harmless + left in place, not reverted.) Validate-first earned its keep — this would've been a wasted 40-rule re-tier.
- ✅ **REAL LEVER:** `bin/skill-router.py` → `DEFAULT_BUDGET_TOKENS = 1_000_000` (line 52) + `apply_budget()` (line 617: sorts priority-asc, drops once over budget). With a 1M budget nothing drops → all ~59 candidates load. **Lower the budget → the priority-sorted tail auto-drops**, shrinking the preamble to the supreme core + top matches. No per-rule re-tier needed. Confidence 0.9.
- **THE FIX (provider-aware, per Brian):** make `DEFAULT_BUDGET_TOKENS` env-aware — DeepSeek (`ANTHROPIC_BASE_URL`/`ANTHROPIC_MODEL` contains `deepseek`) → ~35K (lean ≈ priority:1 core + top matches); Claude → generous (~200K, keeps current behavior). Reuses the existing priority-drop; ~8 lines.
- ⛔ **NEEDS AUTH:** `bin/skill-router.py` is config-protected → apply via `/improve-lint` or `CLAUDE_CONFIG_CHANGE_AUTHORIZED=1`. Patch is ready to ship on authorization.

## Domain-pack consolidation (task: "smallest file set w/o sacrificing responsiveness" — in progress)

Pattern (per pack, verified): merge members → `rules/<pack>.md` (union frontmatter, headings demoted, content preserved) → rewrite inbound `[[links]]` + `_packs`/router/reference refs → `git rm` old → **`rm ~/.claude/data/skills.db && skill-router.py sync-metadata`** (NOT rebuild-index — needs OpenAI key) → `markdownlint-cli2 --fix` → verify routing per member trigger → commit (24-gate).

- ✅ compliance 2→1 (`7376079`) · ✅ payments 2→1 (`b619b1a`) · ✅ angular 5→1 deduped (`ed0ccee`) · ✅ e2e-testing 2→1 (`d063c0a`). **160→153 rules.**
- CLEAN COHESIVE MERGES ~EXHAUSTED. Remaining opportunities are thin: email-deliverability + -implementation pair (co-relevant, ~2→1); a couple orphan groupings. ✅ `quality-metrics` kernel-deduped (`99425e8` — CWV/WCAG/JSON-LD → kernel citations, collapsed the #cwv LCP 2.5-vs-2.0 contradiction). NOT worth merging: infra (diverse members), design/content/frontend/media (shared members = responsiveness). Realistic floor ≈ 148-150 rules — the library is already well-factored; further merges trade responsiveness.
- KEY FINDING: packs are MANY-TO-MANY (rules ∈ multiple packs = the routing reuse). Only pack-EXCLUSIVE clusters merge cleanly. angular was 5-exclusive/0-shared (ideal). Remaining exclusive cores: **testing (5 excl; `verification-loop` stays — it's tier-1 core), infra (7 excl; `secret-*` stay — shared w/ backend)**.
- CANNOT cleanly merge (shared members): frontend/design/content/media (share copy-writing, text-contrast, cinematic-ui-patterns, gorgeous-by-default, image-quality, timeline-authenticity) — merging would duplicate or break reuse = sacrifice responsiveness.
- CAREFUL: research — `competitor-research` big + cross-linked → leave standalone. Packs with skill members → keep the skill in the pack yaml, merge only rule members. Bounded end-state ≈ 140-145 (not 130 — shared members are more prevalent than first estimated).
- SKIP (stay granular): **core (57) / backend (19) / ai (18)** — mega-files hurt readability + don't reduce tokens (core always-loads regardless); the token cut is the router-budget fix (needs `/improve-lint`). Projected end state ≈ **130 files**.

## Operating rules for this loop

- **Verify before edit** — read the actual file; recon summaries can be wrong (fonts proved it).
- **Idempotent + commit-per-workstream** — small atomic commits, conventional-commit + gitmoji; never leave the tree half-done.
- **Coverage guarantee (WS-13)** — every directive removed/merged must survive somewhere; log the mapping.
- **Don't clobber** — a fire re-running a done workstream must no-op. Update this table when a WS completes.
- **`skills/` is gitignored** — its edits won't show in `git status`; that's expected.
