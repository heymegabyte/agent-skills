---
name: "F12 — Deployment, platform, packaging, and infrastructure"
familyId: "F12"
defaultLayer: "contract"
defaultTier: "required_ci"
itemCount: 30
---

# F12: Deployment, platform, packaging, and infrastructure (F12.01–F12.30)

- **Default Verification Layer**: `contract`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F12.01` | **Clean checkout deterministic build** | Verify pnpm typecheck, validate, and build succeed from declared lockfile and workspace packages. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.02` | **Workerd / Worker handler verification** | Verify Cloudflare Worker fetch handlers for /, /t/:id, /blog, /blog/:slug, and /api/*. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.03` | **Startup configuration validation** | Validate site charter, slot schedules, and budget caps via Zod v4 at initialization. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.04` | **Preview vs Production binding isolation** | Ensure local and preview runs never mutate production R2/D1/KV bindings. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.05` | **Secret rotation and redaction safety** | Load secrets via Infisical/Worker env bindings and redact from all logs and responses. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.06` | **Artifact-to-commit identity binding** | Bind git commit SHA, lockfile hash, and build timestamp into deployment verification. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.07` | **Environment policy enforcement** | Enforce fixture-block release gate (check #3) so fixture briefs cannot publish in production. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.08` | **Direct API restriction verification** | Verify non-POST requests to /api/generate-theme return 405 with full security headers. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.09` | **Release-candidate smoke journey** | Run Playwright smoke journeys against built preview/prod routes before release completion. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.10` | **Coexisting version compatibility** | Maintain backward-compatible schemaVersion and componentRegistryVersion contracts. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.11` | **Rollback target validation** | Verify previousPublishedRevisionId exists and passes integrity checks before rollback. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.12` | **Feature flag transition safety** | Ensure toggling authoring or preview modes never corrupts underlying article state. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.13` | **Routing precedence and 404/noindex** | Verify /t/:id, /blog/:slug, /blog/rss.xml, and unknown 404/noindex routes in Worker. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.14` | **SSR metadata and client hydration parity** | Verify Worker HTMLRewriter <title>, canonical, OG, and JSON-LD match client-rendered state. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.15` | **Streaming and disconnect cleanup** | Handle client disconnects cleanly in Worker AI and asset fetch paths. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.16` | **Scheduled cron handler determinism** | Test 09:00, 14:00, and 19:00 America/New_York cron dispatch with controlled timestamps. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.17` | **Workspace package export verification** | Verify @theme-tools/themes, @theme-tools/ui, @theme-tools/blog, and @theme-tools/testing exports. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.18` | **Shell script path and quoting safety** | Verify agent-skills bash scripts pass shellcheck/shfmt and handle spaces/flags safely. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.19` | **CLI exit code and JSON envelope uniformity** | Ensure validation and gate CLIs return non-zero on failure and emit structured JSON. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.20` | **Skill and plugin sync verification** | Synchronize canonical skills across agent-skills and ~/.claude/plugins/heymegabyte-agent-skills. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.21` | **OS and runtime portability** | Use universal Web Crypto and standard Node >=22 APIs across macOS and Linux CI. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.22` | **Least-privilege process execution** | Run tests and builds without requiring root privileges or host-mutating daemons. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.23` | **Clean-cache CI reproducibility** | Verify cold-cache execution path alongside warm-cache runs in the 300s CI gate. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.24` | **Local vs edge parity documentation** | Document HTMLRewriter edge behavior vs Vite dev server behavior explicitly. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.25` | **HTTP caching and Content-Type accuracy** | Serve /blog/rss.xml as application/rss+xml, sitemaps as application/xml, and security headers on all. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.26` | **Service binding caller authorization** | Validate internal service calls and tenant context across package boundaries. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.27` | **Canonical domain and TLS verification** | Enforce https://theme.tools canonical URLs and HSTS max-age=31536000; includeSubDomains; preload. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.28` | **Infrastructure drift detection** | Verify all 15 themes have matching public/og-<id>.jpg cards during gen-sitemap.mjs build. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.29` | **Runtime size and bundle budgets** | Monitor Vite chunk sizes and keep LazyPlateEditor isolated from reader bundles. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
| `F12.30` | **Source map and revision attribution** | Attach revisionId, contentHash, and commit SHA to quality reports and audit logs. | `contract` | `required_ci` | `verified` | `apps/web/worker/index.ts, nx.json & .github/workflows/ci-required-5min.yml` |
