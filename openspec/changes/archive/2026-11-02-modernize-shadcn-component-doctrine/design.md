# Design

## Context

The current canonical rule assumes Radix everywhere, overstates inherited accessibility, conflicts with the stack rule on form libraries, and does not govern CLI v4 presets, registries, MCP, or third-party component sources.

## Goals / Non-Goals

**Goals:** centralize detailed doctrine in one rule; expose concise contracts in every relevant skill; provide surface recipes; make source provenance and upgrades auditable.

**Non-Goals:** force migrations of stable apps; mandate every available component; install MCP globally; replace product-specific visual design with stock shadcn styling.

## Decisions

1. New apps use Base UI, stable Radix apps stay on Radix, and React Aria is selected deliberately for collection-heavy, internationalized, or interaction-specialized surfaces. This follows current official support without churn.
2. Use three supply tiers: official shadcn controls, internal registry compositions, and audited third-party visual effects. Black-box runtime UI kits remain excluded.
3. Store `components.json`, decoded preset data, registry namespaces, and a component provenance manifest as the component contract. This makes agent work reproducible and reviewable.
4. Use shadcn `Field` as visual/semantic composition and TanStack Form as the new-app application-state default. React Hook Form remains valid for existing code and imported blocks.
5. Treat upgrades as source merges: inspect with CLI dry-run/view/diff, preserve local intent, then run Storybook, accessibility, visual, and E2E checks.

## Risks / Trade-offs

- [Broad guidance becomes stale] -> Keep volatile CLI facts and review date in the canonical rule, with official-source links.
- [Third-party registries introduce supply-chain risk] -> Copy source only after payload, dependency, license, and security review; pin external dependencies where supported.
- [Too many recipes create uniform products] -> Recipes govern semantics and state coverage; presets, tokens, composition, content, and media remain product-specific.

## Migration Plan

Update the canonical rule first, then add cross-links and concise obligations to related skills. Validate OpenSpec, links, formatting, and portable skill packaging; archive the completed change after verification.

