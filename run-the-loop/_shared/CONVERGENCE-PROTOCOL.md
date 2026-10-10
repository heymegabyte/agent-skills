# CONVERGENCE-PROTOCOL — the autonomous research→implement→verify loop

> The OPERATIONAL PROCEDURE + observable EXIT CRITERIA for every substantial development request.
> `CONSTITUTION.md` is the governing philosophy (why); `OPERATING-PRINCIPLES.md` are the invariants
> (never-break); `RUNNER-AND-CRITICS.md` is the runner + vision-critic ladder (where/how it runs).
> THIS file is the *how we decide we're actually done, and how we track + budget getting there*.
> On any conflict: CONSTITUTION wins on philosophy, OPERATING-PRINCIPLES bind on safety, this governs procedure.

## Activation (global default)

- **Default disposition — drive every sensible prompt to FULL convergence.** For MOST prompts (whenever
  it makes sense), the job is to fully IMPLEMENT the entire ask in the project — every part of the
  prompt, every state, end to end, verified — not to hand back a plan, a partial slice, or "phase 1 of
  N" unless the work genuinely cannot finish in one pass (then checkpoint `CONVERGENCE.md` + say exactly
  what remains). A re-prompt on the same surface means the prior pass under-delivered. "Concise" is tight
  execution, never narrow scope. Begin substantial prompts with the gum/glow research expansion
  (`research-expansion-orchestration`) → synthesize Claude Code prompts → drive them to convergence here.
- This protocol is the DEFAULT for any substantial software request — a feature, a bug fix across
  files, hardening, "make it production-ready", a multi-step change, or an explicit `/run-the-loop`.
- **Trigger phrases auto-activate it** (no need to restate the convergence instructions): "build this",
  "improve this", "fix this application", "upgrade this repository", "run the loop", "make this
  production ready", "finish this", "make this real", "take this to convergence".
- **Do NOT apply** to trivial questions, explanations, or one-line reversible changes — it adds no value
  there. Scale depth to the work (a 2-file fix needs one light A→B→C pass, not a 7-agent fleet).
- Ordinary, reversible, authorized improvements proceed WITHOUT repeated approval. Preserve normal
  safeguards for destructive ops, billing, production data, secrets, and irreversible one-way doors.
- Resume, never restart: if `./.claude/run-the-loop/CONVERGENCE.md` has open state, continue from it.

## The loop: three convergence stages (A→B→C, then repeat until the exit criteria hold)

### Stage A — Research Convergence (typically 2–3 passes; stop when a pass finds nothing material)

1. Analyze the literal request AND the current repository (code, docs, tests, visible behavior).
2. Decide whether prompt expansion helps — extract the JOB behind the words, not just the words.
3. Research the real frontier: official/first-party docs (context7 + vendor), existing in-repo
   implementations, libraries, and competing products. Verify current facts — don't cargo-cult.
4. Delegate independent research to available agents (parallel `Agent`/workflow; Codex/OpenCode CLIs
   ONLY if actually installed — see Orchestration). Each returns a tight structured finding.
5. Generate high-value recommendations across dimensions: architecture, function, security, design,
   reliability, performance, cost, UX, a11y, data/migrations, observability, docs.
6. Recursively inspect the important dimensions + their sub-dimensions (don't stop at the top level).
7. Where useful, generate up to ~20 concrete improvement ideas for an important dimension.
8. Select the strongest ~30%, PLUS every mandatory gap-closing item (a P0 gap is never cut for being
   unglamorous). Discard the rest explicitly (record why in DISCOVERIES if non-obvious).
9. Merge compatible findings into ONE implementation specification (acceptance-criteria shaped).
10. Repeat A until another pass reveals no significant missing requirement (usually ≤3 passes).
    Then STOP researching — do not mine speculative ideas while implementation is unfinished.

### Stage B — Implementation Convergence

1. Convert the spec into actionable tasks, each with explicit, checkable ACCEPTANCE CRITERIA.
2. Classify every task P0 (correctness/security/core-journey) · P1 (important) · P2 (nice-to-have).
3. Fan out parallel specialized agents for GENUINELY independent workstreams (no conflicting file
   edits; worktree isolation when agents mutate in parallel). Never bare `general-purpose` when a
   specialist fits. Main thread integrates — it does not implement when saturated.
4. Implement in the REAL codebase (no stubs/placeholders presented as done; SIMULATED ≠ done).
5. Write + run tests — failing test FIRST for bugs (regression) and important behavior (TDD).
6. Run the ACTUAL application workflows end-to-end (real journeys, not mocked), on a live stack/prod.
7. Inspect UI screenshots + interactions for any visual/experience-sensitive change (vision critic).
8. Hunt bugs, security weaknesses, missing functionality, dead controls, and UX defects.
9. Fix them immediately (auto-integrate anything <2h with no design call; don't defer trivial fixes).
10. Incorporate improvements discovered mid-implementation when justified (SCOUT→orchestrator decides).
11. Repeat B until P0 tasks are implemented + their acceptance criteria pass on real execution.

Use any existing OpenSpec / requirements + task-tracking workflow in the repo where present.

### Stage C — Independent Verification Convergence (reviewers try to BREAK it, not bless it)

- Run a SEPARATE review with independent agents (not the ones that wrote the code), each told to
  discover failures. Evaluate, with evidence, across:
  functional completeness · security + authorization · architecture · reliability + recovery ·
  performance · cost efficiency · UI/UX quality · accessibility · automated test coverage ·
  actual user journeys · deployment readiness · documentation accuracy · technical debt + dead code.
- Convert every actionable finding into a tracked task (P0/P1/P2), fix it, and RERUN the relevant
  tests + journeys. A finding is closed only by fresh passing evidence, never by assertion.

## Convergence conditions (OBSERVABLE results — never an agent's confidence score)

Continue the A→B→C loop automatically until ALL hold:
- Zero unresolved P0 defects.
- Every mandatory acceptance criterion implemented AND verified by fresh evidence this run.
- Required tests pass (unit + integration + security + E2E that apply).
- No significant known security vulnerability remains.
- Important user journeys work end-to-end on the real stack (deploy + prod-E2E for web).
- No major visual or interaction defect remains (vision critic + human-simulator clean).
- **TWO consecutive independent review passes find no significant new issue and no justified
  high-priority improvement.** (One clean pass is not convergence.)

Convergence is proven by receipts (command output, screenshots, prod responses), not by a summary.

## Budgets & anti-stagnation (prevent infinite loops; never fake "done")

- Set sensible budgets up front: max iterations, a token/`budget.remaining()` ceiling, wall-clock.
  Expose them so they're tunable without code edits where the runner supports it.
- **Default budgets (the floor — raise per-invocation when the work clearly needs it, never silently remove):**
  - **Stage A:** ≤3 research passes; stop the moment a pass surfaces nothing material (do NOT mine
    speculative ideas while implementation is unfinished).
  - **Per invocation:** ≤5 full A→B→C iterations before a mandatory checkpoint to `CONVERGENCE.md`
    + a fresh session — the loop RESUMES from the record, it never restarts research the record answers.
  - **Concurrency:** ≤6 mutating agents at once (read-only sweeps uncapped); run larger fan-outs as
    sequential waves of ≤6 so parallel edits never collide.
  - **Token ceiling:** when `budget.remaining()` is set, CLOSE OUT the fire (checkpoint + ledger) at
    ~15% remaining rather than dying mid-task; inject the remaining budget into worker briefs.
  - **Stagnation breaker:** 2 consecutive iterations with no observable product delta (no P0 closed,
    no acceptance criterion newly passing, no journey newly green) ⇒ STOP and audit the process
    (premature polish, repeated research, duplicate agents, context pollution) before spending more.
- Inject remaining budget into worker briefs so a fire CLOSES OUT gracefully (checkpoint + ledger)
  instead of dying mid-task when a ceiling hits.
- Anti-stagnation circuit breaker (CONSTITUTION): enormous effort + little observable product
  progress ⇒ STOP and audit the process (premature polish, repeated research, duplicate agents,
  context pollution) before pouring more intelligence through it.
- When a budget is exhausted: preserve progress to `CONVERGENCE.md`, report EXACTLY what remains,
  and NEVER claim convergence that the receipts don't support. A degraded-but-honest "P0 done, P1
  partial, here's the gap" beats a false "converged".

## Persistent convergence tracking — `./.claude/run-the-loop/CONVERGENCE.md`

Maintain one compact, resumable record per repo (seeded from the `_templates/CONVERGENCE.md` scaffold).
It is the loop's memory between iterations and across sessions. Keep these sections current:
- **Requirements + acceptance criteria** (the merged spec, P0/P1/P2, each with a checkable AC).
- **Current iteration** (number + stage A/B/C + budget spent/remaining).
- **Implemented changes** (what landed this iteration, with file/commit refs).
- **Tests + evidence** (commands run + result; screenshots; prod responses — receipts, not claims).
- **Bugs discovered** / **Bugs fixed** (with the regression test that now guards each).
- **New recommendations adopted** / **Deferred recommendations** (+ the one-line cost/why for deferrals).
- **Blockers** (external creds/accounts/decisions — the exact missing prerequisite).
- **Remaining convergence gaps** (what still fails an exit condition).
Track MEASURABLE delta between iterations (P0 count, AC passed/total, journeys green, coverage).
Do not restart research when this record already answers the question.

## Agent orchestration

- Use the STRONGEST available agent for architecture + integration decisions; delegate routine,
  bounded work to cheaper available agents. Claude is the final integrator + reviewer.
- Parallelize genuinely independent tasks in ONE message; never let two agents edit the same file;
  use worktree isolation for parallel mutation. Fresh 150–300-word briefs; primary deliverable first.
- Independent verification where available — creator ≠ final judge for significant changes.
- **Never assume unavailable CLIs/accounts/credentials exist.** Probe first (`command -v codex`,
  `command -v opencode`, `get-secret <KEY>`); if absent, isolate the dependency cleanly, record the
  exact remaining step in `CONVERGENCE.md` § Blockers, and continue with what IS available. Never
  fake an integration to simulate completion.

## Relationship to the generic loop

The generic `/run-the-loop` wrapper (§1–§10 of `commands/run-the-loop.md`) is ONE fire of this
protocol: Orient+Fan-out = Stage A/B, Adversarial-review+Verify = Stage C, Reconcile = tracking
update. A repo's own `.claude/commands/run-the-loop.md` still wins (precedence contract). This file
makes the exit criteria, tracking, and budgets explicit and identical across every repo.
