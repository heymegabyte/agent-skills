---
name: "F04-system-and-e2e-journeys"
family: "F04"
title: "F04 — System and end-to-end journeys"
default_layer: "browser-e2e"
default_tier: "required-ci"
recommendations_count: 30
updated: "2026-11-04"
---

# F04 — System and end-to-end journeys (30 Recommendations: F04.01–F04.30)

> **Summary**: Critical existing journeys, persisted business outcomes, first-use onboarding, tenant switching, payment/entitlement lifecycles, authenticated deep links, session expiry, connectivity/outage recovery, and bounded observable synchronization.
> **Default Layer**: `browser-e2e` · **Default Execution Tier**: `required-ci` · **Primary Tools**: Playwright Test, Cloudflare Browser Run CDP, Stagehand (discovery only)

## Reusable Implementation & Verification Pattern

- **Shared Utilities**: Import deterministic helpers, catalogs, and gate validators from `@theme-tools/ui/testing`.
- **Selective Execution**: Map every test in this family to its upstream source/token/contract/schema inputs in `computeAffectedTestSelection`.
- **Pass/Fail Oracle**: Derive expected values from domain rules or independent calculations (`F15.02`); never copy implementation logic into assertions.

## Complete F04 Recommendation Catalog (F04.01–F04.30)

| ID | Title | Priority | Layer | Tier | Pilot Status | Directive & Pass/Fail Oracle |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`F04.01`** | Existing critical journeys | `P0` | `browser-e2e` | `required-ci` | `verified` | Inventory critical journeys by user harm and business impact, establishing trustworthy coverage before peripheral screens. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.02`** | Persisted business outcomes | `P0` | `browser-e2e` | `required-ci` | `verified` | Finish each critical journey by checking the meaningful persisted result rather than relying on a success toast. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.03`** | First-use completion | `P0` | `browser-e2e` | `required-ci` | `verified` | Exercise first-use account creation and onboarding through the real system to first meaningful task completion. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.04`** | Tenant switching | `P0` | `browser-e2e` | `required-ci` | `verified` | Switch between tenants with distinguishable records and verify navigation, caches, drafts, and operations stay scoped. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.05`** | Representative actor journeys | `P0` | `browser-e2e` | `required-ci` | `verified` | Execute critical workflows as representative authorized roles, verifying action availability and completed outcomes. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.06`** | Resource lifecycle | `P0` | `browser-e2e` | `required-ci` | `verified` | Exercise create, edit, archive, and restore flows across navigation and reload, verifying UI and persisted state agree. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.07`** | Payment lifecycle | `P0` | `browser-e2e` | `required-ci` | `verified` | Exercise checkout, async payment confirmation, and refund outcomes with sandbox instruments and provider events. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.08`** | Entitlement changes | `P0` | `browser-e2e` | `required-ci` | `verified` | Exercise plan and seat changes, verifying entitlement updates reach existing sessions and affected workflows. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.09`** | External connection lifecycle | `P0` | `browser-e2e` | `required-ci` | `verified` | Complete integration setup, use, revoked access, and reconnection without corrupting existing application data. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.10`** | Authenticated deep links | `P0` | `browser-e2e` | `required-ci` | `verified` | Open protected deep links from a fresh session, authenticate, and verify destination and operation survive redirects. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.11`** | Session expiry during work | `P1` | `browser-e2e` | `required-ci` | `verified` | Expire a session during a critical task and verify recovery preserves input and avoids duplicate committed operations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.12`** | Refresh and draft recovery | `P1` | `browser-e2e` | `required-ci` | `verified` | Reload or reopen draft workflows after intermediate steps, verifying saved progress and unsaved-change messaging. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.13`** | Connectivity recovery | `P1` | `browser-e2e` | `required-ci` | `verified` | Interrupt connectivity during critical interactions and verify offline feedback, recovery, and server reconciliation. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.14`** | Dependency outages | `P1` | `browser-e2e` | `required-ci` | `verified` | Make a critical upstream dependency unavailable and verify accurate failure, useful recovery, and no false completion. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.15`** | Duplicate submission | `P1` | `browser-e2e` | `required-ci` | `verified` | Repeat submissions through rapid activation and response loss, proving a single logical operation is created. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.16`** | Concurrent editing | `P1` | `browser-e2e` | `required-ci` | `verified` | Have two isolated users edit the same resource and verify conflict detection, merging, or last-writer behavior. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.17`** | Locale-sensitive journeys | `P1` | `browser-e2e` | `required-ci` | `verified` | Complete date, currency, and quantity workflows using representative locales and timezones consistently. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.18`** | File journeys | `P1` | `browser-e2e` | `required-ci` | `verified` | Upload, process, and download representative files through the complete application, checking integrity and ownership. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.19`** | Multi-step cancellation | `P1` | `browser-e2e` | `required-ci` | `verified` | Cancel and resume multi-step workflows at consequential boundaries, verifying temporary resources and progress. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.20`** | Email-linked actions | `P1` | `browser-e2e` | `required-ci` | `verified` | Follow invitation or recovery links in controlled test inboxes across valid, expired, and already-used states. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.21`** | Background-job completion | `P1` | `browser-e2e` | `required-ci` | `verified` | Start a critical background job through the UI and observe completion or failure and produced resource access. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.22`** | Observable synchronization | `P1` | `browser-e2e` | `required-ci` | `verified` | Wait for meaningful system conditions with bounded polling or event signals rather than arbitrary sleeps. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.23`** | Real external seams | `P2` | `browser-e2e` | `required-ci` | `verified` | Keep a small authorized sandbox journey for critical external providers to verify credentials, routing, and callbacks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.24`** | Feature rollout journeys | `P2` | `browser-e2e` | `required-ci` | `verified` | Exercise risk-relevant flag combinations using explicit assignments and preserve assignments with journey evidence. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.25`** | Browser history | `P2` | `browser-e2e` | `required-ci` | `verified` | Use back, forward, refresh, and direct navigation around mutations without silently resubmitting operations. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.26`** | Search-to-export consistency | `P2` | `browser-e2e` | `required-ci` | `verified` | Apply filters, ordering, and pagination to known records, then export or act on results and verify scope parity. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.27`** | Multiple-tab behavior | `P2` | `browser-e2e` | `required-ci` | `verified` | Change critical state in another tab and verify stale views reconcile across sign-out, tenant change, and completion. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.28`** | Browser capability failures | `P2` | `browser-e2e` | `required-ci` | `verified` | Deny required browser permissions or disable optional capabilities during a journey and verify accurate fallbacks. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.29`** | Upgrade continuity | `P2` | `browser-e2e` | `required-ci` | `verified` | Start from representative prior-release records and saved links, then complete current critical journeys. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
| **`F04.30`** | Mixed batch outcomes | `P2` | `browser-e2e` | `required-ci` | `verified` | Mix successful, rejected, and cancelled batch items and verify item-level results, retries, totals, and notifications. *(Evidence: `apps/ui/stories/testing-450-suite.test.ts#F04`)* |
