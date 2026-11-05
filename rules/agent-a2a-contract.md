---
last_reviewed: 2026-11-05
superseded_by: null
name: "agent-a2a-contract"
priority: 1
pack: "ai"
triggers:
  - "a2a"
  - "handoff"
  - "inter-agent"
  - "sitrep"
paths:
  - "agents/**"
  - "docs/agents/**"
  - "schemas/a2a-handoff.schema.json"
---

# Agent-to-Agent (A2A) Contract & Communication Doctrine

Autonomous inter-agent communication strictly forbids unstructured, conversational ping-pong or loose prompt-passing. Loose natural-language handoffs cause context drift, forgotten requirements, and untraceable regressions.

## The A2A Handoff Standard

Every handoff between autonomous agents must conform to `schemas/a2a-handoff.schema.json`:
1. **Explicit Identity**: `sender` and `recipient` must include canonical role, call sign, and military rank.
2. **Mission Binding**: Handoffs carry an immutable `missionId` traceable in Langfuse and Paperclip.
3. **Machine-Verifiable Proof of Life**: Handoffs are rejected unless accompanied by proof of life (command, exit code `0`, and verification hash).
4. **Disjoint Artifact Delivery**: All transferred files and outputs are listed explicitly under `artifacts` with relative paths and descriptions.

## 9-Line NATO SITREP Ingestion

When reporting operational status to commanders (CEO, Architect, DevSecOps), agents emit the standardized 9-line SITREP via `bin/sitrep-logger.ts`:
- Line 1: Date-Time Group (DTG)
- Line 2: Unit and Call Sign
- Line 3: Combat Sector
- Line 4: Readiness (GREEN / AMBER / RED)
- Line 5: Commander's Intent
- Line 6: Tactical Action
- Line 7: Proof of Life
- Line 8: Casualty and Technical Debt
- Line 9: Next Waypoint
