## Context

Use the remote canonical agent-skills kernel and existing provider wrappers. Provider binaries alone do not identify a usable route. The wrappers' native CLI arguments differ from the kernel's explicit task metadata protocol.

**Architect Role:** assigned

The user assigned the lead Codex agent the Architect role for the theme.tools audit and canonical local dispatch repair. The lead Codex agent owns this change.

## Goals / Non-Goals

Enable evidence-backed local repository development through the canonical kernel and preserve explicit approval for integration. Each run starts from a concrete queue of tasks.

## Decisions

Bind tasks to an immutable source revision, an isolated worktree, a literal acceptance command and owned paths. Translate dispatch metadata into provider-native arguments through the existing approved wrapper for each rail. Verify the launcher's provenance and isolation before invocation. Use the kernel's frozen evidence graph, ownership checks and serialized integration hook. Verify the resolved graph against its digest before admitting work and snapshot it for the duration of a run. Admit ready tasks in bounded waves at the explicitly verified concurrency limit. Canary work remains detached for independent review. Missing approved adapters, credentials or budget evidence block only the affected rail.

## Risks / Trade-offs

The existence of a CLI or worktree alone cannot attest provider isolation or successful execution. Only the source revision, real diff, acceptance result and independent review can support a canary pass. Keep any alternate provider out of the eligible set until its approved launcher and environment are configured.

The broker wrapper leaves global OpenCode configuration untouched. The local launcher supplies an explicit DeepSeek model and lets OpenCode resolve configuration using its native rules.
