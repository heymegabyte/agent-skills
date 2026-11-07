# Proposal

## Why

The agent doctrine still describes shadcn/ui as universally Radix-based and offers too little guidance for presets, registries, upgrades, AI surfaces, or component acceptance. shadcn's 2026 Base UI default, React Aria support, CLI v4, and registry ecosystem require a safer and more useful component-system contract.

## What Changes

- Make shadcn/ui the explicit owns-the-code foundation for React applications, with Base UI for new apps, preservation of stable Radix apps, and deliberate React Aria selection.
- Define a component supply chain: official primitives, internal approved compositions, and audited third-party visual effects.
- Establish application-surface recipes for marketing, product shells, forms, data, commerce, onboarding, notifications, and AI experiences.
- Add preset, token, registry, MCP, monorepo, upgrade, accessibility, and verification guidance.
- Reconcile the existing TanStack Form versus React Hook Form conflict and remove claims that primitive accessibility eliminates application testing.

## Capabilities

### New Capabilities

- `component-system-governance`: Selection, composition, supply-chain, upgrade, and verification requirements for React component systems.

### Modified Capabilities

None.

## Impact

Updates the canonical shadcn rule and concise integration contracts in frontend stack, app foundation, experience/design, functional, quality, package preferences, routing metadata, and the rule changelog. No runtime application or external API changes.
