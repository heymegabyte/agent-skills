# Design

## Context

See `proposal.md` for motivation. The repository already has OpenSpec 1.15.0, a tier-1 operating rule, generated opsx workflows for multiple harnesses, and two archived example changes. The current contract and top-level entrypoints still scope OpenSpec to “material” or “non-trivial” work, allowing inconsistent bypasses. The worktree also contains substantial concurrent changes, so application must be surgical and preserve unrelated edits.

## Goals / Non-Goals

**Goals:**

- Establish one canonical universal policy with precise durable-change and read-only classifications.
- Propagate equivalent language through human-facing agent entrypoints and generated harness surfaces.
- Add deterministic validation that detects contradictory bypass language and missing coverage.
- Preserve native OpenSpec-generated commands and lifecycle boundaries.

**Non-Goals:**

- Replacing OpenSpec with a custom planning system.
- Creating an OpenSpec change for read-only questions or diagnostics.
- Weakening Figma approval, security, deployment, provider, or authorization rules.
- Reformatting or regenerating unrelated dirty files.

## Decisions

### Use durable mutation as the planning boundary

Any repository mutation requires an OpenSpec change, regardless of perceived size. Read-only work receives a no-change receipt instead of a synthetic change. This is clearer and more testable than subjective “material” or “non-trivial” thresholds.

Alternative considered: retain a trivial-change exception. Rejected because it recreates the ambiguity the user explicitly asked to remove.

### Keep a single canonical rule and thin entrypoint references

`rules/openspec-operating-contract.md` remains the source of truth. `AGENTS.md`, `CODEX.md`, `CLAUDE.md`, other named harness instructions, and router descriptions reference that rule using concise equivalent language. Generated opsx skills remain owned by `openspec update`, not hand-edited.

Alternative considered: duplicate the full policy into every harness file. Rejected because copies drift and inflate context.

### Validate policy semantics, not exact prose

A repository validator will assert required concepts and reject known bypass phrases such as “material changes only” or direct implementation of trivial documentation/configuration fixes. Existing package validation will run alongside OpenSpec strict validation.

Alternative considered: snapshot every generated file. Rejected because snapshots are brittle across legitimate OpenSpec upgrades.

### Preserve a narrow incident exception

Only active restoration work whose delay worsens impact can precede completed artifacts. The same session must capture the exception and resulting behavior. This preserves incident safety without creating a general urgency bypass.

Alternative considered: no exception. Rejected because planning latency must not extend an active outage.

### Treat lifecycle phases as controls, not conversational checkpoints

The proposal/apply/verify/sync/archive boundaries preserve evidence and validation, but they do not require separate user turns when the original request authorizes the completed outcome. Agents move between phases autonomously, record reversible assumptions, and stop only for the existing approval-required or blocked taxonomy.

Alternative considered: require a new user instruction between every phase. Rejected because it conflicts with the standing autonomy mandate and turns governance into avoidable latency.

## Risks / Trade-offs

- **[Planning overhead for tiny edits]** → Keep artifacts concise, reuse/update an existing change when scope matches, and use explicit no-change receipts for read-only work.
- **[Agents create low-value duplicate capabilities]** → Require existing-spec and in-flight-change reconciliation before proposal creation.
- **[Generated harness drift]** → Update canonical inputs, run `openspec update`, and validate all supported entrypoints.
- **[Concurrent worktree overlap]** → Inspect diffs before each edit, patch only owned lines, and stop on overlapping semantic conflicts.
- **[Emergency exception becomes a loophole]** → Limit it to active restoration and require same-session retrospective artifacts.

## Migration Plan

1. Add a failing policy validator covering universal classification, mutation coverage, lifecycle boundaries, and forbidden bypass language.
2. Tighten the canonical OpenSpec operating contract.
3. Update the router and top-level harness entrypoints to reference the universal rule.
4. Refresh native OpenSpec-generated integrations with `openspec update`; review the diff and avoid unrelated regeneration.
5. Run strict OpenSpec validation, skill/router validators, package tests, and targeted policy checks.
6. Verify representative routing for code, docs, config, prompt, read-only, and incident-restoration tasks.
7. Sync and archive the change only after verification evidence is recorded.

Rollback: revert only the files owned by this change and retain the prior OpenSpec artifacts as an audit record. Do not reset the dirty repository or discard concurrent work.
