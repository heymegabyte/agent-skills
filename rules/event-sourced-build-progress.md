---
last_reviewed: 2026-10-27
superseded_by: null
name: "event-sourced-build-progress"
priority: 3
pack: "ai"
triggers:
  - "build event"
  - "stream"
  - "oneprompt"
  - "draftl.ink"
  - "incremental preview"
paths:
  - "concern:ai-features"
---

# Event-Sourced Build Progress

AI build progress MUST emit durable, typed, replayable events. Dashboards then show progress, generated components, tests, previews, failures, and publish status clearly — without polling, without log-scraping, without guessing. The event stream IS the source of truth for a build's state.

## OnePrompt streaming build and fast preview

- Show immediate, honest progress for parallel research and real agent work. Render a **cached, precompiled draftl.ink/Storybook theme shell** first; distinguish that draft shell from researched content, passing checks and a published result. Never fabricate progress, research findings or completion percentages.
- Reuse the shared Storybook components, approved design tokens and section contracts. Start independent section/content/data/asset agents concurrently after their contracts are known; do not serialize the whole build behind one model response or cosmetic reveal sequence.
- Have agents return **typed section/asset payloads**. A **single assembler owns file writes**, shared manifests, dependency changes and patch ordering. Use deterministic scripts/templates for routine assembly and **ast-grep** for targeted structural edits rather than regenerating whole files with a model.
- Apply content-only **slot/manifest patches without rebuilding the project**. Rebuild only the affected code/dependency boundary when necessary. Version granular file/component patches with a base revision, resulting revision, content hash and stable target; reject stale patches and reconcile conflicting edits.
- Reuse and extend existing build-event contracts/producers before adding transport. Verify actual execution and persistence; a stream stub or roster is not a working dispatcher, and concurrent appends must not read/overwrite one shared KV array.
- Deliver ordered events through a Durable Object coordinator and **WebSocket/SSE**. Update the **isolated preview iframe** while preserving the host editor's framework-owned DOM. Use the generated site's own renderer/HMR. Validate message origin, build/session identity and payload schema before applying a preview update.
- Keep the last valid preview visible while a section changes. Show pending/error states honestly; distinguish a renderable preview from production validation and promotion. Reconnect using sequence IDs/backfill and apply patches idempotently.
- Animate accepted visual updates with native CSS, Web Animations or View Transitions, respecting reduced motion. Animation playback never blocks agents, assembly or delivery. Evaluate browser-worker WASM/SWC only for a demonstrated compiler/transform bottleneck and meaningful measured gain; it is not the default for content patches.
- Use ordinary profiling/CI measurements for latency and correctness; do not create a benchmark CLI. Heavy native jobs follow `[[cloudflare-hostable-supervisor]]`; client entrypoints follow `[[terminal-styling]]`.

## Event types

- `build.started` — pipeline kicked off
- `agent.started` — an agent began a unit of work
- `agent.completed` — the unit returned a validated result
- `file.changed` — a file was written / patched
- `component.generated` — a UI component was produced
- `tests.started` — test run began
- `tests.completed` — test run finished (with pass/fail counts)
- `preview.updated` — preview server reflects new state
- `publish.completed` — validated artifact promoted to live
- `build.failed` — terminal failure (with reason)

## Every event's contract

- **Typed** — discriminated union on `type`, no loose `any` payloads
- **Zod-validated** — parsed at the boundary before persistence; invalid events rejected
- **Durable** — written to D1 / a session DO's SQLite / R2 (never in-memory only)
- **Replayable** — re-reading the ordered stream reconstructs full build state
- **Dashboard-displayable** — carries bounded typed payloads or immutable artifact references/hashes; never requires parsing prose logs
- Carries `buildId`, unique `eventId`, monotonic per-build `seq`, timestamp and `featureSlug` where relevant
- Patch events also carry their stable target and base/result revisions; only accepted revisions advance preview state

## Schema shape

```ts
import { z } from 'zod';

const Base = z.object({
  buildId: z.string(), eventId: z.string(), seq: z.number().int().nonnegative(),
  ts: z.string(), featureSlug: z.string().optional(),
});

export const BuildEventSchema = z.discriminatedUnion('type', [
  Base.extend({ type: z.literal('build.started'), prompt: z.string() }),
  Base.extend({ type: z.literal('component.generated'), name: z.string(), path: z.string() }),
  Base.extend({ type: z.literal('tests.completed'), passed: z.number(), failed: z.number() }),
  Base.extend({ type: z.literal('build.failed'), reason: z.string(), code: z.string() }),
  // ...remaining variants
]);

export type BuildEvent = z.infer<typeof BuildEventSchema>;
```

## Append-only discipline

- Events are append-only — never mutate or delete a recorded event
- The per-build coordinator assigns monotonic sequence IDs; replay orders by `seq`, not wall-clock timestamps
- Dashboards subscribe (SSE / WS) and also backfill via replay on reconnect
- A build's terminal state is the last `publish.completed` OR `build.failed`

## Per-repo home

- `libs/core/build-events/` — schema + emitter + replay helper
- Emitter validates via `BuildEventSchema.parse` before persisting; rejects malformed events
- The sandbox is the producer; the admin dashboard is the consumer

See `06-build-and-slice-loop/SKILL.md` for slice completion, `10-experience-and-design-system/SKILL.md` for shared component/motion guidance, and `05-architecture-and-stack/SKILL.md` for runtime placement. Build-stream backfill reconstructs UI state; operational job replay remains deferred.
