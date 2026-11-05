---
name: openspec-operating-contract
description: Universal OpenSpec governance for every task and every durable repository mutation across Claude, Codex, Gemini, OpenCode, and agentskills-compatible harnesses.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# OpenSpec Operating Contract

OpenSpec is the universal intake, planning, and evidence layer. **Every task** is classified against the resolved OpenSpec root before implementation begins.

## Classification

- **Durable repository change** — any add/edit/generate/move/delete affecting code, tests, documentation, prompts, skills, configuration, formatting, migrations, generated harness files, or other durable state MUST create or update an applicable OpenSpec change before implementation. “Trivial,” “mechanical,” “docs-only,” and “isolated config” are not bypasses.
- **Read-only work** — answers, explanations, reviews, diagnostics, and inspection that do not mutate durable state do not need a synthetic change. Record `OpenSpec: no-change (read-only)` in the work receipt.
- **Emergency restoration** — when delay would worsen an active incident, begin only the smallest reversible restoration needed, record the exception, and complete the retrospective OpenSpec change in the same work session.
- **Unavailable root/workflow** — if a durable mutation requires OpenSpec and the root cannot be resolved or initialized within current authority, report the exact blocker and do not silently bypass governance.

Before proposing, reconcile the request with existing `openspec/specs/` and `openspec/changes/`. Reuse or update the matching capability; do not create near-duplicates. Surface conflicts with durable truth inside the artifacts before implementation.

## Autonomous lifecycle

OpenSpec phases are evidence and quality controls, not mandatory conversational checkpoints. When the user's original request authorizes a completed outcome, continue autonomously through:

`explore → propose → review → apply → verify → sync → archive`

Do not stop merely because proposal artifacts are ready, and never ask routine “should I continue?” questions. Make and record reasonable assumptions from repository evidence, product goals, and durable preferences when choices are reversible. Incorporate adjacent high-value work that safely and verifiably serves the business, product, website, or application, updating the active change or creating a linked change as needed.

Pause only for an approval-required action, new external authority or spend, an irreversible business/legal/brand decision, a genuine blocker, or material ambiguity with divergent outcomes that evidence cannot resolve. Complete every decision-independent slice before surfacing the gated remainder.

When an applicable user, repository, change, or governance policy requires Figma, OpenSpec must reference the approved artifact before `apply`; proposal/design records its URL, node/version, approval evidence, responsive/state coverage and scope, and `verify` compares implementation with that revision. Otherwise, Figma is optional and OpenSpec records proportionate design evidence without inventing an approval dependency. See `[[figma-design-approval-gate]]`.

Initialize or refresh from the repository root with the currently installed harnesses:

```bash
openspec init --tools claude,codex,gemini,opencode,agents
```

Use the native generated commands/skills; do not duplicate or hand-edit them. A generated skill's phase boundary does not override explicit full-outcome authorization or this canonical autonomous-lifecycle contract; orchestrators may invoke the next native phase without returning control to the user.

Enable the expanded profile for complex work (`openspec config profile`, then `openspec update`). Treat `openspec/specs/` as durable truth and `openspec/changes/` as in-flight deltas. Every design must cover observable acceptance, security/permissions, telemetry, rollout, rollback and operational ownership when applicable. Run strict validation and verification before archive. After upgrading OpenSpec, run `openspec update` and review its diff.

## Explicit Architect-Role Mandate (frontier harnesses only; NEVER `opencode`)

- Only an agent **explicitly assigned the `architect` role for the change** may author or modify OpenSpec architectural artifacts (`proposal.md`, `design.md`, `tasks.md`, and `specs/<capability>/spec.md`). A model name, provider, harness, capability, or frontier label alone is insufficient authorization.
- The assigned architect must use **Claude Code (`claude`) with a fully-loaded, informative hydrated context**, **`codex`**, **`antigravity`**, or another expressly approved frontier harness. The orchestrator must make the role assignment before authorship begins; an implementation worker may not self-assign or infer it.
- **NEVER spell out the architectural, business-rule, or application details of an OpenSpec with `opencode` (DeepSeek).** Always prefer `claude` (with full hydrated context), `codex`, or `antigravity` to author OpenSpec artifacts. `opencode` is strictly reserved for bounded mechanical execution *after* the Frontier Architect has authored and locked the OpenSpec contract.
- Include both `> **Architect:** <frontier-harness>` and `> **Architect Role:** assigned` in `proposal.md` and `design.md`. The verifier rejects missing, inconsistent, worker-role, or OpenCode metadata. This attestation records the orchestrator's assignment; it does not permit self-authorization.

## Parallel Triad OpenSpec & Paperclip Registration Mandate

1. **Parallel End-of-Turn Triad (`agent-skills` + `install.doctor` + `theme.tools` + Touched Projects)**:
   - At the end of every prompt pass, infer reusable updates across `heymegabyte/agent-skills`, `heymegabyte/install.doctor`, and `heymegabyte/theme.tools` (`ui.theme.tools`) in parallel, plus any other touched project.
   - Save in-flight or follow-up work via OpenSpec (`openspec/changes/<change-id>/{proposal.md,design.md,tasks.md,specs/}`) in each respective repository.
2. **Mandatory Paperclip Issue Linkage**:
   - Every repository where an OpenSpec definition is added or updated MUST have a corresponding task/issue created or updated in its **Paperclip** project (`agent-skills`, `install.doctor`, `theme.tools`, `legion.megabyte.space`, etc.) containing a **direct deep link to the OpenSpec files** (via `~/.agentskills/bin/openspec-paperclip-sync.ts`, Paperclip MCP, or `paperclipai issue create`).
3. **Huge-Prompt Triage, Unfinished Sub-Features ("Give-Up" Boundary) & Recommendations**:
   - When a huge prompt arrives, finish programming everything possible in the current pass (Wave 1), and use `claude`, `codex`, or `antigravity` to author the OpenSpec for the remaining scope (Wave 2) and post it to Paperclip MCP/API.
   - Whenever an agent stops pursuing remaining sub-features ("gives up" due to context/budget) OR surfaces any recommendation or next step at the end of a prompt, it MUST write the OpenSpec change and file the linked Paperclip issue so Paperclip automatically tends to it. Cross-link: `[[total-convergence-and-openspec-handoff]]`.
