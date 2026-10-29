# ADR-0003: Shared extension contract + app-store architecture (Backstage · Workers for Platforms)

## Status

**Accepted (design).** Pilot implementation pending backlog #14-pilot (one connector + one isolated extension across two products). Supersedes nothing; complements ADR-0001.

## Date

2026-10-29

## Context

Multiple estate products will expose extensions / "app stores" (OnePrompt, Browse.Tools, and others). REVISION-2 §20 requires ONE shared extension contract + installation control plane across products — not a bespoke marketplace per product. Two concepts must NOT be conflated:

- **Backstage is a developer-portal framework** (catalog, ownership, docs, templates, integrations). Its threat model treats installed plugin code as TRUSTED host code with access to configuration/secrets; a plugin directory is NOT a secure tenant app marketplace. A signed-in portal is not a per-user authorization boundary.
- **A customer app store needs a per-tenant RUNTIME authorization boundary** Backstage does not provide.

Constraints: reuse existing catalog/dashboards + billing/entitlement before new infra; customer code is untrusted; permissions ≠ commercial entitlement ≠ feature rollout ≠ operational health; manifests are inputs to enforcement, never self-granted permissions.

## Options Considered

### Internal engineering portal

- **A (CHOSEN): evaluate Backstage against the existing catalog/dashboards; adopt only if a real workflow warrants operating it.** A PoC must represent real repos/APIs/deps/owners/runbooks; reuse integrations first.
- B: install Backstage into every product. Rejected — several competing catalogs; Backstage is not the tenant runtime-authorization source.

### Customer app store

- **A (CHOSEN): ONE shared extension contract + installation control plane across products, with product-specific discovery/install UI.** Backstage MAY display/administer the inventory but is NOT the tenant runtime authorization.
- B: per-product bespoke marketplace. Rejected — duplicated contracts, no shared governance.

### Extension classes (trust tiers — §20.3)

- **A (CHOSEN): a 5-class model, each with its own trust + isolation:** A declarative connector (reviewed config + OAuth/API/webhook, NO host code) · B first-party trusted UI package (compiled into the app via explicit extension points + a versioned host SDK) · C third-party remote UI (isolated origin/iframe, restrictive sandbox/CSP, authenticated message schema, EXACT origin checks, scoped capabilities — never expose parent creds; module federation is not a security boundary) · D user/plugin code (isolated execution behind a broker) · E privileged local/host integration (a separate reviewed deployment, never an untrusted script in the control-plane process).

### Class-D isolation substrate

- **A (CHOSEN): Cloudflare Workers for Platforms** (dispatch namespace + dynamic-dispatch Worker + per-customer user Workers). Verified current (cloudflare-docs, Oct 2026): user Workers run isolated with no access to other customers' data/code; **egress control via an Outbound Worker**; **per-customer CPU/subrequest `custom-limits` (per invocation)**; bindings attached per-worker (attach a UNIQUE D1/KV/R2 per worker for complete isolation); per-request platform capabilities via dynamic-dispatch `props` + an RPC stub that is valid ONLY during that request (cross-request I/O is rejected). **Keep customer Workers in UNTRUSTED mode — never enable "trusted mode"** (the `cf` object stays inaccessible, `caches.default` is disabled) since we do not control customer code.
- B: run customer code in the main control-plane process / a shared Worker. Rejected — no tenant isolation; a single bug/abuse crosses tenants. Isolation does NOT replace authorization, resource limits, or data scoping — enforce those regardless.

## Decision

Adopt the shared extension contract above. A **versioned manifest** (JSON-Schema + TS types, §20.4) declares: extension_id · publisher identity · artifact version/digest · compatible host-API range · class · supported products · extension points · required/optional permissions · OAuth scopes · config schema · ingress/egress needs · event contracts · migrations · data-access/retention · resource budgets · health checks · licensing · provenance/signature · upgrade/uninstall behavior · support/security contact. Public discovery metadata stays separate from private credentials/tenant state.

**Lifecycle (§20.5):** discover → assess compatibility/provenance → authorize requested capabilities → install a pinned artifact → configure → verify → enable → observe → upgrade/disable → uninstall/revoke → verify cleanup. Persist each tenant installation independently; support interrupted-operation recovery, version pinning, rollback-or-forward, revocation, and scoped emergency disablement. Uninstall revokes credentials/subscriptions + handles retained data per the installation contract (a code rollback alone may not restore data).

## Consequences / pilot acceptance (§20.6)

- Pilot: a small shared contract with ONE connector (class A) + ONE isolated extension (class D) across TWO products; demonstrate install, authorization DENIAL enforced at runtime, use, metrics, upgrade compatibility, interruption recovery, disablement, and uninstall-with-cleanup.
- A catalog listing does NOT establish a working installation. Do not promise compatibility with all Backstage plugins inside arbitrary product frontends. Evaluate marketplace payments/reviews only when real product scope warrants; reuse the existing billing/entitlement stack.

## Sources (verified 2026-10-29)

- Backstage: what-is / architecture-overview / installing-plugins / threat-model (backstage.io/docs).
- Workers for Platforms (cloudflare-docs, last-updated Oct 2026): `/cloudflare-for-platforms/workers-for-platforms/` (untrusted-sandbox framing), `/get-started/` (dispatch namespace + user-worker isolation), `/configuration/outbound-workers/` (egress), `/configuration/custom-limits/` (per-invocation caps), `/configuration/bindings/` (resource isolation), `/configuration/dynamic-dispatch/` (per-request props/RPC), `/reference/worker-isolation/` (trusted-mode caveat), `/reference/limits/` (`cf` object + `caches.default` disabled).

## Cross-links

`[[cloudflare-hostable-supervisor]]` · `[[cloudflare-lock-in-is-leverage]]` · ADR-0001 (tooling fabric) · `reference/service-ideas/cross-service.md` (X-13/X-14 extension health + accountability).
