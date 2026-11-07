---
pack: core
---

# Principal Architect ("Nincy-Nancy Architect") Nomenclature & Anti-Scaffolding Discipline

## Core Mandate

Every file, module, interface, type, constant, function, comment, and export MUST be named as if hand-authored by a fastidious, pedantic ("nincy-nancy") Principal Systems Architect—**even when massaging in code, migrating modules, or running automated convergence scripts**.

Never leak internal generator tags, wave numbers, prompt task IDs, version suffixes (`-v2`), or array-length counts (`_16_`) into source code identifiers or module comments.

---

## 1. Ban Synthetic Generator & Wave Tags (`deep-domain-v2`, `M613`, `Wave 13`)

- **FORBIDDEN**:
  - `@theme.tools/deep-domain-v2` or `deep-domain-v2`
  - `<Pascal>DeepDomainSpec` / `<UPPER>_DEEP_DOMAIN_SPEC` / `verify<Pascal>DeepDomainInvariants`
  - Embedding prompt task codes (`taskCode: "M613"`), wave numbers (`waveNumber: 13`), or self-scoring fields (`recommendabilityScore: 97`) inside library runtime contracts or comments.
- **REQUIRED (Principal Architect Nomenclature)**:
  - Module Architectural Comment:
    `// Architectural Specification & Runtime Invariants — @theme.tools/<capability> (<module>)`
  - Specification Interface:
    `<Pascal>ModuleSpecification` (e.g., `CommerceTestingModuleSpecification`)
  - Specification Constant:
    `<UPPER>_MODULE_SPECIFICATION` (e.g., `COMMERCE_TESTING_MODULE_SPECIFICATION`)
  - Runtime Invariant Verifier:
    `verify<Pascal>ModuleInvariants` (e.g., `verifyCommerceTestingModuleInvariants`)

---

## 2. Ban Numeric Cardinality Counts in State & Token Identifiers (No `*_16_VISUAL_STATES`)

- **FORBIDDEN**:
  - `*_16_VISUAL_STATES` (e.g., `COMMERCE_TESTING_16_VISUAL_STATES`, `UI_CORE_16_VISUAL_STATES`)
  - `CANONICAL_16_VISUAL_STATE_INSTRUMENT_TOKENS` / `CanonicalVisualStateInstrumentToken` / `*VisualStateInstrumentToken`
  - `CANONICAL_16_VISUAL_STATES`
  - Naming constants after the number of elements currently in the collection (`_16_`, `_28_`, `_110_`) instead of their semantic domain role.
- **REQUIRED (Principal Architect Nomenclature)**:
  - Shared Token Module:
    `packages/shared-utils/src/interaction-state-tokens.ts`
  - Shared Token Interface & Constant:
    `InteractionStateToken` & `INTERACTION_STATE_TOKENS`
  - Per-Module Type Alias & Constant:
    `<Pascal>InteractionStateToken` & `<UPPER>_INTERACTION_STATE_TOKENS` (e.g., `CommerceTestingInteractionStateToken`, `COMMERCE_TESTING_INTERACTION_STATE_TOKENS`)
  - UI Component State Contract Array:
    `COMPONENT_INTERACTION_STATES`
  - Verifier Return Property:
    `verifiedInteractionStateCount` (never `verifiedVisualStates`)
