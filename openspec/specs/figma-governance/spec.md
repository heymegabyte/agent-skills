# figma-governance Specification

## Purpose

Defines when agents offer, use, require, or bypass Figma while preserving reliable design evidence and explicit approval when a Figma gate applies.

## Requirements

### Requirement: Figma is optional by default
Agents SHALL treat Figma as an optional design, collaboration, and handoff tool unless an applicable authority explicitly requires it.

#### Scenario: Ordinary design work has no Figma mandate
- **WHEN** a user requests UI work and no user, repository, OpenSpec, or governing policy requires Figma
- **THEN** the agent may proceed with repository-native design evidence without blocking on Figma access or approval

#### Scenario: User requests Figma
- **WHEN** the user asks to create, inspect, edit, export to, import from, or approve work in Figma
- **THEN** the agent uses the applicable Figma workflow and skills

### Requirement: Explicit policy activates the Figma gate
Agents MUST require Figma when the user, repository instructions, active OpenSpec change, or another applicable governance contract explicitly makes it a prerequisite.

#### Scenario: Repository requires Figma approval
- **WHEN** repository instructions require Figma approval for the requested visual scope
- **THEN** the agent obtains and records approval before implementing that scope

#### Scenario: Stricter local policy overrides the default
- **WHEN** optional global guidance and an explicit project-local Figma mandate both apply
- **THEN** the agent follows the stricter project-local mandate

### Requirement: Agents offer Figma when it adds material value
Agents SHALL recommend Figma when stakeholder collaboration, reusable design-system work, complex responsive states, prototyping, or design handoff materially benefits from an editable design artifact.

#### Scenario: Figma is useful but not required
- **WHEN** Figma would materially improve review or handoff and no mandatory gate applies
- **THEN** the agent offers it as a non-blocking option and continues with decision-independent work

### Requirement: Active Figma approvals are revision-bound
When a Figma gate applies, agents MUST bind approval to the exact artifact revision, scope, responsive variants, material states, approver, and evidence.

#### Scenario: Current Figma artifact is approved
- **WHEN** the user explicitly approves a named Figma artifact and revision
- **THEN** the agent records the approval and implements only the approved scope

#### Scenario: Implementation materially departs from approval
- **WHEN** implementation requires a material visual or interaction departure from the approved artifact
- **THEN** the affected scope returns to review before release

### Requirement: Non-Figma paths preserve design evidence
Agents proceeding without Figma SHALL retain sufficient reviewable design evidence for the risk and scope of the change.

#### Scenario: Agent proceeds without Figma
- **WHEN** no Figma mandate applies and the agent implements a designable surface
- **THEN** the agent records the chosen evidence, such as Storybook states, screenshots, prototypes, visual tests, or an explicit user direction

