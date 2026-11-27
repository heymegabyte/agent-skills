## ADDED Requirements

### Requirement: Codex assets retain declared progressive references

The generated Codex manifest SHALL include canonical skill submodules in its asset list for on-demand access while keeping standing instructions scoped to the rules directory.

#### Scenario: A TypeScript contract change requires its reference

- **WHEN** an installation contains only the Codex manifest's listed assets and a reader follows the contract-testing reference from the code-style rule
- **THEN** the canonical contract-testing document is available at its relative path

#### Scenario: A declared reference is missing from the manifest

- **WHEN** package closure checks a generated Codex manifest that omits a canonical skill submodule
- **THEN** the check fails with the missing reference path
