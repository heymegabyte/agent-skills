---
name: cloudflare-edge-hardening
description: Enforce and audit all 10 Free-Tier Cloudflare Edge Security & Speed dimensions across all 59 active zones and 4 AI Gateways via cloudflare-free-tier-hardener.ts and cloudflare-mcp.
metadata:
  version: "1.1.0"
---
# Cloudflare Free-Tier Maximum Leverage Edge Hardening (59 Zones & 4 AI Gateways)

## 10 Enforced Zone-Level Free-Tier Security & Performance Dimensions (`bin/cloudflare-free-tier-hardener.ts`)

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
4. **Free Smart Tiered Cache (`tiered_cache_smart_topology_enable = "on"` — `59/59` zones)**.
5. **Free Bot Fight Mode & AI Scraper Block (`enable_js: true`, `fight_mode: true`, `ai_bots_protection: "block"` — `59/59` zones)**.
6. **Free Leaked Credential Checks (`POST /zones/:id/leaked-credential-checks` `enabled: true` — `59/59` zones)**.
7. **Free Page Shield Client-Side JS Supply-Chain Monitor (`PUT /zones/:id/page_shield` `enabled: true` — `59/59` zones)**.
8. **Free DNSSEC (`PATCH /zones/:id/dnssec` `status: "active"` — `59/59` zones)**.
9. **Free RFC-3986 URL Normalization at Both Incoming WAF & Origin Scope (`PUT /zones/:id/url_normalization` `{"type":"cloudflare","scope":"both"}` — `59/59` zones)**.
10. **25 Free Zone Security & Speed Settings (`59/59` zones)**:
    - `0rtt: "on"`, `always_online: "on"`, `always_use_https: "on"`, `automatic_https_rewrites: "on"`, `brotli: "on"`, `browser_check: "on"`, `early_hints: "on"`, `ech: "on"`, `email_obfuscation: "on"`, `hotlink_protection: "on"`, `http3: "on"`, `ip_geolocation: "on"`, `ipv6: "on"`, `min_tls_version: "1.2"`, `opportunistic_encryption: "on"`, `opportunistic_onion: "on"`, `pq_keyex: "on"` (Post-Quantum ML-KEM), `privacy_pass: "on"`, `pseudo_ipv4: "add_header"`, `replace_insecure_js: "on"`, `security_header` (1-year HSTS Preload `max_age: 31536000, include_subdomains: true, preload: true, nosniff: true`), `security_level: "medium"`, `tls_1_3: "zrt"`, `websockets: "on"`, and `speed_brain: "on"`.

## 4 Hardened Cloudflare AI Gateways (`projectsites`, `megabyte-os`, `projectsites-dev`, `megabyte-space`)

- `collect_logs: true`, `log_classification: true`, `retry_max_attempts: 3`, `retry_delay: 1000`, `retry_backoff: "exponential"`.
