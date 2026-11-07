# Design

## Context

The current policy is distributed across the Figma approval rule, progressive screen workflow, OpenSpec contract, Codex entrypoint, convergence prompt, and feature-expansion guidance. Project-local policies may intentionally remain stricter than the global default.

## Goals / Non-Goals

**Goals:**

- Establish one global optional-by-default decision rule.
- Keep Figma fully supported when requested or materially useful.
- Preserve a hard, revision-bound approval gate whenever explicit policy activates it.
- Prevent missing Figma access from blocking work that has no Figma mandate.

**Non-Goals:**

- Remove Figma skills or integrations.
- Relax explicit project-local approval requirements.
- Define product-specific Figma export/import implementations.

## Decisions

### Keep the existing rule identity

Retain `figma-design-approval-gate` so existing links and routers remain valid, but change it into a decision-and-approval contract. Renaming the file would create unnecessary routing and cross-link churn.

### Use explicit authorities to activate the gate

The gate activates only through a user instruction, repository instruction, active OpenSpec artifact, or applicable governance policy. Complexity alone causes an agent to offer Figma, not silently make it mandatory.

### Require proportionate non-Figma evidence

When Figma is not used, agents still need reviewable evidence such as Storybook stories, screenshots, prototypes, visual regression output, or explicit implementation direction. This prevents “optional Figma” from becoming “no design validation.”

### Preserve stricter local policy

Global defaults do not override repositories such as OnePrompt that explicitly require Figma approval. This follows the existing specificity and repository-precedence rules.

## Risks / Trade-offs

- [Risk] Different entrypoints retain contradictory mandatory wording. → Update the canonical rule and every direct global mandate found by repository search, then validate with targeted scans.
- [Risk] Agents interpret optional as never offer Figma. → Include material-value criteria and explicit Figma-request routing.
- [Risk] Agents bypass active approvals. → Preserve exact revision, scope, approver, and deviation requirements.
- [Risk] Existing project mandates are accidentally relaxed. → State local-policy precedence in both rule and spec, and do not edit consumer repositories.

## Migration Plan

1. Update canonical policy and direct cross-references.
2. Add validation that no unconditional global mandate remains in the targeted entrypoints.
3. Sync the new and modified capability specs.
4. Archive the completed change; consumer repositories keep their own stricter policies until explicitly changed.
