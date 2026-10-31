---
name: "platform-content-media"
priority: 1
pack: "platform"
triggers:
  - "platejs"
  - "remotion"
  - "frontend editing"
  - "publishing"
  - "video generation"
paths:
  - "concern:content-media"
last_reviewed: 2026-10-31
superseded_by: null
---

# Shared frontend publishing and media capabilities

Applies under [shared platform policy](platform-shared-capabilities.md). Sources: [research record](../reference/platform-research-2026-10-31.md), sections E and G.

## PlateJS and inline authoring

- Standardize rich-content editing on PlateJS, not every editor domain: Bolt remains code editing; the page graph remains composition; React Flow remains workflow visualization; PDF layout stays document-specific.
- Wrap licensed Plate primitives in canonical ui.theme.tools packages and theme.tools tokens. Reuse strict document schemas, stable block IDs, serializer versions, static renderers and editor adapters across consumers.
- Show an obvious **Edit** toggle to authorized signed-in users on the frontend. Show a prominent **New blog post** button for authorized blog authors, including an actionable empty state. Never expose draft content through a cached signed-in variant.
- Support selection-aware AI rewrite/expand/shorten/translate, inline streaming suggestions, accept/reject, comments, media and keyboard operations. Capture block/selection IDs plus base revision; concurrent editing must rebase safely or require renewed selection.
- Stream proposed edits through AG-UI into a review/staging layer. Preserve document selection and undo grouping; partial model output must not corrupt the saved document. Cancelled or rejected AI operations must restore the correct prior state.
- Persist autosaved drafts with version checks, revisions, undo/redo, preview and conflict handling. Local recovery data must be scoped to the user/project and cleared appropriately on logout; no shared-device draft leakage.
- Separate draft, review, scheduled, published, unpublished and archived states. A scheduled job binds an exact revision, timezone and permission context; revalidate publication rights at execution and handle DST/changed schedules explicitly.
- Publish immutable document releases through an idempotent service that records pending cache/search/SEO effects. Reconcile failures; do not claim synchronous atomicity across D1/R2/CDN/search/vendors.
- Update canonical metadata, structured data, sitemap/RSS, social previews, redirects and search index as applicable. Preserve slug history. Keep source truth and public cache safety correct even while indexing catches up.
- Validate uploads, actual MIME, size, signed URLs, tenant ownership and SVG/HTML safety. Record asset license/consent, alt text, dimensions and variants; recheck external embeds. Server-side publication enforces Better Auth authorization regardless of UI state.
- Public reading uses a safe static renderer where appropriate; lazy-load editing bundles only for editors. Test semantic structure, links, nested lists, tables, code, media and multilingual round trips rather than assuming serialization is lossless.
- Inbox.vision must serialize email-compatible output separately from web rendering, sanitize replies, and respect send permissions. pdf.kitchen must keep block IDs, layout/page constraints and PDF render revisions aligned; do not assume a web DOM or arbitrary uploaded PDF is losslessly editable Plate content.

## Remotion upstream guidance and reusable motion components

- Consult official **remotion-dev/skills**, beginning with its router and only relevant create/markup/Studio/render/captions/SaaS/docs/upgrade references. The reviewed pin is recorded in [upstream receipt](../reference/remotion-upstream.json).
- Incorporate guidance through maintained local rules and source references, preserving user edits and preview-first review. Do not silently vendor/relicense upstream skill text: the inspected skills snapshot has no root LICENSE; validate applicable upstream rights before copying or distributing it.
- Keep Remotion package versions compatible and rendering deterministic. Use typed composition props and stable scene IDs; derive visual time from frames and resolved media timing, not wall-clock CSS animation or nondeterministic network reads during frame capture.
- Publish branded scene templates, data-story components and preview controls in versioned canonical packages with Storybook states and supported theme/renderer contracts. Keep restricted template sources out of public package/source views.
- Model a storyboard as a versioned domain document separate from executable code: scenes, narration, text, evidence, source captures, assets, durations, transitions, layouts, captions and output profiles.
- Support article explainers, verified product walkthroughs, release/changelog videos, onboarding tutorials, animated data stories and social clips. Reuse one shared API/SDK from at least two products.
- Provide embedded previews and targeted scene revisions; ordinary edits change typed inputs rather than regenerate composition code. New visual templates remain behind applicable Figma/design approval.
- Use approved brand assets and licensed media. Facts retain source/revision/date; demonstrations come from verified browser captures of the relevant product/release. Mask customer data and credentials; never invent screenshots as evidence of working features.
- Multilingual narration uses approved voices and translation review where necessary. Calculate timing from actual audio; regenerate alignment/captions when narration changes. Produce transcripts, thumbnails and wide/square/vertical variants with reflowed layouts, not blind cropping.
- Export synchronized captions in appropriate sidecar formats and optional burned-in variants. Check text safe areas, font glyph coverage, clipping, duration, audio peaks/loudness, caption timing, black frames and intelligibility.

## Rendering execution and cost

- Prefer a hardened Cloudflare Containers path when supported and entitled, with Node/browser/codec dependencies pinned. The official Remotion Containers example is a proof of concept lacking auth, queueing, rate limits, client progress and error propagation; implement those before exposing it.
- Agents coordinate sessions and AG-UI progress; Workflows/Queues orchestrate render jobs. Use private R2 for source assets and outputs, scoped signed access, lifecycle retention and immutable manifests. Browser Run captures source flows; it is not assumed to be a drop-in Remotion/FFmpeg renderer.
- Each job has tenant/project, actor, composition/version, source revision, asset digests, output profile, locale, render-engine version, budget reservation, attempt and cancellation token. Limit duration/resolution/concurrency and reserve costs before starting.
- Idempotent acceptance, durable leases/checkpoints, bounded retries, failure classification and dead-letter recovery are required. Cancel queued/running work where supported; fence late results and clean up temporary outputs. A disconnect is not cancellation.
- Cache by all content-affecting inputs and tenant authorization. Reuse scene fragments only when timing, transitions, fonts, audio and compositing dependencies permit it; do not promise every scene change can reuse all other encoded frames.
- Publish output links only after validation, manifest persistence and authorization. A preview is not a successful export. Preserve reproducibility inputs and an evidence report without secret-bearing request data.
- Verify Remotion license eligibility, automation terms and metered usage before production; do not assume all commercial usage is free or that every solo-founder product requires payment. Account for render, inference, TTS, storage and delivery costs together.
- The reviewed Remotion terms distinguish parameterized/service-generated compositions from hosting arbitrary user-uploaded Remotion projects, which needs explicit written approval. Keep the default service template/scene-based and gate unsupported bring-your-own-code offerings.

## Release acceptance journeys

- An author signs in, toggles Edit, drafts a new blog post, requests a selection rewrite, accepts/rejects, resumes after interruption, previews, schedules/publishes, and observes correct public content/cache/search/SEO.
- A denied user cannot edit, read private drafts, publish, change a schedule, access private media, or spend render credits through direct APIs.
- An article becomes an editable storyboard, two scenes are revised, narration/captions align in two locales, three aspect ratios export, cancelled jobs stop, repeated requests deduplicate, and private output links remain scoped.
- Real browser evidence, source/asset/license manifests, runtime logs and delivery receipts accompany completion. Fixtures and mocked provider tests supplement, never replace, authorized end-to-end checks.
