# Proposal

## Why

The current agent-skills policy blocks nearly every designable implementation on a Figma artifact and explicit approval, even when Figma adds no meaningful value or is unavailable. Figma should remain a supported collaboration and approval tool without becoming a universal prerequisite.

## What Changes

- Make Figma optional by default for product, website, and application work.
- Require Figma only when the user, repository policy, active OpenSpec change, or another explicit governance contract requires it.
- Define evidence-based criteria for offering Figma and a safe non-Figma design path.
- Preserve explicit approval semantics whenever a Figma gate is active.
- Remove contradictory global language that treats every designable surface as Figma-gated.

## Capabilities

### New Capabilities

- `figma-governance`: Governs optional Figma use, explicit escalation to a required approval gate, fallback design evidence, and approval recording.

### Modified Capabilities

- `openspec-governance`: Makes Figma references conditional on an applicable design policy instead of universal for every designable surface.

## Impact

This changes canonical design governance rules, OpenSpec guidance, progressive screen scaffolding, convergence prompts, and agent entrypoint wording. It does not change Figma tooling or remove stricter project-local requirements such as OnePrompt's explicit approval mandate.
