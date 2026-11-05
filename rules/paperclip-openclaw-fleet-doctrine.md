---
last_reviewed: 2026-10-24
superseded_by: null
name: "paperclip-openclaw-fleet-doctrine"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Paperclip + OpenClaw Fleet Doctrine (orchestration SSOT)

How the agent fleet is wired for the Megabyte estate. SSOT for how Paperclip (governance),
OpenClaw (runtime), claw-router (subscription pooling), claw-orchestrator (cross-engine verification +
council plane), and the tier agents (Claude · Codex · OpenCode/DeepSeek · Minimax) run the projects
together. Pairs with `[[agent-provider-policy]]` (which provider, subscription-only) and the `/run-the-loop` command.

## Layering — never collapse
- **Paperclip = management/governance plane.** Owns delegation, org chart, budgets, approval
  gates, routines, cases (= GitHub issues), cost. **If work can conceivably be split across
  multiple computers/agents, Paperclip delegates it** — Paperclip decides *who/what/when*, not
  the individual runtime. It is the single place to **stop everything** (killswitch across all
  sessions + routines + projects).
- **OpenClaw = per-machine runtime/gateway** (`ws://127.0.0.1:18789`): runs isolated coding turns,
  heartbeats, channels. Paperclip manages OpenClaw; OpenClaw executes.
- **claw-router (`cr`) = subscription pooling** for Claude accounts (claude-1/2/3) — never API keys.
- **claw-orchestrator (`clawo`) = the cross-engine VERIFICATION + council plane** (`github.com/Enderfga/claw-orchestrator`;
  this is what Brian calls "OpenClaw Orchestrator" — the native Octopus/OpenClaw orchestrator issue was closed
  not-planned, so clawo IS the orchestrator). Runs Claude/Codex/OpenCode behind ONE runtime and ENFORCES the
  done-criteria: a run reaches `completed` ONLY when an acceptance contract IT DID NOT WRITE passes (commands /
  HTTP probes / screenshots / diff policy → an evidence bundle on disk; editing the contract's tests REFUTES the
  run; a run with no contract completes as `unverified`, never "success"). Adds **councils** (parallel agents in
  isolated git worktrees voting to consensus), **fanout** (cross-engine best-of-N / diverse perspectives),
  **session handoff** (move a live session expensive→cheap or stuck-Claude→Codex — the key cost lever, see
  `[[agent-provider-policy]]` § Quota preservation), and **spend caps** (`maxBudgetUsd` + the durable `clawo runs`
  per-turn ledger). Exposed as MCP (`clawo-mcp`), ACP (`clawo acp`), an OpenAI-compatible endpoint, and a TS SDK.
- **Tier agents** (`[[agent-provider-policy]]`): Claude = architecture/integration/judgment · Codex =
  independent review · OpenCode→DeepSeek + Minimax = cheap parallel throughput. All via subscription
  or inexpensive API per that policy; a stray `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` in any adapter = violation.

## Fleet config knobs (researched 2026-10-25 — full top-30 in the `paperclip-fleet` skill `reference/FLEET-OPTIMIZATION.md`)
Adapter subscription-auth is already HARD in `[[agent-provider-policy]]` § Fleet management plane (launch via
`with-subscription-cli.sh` + `claude-pool`/claw-router; a stray `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` = violation).
These are the concrete, non-obvious knobs that make the layers perform:
- **claw-router reserve** — run official `openclaw/clawrouter` as the subscription POOL; set
  `grantRouting.includedQuotaReservePercent` (~10–20) so a pooled account STOPS before its 5h/weekly window is
  spent → no silent paid-API overage on extra-usage accounts. Watch headroom + reset times via the Subscriptions
  page / `GET /v1/admin/upstream-grants/usage` and route around exhausted accounts. Paid fallthrough is a FLAGGED
  exception, never silent (`[[agent-provider-policy]]` ladder).
- **A STALE claw-router pool silently blocks EVERY `claude_local` agent — "no live execution path".** When
  `cr status` shows accounts `stale` (subscription OAuth expired), Paperclip still assigns issues to claude_local
  agents but their turns can't execute → issues pile up `blocked` ("…no live execution path", empty blockReason).
  Re-auth is INTERACTIVE (a `claude`/`cr` login — a USER action; never mint an API key, `[[agent-provider-policy]]`).
  Mitigation AND quota-preservation point the same way: **default agents to `opencode_local`/DeepSeek** (runs without
  the subscription pool) and reserve `claude_local` for genuine judgment roles (e.g. Architect), which then DEPEND
  on a fresh cr pool. Verify execution liveness via `routine runs` + whether assigned issues leave `blocked`. Ref:
  swarml.ink fleet 2026-10-26 — 107 issues blocked on stale claude-1/2/3; switched Triage-Dispatcher +
  Incident-Responder to DeepSeek to unblock the pipeline, surfaced cr re-auth for the Claude-only roles.
- **EXECUTION GATE (the #1 fleet gotcha): a `managed-sandbox-only` instance with a BROKEN sandbox provider blocks
  the ENTIRE fleet — verify `environment probe` BEFORE expecting any agent to run.** Paperclip can be set to run
  agents ONLY inside a platform-managed sandbox (CloudFlare Sandbox / Daytona / Crabbox) and REFUSE local fallback.
  If every sandbox env's `paperclipai environment probe <id>` returns `ok:false` (CF `"fetch failed"`, Daytona
  `"sandbox creation failed"`), NO agent executes regardless of backend — turns die "no live execution path",
  issues pile up `backlog`/`blocked`, and `agent runtime-state` shows 0 sessions / 0 tokens. It MASQUERADES as an
  adapter or stale-pool problem but is UPSTREAM of the backend. Diagnose with a manual `paperclipai heartbeat run
  --agent-id <id>` — the error names the sandbox cause. Fix = make ONE sandbox provider's probe pass (wire its
  creds: CF Sandbox uses `CLOUDFLARE_API_TOKEN`+`CLOUDFLARE_ACCOUNT_ID`; Daytona needs `DAYTONA_API_KEY`) OR
  deliberately allow local execution (security tradeoff — agents run host-local with the host's git/gh auth; an
  approval-required policy change). Ref: swarml.ink 2026-10-26 — both providers failed probe → 0 fleet execution
  despite 12 agents + 15 routines pre-loaded + the scheduler firing every 20 min.
- **Isolate an orchestrator PROVIDER bug from a provider/account issue by testing the provider's RAW API directly.**
  A sandbox provider can boot sandboxes perfectly via its own API (right key/account/region) while the
  orchestrator's provider INTEGRATION still fails creation — proving the bug is in the orchestrator, not the
  provider or the credentials. And a stuck `pending_cleanup` lease (from an auth-failed cleanup) has NO CLI/REST
  release — breaking it needs targeted DB surgery (`UPDATE environment_leases SET status='released'` via the app's
  bundled `pg`; psql is absent). Ref: swarml.ink 2026-10-26 — Daytona booted a sandbox to `started` in 5s via
  `POST app.daytona.io/api/sandbox` with the get-secret key, yet Paperclip's probe failed the identical shape →
  a Paperclip Daytona-provider bug, not a Daytona/credential problem (correct key now wired for when it's fixed).
- **Cost-aware routing scores USER messages ONLY, never the system prompt** — the big agent system prompt
  otherwise inflates every call to the top tier; scoring only user turns routes the cheapest CAPABLE model
  (~80% of calls don't need premium → large savings).
- **OpenClaw heartbeat** — set `agents.defaults.heartbeat.every` (30m API / 1h OAuth) + `activeHours` +
  `skipWhenBusy`; `lightContext:true` (inject only a per-repo `HEARTBEAT.md`) + `isolatedSession` for monitor
  heartbeats (lean context; "crons = monitoring only"). Heartbeats SILENTLY don't fire if the cron row is off →
  `openclaw doctor --fix` to materialize it.
- **Crabbox workers** — disposable box per autonomous/untrusted/parallel coding turn; `idleTimeout` lease-heartbeat,
  `target` OS (linux default; windows/wsl2/macos for OS-specific work). Put `gh` on the worker PATH (GitHub pushes)
  + bind creds via the sealed launcher + `get-secret`, never baked. ONE profile serves both an OpenClaw worker-turn
  and Codex remote-exec.
- **Agent-path disambiguation (don't conflate)** — ACP/acpx = Claude Code/OpenCode as a controllable HARNESS
  session; native `/codex` = Codex app-server; CLI backends = Claude Code as a MODEL runtime (`anthropic/*`).
  CLI-backend reuse needs OpenClaw on the SAME host as the Claude login (session-affinity, below). `coding-agent`
  skill delegation: `background:true` always; `pty:true` for Codex/OpenCode; Codex never inherits ambient `CODEX_HOME`.
- **Done-criteria** — a run counts as DONE only when checks IT DID NOT WRITE pass (reviewer ≠ author) → wire the
  diversity/independent-review gate into Paperclip's done-criteria + evidence-rich approval gates (before/after +
  preview URL).

## GitHub issue → Paperclip → assign → verify → merge (the auto-remediation pipeline)
The estate's issues live in GitHub; Paperclip drains them autonomously. Wire it so an opened issue becomes a
shipped, verified PR with zero manual kick-off:
- **Ingest.** A Paperclip **GitHub→Paperclip webhook routine** (trigger `webhook`, `issues.opened`/`issues.labeled`)
  syncs each open GitHub issue into a Paperclip issue (a periodic `api`-trigger poll as backstop). Multimodal
  issues: the triage step MUST extract meaning from any attached **video** (transcribe + scene-describe — ElevenLabs
  STT / `jam` for screen recordings / a vision model per keyframe) and **images** (vision) BEFORE planning — never
  act on the title alone.
- **Triage + populate (best-effort ALL fields).** A triage agent decomposes the issue into **sub-tasks ONLY on
  real boundaries** (selective decomposition — don't over-fragment; a plan's steps/files/phases are NOT each a
  task; `reference/PAPERCLIP-OPS.md`), sets **labels**, and fills the governance fields: **assignee**
  (capability-matched), **reviewer** (≠ author), **approvers** (irreversible/high-stakes only), **watchdog**
  (monitor agent that escalates a stall), **parent** + **blocked-by**/**blocking** — and SEQUENCES via
  `blockedByIssueIds`, since parent/child nesting + prose do NOT delay execution.
- **Assign + route.** Paperclip assigns → **claw-router** picks the reserve-protected subscription account →
  **claw-orchestrator** runs the capability-matched engine: a **council** (worktrees + consensus) for hard/ambiguous
  issues, a single session for routine ones, defaulting to OpenCode/DeepSeek per `[[agent-provider-policy]]` §
  Quota preservation.
- **Execute + verify.** issue → fresh worktree off `main` → edit → test → commit → push → `gh pr create --fill` →
  issue `in_review`. The orchestrator's **acceptance contract (authored by the reviewer, NOT the coder)** gates
  `completed`; the watchdog escalates on stall; an approver gate fires only for irreversible/high-stakes
  (evidence-rich — before/after + preview URL).
- **Close.** A `pull_request.closed` + `merged:true` webhook routine PATCHes the linked Paperclip issue to `done`
  with the merge SHA — automatic.
- **API contract + HARD invariants.** Execute all of the above against the absorbed, API-accurate
  `paperclip-fleet` skill `reference/PAPERCLIP-OPS.md` (9-step heartbeat · routines/cases/agent-hire shapes · hot
  routes). Two fleet invariants from it: **NEVER retry a `409`** (the issue is owned by another agent = single-writer)
  and **every mutating request carries a run-id header** (`X-Paperclip-Run-Id`) for idempotency. Paperclip agents
  persist across heartbeats via the adapted **para-memory-files** skill (`$AGENT_HOME/MEMORY.md` + daily notes + PARA `life/`).
- **Cost observability (#11 — know the exact cost of everything).** Unify three ledgers into ONE view:
  claw-orchestrator `clawo runs` (per-turn $ across engines) + `openclaw gateway usage-cost --agent <id>|--all` +
  claw-router per-grant/lane usage → Paperclip per-agent + per-project budgets. ENFORCE caps at `maxBudgetUsd`
  (orchestrator) + `includedQuotaReservePercent` (router) + Paperclip budgets — NOT at the OpenClaw gateway (it
  exposes usage-cost but has NO per-agent budget-cap key; don't rely on one that doesn't exist).

## One comprehensive loop (projects are trained so ONE loop suffices)
- `/run-the-loop` is the **whole business arc**, not just code: solve issues · build the product ·
  **market the business** · grow distribution · convert · operate on data (the dev roster 1–15 +
  the Growth & business roster 16–19). Paperclip delegates these roles across the fleet.
- **Train the project, don't add loops.** A repo's `.claude/commands/run-the-loop.md` +
  `.claude/run-the-loop/SPECIAL-TASKS.md` encode everything that repo needs the one loop to keep
  doing. Recurring publishes are **standing crons in SPECIAL-TASKS** (e.g. "a blog post every day for
  this site"), folded into every fire — not separate bespoke loops. Add a dedicated cron only for a
  genuinely independent cadence; default is the single loop.
- **The loop is GENERATIVE — there is almost always real work (Brian 2026-10-26).** `/run-the-loop` spans the
  whole business arc, so a fire should find a genuine slice to advance (an open issue, a product gap, a marketing
  or distribution move, a conversion or data op, a quality/cost/observability improvement) FAR more often than it
  holds. A HOLD-and-stop is legitimate ONLY for a genuinely-converged NARROW task-loop with no slice left (the
  convergence-engine audit was one such); it is NOT the default disposition of the business loop. Before holding,
  drain the backlog and re-scan the arc — manufacturing busywork is still forbidden (§24), but so is idling when
  real work exists. **Heartbeat** = the periodic wake where an agent checks for assigned issues/routine-executions
  and acts; a *monitor* heartbeat is a lean (`lightContext`+`isolatedSession`) wake that only CHECKS status, while
  a *working* heartbeat picks up and drives an issue to done. Prefer working heartbeats wherever a queue has items.

## Automation-first (like Claude Code — minimize manual approvals)
- Default to **auto-handling**: gather additional context automatically, pick the obvious option,
  proceed, and verify — do NOT stop for a human on routine work. This is the `autonomous-engineering`
  `autonomous` tier and it is the DEFAULT for the fleet.
- **Approvals exist ONLY for genuinely irreversible / destructive / prod-risk / legal / spend-over-budget
  actions.** Everything reversible ships autonomously (solo-builder, main-only, prod-is-the-only-env).
- When an approval IS warranted, make it **evidence-rich**: bridge the Paperclip approval gate to the
  work and attach a **preview-environment URL + before/after screenshots + a short screen-recording/video
  whenever possible**, so the human decides in seconds from artifacts, not prose.

## Observability — all four rails, every project + the fleet's own runs
Per `[[production-observability-default-on]]`: **PostHog + GA4 + Sentry + Langfuse + Cloudflare AI
Gateway** on every project (supersedes solo "2 vendors max"). The fleet's OWN agent runs are traced
too (Langfuse for model calls; run telemetry → the loop's Business Analytics role + the `fleet-health`
routine). Signal → backlog, automatically.

## Secrets — Infisical-injected, never baked
- Agent/OpenClaw runs get credentials via **Infisical** (the estate secret manager) — or the
  provider's recommended mechanism for the specific integration — injected at run start, never
  committed, logged, or pasted into prompts. See `[[secret-provisioning]]` / `[[agent-vault-brokering]]`.
- Subscription auth (Claude/Codex) is NOT a secret to inject — it stays in the CLI/claw-router homes.

## Verification — Cloudflare Browser Run
Real-user-journey E2E on deployed sites runs through **Cloudflare Browser Run** (estate standard;
not Browserbase). Screenshot every step, AI-vision ≥8/10 on new surfaces, assert live prod.

## Computer Use across the fleet → `[[computer-use-mastery]]`
GUI/desktop Computer Use is a fleet capability, governed here, with the full playbook in the
`computer-use-mastery` skill. Fleet-level rules:
- **Session-affinity routing:** route a CU task to the OpenClaw node that HOLDS the right logged-in session
  (the machine already signed into the target app) — never a random worker. Tag nodes with the sessions they own.
- **CU-capability flag on adapters:** only route GUI-CU to CU-capable runtimes (OpenClaw yes; a shell/HTTP
  adapter no). Paperclip's BYOA adapter set has no native CU flag today → add one so CU never lands on an
  incapable adapter. (Inferred gap, 2026-10-25.)
- **Evidence-rich approval gates:** an irreversible/high-stakes CU action (purchase/send/delete/auth change)
  goes to a Paperclip approval gate carrying a **before/after screenshot + a short screen-recording** + the
  intended action; reversible CU (read/navigate) runs autonomously (automation-first). Honor the provider
  safety-check contract (OpenAI `pending_safety_checks`) as the gate trigger.
- **Budget-cap vision loops:** screenshots dominate CU cost — set a per-CU-task token budget; Paperclip's hard
  limit stops a runaway screenshot loop.
- **Sandbox autonomous CU:** OpenClaw **Crabbox** workers (isolated desktop session, private endpoint) for
  untrusted/background CU — never the operator's daily desktop. One actor per desktop session (atomic checkout
  = fleet single-writer).
- **CU telemetry → audit + flywheel:** capture screenshots, action log, refusal evidence, token spend per CU
  run; a stalled loop surfaces on the heartbeat, never spins silently.
- **Dual-mode Ubuntu runner:** headless coding and research continue concurrently across Claude×3, Codex×1, OpenCode×1 and future Gemini lanes while exactly one Cua writer owns the active desktop. Enforce the writer lock with `bin/cua-singleton.sh`; observers may read cached evidence but never click/type concurrently.
- **Browser before desktop:** all web automation starts with browse CLI named sessions. Cua Driver is the escalation for native apps, inaccessible UI, or authenticated desktop state browse cannot reach. Never have browse and Cua mutate the same browser/profile simultaneously.
- **Bitwarden broker, not ambient vault:** the runner may keep Bitwarden CLI logged in, but ordinary agents never inherit `BW_SESSION`, master passwords, or vault dumps. A narrow broker resolves only an approved item/field into the target process or Infisical/get-secret destination, then locks/clears its session. Secret values never enter Paperclip issues, prompts, screenshots, logs or clipboard history.
- **Consequential account workflow:** agents autonomously inspect Claude account/team/cloud-session/reward state and prepare evidence. Converting an organization, accepting plan terms, activating a paid/reward program, changing billing, minting an admin key, or saving it across stores requires a Paperclip approval. After approval, execute once, verify dashboard state, broker the credential directly, and record only its secret reference/fingerprint.

## Periodic portfolio architecture routine

Install `config/paperclip-routines/portfolio-architecture.json` on the fleet. It runs weekly with `concurrencyPolicy=forbid`, reconciles architecture across all products, spends expiring Claude cloud credit on high-value independent GitHub work, dispatches routine shards to DeepSeek/OpenCode, and emits approval-gated entitlement/account actions. `/run-the-loop` may order the same routine ad hoc when it discovers a high-payoff entitlement or estate-wide architectural gap.

## SaaS feature completeness
Every SaaS app the fleet produces must ship the features users expect from global-leading software,
inferred from **web research on category leaders** — see the `saas-feature-completeness` skill, which
is to be **continuously elaborated** so "complete SaaS" keeps meaning what the market expects.

## Agent-skills are runtime-agnostic (Paperclip/OpenClaw consume them too)
The `~/.claude` + `~/.agentskills` skills/rules are loaded not only by interactive Claude Code but by
**fleet agents** (Paperclip `claude_local`/`codex_local`/`opencode_local`, OpenClaw turns). Therefore:
keep skill instructions **portable** (no assumption of an interactive human, a specific CWD, or a TTY),
make the primary deliverable the first action (resilience), and prefer file/CLI contracts over
chat-only affordances. OpenClaw/Paperclip sync the manifest; a skill that only works in an interactive
session is drift — fix it so any runtime can run it.

## Compounding flywheel (the fleet gets smarter every loop) — R24
Every `/run-the-loop` fire's mandatory ≥1 loop-improvement (command §7) MUST, when it surfaced a
reusable lesson, fold it back into the **shared** `~/.claude` + `~/.agentskills` repo via
`agentskills-retrospective` — because every runtime (Claude Code · Codex · OpenCode · OpenClaw ·
Paperclip adapters) loads that same brain. So: **skills → fleet runs → results → better skills →
better fleet runs**, estate-wide, automatically. Route each lesson to the smallest correct
destination (memory · rule · skill · project doc) per `routing-matrix.md`. A recurring defect the
fleet fixes in ≥2 projects → promote to a tested invariant (semgrep/lint, `[[lint-doctrine]]` §
self-improving, R15) so it can't regress anywhere. Cross-link siblings. The flywheel is the point:
a solo builder + this fleet compounds because every pass leaves the brain sharper for all runtimes.

## "UI-gated" ≠ "human-only" — drive it with Browser Run + persistent auth (Brian 2026-10-26)
A fleet/admin step that has no CLI/API path (e.g. Paperclip's project-workspace repo + GitHub Connector) is NOT a
"hand it to the human" step — the estate has browser automation (Cloudflare Browser Run / Browserbase + Stagehand
per `[[browser-automation-routing]]`). The real blocker is AUTH, not clicking: a fresh headless browser isn't logged
into the Zero-Trust/IdP wall, the app's own login, or GitHub's OAuth consent, and it can't cold-pass SSO/OAuth-consent
screens. The FIX = persistent auth, set up once:
- **storageState** (Playwright/Stagehand): one interactive login → save cookies+localStorage → store in R2/secret →
  inject into every Browser Run session. Covers the Access cookie + the app session.
- **Browserbase Contexts**: persistent cloud browser profiles — log in once, reuse `contextId`, sessions resume logged in.
- **CF Access service token** (`CF-Access-Client-Id`/`Secret`) for Zero-Trust-gated hosts — present the headers to
  pass Access programmatically (we hold `CF_ACCESS_CLIENT_ID/SECRET`).
- **API token over OAuth** wherever supported (GitHub Connector's fine-grained PAT path from get-secret) — skips the
  OAuth consent screen entirely.
- Fallback: drive the user's own Chrome over CDP with its existing cookies.
Reserve the HUMAN only for the ONE-TIME session capture (SSO/OAuth consent) — after that it's automatable + reusable.
So: default to automating UI-gated fleet steps via Browser Run + a persisted session; don't punt to the human. Ref:
swarml.ink #1 (project workspace + GitHub connect) — I wrongly called it human-only; it's Browser-Run-automatable
once a Paperclip UI session is captured (CF Access service token + GitHub PAT already in get-secret). Cross-links
`[[browser-automation-routing]]`, `[[computer-use-mastery]]`, `[[secret-provisioning]]`.

## Execution-gate refinement — a NULL `repoRef` + a dead-pool assignee are the silent #1 blockers (Brian 2026-10-26)
Beyond the managed-sandbox-probe gate above, two more SILENT blockers stop every agent turn — both REST-fixable, no UI:
- **A project workspace with `repoUrl` set but `repoRef` (base branch) NULL** → worktree can't cut from an undefined base
  → every turn dies "Could not read execution-target Git context" and the issue sits `blocked` with NO blockReason + NO
  blockedByIssueIds. Fix: `PATCH /api/projects/{id}/workspaces/{wsId}` repoRef/defaultRef = the repo's ACTUAL default
  branch (`gh api repos/{o}/{r} --jq .default_branch`). The workspace EXISTING is not enough — check `repoRef != null`.
- **The issue assigned to a `claude_local` agent whose pool is STALE (state=error)** → it can never run. Reassign to a
  pool-INDEPENDENT `opencode_local`/DeepSeek agent (the quota-preservation default anyway) to unblock immediately.
- **VERIFY with a real `heartbeat run`, never a config read** — the trace proves execution (env lease + model invoked +
  commit) and names the NEXT blocker. Ref: swarml.ink 2026-10-26 — bz.rocks MEG-101 had BOTH (null repoRef + Claude-3
  errored); after the two REST fixes a heartbeat ran end-to-end on DeepSeek/OpenCode (committed locally, $0), git-context
  gone. Remaining were DELIVERY blockers only: GitHub push-credential broker down (`broker_transport_unavailable` +
  WARP "Please authenticate via the warp client") + `Cross-issue writes need a run` + `worktreePath:null`. Cross-links
  `[[verify-against-source-of-truth]]` (heartbeat = ground truth), `[[agent-provider-policy]]` § Quota preservation.
