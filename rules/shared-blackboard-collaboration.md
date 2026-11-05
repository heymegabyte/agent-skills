---
last_reviewed: 2026-11-05
superseded_by: null
name: "shared-blackboard-collaboration"
priority: 2
pack: "ai"
triggers:
  - "blackboard"
  - "shared-memory"
  - "peer-discovery"
paths:
  - "bin/fleet-blackboard.ts"
  - "logs/fleet-blackboard.json"
---

# Shared Fleet Blackboard Collaboration

Agents operating in disjoint battle spaces require a lightweight, decoupled mechanism to share operational discoveries, locked contract schemas, and cached environment parameters.

## The Fleet Blackboard Standard (`bin/fleet-blackboard.ts`)

1. **Publish Upon Discovery**: Whenever an agent discovers a stable API endpoint, locks an OpenAPI contract, or computes expensive environment parameters, it posts the record to the shared blackboard.
2. **Read Before Probe**: Subordinate agents query the blackboard before probing the environment or making redundant external API calls.
3. **Immutability & TTLs**: Critical architectural contracts are published without TTL (permanent for mission lifecycle); transient tokens or cache keys are tagged with strict TTL expiration.
4. **Attribution**: Every blackboard entry records `author`, `callSign`, and `updatedAt` for total operational auditability.
