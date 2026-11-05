# I — PUBLISHING, SCHEDULING, RELIABILITY, AND COST

Load this category only when the article task, affected runtime boundary, or release risk selects it. The directives below are exact authorized requirements. Record applicability and live evidence in the adopting repository; policy presence is not runtime verification.

- **I01.** Store publishing timezone, local slots, daily target, site scope, portfolio limit, review policy, and cost limits in validated configuration visible to authorized operators.
- **I02.** Default to three slots for the configured site, with a clear timezone. Treat 09:00, 14:00, and 19:00 America/New_York as editable proposals rather than guaranteed best times.
- **I03.** Resolve local slots to UTC using an IANA timezone and explicit DST behavior. Cloudflare cron runs in UTC; a lightweight recurring dispatcher can claim due local slots safely. [S23]
- **I04.** Give each scheduled slot a unique site/local-date/slot identity; a unique constraint and atomic claim prevent duplicate execution after retries or concurrent dispatch.
- **I05.** Reserve topics against published, draft, scheduled, and in-progress work before generation; release abandoned reservations through a documented recovery path.
- **I06.** Run long editorial work in a durable workflow with small named stages, persisted outputs, timeouts, bounded retries, and observable state transitions. [S24]
- **I07.** Assume queue delivery can repeat. Make each consumer and each publishing side effect idempotent; reconcile uncertain outcomes before repeating a paid request. [S25]
- **I08.** Persist provider request/task IDs and generation operation keys. Reuse successful results on retry, and distinguish a timed-out response from a request that never reached the provider.
- **I09.** Track the lifecycle from idea to researched, drafted, checked, reviewed, scheduled, published, updated, archived, or failed, with actor, timestamp, and revision at each transition.
- **I10.** Build a configurable ready buffer, initially six approved articles when practical, to protect the daily cadence from provider outages and review delays.
- **I11.** Publish only eligible revisions. If a slot lacks a qualified article, use a qualified buffered one or record the missed slot; never weaken evidence or fabricate output to fill it.
- **I12.** Define catch-up behavior explicitly: spread recovery over future slots and preserve daily limits instead of releasing a burst of overdue posts at once.
- **I13.** Separate drafting from releasing. A workflow can research and compose concurrently while the scheduler only releases complete eligible revisions at the intended time.
- **I14.** Persist document and asset revisions before switching the published pointer. Reconcile R2/database partial failure and ensure the public renderer never references missing required assets.
- **I15.** Invalidate article, index, category, sitemap, and feed caches only after commit; make cache repair retryable without repeating publication or generation.
- **I16.** Support preview, unpublish, rollback to an earlier good revision, and restoration with an audit trail; preserve canonical redirects when an already-public slug changes.
- **I17.** Add dead-letter handling, manual retry of a specific failed stage, cancellation, and pause controls; resume from the last valid artifact rather than starting over.
- **I18.** Use per-provider concurrency limits, backoff with jitter, circuit breakers, and quota awareness. Avoid letting one site's backlog consume the entire shared provider allowance.
- **I19.** Estimate research, text, image, rendering, and review costs before work. Reserve a budget atomically and reconcile actual provider costs, including unsuccessful attempts when billed.
- **I20.** Enforce per-article, daily, monthly, and portfolio spend limits. Respect existing settings; expose missing budgets as configuration, not an excuse for unbounded paid calls.
- **I21.** Route images by accepted-output cost and evaluated quality; try the economical tier first and escalate only rejected or genuinely difficult assets within the remaining allowance.
- **I22.** Batch and cache reusable keyword research, permitted source metadata, unchanged evidence, and brand assets using appropriately scoped freshness keys.
- **I23.** Track cost per approved article, accepted image, research brief, and later qualified visit or conversion; keep raw generation cost separate from infrastructure and labor.
- **I24.** Avoid duplicate scheduler stacks. Integrate the current automation service or Cron/Workflows approach, and provide one authoritative place to pause and inspect the schedule.
- **I25.** Surface a concise progress UI with stage, artifacts, blockers, remaining work, and spend; stream useful status without exposing secrets or private model deliberations.
- **I26.** Record trace IDs across agent jobs, provider calls, article revisions, and deployment checks, using existing Langfuse, Sentry, and observability tooling.
- **I27.** Run a public post-publish smoke check for HTTP status, selected revision, assets, citations, canonical URL, and index/feed visibility; rollback or repair material failures.
- **I28.** Create operator-visible incidents for failed slots, budget blocks, provider errors, or source-quality failures; avoid automatically messaging external recipients unless authorized.
- **I29.** Back up canonical documents, references, revision metadata, and configuration using existing backup tooling; prove recovery on a representative article and its assets.
- **I30.** Provide a dry-run mode, controlled real-provider smoke run when authorized and configured, and a schedule simulation covering retries, DST, overlapping work, and partial failure.
