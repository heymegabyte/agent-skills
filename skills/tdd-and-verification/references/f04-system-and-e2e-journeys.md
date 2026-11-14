---
name: "F04 — System and end-to-end journeys"
familyId: "F04"
defaultLayer: "e2e_browser"
defaultTier: "required_ci"
itemCount: 30
---

# F04: System and end-to-end journeys (F04.01–F04.30)

- **Default Verification Layer**: `e2e_browser`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F04.01` | **Existing critical journeys** | Inventory critical journeys by user harm and business impact and protect them before peripheral screens. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.02` | **Persisted business outcomes** | Finish each critical journey by asserting the persisted revision/state rather than only a toast. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.03` | **First-use completion** | Exercise first-use onboarding and initial theme/article creation through the real interface. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.04` | **Tenant switching** | Switch between tenants/sites with distinguishable records and verify views and drafts stay scoped. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.05` | **Representative actor journeys** | Execute critical workflows as anonymous, viewer, author, editor, and publisher roles. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.06` | **Resource lifecycle** | Exercise create, edit, schedule, publish, and rollback flows across navigation and reload. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.07` | **Payment lifecycle** | Where applicable, exercise checkout, webhook confirmation, and refund reconciliation in sandbox. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.08` | **Entitlement changes** | Exercise role/membership grants and revocations and verify active sessions reflect updated rights. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.09` | **External connection lifecycle** | Complete external provider setup, cached fallback, revoked credentials, and recovery. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.10` | **Authenticated deep links** | Open protected authoring deep links, sign in, and verify destination and operation survive. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.11` | **Session expiry during work** | Expire a session during draft authoring and verify local offline recovery preserves unsent input. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.12` | **Refresh and draft recovery** | Reload during Plate draft authoring and verify saved progress and unsaved-change indicators. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.13` | **Connectivity recovery** | Interrupt connectivity during authoring/saving and verify offline indicator and reconnection sync. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.14` | **Dependency outages** | Simulate upstream AI/DataForSEO outage and verify graceful fallback without false completion claims. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.15` | **Duplicate submission** | Repeat publish/slot-claim submissions rapidly and prove single logical execution. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.16` | **Concurrent editing** | Have two editors modify the same article and verify optimistic concurrency conflict resolution. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.17` | **Locale-sensitive journeys** | Complete America/New_York DST slot scheduling and localized formatting across the journey. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.18` | **File journeys** | Upload, magic-byte validate, and render visual assets with usable error handling for bad files. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.19` | **Multi-step cancellation** | Cancel and resume multi-stage editorial workflows at checkpoint boundaries. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.20` | **Email-linked actions** | Exercise valid, expired, and single-use consumed magic-link tokens through user-visible outcomes. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.21` | **Background-job completion** | Start scheduled slot publication and observe completion, smoke check, and feed update. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.22` | **Observable synchronization** | Wait for DOM/network conditions with deterministic Playwright locators and zero arbitrary sleeps. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.23` | **Real external seams** | Keep bounded authorized smoke checks for external seams distinguishable from fixture runs. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.24` | **Feature rollout journeys** | Exercise feature-flagged components with explicit assignments recorded alongside evidence. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.25` | **Browser history** | Use back, forward, refresh, and direct navigation around theme and blog mutations safely. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.26` | **Search-to-export consistency** | Filter/sort comparison tables and export tokens proving exported data matches visible selection. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.27` | **Multiple-tab behavior** | Sign out or switch roles and verify offline drafts and session state reconcile cleanly. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.28` | **Browser capability failures** | Deny clipboard/storage permissions and verify graceful fallback without crashing the page. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.29` | **Upgrade continuity** | Import representative legacy articles/themes and complete current viewing and editing journeys. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
| `F04.30` | **Mixed batch outcomes** | Process batch seed/schedule operations mixing eligible and ineligible items with item-level reporting. | `e2e_browser` | `required_ci` | `verified` | `apps/web/e2e/blog.spec.ts & apps/web/e2e/showcase.spec.ts` |
