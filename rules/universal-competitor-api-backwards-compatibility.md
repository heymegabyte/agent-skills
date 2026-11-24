---
name: 'universal-competitor-api-backwards-compatibility'
last_reviewed: 2026-11-22
superseded_by: null
priority: 2
pack: 'core'
triggers:
  - 'compat'
  - 'backwards compatibility'
  - 'competitor'
  - 'api'
  - 'sdk'
---

# Universal Industry Competitor API Backwards-Compatibility & Upstream Test Retrofit Mandate

Every API, developer platform, and SaaS product in the estate MUST provide **first-class, drop-in backwards-compatible APIs (REST, SDK, and MCP)** for as many industry competitors and de facto standards in its domain as possible, backed by **retrofitted upstream test suites**, **100% compatibility-layer unit coverage**, and **massive parallel E2E Golden Path testing on Cloudflare Browser Run**.

## 1. Universal Competitor & De Facto Standard Compatibility By Default

- **Never ship only a bespoke API**: Alongside the product's canonical `/api/v1/*` OpenAPI contract, always expose drop-in backwards-compatible routes for every major competitor and de facto protocol in the product's category:
  - **Mount both namespaced and zero-config root paths**: Expose explicit `/compat/<provider>/v1/*` (and `/compat/<provider>/v2/*`) routes **plus** root `/v1/*`, `/v2/*`, and protocol-specific paths (e.g., `/r/*` for Jina Reader, `/json/version` & `/json/list` for CDP discovery) so official vendor SDKs work by changing only `baseURL` / `apiUrl` and the API key.
  - **Multi-Header API Key & Token Prefix Normalization**: Normalize every competitor's authentication header and key prefix into the canonical auth boundary (`Authorization: Bearer <key>`, `X-BB-API-Key`, `x-api-key`, `X-API-Key`, `fc-…`, `cc_live_…`) while failing closed (`401`) on missing or invalid credentials.
  - **MCP Tool Alias Parity**: In `/mcp` (`tools/call`), support de facto standard MCP tool names (`@playwright/mcp`'s `browser_navigate`, `browser_click`, `browser_type`, `browser_press_key`, `browser_hover`, `browser_select_option`, `browser_wait_for`, `browser_evaluate`, `browser_take_screenshot`, `browser_snapshot`, `browser_tabs`, `browser_close` and `firecrawl-mcp`'s `firecrawl_scrape`, `firecrawl_map`, `firecrawl_crawl`, `firecrawl_check_crawl_status`, `firecrawl_search`, `firecrawl_extract`) in addition to canonical OpenAPI-derived tool slugs.
  - **Single Canonical State Store**: Backwards-compatible facades must never create siloed shadow databases. Every compatibility request translates into and mutates the single canonical control-plane resource model (e.g., `Run`, `Session`, `Lease`, `Profile`, `WorkflowDefinition`, `SecretRef`, `Artifact`, `VerificationResult`).
  - **Honest Capability Guardrails (`422` / `501`, never fake success)**: If a competitor SDK passes a flag requiring an unavailable or unconfigured external dependency (e.g., arbitrary Chrome extension loading, residential proxy routing without an upstream proxy provider, automated CAPTCHA evasion, or raw plaintext secret storage), reject explicitly with a structured `422` capability guardrail citing the capability ID.

## 2. Canonical `@theme.tools/*` Shared Compatibility Solution Across Estate Projects

- **Never duplicate competitor compatibility engines across sibling repos**: When two or more estate repositories implement overlapping competitor surfaces — such as `browse.tools` and `crawl.cheap` both providing **Firecrawl v1/v2 (`@mendable/firecrawl-js`)**, **Jina Reader (`jina-ai/reader`)**, and **Stagehand (`@browserbasehq/stagehand`)** compatibility — the shared contracts, HTML→Markdown/links/images/metadata normalizers, SSRF/robots.txt evaluators (`executeFirecrawlMarkdownAndRobotsCheck`), and upstream test vector adapters MUST live in **`@theme.tools/crawl-research`** (and `@theme-tools/shared-utils`) and be bound in each consumer's `theme.tools.json`.

## 3. Retrofit Official Upstream Competitor Test Suites

- **For every competitor we provide backwards compatibility with, retrofit their upstream test cases into our repository**:
  - Port and adapt the competitor's official SDK E2E tests, unit test vectors, edge-case validation checks, and error-code contracts (e.g., Firecrawl's `v1` & `v2` scrape/map/crawl/search/extract/batch E2E tests, `waitFor > timeout / 2` guard, `x-idempotency-key` replay `409`, `handler_test.go` HTML-to-Markdown cases; Jina Reader's `markify.test.ts`, `data-url-images.test.ts`, `frontmatter-representation.test.ts`; Stagehand's `act`/`extract`/`observe` and `approval.test.ts`; Browserbase's session/context/debug/recording/downloads lifecycle; Skyvern's task/workflow/timeline/artifact/credential lifecycle; Steel's session/release/context/scrape/screenshot/pdf tests; Browserless & CDP `/json/version` discovery tests).
  - Run the retrofitted upstream test suites both **in-process in Vitest** and **against the live deployed production Worker**.

## 4. 100% Compatibility Unit Coverage & Massive Parallel Cloudflare Browser Run E2E Golden Paths

- **100% unit test coverage** on the compatibility router, translators, normalizers, and MCP tool alias dispatchers.
- **90%+ end-to-end surface coverage via Parallel Golden Paths on Cloudflare Browser Run**: Maintain an automated, massively parallel E2E Golden Path runner (`e2e/parallel-golden-paths.mjs`) that fires concurrent real executions across Cloudflare Browser Run covering canonical `/api/v1/*` endpoints and every competitor compatibility facade simultaneously in production.
