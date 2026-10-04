# projectsites.dev — Architecture

> Canonical system picture for the loop. Concise map, not a code dump. Detail owners:
> root `CLAUDE.md`, `apps/project-sites/CLAUDE.md`, `apps/project-sites/frontend/CLAUDE.md`.
> Neighbors: [`./README.md`](./README.md) · [`./BACKLOG.md`](./BACKLOG.md).

**Product:** "We don't sell websites — we deliver them." A business owner searches for their
business → signs in → gets a professionally AI-generated site, hosted + SSL'd + live in <15min.

## Surfaces

- **Worker** — `apps/project-sites/src` (Cloudflare Workers + Hono). Ingress, `/api/*`, site
  serving, Stripe webhooks, AI site-generation Workflow. → `projectsites.dev`.
- **Angular admin SPA** — `apps/project-sites/frontend` (Angular 21 standalone, signals,
  zoneless, Spartan UI, Tailwind v4). Talks to the Worker via `/api/*`. → served from **R2** by
  the Worker at `/` + `/admin/*`.
- **bolt.diy editor** — repo-root `app/` (Remix + Vite, WebContainer). → CF **Pages `bolt-diy`**
  at `editor.projectsites.dev`. The admin Editor **extends** this iframe (never a parallel editor).
- **`packages/shared`** — Zod schemas, constants, RBAC middleware, utilities shared across.

## Hot path (public site request)

```
CF DNS / custom hostname
  → Worker dispatch (host resolve)
  → KV manifest (host→slug, 60s TTL)
  → WfP dispatch  ← DEFAULT serving path (per-site Worker on Workers-for-Platforms)
       └─ R2 asset  ← fail-soft fallback (sites/{slug}/{version}/{file})
  → Analytics Engine sample (high-volume metrics; NOT PostHog)
  → async Queue / Workflow (deferred work; QUEUE binding optional, falls back to Workflows)
```

- Hot path must NOT touch Neon/Upstash/Fly/Sentry/PostHog/external-AI unless genuinely dynamic.
- Unpaid sites get a top-bar injected after `<body>`. Content-type keys off `marketingPath`, not `path`.

## Site status machine

`draft → collecting → imaging → generating → published | error | archived`

## Deploy topology

- **Worker** — CI **"Project Sites CI/CD"** on push; `cd apps/project-sites && wrangler deploy
  --env production` (`--env production` MANDATORY — bare deploy 500s every `/api/*`). Container
  builds need Docker; if unavailable locally, push → Workers Builds.
- **Frontend (R2)** — `cd apps/project-sites/frontend && npm run deploy:production` (no Docker).
  Worker serves the hashed dist from R2 at edge. `npm run verify:production` = Playwright smoke.
- **Editor (Pages)** — `wrangler pages deploy build/client --project-name=bolt-diy`.
- Post-deploy: prod-verify changed routes (curl/Playwright) — local green is never "done"
  (`verification-loop`). Prod deploys are standing-authorized.

## Resource ownership

- **D1 prod** — `project-sites-db-production` (`ea3e839a-c641-4861-ae30-dfc63bff8032`). System of
  record: parameterized SQL, no Supabase client. Holds platform per-site data
  (`form_submissions`, `visitor_events`) in the master DB.
- **Per-site D1** — Data Platform: each customer's OWN dedicated D1, blank at first, resolved
  server-side (`resolveSiteDataDb` reads `site_database_allocations`, lazy-provisions,
  denylists shared platform ids). Editor "Data" tab. Flag `per_site_data` (DARK → 404).
- **R2** — site assets `sites/{slug}/{version}/{file}`; marketing at `marketing/index.html`;
  build templates at `templates/{category}/`. Also the frontend SPA dist bucket.
- **KV** — host-resolution cache (60s TTL); prompt hot-patch.
- **Durable Objects** — `SITE_BUILDER` (Container: Claude Code build orchestrator),
  `APP_RUNTIME`, `PsNotifyDO` (psnotify notification layer — NOT a D1 `notifications` table).
- **WfP** — per-site dispatch namespace (Workers for Platforms); a Worker can't statically bind
  thousands of per-site D1s, so serving + data go through the dispatch/REST plane.
- **AI** — Cloudflare Workers AI (Llama 4 Scout default; GLM-4.7-flash tool-calling) via AI Gateway (mandatory on every
  model call). Build agent: DeepSeek-primary, Anthropic fallback.

## Invariants + key ADRs

- **Money path is the core journey** — search → select → sign-in → build → live site. Guard it.
- **Feature flags default-OFF** — `enabled=0, rollout=0, stage='experimental'`; server returns
  **404** when off (never 403 — don't leak existence); UI renders nothing. Cloudflare Flagship is
  the standard engine; D1 tables are the admin SoT + governance fallback.
- **Zod at every boundary** — env, API in/out, params, forms, webhooks, queue/DO messages, AI
  outputs. Infer types via `z.infer`; never hand-duplicate.
- **`assertSiteOwned` on every `/api/sites/:siteId`** — org-scoped ownership check closes the IDOR
  class; new site-id handlers need it + a CI gate.
- **main-only branch** — commit + push to `main` every round; worktrees for isolation, deleted
  when work lands. No long-lived feature/release branches.
- **Build invariants** — `src/services/build_validators.ts` enforces required files, asset
  existence, meta lengths, JSON-LD count, single H1, banned slop (`report` mode → `strict`).
- **Removed, never reintroduce** — Supabase, phone-OTP, Resend (SES is the sole email rail,
  SendGrid break-glass; ADR-0019), dashboard-authored AI Agents (replaced by code-defined
  Functions on WfP). Twilio VOICE is kept.

## Middleware order (Worker)

`requestId → payloadLimit (256KB) → securityHeaders (CSP/HSTS) → cors (API) → auth (Bearer →
session → userId/orgId; does NOT reject unauthed) → errorHandler (AppError→JSON, ZodError→400)`.

## CF resource IDs

- Account — `84fa0d1b16ff8086dd958c468ce7fd59`
- D1 prod — `ea3e839a-c641-4861-ae30-dfc63bff8032`
- Pages bolt-diy — `76c34b4f-1bd1-410c-af32-74fd8ee3b23f`
- Zone projectsites.dev — `9ceaa211750dd31899fd5d1bf8d1ec46`
