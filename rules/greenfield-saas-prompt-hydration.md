---
name: "greenfield-saas-prompt-hydration"
description: "Hydrate short complete-product requests into recursive research, workflow-resolution OpenSpec, implementation, browser verification, and gap closure."
last_reviewed: 2026-11-15
priority: 2
pack: "core"
triggers:
  - "clone Notion"
  - "clone SaaS"
  - "build a complete SaaS"
  - "greenfield SaaS"
  - "reference product"
  - "hydrate prompt"
---

# Greenfield SaaS Prompt Hydration

Hydrate before execution. A short request for a complete product is a functional brief, not permission to skip discovery or ship only its signature screen.

## Entry point

Run the portable hydrator before research, architecture or code:

```bash
node --experimental-strip-types <agent-skills>/bin/prompt-hydrator.ts \
  --prompt "$ORIGINAL_REQUEST" --checkout "$PROJECT_ROOT" --cascade --format brief
```

Use `--format json` for adapters/CI, `--format explain` for evidence/omission diagnostics, and `--openspec-out <path>` only when implementation authority and the architect-role gate permit writing an OpenSpec change. Hosts with a prompt hook invoke the same library before routing; hookless hosts use this explicit command.

## Classification

- Complete-product, greenfield or reference-clone request → hydrate → recursively research → deduplicate inventory → OpenSpec → dependency-ordered implementation → API/browser verification → independent gap review → close gaps.
- Focused defect, narrow change or explicitly scoped prototype → hydrate proportionately and remain on the focused-change route.
- Preserve the original request verbatim in the protected structured artifact. Redact secrets from readable output, explain output, remote context and telemetry.

## Research recursion

Treat the named product as a functional reference. Record edition/plan, date, source and whether behavior was documented, observed or inferred. Start with signature capabilities plus authentication/recovery, onboarding, workspaces, permissions, billing, notifications, support, data lifecycle, accessibility and operations. Expand by capability, persona, screen, object lifecycle, integration, failure and recovery. Every result identifies overlooked workflows and follow-up prompts; deduplicate into one canonical owner and disposition.

For sizable clones, hundreds of focused prompts and substantive requirements/scenarios are expected when the capability map warrants them. Volume is not a target by itself: every prompt must have a distinct objective, evidence, dependencies and expected output.

## Context providers

Prefer Serena for symbol discovery, Context7 for installed-version documentation, scoped Repomix for broad context in repositories we own, theme.tools for reusable web components/patterns, and install.doctor for reusable system configuration. Give optional providers a deadline and record the local fallback. Never claim unavailable tools or unverified reference behavior as evidence.

## Workflow-resolution OpenSpec

Each workflow specifies actor/permission, entry point, actions, persisted effects, cross-surface effects, failure/retry/recovery, and observable scenarios. Maintain goal → capability → workflow → requirement → scenario → test → verification traceability. Architect assignment and Figma approval rules still apply.

## Completion

Derive golden-path tests before each slice, use the real backend/permission model, verify persistence after reload and cross-role effects, then audit routes, navigation, settings, dialogs and controls. An inert control or missing workflow reopens the owning requirement. Finish only when each in-scope workflow has evidence or one precise external blocker and an independent gap review finds no ready high-value gap.

Cross-links: `[[context-hydration]]` · `[[intent-complete-delivery]]` · `[[openspec-operating-contract]]` · `[[verification-loop]]`.
