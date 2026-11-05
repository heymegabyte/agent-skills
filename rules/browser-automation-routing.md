---
last_reviewed: 2026-09-20
superseded_by: null
name: "browser-automation-routing"
priority: 2
pack: "infra"
triggers:
  - "browser automation"
  - "stagehand"
  - "browser rendering"
  - "scrape"
  - "browser interaction"
  - "playwright"
paths:
  - "**/e2e/**"
  - "**/*.spec.ts"
  - "src/**/*browser*"
---

# Browser Automation Routing

Standing preference for EVERY agent-driven browser task — navigate, click, fill, extract, screenshot, scrape, or verify. Default to the **browse CLI / browse.tools** with an explicit named session. Escalate to **Cua Driver** only when browse cannot operate the target, a native application is required, or the active authenticated desktop is the only viable state holder. Cua access must run through `bin/cua-singleton.sh` so one actor owns a desktop at a time.

Cross-links: `[[computer-use-safety]]` `[[computer-use-mastery]]` `[[browser-control-mastery]]` `[[fetch-defaults]]` `[[crawling-testing-browser-supervisor]]` `[[cloudflare-lock-in-is-leverage]]` `[[god-tier-engineering]]` `[[verification-loop]]`

This rule governs the CF-native BROWSER rail. For the full cross-PROVIDER Computer-Use playbook — driving
OpenAI / Claude / OpenCode / OpenClaw / Paperclip, the capability ladder (**API > DOM/accessibility-tree >
vision CU**), and the grounding/cost/safety laws — see `[[computer-use-mastery]]`. Both agree on the core
move: **the accessibility tree beats screenshots** (Stagehand `act`/`observe` here; Playwright-MCP a11y
there), and vision Computer Use is the last rung, not the first.

## HARD RULE — NEVER open a visible Chrome to TEST or MEASURE (headless / Browser Run only). Brian directive 2026-10-03.

- **Testing, measurement, screenshots, CWV/perf traces, E2E, post-deploy verification = HEADLESS or Cloudflare Browser Run ("Browser Run") ONLY.** Never pop a visible/GUI Chrome window on the user's machine to run a test or take a measurement — it hijacks the user's desktop + is non-reproducible.
- **This bans the Chrome DevTools MCP visible-tab path for testing.** `mcp__chrome-devtools__new_page` / `performance_start_trace` / `take_screenshot` open the user's REAL Chrome — do NOT use them to measure CLS/LCP, screenshot a route, or run a check. Use instead: **CF Browser Run** (headless, REST `/browser-rendering/*` or `@cloudflare/playwright` — the default "Browser Run"), or **headless Playwright** (`chromium.launch({ headless: true })` + CDP for a perf trace). For a throttled CWV trace, headless Playwright with `Network.emulateNetworkConditions` + `Emulation.setCPUThrottlingRate` + a `largest-contentful-paint`/`layout-shift` PerformanceObserver.
- **The "user's local Chrome" tier (below) is reserved STRICTLY for genuine cookie / logged-in-session persistence** (the user is mid-flow, SSO state must carry). It is NEVER the way to "just test" or "just measure" a page. If no auth state is needed, it must be headless / Browser Run — full stop.

### Reference incident (2026-10-03) — fire-30 drove CLS traces through visible Chrome

The brickcitylabor loop measured `/book` CLS by opening the chrome-devtools MCP (`new_page` + `performance_start_trace` ×3), which popped visible Chrome tabs on Brian's desktop. Correct path: headless CF Browser Run OR headless Playwright + CDP throttle. No auth/cookies were needed — it was a stateless prod measurement, the exact case that MUST be headless.

## The routing chain (in order)

1. **DEFAULT — browse CLI.** Use `browse open ... --session <task> --local|--remote`, inspect with `browse snapshot`, interact by refreshed refs, and verify after every state change. Use `--auto-connect` only when explicitly attaching to a debuggable logged-in Chrome. Search Browse.sh for a site-specific skill before hand-rolling common portal automation.
2. **Managed browser backends.** Let browse use Browserbase remote contexts when persistence/proxies/verified mode are needed. Cloudflare Browser Run/Stagehand remains available for product test infrastructure and existing CF-native suites, but direct agent browser work goes through browse.
3. **Cua Driver escalation.** Use Cua for native apps, an authenticated active desktop that browse cannot attach to, inaccessible canvas/OS UI, or repeated browse failure after diagnosis. Prefer background window/element actions; use foreground only for the smallest necessary step. Always acquire `bin/cua-singleton.sh` and capture before/after state.

## When each is right (routing is by state, not just availability)

- **Cookies / auth / logged-in state REQUIRED** → browse persistent remote context, `--auto-connect`, or an explicitly configured profile first; Cua only if browse cannot reach that state.
- **Stateless automation** (public pages, scraping, post-deploy verification, screenshots, extraction) → **CF Browser + Stagehand** default.
- **Bot-detected / Cloudflare-challenged target** → Stagehand-managed session (a11y-tree `act` evades brittle selectors) per `crawling-testing-browser-supervisor`; escalate proxies per `fetch-defaults` § Escalation only if still blocked.

## Tool mapping

- **CF Browser Run** — Workers Browser binding (`env.BROWSER`) + `@cloudflare/playwright` `launch()/connect()`; REST `/accounts/{id}/browser-rendering/{screenshot,content,snapshot,scrape,pdf,links,json}` for one-shots (per `god-tier-engineering` #9: REST > binding for single ops). **(2026):** also a direct **CDP endpoint** — point Stagehand / Playwright / any CDP client at it with a one-line config; **120 concurrent browsers** (paid, 4× after the Containers rebuild); **Live View + Human-in-the-Loop** interrupts + session recordings; persist login via `storageState` → Workers KV (the fork has no persistent contexts); optional **Kitesurf** agent-browser on the CDP endpoint (3–7× less mem/CPU).
- **Stagehand** — `mcp__stagehand__*` (`browserbase_stagehand_act/observe/extract/navigate/agent`); the REQUIRED interface for AI interaction — never drive a managed/cloud session with raw CDP clicks. Full Stagehand mastery — **observe-then-act + cache + self-heal**, atomic `act()`, Zod-schema `extract()`, the escape-hatch to raw Playwright/CDP, and the v4 unified **deep Locator** (nested/out-of-process iframes + closed Shadow DOM) — plus the grounding **ladder** (API > a11y/DOM > Set-of-Mark vision > raw pixels) and the read→scrape split: `[[browser-control-mastery]]`.
- **User Chrome** — `mcp__chrome-devtools__*` (attaches to the running Chrome) OR Playwright `connectOverCDP('http://localhost:9222')`. The ONLY tier where the user's cookies persist.
- **Playwright MCP (`mcp__playwright__*`)** — its own bundled Chromium; acceptable for a quick stateless check, but NOT the default here (no CF-native benefit, no cookie persistence). Prefer CF Browser for cloud, user Chrome for stateful.

## Guardrails (unchanged)

- Session-bound / auth / payment flows still require explicit user confirmation per `computer-use-safety`.
- Organization conversion, subscription/reward activation, billing changes, credential minting and secret transfer require a Paperclip approval ID before the consequential action. Read-only verification is autonomous.
- Never submit real payment cards from an agent-driven session — test cards live in the E2E suite only.
- Playwright TEST SUITES (`e2e-tdd-organization`, `verification-loop`) keep their own runner + PROD target; this rule governs AGENT-DRIVEN interaction. Those suites MAY use CF Browser Run as the launch backend.

## Anti-patterns

- Defaulting to Playwright-MCP's throwaway Chromium for a task that needs the user's logged-in cookies → use the user's Chrome.
- Spinning a Browserbase-managed session when a CF Browser Run instance is available → prefer CF-native.
- Driving a cloud/managed browser with raw CDP clicks instead of Stagehand's a11y-tree `act` → brittle; use Stagehand.
- **Opening a VISIBLE local Chrome (chrome-devtools MCP tabs) to TEST / MEASURE / screenshot / trace a page** → banned (see HARD RULE above). Headless CF Browser Run or headless Playwright only; the visible-Chrome tier is auth-state-persistence ONLY.
