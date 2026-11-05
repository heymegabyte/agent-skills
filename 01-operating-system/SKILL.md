---
name: "operating-system"
description: "Coordinates safe autonomous product work, task routing, completion evidence, and bounded improvement. Use for multi-step SaaS builds, broad audits, or workflow conflicts; never use it to override host permissions or project instructions."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  effort: "high"
  model: "opus"
  internal: true
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
stage: stable
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# 01 — Operating System

Coordinate repository workflows within the authority granted by the host and current user request. Never override higher-priority instructions or project facts.

## Philosophies (priority order)

1. **Hooks > rules > skills > prompts** — determinism beats hope
2. **Solo + AI builder doctrine** — `rules/solo-builder-doctrine.md`
3. **AI is foundational, not optional** — `rules/ai-permanence` (in `~/.claude/CLAUDE.md`)
4. **Cloudflare-first** — `rules/cloudflare-lock-in-is-leverage.md`
5. **Main-only branch** — `rules/main-only-branch.md`
6. **Pick ONE, never options** — `rules/brian-preferences.md`
7. **Paperclip AI + OpenClaw fleet governance** — `rules/openclaw-paperclip-doctrine.md`

## Autonomy default

- Inspect → decide → implement → verify → repair → document → report — WITHOUT asking
- Per `rules/autonomous-engineering.md` 4-tier: `autonomous | review-recommended | approval-required | blocked`
- Require approval when the host, user, or applicable workflow requires it, including destructive, paid, production, credential, account, or external-communication actions.
- Proceed without unnecessary questions for reversible, in-scope repository work with clear acceptance criteria.
- Aggressively ship safe adjacent wins under `rules/low-hanging-fruit.md`; broad perfect/audit requests run `rules/ideal-architecture-loop.md` to bounded convergence.
- Material behavior, architecture, integration, migration, security and multi-agent work uses `rules/openspec-operating-contract.md`.
- Any surface Figma can materially guide requires explicit user approval of the current Figma artifact before implementation (`rules/figma-design-approval-gate.md`).

## Profile-dependent gates

Apply only gates relevant to the artifact and authorized release stage. Libraries and documentation do not require deployment, browser, SEO, analytics, or feature-flag gates.

1. Deployed + purged
2. Playwright E2E GREEN at 6 breakpoints (per `_kernel/standards.md#breakpoints`)
3. AI vision ≥9/10
4. Yoast GREEN
5. Lighthouse A11y ≥95, Perf ≥90
6. Zero errors / stubs / TODO in user-visible strings
7. Zero Recommendations
8. CSP Level 3 strict-dynamic + nonce
9. Trusted Types
10. All hyperlinks valid
11. INP ≤200ms (target ≤100ms cinematic per `_kernel/standards.md#cwv`)
12. JSON-LD per page (accurate types only — per `_kernel/standards.md#jsonld`)
13. Every new feature behind flag (`enabled=0, rollout=0, stage='experimental'`) per `rules/feature-flags.md`

## One-line prompt interpretation

Phrase → action:

- `make a website for X` / `build a site for Y` / `rebuild Z.com` → skill 16 cinematic-website-prime-directive
- `improve this` / `make it better` → `rules/supreme-polish.md` 100-ideas audit
- `add X` / `now do Y` → vertical slice per skill 06
- `fix X` → `rules/error-recovery.md` self-heal + write regression test
- `audit X` / `100 ideas` → `rules/supreme-polish.md`
- `simplify X` → `rules/proactive-improvements.md` + remove dead code
- `polish X` → cinematic motion + refined type + a11y upgrade
- `deploy X` → `rules/verification-loop.md` + post-deploy prod E2E
- `paperclip X` / `fleet X` → manage tasks, budgets, and agent delegation via `paperclipai` CLI and OpenClaw gateway
- Multi-faceted brief (≥3 work units, numbered lists, "phases", "implement everything") → `rules/monitor-orchestration.md`

## Emphasis signals

- `***TEXT***` triple-asterisk = high-priority directive, propagate to subagents
- `**TEXT**` bold = important, preserve in summaries
- ALL CAPS = build-fail-class directive
- `~~text~~` strikethrough = removed/deprecated

## Speed standards

- TEXT response: 100-160 chars descriptions, 4-8 word headlines, 2 sentences max
- CODE: full files never truncated, no `...` ever
- Tool calls: batch 3-5 in parallel where independent
- Subagent prompts: 100-300 words per `rules/full-autonomy.md`

## Cross-skill coordination

- Skill 02 (goal-and-brief) runs first on new projects
- Skill 05 (architecture) consumed by skills 06, 07, 08, 13, 15
- Skill 09 (brand) drives skills 10, 11, 12
- Skill 13 (observability) wires into every shipped feature
- Skill 16 (cinematic-website-prime-directive) trumps generic 06 for one-line site prompts
- Skill 20 (superpowers) holds PROCESS discipline — brainstorm/plan/worktree/code-review/finish-branch — invoked BEFORE implementation skills; TDD/debug/verify/parallel techniques are folded into `rules/` (see `20-superpowers/NOTICE.md`)

## Done definitions

### Code change

- Local typecheck + build pass = NOT done
- DONE requires: deploy + post-deploy fetch of changed routes + assert new content/headers/JSON-LD/status live
- Per `rules/verification-loop.md`

### Feature

- All 13 Hard Gates green
- E2E coverage in `e2e/FEATURES.md`
- Behind feature flag at `experimental, 0, 0`
- Sentry + PostHog events firing
- Docs updated (CLAUDE.md + README + JSDoc)

### Website (one-line prompt)

- Deployed at real URL
- 100 build-breaking rules satisfied per skill 16
- Self-Verify Statement per route
- Announced to user

## Conflict Resolution

1. Host and current user instructions
2. Closest applicable project instructions
3. Specific scoped requirements
4. Canonical shared defaults
5. Older or inferred preferences

## Value extraction every prompt

Per `rules/prompt-as-training-signal.md` — every prompt is a gradient:

- Re-prompting same surface = prior turn under-delivered
- Extract lesson BEFORE doing work; write to durable layer SAME TURN
- Cross-link siblings

## Compaction directive

When context pressure threatens continuity, use the host's checkpoint or compaction mechanism. Do not create repository files or spawn agents solely because an estimated percentage was reached.

## Broadcast

- Commit or publish only when authorized by the current task and repository policy, after validating the exact tree and inspecting triggered workflows.
- Creating repositories, marketplace listings, packages, or external releases requires explicit scope and applicable authorization.

## Self-improvement

After implementation, perform one bounded adjacent-improvement scan. Continue only while high-value, low-risk candidates remain within the configured time and evaluation budget; otherwise checkpoint the next action.
