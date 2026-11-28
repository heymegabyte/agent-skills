## ADDED Requirements

### Requirement: Qualify conditional server exports in their actual consumer

The integration guidance SHALL require inspecting the installed Worker's effective export conditions and exercising the packed server and browser-only paths before a shared package release.

#### Scenario: A Worker enables browser and Worker conditions

- **WHEN** a server-only subpath provides both a Worker implementation and a browser-denial export
- **THEN** a packed Worker build selects the implementation, and browser-only resolution still selects the denial
