# Operating Principles — /run-the-loop

> Durable, non-negotiable invariants every fire obeys. Distilled from
> `apps/project-sites/_LOOP_CHARTER.md`, root `_LOOP.md` §2, and `.claude/loop.md`. The
> lifecycle + roster live in `./README.md`; the live queue in `./BACKLOG.md`; system shape
> in `./ARCHITECTURE.md`. Concise bullets, no padding.

## Canonical answers (Brian, 2026-09-29)

- **Loop docs canonical home = `/.claude/run-the-loop/`.** This dir is the entry point.
- **PRIORITY journey = the money path** — search → signin → AI build → view live → edit →
  publish. Secondary work waits while the revenue journey has any gap/dead-end/stub.
- **WfP = the DEFAULT serving path** — `x-ps-serve: wfp` + styled 200; R2 is byte-identical
  fail-soft; new sites born on WfP preview + prod; serving flag-gated during rollout.
- **AUTONOMY = full on reversible prod** — flag rollout, strict-validator flip, additive
  migrations, deploys: just DO them + prod-verify. Pause ONLY for truly destructive/
  irreversible: drop tables, bulk data mutation, secret rotation, mass outreach,
  billing/pricing.

## Canonical paths (do-not-hunt cheatsheet)

> Verified 2026-10-01. Don't re-discover these — `loop-fire-lock.mjs` lives at REPO-ROOT
> `scripts/`, NOT `apps/project-sites/scripts/` (a prior fire burned 3 tool calls finding that).
> Paths are repo-relative from the repo root.

- **fire lock** — repo-root `scripts/loop-fire-lock.mjs` (claim/heartbeat/release)
- **recipient allowlist** — `apps/project-sites/scripts/recipient-allowlist.mjs` (+ `.recipient-allowlist.local.json` (verify) — local override not present in a clean tree)
- **deep UI explorer** — `apps/project-sites/e2e/deep-ui-explorer/` (`explorer.mjs` · `vision-review.mjs` · `coverage-ledger.json`)
- **long-trail checkpoint** — `apps/project-sites/e2e/long-trail/checkpoint-case-001.json`
- **canonical home** — `.claude/run-the-loop/` (`README` · `OPERATING-PRINCIPLES` · `BACKLOG` · `LEDGER` · `DISCOVERIES` · `ARCHITECTURE` · `CONSTITUTION` · `GENOME` · `GOLDEN-PATHS` · `VISUAL-COVERAGE` · `BROWSER-OPERATING-LAYER`)
- **worker deploy** — `cd apps/project-sites && npx wrangler deploy --env production`
- **prod D1** — `project-sites-db-production` (`ea3e839a-c641-4861-ae30-dfc63bff8032`)

## Prime directive (coding & delivery)

- Every fire's PRIMARY deliverable is a COMPLETE, REAL, end-to-end user journey proven on
  PROD — never a detector, smoke check, or mocked interaction.
- Detectors + unit tests are a BYPRODUCT — ship one only after a real journey caught a real
  bug and you want its class to stop regressing.
- "Ensure full flows happen" = COMPLETE the flow — build the missing product until the
  journey completes for real. Completing beats gating.
- Verify REAL prod, never a compile — deploy → prod-E2E the changed routes → only then DONE.
- No completion claim without FRESH command-output evidence this turn. Green local build ≠
  done; toast "success" ≠ persisted outcome; 200 ≠ correct data; rendering ≠ working.
- Every fire ships MORE than the last — several dimensions at once (feature + error-handling
  + structured logging + the journey test), accelerating while every gate stays green.

## Design & UX principles

- **gorgeous-by-default** — every UX iteration measurably more beautiful: cinematic motion,
  brand-locked, bento/asymmetry, refined fluid type. Never "functional but plain"; pair
  every backend feature with a frontend worth demoing to investors.
- **embarrassingly-easy-to-use** — every iteration EASIER than before (adding a step is a
  regression). AI does the work, the user confirms. Zero-config defaults · one obvious
  primary action per screen · ≤3 steps to any outcome · inline guidance not manuals ·
  instant feedback + undo on every mutation · empty states are first-action launchpads ·
  never a dead/doomed control (disable with the reason + fix, or hide) · the user's words,
  never internal jargon.
- **real-time data** — no manual Refresh/Reconcile/Sync buttons; visibility-aware poll /
  WebSocket / SSE / optimistic + background reconcile; freshness is invisible.
- **Brand** — black `#060610` (`--ps-bg`) + cyan `#00E5FF` (`--ps-accent`), cinematic;
  hard-coded brand colors are flagged; ONE `DialogShellComponent` primitive for every admin
  modal; feature icons float (no boxes/borders; `stroke=currentColor`).
- Logo luminance drives light/dark theme; white-text logos need dark backing; navbar
  wordmark single-line + prominent.

## Architecture principles

- **Cloudflare-first** — Workers/Hono/D1/R2/KV/DO/Queues/Workflows before Neon (Postgres
  escape hatch) / Upstash (Redis escape hatch) / Fly (stateful-VM escape hatch). Deep CF
  lock-in is the feature — no portability layer. AI Gateway on EVERY model call; Analytics
  Engine is the high-volume metrics backend.
- **Feature-module architecture** — every post-launch capability is `libs/features/<slug>/`
  (7-field `manifest.ts` + flag + Zod schemas + service + handlers + README + colocated
  tests). A scattered handler / module without a manifest = drift = merge-blocker.
- **Feature flags default-OFF** — `enabled=0, rollout=0, stage='experimental'`; server
  returns **404 (never 403)** when off; UI returns null; new flag → registry + manifest +
  docs (3 places); frontend flag-off MUST match the worker 404 (a `// (flag:X)` comment is
  NOT a gate); no dead flags, nothing permanently-on at launch.
- **Contract-first + Zod everywhere** — every runtime boundary (env, API in/out, params,
  forms, webhooks, queues, DO messages, AI outputs, tool in/out, storage reads) guarded by a
  Zod schema; infer types via `z.infer`, never hand-duplicate; OpenAPI derived from Zod.
- **Typed errors** — one uniform RFC7807 envelope across ALL endpoints (`code` +
  `correlationId` + `errors[]` + what-to-do-next); never leak secrets/stack-traces.
- **Interconnectedness — no orphan code** — every built unit reachable in the UI
  (import→render / route / nav / registration); built-but-unwired = not done; wire adjacent
  orphans while in-context (`scripts/detect-orphans.mjs`); recycle proven code over a thinner
  reimplementation; never de-reference a substantial unit without deleting it deliberately
  or re-wiring it the same fire.
- **Consistency primitives** — one dialog, one design-token source, one confirm service, one
  empty-state, one API service, one markdown renderer; re-implementing a primitive = drift.
- **Eliminate architectural drift in-turn** — competing generations (old/new Angular,
  observables where signals fit, custom UI vs Spartan, duplicate clients/models/schemas):
  choose the superior direction, migrate usage, delete the obsolete one. Never document both
  approaches forever.
- Editor extends bolt.diy — never a parallel editor. ONE chat surface (the editor).

## Testing principles (TDD-first, real journeys)

- Failing test FIRST → watch RED → implement → GREEN. Bug fix = failing regression first. No
  feature without ≥1 test; no fix without ≥1 regression.
- Every major E2E STARTS at the homepage, logs in via the real E2E UI method, navigates by
  CLICKING the interface — never `page.goto()` after first load, never token/cookie/
  storageState injection as a login shortcut.
- Acceptance tests test STORIES not pages — mutate → navigate away → return → hard-refresh →
  assert persistence → assert the cross-feature effect. Never stop at "toast says success".
- Deterministic (web-first assertions, condition-based waits, NEVER `waitForTimeout`/sleeps),
  parallel-safe, stable selectors (`data-testid`/role/text), 6 breakpoints
  (375/390/768/1024/1280/1920) × real browsers.
- Console + network cleanliness gate every flow: `console.error`/`warn`, page exceptions,
  `requestfailed`, unexpected 4xx/5xx/CSP/Trusted-Types = build fail. Empty allowlist is the
  target; never allowlist CORP / SW "Failed to fetch" / CSP.
- BROWSER-VERIFY = a human-like admin click-around (open interactive surfaces: domain picker,
  switcher, dialogs, ⌘K), not a route sweep. Layer 2 Stagehand/Browserbase explores; every
  discovery becomes a deterministic Playwright regression.
- Reconcile display-vs-store on every data surface — ground-truth `SELECT COUNT(*)` for the
  REAL account vs what the UI shows; `groundTruth>0 && display==0` = lying-empty. Causal
  probe for trackable surfaces (do X → store records it → UI shows it).
- Maintain `e2e/FEATURES.md` + `e2e/COVERAGE.yml`; a feature/sub-action without a passing
  journey spec = build fail. `assertSiteOwned` + a CI gate row on every new
  `/api/sites/:siteId` handler.
- Unit tests are real units (no browser, no absurd mocking — absurd mocking = wrong
  architecture). Quality > coverage %: 10 meaningful tests beat 100 trivial ones.

## Documentation & AI-context principles

- Docs ship in the SAME commit as the code; docs for a deleted feature deleted same commit.
- ADR (`docs/decisions/NNNN-title.md`) per one-way-door decision; JSDoc (intent, not types)
  on every export; per-feature README; `ARCHITECTURE.md` current.
- Docs are CURRENT-STATE only — strip history, delete drift; every doc claim matches the code.
- Keep globally-loaded `CLAUDE.md`/rules HIGH-SIGNAL + ACCURATE (routes/tables/gotchas match
  the code); narrow rules path-scoped; one canonical owner per rule; a memory naming a fixed
  issue as open is stale — update it. Don't let `CLAUDE.md` become a novel.
- Human-curated context files (LLM-generated ones give ~0 benefit, can cut success ~3% +
  raise cost ~20%).

## AI-agent principles

- **AI is the primary developer + a permanent product foundation** — never "AI-optional".
  When AI can make a surface easier/faster/safer/clearer, ship it.
- Prefer tool-calling → registered-component GenUI over free-form chat for AI surfaces
  (return a preview card / chart / editable form); NEVER ship runtime-LLM markup to owners.
- Inline/no-chat AI beats a bolted-on sidebar — edit-in-place, insight panels, prefill.
- Contract-first: every model output through a typed schema + repair-or-reject + fallback +
  trace; no raw model text consumed as truth. AI-heavy behavior has eval cases + rubrics +
  regression tracking; the prompt registry is versioned.
- Reinforce the VERIFIER leg (the #1 researched agent failure) — gate DONE on executed tests
  + prod-E2E asserting real content, never self-report; MAX_ITERATIONS cap, reflection
  between retries, kill/reassign after ~3 stuck iterations, hard token budget.
- Tools are APIs — narrow, Zod in + out, safe-by-default, idempotent, tested; no
  `runAnything`/`deployNow` mega-tools.
- Fan out by default (monitor-orchestration) — parallel agents in ONE message; ≤6-wide
  mutating, read-only sweeps free; fresh 150–300-word briefs, primary deliverable written
  FIRST; main thread orchestrates + folds + deploys once + verifies, never implements when
  saturated. Never bare `general-purpose` when a specialist fits; run the Agent Diversity
  Review gate before DONE.

## Hygiene & simplicity principles

- **Aggressive toward code, conservative toward required product behavior + data.** Net
  deletion is a success metric when capability is preserved.
- Every significant refactor ENDS with a deletion pass — old implementation, adapters, dead
  flags, unused imports/exports, stale CSS, obsolete tests/docs, compat layers. A rewrite
  that leaves the old architecture beside it is incomplete; no permanent half-migrations.
- KISS · YAGNI · high cohesion / low coupling · single source of truth · composition ·
  compiler-enforced invariants · boring standard framework capabilities · minimal public
  APIs. Earn every abstraction (write it twice, then extract) — one use case doesn't justify
  one. Thin shared infra (`middleware/` ≤200 lines/file, no business logic), deep feature
  modules.
- No transient prefixes (`waveN`/`sprintN`/`phaseN`) or vibe names (`brilliant`/`magic`/
  `ultimate`) in durable identifiers; ONE term per concept; kebab files · PascalCase types ·
  CONSTANT_CASE consts. Config-only chronology lives in migration filenames + commits.
- No silent regression — compare before/after (build, runtime, bundle, a11y, console,
  network, deps, TS strictness, CSS); a justified regression records why.
- TS strictness is a ratchet — never weaken it to ease a refactor; reduce `any`/casts/non-
  null assertions; prefer `unknown`, discriminated unions, exhaustive handling.
- TODOs/FIXMEs in source are allowed roadmap markers (banned only in shipped user-visible
  strings + as a substitute for critical-path work); architecture-drift TODOs ship-in-turn.
- No freeform `console.log` — structured JSON logs (`level`, `ts`, `msg`, `traceId`/
  `requestId`, `tenantId`); `console.warn` for logs (ESLint blocks `console.log`).

## Git & shipping principles

- **main-only, auto-push same turn** — no dev/release/feature branches; worktrees for
  isolation; merge + delete every worktree AND branch the round its work lands; NEVER
  force-push main; `git add -f` (`.gitignore` blocks `*.md`); conventional-commit + gitmoji
  IS the PR description.
- **Prod is pre-authorized** — gates green → deploy → prod-verify; never hold committed-but-
  dark work "awaiting authorization". `--env production` MANDATORY on the worker deploy or
  every `/api/*` 500s. NEVER modify already-set CF secrets.
- ONE fold, ONE build, ONE deploy per fire — agents never build/commit/deploy independently.
- Watch divergence (`git rev-list --left-right --count origin/main...HEAD`) each round;
  same non-`main` branch two rounds running or growing `behind` → integrate to `main` NOW.
- GUARDRAILS: git status first; `git pull --rebase --autostash` before push; commit ONLY
  your files. NEVER touch `.claude/loop.md`, `.claude/scheduled_tasks.json`,
  `src/generated/app_js.ts`, `src/services/analytics_events.ts`.

## Security principles

- Auth on every protected route; org/tenant scope from SERVER context (`c.get('orgId')`),
  NEVER a client header. `assertSiteOwned` on every `/api/sites/:siteId` handler (IDOR); a
  new site-id handler needs the guard + a CI gate row.
- No secrets in code; every self-generable secret auto-provisioned (HMAC/session/CSRF/JWT/
  salt); data-at-rest `*_ENCRYPTION_KEY` NEVER auto-rotated (destroys persisted data);
  `*_encrypted` columns actually encrypted; never log raw tokens.
- Parameterized SQL only (no Supabase client); Zod-validate + rate-limit + Turnstile public
  endpoints; verify webhook signatures THEN parse; validate + size + type every upload;
  SSRF revalidate every redirect hop against the host allowlist.
- CSP Level 3 strict-dynamic + per-response nonce + Trusted Types; HSTS, X-Content-Type-
  Options, Referrer-Policy, Permissions-Policy, COOP/COEP/CORP; CHIPS `Partitioned` on
  cross-site cookies; SRI on external scripts.
- Removed — never reintroduce: Supabase · phone-OTP (Twilio VOICE kept) · Lago/Unkey/Nango/
  Inngest/Novu (psnotify replaces Novu) · AI Agents (`ai_endpoints`/dispatcher — Functions
  on WfP replace it) · Resend send rail (SES sole, SendGrid break-glass; per-site Resend MCP
  is a separate kept customer feature).

## Accessibility principles (WCAG 2.2 AA)

- axe-core 0 violations is NECESSARY, not SUFFICIENT (axe auto-tests only 2.5.8 of the 9 new
  criteria) — the 6 AA criteria (2.4.11, 2.5.7, 2.5.8, 3.2.6, 3.3.7, 3.3.8) need MANUAL
  review every a11y pass.
- Exactly one `<h1>` per view + logical heading order (axe is blind to page-has-heading-one);
  a folded tab needs its own single `<h1>`.
- Contrast ≥4.5:1 from tokens (no undefined-var fallback shipping a failing value);
  focus-visible rings; focus restored on close (2.4.3); 24px min target (bordered chips/
  pills/badges are box controls, not inline-exempt); `prefers-reduced-motion` gates all
  motion; every string through the i18n layer (no hardcoded user-facing copy).
- Serious axe/WCAG failures are bugs; accessibility is part of E2E (keyboard nav, focus
  order/visibility, dialogs/menus/tooltips, ARIA, form labels + validation messages).

## Performance principles

- CWV cinematic targets: **LCP ≤2.0s · INP ≤100ms (>200ms = fail) · CLS ≤0.05**; FCP ≤1.2s.
  Budgets: JS ≤200KB gz/route (no chunk >250KB gz), CSS ≤30KB gz, fonts ≤100KB woff2.
- SSR/SSG mandatory; ZERO client-side data waterfalls (no `useEffect`→fetch→render for
  above-fold); LCP image `fetchpriority="high"` + explicit `width`/`height`; lazy-load
  non-LCP images + heavy chunks; AVIF/WebP + `srcset`; `font-display:swap` + subset.
- Last-write-wins cancellation on any re-triggerable fetch (`switchMap`/AbortController);
  debounce; no request storms / duplicate requests / eager route loading / huge DOM.
- Worker CPU ≤50ms p99; measure when practical (don't build caching infra for hypothetical
  perf); no orphaned CF resource; rollback-ready (wrangler rollback + D1 Time Travel + R2
  versioning); per-request cost stays sane on the hot path.

## Data & migrations principles

- Applied migrations are IMMUTABLE; zero schema drift (a referenced column MUST exist — a
  swallowed SQL error is a silent 404); orphan columns removed or documented-inert; indexes
  cover hot queries; UUIDv7 records / v4 tokens; write-table == read-table (admin writes the
  table the consumer reads).
- Per-site data isolation — the editor's per-site D1 is server-resolved (`resolveSiteDataDb`
  reads `site_database_allocations` for the OWNED site, lazy-provisions, denylists shared
  platform ids); a customer's Tables surface NEVER touches the shared/another site's DB.
- Optimistic UI + async backing where safe to delay (non-financial/auth/security); every
  mutation reversible (undo); idempotency key on money/site-mutation POSTs; premature
  terminal status + no retry strands rows.

## Convergence discipline

- ONE coherent slice per workstream per fire — never split a multi-faceted brief into
  one-section-per-turn.
- The queue never runs dry — every fire the discovery/product/E2E roles append deduplicated,
  evidence-backed next-wave tasks to `./BACKLOG.md`; zero-append = under-scan.
- A workstream is DONE only when Acceptance passes + ledger consolidated + no dead refs +
  prod proof. A dimension all-green ≥2 fires ⇒ maintenance-only (healthy no-op).
- Never pure-terminate on a quiet tree — advance the highest standing track (money path →
  site-gen quality → decomposition → docs). Reserve "converged" for the rare fire where
  every rung has no clean next step.
- Category budget (see `./README.md`): 30–45% product/features/bugs · 15–25% testing/golden-
  paths · 10–20% architecture · 5–15% UX/a11y · 5–15% cleanup/compression · 5–10% docs ·
  5–10% discovery · 5% loop-improvement.
- Context budget — main thread NEVER reads giant ledgers wholesale; delegate inventory reads
  to a fresh Explore agent (≤150-line cap).
- Auto-integrate-recs — anything <2h with no design call ships INLINE; the Recs list is only
  for genuine >2h / design-conversation / external-blocker / irreversible items.

## Failure taxonomy vs HARD-STOP (recover vs checkpoint — never conflate)

A worker AGENT failing is normal fan-out attrition — RECOVER + keep the loop running. The
LEAD (orchestrator) failing is the ONLY checkpoint trigger. These are two DIFFERENT things;
treating an agent's transient death as the session HARD-STOP wrongly checkpoints a healthy loop.

- **Transient single-agent failure → RECOVER, keep the loop running.** ONE agent hits
  ECONNRESET / a network drop returns `subagent_tokens:0` for that one agent / one agent's
  output is cut off mid-stream. This is attrition, not saturation. Do NOT checkpoint the
  session. Instead: (1) **salvage its work FIRST** — if the agent pushed/committed, `git show
  <branch-tip>` BEFORE deleting the worktree branch; cherry-pick any COMPLETE, verified commit
  (never `git branch -D` an agent's branch unshown — fire-51 nearly lost a complete verified
  fix `4334a853e` this way); (2) **re-queue** its unfinished slice as a `BACKLOG.md` item; (3)
  **continue** the fire with the remaining agents. Never re-fan-out for repair — fix-forward or
  ONE targeted agent (`parallel-subagent-economy`).
- **Genuine LEAD saturation → THEN checkpoint to a fresh session.** The ORCHESTRATOR itself
  hits "Prompt is too long", an `autocompact thrashing` notice fires on the LEAD (context
  refilled to the limit within a few turns, repeatedly), or the main thread can no longer spawn.
  THIS is the HARD STOP: checkpoint to `progress.md` + continue in a FRESH session. Never retry
  in place.
- **Rule of thumb:** an *agent* failing is expected + recoverable (salvage + re-queue +
  continue); the *lead* failing is the only signal to checkpoint. `subagent_tokens:0` from a
  network drop on one agent ≠ lead saturation — read WHICH thing failed before deciding.

## Browser-role execution contract (roles 16 & 17 — never bends)

The STANDING browser roles — role 16 (Long-Trail TDD case-owner) + role 17 (Deep UI Explorer) —
run Playwright/CF-Browser-Run against a LIVE local stack, so their execution environment is fixed:

- **MAIN checkout, NEVER a fleet auto-worktree.** A fleet auto-worktree gets sparse/absent
  `node_modules` (no local D1, no `.dev.vars`), so Playwright + the local stack can't boot and the
  role falsely reports BLOCKED / zero CF coverage (fire-56 proved 3 role-16 deaths; fire-64 BLOCKED
  role 17 the same way). Route both roles to the MAIN checkout (full node_modules + local D1 +
  `.dev.vars`); do NOT pass `isolation:"worktree"`.
- **Assert deps BEFORE claiming coverage.** The lead/role runs
  `test -d node_modules && test -d apps/project-sites/node_modules` (+ `.dev.vars` present) FIRST.
  A missing-deps launch = **BLOCKED with the exact missing prerequisite**, never "passed" — a worktree
  with no deps can never count as passed CF/browser coverage.
- **Write-capable specialist only.** When the role must edit code/specs/checkpoints
  (role 16 always; role 17's same-fire repair hand-off), the specialist is `test-writer` or
  `general-purpose` — NEVER `visual-qa` (read-only, no Write; mis-assigning it strands the fire,
  fire-63).

## Deep UI Explorer / Visual Intelligence (role 17 — invariants)

Full role contract: `.claude/commands/run-the-loop.md` §1.17. Execution env: see § Browser-role
execution contract above (MAIN checkout, assert deps, Write-capable specialist). The invariants that never bend:

- **Honest coverage semantics.** Cloud test proof = Cloudflare Browser Run CDP with recorded
  provider + session id. Browserbase/local Chromium = `FALLBACK`; missing credential, failed
  login, role redirect, wrong tenant = `BLOCKED` with the exact missing prerequisite. None of
  these ever reports as passed Cloudflare coverage — the run manifest is the receipt.
- **States, not URLs.** The interface is a graph: route · role · selected site · active tab ·
  nested subview · open menu/overlay · scroll region · flag/data condition · iframe context.
  One settled screenshot after EVERY meaningful action; the preceding state id is recorded so
  reviewers compare before/after. The coverage ledger
  (`apps/project-sites/e2e/deep-ui-explorer/coverage-ledger.json`) is the resumable cursor.
- **Real vision on every capture, honestly.** Every screenshot gets a schema-validated verdict
  from an actual vision model via AI Gateway; reviewer failures are recorded, never silently
  skipped; a clean screen with zero findings is a valid result — manufacturing defects to fill
  the backlog is a violation. Architecture claims from pixels stay HYPOTHESES until source +
  store inspection confirms them.
- **Read-only discovery; same-fire repair by owners.** The explorer never mutates product code
  mid-pass. Confirmed findings hand off as reproducible state paths; the owning role fixes via
  RED → root cause → GREEN → replay the exact breadcrumb → re-capture → continue the journey.
- **Privacy at the boundary.** Password inputs masked before capture; token-shaped strings
  scrubbed from any context leaving the machine; artifacts stay in gitignored run dirs.

## Fire mutual exclusion (the lease)

`scripts/loop-fire-lock.mjs` serializes fires: claim at §0 (exit 3 = live fire running →
coalesce this tick), heartbeat per phase, release at §10. A stale lease (heartbeat >20 min)
is reclaimed — a dead lead never wedges the loop. One fire at a time means one browser
fleet, one deploy stream, no conflicting commits.

- **Heartbeat INLINE per phase — NEVER background a detached `while true; heartbeat; sleep`
  loop.** Such a loop outlives its dead fire and refreshes the heartbeat forever, holding the
  lease LIVE and coalescing EVERY future tick — a permanent deadlock no later fire can
  self-heal (fire-66 reclaimed exactly such a zombie: owner PID dead, lease fresh). Backstops
  the lock now ships: lease age is capped at `MAX_AGE_MS` (90 min) regardless of heartbeat, and
  `status` reports `ageMs`. If you ever hit a BUSY lease whose owner PID is dead (`ps -p <pid>`),
  reap the stray — `pkill -f 'loop-fire-lock.mjs heartbeat <fireId>'` — then reclaim.

## Wedged-agent protocol (proven fire-57, codified fire-58)

- A background agent whose output-file mtime is SILENT >20 min is presumed wedged (two cases fire-57: both stuck in reading phase). Protocol: (1) check mtime vs now; (2) SendMessage nudge ("land the smallest green slice now"); (3) bounded 90s wait — mtime unchanged → (4) TaskStop, salvage check (worktree branch tip + `git status` for its paths; a reading-phase agent has nothing to salvage), (5) respawn FRESH with an exact-file brief (name the files to read — an agent told to explore is an agent that can wedge). Never leave a wedged agent running alongside its replacement (duplicate-surface collision).

## Parallel-migration numbering (collision class, fire-57)

- Two parallel agents were each told "migration after 0648" → both created 0649_*. When >1 spawned agent MAY add a migration in the same fire, the LEAD pre-assigns each a distinct number in the brief (e.g. "yours is 0651"). An agent discovering it needs an unplanned migration takes `max(existing)+2` (gap absorbs a concurrent sibling) and reports it. Convergence always runs `ls migrations | tail` and renumbers dupes BEFORE any deploy (rename file + update tests referencing the filename — they execute the DDL by path).

## Prod D1 migrations apply (standing)

- `wrangler d1 migrations apply` on prod is BLOCKED by ancient untracked backlog (references dropped tables, e.g. ai_endpoints). Apply new migrations via targeted `wrangler d1 execute --file=migrations/<new>.sql --remote`, then verify via `SELECT name FROM sqlite_master WHERE name IN (...)`. Do NOT attempt to bulk-reconcile the historical migration ledger mid-fire.

## Constitution era (fire-59, 2026-09-30)

`./CONSTITUTION.md` now GOVERNS the loop. Where it conflicts with this file or `./README.md`,
the constitution wins; where it is silent on an operational safety fact, these principles
bind unchanged. The old README lifecycle → CONSTITUTION § The 15-Minute Heartbeat.

- **Three nested loops** — MICRO (create → render → experience → critique → modify →
  compare, on the thing in front of you) · PRODUCT (make the surrounding workflow simpler/
  clearer/more beautiful — removing the thing just polished is a valid outcome) ·
  ORGANIZATION (ask why the system produced something inferior; improve prompt / Skill /
  agent / golden path / the loop itself — a local improvement teaches the whole org).
- **Default ten-pass rule** — important artifacts (major UI, components, prompts, Skills,
  plans, architecture, golden paths, agent definitions) get ~10 substantive improvement
  rounds under DIFFERENT lenses; stop when marginal value drops below improving another
  part of the product.
- **Standing artifacts** — Visual Coverage (`./VISUAL-COVERAGE.md`), Stub Debt
  (ABSENT → VISUALIZED → SIMULATED → … → OPERATED; SIMULATED is never "done"), Delight
  Debt, and the Completion Frontier are maintained continuously. Golden paths
  (`./GOLDEN-PATHS.md`) are executable product design — a journey may demand capabilities
  that don't exist yet (record CAPABILITY GAP; never shrink the journey to pass).
- **Every worker = BUILDER + REVIEWER + SCOUT + LEARNER** — complete the work, critique
  what it produced, report nearby/systemic opportunities, return durable lessons.
- **Creator ≠ final judge** — significant changes get independent evaluation (functional /
  visual / human-simulator / business / security, chosen intelligently); champion/
  challenger applies to designs, prompts, plans, and this constitution itself.
- **Each cycle must touch reality AND learn** — a cycle ending with only analysis, or with
  only code and no promoted lesson, is incomplete.
- **Anti-stagnation circuit breaker** — enormous effort + little observable product
  progress = STOP; audit the improvement system (premature micro-polish, repeated
  research, context pollution, duplicate agents, too much factory-building) before
  pouring more intelligence through it.
- **Harness subtraction** — periodically delete loop scaffolding (roles, prompt
  instructions, review stages, context docs, routing) that no longer increases quality;
  the organization gets more capable while its operating system gets simpler.

**Still binding from this file (unchanged by the constitution):** § Fire mutual exclusion
(the lease), § Failure taxonomy vs HARD-STOP (worker attrition ≠ lead saturation),
worktree isolation + main-only shipping (§ Git & shipping), category budgets
(§ Convergence discipline), § Wedged-agent protocol, § Parallel-migration numbering,
§ Prod D1 migrations apply, and § Deep UI Explorer invariants.
