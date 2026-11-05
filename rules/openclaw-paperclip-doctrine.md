# OpenClaw + Paperclip Unified Agent Fleet Doctrine

## 1. System Architecture

The Megabyte Labs autonomous fleet operates via a symbiotic integration between **Paperclip AI** (governance, issue tracking, org chart, budget policies, audit trail) and **OpenClaw Gateway** (execution engine, WebSocket session manager, tool orchestration).

- **Control Plane**: Paperclip AI runs as a user systemd service (`paperclipai.service`) on loopback port `3100`.
- **Execution Plane**: OpenClaw Gateway runs as a user systemd service (`openclaw-gateway.service`) on loopback port `18789`.
- **Adapter Binding**: Every fleet agent in Paperclip is configured with `adapter_type: "openclaw_gateway"`, connecting to `ws://127.0.0.1:18789` with `disableDeviceAuth: true`, `authToken`, and `sessionKeyStrategy: "issue"`.
- **Session Isolation**: Each task session maps to `agent:<agentId>:paperclip:issue:<issueId>`. This guarantees deterministic state persistence per issue and prevents cross-task context pollution.

## 2. Fleet Organization & Roles

1. **CEO (`ceo`)**: Fleet orchestration, strategic initiatives, company budget management, top-level issue decomposition, and board reporting.
2. **Architect (`architect`)**: Technical arbiter, API contract designer, cross-cutting PR reviews, and code quality gatekeeper. Reports to CEO.
3. **HR (`hr`)**: Fleet staffing, headcount manager, and swarm orchestrator. Decomposes tasks into atomic units and orchestrates concurrent subagent execution across the LiteLLM rotating DeepSeek pool. Reports to Architect.
4. **Full-Stack-Engineer (`fullstack`)**: Implementation of features across TypeScript, Next.js, Cloudflare Workers, PostgreSQL, and UI components. Reports to Architect.
5. **DevSecOps (`devsecops`)**: Security auditing (Grype, Trivy), secret hygiene, Docker/Coolify infrastructure, and Cloudflare deployment validation. Reports to Architect.
6. **QA-Verification (`qa`)**: Playwright E2E tests, Vitest test suites, adversarial review contracts, and regression prevention. Reports to Architect.
7. **Technical-Writer (`content`)**: Anti-slop technical documentation, RFC specifications, changelogs, and release communications. Reports to CEO.

## 3. Quota-Preservation & Routing Rules

OpenClaw's `fleet-cli` plugin routes tasks across model backends based on workload characteristics:
- **Routine Implementation / Swarms / Tests**: Routed to `fleet-cli/deepseek` (OpenCode + LiteLLM 4x DeepSeek rotation). Conserves paid subscription quotas.
- **Architectural Reasoning / Judgment**: Routed to `fleet-cli/codex` (OpenAI Codex CLI) or `fleet-cli/gemini` (Gemini Antigravity CLI) or `fleet-cli/claude`.
- **Failover**: When a subscription-backed account reaches weekly usage limits, the router dynamically transitions to secondary pool providers without interrupting active execution.

## 4. Operational Execution Protocol

When an agent is woken by Paperclip:
1. **Claim Task**: Check out the issue via `paperclipai issue checkout <issueId>`.
2. **Set In-Progress**: Transition status to `in_progress`.
3. **TDD RED->GREEN**: Write failing tests before modifying application code.
4. **Implement Cleanly**: Prefer TypeScript (Node 24 native strip-types) and Bash. Avoid Python unless strictly ML-bound.
5. **Verify**: Run full test suites and ensure zero console errors, clean typechecks, and passing builds.
6. **Complete & Review**: Commit changes with conventional commit syntax, open PR, and transition status to `in_review` or `done`.
