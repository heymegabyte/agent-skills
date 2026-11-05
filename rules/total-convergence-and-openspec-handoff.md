---
name: "total-convergence-and-openspec-handoff"
description: "Total multi-axis convergence (beauty, gorgeousness, UI principles, business rules, functionality, performance, security, AI execution), extracted micro-task convergence loops, parallel end-of-turn triad sync (agent-skills + install.doctor + theme.tools), Frontier-only OpenSpec authoring (claude/codex/antigravity, never opencode), and automatic Paperclip issue handoff."
last_reviewed: 2026-11-04
superseded_by: null
priority: 1
pack: "core"
triggers:
  - "converge"
  - "openspec"
  - "paperclip"
  - "theme.tools"
  - "install.doctor"
  - "langfuse"
  - "micro-loop"
paths:
  - "*"
---

# Total Multi-Axis Convergence, Parallel Triad Sync & Frontier OpenSpec → Paperclip Handoff

Everything entered at a prompt MUST converge into the application, business, and shared Megabyte Labs ecosystem (`heymegabyte/agent-skills`, `heymegabyte/install.doctor`, `heymegabyte/theme.tools`, and the live **Paperclip** control plane). No requirement, sub-feature, UI widget, business rule, or recommendation is ever dropped on the floor.

---

## 1. Extracted Micro-Task & Multi-Axis Convergence Loops (Always Active)

Do not wait for an explicit `/run-the-loop` command to run convergence loops. Every prompt and every sub-feature executes **three nested convergence loops** extracted from `run-the-loop/_shared/CONSTITUTION.md` and `CONVERGENCE-PROTOCOL.md`:

### A. The Micro Loop (Per UI Widget, Sub-Feature, Business Rule, or API Endpoint)

```text
CREATE → RENDER / EXECUTE → EXPERIENCE → CRITIQUE → MODIFY → COMPARE
```

1. **Every UI Widget Must Converge on Beauty, Gorgeousness & Good UI Principles**:
   - **16-State Visual State Matrix**: Every interactive widget or component must account for and visually verify all applicable states:
     1. `default` · 2. `hover` · 3. `focus-visible` · 4. `active` / `pressed` · 5. `selected` · 6. `disabled` · 7. `loading` / `skeleton` · 8. `expanded` · 9. `collapsed` · 10. `dragging` · 11. `drop-target` · 12. `success` · 13. `warning` · 14. `error` · 15. `empty` · 16. `populated` (low, typical, and extreme data density).
   - **Per-Element Craft Floor (`[[gorgeous-by-default]]`)**:
     - Enumerable values (`string[]`, roles, tags, statuses, filters, capabilities) ALWAYS render as styled pills/chips, never comma-joined text (`join(', ')`).
     - Every state change transitions smoothly at `0.333s` (`cubic-bezier(0.22, 1, 0.36, 1)`), honoring `prefers-reduced-motion: reduce`.
     - OKLCH perceptual tokens (`#060610` canvas, `#00E5FF` cyan accent, `#50AAE3` secondary, `#7C3AED` violet) with WCAG 2.2 AA contrast.
     - Wrapped controls use `:focus-within` on the outer container and suppress inner duplicate rings.
   - **Champion vs. Challenger Comparison**: For primary widgets, hero sections, and key workflows, compare the current implementation (**Champion**) against a concrete higher-craft refinement (**Challenger**) and keep only what measurably improves visual hierarchy, clarity, and tactile delight.

2. **The 10-Lens Micro-Critique Pass (Run on Every Sub-Feature & Widget)**:
   - **Pass 1 — Functional Truth**: Does it genuinely work end-to-end with real data and zero stubs?
   - **Pass 2 — Completeness & Edge Cases**: Are all 16 visual states, validation boundaries, and recovery paths built?
   - **Pass 3 — 3-Second Clarity**: Can a first-time user tell within 3 seconds what this surface is, why it matters, and what action to take?
   - **Pass 4 — Friction Removal**: Can steps, fields, or configuration knobs be eliminated or pre-filled?
   - **Pass 5 — Beautify-10x**: How does this become 10x more gorgeous (typography, spacing, OKLCH depth, micro-motion, zero visual slop)?
   - **Pass 6 — `0.333s` Motion & Tactility**: Are entrance, hover, focus, and state transitions choreographed and INP-safe (`≤100ms`)?
   - **Pass 7 — AI-Native Leverage**: Where can cheap/fast AI pre-compute, summarize, rank, auto-fill, or guide intent?
   - **Pass 8 — Business Rules & Domain Integrity**: Are permissions, billing/cost invariants, idempotency, and audit trails enforced server-side with Zod schemas?
   - **Pass 9 — Performance & Security Hardening**: Are queries indexed/bounded, secrets isolated, CSP/Trusted Types intact, and observability spans emitted?
   - **Pass 10 — Ecosystem Extraction (Triad Sync)**: What reusable pattern belongs in `agent-skills`, `install.doctor`, or `theme.tools` (`ui.theme.tools`)?

### B. The Product Loop (Workflow & Business Convergence)
- Ask after every feature slice: *Can this become visualization instead of configuration? Navigation instead of instruction? Intent instead of forms?*
- Every sub-feature must converge across all **8 Mandatory Axes**:
  1. **Beauty** (per-element craft, typography, balanced whitespace, OKLCH harmony)
  2. **Gorgeousness** (cinematic motion, `0.333s` transitions, glass/depth, pill affordances, zero plain defaults)
  3. **Principles of Good UI** (3-second clarity, progressive disclosure, keyboard-first accessibility, 16-state coverage)
  4. **Functionality & Business Rules** (real data, domain invariants, edge-case resilience, zero placeholders)
  5. **Performance** (LCP `≤2.0s`, INP `≤100ms`, CLS `≤0.05`, sub-millisecond local caches)
  6. **Security** (server-side RBAC, Zod boundary validation, loopback daemon bindings, zero secrets in git)
  7. **Observability** (PostHog + GA4 + Sentry + **Langfuse with graceful timeout fallback**)
  8. **AI Execution Quality** (frontier architecture, parallel swarm throughput, deterministic verification)

### C. The Organization Loop (End-of-Prompt Parallel Triad Sync)
- Every prompt trains the organization. Before concluding any turn, execute Section 2 below in parallel.

---

## 2. End-of-Prompt Parallel Triad Sync (`agent-skills` + `install.doctor` + `theme.tools` + Touched Projects)

Whenever the agent evaluates at the end of a prompt pass what updates can be inferred from the prompt and response, it **MUST evaluate and apply inferred updates across all three canonical upstream repositories in parallel** (plus any other touched project):

1. **`heymegabyte/agent-skills` (`~/.agentskills`)**:
   - Extract reusable rules, skills, convergence checklists, verification scripts, and orchestration helpers discovered during the turn.
2. **`heymegabyte/install.doctor` (`/Users/Apple/emdash/repositories/install.doctor`)**:
   - Extract reusable dotfiles, shell environment defaults (`megabyte-cache.sh.tmpl`), package-manager configs, systemd/LaunchAgent units, lazy CLI shims (`cnf-build-shims`), and workstation/server provisioning scripts inferred from the prompt or response.
3. **`heymegabyte/theme.tools` & `ui.theme.tools` (`/Users/Apple/emdash/repositories/theme.tools`)**:
   - Extract reusable OKLCH theme tokens, component state contracts, Storybook stories, visual state matrix validators, and shared UI primitives (`@theme-tools/ui`, `@theme-tools/themes`) inferred from the prompt or response.
4. **Any Other Implicated Project Repository**:
   - Reconcile host or product changes into the active project repository (`legion.megabyte.space`, `coolify.megabyte.space`, `projectsites.dev`, etc.).

### Mandatory OpenSpec + Paperclip Registration for Parallel Triad Work
- Whenever inferred work is saved or queued in `agent-skills`, `install.doctor`, `theme.tools`, or any other project:
  1. Properly create or update an **OpenSpec** change directory (`openspec/changes/<change-id>/` containing `proposal.md`, `design.md`, `tasks.md`, and `specs/<capability>/spec.md`) in each respective repository.
  2. Create or update the corresponding **Paperclip issue/task** in each respective Paperclip project (`agent-skills`, `install.doctor`, `theme.tools`, etc.) containing a **direct deep link to the OpenSpec files** via `~/.agentskills/bin/openspec-paperclip-sync.ts` (or Paperclip MCP / `paperclipai issue create`).

---

## 3. Huge-Prompt Triage, "Never Give Up Without Handoff" & Recommendations → OpenSpec + Paperclip

Everything entered at a prompt must converge into the ecosystem without loss:

1. **Huge-Prompt Two-Wave Triage**:
   - When a large or multi-faceted prompt arrives, immediately determine:
     - **Wave 1 (Finish Programming In This Pass)**: All foundational, high-leverage, and parallelizable implementation slices that can be programmed, tested, verified, and shipped in the current pass. Execute Wave 1 immediately using parallel tools and `~/.agentskills/bin/opencode-swarm.mjs`.
     - **Wave 2 (OpenSpec + Paperclip Autonomous Continuity)**: Any remaining sub-features, multi-day expansions, or cross-repo follow-ups that cannot be completed within the current turn's execution window.
2. **Whenever the AI "Gives Up" / Defers Remaining Work**:
   - If the AI reaches a budget, context, or scope boundary on any sub-feature, UI widget, or business rule and decides not to pursue the rest of the work in the current turn, it is **strictly forbidden** from merely printing a passive "TODO" or "Future work" bullet in chat.
   - Instead, it **MUST**:
     1. Author a complete **OpenSpec** change (`proposal.md`, `design.md`, `tasks.md`, `specs/`) in the target repository capturing the exact remaining convergence steps.
     2. File a linked issue in **Paperclip** (via Paperclip MCP or `~/.agentskills/bin/openspec-paperclip-sync.ts` / Paperclip API) with the deep link to the OpenSpec so Paperclip's autonomous agents automatically pick it up and tend to it.
3. **End-of-Prompt Recommendations & Next Steps (`Recs:` / `Next:`)**:
   - Implementing recommendable ideas in the same turn is always the primary rule (`[[auto-integrate-recs]]`).
   - If ANY recommendation or next step still remains at the end of a prompt, it **MUST** also be materialized as an **OpenSpec** change in the target repository AND added as a linked issue in **Paperclip** before the turn ends.

---

## 4. HARD RULE: Explicitly Assigned Architect Only for OpenSpec (NEVER `opencode`)

- Only an agent that the orchestrator explicitly assigned the **architect role for the change** may author or modify `proposal.md`, `design.md`, `tasks.md`, or `specs/`. Being Claude, Codex, Gemini/Antigravity, or any other frontier model is not by itself a role assignment and does not authorize OpenSpec architecture work.
- The assigned architect records `> **Architect:** <frontier-harness>` and `> **Architect Role:** assigned` in both `proposal.md` and `design.md`; missing or inconsistent role metadata fails validation.
- **NEVER spell out the architectural, business-rule, or application details of an OpenSpec using `opencode` (DeepSeek).**
- **Why**: OpenSpec defines the architectural contract, domain invariants, security boundaries, and acceptance criteria that downstream worker swarms execute against. Using a lightweight throughput model (`opencode`) to write architectural specs degrades specification fidelity and causes downstream drift.
- **Division of Labor**:
  - **Explicitly assigned Frontier Architect (`claude` with full hydrated context · `codex` · `antigravity`)**: Hydrates repository context (`<=900K tokens`), designs the architecture, writes the OpenSpec (`proposal.md`, `design.md`, `tasks.md`, `specs/`), posts the linked issue to Paperclip (`openspec-paperclip-sync.ts` / Paperclip MCP), reviews diffs, and runs final verification.
  - **Throughput Swarm (`opencode` via LiteLLM DeepSeek pool)**: Executes bounded implementation tasks *after* the Frontier Architect has written and locked the OpenSpec contract.

---

## 5. Langfuse Always-On with Graceful Timeout & Fail-Open Fallback

- **Langfuse is mandatory** across all LLM, agent, LiteLLM gateway, and Worker AI surfaces (`[[production-observability-default-on]]`, `[[litellm-gateway]]`).
- **Graceful Fallback + Strict Timeout Contract**:
  - Every Langfuse SDK client, OTLP exporter, or REST call MUST enforce an explicit bounded timeout (`LANGFUSE_TIMEOUT_MS = 2500`, `AbortSignal.timeout(2500)`).
  - Every Langfuse operation (`trace`, `generation`, `score`, `getPrompt`, `flushAsync`) MUST be wrapped in a **fail-open** handler (`~/.agentskills/bin/lib/langfuse-safe.ts`) with:
    1. **Bounded Timeout (`2500ms` default)**: Never allow a hanging Langfuse connection to stall an LLM call, Worker response, or CLI tool.
    2. **Circuit Breaker**: After 3 consecutive timeouts/network errors, trip the circuit open for `60s` so subsequent traces skip network waits immediately (`0ms` overhead).
    3. **Local JSONL Spool Fallback**: When Langfuse is unreachable, spool trace payloads locally to `${XDG_CACHE_HOME:-$HOME/.cache}/megabyte/ai/langfuse-spool/traces.jsonl` (or log structured fallback warnings on stateless Workers via `ctx.waitUntil`) so zero telemetry is lost and user-facing execution never fails.

## Cross-links

`[[always]]` · `[[prompt-as-training-signal]]` · `[[openspec-operating-contract]]` · `[[agent-provider-policy]]` · `[[gorgeous-by-default]]` · `[[production-observability-default-on]]` · `[[auto-integrate-recs]]` · `[[improvement-audit]]` · `[[workstation-shared-provisioning-policy]]`.
