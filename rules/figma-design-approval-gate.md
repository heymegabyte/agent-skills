---
name: figma-design-approval-gate
description: Optional Figma design workflow plus the mandatory approval contract when a user, repository, OpenSpec change, or governing policy explicitly requires Figma. Use for Figma requests and for deciding whether design work benefits from a Figma artifact.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Optional Figma Workflow and Approval Gate

Figma is supported, not universally required. Use it when the user asks for it, when an applicable authority requires it, or when it materially improves collaboration, prototyping, reusable design-system work, responsive/state review, or handoff.

Do not block ordinary design or implementation solely because Figma access, credentials, or approval are unavailable. When no Figma mandate applies, continue with proportionate reviewable evidence such as Storybook states, screenshots, a coded prototype, visual regression output, or explicit user direction.

## Decide whether Figma is required

The Figma gate is mandatory only when one of these authorities explicitly activates it:

- The user requests Figma or requires approval in Figma.
- Repository instructions require Figma for the affected scope.
- The active OpenSpec change or accepted product contract requires it.
- Another applicable governance, compliance, or shared design-system policy requires it.

Complexity alone is a reason to offer Figma, not to silently make it mandatory. A stricter project-local rule overrides this global default.

## Optional path

When Figma would add material value but is not required:

1. Offer it as a non-blocking option with the concrete benefit.
2. Continue all decision-independent work without waiting for a response.
3. If the user accepts, use the applicable Figma skills and preserve stable component, token, and revision metadata.
4. If the user declines or access is unavailable, use repository-native design evidence and record that path in OpenSpec or the task ledger.

## Required approval path

When an authority activates the Figma gate:

1. Research and clarify the design problem while independent non-design work may continue in the background.
2. Create/update the Figma design, prototype, FigJam flow, spec or library using the applicable Figma skills and existing brand/design-system sources.
3. Cover representative responsive breakpoints, critical states, error/empty/loading states, accessibility, content hierarchy and important interactions.
4. Present the Figma link plus a concise decision summary: what is proposed, material alternatives rejected and what implementation will follow.
5. Wait for explicit user approval such as “approved,” “build this,” or an unambiguous equivalent tied to the current Figma version.
6. Record the approved Figma URL/node/version in the OpenSpec change and acceptance criteria.
7. Implement from the approved design, verify code against Figma, and return to Figma approval for material visual deviations.

Do not treat silence, a prior unrelated design, an agent review or autonomous-loop consensus as user approval. Approval of a concept is not approval of an unreviewed detailed design.

For an active multi-screen Figma gate, use [[progressive-screen-scaffold-approval]].
