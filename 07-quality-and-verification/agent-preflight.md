---
name: "agent-preflight"
version: "3.0.0"
updated: "2026-11-05"
description: "Deterministic pre-flight verification gate for all agents. Audits runtime health, git worktree status, profile validity, ROE rules of engagement, and doctrinal alignment before mission launch (bin/agent-preflight.ts)."
triggers:
  - "preflight"
  - "pre-flight"
  - "flight-check"
  - "inspect-environment"
  - "verify-agent"
---

# Agent Pre-Flight Verification Gate (`bin/agent-preflight.ts`)

This skill governs mandatory pre-flight inspection before an autonomous agent executes commands or modifies code in any repository.

## 1. Operating Doctrine

Under Auftragstaktik and RigorBench discipline, no agent may perform kinetic operations without verifying:
1. **Runtime Binary Availability**: Node 24+, npm, git, and workspace package managers must be functional.
2. **Profile & ROE Integrity**: The calling agent's canonical profile (`agents/<role>.md`) must exist, possess a valid call sign, and define explicit Rules of Engagement (GREEN, AMBER, RED).
3. **Workspace Tree Health**: The git working tree must be inspected to ensure changes are deliberate and disjoint from other agents.
4. **Command Execution Safety**: Disallowed tools or out-of-bounds operations must be halted before invocation.

## 2. Command Invocation

Run the deterministic pre-flight checklist:
```bash
node bin/agent-preflight.ts --agent <agent-role>
```

Example:
```bash
node bin/agent-preflight.ts --agent fullstack-engineer
```

## 3. Exit Gates

- **100% Passed (Exit Code 0)**: Proceed to Phase 1 (Reconnaissance) of the 4-phase kinetic loop.
- **Failures Detected (Exit Code 1)**: Halt immediately, emit pre-flight failure telemetry to `logs/sitrep-stream.jsonl`, and remediate environment issues before retrying.
