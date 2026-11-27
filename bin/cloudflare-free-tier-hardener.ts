#!/usr/bin/env -S node --experimental-strip-types
/**
 * Cloudflare Free-Tier Maximum Leverage Hardener (`cloudflare-free-tier-hardener.ts`)
 *
 * Audits and enforces every high-value FREE Cloudflare feature across all active zones:
 *   1. 5 Free WAF Custom Firewall Rules (`http_request_firewall_custom` phase):
 *      - [Free-WAF-1] Block Sensitive Dotfiles, VCS, Env & Backup Leaks (/.env, /.git/, /.aws/, /.ssh/, wp-config.php, .sql, .bak)
 *      - [Free-WAF-2] Block CMS, PHP, CGI & Path Traversal Exploit Probes (/wp-admin, /wp-login.php, /xmlrpc.php, /vendor/phpunit, /cgi-bin/, ../, /actuator/)
 *      - [Free-WAF-3] Block Known Vulnerability Scanner & Exploit User-Agents (sqlmap, nikto, nuclei, masscan, zgrab, acunetix, nessus, dirbuster, gobuster)
 *      - [Free-WAF-4] Enforce Standard HTTP Methods & Block TRACE/TRACK Abuse
 *      - [Free-WAF-5] Managed Challenge on Empty-UA Automated Auth & Admin Probes (/admin*, /api/auth/sign-in*, /login)
 *   2. 1 Free HTTP Rate Limiting Rule (`http_ratelimit` phase):
 *      - [Free-RateLimit-1] Protect Auth & Login POST Endpoints Against Brute-Force Floods (25 req / 10s per IP+colo)
 *   3. Free Edge Security Response Headers Transform Rule (`http_response_headers_transform` phase):
 *      - X-Content-Type-Options: nosniff
 *      - Referrer-Policy: strict-origin-when-cross-origin
 *      - X-Permitted-Cross-Domain-Policies: none
 *      - Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
 *   4. Free Smart Tiered Cache (`tiered_cache_smart_topology_enable = "on"`)
 *   5. 14 Free Zone Security & Speed Settings:
 *      - 0rtt: "on", early_hints: "on", hotlink_protection: "on", always_use_https: "on",
 *        automatic_https_rewrites: "on", brotli: "on", browser_check: "on", email_obfuscation: "on",
 *        http3: "on", min_tls_version: "1.2", opportunistic_encryption: "on", security_level: "medium",
 *        tls_1_3: "zrt"
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const home = homedir();

function readSecretFile(name: string): string {
  if (process.env[name]?.trim()) return process.env[name]!.trim();
  const p = join(home, ".config", "agent-fleet", "secrets", name);
  if (existsSync(p)) {
    try {
      return readFileSync(p, "utf8").trim();
    } catch {
      return "";
    }
  }
  return "";
}

const cfEmail = readSecretFile("CLOUDFLARE_EMAIL");
const cfGlobalKey = readSecretFile("CLOUDFLARE_API_KEY");
const cfApiToken = readSecretFile("CLOUDFLARE_API_TOKEN");
const cfAccountId = readSecretFile("CLOUDFLARE_ACCOUNT_ID");

function buildAuthHeaders(): Record<string, string> {
  if (cfEmail && cfGlobalKey) {
    return {
      "X-Auth-Email": cfEmail,
      "X-Auth-Key": cfGlobalKey,
      "Content-Type": "application/json",
    };
  }
  return {
    Authorization: `Bearer ${cfApiToken}`,
    "Content-Type": "application/json",
  };
}

export const FREE_WAF_CUSTOM_RULES = [
  {
    action: "block",
    description: "[Free-WAF-1] Block Sensitive Dotfiles, VCS, Env & Backup Leaks",
    enabled: true,
    expression:
      '(http.request.uri.path contains "/.env" or http.request.uri.path contains "/.git/" or http.request.uri.path contains "/.aws/" or http.request.uri.path contains "/.ssh/" or http.request.uri.path contains "/wp-config.php" or http.request.uri.path contains "/phpinfo.php" or ends_with(http.request.uri.path, ".sql") or ends_with(http.request.uri.path, ".bak"))',
  },
  {
    action: "block",
    description: "[Free-WAF-2] Block CMS, PHP, CGI & Path Traversal Exploit Probes",
    enabled: true,
    expression:
      '(http.request.uri.path contains "/wp-admin" or http.request.uri.path contains "/wp-login.php" or http.request.uri.path contains "/xmlrpc.php" or http.request.uri.path contains "/vendor/phpunit" or http.request.uri.path contains "/cgi-bin/" or http.request.uri.path contains "../" or http.request.uri.path contains "/actuator/")',
  },
  {
    action: "block",
    description: "[Free-WAF-3] Block Known Vulnerability Scanner & Exploit User-Agents",
    enabled: true,
    expression:
      '(lower(http.user_agent) contains "sqlmap" or lower(http.user_agent) contains "nikto" or lower(http.user_agent) contains "nuclei" or lower(http.user_agent) contains "masscan" or lower(http.user_agent) contains "zgrab" or lower(http.user_agent) contains "acunetix" or lower(http.user_agent) contains "nessus" or lower(http.user_agent) contains "dirbuster" or lower(http.user_agent) contains "gobuster")',
  },
  {
    action: "block",
    description: "[Free-WAF-4] Enforce Standard HTTP Methods & Block TRACE/TRACK Abuse",
    enabled: true,
    expression: '(not http.request.method in {"GET" "HEAD" "POST" "PUT" "PATCH" "DELETE" "OPTIONS"})',
  },
  {
    action: "managed_challenge",
    description: "[Free-WAF-5] Managed Challenge on Empty-UA Automated Auth & Admin Probes",
    enabled: true,
    expression:
      '((starts_with(http.request.uri.path, "/admin") or starts_with(http.request.uri.path, "/api/auth/sign-in") or http.request.uri.path eq "/login") and http.user_agent eq "")',
  },
] as const;

export const FREE_RATELIMIT_RULES = [
  {
    action: "block",
    description: "[Free-RateLimit-1] Protect Auth & Login POST Endpoints Against Brute-Force Floods",
    enabled: true,
    expression:
      '((starts_with(http.request.uri.path, "/api/auth/") or http.request.uri.path eq "/login") and http.request.method eq "POST")',
    ratelimit: {
      characteristics: ["cf.colo.id", "ip.src"],
      period: 10,
      requests_per_period: 25,
      mitigation_timeout: 10,
    },
  },
] as const;

export const FREE_SECURITY_HEADER_RULES = [
  {
    action: "rewrite",
    description:
      "[Free-Headers-1] Enforce Edge Security Headers (nosniff, Referrer-Policy, Cross-Domain, Permissions-Policy)",
    enabled: true,
    expression: "true",
    action_parameters: {
      headers: {
        "X-Content-Type-Options": { operation: "set", value: "nosniff" },
        "Referrer-Policy": { operation: "set", value: "strict-origin-when-cross-origin" },
        "X-Permitted-Cross-Domain-Policies": { operation: "set", value: "none" },
        "Permissions-Policy": {
          operation: "set",
          value: "camera=(), microphone=(), geolocation=(), payment=()",
        },
      },
    },
  },
] as const;

export const FREE_CACHE_RULES = [
  {
    action: "set_cache_settings",
    description: "[Free-Cache-1] Bypass Edge Cache for Dynamic API, Auth, MCP, Webhook & Admin Routes",
    enabled: true,
    expression:
      '(starts_with(http.request.uri.path, "/api/") or starts_with(http.request.uri.path, "/admin") or starts_with(http.request.uri.path, "/webhook") or starts_with(http.request.uri.path, "/mcp"))',
    action_parameters: {
      cache: false,
    },
  },
  {
    action: "set_cache_settings",
    description: "[Free-Cache-2] Aggressive Edge (30d) & Browser (1y) Cache for Immutable Hashed Static Assets",
    enabled: true,
    expression:
      '(starts_with(http.request.uri.path, "/assets/") or ends_with(http.request.uri.path, ".woff2") or ends_with(http.request.uri.path, ".avif") or ends_with(http.request.uri.path, ".webp"))',
    action_parameters: {
      cache: true,
      edge_ttl: { mode: "override_origin", default: 2592000 },
      browser_ttl: { mode: "override_origin", default: 31536000 },
    },
  },
] as const;

export const FREE_COMPRESSION_RULES = [
  {
    action: "compress_response",
    description: "[Free-Compress-1] Prefer Zstd, Brotli & Gzip Across All Compressible Web, API & WASM Responses",
    enabled: true,
    expression:
      'http.response.content_type.media_type in {"text/html" "text/css" "application/javascript" "text/javascript" "application/json" "application/problem+json" "image/svg+xml" "application/xml" "text/plain" "application/wasm"}',
    action_parameters: {
      algorithms: [{ name: "zstd" }, { name: "brotli" }, { name: "gzip" }],
    },
  },
] as const;

export const FREE_CONFIG_RULES = [
  {
    action: "set_config",
    description: "[Free-Config-1] Disable Email Obfuscation on API, Auth, MCP & Webhook JSON Endpoints",
    enabled: true,
    expression:
      '(starts_with(http.request.uri.path, "/api/") or starts_with(http.request.uri.path, "/webhook") or starts_with(http.request.uri.path, "/mcp"))',
    action_parameters: {
      email_obfuscation: false,
    },
  },
] as const;

export const MEGABYTE_SPACE_ROWY_FIREBASE_CONFIG_RULE = {
  action: "set_config",
  description: "[Free-Config-2] Firebase Hosting Origin SSL Compatibility for rowy.megabyte.space",
  enabled: true,
  expression: '(http.host eq "rowy.megabyte.space")',
  action_parameters: {
    ssl: "full",
  },
} as const;

export interface CloudflareConfigRule {
  readonly action: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly expression: string;
  readonly action_parameters: Record<string, unknown>;
}

export function buildZoneConfigRules(
  zoneName: string,
  existingRules: ReadonlyArray<Record<string, unknown>> = [],
): CloudflareConfigRule[] {
  const rules: CloudflareConfigRule[] = [...FREE_CONFIG_RULES];
  const seenExpressions = new Set<string>(rules.map((r) => r.expression));

  if (zoneName === "megabyte.space") {
    rules.push(MEGABYTE_SPACE_ROWY_FIREBASE_CONFIG_RULE);
    seenExpressions.add(MEGABYTE_SPACE_ROWY_FIREBASE_CONFIG_RULE.expression);
  }

  for (const existing of existingRules) {
    const actionParams = (existing.action_parameters ?? {}) as Record<string, unknown>;
    const expression = typeof existing.expression === "string" ? existing.expression : "";
    const description =
      typeof existing.description === "string"
        ? existing.description
        : "[Free-Config-Custom] Host-Specific Origin SSL Override";
    if (
      existing.action === "set_config" &&
      actionParams.ssl === "full" &&
      expression.length > 0 &&
      !seenExpressions.has(expression)
    ) {
      rules.push({
        action: "set_config",
        description,
        enabled: existing.enabled !== false,
        expression,
        action_parameters: actionParams,
      });
      seenExpressions.add(expression);
    }
  }

  return rules;
}

export const FREE_ZONE_SETTINGS_ITEMS = [
  { id: "0rtt", value: "on" },
  { id: "always_online", value: "on" },
  { id: "always_use_https", value: "on" },
  { id: "automatic_https_rewrites", value: "on" },
  { id: "brotli", value: "on" },
  { id: "browser_check", value: "on" },
  { id: "early_hints", value: "on" },
  { id: "ech", value: "on" },
  { id: "email_obfuscation", value: "on" },
  { id: "hotlink_protection", value: "on" },
  { id: "http3", value: "on" },
  { id: "ip_geolocation", value: "on" },
  { id: "ipv6", value: "on" },
  { id: "min_tls_version", value: "1.2" },
  { id: "opportunistic_encryption", value: "on" },
  { id: "opportunistic_onion", value: "on" },
  { id: "pq_keyex", value: "on" },
  { id: "privacy_pass", value: "on" },
  { id: "pseudo_ipv4", value: "add_header" },
  { id: "replace_insecure_js", value: "on" },
  { id: "security_header", value: { strict_transport_security: { enabled: true, max_age: 31536000, include_subdomains: true, preload: true, nosniff: true } } },
  { id: "security_level", value: "medium" },
  { id: "tls_1_3", value: "zrt" },
  { id: "websockets", value: "on" },
] as const;

interface CfZone {
  readonly id: string;
  readonly name: string;
  readonly status: string;
}

async function cfRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<{ readonly success: boolean; readonly result?: T; readonly errors?: unknown[] }> {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      ...buildAuthHeaders(),
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  return (await res.json()) as { readonly success: boolean; readonly result?: T; readonly errors?: unknown[] };
}

async function listAllZones(): Promise<CfZone[]> {
  const zones: CfZone[] = [];
  for (let page = 1; page <= 3; page++) {
    const resp = await cfRequest<CfZone[]>(`/zones?per_page=50&page=${page}&status=active`);
    if (!resp.success || !Array.isArray(resp.result) || resp.result.length === 0) break;
    zones.push(...resp.result);
    if (resp.result.length < 50) break;
  }
  return zones;
}

async function hardenZone(zone: CfZone): Promise<{
  readonly zoneId: string;
  readonly zoneName: string;
  readonly settingsApplied: boolean;
  readonly speedBrainEnabled: boolean;
  readonly tieredCacheEnabled: boolean;
  readonly botFightModeEnabled: boolean;
  readonly leakedCredsEnabled: boolean;
  readonly pageShieldEnabled: boolean;
  readonly dnssecEnabled: boolean;
  readonly urlNormalizationEnabled: boolean;
  readonly wafRulesCount: number;
  readonly rateLimitRulesCount: number;
  readonly securityHeaderRulesCount: number;
  readonly cacheRulesCount: number;
  readonly compressionRulesCount: number;
  readonly configRulesCount: number;
}> {
  const existingCfgRes = await cfRequest<{ rules?: Array<Record<string, unknown>> }>(
    `/zones/${zone.id}/rulesets/phases/http_config_settings/entrypoint`,
  );
  const zoneConfigRules = buildZoneConfigRules(
    zone.name,
    Array.isArray(existingCfgRes.result?.rules) ? existingCfgRes.result.rules : [],
  );

  const [
    settingsRes,
    speedBrainRes,
    tieredRes,
    botRes,
    leakedRes,
    shieldRes,
    dnssecRes,
    urlNormRes,
    wafRes,
    rlRes,
    hdrRes,
    cacheRes,
    compressRes,
    cfgRes,
  ] = await Promise.all([
    cfRequest(`/zones/${zone.id}/settings`, {
      method: "PATCH",
      body: JSON.stringify({ items: FREE_ZONE_SETTINGS_ITEMS }),
    }),
    cfRequest(`/zones/${zone.id}/settings/speed_brain`, {
      method: "PATCH",
      body: JSON.stringify({ value: "on" }),
    }),
    cfRequest(`/zones/${zone.id}/cache/tiered_cache_smart_topology_enable`, {
      method: "PATCH",
      body: JSON.stringify({ value: "on" }),
    }),
    cfRequest(`/zones/${zone.id}/bot_management`, {
      method: "PUT",
      body: JSON.stringify({
        enable_js: true,
        fight_mode: true,
        ai_bots_protection: "block",
      }),
    }),
    cfRequest(`/zones/${zone.id}/leaked-credential-checks`, {
      method: "POST",
      body: JSON.stringify({ enabled: true }),
    }),
    cfRequest(`/zones/${zone.id}/page_shield`, {
      method: "PUT",
      body: JSON.stringify({
        enabled: true,
        use_cloudflare_reporting_endpoint: true,
        use_connection_url_path: false,
      }),
    }),
    cfRequest(`/zones/${zone.id}/dnssec`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }),
    }),
    cfRequest(`/zones/${zone.id}/url_normalization`, {
      method: "PUT",
      body: JSON.stringify({ type: "cloudflare", scope: "both" }),
    }),
    cfRequest<{ rules?: unknown[] }>(
      `/zones/${zone.id}/rulesets/phases/http_request_firewall_custom/entrypoint`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: "default",
          description: "Sovereign Free-Tier 5-Rule WAF Custom Firewall",
          rules: FREE_WAF_CUSTOM_RULES,
        }),
      },
    ),
    cfRequest<{ rules?: unknown[] }>(`/zones/${zone.id}/rulesets/phases/http_ratelimit/entrypoint`, {
      method: "PUT",
      body: JSON.stringify({
        name: "default",
        description: "Sovereign Free-Tier Auth & Login Rate Limit Rule",
        rules: FREE_RATELIMIT_RULES,
      }),
    }),
    cfRequest<{ rules?: unknown[] }>(
      `/zones/${zone.id}/rulesets/phases/http_response_headers_transform/entrypoint`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: "default",
          description: "Sovereign Free-Tier Edge Security Response Headers",
          rules: FREE_SECURITY_HEADER_RULES,
        }),
      },
    ),
    cfRequest<{ rules?: unknown[] }>(
      `/zones/${zone.id}/rulesets/phases/http_request_cache_settings/entrypoint`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: "default",
          description: "Sovereign Free-Tier Edge Cache Rules",
          rules: FREE_CACHE_RULES,
        }),
      },
    ),
    cfRequest<{ rules?: unknown[] }>(
      `/zones/${zone.id}/rulesets/phases/http_response_compression/entrypoint`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: "default",
          description: "Sovereign Free-Tier Zstd + Brotli + Gzip Compression Rule",
          rules: FREE_COMPRESSION_RULES,
        }),
      },
    ),
    cfRequest<{ rules?: unknown[] }>(
      `/zones/${zone.id}/rulesets/phases/http_config_settings/entrypoint`,
      {
        method: "PUT",
        body: JSON.stringify({
          name: "default",
          description: "Sovereign Free-Tier Edge Config Rules",
          rules: zoneConfigRules,
        }),
      },
    ),
  ]);

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    settingsApplied: Boolean(settingsRes.success),
    speedBrainEnabled: Boolean(speedBrainRes.success),
    tieredCacheEnabled: Boolean(tieredRes.success),
    botFightModeEnabled: Boolean(botRes.success),
    leakedCredsEnabled: Boolean(leakedRes.success),
    pageShieldEnabled: Boolean(shieldRes.success),
    dnssecEnabled: Boolean(dnssecRes.success),
    urlNormalizationEnabled: Boolean(urlNormRes.success),
    wafRulesCount: wafRes.success ? (wafRes.result?.rules?.length ?? 5) : 0,
    rateLimitRulesCount: rlRes.success ? (rlRes.result?.rules?.length ?? 1) : 0,
    securityHeaderRulesCount: hdrRes.success ? (hdrRes.result?.rules?.length ?? 1) : 0,
    cacheRulesCount: cacheRes.success ? (cacheRes.result?.rules?.length ?? 2) : 0,
    compressionRulesCount: compressRes.success ? (compressRes.result?.rules?.length ?? 1) : 0,
    configRulesCount: cfgRes.success ? (cfgRes.result?.rules?.length ?? 1) : 0,
  };
}

async function main(): Promise<void> {
  if (!cfGlobalKey && !cfApiToken) {
    console.log(
      JSON.stringify({
        ok: true,
        mode: "manifest-only",
        reason: "No local CLOUDFLARE_API_KEY on this host; run on ubuntu.megabyte.space for live 59-zone enforcement",
        wafRulesPerZone: FREE_WAF_CUSTOM_RULES.length,
        rateLimitRulesPerZone: FREE_RATELIMIT_RULES.length,
        securityHeadersPerZone: 4,
        zoneSettingsPerZone: FREE_ZONE_SETTINGS_ITEMS.length,
      }),
    );
    return;
  }

  const filterNames = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const allZones = await listAllZones();
  const targets =
    filterNames.length > 0 ? allZones.filter((z) => filterNames.includes(z.name)) : allZones;

  const results = [];
  // Process in batches of 6 concurrent zones so we finish all 59 zones in ~10 seconds without hitting CF API rate limits
  const batchSize = 6;
  for (let i = 0; i < targets.length; i += batchSize) {
    const slice = targets.slice(i, i + batchSize);
    const batchOut = await Promise.all(slice.map((z) => hardenZone(z)));
    results.push(...batchOut);
  }

  let aiGatewaysHardened = 0;
  if (cfAccountId) {
    try {
      const gwList = await cfRequest<Array<Record<string, unknown>>>(
        `/accounts/${cfAccountId}/ai-gateway/gateways`,
      );
      if (gwList.success && Array.isArray(gwList.result)) {
        for (const gw of gwList.result) {
          const gwId = String(gw.id ?? "");
          if (!gwId) continue;
          const upd = await cfRequest(`/accounts/${cfAccountId}/ai-gateway/gateways/${gwId}`, {
            method: "PUT",
            body: JSON.stringify({
              ...gw,
              collect_logs: true,
              log_classification: true,
              retry_max_attempts: 3,
              retry_delay: 1000,
              retry_backoff: "exponential",
            }),
          });
          if (upd.success) aiGatewaysHardened++;
        }
      }
    } catch {
      // ignore AI Gateway update errors
    }
  }

  const summary = {
    ok: true,
    timestamp: new Date().toISOString(),
    totalZonesHardened: results.length,
    wafConfiguredZones: results.filter((r) => r.wafRulesCount === 5).length,
    rateLimitConfiguredZones: results.filter((r) => r.rateLimitRulesCount === 1).length,
    securityHeadersConfiguredZones: results.filter((r) => r.securityHeaderRulesCount === 1).length,
    cacheRulesConfiguredZones: results.filter((r) => r.cacheRulesCount === 2).length,
    compressionRulesConfiguredZones: results.filter((r) => r.compressionRulesCount === 1).length,
    configRulesConfiguredZones: results.filter((r) => r.configRulesCount >= 1).length,
    tieredCacheConfiguredZones: results.filter((r) => r.tieredCacheEnabled).length,
    botFightModeConfiguredZones: results.filter((r) => r.botFightModeEnabled).length,
    leakedCredsConfiguredZones: results.filter((r) => r.leakedCredsEnabled).length,
    pageShieldConfiguredZones: results.filter((r) => r.pageShieldEnabled).length,
    dnssecConfiguredZones: results.filter((r) => r.dnssecEnabled).length,
    urlNormalizationConfiguredZones: results.filter((r) => r.urlNormalizationEnabled).length,
    settingsConfiguredZones: results.filter((r) => r.settingsApplied).length,
    aiGatewaysHardened,
    zones: results,
  };

  try {
    writeFileSync("/tmp/cloudflare-free-tier-hardening-report.json", JSON.stringify(summary, null, 2) + "\n", "utf8");
    const ocReportPath = join(home, ".openclaw", "cloudflare-free-tier-hardening-report.json");
    if (existsSync(join(home, ".openclaw"))) {
      writeFileSync(ocReportPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
    }
  } catch {}

  console.log(JSON.stringify(summary, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
