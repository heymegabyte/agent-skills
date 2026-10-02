# Cloudflare Release Scout — state + decisions

Owned by role 14 (Technology Scout), ~every 4 fires. Feeds: developers.cloudflare.com
available-RSS-feeds set (developer platform + product feeds + deprecations). Protocol:
dedupe by GUID → record source + publication date → inspect current docs → evaluate
fit/maturity/limits/cost/migration/security/measurable benefit → DECISION (pilot |
backlog | watch | reject-with-reason). Urgent deprecations jump the cadence. Feed outage
never blocks core verification. Browser API/platform changes also feed role 18's
capability registry.

Feed URLs (verified 2026-09-29): `changelog/rss/{index,developer-platform,workers,workers-for-platforms,d1,r2,kv,durable-objects,queues,workflows,ai-gateway,workers-ai,pages}.xml` + `fundamentals/api/reference/deprecations/index.xml`. No browser-rendering feed (404) — Browser Run items ride the aggregate.

## Seen GUIDs

GUID = `changelog/post/<slug>/` unless noted. Sweep 1 (fire-54, 2026-09-29) — 44 changelog + 10 deprecations:

- dev-platform: 2026-09-29-user-insights-task-analysis · 2026-09-29-concurrent-session-connections · 2026-09-29-remove-disk-to-memory-ratio · 2026-09-29-mesh-workers-vpc-network-logs · 2026-09-28-webmcp-api · 2026-09-28-cloudflare-cli-beta · 2026-09-27-workflow-ctx-exports · 2026-09-25-crawl-event-subscriptions · 2026-09-25-sending-domain-suppressions · 2026-09-25-custom-span-apis · 2026-09-25-release-flows-workers-metrics · 2026-09-24-r2-bandwidth-metrics · 2026-09-24-workflow-exports
- workflows: 2026-09-17-instance-delete · 2026-09-15-instance-event-subscriptions · 2026-09-10-paid-retention-default · 2026-08-04-build-and-deploy-on-push · 2026-07-09-dynamic-retry-delays · 2026-07-07-workflows-billing-updates · 2026-06-16-rollback-options · 2026-06-05-saga-rollbacks
- d1: 2026-09-01-d1-free-tier-limit-enforcement · 2026-06-04-billable-usage-product-sidebar · 2026-06-04-migrations-pattern
- durable-objects: 2026-09-24-durable-object-name-search-limit · 2026-09-17-javascript-rpc-session-spans · 2026-08-28-durable-objects-dynamic-workers-limit · 2026-08-25-durable-object-alarm-abort-no-retry · 2026-08-20-durable-objects-deployments-tab
- queues: 2026-07-15-event-subscriptions · 2026-05-19-event-subscriptions · 2026-04-28-improved-queues-metrics
- workers-ai: 2026-09-17-reject-if-busy · 2026-08-28-glm-5.3-workers-ai · 2026-08-26-glm-5.3-flash-workers-ai · 2026-08-17-qwen-3.8-27b-workers-ai · 2026-08-14-deepseek-v4-workers-ai
- wfp: 2025-12-18-dashboard-improvements · 2025-09-02-increased-static-asset-limits · 2025-06-17-workers-terraform-sdk-api-fixes · 2025-04-15-workers-api-fixes · 2025-04-08-fullstack-on-workers · 2025-02-20-synchronous-uploads · 2025-01-31-workers-platforms-static-assets
- deprecations (`fundamentals/api/reference/deprecations/#<anchor>`): zone-settings-batch-api · foundation-dns-boolean-setting · account-name-65-character-limit · account-roles-api · workers-kv-legacy-namespace-routes · zero-trust-networks-route-endpoints · ampsxg-api-and-rules · legacy-registrar-domain-management-api · gateway-audit-ssh-rules · service-key-authentication

## Decisions

### Sweep 1 — 2026-09-29 (fire-54)

**URGENT deprecations: NONE.** Legacy Registrar API (EOL 2026-09-27) verified NON-impacting — `services/cf_registrar.ts` already uses the NEW endpoints (`POST /registrar/domain-check` + `POST /registrar/registrations`), not the EOL'd `GET/PUT /registrar/domains{,/:name}`. Grep-verified zero usage of: KV legacy `/workers/namespaces` routes (EOL 10-15), `X-Auth-User-Service-Key` (EOL 09-30), zone-settings batch. Fixed stale `env.ts` comment that still cited the dead legacy register endpoint. Remaining 6 deprecations touch products we don't use.

- 2026-09-29 · **Browser Run multi-client sessions** · dev-platform — **PILOT** — attach journey driver + screenshot/console observer to ONE session; kills per-client cold start for Deep UI Explorer + long-trail runs. BACKLOG § cf-releases.
- 2026-09-25 · **Workers tracing custom span APIs** (startSpan/recordException/getActiveSpan/setAttributes) · dev-platform — **PILOT** — instrument site-gen phases + WfP dispatch; structured-tracing doctrine made concrete. BACKLOG § cf-releases.
- 2026-09-17 · **Traces auto-include JS RPC session spans (DO boundary)** · durable-objects — watch — automatic, zero work; verify spans cross into SITE_BUILDER/psnotify DOs during the tracing pilot.
- 2026-09-27/24 · **Workflows in `exports` + `ctx.exports` invocation** · workflows — backlog — drop workflow binding boilerplate next time wrangler.toml is touched; less binding drift.
- 2026-09-15 · **Workflow `.subscribe()` event streaming** · workflows — backlog — replace status polling in the live build stream with real-time instance events.
- 2026-09-17/10 · **Instance batch delete + 7-day default retention (new workflows)** · workflows — backlog — retention hygiene: purge terminal site-gen instances; existing workflows keep 30d, note for new ones.
- 2026-06-16/05 · **Saga rollback handlers + step context** · workflows — backlog — compensating cleanup (R2 partials, D1 status) on failed builds instead of stranded `error` rows.
- 2026-07-09 · **Dynamic retry delay functions** · workflows — watch — adopt opportunistically when next editing pipeline retry logic.
- 2026-07-07 · **Workflows per-step billing (live since ~2026-08-10)** · workflows — watch — fold step-count check into next Cloudflare billing audit.
- 2026-09-25 · **Browser Run crawl events → Queues** · dev-platform/queues — backlog — event-driven source-site crawl progress feeding the live build stream; requires enabling Queues (binding currently optional).
- 2026-09-28 · **WebMCP / document.modelContext in Browser Run (Kitesurf)** · dev-platform — watch — spec still moving; revisit for AI-native generated-site exposure + role 18 capability registry.
- 2026-09-17 · **Workers AI `rejectIfBusy`** · workers-ai — backlog — fail-fast to fallback model in generation path instead of queue-waiting; pairs with provider-scoped LLM fallback.
- 2026-08-14→28 · **New Workers AI models: DeepSeek V4 (1M ctx), Qwen 3.8 27B (vision), GLM-5.3** · workers-ai — watch — candidates for vision-QA + first-pass content on the CF rail; gate any swap behind evals.
- 2026-09-29 · **AI Gateway User Insights task analysis** · dev-platform — watch — dashboard-side cost/model insight; no integration work.
- 2026-09-29 · **Containers: disk no longer tied to memory (≤20GB)** · dev-platform — watch — no observed disk pressure in SITE_BUILDER/app-runtime builds; revisit on disk-bound build failures.
- 2026-09-28 · **Cloudflare CLI `cf` beta** · dev-platform — watch — wrangler stays the rail until `cf` reaches deploy+D1+R2 parity.
- 2026-09-24 · **R2 bandwidth metrics** + 2026-06-04 **budget alerts in product sidebars** · r2/d1 — watch — set budget alerts + read bandwidth during next billing audit; dashboard-only.
- 2026-09-25 · **Releases/gradual deploys overlaid on Workers Metrics** · dev-platform — watch — dashboard QoL for deploy-regression correlation.
- 2026-06-04 · **D1 `migrations_pattern` (nested/Drizzle layouts)** · d1 — watch — our migrations are flat; relevant only if Drizzle-managed migrations land.
- 2026-08-25 · **DO alarm `retryAlarm` abort option** · durable-objects — watch — default retry behavior is what our DOs want.
- 2026-09-01 · **D1 free-tier daily limit enforcement** · d1 — reject — account is Workers Paid; per-site D1s unaffected.
- 2026-09-25 · **Email Service domain-scoped suppressions** + 2026-07-15 **email events → Queues** · dev-platform/queues — reject — SES is the sole email rail (ADR-0019); CF Email Service not in stack.
- 2026-08-28 · **DO Dynamic Workers limit 4→10** · durable-objects — reject — we dispatch via WfP namespace binding, not DO dynamic workers.
- 2025-12-18 · **WfP dashboard improvements** (+ 6 older 2025 WfP items) · wfp — reject — namespaces are API-managed; dashboard QoL only; 2025 items pre-date our WfP adoption and are already absorbed.
- Irrelevant (counted, not listed): 6 items — Mesh/VPC log fields, DO name-search limit, DO deployments tab, Artifacts push-deploy, Artifacts queue events, Queues backlog metrics (product not enabled).

### Standing (pre-sweep)

- 2026-09-29 · **Browser Run CDP endpoint** (product docs, verified at implementation time)
  — `wss://api.cloudflare.com/client/v4/accounts/{acct}/browser-run/devtools/browser` +
  Bearer token with "Browser Run Write" → **PILOT → ADOPTED** same fire: the Deep UI
  Explorer's primary browser (proven session, deep path green). Older Workers-binding
  Browser Rendering remains the Worker-side gateway path.
