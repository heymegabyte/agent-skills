# Design

**Architect Role:** assigned

## Context

See `proposal.md` for motivation and the capability deltas for observable behavior. Current evidence shows three distinct states that must not be conflated: the edit checkout is ahead of and behind remote main with a large dirty tree; `~/.agentskills` resolves to a separate divergent plugin checkout; and Codex, Claude, Gemini, and OpenCode global instruction files differ from both. Existing hydration, evidence, state-machine, conference, and swarm primitives pass controlled tests, but Claude alone has a native prompt hook and the composition root hard-requires three model families.

## Goals / Non-Goals

**Goals:**

- Make the compact policy canonical, generated, installable, digest-addressed, and demonstrably loaded by coordinators and workers.
- Compose existing hydrator, research, OpenSpec, swarm, state, and Git primitives into one proportional workflow rather than adding another parallel framework.
- Preserve the preferred small complementary architecture conference while allowing honest sequential fallback.
- Extend durable state and evidence through dispatch, integration, Git, packages, consumers, production, learning, and improvement convergence.
- Reconcile and push only coherent tested task-related changes while preserving unrelated dirty work.

**Non-Goals:**

- Treat repository prose as provider-controlled system instruction or claim unsupported native hooks.
- Require every quality dimension, agent family, or improvement for every narrow task.
- Use OpenCode as an OpenSpec architect or silently substitute paid model APIs for subscription/brokered rails.
- Force-push, blanket-stage, publish secrets, create privileged credentials, or invent production/payment/external-communication authority.

## Decisions

### 1. Canonical policy is a versioned source plus generated managed blocks

Add a compact canonical policy document containing the user-supplied core verbatim, a policy ID/version, and links to procedural skills. A generator writes only delimited managed blocks into repository entry files, manifests, fleet profiles, and selected global targets. The generator preserves all content outside its block, supports check/install modes, and records source revision and digest.

Alternatives rejected: manual copies drift; replacing entire instruction files destroys user-owned guidance; relying on the installed symlink makes the source ambiguous.

### 2. Installation selects an explicit checkout and revision

Fleet sync and publish tooling accept a source root and expected revision. Installation fails when the source is dirty outside the intended patch, the active symlink points to a divergent tree, or an output contains a different managed digest. Global installation uses supported files and plugin mechanisms; provider-controlled instructions remain out of scope.

Alternatives rejected: copying from `~/.agentskills` implicitly, because it currently points at a stale separate checkout.

### 3. Prompt Hydration composes existing evidence primitives proportionally

Extend the current prompt hydrator to emit a sparse coverage matrix, assumption ledger, intended-outcome criteria, and applicability decisions for every engineering request. Focused changes still perform context, impact, verification, and improvement review; material changes additionally require applicable journey, state, quality, dependency, reusable-owner, migration, operational, and cost coverage. RepoMix remains selective and evidence is never interpreted as instruction.

Alternatives rejected: whole-repository ingestion, fixed matrices, and a second hydrator runtime.

### 4. Conference responsibilities are fixed; provider count is not

Codex leads two independent responsibilities: product/completeness and architecture/verification. Use separate agents and frontier families when available and beneficial. When capacity is lower, combine roles or run sequential passes with receipts identifying actual independence and model provenance. Security/auth/payment/destructive changes still require the configured additional review or record a blocker when risk cannot be covered.

Alternatives rejected: unconditional three-family gating, which contradicts the required one-provider fixture; unlabelled self-review, which fabricates independence.

### 5. OpenSpec compiler emits typed traceability and domain inventories

Extend the compiler and schemas so each requirement ID maps to scenarios and tasks with owner, dependencies, affected paths/packages, acceptance criteria, and expected evidence. Execution appends code paths, verification receipt IDs, integrated commit, remote result, and applicable release/consumer/production receipts. MCP catalog compilation also emits an inventory record for every selected MCP covering provenance, metadata, transport, installation, authentication, update behavior, listing/connection/execution status, tasks, and verification.

Alternatives rejected: checkboxes as completion proof and free-form trace tables without schema validation.

### 6. Durable execution adds leases, idempotency, and recursion guards

Add stable dispatch IDs, a renewable per-repository integration-writer lease, atomic checkpoints, maintenance trigger identities, and recursion depth to the existing run-state schema. Resumption validates digests, reuses completed receipts, recovers expired leases under policy, and launches only unfinished ready work. Shared-file changes, schemas, lockfiles, releases, and final integration remain centrally owned.

Alternatives rejected: process-local locks and conversational state, neither of which survives interruption.

### 7. Recursive improvement is a persisted workflow phase

After current-request requirements close, score candidates by evidence, value, novelty, reversibility, authority, cost, and verification. Qualifying work becomes new traced requirements and tasks. A no-winner round refreshes applicable evidence; two consecutive refreshed no-winner rounds establish convergence. Maintenance and learning run alongside verification but cannot recursively trigger equivalent work.

Alternatives rejected: a pure suggestion scorer, a fixed number of rounds, or “implement everything plausible.”

### 8. theme.tools propagation is a dependency chain, not a source suggestion

Use the existing mapping/catalog before creating reusable code. A shared change closes only after theme.tools validation, main commit/push, approved release, published-version verification, intended consumer and lockfile update, consumer verification, and consumer commit/push. Controlled local registry fixtures prove the mechanics without falsely claiming a live release.

Alternatives rejected: committing shared source as proof of adoption and copying reusable code into consumers.

### 9. Git integration happens from a clean reconciliation worktree

Inventory dirty edits by provenance and preserve them. Fetch remote main, create a clean integration worktree, replay only verified task-related commits or patches, rerun invalidated checks, and push normally. The authoritative record binds tests to the exact integrated tree and verifies remote SHA plus applicable CI. Conflicts with unidentified user changes remain precise blockers.

Alternatives rejected: rebasing the dirty checkout in place, blanket staging, force-push, or pushing a tree different from the tested tree.

### 10. Evaluations distinguish simulations from installed and live proof

Add controlled scenarios for MCP catalog coverage, local package-to-consumer propagation, single-agent fallback, narrow fixes, scoped preference correction, interruption/resume, duplicate dispatch, competing writers, blocked releases, publish generation, and fresh coordinator-worker loading. Approved wrappers provide live policy probes where available; unavailable native hooks use explicit CLI fixtures and honest capability records.

Alternatives rejected: regex-only doctrine tests and fake adapters as evidence of live installation.

## Risks / Trade-offs

- **[Risk] Dirty divergent repositories hide ownership** → inventory by path and commit, integrate from a clean worktree, never blanket-stage.
- **[Risk] Managed blocks still overwrite user content** → byte-preservation tests around exact delimiters and fail on malformed or duplicate blocks.
- **[Risk] Single-agent fallback lowers review quality** → record actual independence, scale verification/risk gates, and block only when residual risk is unacceptable.
- **[Risk] Full traces become bookkeeping-heavy** → derive edges automatically from compiler, Git, test, registry, and deployment receipts.
- **[Risk] Improvement loops never terminate** → two refreshed no-winner rounds, budgets, authority, and objective-value thresholds are machine checked.
- **[Risk] Live provider probes consume quota** → keep probes bounded, use subscription/brokered routes, cache fresh receipts, and retain deterministic simulator coverage.
- **[Risk] Multi-repository releases cannot complete** → preserve exact pending source/version/consumer edges and never claim dependency closure.

## Migration Plan

1. Inventory and classify the current dirty trees, remote divergence, installed plugin, global instructions, and existing generated surfaces.
2. Add schemas and red-first behavioral fixtures for policy distribution, fallback, traceability, resumability, Git, and package consumers.
3. Implement canonical policy generation and publish/fleet drift prevention; regenerate repository outputs.
4. Extend hydration, conference fallback, compiler traces, leases, idempotency, checkpoints, and improvement phases.
5. Install from an explicit reconciled revision and run coordinator-worker and approved-wrapper probes.
6. Execute MCP, theme.tools, narrow-fix, correction, interruption, writer-contention, and blocked-release fixtures.
7. Reconcile each repository onto current main in clean integration worktrees, run required validation, push coherent commits, and verify remote/CI.
8. Sync and archive OpenSpec only after every trace edge and external dependency is proven or precisely blocked.

Rollback reverts canonical/runtime/schema changes as coherent commits, regenerates managed consumers from the prior verified policy version, and restores the last verified installed bundle. Run records and worktrees remain preserved for audit.
