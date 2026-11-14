---
name: "F14 — Content, analytics, and observability"
familyId: "F14"
defaultLayer: "observability"
defaultTier: "required_ci"
itemCount: 30
---

# F14: Content, analytics, and observability (F14.01–F14.30)

- **Default Verification Layer**: `observability`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F14.01` | **Title, description, and canonical validation** | Verify unique <title>, meta description, and canonical URL on /, /t/:id, /blog, and /blog/:slug. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.02` | **Robots and sitemap publication policy** | Include only published routes in sitemap.xml and sitemap-blog.xml; stamp noindex on 404 slugs. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.03` | **Locale and language metadata consistency** | Verify inLanguage and locale metadata match rendered article content. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.04` | **JSON-LD to visible HTML parity** | Verify buildArticleJsonLd headline, wordCount, datePublished, and authors match visible DOM. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.05` | **No-JS crawler HTML completeness** | Verify Cloudflare Worker HTMLRewriter serves per-theme and per-article metadata without JS. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.06` | **Internal link and citation anchor integrity** | Verify all nav links, #source-<id> citation links, and #cite-ref-<id> back-links resolve. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.07` | **Anti-placeholder and anti-slop scan** | Reject Lorem ipsum, TODO, placeholder copy, and banned AI slop words in auditEditorialWritingAndStructure. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.08` | **Factual and numerical calculation verification** | Verify worked calculations via evaluateRecordedCalculation against declared tolerances. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.09` | **Search snippet and RSS feed encoding** | Verify /blog/rss.xml valid RSS 2.0 XML with CDATA titles/descriptions and permalink GUIDs. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.10` | **Notification sink capture** | Route magic-link and operational alerts to in-memory/test sinks during automated tests. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.11` | **Analytics event schema validation** | Validate all emitted events against EditorialAnalyticsEventSchema. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.12` | **Analytics event deduplication** | Deduplicate repeated events by eventId and idempotency key in AnalyticsEventCollector. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.13` | **Consent-gated telemetry emission** | Drop non-essential analytics events when consentGranted is false. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.14` | **Anonymous-to-authenticated identity separation** | Prevent cross-tenant or cross-user session leakage on sign-in/sign-out transitions. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.15` | **Error boundary and diagnostic attribution** | Attach revisionId and component identifiers to runtime error reports. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.16` | **Correlation and trace ID propagation** | Propagate workflow runId and traceId across all stages and provider operations. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.17` | **AI telemetry provenance** | Record modelId, promptHash, and actualCostMicroUsd on every generated asset and operation. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.18` | **Failure-preserving trace sampling** | Always retain traces and diagnostics for failed release gates and rollbacks. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.19` | **Audit log to business outcome parity** | Verify EditorialAuditLog entries match committed membership and publication state changes. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.20` | **Synthetic alert routing verification** | Verify budget warning (80%) and hard-stop (100%) alerts trigger deterministically. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.21` | **Operations dashboard accuracy** | Verify generateWeeklyOperationsDashboard reconciles published slots, buffer depth, and spend. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.22` | **Bounded metric label cardinality** | Use bounded enum labels (role, slotIndex, stage, status) in operational metrics. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.23` | **Log and artifact secret redaction** | Verify redactDataForSeoSecrets and magic-link redaction strip all credentials. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.24` | **Health and readiness endpoint truth** | Verify /api/blog/health and /api/blog/slots report live readyBufferCount and slot config. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.25` | **SLI numerator and denominator accuracy** | Track qualified reader engagement and valid slot completion rates accurately. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.26` | **Non-blocking telemetry failure handling** | Ensure analytics collector failures never block article rendering or publishing. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.27` | **UTC and IANA timezone consistency** | Store ISO-8601 UTC timestamps while preserving explicit America/New_York slot metadata. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.28` | **Explicit missing-telemetry reporting** | Distinguish unmeasured/null metrics from zero values in KeywordBrief and ComparisonTable. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.29` | **Executable documentation verification** | Verify code examples and commands in docs/blog-publishing and skill references. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
| `F14.30` | **Synthetic traffic marking** | Flag synthetic smoke checks and test runs so they never pollute production conversion metrics. | `observability` | `required_ci` | `verified` | `apps/web/e2e/seo.spec.ts & packages/blog/src/analytics.ts` |
