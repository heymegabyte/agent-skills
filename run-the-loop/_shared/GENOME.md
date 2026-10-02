# PROJECT GENOME — projectsites.dev

> Bootstrap knowledge index for a FRESH agent. Authored fire-59 (2026-09-30, constitution era).
> Home: `.claude/run-the-loop/GENOME.md`. Siblings: `README.md` · `CONSTITUTION.md` ·
> `OPERATING-PRINCIPLES.md` · `ARCHITECTURE.md` · `BACKLOG.md` · `LEDGER.md` ·
> `GOLDEN-PATHS.md` · `BROWSER-OPERATING-LAYER.md` · `DISCOVERIES.md` ·
> `NEXT-SESSION-BOOTSTRAP.md` · `.fire-lease.json` (live lease state).

## 1 · GENOME — what this file is

- A compact authoritative INDEX: enough for a fresh high-capability agent to continue building
  this product from one bootstrap prompt. It POINTS; it never duplicates.
- **Canonical-owner principle:** every fact has ONE owning doc. If this file and an owner
  disagree, the OWNER wins — fix the pointer here the same turn (drift-detection).
- Read order: GENOME → `CONSTITUTION.md` (how to operate) → `README.md` (cycle lifecycle) →
  the ONE workstream being advanced (`BACKLOG.md`).
- NEVER main-thread-read giant ledgers (`apps/project-sites/_LOOP_LEDGER.md` = 2.3 MB,
  `_APP_COMPLETION.md`) — delegate to an Explore agent with a ≤150-line output cap.

## 2 · PRODUCT

- **"We don't sell websites — we deliver them."** A business owner searches their business →
  signs in → gets a professionally AI-generated site, hosted + SSL'd + live in **<15 min**.
- Three surfaces (owners: root `CLAUDE.md` + `apps/project-sites/CLAUDE.md`):
  - **bolt.diy editor** — repo-root `app/` (Remix + Vite + WebContainer) → CF Pages `bolt-diy`
    at `editor.projectsites.dev`. The admin Editor EXTENDS this iframe — never a parallel editor.
  - **Worker + Hono SaaS engine** — `apps/project-sites/` → `projectsites.dev`. API, site
    serving, Stripe webhooks, AI site-generation Workflow. PRIMARY dev focus.
  - **Angular admin SPA** — `apps/project-sites/frontend/` (Angular 21 standalone, signals,
    zoneless, Spartan UI) served from R2 by the Worker at `/` + `/admin/*`.
- `packages/shared/` — Zod schemas, constants, RBAC middleware shared across surfaces.
- Generated sites must BEAT the source: page count = source sitemap 1:N (≤1000); a perfect site
  takes 20-30 specialized prompts, never one. Owner: `apps/project-sites/CLAUDE.md` § Philosophy.

## 3 · EXPERIENCE

- ⭐ SUPREME standing mandate (Brian, 2026-09-15): **embarrassingly easy to use** — a busy
  non-technical owner succeeds FIRST try, no manual, no thinking. Every UX change leaves the
  surface EASIER; AI does the work, the user confirms; ≤3 steps to any outcome; empty states are
  launchpads; never a doomed/dead control. Owner: root `CLAUDE.md` § SUPREME + global rule
  `embarrassingly-easy-to-use`.
- Paired beauty gate: every fire gorgeous-er AND more effortless — never "functional but plain".
- Brand: black + cyan. Design tokens live in `apps/project-sites/frontend/src/styles/_polish.scss`
  (`--ps-bg:#060610`, `--ps-ink:#f4f4ff`, `--ps-accent:#00e5ff`, `--ps-radius-xl:22px`,
  `--ps-z-overlay-takeover:100000`). Hard-coded brand colors are audit-flagged.
- One dialog primitive: `DialogShellComponent` (custom modals = drift). Feature icons float
  freely — no boxes/borders, `stroke=currentColor`.

## 4 · ARCHITECTURE

- Stack table owner: root `CLAUDE.md` § Project Sites Worker stack (Hono · D1 · KV · R2 ·
  Workflows · Workers AI via AI Gateway · Stripe · SES · PostHog · Sentry).
- System map owner: `.claude/run-the-loop/ARCHITECTURE.md`. Worker detail:
  `apps/project-sites/CLAUDE.md`. Data re-arch: `docs/data-platform-scope.md`. WfP lane:
  `docs/wfp-site-hosting.md`.
- **Hot path:** CF DNS/custom hostname → Worker dispatch → KV host manifest (60s TTL) →
  **WfP dispatch (DEFAULT serving, `x-ps-serve: wfp`)** → R2 asset as byte-identical fail-soft
  fallback → Analytics Engine sample → async Queue/Workflow (QUEUE binding optional, falls back
  to Workflows). Hot path never touches Neon/Upstash/Fly/Sentry/PostHog/external AI.
- **WfP:** per-site dispatch namespace (a Worker can't statically bind thousands of per-site
  D1s). New sites born on WfP preview + prod; serving flag-gated `site_wfp_hosting` during
  rollout — gate in `apps/project-sites/src/services/site_serving.ts`.
- **Status machine:** `draft → collecting → imaging → generating → published | error | archived`.
- Middleware order: `requestId → payloadLimit(256KB) → securityHeaders → cors → auth (does NOT
  reject unauthed) → errorHandler`.
- Invariants: flags default-OFF (server 404 when off, never 403) · Zod at every boundary ·
  `assertSiteOwned` on every `/api/sites/:siteId` (IDOR class) · main-only branch · feature
  modules `libs/features/<slug>/` with 7-field manifest (`npm run validate:features`).
- Build invariants for generated sites: `src/services/build_validators.ts` (required files,
  asset existence, meta lengths, JSON-LD count, single H1, banned slop; `report` → `strict`).

## 5 · DATA

- **Master D1 (system of record):** `project-sites-db-production` =
  `ea3e839a-c641-4861-ae30-dfc63bff8032`. Parameterized SQL only, no Supabase client. Table
  inventory: `apps/project-sites/CLAUDE.md` § D1 Database (orgs/users/memberships/sites/
  hostnames/sessions/subscriptions/webhook_events/audit_logs/workflow_jobs/research_data/…).
  All tables carry `id`/`created_at`/`updated_at`/`deleted_at`; org-scoped tables carry `org_id`.
- Platform per-site data (`form_submissions`, `visitor_events`) STAYS in the master D1.
- **Per-site D1 data plane:** each customer site gets its OWN dedicated D1 (blank at first),
  server-resolved via `resolveSiteDataDb` (`src/services/site_data_db.ts`) reading
  `site_database_allocations`, lazy-provisioned, shared platform ids denylisted
  (`FORBIDDEN_DB_IDS`), executed through the CF REST D1 `/query` API. Flag `per_site_data`
  (DARK → 404). Owner: `docs/data-platform-scope.md`.
- **R2 layout:** site assets `sites/{slug}/{version}/{file}` · marketing `marketing/index.html` ·
  build templates `templates/{category}/` · Angular SPA dist bucket.
- **KV:** host-resolution cache (60s TTL) + prompt hot-patch. CF account
  `84fa0d1b16ff8086dd958c468ce7fd59`; zone/Pages ids: `ARCHITECTURE.md` § CF resource IDs.

## 6 · AI

- **Workers AI** (Llama 3.3 70B + 3.1 8B, FP8) through **AI Gateway — mandatory on every model
  call**. Build agent LLM: DeepSeek-primary via `ANTHROPIC_BASE_URL` override, Anthropic passive
  fallback (`BUILD_LLM_PROVIDER=anthropic` forces). Owner: `apps/project-sites/CLAUDE.md`.
- **Site-gen pipeline:** 6 phases / 25-30 focused prompts. Durable Workflow
  `src/workflows/site-generation.ts`: research steps (parallel) → container build → upload-final
  → visual-inspection. Container = `SITE_BUILDER` DO running ONE Claude Code orchestrator that
  fans out parallel subagents (domain-builder, validator-fixer, visual-qa, seo-auditor,
  accessibility, performance, content-writer), gated DONE by completeness-checker.
- **Prompt system owner:** `apps/project-sites/src/prompts/` — registry + versioning + A/B
  variants + KV hot-patching + Zod I/O schemas per prompt; 15 `prompts/*.prompt.md` files.
- API credit discipline is NON-NEGOTIABLE: never debug with full builds (~$5-15 each); reduce to
  the simplest reproducible state first.

## 7 · BROWSER

- **Operating layer owner:** `.claude/run-the-loop/BROWSER-OPERATING-LAYER.md` (authored this
  same fire-59 arc) — how agents drive real browsers against prod.
- **Deep UI Explorer:** `e2e/deep-ui-explorer/` — standing loop role; honest
  CF-pass/FALLBACK/BLOCKED semantics; screenshot + vision verification tooling.
- Automation ladder (owner: `apps/project-sites/CLAUDE.md` § Infrastructure doctrine):
  `browser.projectsites.dev` product abstraction (CF Browser Run + Playwright + Stagehand) →
  Browserbase fallback (managed session/replay/proxy only) → Skyvern internal-only, never the
  default. Worker primitive: `src/services/browser_gateway.ts`.

## 8 · INTEGRATIONS

- **Stripe** — checkout, subscriptions, entitlements, billing portal (`src/services/billing.ts`);
  webhooks signature-verified + idempotent (`src/routes/webhooks.ts`).
- **Email: Amazon SES is the SOLE rail** (ADR-0019); SendGrid break-glass ONLY; Resend REMOVED
  2026-09-09 — never reintroduce a Resend send rail. Listmonk for newsletters/bulk.
- **PostHog** server-side product analytics + `captureLLMCall` (`src/services/analytics.ts`) —
  but Analytics Engine (not PostHog) is the high-volume hot-path metrics backend.
- **Sentry** via HTTP API (`src/lib/sentry.ts`, Toucan). **Twilio VOICE is KEPT**
  (`src/services/twilio.ts` + `routes/voice*`); phone-OTP SMS auth is removed.
- **Removed — never reintroduce** (owner: root `CLAUDE.md` § Load-bearing decisions +
  `ARCHITECTURE.md` § Invariants): Supabase · phone-OTP · Resend · Lago/Unkey/Nango/Inngest/
  Novu (→ psnotify DO) · dashboard-authored AI Agents (→ code-defined Functions on WfP;
  `docs/decisions/0035-custom-code-endpoints-wfp.md`).

## 9 · OPERATIONS

- **Worker deploy:** `cd apps/project-sites && npx wrangler deploy --env production` —
  **`--env production` is MANDATORY**; a bare deploy 500s every `/api/*` route.
- Frontend: `cd apps/project-sites/frontend && npm run deploy:production` (R2, no Docker).
  Editor: `wrangler pages deploy build/client --project-name=bolt-diy`. Container/DO builds need
  Docker (unavailable → push, Workers Builds has it).
- Auth: `CLOUDFLARE_API_KEY` (via `get-secret`) + `CLOUDFLARE_EMAIL=blzalewski@gmail.com`.
  **NEVER modify already-set CF secrets**; `wrangler secret put` only for genuinely NEW secrets.
- **Prod-verify after EVERY deploy** (curl/Playwright changed routes, 0 console errors) — local
  green is never done. Rollback: `wrangler rollback` + D1 Time Travel (30d) + R2 versioning.
  No staging; prod deploys standing-authorized.
- **Crons CANCELLED** per Brian (fire-58, commit `044ac0ebc`) — scheduled loops halted; fires
  now start manually ("run the loop") or from a bootstrap prompt.
- **Fire-lease mutex:** `scripts/loop-fire-lock.mjs` (state:
  `.claude/run-the-loop/.fire-lease.json`) — claim before any fire, emit HEARTBEATs for its
  duration (a silent lease expires); overlapping fires coalesce, never collide.
- Toolchain gotchas: `npm install --legacy-peer-deps` (pnpm breaks on electron-builder) ·
  `.gitignore` blocks `*.md` → `git add -f` · Jest config must be `.cjs`, run from
  `apps/project-sites` · ESLint blocks `console.log` → use `console.warn`.

## 10 · GOLDEN PATHS

- Owner: `.claude/run-the-loop/GOLDEN-PATHS.md`. Inventory: `e2e/FEATURES.md` (authoritative
  feature list) + `e2e/COVERAGE.yml` (feature→spec map; `validate:e2e-inventory` keeps honest).
- **Money path (Brian #1):** search → select business → sign in → AI build → view live site →
  edit → publish. Everything else is secondary while it has any gap/dead-end/stub.
- Journey rules: homepage-first, navigate by CLICKING real UI only, real backend, hard-refresh
  persistence proof, screenshot every step. `*.spec.ts` = CI/dev; `*.e2e.ts` = prod.
- The PRIMARY deliverable of every fire is a COMPLETE real user journey proven on PROD —
  detectors/unit tests are byproducts, never the goal (owner: `README.md` § Prime directive).

## 11 · DECISIONS

- `DECISIONS.md` (repo root) — accepted ADR index. Bodies in `docs/decisions/` (e.g. ADR-0019
  SES sole email rail; ADR-0035 Functions on WfP).
- `SCOPE.md` — mission · hard constraints · Brian-gated decisions.
- Loop history: `.claude/run-the-loop/LEDGER.md`; legacy `apps/project-sites/_LOOP_LEDGER.md`
  (2.3 MB — Explore-agent reads only). Lessons: `.claude/run-the-loop/DISCOVERIES.md`.

## 12 · CURRENT STATE (2026-09-30, entering fire-59)

- **fire-58 CLOSED** (`044ac0ebc`): ledger close-out + the run-the-loop cron CANCELLED per
  Brian — autonomous scheduled loops are halted.
- **fire-59 opens the constitution era**: the Autonomous Visual Product Organization
  constitution persisted verbatim to `CONSTITUTION.md` (`eb94520c4`) at a context ceiling;
  this GENOME is its bootstrap companion.
- **WfP is the DEFAULT serving path** (`x-ps-serve: wfp`, R2 fail-soft). Backfill of WfP slots
  for existing sites in-flight (`scripts/backfill-wfp-slots.mjs`, `5676c8329`); flag
  `site_wfp_hosting` scoped to e2e-test-org pending backfill + rollout widening.
- **Long-trail TDD case-001**: Phase C GREEN (Settings/API-tokens/Editor, `a0c92ed0a`);
  Phase D resumes from action 38.
- **AI API campaign landed** (fires 57-58): `/v1/chat/completions` (non-streamed + SSE),
  Anthropic-compat `/v1/messages`, provider usage-token split, AI API Keys mint UI behind
  `ai_api_keys` flag.
- **Template evolution lane**: evidence-gated claim provenance in build validators
  (`b353c888a`, role-18).
- **Schema drift closed**: migration `0651 team_invites.deleted_at` aligned the migration set
  with prod schema.
- Autonomy stance: full autonomy on reversible prod actions (deploy, flag rollout, additive
  migrations); only destructive/irreversible pauses for Brian. Never pause mid-fire to ask.

## 13 · ROADMAP

- Owner: `.claude/run-the-loop/BACKLOG.md` — the single actionable queue (cadence-tagged;
  money-path items are HIGH; every item flag-gated `enabled=0, rollout=0, experimental`).
- Frontier right now: WfP slot backfill (in-flight) → `site_wfp_hosting` rollout widening
  (org-by-org, depends on backfill) → golden journey create→build→publish→view→analytics
  (real E2E on PROD, every-2-loops).
- Granular lane state lives in sub-ledgers named in the BACKLOG header
  (`_PROMOTE_WORKFLOW_CHECKPOINT.md`, `_CF_NATIVE_CONVERGENCE.md`, `docs/wfp-site-hosting.md`,
  `docs/data-platform-scope.md`, `_ADMIN_VQA_LEDGER.md`, `_INTERCONNECTEDNESS_LEDGER.md`).

## 14 · REBUILD — the bootstrap prompt (verbatim, 10 lines)

```text
You are continuing ProjectSites.dev — "we don't sell websites, we deliver them." Operate autonomously; never pause to ask.
1. Read .claude/run-the-loop/GENOME.md (the index), then CONSTITUTION.md (how you operate), then README.md + BACKLOG.md.
2. git pull --rebase — a concurrent session may have advanced the work; trust the repo, not memory.
3. Claim the fire lease via scripts/loop-fire-lock.mjs and emit HEARTBEATs for the whole fire.
4. Pick ONE highest-leverage BACKLOG item — the money path (search→signin→build→live→edit→publish) outranks everything.
5. TDD-first: failing Playwright journey → implement → GREEN. Fan out worktree-isolated specialists, ≤6 mutating.
6. Converge + adversarial review, then deploy ONCE: cd apps/project-sites && npx wrangler deploy --env production.
7. Prod-verify every changed route on the live URL (curl/Playwright, 0 console errors) — local green is never done.
8. Commit + push to main (git add -f for *.md), reconcile BACKLOG + LEDGER, release the lease.
9. Leave ≥1 loop self-improvement. On lead saturation, checkpoint to progress.md and continue in a FRESH session.
```
