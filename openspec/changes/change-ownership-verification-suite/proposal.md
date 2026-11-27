# Proposal: Change-Ownership Verification Suite

> **Architect:** claude (hydrated frontier context — non-OpenCode spec)
> **Status:** Proposed — not yet owned.

## Why / Problem
§7 of the directive requires RUNTIME verification (not just static validation) of the whole workflow:
the invariant loads per agent, decomposition happens before implementation, one-owner holds, duplicate-claim
is blocked, a mid-task recommendation becomes a real proposal, an unrelated recommendation stays proposed,
compaction/resume/handoff preserve state, artifacts validate, and the installer/sync is idempotent.

## Evidence / Assumptions
- The repo has validators (`bin/lint-all.sh`, router reconcile, `openspec validate`). A disposable-fixture
  harness is the missing piece. Assumption: fixtures can be small + offline; checks that need the real agent
  runtime (e.g. "fresh-session loads the invariant" per agent) are reported as runtime-limited where a harness
  cannot drive them.

## Proposed Improvement
Add `bin/verify-change-ownership.sh` (or `.ts`) running small disposable fixtures + existing validators for
each §7 check; distinguish static validation from runtime verification; report unavailable
tools/credentials/permissions specifically; add an installer/sync idempotency check (run twice → no duplicate
instructions/skills/hook handlers).

## Expected Benefit
Objective, repeatable proof the philosophy actually holds at runtime, not just on paper.

## Scope / Priority / Dependencies
Scope: verification harness + idempotency check. Priority: medium-high. Dependencies: the three changes above
(it verifies them).

## Acceptance
The harness runs green for the implementable checks; runtime-only checks are reported with the exact
limitation; installer/sync re-run is proven duplicate-free.
