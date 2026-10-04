---
description: GENERIC, project-independent wrapper for "run the loop". If the current repo ships its OWN .claude/commands/run-the-loop.md, this wrapper LOADS + FOLLOWS that project command verbatim (the project command WINS — this global file never overrides project-specific instructions). Only when NO project command exists does it run a generic convergence loop — orient the canonical home, fan out the 15 named roles + the standing Long-Trail TDD case-owner, converge, adversarially review, verify, ship, reconcile. Fires when the user says "run the loop".
argument-hint: "[role/lane name, category, or 'all' (default)]"
---

# Run The Loop (generic global wrapper)

> **PRECEDENCE CONTRACT (read first — this is the core requirement of this file).**
> This is a GENERIC, project-independent wrapper. It does **NOT** replace or override any
> repository's own `run-the-loop` command. **The PROJECT command always wins.** When the
> current repo ships its own `.claude/commands/run-the-loop.md`, this wrapper's only job is
> to **load and follow that project command verbatim**, then STOP. The generic loop below runs
> **only** when the repo has no project command of its own.

## 0 — FIRST INSTRUCTION (mandatory, do this before anything else)

**If `./.claude/commands/run-the-loop.md` exists in the current repo, READ it and EXECUTE its
instructions verbatim, passing through `$ARGUMENTS`, then STOP — do not run the generic loop
below.** The project command is the canonical owner of that repo's loop; this wrapper defers to
it completely.

- Check both common locations, nearest-wins: the repo-root `./.claude/commands/run-the-loop.md`
  first, then a monorepo sub-package `./<app-or-package>/.claude/commands/run-the-loop.md` if the
  current working directory is inside one. If either exists, follow it and STOP.
- This detection is **load-bearing, not decorative.** Claude Code's command resolution can let a
  same-named USER (global) command take precedence over the PROJECT one — so this wrapper must
  actively self-defer rather than assume the harness routes to the project file. Reading + executing
  the project command here guarantees the project's project-specific instructions run **unchanged**,
  regardless of which scope the harness picked to invoke.
- Do **not** merge, diff, or "improve" the project command — run it as written. Its roster, phases,
  gates, canonical answers, and paths are authoritative for that repo. This wrapper contributes
  nothing on top of it.

**Only if NO project `run-the-loop.md` exists anywhere in scope → fall through to §1+ below.**

---

# Generic convergence loop (fallback — no project command present)

One deliberate, VERIFIED fire of a convergence loop for whatever repo is current. Advance the
project's frontier by one coherent, verified slice per active workstream (default `all`; or scope
to `$ARGUMENTS`). **One coherent slice per role per fire** — never split a slice across follow-ups;
never start a large pass in a context-saturated session. Every fire is a **multi-phase wave**
(fan-out → convergence → adversarial-review → verify → ship → reconcile), never queue-draining, and
**leaves ≥1 improvement to how future loops run**.

## 1 — Orient (cheap; NEVER read giant ledgers in the main thread)

- **Canonical home = `.claude/run-the-loop/`** if it exists. Read the small operator docs, in order,
  and only the ones present:
  - `README.md` — what the loop is + how to run one fire.
  - `OPERATING-PRINCIPLES.md` — invariants, gates, the settled canonical answers, the category budget.
  - `BACKLOG.md` — the **frontier** (next unmet unit per workstream + acceptance). This is what you advance.
  - `ARCHITECTURE.md` — the system shape + load-bearing decisions.
  - `DISCOVERIES.md` + `LEDGER.md` — append-only; the main thread does NOT read these wholesale
    (delegate any deep read to a fresh `Explore` agent with a ≤150-line output cap; LEDGER is where
    completed slices + SHAs land).
- **No canonical home?** Orient from what the repo actually has: `README.md`, `CLAUDE.md`/`AGENTS.md`,
  a root `TODO.md`/backlog, `docs/`, `e2e/FEATURES.md`, open issues. Reconcile code, docs, tests, and
  visible behavior before choosing work — treat a doc describing a feature as a requirement to VERIFY,
  not proof it works.
- `git fetch origin -q && git pull --rebase origin <default-branch>` — a concurrent session may have
  progressed work; re-inspect the ACTUAL repo, never assume a prior attempt landed.
- **Context budget:** the main thread holds conclusions only. Never ingest trackers/ledgers/scope docs
  or any file it cannot act on directly; delegate inventory reads to fresh Explore agents. Heed any
  oversized-read/oversized-output guard.
- **HARD STOP = LEAD saturation ONLY.** Checkpoint to `progress.md` + fresh session only when the
  ORCHESTRATOR hits "Prompt is too long" / autocompact thrash on the lead / can't spawn. ONE worker
  agent dying (ECONNRESET, `subagent_tokens: 0` from a network drop, cut-off output) is fan-out
  ATTRITION → salvage its commit (`git show <branch-tip>` before `git branch -D`), re-queue its slice,
  and KEEP THE LOOP RUNNING. Read WHICH thing failed before checkpointing.

## 2 — Fan out the standing roster — EVERY fire, in ONE message

Spawn the roster together in ONE message — fresh, worktree-isolated (mutating) or read-only
(research) — on disjoint subtrees. Keep ≥1 coding role active whenever ready work exists.
**≤6 concurrent mutating agents** (read-only sweeps are free + uncapped; run >6 units as sequential
waves of ≤6). Map each role to the best-fit specialist — NEVER a bare `general-purpose` when a named
specialist fits. Emit the assignment table + rejected-agent note BEFORE spawning; run the Agent
Diversity Review gate before DONE.

**The 15 canonical roles (a floor, not a ceiling):**

1. **Feature Delivery** — take a READY frontier slice; ONE coherent slice end-to-end (schema + handler + UI + tests + flag + docs). Specialist: domain builder / `migration-agent` / `general-purpose`.
2. **Product Discovery** — reconcile the priority journey + route/journey coverage; propose platform/journey/screen/state improvements; GENERATE next-wave backlog items. Specialist: `architect` / `content-writer`.
3. **Unit/Integration Testing** — TDD units + integration for shipped + at-risk code; close coverage gaps. Specialist: `test-writer`.
4. **Golden-Path E2E** — the LONG-journey engine (§6): 30-50+ action journeys against the real app + real backend, build-diagnose-fix-continue. Specialist: `test-writer` / `deploy-verifier`.
5. **UX/Visual** — screenshot the priority journey @ 6bp, AI-vision ≥8/10, brand tokens, embarrassingly-easy-to-use gate. Specialist: `visual-qa`.
6. **Architecture** — drift sweep, feature-module coherence, orphan detection, one-way-door ADRs. Specialist: `architect`.
7. **Repository Compression** — dead-weight in code: consolidate dupes, thin fat modules, shrink bundles. Specialist: `code-simplifier`.
8. **Documentation** — keep `CLAUDE.md`/`AGENTS.md` + `docs/` + `README` + `e2e/FEATURES.md` truthful to shipped reality; ADRs for decisions. Specialist: `content-writer`.
9. **Doc Compression** — compress verbose docs losslessly; retire stale/duplicate docs into the canonical home. Specialist: `content-writer`.
10. **Dead-Code/Hygiene** — `knip`/`ts-prune` + unused deps + stray logs + resolvable TODOs; verify-then-remove. Specialist: `dead-code-remover` / `code-simplifier`.
11. **Performance** — Lighthouse + CWV (LCP≤2.0s / CLS≤0.05 / INP≤100ms), bundle budgets, N+1 waterfalls. Specialist: `performance-profiler`.
12. **Security** — OWASP + IDOR + CSP + secrets + supply chain + SSRF. Specialist: `security-reviewer` (Opus-pinned).
13. **Accessibility** — axe 0 @ 6bp + the 8 manual WCAG 2.2 AA criteria. Specialist: `accessibility-auditor`.
14. **Technology Scout** — verify stack currency + surface higher-leverage primitives / library upgrades (Context7 / WebSearch); file adoption slices. Specialist: `dependency-auditor` / `Explore`.
15. **Loop Improvement** — deliver the mandatory ≥1 improvement to how future loops run (§7): sharpen this wrapper / the canonical docs / a gate/script / a role brief. Specialist: `general-purpose` / `meta-orchestrator`.

**PLUS the standing role (runs EVERY fire, alongside the 15):**

- **Long-Trail TDD case-owner** — the browser-connected coding agent that OWNS code + tests + a live
  browser in ONE isolated worktree and drives an EXACT, LONG, stateful test case to completion via TDD.
  **Follow the `long-trail-tdd` skill for the full case-design contract** (design the durable numbered
  case first; ~60–100 meaningful browser actions across ≥6 surfaces; per-action starting-state / exact
  UI action + locator / expected visible state / expected API-or-storage effect / screenshot-required
  flag; navigation-away-and-back + hard-refresh persistence + empty/error states + undo/cleanup +
  cross-feature causal checks; observe a genuine RED before touching product code, fix the root cause,
  get GREEN, and CONTINUE the same journey; one screenshot + AI-vision inspection after every distinct
  view; resume unfinished cases from a durable checkpoint across cycles). This role uses a REAL local
  dev composition + local Playwright/Chromium (mocks/`page.route` stubs do NOT count as proof); it
  authenticates through the real test UI + backend; it prefers finishing a checkpointed case before
  rotating coverage; and it never runs two overlapping copies on the same case/resources. The UX/Visual
  role SUPPORTS the case-owner without creating competing edits.

**Dynamic role creation** — when a fire surfaces a concern no canonical role owns (a new integration,
a recurring incident class, a migration campaign), MINT a purpose-built role that fire: name it, give
it scope + a specialist + acceptance, record it. If it recurs, promote it into the roster via the Loop
Improvement role.

Each brief is self-contained, 150–300 words: its slice · the ONE canonical doc path to read (the
BACKLOG frontier + at most one section) · reuse-not-reimplement pointers · verify gates · "commit
ONLY your paths, NEVER `git add -A`, rebase if push rejected" · "tick your backlog line + append the
ledger/discoveries". Write the primary deliverable FIRST (resilience: the first `Write` is the primary
artifact, before any optional reads). Briefs stay tiny with near-zero exploratory reads — an agent told
to "go read the whole app" dies at `subagent_tokens: 0`.

## 3 — Category budget (prevent starvation, NOT rigid quotas)

Across a fire's roles (and across recent fires), keep the mix roughly within these bands; a fire may
deviate for a genuine reason, but the loop over ~3–5 fires should trend into them. Rotate roles
fire-to-fire so nothing rots.

- **Product / bug fixes** — 30–45% (Feature Delivery + priority-journey bug slices lead every fire).
- **Testing / golden paths** — 15–25% (Unit/Integration + the LONG golden-path engine + the Long-Trail case-owner).
- **Architecture** — 10–20% (drift, modules, ADRs, orphans).
- **UX / a11y** — 5–15% (Visual QA + Accessibility).
- **Cleanup** — 5–15% (Repository Compression + Dead-Code/Hygiene + Performance).
- **Docs** — 5–10% (Documentation + Doc Compression).
- **Discovery** — 5–10% (Product Discovery + Technology Scout — the backlog replenishers).
- **Loop-improvement** — 5% (the standing ≥1 improvement, §7).

If a category has starved across the last few fires, over-weight it THIS fire until the mix rebalances.

## 4 — Per-role discipline (inside each agent)

- **TDD:** failing test FIRST → implement → green. Bug fix = failing regression first.
- **Reuse, don't reimplement** — existing snapshots, integrations, deploy machinery, the feature-module + flag machinery, shared UI primitives, shared state services.
- **Flags:** every new capability behind a default-OFF flag (registry + manifest + docs); server returns 404 when off; UI returns null.
- **IDOR / authz:** assert resource ownership on any new per-resource handler.
- **Invariants:** honor the repo's `OPERATING-PRINCIPLES` where present — never force-push the default branch; additive-only migrations by default; ship reversible prod actions when green, never hold "committed but dark."

## 5 — Convergence phase (AFTER fan-out — normalize before review)

Once the fan-out slices land in the main thread, run ONE convergence agent (or the main thread when
lean) to make the merged whole coherent:

- Normalize patterns across the merged slices (shared contracts, naming, error envelopes, brand tokens) so parallel work doesn't drift apart.
- Run the full fast gate suite (typecheck + touched tests + lint + any feature/drift validators) across the union of changes; fix conflicts + lint/type drift in-thread.
- **Update the ledger** — one line per advanced slice with the commit SHA + prod proof; tick each advanced backlog frontier line.
- Fold every role's newly-found, DEDUPLICATED items into the backlog (Product Discovery + Technology Scout + Golden-Path + Long-Trail lead the replenish) so the NEXT fire has ready work.

## 6 — Golden-Path Engine: LONG build-diagnose-fix journeys

The Golden-Path E2E role does NOT write short happy paths. It generates **LONG journeys of 30-50+ UI
actions that emulate a developer building a real app** — proceeding deep into a flow, hitting an error
mid-journey (~click 30-50), diagnosing + fixing it via TDD, then CONTINUING the journey to completion.
This is the loop's primary way of finding + fixing real defects. (The Long-Trail TDD case-owner in §2
runs the even-longer 60–100-action stateful, checkpointed variant per the `long-trail-tdd` skill.)

**Per-journey contract:**

- **Start at the homepage**, navigate by UI actions ONLY (clicks / keyboard / real forms) — never `page.goto()` after the initial load. Real UI + real backend, NEVER mocks.
- **Go LONG (30-50+ actions):** chain many real steps deep into a flow — don't stop at first success. Assert visible content + console-error-free + axe-clean at each meaningful step; screenshot every step to `e2e/screenshots/{journey}/{step}.png`.
- **Hit an error mid-journey:** a naturally-surfacing defect OR a deliberately deep/edge interaction that exposes one. When it fires, PAUSE the journey and switch to TDD repair.
- **Diagnose + fix via TDD:** reproduce → encode the expected behavior as a failing test → fix the root cause (never suppress) → rerun green → verify visually (screenshot / AI-vision) → keep/extend coverage for the class. If an existing step already passes, retain that baseline and explore further — never manufacture an error at a prescribed click number.
- **CONTINUE the journey to completion** after the fix — prove the whole path works end-to-end, not just up to the break.
- **Vary journeys each cycle** — pick a DIFFERENT slice of routes / controls / features / APIs / roles every fire. Record which journey ran in the ledger so the next fire varies.

## 7 — Loop self-improvement mandate (≥1 EVERY cycle)

Every fire MUST leave the loop measurably better at running future fires — non-negotiable, owned by
the Loop Improvement role (any role may contribute). Pick at least ONE:

- Sharpen THIS wrapper (a clearer phase, a fixed gap a re-prompt revealed, a better role brief).
- Improve a canonical doc (`OPERATING-PRINCIPLES`, backlog hygiene, `ARCHITECTURE`, `README`).
- Harden a gate/script (a new drift/orphan/reconcile check, a faster verify, a golden-path helper).
- Retire a recurring shortcoming: capture it where the repo records shortcomings + add the rule/gate that prevents it (a re-prompt on the same surface is a prediction miss — capture it THE SAME FIRE).
- Promote a proven dynamic role into the §2 roster, or rebalance the §3 category budget from observed starvation.

A fire that ships zero loop-improvement under-delivered — surface why in the report and do it next fire first.

## 8 — Verify (green BEFORE commit — no claim without fresh output)

- Run the repo's real gates for each touched surface: typecheck + the touched tests (broaden if fast) + lint + any feature/drift validators + a build for any UI slice.
- Claim ONLY what you ran THIS fire — paste the command output; a prior run or "looks correct" is not evidence.

## 9 — Ship (prod pre-authorized for the user's own repos)

- Commit each slice to the **default branch** (conventional commit) + push (rebase if rejected). Prefer working on the default branch directly; delete any worktree + branch the moment its work lands (cleanup is NOT automatic).
- Deploy the changed surface with the repo's real deploy command. A concurrent dirty tree blocks a local deploy → the push→CI pipeline is the deploy path.
- **Prod-verify the changed routes** (curl / Playwright / WebFetch) — a local pass is NEVER sufficient. Assert the change live; reconcile data surfaces display-vs-store, never render-alone.

## 10 — Reconcile + report

- Tick each advanced frontier line in the backlog + append the ledger with the commit SHA + prod proof. Move a workstream to Done only when Acceptance is fully met.
- **Replenish the backlog:** append the DEDUPLICATED next-wave items (Product Discovery + Technology Scout + Golden-Path + Long-Trail findings + the adversarial reviewer's fresh defects) so the NEXT fire has ready work.
- **Confirm the ≥1 loop-improvement landed** (§7) and name it in the report.
- Report per the standard end-of-response block: Changes · Next unmet unit per workstream · which golden/long journey ran + what it fixed · external blockers · Recs (only genuine >2h / design-call / destructive-decision items — ship everything else inline).

## Adversarial-review phase (hunt regressions the fan-out introduced)

After convergence, spawn ONE adversarial reviewer whose ONLY job is to try to BREAK the merged result:

- Re-run the priority-journey end-to-end; assert nothing upstream broke.
- Diff-review for: contract drift between slices, a flag left on, an IDOR on a new per-resource route, a swallowed error, a soft-404, a lying-empty surface (reconcile display-vs-store), a fix inert behind a false precondition.
- Any regression found → fix-forward in the main thread or ONE targeted agent (never re-fan-out for repair). Re-verify before shipping.
- The reviewer is Opus-pinned when the merged change touches auth / payments / security.

## Discipline (non-negotiable)

- One coherent slice per role per fire; fan out for independence; the main thread orchestrates + converges + reviews + **deploys once** + verifies — agents never deploy independently.
- **Delegate-when-saturated:** if the main thread is context-heavy, fresh agents do the heavy pass while the main thread stays lean. HARD STOP + fresh session is a LEAD-saturation trigger ONLY; a single worker's transient failure is fan-out attrition → salvage + re-queue + keep running.
- If the repo's `.gitignore` blocks `*.md`, use `git add -f` for canonical-home / backlog / ledger / doc updates.
- Destructive/irreversible actions → ship the decision-independent slice, never auto-execute the destructive action.
- A workstream is DONE only when Acceptance passes + the ledger records it + no dead refs remain.
