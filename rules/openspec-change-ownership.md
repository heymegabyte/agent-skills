---
name: openspec-change-ownership
description: Plan & decompose early into coherent OpenSpec changes; each active change has ONE owning agent instance that directly performs every subtask (design, code, tests, docs, fixes, verification); parallelize ACROSS changes, never within one; capture high-value recommendations into OpenSpec the moment they surface. Use on planning, decomposition, delegation, dispatch, handoff, review, and continuous-improvement work.
priority: 2
pack: "core"
triggers: ["openspec","decompose","decomposition","plan the work","break this down","dispatch","delegate","handoff","who owns this","change owner","parallelize","parallel agents","recommendation","proposal","run-the-loop","assign"]
---

# OpenSpec Change Ownership — Plan & Decompose Early

The dispatch unit is the **OpenSpec change**, owned end-to-end by ONE agent instance. Plan the
decomposition BEFORE substantial implementation; capture high-value ideas into OpenSpec the moment
they surface. This is the canonical procedure — the concise invariant is mirrored in the
always-loaded `CLAUDE.md` / `AGENTS.md` / `GEMINI.md`. It **refines, does not contradict**, the
swarm doctrine: parallelism moves to the change level.

Cross-links: `[[openspec-operating-contract]]` · `[[split-work-into-ledger]]` · `[[parallel-multi-swarm-orchestration]]` · `[[agent-provider-policy]]` · `[[evidence-gated-autonomous-orchestration]]` · `[[monitor-orchestration]]` · `[[context-hydration]]` · `[[main-only-branch]]`

## The invariant (every substantial task)

- **Plan & decompose early.** Before substantial implementation, do enough recon to understand specs,
  code boundaries, dependencies, and acceptance criteria, then map the authorized work into coherent
  OpenSpec changes. A trivial one-surface edit may be a single change; anything larger is decomposed first.
- **One owner per change = direct execution of the WHOLE change.** Each active change has exactly ONE
  owning agent instance; that same agent personally performs every subtask — detailed design,
  implementation, tests, documentation, fixes, artifact upkeep, completion verification. Do NOT hand
  different checklist items of one change to different implementation agents.
- **Reviewer reports, owner fixes.** An independent reviewer (another agent/model) may inspect and report
  findings; the owning agent performs the resulting fixes. Review ≠ co-ownership.
- **Parallelize ACROSS changes, not within one.** To use more implementers, split the work into more
  coherent changes — never fragment a single change's subtasks across agents.

## Decompose (the pre-dispatch questions)

Ask before dispatch: which independently-verifiable outcomes can become changes NOW? which can run in
parallel? can ONE agent finish every subtask of each? which dependencies / shared files force
sequencing? what improvement did I just discover that must be preserved now? Decompose by coherent
outcomes + interface boundaries; a feature's API/UI/tests/docs/follow-up fixes normally stay together
under one owner. Keep ordinary implementation detail as subtasks, not separate changes. Start ready work
promptly; elaborate later changes as their dependencies firm up. Re-decompose when evidence materially
changes the plan.

## One-owner, made operational

- **Owner identity = a specific agent INSTANCE/session**, not a bare model name ("Claude"/"Codex" alone
  is insufficient when multiple sessions run). Record it in the change (owner metadata / documented sidecar).
- **Every implementation assignment carries:** the change ID + artifact path · the single owner · scope,
  acceptance, dependencies, allowed write areas · the full task list + verification expectations ·
  "retain ownership through review fixes + completion."
- **Prevent duplicate ownership with the atomic claim mechanism.** Claim via `bin/change-ownership.ts`
  (`claim`/`release`/`transfer`/`show`/`list`) — it exclusive-creates `openspec/changes/<id>/owner.json`
  (`wx` = `O_CREAT|O_EXCL`), so two concurrent claims yield exactly one winner; the rest are refused (exit 3
  → wait/queue). A YAML owner field or separate Git checkouts are NOT an atomic lock. Where none applies,
  **serialize assignment**.
- **Serialize changes that conflict** over shared files/interfaces; preserve the main-only branch policy
  (`[[main-only-branch]]`). One agent may complete multiple changes sequentially.
- **Preserve ownership across compaction/resume.** On owner unavailability, explicitly transfer the
  ENTIRE remaining change (record completed + outstanding work) and END the prior ownership before the
  replacement proceeds.

## Capture recommendations continuously (standing authorization)

- Every agent is standing-authorized to create/update OpenSpec proposals whenever a concrete, high-value
  improvement surfaces during authorized work — at ANY phase (research, hydration, architecture, coding,
  debugging, testing, UX, perf, security, verification), including between checkpoints. Never leave a
  valuable recommendation only in chat or defer it to the final message.
- For each: (1) check specs/active/archived for duplication or conflict; (2) update the matching change
  or create a separately scoped proposal; (3) save REAL content — problem, evidence/assumptions, proposed
  improvement, expected benefit, scope, priority, dependencies, acceptance (a bare dir/metadata file is
  insufficient); (4) record uncertainty honestly, proportional to maturity; (5) continue authorized work.
- If another agent owns the matching change, persist the finding via the coordination mechanism and route
  it to that owner — no competing edits.
- **Capture ≠ authorization.** Implement only what the goal or standing authorization already covers; keep
  other proposals proposed/deferred with rationale preserved. No quota — capture what's genuinely worthwhile.

## Reconciliation with the swarm / throughput doctrine

`[[parallel-multi-swarm-orchestration]]` and `[[agent-provider-policy]]` still hold — but the unit of
parallelism is the **whole change**, owned end-to-end. An OpenCode/DeepSeek worker owns a complete,
contract-locked change (not a fragment of one). Frontier architects (claude / codex / gemini / antigravity
— never opencode) author the OpenSpec; the owning implementer drives it to verified completion. "Disjoint
worker ownership" = disjoint CHANGES, not disjoint subtasks of one change.

## Verify (before "done")

- Each available agent loads this invariant in a fresh session (it's in the always-loaded `CLAUDE.md`/`AGENTS.md`/`GEMINI.md`).
- A multi-outcome request is decomposed into changes BEFORE substantial implementation.
- Every subtask of a change kept ONE owner; a second agent could not simultaneously claim it.
- A mid-task recommendation produced a real proposal (with content), without duplicating an existing change.
- An unrelated recommendation stayed proposed while authorized work continued.
- Compaction / resume / handoff preserved progress + ownership.
- OpenSpec artifacts validate (`openspec validate <id> --strict`); installer/sync re-run adds no duplicates.

## Anti-patterns

- Starting substantial implementation before decomposing into changes.
- Splitting one change's checklist across multiple implementation agents ("you take tests, you take docs").
- A reviewer editing the code instead of reporting findings to the owner.
- A recommendation left only in chat / the final response instead of saved to OpenSpec with real content.
- Treating a created change directory as "done" without acceptance + verification evidence.
- Owner = a bare model name; or two sessions editing the same change with no atomic claim.
