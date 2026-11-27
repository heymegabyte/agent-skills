---
name: 'theme-tools-canonical-components'
priority: 1
pack: 'design'
triggers:
  - 'ui.theme.tools'
  - 'theme.tools'
  - 'storybook'
  - 'components'
  - 'oneprompt'
  - 'projectsites'
  - 'figma'
paths:
  - 'concern:frontend'
  - 'concern:design-system'
last_reviewed: 2026-10-31
superseded_by: null
---
# Canonical Components, Themes, and Approval

User directive, 2026-10-31. This rule supersedes older per-project UI defaults. For work that touches a covered surface, load the [full component governance and implementation rules](../reference/theme-tools-component-governance.md) before choosing or changing components, libraries, manifests, editorial behavior, or preview architecture.

- `heymegabyte/theme.tools` is the canonical source for shared TypeScript libraries, engines, themes, tokens, and cross-site utilities. Name packages for capabilities. Contribute reusable behavior upstream and adopt it in affected consumers. Keep credentials, tenant content, API calls, and business entitlements outside reusable components.
- The default 28-library foundation is: `@theme.tools/themes`, `@theme.tools/ui`, `@theme.tools/blog`, `@theme.tools/catalog`, `@theme.tools/testing`, `@theme.tools/workflows`, `@theme.tools/integrations`, `@theme.tools/social`, `@theme.tools/scheduling`, `@theme.tools/signing`, `@theme.tools/forms`, `@theme.tools/links`, `@theme.tools/keys`, `@theme.tools/notifications`, `@theme.tools/crm`, `@theme.tools/inbox`, `@theme.tools/billing`, `@theme.tools/status`, `@theme.tools/kb`, `@theme.tools/dataplane`, `@theme.tools/telemetry`, `@theme.tools/auth`, `@theme.tools/flags`, `@theme.tools/agent-ui`, `@theme.tools/seo-geo`, `@theme.tools/media-video`, `@theme.tools/crawl-research`, and `@theme.tools/i18n-a11y`. Treat this as the governed default catalog, not a requirement to install inapplicable packages in every consumer.
- All visual surfaces use canonical `@theme.tools/ui` or `@theme-tools/ui` components published through the source behind `ui.theme.tools`. Do not copy per-project visual kits or introduce Angular or Spartan UI as an alternate component system. Themes and tokens come from theme.tools. Consumer applications own routing, content, data, permissions, and thin composition configuration.
- Search existing exports and Storybook first. Extend or add missing components and engines in theme.tools before implementing consumer wiring. Retain source licenses and document public exports, dependencies, states, accessibility, runtime compatibility, and migration details.
- Use versioned packages and verify affected consumers. Storybook is the visual catalog and review surface. Git owns source and package distribution uses the established registry. Preserve rollback support and avoid mutable hosted JavaScript dependencies.
- Obtain explicit approval of the current Figma artifact before implementing a new or materially changed design. General implementation requests do not approve designs. Follow the approved artifact, the universal navigation standard, and the direct draw-to-edit constraints in the detailed rules.
- Reuse the complete available Blog registry for build-time component selection and keep preview payloads lazy. Use canonical thin-shell and typed renderer contracts. For OnePrompt, follow manifest-first progressive generation, preserve editing and preview boundaries, and verify required telemetry delivery and production approval separately.
- Preserve existing deployment, account, budget, and authorization boundaries. Use evidence for design, package, consumer, and production status. Follow the bounded improvement loop for approved changes.
