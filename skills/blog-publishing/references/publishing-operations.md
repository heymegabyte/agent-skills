# Publishing Operations, Three Daily Slots, Security, and Budgets (`I01–K30`)

Implementation modules: `@theme-tools/blog/publishing`, `@theme-tools/blog/auth`, `@theme-tools/blog/workflow`, and `@theme-tools/blog/analytics`.

## 1. Three Daily Publishing Slots & DST Handling (`I01–I10`)

- Configured default schedule for `theme.tools`: **`09:00`, `14:00`, and `19:00` in `America/New_York`**.
- `resolveLocalSlotToUtc(localDate, localSlotTime, "America/New_York")` converts local slot times to exact UTC ISO timestamps across both EDT (`UTC-4`) and EST (`UTC-5`) DST transitions.
- `PublicationSchedulerEngine` enforces:
  - **Minimum 6-article ready buffer** (`>= 2 days` of release-eligible inventory) before auto-claiming slots.
  - **Idempotent slot claims** (`claimSlotAtomically`) keyed by `siteId + localDate + slotIndex`.
  - **Gradual catch-up after outage**: Never dumps a backlog in a single burst (`planOutageCatchUp`).

## 2. Atomic Publish, Smoke Verification, and Rollback (`I18–I25`)

`PublicationSchedulerEngine.publishSlotAtomically`:

1. Verifies the target `ArticleRevision` passed all 12 checks in `runQualityAndReleaseGate` and holds an approved `ReviewRecord` matching `contentHash + bibliographyHash + visualSetHash`.
2. Switches `publishedRevisionId` atomically while recording `previousPublishedRevisionId`.
3. Runs post-publish smoke checks (HTTP 200, canonical URL match, zero broken citation anchors, valid JSON-LD).
4. Automatically rolls back `publishedRevisionId` to `previousPublishedRevisionId` if the smoke check fails.

## 3. Authentication vs. Site Authorization (`K01–K25`)

- **OAuth & Magic-Link Hardening**:
  - `OAuthFlowGuard`: Enforces PKCE (`S256`), single-use cryptographic `state`, and strict redirect URI allowlisting for Google and GitHub sign-in.
  - `MagicLinkTokenStore`: Stores only SHA-256 token digests (`createHash("sha256")`), enforces 15-minute TTL, single-use consumption, per-email/IP rate limits, and redacts raw tokens from logs.
- **6-Role RBAC (`authorizeEditorialAction`)**:
  - `viewer`: Read public articles only (default for signed-in visitors without site membership).
  - `reviewer`: Read drafts and submit review records.
  - `author`: Create and edit drafts (`article:create_draft`, `article:edit_draft`).
  - `editor`: Author permissions + approve reviews (`article:approve_review`).
  - `publisher`: Editor permissions + schedule slots and publish/unpublish live revisions.
  - `owner`: Full tenant and membership administration.

## 4. Micro-USD Budget Accounting (`I26–I30`)

`MicroUsdBudgetManager` tracks every DataForSEO, LLM, and image-generation call in integer micro-USD (`1 USD = 1,000,000 micro-USD`), enforcing per-article, per-day, and per-month caps with circuit-breaker degradation before hard exhaustion.
