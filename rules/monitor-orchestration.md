---
last_reviewed: 2026-06-29
superseded_by: null
name: "monitor-orchestration"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Monitor Orchestration + One-Prompt Completion

Every multi-faceted user prompt MUST be completed in this turn — never split across follow-ups. Main thread acts as **Monitor**: decompose → fan out parallel sub-agents → sequence dependents → fold → verify → ship.

## When to fire

Fire if ANY of:

- ≥3 distinct work units in prompt
- Explicit list / numbered sections / "phases" / "passes"
- "finish everything" / "implement all phases" framing
- Multiple pages/components/files needing change
- Prompt would otherwise yield "defer X to follow-up"

If yes: **FIRST tool call** is `TaskCreate` per work unit + parallel `Agent` spawns for independent ones — NOT a sequential file-read marathon.

## Decomposition (within 30s of prompt)

1. **IndependentPasses** — no file conflicts → spawn parallel agents
2. **DependentPasses** — need another pass's output → sequence explicitly
3. **ForegroundPasses** — small edits main thread does while agents run
4. **ExternalBlockers** — needs user (API keys, DNS, images) → surface at end-of-turn; do NOT block parallel work

## Parallel-agent spawn discipline

- Spawn multiple `Agent` calls in **ONE message** — never sequentially
- Each agent: 100-300 word self-contained brief (scope · files owned · what NOT to touch · output format)
- Use `isolation: "worktree"` for heavy file rewrites that might race
- Monitor waits via completion notification — **NEVER polls/sleeps**
- `parallel-subagent-economy` governs fan-out WHEN/WIDTH/MODEL; this rule governs WHETHER Monitor fires

## Sequencing

- Dependent passes: one `Agent` after prerequisite completes, OR main thread chains
- Order: parallel-batch-1 → foreground → wait → parallel-batch-2 → build → deploy → verify → report
- Never serialize what can parallelize; never parallelize what has a true data dependency

## Follow-up = shortcoming feedback loop

When user issues a 2nd/Nth prompt on same project:

1. Read it as a gap report
2. Identify the shortcoming type
3. **Before doing the work**: append gap to Known shortcomings below + cross-link from relevant rule
4. Commit rule update same turn — never deferred

## Known shortcomings (append, never delete)

Each entry: `<symptom>` → `<root cause>` → `<rule that prevents it>`.

1. **"Implement all phases" yields one-section-per-turn** → Monitor not fired → THIS rule.
2. **"Finish everything" closes with deferred items** → parallel-agent spawning missed → THIS rule § Decomposition.
3. **External blockers silently absorb 30%+ of brief** → ExternalBlocker bucket implicit → THIS rule § Decomposition (4); `brian-preferences` § explicit blockers.
4. **AI chat widget spec'd but never coded across 3 passes** → no Monitor decomposition; each pass picked one fix → THIS rule § Parallel-agent spawn.
5. **AUDIT_PASS_N docs accumulate while items stay open** → audit-without-implementation drift; S/M items MUST fan out to parallel Agent spawns same turn.
6. **Repeated identical prompt = wrong-shaped response** → re-read fresh; check if user wants Monitor to FIRE not more output.
7. **One-line rebuild (`rebuild|optimize X.com`) executed serially** → rebuild is ≥7 independent units (crawl→classify→org-type→i18n→jewel→IA→deploy-verify) → `source-site-enhancement` § Parallel-agent playbook; `16-cinematic-website-prime-directive` rule 110; Monitor-fire explicit on first tool-call message.
8. **Single-prompt corrections ("now do X") dropped on the floor outside Monitor turns** → elevated to SUPREME universal at `prompt-as-training-signal` (7 prompt shapes + extraction protocol); this rule points up to it.
9. **Parallel spawns defaulted to `general-purpose` workers** → no diversity check → `agent-selection` (taxonomy + classify-before-spawn + assignment table + rejected-agent note + **Agent Diversity Review gate**). Emit assignment table before spawning; diversity gate before DONE.
10. **`/loop`-driven sessions accumulate 15+ serial passes — NOT always a shortcoming.** Per `parallel-subagent-economy` (<5-min gain → serial-correct), bounded iterative `/loop` passes that each close prior Recs are healthy. "Follow-up = shortcoming" applies when prior turn under-delivered, NOT when prior turn deliberately scoped one slice. Diagnostic: if pass-N Recs → pass-(N+1) Next AND CHANGELOG grows linearly → healthy iteration.

11. **Vendored third-party skills committed verbatim (7K lines of upstream prose)** → fidelity over-indexed, compression skipped → `[[vendored-skill-compression]]` (compress on the way in, reference public content, fold overlaps); re-prompt "absorb while compressing" was the correction.
12. **A "finish all the TODOs" mandate answered with an ever-growing audit arc** → the brief said *LAUNCH PARALLEL AGENTS and CLOSE the TODO items*; each turn instead found a real-but-adjacent defect (optional-chain crash, localStorage collection crash, doc drift) and fixed it serially, so the TODO inventory was never fanned out and the user re-issued the SAME prompt four times. Root cause: a defect found mid-flight was treated as higher priority than the mandate, and no bounded inventory existed to measure progress against. → Rule: on any completion mandate, the FIRST tool-call message must fan out read-only inventory agents (one per surface — editor `app/`, worker `src/`, Angular `frontend/`, `docs/`) to produce the TODO list, then fire mutation agents per item; adjacent defects found mid-flight are queued as items, never allowed to absorb the mandate. Progress is measured as `closed / total`, and the mandate is done only when that ratio is 1.0. Cross-links `[[prompt-as-training-signal]]` §4, `[[auto-integrate-recs]]`.
13. **Lead over-checkpointed on a transient single-agent ECONNRESET** → in projectsites `/run-the-loop` fire-51 ONE agent died on a network drop (`subagent_tokens: 0` from ECONNRESET, NOT lead saturation), the lead read this as the HARD-STOP trigger and "checkpointed fire-52 to a fresh session," and Brian immediately re-fired `/run-the-loop` — the corrective signal that continuous operation was wanted. Root cause: the HARD-STOP language conflated agent-attrition with lead-saturation, so a recoverable worker failure was mistaken for orchestrator death. Compounding near-miss: fire-51's dead golden-path agent HAD committed a complete verified fix (`4334a853e`) that was nearly lost when its worktree branch was `git branch -D`'d unshown. → Rule: the failure-taxonomy rule (`.claude/run-the-loop/OPERATING-PRINCIPLES.md` § Failure taxonomy vs HARD-STOP) — a WORKER agent failing (ECONNRESET / one-agent `subagent_tokens: 0` from a network drop / cut-off output) is fan-out attrition: salvage its commit (`git show <branch-tip>` BEFORE `git branch -D`), re-queue its slice in `BACKLOG.md`, and KEEP THE LOOP RUNNING; ONLY the LEAD failing ("Prompt is too long" on the orchestrator / autocompact thrash on the lead / can't-spawn) is the checkpoint-to-fresh-session trigger. Cross-links `[[prompt-as-training-signal]]` §4, `[[parallel-subagent-economy]]` (never re-fan-out for repair), `[[agent-resilience-discipline]]` (atomic-Write salvage).
14. **Scout under-search produced a FALSE-PHANTOM verdict that nearly retired a real P0** → in projectsites `/run-the-loop`, fire-69 replenished a "North Star WebGL gap" LEAD (generation does not EMIT a `WebGLHero` from pack `webgl` blocks). A fire-70 scout, tasked to confirm it, searched ONLY `apps/project-sites/src` — found zero webgl/canvas/three/shader there — and on that PARTIAL grep declared the item a "phantom," nearly retiring it. The dismissal was WRONG: `apps/project-sites/templates/webgl/WebGLHero.tsx` (5.1K) + `webgl-hero-core.mjs` (14K) + per-vertical `webgl` blocks DO exist in-repo; the component is real, BUILT, and simply UNWIRED into site-generation (`grep WebGLHero apps/project-sites/src` = 0) — a genuine built-but-unwired P0, exactly the interconnectedness class. The adversarial-review phase caught the false-negative before the live item was retired. Root cause: a NEGATIVE/dismissive gap verdict was reached from a partial-tree grep (`src/` only), missing the `templates/webgl/` subtree where the code actually lives — absence was asserted without being confirmed across the full relevant source. → Rule: the backlog-hygiene rule (`.claude/run-the-loop/OPERATING-PRINCIPLES.md` § Convergence discipline) — evidence cuts BOTH ways: a gap DISMISSED as "phantom"/absent MUST confirm ABSENCE across the FULL relevant tree (`src/` + `templates/` + the remote template repo), never a partial grep, exactly as a gap PROMOTED to a LEAD must carry file:line evidence it EXISTS. A vision/discovery verdict — positive OR negative — stays a candidate until confirmed against the full source + store. Cross-links `[[prompt-as-training-signal]]` §4 (re-prompt = prediction miss), `[[verify-against-source-of-truth]]` (confirm claims against the authoritative store/source, never a self-referential assertion).

15. **A fixable defect deferred across an autonomous `/loop` by "surface to the owner, await decision" — but the owner isn't watching, so the decision never arrives** → in agent.megabyte.space's gorgeous-site `/loop`, 3 dead footer links (owner's own down domains: strictlint.com 000, ai.megabyte.space 522, videoblobs.com 526) were "surfaced rather than silently removed" for ~10 fires; no response ever came because the loop is unattended, so the dead links persisted against the explicit gorgeous + all-hyperlinks-valid gate. Root cause: the "don't silently delete content you didn't create → surface instead" guard was applied verbatim in an AUTONOMOUS context where "surface and wait" degenerates to "never resolve" — parking a fix on an absent user's decision is a disguised Rec. → Rule: in an unattended loop, a fixable defect is NEVER deferred on a user decision — resolve it with the least-destructive REVERSIBLE action (here: comment the dead links out in-place with a dated reason + one-line restore snippet, preserving the owner's portfolio without rendering broken links) and document the reversal path; "surface instead of acting" is for INTERACTIVE sessions where the user can answer this turn. Cross-links `[[auto-integrate-recs]]` (defer-to-absent-user = disguised Rec → ship reversibly), `[[prompt-as-training-signal]]` §4.

16. **Two agents independently ran the same broad "principal architect" directive and collided at push time — near-identical Cloudflare doctrine, add/add conflicts, a rejected push** → during the agent-fabric buildout a parallel session authored the SAME new rules (`cloudflare-agent-fabric.md`, `ai-search-knowledge-fabric.md`, an MCP-audit tool, `model-routing`/skill-28 edits) and pushed FIRST; this session's `git pull --rebase` then halted on add/add + content conflicts across every CF file. Root cause: a wide, open-ended directive with no single-owner lock invites duplicate-but-divergent work, and naively finishing the rebase (or force-pushing) would have either overwritten the other agent's canonical already-pushed version or created competing duplicate rules — both violate "reconcile, don't overwrite / don't duplicate." → Rule: when a push is rejected because a parallel agent did overlapping work, DEFER to the canonical pushed version as the base (`git rebase --abort` → inspect `origin/<branch>` → `git reset --hard origin/<branch>`), then re-apply ONLY your genuinely-unique delta via a SURGICAL patch (`git diff <base> HEAD -- <only-the-unique-files>` — never the whole commit, which carries the duplicates), and COMPLETE the first-mover's work rather than compete with it (here: fix the rule/command count-drift they left in `README.md`/`llms.txt` instead of re-adding rival rule files). Never force-push; never discard the first-mover's work; confirm your delta is purely additive with a diff + the repo's own validators (doc-counts, markdownlint, crosslinks) before committing. Cross-links `[[parallel-subagent-economy]]` (one owner per work-unit prevents the collision), `[[verify-against-source-of-truth]]` (the pushed remote + the repo's own count-deriving script are the authoritative base), `[[prompt-as-training-signal]]` §4.

## Healthy iteration patterns (NOT shortcomings)

1. **`/loop N{m,h}` cron + bounded iterative prompt** — serial main-thread passes each scoping one coherent slice; pass-N Recs become pass-(N+1) Next; CHANGELOG grows one § per pass; diff ~5-200 LOC/pass.
2. **Recs section with 2-3 future candidates** — per `auto-integrate-recs`: <2h items ship in-turn; only design-conversation / external-blocker / >2h items belong in Recs.
3. **One-coherent-slice-per-turn against `/loop`** — distinct from shortcoming #1 (multi-faceted "implement all" brief). Healthy when scope is intentionally narrow + self-iterating.

Trigger heuristic: identical prompt + no Recs closed + deferred items piling up → shortcoming. Identical prompt + Recs closed + CHANGELOG linear → healthy.

## Update protocol

On this rule being updated:

- Append to Known shortcomings
- Cross-link from most-relevant adjacent rule
- Include update in same turn's tool calls (never "next turn")
- Commit to `~/.agentskills` immediately

## Implementation checklist (Monitor each turn)

- [ ] Monitor pattern fires? (see When to fire)
- [ ] `TaskCreate` one task per independent work unit
- [ ] Multi-`Agent` spawn parallel work in ONE tool-call message
- [ ] Main thread foreground edits while agents run
- [ ] Wait notification-driven, never polling
- [ ] Fold agent outputs → coherent build
- [ ] Build + deploy + smoke-test on prod URL per `verification-loop`
- [ ] User follow-up arrives → append shortcoming + cross-link BEFORE doing work
- [ ] Rule changes committed same turn

See: `always` § Post-work, `verification-loop`, `full-autonomy` § Sub-agent prompts, `prompt-as-training-signal` (SUPREME universal).

## Folded from Superpowers — executing-plans

*Vendored discipline from [obra/Superpowers](https://github.com/obra/Superpowers) (MIT, Jesse Vincent). Full skill: `20-superpowers` → writing-plans/SKILL.md (plan authoring) + subagent-driven-development.*

- Before executing a written plan: read it whole, **review critically**, raise concerns with the user BEFORE starting — not mid-execution.
- Create one todo per plan item; execute each step exactly (plans carry bite-sized steps); run the step's specified verification before marking done.
- **Stop and ask, don't guess** when blocked: missing dependency, failing test, unclear instruction, or repeated verification failure.
- Return to plan-review when the approach needs rethinking or the user revises the plan.
- Never start implementation on `main` without explicit consent (this repo: worktree-isolate per `[[main-only-branch]]`).
- On completion → ``20-superpowers`` → finishing-a-development-branch (verify tests, choose merge/PR/cleanup).
- Where subagents exist, prefer ``20-superpowers`` → subagent-driven-development over solo serial execution.
- See `20-superpowers`

### 2026-09-21 — main-thread reconnaissance of large trackers (context thrash)

- **What happened:** the orchestrator read `_LOOP_LEDGER.md` (large, multi-section) plus `SCOPE.md`/`DECISIONS.md` in-thread, then re-derived git state. The harness reported *"Autocompact is thrashing — the context refilled to the limit within 3 turns of the previous compact, 3 times in a row"* — after **0 agents spawned, 0 files edited, 0 deploys attempted**.
- **Why it's a failure:** reconnaissance is not progress. The orchestrator retains file dumps it will never act on, burning the exact budget the subagents need.
- **HARD RULE:** the main thread MUST NOT read a tracker/ledger/scope doc (`_LOOP_LEDGER.md`, `SCOPE.md`, `DECISIONS.md`, `progress.md`) or any file it cannot act on directly. Delegate every inventory read to a fresh-context `Explore` agent with a ≤150-line output cap. The main thread holds conclusions only.
- **Saturation handling:** an `autocompact thrashing` notice, a "Prompt is too long" spawn failure, or `subagent_tokens: 0` → checkpoint to `progress.md`, let autocompact run, and CONTINUE in-session (lean lead: delegate + conclusions-only). Never retry in place; NEVER tell the user to start a fresh session — the agent self-manages context (`[[agent-self-manages-context]]`).

### 2026-09-21 (same session) — the documentary fix above was INSUFFICIENT

- **What happened:** the rule above was written, then the class RECURRED in the SAME session — a 257.9KB `Read` of a `tasks/*.output` path (a symlink to a full subagent JSONL transcript). It was stopped only by the harness's incidental 256KB guard, NOT by the rule. A rule that was authored minutes earlier did not prevent the recurrence.
- **Why it's a failure:** a prose rule is advisory. It competes for attention with the very context bloat it warns about — and it loses exactly when the context is fullest. `hooks > rules > skills > prompts`: the lesson was re-learned the hard way.
- **HARD RULE (now hook-enforced, not rule-advised):**
  - Hook: `~/.claude/hooks/guard-oversized-read.py`
  - Wired in `~/.claude/settings.json` under `hooks.PreToolUse`, matcher `Read`, WITHOUT the `2>/dev/null || true` suffix its three sibling hooks carry — that suffix would swallow exit 2 and silently disable the block.
  - Env-tunable thresholds: `READ_GUARD_MAX_BYTES` 65536 (unwindowed) · `READ_GUARD_TASK_OUT_BYTES` 8192 (`*/tasks/*.output`, window or not) · `READ_GUARD_MIN_WINDOW` 2000 (a `limit` >= this is the whole file wearing a window's clothes).
  - Proven 11/11 in a functional test, incl. `limit=99999` → exit 2 (a live bypass of the guard's first cut) and offset-only → exit 2.
- **Supersedes** the rule-only mitigation above for the `Read` path; the HARD RULE + HARD STOP triggers above still apply to what the hook cannot see (git-state re-derivation, non-file reconnaissance). Cross-link `[[main-thread-recon-thrashes-context]]`.
