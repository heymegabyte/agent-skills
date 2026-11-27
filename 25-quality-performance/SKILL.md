---
name: "quality-performance"
description: "Speed, accessibility, and testing bars every delivered app must clear — Core Web Vitals, WCAG 2.2 AA, TDD real-browser E2E, and the build-fail gates."
triggers:
  - "performance"
  - "accessibility"
  - "a11y"
  - "test"
  - "quality"
priority: 2
pack: "testing"
stage: stable
---

# Quality & Performance — every app must clear these bars

## Core Web Vitals (per route)

- LCP ≤ 2.0s · CLS ≤ 0.05 · INP ≤ 100ms (cinematic target; ≤ 200ms hard ceiling). Per-route asset budget enforced.
- Lighthouse: Performance ≥ 75 · Accessibility ≥ 95, run in CI (Lighthouse CI).

## Accessibility (WCAG 2.2 AA)

- axe-core 0 violations at all 6 breakpoints (375 · 390 · 768 · 1024 · 1280 · 1920). ADA Title II ready.
- Everything keyboard-operable; visible focus; honors `prefers-reduced-motion`. (Contrast/target-size specifics live in `visual-experience`.)

## Testing (TDD-first, real flows)

- Failing Playwright E2E spec BEFORE implementation — watch RED → GREEN. Bug fix = failing regression test FIRST. No feature without ≥1 E2E; no fix without ≥1 regression.
- E2E runs against the PROD URL in a real browser: `goto('/')` then navigate by clicks/keyboard only (no `page.goto` after load). Deterministic (locator waits, no sleeps), parallel-safe, hermetic.
- Every clickable element · form field · nav link · API endpoint · modal · keyboard shortcut · error/empty/loading state has ≥1 E2E asserting it against prod.
- Coverage matrix: `fullyParallel` × 6 viewports × 3 browsers, sharded. Units via Vitest.
- Simulate realistic full user journeys (homepage → discover → convert) via **Cloudflare Browser Rendering or Browserbase** (whichever is configured). Drive HIGH % code coverage from these end-to-end journey runs, not just units.

## Build-fail gates (any one = fail)

- Console errors · CSP violations · 4xx/5xx · axe violations · broken hyperlinks — in ANY test — fail the build.
- AI-vision QA ≥ 8/10 on every new/changed route (random snapshot sampling per run). Visual regression via Percy / pixelmatch.

## Mocked ≠ green

- A mocked/stubbed render is NOT a pass. "Deploy succeeded" ≠ "works" — only a real-browser prod run with 0 console errors and asserted content counts as green.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Enforce 100% unit test coverage, sub-200ms TTFR, and parallel Cloudflare Browser Run (`@cloudflare/playwright`) 6-breakpoint E2E verification using concurrent `opencode` (DeepSeek) test-writer swarms.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (approved host adapters for `bin/evidence-gated-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.

## Theme.tools ecosystem contract (required)

Before implementation, load `rules/theme-tools-skill-integration.md` from the agent-skills repository and the entry for this skill in `config/theme-tools-skill-map.json`. Apply catalog-first reuse, upstream contribution, thin-consumer adoption, UI-first theme.tools implementation and test-driven verification, and `.tools/telemetry` routing proportionally to this task.

- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent work concurrently whenever doing so reduces time to verified delivery. Delegate every suitable task to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
