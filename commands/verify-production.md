---
description: Read-only production verification of the resolved live URL — headers, real-browser smoke, display-vs-store reconcile. Fires after a deploy or on demand.
argument-hint: "[domain] (optional — defaults to cwd)"
---

Read-only. Makes NO changes. Proves the site actually WORKS, not just that a deploy succeeded.

## Steps

1. **Resolve** — `node .claude/control-plane/ccctl.mjs resolve [domain]` → take `verifyUrl` (the live, DNS-aware URL; falls back to `liveUrl` `*.workers.dev` when DNS isn't cut over).
2. **HTTP + headers** — `node .claude/control-plane/ccctl.mjs verify <verifyUrl> --status 200 --asset <hashed-asset> --contains "<expected-string>"`. Assert 200, security headers present (HSTS / CSP / X-Content-Type-Options), the asset 200s, and expected content is in the HTML. Exit 1 halts on failure.
3. **Real-browser smoke** — drive an actual browser (Cloudflare Browser Rendering → Browserbase/Stagehand → Playwright, whichever is available):
   - Load `verifyUrl`; assert **0 console errors** + no 4xx/5xx sub-requests.
   - Assert the CHANGED content is visibly present (grep the rendered DOM, not the shell).
   - Screenshot at **6 breakpoints**: 375 / 390 / 768 / 1024 / 1280 / 1920.
4. **Reconcile display vs source of truth** — for any data surface, query the authoritative store (D1 / KV / API) for the real account and confirm the count. `groundTruth > 0 && display == 0` = **lying-empty** (fail). Render-clean ≠ data-correct.
5. **Report** — pass/fail per check with evidence: status code, header list, console-error count, screenshot paths, ground-truth-vs-display counts. On any fail, name the exact failing check + suspected cause.
