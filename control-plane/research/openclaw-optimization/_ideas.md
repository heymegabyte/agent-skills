# OpenClaw × agent-skills: portfolio optimization review

Research and host observations: **2026-10-09**. **30 candidates; the highest-priority 9 implemented (30%).** This is an engineering priority ranking, not a claim of measured speed or token savings. Source selection favors official documentation and the actual current projects. Machine configuration and project history were inspected before changes.

## Main finding

The best near-term improvement is a thin, reliable orchestration layer around the official coding CLIs: small recovery packets, correct policy transport, truthful publication evidence, safe skill discovery and observable failure states. Another model layer, vector database or portfolio allocator would add cost before solving the failures already present. Simple interactive work can still go straight to Claude or Codex.

## Portfolio context

| Repository | Distinct integration needs |
| --- | --- |
| projectsites.dev | Generation API Worker, Angular administration, Remix editor: verify affected surfaces separately. |
| megabyte.space | Cloudflare control environment and upstream submodules: inspect release pins; cleanup is separate from publication. |
| gitl.ink | GitHub repository catalog and workflow controls: preserve GitHub as run authority. |
| deskl.ink | Electron main/renderer, SQLite and PTY: native toolchains; desktop input needs coordination. |
| bricklabor.com | Hono/Workers, React/Vite, booking/payments, D1/KV/R2, notifications: verify external effects rather than assuming success. |

These are observations from repositories, not guarantees about current production deployments. Scope guidance now prevents generic website requirements from overriding unrelated native or machine work.

## Ranked candidates

| Rank | Idea | Decision | Reason / delivered result |
| --- | --- | --- | --- |
| 1 | Secret-safe execution and public-log containment | **implemented** | Actions command-file/token variables removed before native execution; command contents private; four confirmed exposed log archives deleted. Rotation still required. |
| 2 | Honor the OpenClaw/native CLI instruction contract | **implemented** | Explicit system-prompt file transport; Claude appends its policy and Codex/OpenCode receive supplemental context while retaining native instructions. |
| 3 | Bound turn lifetime and reap runaway native descendants | **implemented** | Absolute turn deadline, bounded repository lease wait, process-group termination and expired-deadline rejection. Immediate cross-Gateway cancellation remains a limitation. |
| 4 | Small provenance-bearing recovery packets | **implemented** | Per-run context.json contains same-project recent receipts, retained paths, curated surfaces and lean runtime policy; bytes recorded. No blanket token-savings claim. |
| 5 | Evidence-based publication and truthful recovery semantics | **implemented** | Validate completion types/URLs/size, reject reported failing checks and non-descendant commits, retain submodule worktrees without false run failure. |
| 6 | Explicit provider choice with private, bounded telemetry | **implemented** | Manual codex/claude/deepseek selection, requested/observed route, adapter/wrapper revision and numeric usage; no ambiguous mutation retry. |
| 7 | Skill lifecycle validation, scope and synchronization | **implemented** | Focused OpenClaw skill, metadata/link doctor, owner-preserving synchronization across three Claude profiles and other runtimes; authoring/template files removed from runtime discovery. |
| 8 | Derived fleet health and repeat-failure diagnosis | **implemented** | Read-only GitHub/local health report, actual workflow state, recent successes/failure streaks, secret-availability boolean and failure fingerprints; no extra model/timer/issue spam. |
| 9 | Portfolio-aware onboarding and verification hints | **implemented** | Discover and onboard bricklabor.com; preserve existing runner-group approvals; curate project surfaces and verification hints for all five; pin obvious callers on main. |
| 10 | Repository-scoped retrieval with scored excerpts | **deferred** | Deferred: current packets already bound initial recovery; measure retrieval misses first. |
| 11 | Rehydrate local memory from retained GitHub artifacts | **deferred** | Deferred: machine bootstrap and git suffice today; artifact retention is only 90 days. |
| 12 | A single-controller Cua desktop lease | **deferred** | Deferred: document one-controller convention; no evidence of concurrent GUI jobs yet. |
| 13 | Deterministic per-surface verification registry | **deferred** | Deferred: hints implemented first; test commands need validation within each product before automation. |
| 14 | Cross-project dependency and deployment graph | **deferred** | Deferred: discovered stacks are not sufficient evidence of actual dependency edges. |
| 15 | Independent review only for high-impact changes | **deferred** | Deferred: avoid mandatory reviewer cost for every fifteen-minute turn. |
| 16 | Account headroom and reset UI | **deferred** | Deferred: preserve unknown/stale states; avoid undocumented subscription APIs. |
| 17 | A context-quality A/B evaluation corpus | **deferred** | Deferred: regression contracts added now; representative multi-project trials need a baseline dataset. |
| 18 | Compatibility canaries before automatic runtime upgrades | **deferred** | Deferred: installed runtime integration is verified now; automatic upgrade service adds another failure surface. |
| 19 | Native session resume with provenance checks | **deferred** | Deferred: current backend deliberately uses fresh sessions and durable files; unsafe resume could mix worktrees. |
| 20 | Provider-assisted credential rotation | **deferred** | Deferred and required follow-up: needs each provider account; do not automate unverified destructive rotation. |
| 21 | Proxmox full-disk backups and guest-agent verification | **deferred** | Deferred: host-level backup policy requires Proxmox access; machine README makes limits explicit. |
| 22 | Signed skill releases and dependency attestations | **deferred** | Deferred: SHA-pinned workflow callers plus trusted git source are sufficient current boundary. |
| 23 | Control UI search over canonical run artifacts | **deferred** | Deferred: user excluded website publishing; current local UI remains operational. |
| 24 | Event-driven targeted turns alongside cadence | **deferred** | Deferred: user explicitly wants one turn for every enabled repository on each tick. |
| 25 | Global token/headroom portfolio allocation | **deferred** | Deferred: user explicitly ruled out sophisticated slot allocation for now. |
| 26 | Cloudflare AI Search / vector memory | **deferred** | Deferred: no measured need beyond local file/FTS search; no new Cloudflare assets. |
| 27 | Per-job tenant containers and separate OS users | **deferred** | Deferred: this is an explicitly trusted-owner persistent desktop; full isolation is a larger redesign. |
| 28 | Learn reusable skill improvements from accepted run outcomes | **deferred** | Deferred: avoid treating agent self-reports as training truth; gather verified examples first. |
| 29 | Race multiple native providers for each coding task | **rejected** | Rejected for routine mutating turns: duplicate costs and conflicting edits outweigh unproven benefit. |
| 30 | Autonomous payment/marketing production mutations | **rejected** | Rejected for this setup task: real payments, messages and campaign changes need specific authorized product flows. |

## Evidence for the selected 30%

### 1. Secret-safe execution and public-log containment

Critical observed leak outranks speculative optimizations. Actions command-file/token variables removed before native execution; command contents private; four confirmed exposed log archives deleted. Rotation still required.

Implementation: `control-plane/run_context.py`, `control-plane/openclaw-fleet/cli.py`.

Primary references: [GitHub workflow commands and masking](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#masking-a-value-in-a-log), [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use), [OpenClaw security](https://docs.openclaw.ai/gateway/security).

### 2. Honor the OpenClaw/native CLI instruction contract

Configured skills are of little use if policy never reaches the worker. Explicit system-prompt file transport; Claude appends its policy and Codex/OpenCode receive supplemental context while retaining native instructions.

Implementation: `control-plane/openclaw-fleet/index.js`, `control-plane/openclaw-fleet/cli.py`.

Primary references: [OpenClaw CLI backend plugin contract](https://docs.openclaw.ai/plugins/cli-backend-plugins), [OpenClaw CLI backends](https://docs.openclaw.ai/gateway/cli-backends), [Claude Code best practices](https://code.claude.com/docs/en/best-practices).

### 3. Bound turn lifetime and reap runaway native descendants

Gateway/client cancellation does not necessarily cancel a remote child. Absolute turn deadline, bounded repository lease wait, process-group termination and expired-deadline rejection. Immediate cross-Gateway cancellation remains a limitation.

Implementation: `control-plane/fleet.py`, `control-plane/openclaw-fleet/cli.py`.

Primary references: [OpenClaw CLI backend plugin contract](https://docs.openclaw.ai/plugins/cli-backend-plugins), [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use).

### 4. Small provenance-bearing recovery packets

Recovery should inspect a few relevant facts before opening large histories. Per-run context.json contains same-project recent receipts, retained paths, curated surfaces and lean runtime policy; bytes recorded. No blanket token-savings claim.

Implementation: `control-plane/run_context.py`, `control-plane/RUNTIME.md`.

Primary references: [OpenClaw context](https://docs.openclaw.ai/concepts/context), [OpenClaw memory](https://docs.openclaw.ai/concepts/memory), [OpenAI: rethinking skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra).

### 5. Evidence-based publication and truthful recovery semantics

Repeated submodule cleanup failures and unchecked report types were real defects. Validate completion types/URLs/size, reject reported failing checks and non-descendant commits, retain submodule worktrees without false run failure.

Implementation: `control-plane/fleet.py`, `control-plane/run_context.py`, `control-plane/tests/test_fleet.py`.

Primary references: [Claude Code best practices](https://code.claude.com/docs/en/best-practices), [OpenAI: testing skills with evals](https://developers.openai.com/blog/eval-skills).

### 6. Explicit provider choice with private, bounded telemetry

Operators need route evidence without exposing shell contents or guessing headroom. Manual codex/claude/deepseek selection, requested/observed route, adapter/wrapper revision and numeric usage; no ambiguous mutation retry.

Implementation: `.github/workflows/run-the-loop.yml`, `control-plane/update-callers.py`, `control-plane/openclaw-fleet/cli.py`.

Primary references: [The actual Claw Router project](https://github.com/dennisonbertram/claw-router), [OpenCode configuration](https://opencode.ai/docs/config/), [OpenClaw CLI backend plugin contract](https://docs.openclaw.ai/plugins/cli-backend-plugins).

### 7. Skill lifecycle validation, scope and synchronization

New skills were not consistently linked and authoring material was discoverable as runtime skills. Focused OpenClaw skill, metadata/link doctor, owner-preserving synchronization across three Claude profiles and other runtimes; authoring/template files removed from runtime discovery.

Implementation: `control-plane/skills-doctor.py`, `control-plane/skill_links.py`, `openclaw-integration/SKILL.md`, `spec/AUTHORING.md`.

Primary references: [Agent Skills specification](https://agentskills.io/specification), [OpenClaw skills](https://docs.openclaw.ai/tools/skills), [Claude Code skills](https://code.claude.com/docs/en/skills).

### 8. Derived fleet health and repeat-failure diagnosis

A healthy daemon is not proof that projects are making progress. Read-only GitHub/local health report, actual workflow state, recent successes/failure streaks, secret-availability boolean and failure fingerprints; no extra model/timer/issue spam.

Implementation: `control-plane/portfolio-health.py`, `control-plane/fleet.py`.

Primary references: [OpenClaw health checks](https://docs.openclaw.ai/gateway/health), [GitHub workflow schedule events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [GitHub workflow logs](https://docs.github.com/en/actions/how-tos/monitor-workflows/use-workflow-run-logs).

### 9. Portfolio-aware onboarding and verification hints

The fifth project exists, and these repositories do not share one application shape. Discover and onboard bricklabor.com; preserve existing runner-group approvals; curate project surfaces and verification hints for all five; pin obvious callers on main.

Implementation: `control-plane/fleet.json`, `machines/ubuntu-proxmox-primary.md`, `control-plane/update-callers.py`.

Primary references: [GitHub runner-group REST API](https://docs.github.com/en/enterprise-cloud%40latest/rest/actions/self-hosted-runner-groups), [Claude Code best practices](https://code.claude.com/docs/en/best-practices), [GitHub workflow schedule events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Validation and operational limits

- Real-git tests cover concurrent repositories, same-repository leases, owner edits, failed-turn retention, normal publication and submodule cleanup behavior.
- Fake-provider integration tests exercise policy transport, stdin, error events, expired deadlines, process-group cleanup and Actions environment filtering. These prove adapter contracts, not provider availability.
- Metadata tests cover malformed manifests, links, cycles, precedence and safe account-registry inspection. Live OpenClaw skills eligibility is checked separately.
- Workflow shell blocks are parsed with bash; callers use matching immutable workflow/implementation SHAs.
- Live read-only Gateway probes validate Codex and Claude tool execution. DeepSeek cannot be live-verified until its key is supplied. See VALIDATION.md for rollout results.
- CLI deadlines remain enforced, but immediate cancellation from Actions through the Gateway is not guaranteed. Environment filtering is hygiene, not an OS security boundary.
- Shared global skills remain mutable via trusted git synchronization; workflow/code pins and adapter revision telemetry expose the relevant versions.
- Test/deployment statements in completion reports remain agent-reported. Validation checks structure and explicit failure; it does not prove a passing test actually ran.
- The public-log incident requires credential rotation. Deleted archives reduce exposure; they do not revoke credentials or guarantee prior copies are gone.
- No website was published and no Cloudflare resource was created. GitHub owns cadence/history; files and git own durable memory.

## Source register

- [OpenClaw skills](https://docs.openclaw.ai/tools/skills) — Skill discovery, eligibility, precedence and catalog overhead.
- [OpenClaw CLI backend plugin contract](https://docs.openclaw.ai/plugins/cli-backend-plugins) — Explicit system prompt transport and backend launch/session configuration.
- [OpenClaw CLI backends](https://docs.openclaw.ai/gateway/cli-backends) — CLI integration differs from ACP; tool bridges require explicit configuration.
- [OpenClaw context](https://docs.openclaw.ai/concepts/context) — Context includes instructions, skill catalog and workspace material.
- [OpenClaw session pruning](https://docs.openclaw.ai/concepts/session-pruning) — Pruning is runtime-specific; it does not prove native CLI token savings.
- [OpenClaw compaction](https://docs.openclaw.ai/concepts/compaction) — Compaction is distinct from durable file memory.
- [OpenClaw security](https://docs.openclaw.ai/gateway/security) — Trusted boundaries and native execution permissions need explicit review.
- [OpenClaw memory](https://docs.openclaw.ai/concepts/memory) — File-backed memory and derived retrieval have distinct responsibilities.
- [OpenClaw automation](https://docs.openclaw.ai/automation/cron-jobs) — Product automation exists; this fleet deliberately keeps recurring schedules in GitHub.
- [OpenClaw health checks](https://docs.openclaw.ai/gateway/health) — Health checks establish observed service state.
- [Claude Code best practices](https://code.claude.com/docs/en/best-practices) — Focused context and observable verification improve coding workflows.
- [Claude Code hooks](https://code.claude.com/docs/en/hooks) — Deterministic hooks can run checks without a model round trip.
- [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) — Subagents have separate contexts and require deliberate handoffs.
- [Claude Code skills](https://code.claude.com/docs/en/skills) — Skills are discovered from metadata and expanded when used.
- [Claude Code setup](https://code.claude.com/docs/en/setup) — Official CLI installation and authentication remain authoritative.
- [Agent Skills specification](https://agentskills.io/specification) — Required name/description metadata and progressive disclosure.
- [The actual Claw Router project](https://github.com/dennisonbertram/claw-router) — Official Claude/Codex account routing; not a hosted API gateway.
- [OpenCode configuration](https://opencode.ai/docs/config/) — Direct provider configuration and environment substitution.
- [OpenCode run implementation](https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/opencode/src/cli/cmd/run.ts) — Current run command handles stdin; verified in installed adapter tests.
- [Codex authentication](https://developers.openai.com/codex/auth/) — Official authentication is preserved; no consumer session conversion.
- [OpenAI: rethinking skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra) — Recent guidance favors concise instructions and progressive disclosure.
- [OpenAI: testing skills with evals](https://developers.openai.com/blog/eval-skills) — Structured CLI events support deterministic behavioral checks.
- [GitHub workflow schedule events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) — Scheduled runs can be delayed; cadence is not a hard real-time guarantee.
- [GitHub workflow logs](https://docs.github.com/en/actions/how-tos/monitor-workflows/use-workflow-run-logs) — Run logs can be inspected and deleted when necessary.
- [GitHub workflow commands and masking](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands#masking-a-value-in-a-log) — Sensitive values require protection before use; command files affect later steps.
- [GitHub Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use) — Persistent self-hosted execution requires trusted code and careful credential handling.
- [GitHub runner-group REST API](https://docs.github.com/en/enterprise-cloud%40latest/rest/actions/self-hosted-runner-groups) — Add one repository without replacing existing runner approvals.
- [GitHub runner minimum-version timeline](https://github.blog/changelog/2026-06-12-github-actions-minimum-version-enforcement-timeline-for-self-hosted-runners/) — Runner compatibility is an operational concern; avoid blind runtime upgrades.

All recommendations beyond explicit documentation contracts are our inferences from source guidance and local observations. The structured [_evidence.json](_evidence.json) maps every candidate to primary references, selection status, implementation paths and confidence limits. No raw transcripts, credential values or private business records are included.
