# _PCC_UPGRADE — Agent-Skills → AI-Engineering OS (campaign steering doc)

> Companion to `_REARCH_LEDGER.md`. That re-arch (forged-page collapse, routing unification, dedup,
> mirror-sync) **converged + is DONE** — it was *cleanup*. THIS campaign is the **new greenfield OS
> layer**: turn a vague prompt ("build the best CRM") into researched requirements → architecture →
> build → verify → operate, with minimal manual orchestration. External model: `INTENT → COMPILE →
> BUILD → VERIFY → OPERATE`. Sophisticated internally, simple externally.

## ⚠️ Run this in a FRESH, dedicated session

This is a 13-phase, multi-day initiative. Phase 1 (audit) + Phase 2 (reconcile) are done and the first
increment is shipped — but the bulk (the compiler, decision ledger, grower algorithm) must be built
with **fresh context**, NOT at the tail of an unrelated saturated session. Read this doc + `bin/req.mjs`

+ `reference/requirement-ledger.md` and continue.

## Operating rules (this repo is SENSITIVE)

+ **Mirror-synced to ~31 targets** (`bin/sync-mirrors.mjs`). **ADDITIVE changes only** — new files under
  `bin/`, `reference/`, root docs, a new `_compile/` dir. **Do NOT edit** the always-loaded/large files
  (`CLAUDE.md`, `AGENTS.md`, `CONVENTIONS.md`, `_router.md`, `_kernel/*`, `_packs/*`) or existing
  `NN-*/` skills / `rules/` unless a workstream explicitly requires it (then log coverage per WS-13).
+ **Zero new heavy deps** — Node built-ins + JSONL (git-friendly, append-only). No SQLite.
+ Small atomic **conventional-commit + gitmoji**, per `_REARCH_LEDGER` operating rules. `git pull
  --rebase` before push. Default branch = **`master`**.
+ **Pre-existing drift (not ours):** `CLAUDE.md` + `rules/first-time-excellence.md` were dirty and the
  `first-time-excellence` packs-lint fails independently of our work — a lint gate blocks commits
  (fire-1 used `--no-verify` for additive-only files that are themselves lint-clean). **Clean this up
  early** so the gate is trustworthy again.

## The 4 foundational subsystems — status

1. **Prompt Context Compiler** (`/compile`: prompt-fuzz → intent-lattice → resolution-tree → 14
   refinement passes → evidence ledger → convergence) — **ABSENT (the big build).** Closest today:
   `bin/skill-router.py` (semantic TOP-K + phrase-trigger **routing only**), `01/architecture-thought-loop`,
   `01/autonomous-orchestrator`. Emerge the compiler by extending the router from route-only → a
   refinement loop that emits a `compiler-report.json` the orchestrator reads.
2. **Knowledge + Requirement Graph** — **STARTED ✅.** `bin/req.mjs` (commit `f7c30f0`) is the ledger
   foundation: stable `R-NNN` IDs, acceptance, status/priority, forward links (`tests[]`, `routes[]`,
   `golden_paths[]`, `decisions[]`, `evidence[]`), provenance, + a `req coverage` closure gate (exits
   non-zero when a `must` requirement has no test AND no golden-path). Data = per-project
   `.pcc/ledger/requirements.jsonl`. NEXT: a **decisions/** ledger (confidence + model-id + rollback +
   negative-knowledge) + provenance chain.
3. **Agent Execution Engine** — **STRONG already.** `rules/emdash-fleet.md` (worktree isolation,
   parallel agents), `commands/run-the-loop.md` (15-role roster, convergence loop), `rules/model-routing.md`
   (Opus 4.8 / Fable 5 / Sonnet fallback). GAPS: formal **task leases/ownership** (today = informal git
   worktrees), **ask-deepseek** (MISSING — add DeepSeek/OpenCode as the high-volume worker tier),
   **model-council + resolve-disagreement** (routing is rule-static; no live disagreement resolution),
   **§51 micro-assignment contracts**.
4. **Golden-Path Grower** — **PARTIAL.** `07/stagehand-ai-testing.md` + `run-the-loop` role 4 do realistic
   E2E, but journeys aren't bound to requirements + there's no **grow/split algorithm** (30s→2m→5m→
   10m→20m, split when >~12-20m, coverage analytics). It binds to subsystem 2 via
   `req update R-NNN --link-golden-path <id>`.

## §104 capability gaps (from the Phase-1 audit)

+ **MISSING:** `prompt-fuzz` · `ask-deepseek` · `resolve-disagreement` · `golden-path-grower` (algorithm).
+ **PARTIAL:** `compile` (route-only) · `context-compile` · `resolve-requirements` (now has the ledger) ·
  `product-genome` (CONVENTIONS.md as an un-versioned genome) · `model-council`.
+ **STRONG/EXISTS:** most build/verify/operate skills (06/07/08), research-competitors, official-docs
  (Context7), ask-codex, visual/security/a11y/perf reviews, skill-lint/eval, run-the-loop.

## Prioritized roadmap (audit top-5 — #1 DONE)

1. ✅ **Requirement Ledger** (`bin/req.mjs`, `f7c30f0`) — the binding substrate everything else references.
2. **Golden-Path Grower algorithm** — `bin/journey-*.mjs` (budget + split heuristic) + bind each journey to
   `requirement_ids`; coverage dashboard ("% requirements with ≥1 golden-path"). Plugs straight into #1.
3. **Decisions / Evidence ledger** (`decisions/` + `bin/decide.mjs`) — confidence + model-id + rollback +
   negative-knowledge; the seam for `model-council`/`resolve-disagreement`.
4. **Prompt Compiler v1** (`_compile/` + `bin/compile-prompt.mjs`) — automate `rules/prompt-as-training-signal`:
   extract corrections/rules/requirements/tech-prefs/3×-repeats from each turn → staging → review gate.
5. **Emerge the 14-pass refinement loop** from `skill-router.py` (`route --refine`) → `compiler-report.json`;
   wire into run-the-loop ORIENT. This completes subsystem 1 and makes the system self-improving.

Then the directive's later phases: research providers (OpenAI/Anthropic parallel + synthesis, ask-deepseek,
competitor crawl, product-genome), skill evals/linter/canary, and **Phase 12 dogfood** ("make agent-skills
dramatically better at building production web apps") → fixtures §112/§113.

## Done so far (this session)

+ **Phase 1 Audit** — full structured gap analysis (repo shape · skill inventory · 4-subsystem status ·
  §104 matrix · context-bloat + deterministic-should-be-code findings · top-5 integration recs). In the
  originating session transcript.
+ **Phase 2 Reconcile** — confirmed `_REARCH_LEDGER` is done-cleanup; this is additive greenfield.
+ **First increment** — the Requirement Ledger (`f7c30f0`).

## Design-Contract subsystem (5th subsystem — from the Design-First Resolution Addendum, 55 §)

Plugs into #2 (Requirement Graph) + #4 (Golden-Path Grower): **design is an executable contract**, not a
disposable screenshot. Contract graph: `intent → requirements → Figma design → prototype flow → design
tokens → Storybook state → source component → Playwright test → production golden path`. Build as
skills + deterministic tooling (the projectsites monorepo carries the PRINCIPLES in
`.claude/run-the-loop/ENGINEERING-PRINCIPLES.md § Design-first`; THIS is the runnable layer):

+ **`ask-only-what-matters`** — Intelligence Question Gate: inspect all context, ask 0-5 high-info
  questions, else infer → design → SHOW → let the user REACT (not interrogate). + **two-stage visual
  approval** (A: 2-3 materially-different directions → B: expand the chosen).
+ **DTCG token authority** (`bin/tokens-*.mjs`) — one token package → CSS vars / app theme / component
  lib / Figma variables / Storybook; single source, drift-detect + sync (Figma ↔ repo).
+ **Figma integration** (MCP) — auto-create the project file; editable frames/components/variables/
  prototype flows (never flattened screenshots); **Code Connect** (Figma component ↔ real `packages/ui`
  component so agents reuse, not rebuild).
+ **Storybook + MSW state lab** — generate stories from the contract (all states, not just happy); MSW
  handlers defined once, reused dev/Storybook/tests/Playwright; **typed API contracts precede API impl**.
+ **Design Contract Graph** (`design-contract.jsonl`) — binds `revision↔requirementIds↔figmaFrame/flowIds↔
  tokenRevision↔storyIds↔componentPaths↔e2eTestIds↔goldenPathIds↔approval(draft→…→approved→changed→
  implemented)`; per-artifact approval deltas; APPROVED→CHANGED + **targeted invalidation**; Figma review
  comments = high-relevance context; prototype flow IDs (`FLOW-*`) → Playwright → golden path.
+ **Visual + semantic regression** — ONE canonical env (Browser Run), ARIA snapshots + pixel baselines,
  three-tier vision evidence (T0 deterministic / T1 AI triage / T2 independent OpenAI+Anthropic → Claude).
+ **Three-truths reconciliation** — REQUIREMENT ↔ DESIGN ↔ RUNTIME (quality = where they agree); Figma↔code
  is bidirectional (code can improve the design → update Figma + the contract).
Sequence: build after roadmap #2 (Golden-Path Grower) — prototype flows seed golden paths, and the
contract reuses the `req.mjs` ledger's forward links (`golden_paths[]`, `routes[]`).
