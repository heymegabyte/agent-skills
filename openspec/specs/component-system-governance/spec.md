# component-system-governance Specification

## Purpose
Defines a durable, auditable component-system contract that gives agents consistent component choices without sacrificing branding, accessibility, security, or upgrade safety.

## Requirements

### Requirement: Component foundation selection
Agents SHALL select one documented primitive base for each React application and SHALL preserve a stable existing base unless migration has a demonstrated product benefit.

#### Scenario: New React application
- **WHEN** an agent creates a new React application
- **THEN** it records and uses the current default component foundation

#### Scenario: Existing stable application
- **WHEN** an application already uses a supported component foundation
- **THEN** the agent does not migrate it solely to match the current default

### Requirement: Auditable component supply chain
Agents SHALL classify component sources as official primitives, approved internal compositions, or audited third-party source and SHALL inspect third-party source before incorporation.

#### Scenario: Third-party registry component
- **WHEN** an agent proposes a third-party registry component
- **THEN** it inspects the payload, dependencies, license, accessibility, performance, and security before copying source

### Requirement: Surface-appropriate composition
Agents SHALL map each feature surface to established semantic component recipes and SHALL implement loading, empty, error, success, disabled, and permission states where applicable.

#### Scenario: Data management surface
- **WHEN** an agent builds a searchable or editable data view
- **THEN** it composes the approved table, filtering, pagination, actions, feedback, and state patterns rather than a generic card grid

### Requirement: Brand and accessibility ownership
Agents SHALL treat copied component source as application-owned code and SHALL validate brand tokens, accessible names, focus, keyboard behavior, contrast, motion preferences, and responsive behavior.

#### Scenario: Primitive supplies accessible mechanics
- **WHEN** a primitive provides ARIA and keyboard mechanics
- **THEN** the agent still validates application labels, content, styling, focus visibility, and end-to-end interaction

### Requirement: Safe component upgrades
Agents SHALL inspect generated diffs before component, style, preset, or registry updates and SHALL preserve intentional local adaptations through review and verification.

#### Scenario: Upstream component update
- **WHEN** an agent updates an installed component
- **THEN** it reviews the upstream delta, merges rather than blindly overwrites, and runs component and application verification
