---
name: "platform-agent-ui"
priority: 1
pack: "platform"
triggers:
  - "ag-ui"
  - "json-render"
  - "mcp apps"
  - "bolt.diy"
  - "react flow"
paths:
  - "concern:agent-ui"
last_reviewed: 2026-10-31
superseded_by: null
---

# Agent interaction and generative UI contracts

Applies under [shared platform policy](platform-shared-capabilities.md). Sources: [research record](../reference/platform-research-2026-10-31.md), sections A and B.

## Four distinct contracts

- Cloudflare Agents owns durable session/execution coordination, not all business records. Workflows owns long-running job steps. Existing platform event persistence remains authoritative; add adapters rather than a second event log.
- AG-UI transports messages, tool activity, application-state projections, progress, results, errors and interaction requests. Use pinned official SDK schemas; never rename a proprietary log stream AG-UI.
- json-render defines catalog-constrained view specs and progressive SpecStream patches. Its AG-UI documentation is explicitly illustrative: production transport, authorization, persistence and recovery are our responsibility.
- MCP Apps exposes tools with sandboxed interactive resources and host capability negotiation. Unsupported hosts receive useful text/structured results. UI capability is not authorization.

## Real adapters and lifecycle

- Build tested producer/consumer adapters for Bolt chat and execution, general AI chat, live previews, editors, connector actions, Activepieces-derived runs, and video generation. Include cancellations, interruptions and session recovery in each adapter's acceptance test.
- Map observed events into the supported SDK's RUN, TEXT_MESSAGE, TOOL_CALL, STATE and activity event families. TOOL_CALL_END is not external success; emit a result only after confirmed execution. Namespace custom events and version their payloads.
- Negotiate optional/draft protocol features. Keep a compatibility table, fixtures and migration tests; do not assume every documented draft interrupt event exists in the installed SDK.
- Persist accepted domain changes before acknowledgement. Assign durable monotonically ordered cursors per authorized stream; support resumable subscription, bounded backfill, snapshots, deduplication and reconnect after retention gaps.
- IDs include tenant/project/session/thread/run/attempt/event/tool-call and document revisions where relevant. Derive identity and scope on the server; client-supplied tenant IDs, tool arguments or forwarded props are untrusted.
- Never broadcast secret or privileged Agent state to every subscriber. Construct safe per-audience projections and reauthorize connections, mutations, resumed sessions and sensitive commands after role/revocation changes.
- Cancellation is an authenticated command: propagate abort to supported providers/processes, checkpoint cancellation, suppress obsolete patches, and report irreversible side effects already completed. Stopping a browser stream alone does not cancel a render or connector operation.
- Human decisions bind actor, exact action/input digest, resource, revision, expiry and one-time decision nonce. On resume, recheck permissions/entitlements and changed inputs; never accept an old approval for a different action.
- Commands carry idempotency keys; delivery can repeat. Mark ambiguous external writes for reconciliation rather than blindly retrying them. Backpressure/coalescing may reduce render frequency, never erase audit-critical events.
- Do not stream hidden model chain-of-thought, secrets, unrestricted raw provider payloads or private connector responses. Expose factual progress and safe rationale summaries.

## json-render, catalog and smallest-sufficient edits

- Use the official vercel-labs/json-render project and its linked documentation; pin compatible packages. Wrap approved theme.tools components in a registry with stable IDs, strict prop schemas, children/slot constraints, theme compatibility, action capabilities and exact package versions.
- Bind views to approved, bounded data projections. No model-provided import URL, eval, arbitrary JavaScript, unsanitized HTML, unrestricted network request or arbitrary DOM props. Validate URL/action/HTML safety in component schemas, not only JSON shape.
- Adapt the existing OnePrompt composition schemas/reducer; do not discard working authorization, optimistic concurrency, receipts or undo to copy an illustrative demo. Define explicit lossless translations and reject unsupported operations.
- Start from a pinned theme.tools theme and a small prefetched component set. Research and layout selection run concurrently. Render the first valid shell/outline immediately, then validated content/media patches; mark provisional content honestly.
- States include queued, researching, waiting-for-content, streaming, validating, ready, failed, cancelled and stale. Keep last valid content, reserve layout dimensions, show region-local loading, and preserve focus/scroll/selection.
- Receive partial specs in a bounded staging buffer. Publish only schema-valid renderable subtrees, in atomic revisioned transactions. Byte/operation/depth/time limits apply before and after parsing; protect reserved keys and invalid graph structures.
- For ordinary edits choose props before component swap, component before stack, stack before page. Minimize the semantically sufficient affected set, not a rigid numerical cap. Global style/content requests may correctly touch many nodes.
- Preview changed content without npm installs, code generation or whole-app rebuilds. New executable behavior uses the reviewed code path, approved Figma scope and canonical library release.
- Use stable node IDs and structural sharing; test unchanged nodes/props, bounded render work, accessible announcements, undo/redo, revision conflicts, superseded requests and crash recovery.
- Before registration, support rectangle/lasso and keyboard outline selection inside an isolated preview. Resolve zoom/scroll/iframe coordinates to stable IDs, with preview-origin/session validation. Geometry does not grant mutation rights.
- Anonymous drafts use short-lived private capabilities, quotas, abuse checks and atomic claim transfer. Keep authorized editing after registration. Do not expose anonymous drafts to public search/caches or tenant credentials.

## Bolt and React Flow boundaries

- Extend the existing Bolt.diy editor instead of VibeSDK. Extract editor UI/services into first-party modules with shared navigation, Better Auth context, telemetry and project state; retain compatible existing projects and source export.
- Define runtime adapters for files/processes/builds/previews/logs/cancellation. Use supported isolated Cloudflare/container execution where suitable; gate commercial WebContainers production use on licensing and browser/header compatibility.
- React Flow visualizes workflows, dependency graphs and agent execution where it improves understanding. Use @xyflow/react's supported APIs and canonical node/edge components; do not replace useful lists/timelines with mandatory canvases.
- Keep graph semantics, versions, typed ports, branching/iteration rules, validation and execution in shared headless contracts. The canvas is not permission enforcement or the source of job progress.
- Provide keyboard/list equivalents, localized labels, grouping/collapse, stable layout and selection, lazy loading and measured graph budgets. Verify licenses for copied examples separately from core library licensing.

## MCP Apps boundary

- Use official ext-apps SDK resource registration, MIME/profile and capability negotiation for the installed version. Reuse canonical components for preview, scene approval, connector setup, document review and workflow inspection.
- Serve views in sandboxed iframes with narrow declarative CSP and verified SDK bridge semantics. Do not pass application cookies or tokens to arbitrary third-party views; avoid brittle wildcard postMessage handling or assumptions about opaque sandbox origins.
- UI-initiated tool calls use the same backend authorization, input validation, policy approvals, budgets and audit trail as direct calls. Restrict navigation, downloads, resource fetching and embedded media origins.
- Test against a compatible reference host and a non-UI client, including malformed messages, denied actions, cancellation and unavailable resources. Never claim universal host support from one working demo.
