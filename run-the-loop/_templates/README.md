# /run-the-loop — Canonical Home

> **`CONSTITUTION.md` GOVERNS — read it first, every fire.** As of fire-59 (2026-09-30) the
> loop runs under [`./CONSTITUTION.md`](./CONSTITUTION.md): the Autonomous Visual Product
> Organization — three nested loops (micro/product/org), visual-first closed-loop
> development, golden paths as executable product design, the Browser Operating Layer, the
> Project Genome, and the 15-minute heartbeat. This README is only the operational wrapper
> (file map · fire protocol · standing invariants). Conflicts → the constitution wins;
> where it is silent on an operational safety fact, this file + `./OPERATING-PRINCIPLES.md`
> bind.
>
> Product: **"we don't sell websites, we deliver them."** Money path = search → signin →
> AI build → view live → edit → publish (Brian's #1). WfP is the default serving path;
> full autonomy on reversible prod (`./OPERATING-PRINCIPLES.md` § Canonical answers).

## File map (this dir)

- **`CONSTITUTION.md`** — the governing operating model. Read FIRST.
- **`OPERATING-PRINCIPLES.md`** — non-negotiable engineering invariants (design ·
  architecture · testing · security · a11y · perf · git · failure taxonomy · fire lease).
- **`BACKLOG.md`** — live cadence-tagged queue (FRONTIER 0 = constitution bootstrap).
  Cadence tags are a floor, not a cap — bring a role forward when it's highest-value.
- **`LEDGER.md`** — per-fire close-out entries (what shipped · SHAs · prod proof).
- **`DISCOVERIES.md`** — evidence-backed findings awaiting promotion to BACKLOG items.
- **`ARCHITECTURE.md`** — system shape (Worker/Hono/D1/R2/KV/DO/Workflows · WfP · admin SPA).
- **`GENOME.md`** *(new this fire)* — Project Genome: compact rebuild-grade knowledge.
- **`GOLDEN-PATHS.md`** *(new this fire)* — gp-01..gp-08+ long journeys as executable design.
- **`VISUAL-COVERAGE.md`** *(new this fire)* — visual-coverage map + rotation of visual debt.
- **`BROWSER-OPERATING-LAYER.md`** *(new this fire)* — browser modes · profile vault · freeze.
- **`CF-RELEASES.md`** — CF release-scout ledger (GUID-deduped; explicit decision per release).
- **`salvage/`** — rescued commits/diffs from dead worker agents (salvage before delete).
- Also here: `CAMPAIGN-cf-native-ai.md` (campaign sub-ledger) · `NEXT-SESSION-BOOTSTRAP.md`
  (fresh-session pointer) · `.fire-lease.json` (live lease state).
- **Pointed-to:** `.claude/commands/run-the-loop.md` (the command; roster contracts
  §§1.1–1.18 incl. standing Long-Trail TDD §1.16, Deep UI Explorer §1.17, Template
  Evolution §1.18) · retired tombstones root `_LOOP.md` / `apps/project-sites/_RUN_THE_LOOP.md`
  · `apps/project-sites/_LOOP_LEDGER.md` (2.3 MB — NEVER main-thread-read; Explore agent only).

## Fire protocol (one fire, in order)

1. **Claim the lease** — `node scripts/loop-fire-lock.mjs claim fire-<n>-<slug>`. Exit 3 =
   a live fire holds it → coalesce: end this tick (the running fire already advances the
   same backlog). Stale lease (heartbeat >20 min) auto-reclaims — a dead lead never wedges
   the loop.
2. **Heartbeat INLINE, per phase** — `node scripts/loop-fire-lock.mjs heartbeat
   fire-<n>-<slug>` after each phase so the lease stays live. NEVER background a
   detached `while true; heartbeat; sleep` loop — it outlives a dead fire and holds
   the lease forever, wedging every future tick into coalescing (the zombie-heartbeat
   deadlock; fire-66). The lock's `MAX_AGE_MS` cap is only a backstop; inline is the rule.
3. **Run the constitution's 15-MINUTE HEARTBEAT stages** (CONSTITUTION § The 15-Minute
   Heartbeat): ORIENT → LOOK → EXPERIENCE → MEASURE → RESEARCH → IMAGINE → PRIORITIZE →
   IMPROVE THE PLAN → FAN OUT → BUILD → RENDER → ITERATE VISUALLY → TEST → EXPLORE →
   EVALUATE → REPAIR → SIMPLIFY → VERIFY AGAIN → LEARN → META-IMPROVE → COMPRESS → HAND OFF.
   Fan-out: parallel worktree-isolated specialists in ONE message, ≤6-wide mutating,
   disjoint subtrees, 150–300-word self-contained briefs, primary deliverable written
   FIRST. Creator ≠ final judge — independent adversarial review before DONE.
4. **Verify (green BEFORE commit — fresh output, no claim without it)** — worker:
   `npx tsc --noEmit` + Jest (run FROM `apps/project-sites`; config is `.cjs`) +
   `npm run validate:features`. Frontend: `npx tsc --noEmit -p tsconfig.app.json` +
   `ng build` (catches NG template errors tsc/karma miss). Editor (`app/`): Vitest.
   Console-error / CSP / Trusted-Types / unexpected 4xx-5xx / axe in ANY test = build fail.
5. **Deploy ONCE (main thread)** — `cd apps/project-sites && npx wrangler deploy --env
   production` (`--env production` MANDATORY or every `/api/*` route 500s). Frontend R2
   deploy has no Docker dep; container/DO builds need Docker. Editor Pages via
   `wrangler pages deploy`. Auth: `CLOUDFLARE_API_KEY` (get-secret) +
   `CLOUDFLARE_EMAIL=blzalewski@gmail.com`. NEVER modify already-set CF secrets. Agents
   never deploy independently.
6. **Prod-verify (a local pass is NEVER sufficient)** — curl/Playwright the changed routes
   LIVE: WfP → `x-ps-serve: wfp` + styled 200; admin → real-browser click-around; verify
   Angular deploy by HASH, not grep; 0 console errors, axe-clean. Reconcile
   display-vs-store on every data surface (`groundTruth>0 && display==0` = lying-empty).
7. **Commit main + push** — straight to `main`; `git add -f` (`.gitignore` blocks `*.md`);
   conventional-commit + gitmoji IS the PR description; rebase if rejected, NEVER
   force-push main; merge + delete every worktree AND its branch this fire.
8. **Append the LEDGER entry** — `./LEDGER.md`: fire id · what shipped · SHAs · prod proof.
   Tick BACKLOG items (Done only when Acceptance met, with closing SHA + prod proof).
9. **Release the lease** — `node scripts/loop-fire-lock.mjs release fire-<n>-<slug>`.

## Product direction (Brian 2026-10-01 — steers every fire's ranking)

- **GTM: DELIVERED OUTBOUND.** Lead-scanner finds local businesses → loop PRE-GENERATES
  their site (gp-09 machinery is the same muscle) → outreach shows it LIVE → owner claims.
  "We don't sell websites, we deliver them" is the literal funnel, not a tagline.
- **Pricing: $0 PREVIEW → $29/mo CLAIM.** Generated site viewable free on its subdomain
  (owner-draft/public-gated rules apply); claiming = $29/mo via Stripe (custom domain,
  edits, AI ops, email). The preview IS the pitch.
- **LAUNCH BAR (flip public + announce ONLY when all three green):** (1) gp-05 checkout
  green end-to-end; (2) 10 gallery-grade showcase sites at vision ≥9; (3) gp-09 recreate
  loop stable at <5 min / ≤$1. Then QUIET launch — no announcement ritual.
- **Edit surface: INTENT-FIRST CHAT is the owner's primary surface** ("What do you want
  to change?" → AI performs, owner confirms). The bolt.diy editor remains as
  progressive-disclosure ADVANCED mode — invest editor depth only where it serves the
  chat rail or power users.

## Standing invariants

- **Cadence: GitHub per-repository workflows on the primary persistent Ubuntu VM.** `2,17,32,47 * * * *` requests one loop for each enabled repo. A small local workflow calls the SHA-pinned reusable implementation in `heymegabyte/agent-skills`. OpenClaw orchestrates through Claw Router and official subscription CLIs. See `control-plane/FLEET.md` in the shared source. The old Mac session-cron/cloud-container proposal is superseded.
- **Fire budget ~3M subagent tokens (heavy roster)** — Brian 2026-10-01. Evaluator sweep +
  builders + champion/challenger + multi-critic vision allowed every fire; report spend in
  the LEDGER entry.
- **Delivered customer sites: EXECUTE-SURGICAL standing autonomy** (Brian 2026-10-01) —
  auto-fix objective defects (broken copy, 404 assets, contrast, console errors) with
  prod-verify + ledger receipt. Regeneration passes and design-taste changes still held.
- **NORTH STAR (through ~2026-10-31): WEBSITE GENERATION SPEED + COST.** Optimize
  time-to-live-site and $-per-build (see BACKLOG FRONTIER 0 instrumentation item). Rank
  fire work by its effect on those two numbers first. **Targets (Brian 2026-10-01):**
  instrument the real baseline FIRST, then drive to **<5 min live / ≤$1 per build**.
- **Golden-loop / generation vision QA models (Brian 2026-10-01): ANTHROPIC vision or
  Unified-Billing OpenAI** — the gp-09 recreate gate and generated-site scoring must use a
  frontier eye; Workers-AI vision is fallback-only for this class (Gemini ladder remains
  for high-volume cheap critiques per `./RUNNER-AND-CRITICS.md`).
- **Speed-vs-quality policy: OWNER-DRAFT / PUBLIC-GATED** (Brian 2026-10-01) — the owner
  may watch the draft improve live (speed feels instant), but the PUBLIC share-link serves
  only once hard gates pass (vision ≥8 · zero console errors · clean copy). First
  impressions are protected; speed work happens in front of the owner, not the public.
- **Worker-failure ≠ lead-failure** (`./OPERATING-PRINCIPLES.md` § Failure taxonomy): a
  dying WORKER agent is attrition — salvage its commits FIRST (`git show <branch-tip>`
  BEFORE any `git branch -D`; rescues go under `./salvage/`), re-queue its slice in
  BACKLOG, continue the fire. ONLY LEAD saturation ("Prompt is too long" / autocompact
  thrash on the orchestrator / can't-spawn) checkpoints to `progress.md` + a FRESH session.
- **Category budget** (per fire): 30–45% product/features/bugs · 15–25% testing/golden-paths
  · 10–20% architecture · 5–15% UX/a11y · 5–15% cleanup/compression · 5–10% docs ·
  5–10% discovery · 5% loop-improvement. Money path leads; slow sweeps ride wider cadence.
- **Never pause to ask questions mid-fire** — full autonomy on reversible prod actions;
  pause ONLY for truly destructive/irreversible (drop tables, bulk data mutation, secret
  rotation, mass outreach, billing/pricing).
- **Main thread never reads giant ledgers** — delegate inventory reads to a fresh Explore
  agent (≤150-line output cap); hold conclusions only.
- **Queue never runs dry** — every fire appends deduplicated, evidence-backed next-wave
  BACKLOG items; zero-append = under-scan.
- **TDD-first + real journeys** — failing spec before implementation; detectors/unit tests
  are a byproduct, never the fire's primary deliverable (OPERATING-PRINCIPLES § Prime
  directive + § Testing).

## Fire numbering

- This fire: **fire-59** (constitution bootstrap). Next: **fire-60**. Format
  `fire-<n>-<slug>` everywhere: lease claims, LEDGER headings, commit messages.
