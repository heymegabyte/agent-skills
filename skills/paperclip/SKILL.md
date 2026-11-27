---
name: paperclip
description: "Paperclip AI Control Plane (swarml.ink) governance, sub-task decomposition, Reviewers/Approvers/Monitor/Watchdog fields, Parent/Blocking/Blocked-by graph relations, Decisions contract (clarifying questions, recommendations & scope expansions only), and trunk-based main PR auto-merge + production deployment."
triggers: ["paperclip", "swarml.ink", "MEG-", "sub-tasks", "decisions", "watchdog", "monitor"]
version: "2.0.0"
---

# Paperclip (`swarml.ink`) Operating & Governance Skill

Canonical operating instructions for interacting with the **Paperclip AI Control Plane** (`https://swarml.ink`, loopback `http://127.0.0.1:3100` on `ubuntu.megabyte.space`, Company ID `72408921-0094-4ffb-b4f4-f24db9026191`).

---

## 1. Use Sub-Tasks (`parent_id` / `parentId`) Whenever Appropriate

Whenever an issue represents an epic, multi-package initiative, cross-repository triad sync (`agent-skills` + `install.doctor` + `theme.tools`), or multi-stage workflow:

1. **Create Child Sub-Tasks (`parentId` / `parent_id`)**:
   - Decompose the parent issue into focused child sub-tasks via `POST /api/companies/{companyId}/issues` with `"parentId": "{parentIssueId}"` (or `parent_id` in PostgreSQL).
   - Assign each child sub-task to the best-fit specialist agent from the 29-agent paramilitary roster (`Full-Stack-Engineer`, `Backend-Engineer`, `Database-Engineer`, `DevSecOps`, `UI-Designer`, `QA-Verification`, `AppSec`, `A11y-Auditor`, `SEO-Auditor`, `Release-Manager`, etc.).
2. **Automatic Parent Wakeup**:
   - When all direct child sub-tasks reach a terminal state (`done` / `cancelled`), Paperclip automatically fires `PAPERCLIP_WAKE_REASON=issue_children_completed` to wake the parent issue's assignee for final integration and closure.

---

## 2. Leverage "Parent", "Blocking", and "Blocked by" Relations Whenever Appropriate

Structure is expressed with **Parent** (`parent_id`), while execution ordering is enforced with **Blocking** (`blocks`) and **Blocked by** (`blockedBy` / `blockedByIssueIds`, stored in `issue_relations` with `type = 'blocks'`):

1. **Parent (`parentId` / `parent_id`)**:
   - Links a sub-task to its parent epic/initiative so work products, rollup progress, and `issue_children_completed` wakes stay unified.
2. **Blocked by (`blockedByIssueIds` / `blockedBy`) & Blocking (`blocks`)**:
   - Whenever Issue B depends on Issue A finishing first (e.g., schema/contract lock before implementation, shared `@theme.tools/*` library before consumer site integration, or implementation before QA/release), set `"blockedByIssueIds": ["{issueAId}"]` on Issue B.
   - Setting `blockedByIssueIds` on Issue B automatically populates both **Blocked by** on Issue B and **Blocking** on Issue A.
   - When all `blockedBy` issues reach `done`, Paperclip automatically wakes the dependent issue's assignee with `PAPERCLIP_WAKE_REASON=issue_blockers_resolved`.

---

## 3. Leverage Reviewers, Approvers, Monitor, and Watchdog Fields on Every Issue

Every active issue in Paperclip (`todo`, `in_progress`, `in_review`, `blocked`) must leverage all four governance and liveness fields:

1. **Reviewers (`execution_policy.stages` stage `type: "review"` + `review_policy: "not_creator"`)**:
   - Populate Stage 1 (`type: "review"`, `approvalsNeeded: 1`) with independent specialist reviewers excluding the issue's assignee:
     - `QA-Verification` (`f299bd09-55b8-46b2-bcf0-0cd832a20591`)
     - `AppSec` (`59f8d581-168e-4013-92a2-53f6288d3bcd`)
     - `A11y-Auditor` (`f75dd55c-e2c0-491f-981b-85e3947f5960`)
   - Set `review_policy = 'not_creator'` so no agent can self-review its own work.
2. **Approvers (`execution_policy.stages` stage `type: "approval"`)**:
   - Populate Stage 2 (`type: "approval"`, `approvalsNeeded: 1`) with architectural/release approvers excluding the issue's assignee:
     - `Architect` (`a6e94825-1999-4b5f-ad32-a94d5354db0d`)
     - `Release-Manager` (`ef69998f-9aae-4118-a28e-dae33194ba31`)
     - `CEO` (`48b44790-8e8a-44ca-8989-e871d41b51e5`)
3. **Monitor (`execution_policy.monitor` + `monitor_next_check_at`, `monitor_notes`, `monitor_scheduled_by`)**:
   - On every `in_progress` or `in_review` agent-owned issue (`assignee_agent_id IS NOT NULL`, `assignee_user_id IS NULL`), schedule an active issue monitor (`monitor_next_check_at`, `monitor_notes`, `monitor_scheduled_by = 'assignee'`, plus `execution_policy.monitor` and `execution_state.monitor`).
   - Paperclip's `tickDueIssueMonitors` scheduler automatically wakes the assignee (`PAPERCLIP_WAKE_REASON=issue_monitor_due`) when `monitor_next_check_at` arrives so no in-progress PR or deployment ever stalls.
4. **Watchdog (`issue_watchdogs` table: `watchdog_agent_id`, `instructions`, `status = 'active'`)**:
   - Attach an active watchdog entry in `issue_watchdogs` (`SRE` `4ac23ce6-e37f-473d-834e-48b6bf824f3f` or `Swarm-Dispatcher` `60c08948-5f59-4ffe-bde3-19dc26074404`) on every open issue to audit heartbeat liveness, recover stalled runs, and enforce trunk-based `main` convergence.

---

## 4. "Decisions" (`/MEG/decisions`) — Strictly User Questions, Recommendations & Scope Expansions

In Paperclip (`https://swarml.ink/MEG/decisions`), **Decisions** are used **exclusively** to ask the user (`kcWlxnR12wGUuh8CNKjy3zHU061tHaI2`) high-signal questions that:
1. **Clarify ambiguous instructions or product/architectural trade-offs**, OR
2. **Provide the user with concrete recommendations and scope expansions** for approval.

### Rules for Creating Decisions (`ask_user_questions`)
- Use `POST /api/issues/{issueId}/interactions` with:
  - `"kind": "ask_user_questions"`
  - `"resolverPolicy": "human_only"`
  - `"continuationPolicy": "wake_assignee"`
  - `"addresseeUserId": "kcWlxnR12wGUuh8CNKjy3zHU061tHaI2"`
  - Clear `title`, `summary`, and `payload.questionSet` / `payload.questions` where the best option is first and prefixed with `(Recommended)` plus a custom free-text option.
- **What Must NEVER Appear in Decisions**:
  - Never create Decisions or interactions for non-questions, routine status updates, bureaucratic role-to-role handoffs, asking permission to merge a green PR into `main`, or internal blocker bookkeeping.
  - Database triggers (`trg_paperclip_decisions_questions_only` and `trg_paperclip_sync_interaction_decision_retention`) and `scripts/paperclip-watchdog.ts` automatically archive any non-question noise so `/MEG/decisions` only ever displays genuine questions that make sense for the user to answer.

---

## 5. Trunk-Based `main` (`shared_workspace`) PR Creation, Auto-Merge & Production Deployment

1. Work on `main` (`execution_workspace_preference = 'shared_workspace'`).
2. Pull latest `origin/main`, implement and test all OpenSpec tasks, open a GitHub PR targeting `main` (`gh pr create --base main`), and **immediately merge the PR into `main`** (`gh pr merge --merge --delete-branch`).
3. Deploy merged `main` changes to production (`wrangler deploy` + CDN cache purge, `npm publish` to `registry.megabyte.space`, Coolify deployment, or systemd reload on `ubuntu.megabyte.space`), verify live health, and post the merged PR URL, `main` commit SHA, and production proof on the Paperclip issue before marking `done`.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Decompose work into contract-locked OpenSpec DAG nodes, convene a right-sized SCRUM quorum (`claude` + `codex` + `gemini`) for key decisions, and offload all throughput-safe implementation, plugin catalogs, unit tests (100% coverage), and parallel Cloudflare Browser Run E2E suites to `opencode` (DeepSeek) swarms.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (approved host adapters for `bin/evidence-gated-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
