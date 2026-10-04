---
description: Every data surface updates itself in real time (live-reload / visibility-aware poll / WebSocket / SSE) — NEVER ship a manual Refresh/Reconcile/Reload/Sync button as the path to fresh data. Fires on any admin/dashboard/editor/resource UI that has (or is tempted to add) a refresh/reconcile button, a polling loop, a stale list, or a "sync" affordance.
triggers: [refresh button, reconcile button, sync button, reload button, real-time update, live reload, live update, polling, websocket, SSE, stale data, stale list, manual refresh, reconcile drift, resource inventory]
---

# Real-Time Data — No Manual Refresh / Reconcile Buttons

Every data attribute + surface updates itself in real time — live-reload, visibility-aware poll, WebSocket, or SSE. A manual **Refresh / Reconcile / Reload / Sync** button that the user must click to see current state is a **defect**: the surface should already be current. (Brian directive 2026-09-27.)

## The rule

- **No manual refresh control on any data surface.** If the user has to click to get fresh data, the design is wrong — remove the button, make the surface self-updating.
- **Pick a real-time mechanism per surface:**
  - **WebSocket / SSE** — push-y, high-frequency, or collaborative state: build/deploy progress, logs, live resource status, container lifecycle, notifications.
  - **Visibility-aware poll** — periodic state (lists, counts, resource inventories): pause on `document.hidden`, immediate refresh on foreground, 15–60s cadence. Reference impl: projectsites `AdminStateService`.
  - **Optimistic + background reconcile** — the surface's OWN mutations: write updates the UI instantly, then a background fetch reconciles (per `[[sync-ui-async-backing]]`).
- **Reconciliation is automatic + silent**, never a button. State that can drift (CF resource inventory vs actual, cache vs store) reconciles on a timer / on focus / on the relevant event — never on a click.
- **Freshness is invisible.** A subtle live affordance is fine (a quiet pulse, "updated Ns ago", a live dot), but freshness is NEVER gated behind a click.
- **Prefer CF-native real-time** (Durable Object WebSockets / Workers SSE) per `[[cloudflare-lock-in-is-leverage]]` before reaching for polling where push fits.

## Anti-patterns (fix on sight)

- A "Refresh" / "Reconcile" / "Sync" button as the primary path to current data (remove it; make it real-time).
- A list/inventory/status that only updates on manual reload.
- Requiring a click to reconcile drift that a timer or event could catch silently.
- A "last synced" label paired with a manual sync button (auto-sync + show the timestamp only).

## Reference incident (projectsites Editor › Resources, 2026-09-27)

The editor's Resources › Advanced (Cloudflare resources) view shipped **"Reconcile" + "Refresh"** buttons. Brian: remove them — the resource inventory must live-update (poll / WebSocket) so it's always current without a click. This rule is the generalized directive.

## Cross-links

- `[[embarrassingly-easy-to-use]]` (the user shouldn't have to think to get fresh data) · `[[gorgeous-by-default]]` · `[[sync-ui-async-backing]]` · `[[production-observability-default-on]]` · `[[cloudflare-lock-in-is-leverage]]`.
