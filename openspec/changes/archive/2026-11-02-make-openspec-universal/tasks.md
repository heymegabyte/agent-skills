# Tasks

## 1. Contract and Regression Gate

- [x] 1.1 Add a failing universal-OpenSpec policy validator covering durable mutations, read-only classification, emergency capture, lifecycle separation, and forbidden trivial/material-only bypass language; verify the focused test fails against the current policy.
- [x] 1.2 Update `rules/openspec-operating-contract.md` to implement the `openspec-governance` requirements; verify the focused policy test passes and the rule remains router-valid.

## 2. Harness and Router Propagation

- [x] 2.1 Update `AGENTS.md`, `CODEX.md`, `CLAUDE.md`, and other canonical named harness entrypoints to reference universal OpenSpec classification; verify the policy validator finds equivalent coverage without duplicating the full rule.
- [x] 2.2 Update `_router.md` and router metadata so documentation, prompt, configuration, migration, code, and mechanical repository changes select the OpenSpec contract; verify representative `skill-router.py route` fixtures include `rules/openspec-operating-contract`.
- [x] 2.3 Refresh OpenSpec-owned generated commands and skills with `openspec update`, review the diff, and verify no unrelated dirty files were overwritten.

## 3. Repository Integration

- [x] 3.1 Add concise universal OpenSpec guidance to applicable project scaffolds/templates so new repositories inherit the policy; verify generated fixtures contain the canonical reference and no contradictory bypass.
- [x] 3.2 Reconcile existing documentation that says OpenSpec is only for material or non-trivial changes; verify repository search returns no active contradictory policy outside historical OpenSpec evidence.

## 4. Integrated Verification

- [x] 4.1 Run `openspec validate make-openspec-universal --strict` and all affected skill, router, package-closure, and policy validators; record exact passing commands and preserve unrelated worktree changes.
- [x] 4.2 Exercise representative classifications for code, tests, docs, prompts, config, formatting, read-only diagnosis, and active-incident restoration; verify durable mutations require a change and read-only work produces a no-change receipt.
- [x] 4.3 Run the repository convergence check twice and confirm no additional in-scope policy drift remains.

## Workflow follow-up

- Sync the verified delta into the main `openspec-governance` specification.
- Archive the change after implementation verification succeeds.
