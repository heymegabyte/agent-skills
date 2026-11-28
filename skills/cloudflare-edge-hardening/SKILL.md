---
name: cloudflare-edge-hardening
description: Enforce and audit all 10 Free-Tier Cloudflare Edge Security & Speed dimensions across all 59 active zones and 4 AI Gateways via cloudflare-free-tier-hardener.ts and cloudflare-mcp.
metadata:
  version: "1.1.0"
---
# Cloudflare Free-Tier Maximum Leverage Edge Hardening (59 Zones, 13 Zone Dimensions & 4 AI Gateways)

## 13 Enforced Zone-Level Free-Tier Security & Performance Dimensions (`bin/cloudflare-free-tier-hardener.ts`)

1. **5 Free WAF Custom Firewall Rules (`http_request_firewall_custom` phase — `295` active rules across `59` zones)**:
   - `[Free-WAF-1]` Block Sensitive Dotfiles, VCS, Env & Backup Leaks (`/.env`, `/.git/`, `/.aws/`, `/.ssh/`, `/wp-config.php`, `/phpinfo.php`, `.sql`, `.bak`)
   - `[Free-WAF-2]` Block CMS, PHP, CGI & Path Traversal Exploit Probes (`/wp-admin`, `/wp-login.php`, `/xmlrpc.php`, `/vendor/phpunit`, `/cgi-bin/`, `../`, `/actuator/`)
   - `[Free-WAF-3]` Block Known Vulnerability Scanner & Exploit User-Agents (`sqlmap`, `nikto`, `nuclei`, `masscan`, `zgrab`, `acunetix`, `nessus`, `dirbuster`, `gobuster`)
   - `[Free-WAF-4]` Enforce Standard HTTP Methods & Block `TRACE`/`TRACK` Abuse
   - `[Free-WAF-5]` Managed Challenge on Empty-UA Automated Auth & Admin Probes (`/admin*`, `/api/auth/sign-in*`, `/login`)
2. **1 Free HTTP Rate Limiting Rule (`http_ratelimit` phase — `59/59` zones)**:
   - `[Free-RateLimit-1]` Protect Auth & Login POST Endpoints Against Brute-Force Floods (`25 req / 10s` per `cf.colo.id` + `ip.src`).
3. **4 Free Edge Security Response Headers (`http_response_headers_transform` phase — `59/59` zones)**:
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Permitted-Cross-Domain-Policies: none`
   - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
4. **2 Free Edge Cache Rules (`http_request_cache_settings` phase — `118` rules across `59/59` zones)**:
   - `[Free-Cache-1]` Bypass Edge Cache for Dynamic API, Auth, MCP, Webhook & Admin Routes (`/api/*`, `/admin*`, `/webhook*`, `/mcp*`).
   - `[Free-Cache-2]` Aggressive Edge (`30d`) & Browser (`1y`) Cache for Immutable Hashed Static Assets (`/assets/*`, `.woff2`, `.avif`, `.webp`).
5. **1 Free Zstandard (`zstd` + `brotli` + `gzip`) Compression Rule (`http_response_compression` phase — `59/59` zones)**:
   - `[Free-Compress-1]` Prefer `zstd`, `brotli`, and `gzip` across all compressible web, JSON/RFC 9457 (`application/problem+json`), SVG, XML, and WebAssembly responses.
6. **Free API-Safe & Origin-SSL Compatibility Config Rules (`http_config_settings` phase — `59/59` zones)**:
   - `[Free-Config-1]` Disable Email Obfuscation (`email_obfuscation: false`) on `/api/*`, `/webhook*`, and `/mcp*` JSON endpoints so `@` email strings inside JSON responses are never rewritten.
   - `[Free-Config-2]` Firebase Hosting Origin SSL Compatibility for `rowy.megabyte.space` on `megabyte.space` (`(http.host eq "rowy.megabyte.space")` -> `action_parameters: { ssl: "full" }` for Firebase Hosting origin `199.36.158.100`), plus automatic preservation of any existing host-specific `ssl: "full"` rules across sweeps to prevent HTTP 526 Invalid SSL Certificate errors.
7. **Free Smart Tiered Cache (`tiered_cache_smart_topology_enable = "on"` — `59/59` zones)**.
8. **Free Bot Fight Mode & AI Scraper Block (`enable_js: true`, `fight_mode: true`, `ai_bots_protection: "block"` — `59/59` zones)**.
9. **Free Leaked Credential Checks (`POST /zones/:id/leaked-credential-checks` `enabled: true` — `59/59` zones)**.
10. **Free Page Shield Client-Side JS Supply-Chain Monitor (`PUT /zones/:id/page_shield` `enabled: true` — `59/59` zones)**.
11. **Free DNSSEC (`PATCH /zones/:id/dnssec` `status: "active"` — `59/59` zones)**.
12. **Free RFC-3986 URL Normalization at Both Incoming WAF & Origin Scope (`PUT /zones/:id/url_normalization` `{"type":"cloudflare","scope":"both"}` — `59/59` zones)**.
13. **25 Free Zone Security & Speed Settings (`59/59` zones = `1,475` zone settings)**:
    - `0rtt: "on"`, `always_online: "on"`, `always_use_https: "on"`, `automatic_https_rewrites: "on"`, `brotli: "on"`, `browser_check: "on"`, `early_hints: "on"`, `ech: "on"`, `email_obfuscation: "on"`, `hotlink_protection: "on"`, `http3: "on"`, `ip_geolocation: "on"`, `ipv6: "on"`, `min_tls_version: "1.2"`, `opportunistic_encryption: "on"`, `opportunistic_onion: "on"`, `pq_keyex: "on"` (Post-Quantum ML-KEM), `privacy_pass: "on"`, `pseudo_ipv4: "add_header"`, `replace_insecure_js: "on"`, `security_header` (1-year HSTS Preload `max_age: 31536000, include_subdomains: true, preload: true, nosniff: true`), `security_level: "medium"`, `tls_1_3: "zrt"`, `websockets: "on"`, and `speed_brain: "on"`.

## 4 Hardened Cloudflare AI Gateways (`projectsites`, `megabyte-os`, `projectsites-dev`, `megabyte-space`)

- `collect_logs: true`, `log_classification: true`, `retry_max_attempts: 3`, `retry_delay: 1000`, `retry_backoff: "exponential"`.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Decompose work into contract-locked OpenSpec DAG nodes, convene a right-sized SCRUM quorum (`claude` + `codex` + `gemini`) for key decisions, and offload all throughput-safe implementation, plugin catalogs, unit tests (100% coverage), and parallel Cloudflare Browser Run E2E suites to `opencode` (DeepSeek) swarms.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Architecture and verification**: Route material decisions through `rules/evidence-gated-autonomous-orchestration.md`. Its conference and risk gates govern provider selection and independence.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent work concurrently whenever doing so reduces time to verified delivery. Delegate every suitable task to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
