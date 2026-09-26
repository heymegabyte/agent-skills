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
| 2  | 🔄 wip | Fire 2: `CONVENTIONS.md` brand block → cites `#brand` (killed reversed-fonts drift). Next inliners: `07-quality-and-verification/wcag-2-2-2026.md`→`#wcag22`, `12-media-orchestration/image-optimization.md`→`#budget`, CWV soft-targets (`agents/performance-profiler.md`, `rules/quality-metrics.md`)→`#cwv`. |
| 3  | 🔄 wip | Fire 2: kernel `#model` refreshed Opus 4.7→4.8, defers to `rules/model-routing.md` (already current+cited). Next (need web research + confidence): Capacitor 6-vs-8, PrimeNG-vs-Spartan, React-vs-Angular phrasing, Playwright 1.56→1.59. |
| 4–14 | queued | See plan above. |

## Contradiction candidates (UNVERIFIED — verify before acting; recon can be wrong)

- **Frontend default** — `routing-matrix.md` "always React 19 + Vite" vs `CLAUDE.md`/`21-app-foundation` "Angular-preferred". Recent commit trend = Angular-preferred for apps, React for marketing/bolt. → verify + phrase once.
- **Capacitor version** — `CONVENTIONS.md` "8" vs `CLAUDE.md`/rules "6". → **web-research current stable**, cite, state confidence.
- **PrimeNG vs Spartan** — skill 10 line 129 + `CONVENTIONS.md` (PrimeNG) vs Spartan-only rule vs global CLAUDE.md "PrimeNG (admin)/Spartan (marketing)". → verify authority; likely admin=PrimeNG, marketing=Spartan.
- **Playwright** — `CLAUDE.md` "v1.56+ agents (v1.59+ MCP)" vs rules "v1.59+". → unify to v1.59+.
- **Model IDs** — ✅ RESOLVED (fire 2): kernel `#model` Opus 4.7→4.8, defers to `rules/model-routing.md`. OPEN for Brian: **Fable 5** (`claude-fable-5`) exists in the live env but has no defined role in `rules/model-routing.md` — needs a routing decision (what is Fable 5 for vs Opus 4.8?).
- **Email** — SES-sole is settled; residual Resend send-rail refs in `README`/`email-templates.md` → prune (WS-10).
- **Brand purple** — skill 10 `--accent-purple:#8B5CF6` vs `_kernel#brand` `#7C3AED`. → align skill 10 to kernel (verify not intentional first).
- **Fonts** — ✅ RESOLVED (fire 2): real culprit was `CONVENTIONS.md` (Heading/Body reversed vs kernel + skills 10/22), NOT skill 10 (recon mis-attributed). CONVENTIONS.md brand block now points to `#brand`. Lesson: verify recon per-item.

## Dedup candidates (→ cite `_kernel/standards.md#anchor`)

- `CONVENTIONS.md` — brand hex `#brand`, stack table `#stack`, OWASP list `#owasp2025`, Playwright `#stack`.
- `07-quality-and-verification/wcag-2-2-2026.md` — WCAG 9-criteria list → `#wcag22`.
- `12-media-orchestration/image-optimization.md` — asset budgets → `#budget`.
- `agents/performance-profiler.md` — CWV targets (softer than kernel) → `#cwv`.

## Operating rules for this loop

- **Verify before edit** — read the actual file; recon summaries can be wrong (fonts proved it).
- **Idempotent + commit-per-workstream** — small atomic commits, conventional-commit + gitmoji; never leave the tree half-done.
- **Coverage guarantee (WS-13)** — every directive removed/merged must survive somewhere; log the mapping.
- **Don't clobber** — a fire re-running a done workstream must no-op. Update this table when a WS completes.
- **`skills/` is gitignored** — its edits won't show in `git status`; that's expected.
