# Shared platform research — 2026-10-31

Primary-source review supporting the platform rules and execution prompt. These findings are implementation constraints, not a claim that the products are integrated. Recheck changing APIs, account entitlements, limits, licenses and versions at implementation time. Recommendations and threat models below are our synthesis, not vendor guarantees.

## A. Agent protocols and generated UI

- json-render's official source is [vercel-labs/json-render](https://github.com/vercel-labs/json-render). Its [catalog](https://json-render.dev/docs/catalog) constrains components/actions; [SpecStream](https://json-render.dev/docs/streaming) carries progressive JSONL patches. The [AG-UI example](https://json-render.dev/docs/ag-ui) explicitly says it is illustrative, so production adapters must supply authorization, persistence, recovery and schema compatibility.
- Use the official [AG-UI event model](https://docs.ag-ui.com/concepts/events) and supported SDK version. Separate streamed text/tool arguments from confirmed execution results. Version optional/custom activity events and test reconnect/cancel/interrupt rather than assuming transport provides durable execution.
- [MCP Apps](https://apps.extensions.modelcontextprotocol.io/api/documents/overview.html) adds sandboxed interactive tool resources with a host bridge. Use capability negotiation, restrictive CSP and non-UI fallbacks; ordinary MCP tool permission is still required.
- [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility) and [performance](https://reactflow.dev/learn/advanced-use/performance) guidance support a lazy, keyboard-accessible canvas. Core-library licensing does not automatically authorize copying Pro examples.
- [Bolt.diy](https://github.com/stackblitz-labs/bolt.diy) is the selected builder foundation. [WebContainers commercial terms](https://webcontainers.io/enterprise) distinguish commercial production licensing from prototyping. Preserve a runtime adapter rather than depending on unlicensed production use.

## B. Cloudflare execution and service selection

- [Cloudflare Agents](https://developers.cloudflare.com/agents/) provides stateful agent foundations. [Workflows integration](https://developers.cloudflare.com/agents/concepts/workflows/) covers durable jobs; [routing authentication](https://developers.cloudflare.com/agents/runtime/routing/authentication/) informs authorization at the connection boundary.
- [Queues delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/) are at-least-once, so connector writes and render requests require deduplication/idempotency or reconciliation.
- [WfP bindings](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/configuration/bindings/) are capability grants. Isolate customer Workers and resources from the trusted control plane; shared prefixes alone are not dedicated resource isolation.
- Review the [complete Cloudflare directory](https://developers.cloudflare.com/directory/) using an adopt/defer/not-applicable matrix. Prefer fit, maturity, measurable benefit and approved budgets to service-count maximization. Existing email/payment choices are not automatically superseded.

## C. Better Auth

- [Installation](https://better-auth.com/docs/installation), [database adapters](https://better-auth.com/docs/adapters/other-relational-databases), [organizations](https://better-auth.com/docs/plugins/organization), and [OAuth provider](https://better-auth.com/docs/plugins/oauth-provider) establish the supported auth surface. Role configuration does not scope application queries automatically. OAuth consent removal and issued-token revocation are distinct operations.
- [Better Auth 1.7](https://better-auth.com/blog/1-7) documents the SCIM transaction requirement and D1 limitation for that feature. This is not a blanket rejection of D1 for Better Auth. Choose and test the exact database/plugin/runtime combination.
- Our deployment recommendation: preserve existing identities, use audited OAuth/OIDC with app-local sessions across unrelated domains, and migrate with explicit rollback. Do not attempt a shared parent cookie across these domains.

## D. AI Search authorization and freshness

- [Per-tenant search](https://developers.cloudflare.com/ai-search/how-to/per-tenant-search/) supports tenant-isolated instances or filtered shared search. Resolve tenant identity server-side; never trust an example's caller-supplied tenant header as authorization.
- [Metadata](https://developers.cloudflare.com/ai-search/configuration/indexing/metadata/) currently allows five custom fields. [Filtering](https://developers.cloudflare.com/ai-search/configuration/retrieval/filtering/) has short-string indexing constraints, including the first 64 UTF-8 bytes; do not encode long path/array ACLs as if unrestricted.
- [Syncing](https://developers.cloudflare.com/ai-search/configuration/indexing/syncing/) is asynchronous: source sync schedules, triggers and direct uploads have different behavior. Our design requires authoritative tombstones/ACL versions and permission checks before a candidate reaches the model, plus durable ingestion, deletion tests and reconciliation. An accepted sync request is not freshness evidence.

## E. PlateJS publishing

- [Plate AI](https://platejs.org/docs/ai), [suggestions](https://platejs.org/docs/suggestion), [static rendering](https://platejs.org/docs/static), and [installation](https://platejs.org/docs/installation) support selection-aware rich-content editing in its React ecosystem. Use canonical adapters inside other frameworks instead of assuming native Angular support.
- The [Plate license](https://github.com/udecode/plate/blob/main/LICENSE) has a permissive default with exceptions. [Plate Plus terms](https://pro.platejs.org/terms) restrict product-building end products and separate redistribution. Default to permitted open-source capabilities and independently authored UX; obtain explicit rights before embedding restricted commercial pieces in a site builder or shared distributable.
- Our publishing design uses immutable revisions, permission checks, draft-safe caches and durable cache/search/SEO effects. Plate does not supply that complete multi-tenant publishing service merely by installation.

## F. Integrations and secrets

- [Nango's license](https://github.com/NangoHQ/nango/blob/master/LICENSE) contains the ELv2 hosted/managed-service restriction. The [project](https://github.com/NangoHQ/nango) is a useful capability reference, not blanket permission to offer a competing fork. Track rights per reused file; independently implement restricted capabilities from public provider APIs.
- [Activepieces licensing](https://www.activepieces.com/docs/about/license) separates MIT core from enterprise/cloud terms. Its [runtime architecture](https://www.activepieces.com/docs/install/architecture/overview) relies on Postgres/Redis and execution machinery that must be adapted, not imported unchanged into Workers.
- [Infisical Agent Vault](https://github.com/Infisical/agent-vault), [credential stores](https://docs.agent-vault.dev/learn/credential-stores), [agent protocol](https://docs.agent-vault.dev/agents/protocol), and [security](https://docs.agent-vault.dev/learn/security) support scoped credential brokering. Keep Infisical authoritative and broker administration separate from agents. Preview APIs require pins and tests.
- Our runtime safeguard: HTTP_PROXY variables are not equivalent to enforced egress, and Workers fetch must not be assumed to honor them. Verify the actual broker path, redirection and direct-network restrictions. Secret non-disclosure alone does not prevent abuse of an authorized API.

## G. Remotion capability and upstream maintenance

- Official [agent skills](https://www.remotion.dev/docs/ai/skills), [parameterized rendering](https://www.remotion.dev/docs/parameterized-rendering), and [captions](https://www.remotion.dev/docs/captions) support typed, previewable compositions and caption workflows.
- Reviewed `remotion-dev/skills` at commit `30d4553ecd46fbc5212fd0ff006ae43af522158b`; router version `4.0.539`, blob `1aac6dbbf9941672c70e910290dfc1afef0a2bac`. The inspected root tree has no LICENSE and package.json has no license field. This package incorporates original operational synthesis and source pointers, not copied upstream text. The absence of a root license is not a legal conclusion about all upstream rights; verify before vendoring.
- [Cloudflare Containers guidance](https://www.remotion.dev/docs/cloudflare-containers), updated October 29, 2026, explicitly labels its example a proof of concept without production auth, queueing, rate limiting, client progress or error propagation. Harden those and validate browser/codec/runtime support before exposing it.
- [Remotion terms](https://www.remotion.dev/docs/terms) and [license/pricing](https://www.remotion.dev/docs/license/pricing) distinguish eligible free use, paid/automation terms, parameterized/service-generated compositions and hosting arbitrary customer-supplied Remotion projects. The latter requires explicit written approval under the reviewed terms. Recheck actual offering and account eligibility, not a guessed price.

## H. Observability and evaluation

- [Langfuse compatibility](https://langfuse.com/docs/compatibility) specifies **November 16, 2026** removal of remaining legacy Cloud APIs/features/ingestion. Audit current integrations before that date, use supported OpenTelemetry ingestion and current read APIs, and verify runtime compatibility. Do not declare every legacy endpoint removed: scores and some paths have separate support rules.
- [Promptfoo CI](https://www.promptfoo.dev/docs/integrations/ci-cd/), [assertions](https://www.promptfoo.dev/docs/configuration/expected-outputs/), and [red-team configuration](https://www.promptfoo.dev/docs/red-team/configuration/) support automated regression/security gates. Prefer synthetic or authorized fixtures; review remote generation/sharing settings before sending private content.
- Preserve the existing seven-system instrumentation contract. Use common correlation and privacy controls, separate product/marketing/AI/operational purposes, and prove delivery with real authorized receipts. Installation and mocks are not production evidence.
