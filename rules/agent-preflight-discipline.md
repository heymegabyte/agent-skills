---
last_reviewed: 2026-11-05
superseded_by: null
name: "agent-preflight-discipline"
priority: 1
pack: "ai"
triggers:
  - "preflight"
  - "agent-start"
  - "readiness"
paths:
  - "agents/**"
  - "bin/agent-preflight.ts"
---

# Agent Pre-Flight Checklist Discipline

No agent begins tactical execution without passing an automated pre-flight inspection. Blind execution without environment, workspace, and boundary verification causes silent failures, dirty git trees, and rate limit freezes.

## Mandatory Pre-Flight Gates (`bin/agent-preflight.ts`)

Before executing actions on behalf of a mission, every agent or runner must verify:
1. **Canonical Profile Health**: The agent's profile exists in `~/.agentskills/agents/<agent>.md` with valid YAML frontmatter and doctrinal sections.
2. **Runtime Engine**: The execution host runs a supported Node.js LTS/modern runtime (>= 22.0.0, 24+ preferred).
3. **Workspace Isolation**: The git working tree is inspected. If concurrent tasks are running, the agent MUST isolate its battle space into an ephemeral git worktree via `bin/worktree-sandbox.ts`.
4. **Doctrinal Alignment**: The agent is bound to explicit Commander's Intent, 3-tier Rules of Engagement (ROE), and machine-verifiable Definition of Done.
