#!/usr/bin/env -S node --experimental-strip-types
/**
 * Fleet 55-Repository Multi-Axis Converger (`bin/fleet-55-repo-multi-axis-converger.ts`)
 *
 * Uses parallel worker batching (`Promise.all`) to converge every repository in the fleet across 8 axes:
 *   1. `AGENTS.md` — Canonical 4-Harness (`cr`), `@theme.tools/*` 28-library thin-shell, VoiceKit ($17k credits),
 *      13-dimension Cloudflare Free-Tier hardening, and Sovereign 8-Pillar Telemetry contract.
 *   2. `CLAUDE.md` — Canonical Claude Code & OpenSpec Architect entrypoint.
 *   3. `openspec/project.md` — OpenSpec project specification, capability bindings & 16-state OKLCH convergence contract.
 *   4. `public/.well-known/security.txt` — RFC 9116 vulnerability disclosure policy.
 *   5. `public/llms.txt` — GEO / AI crawler discovery specification (`llmstxt.org`).
 *   6. `public/robots.txt` — Search & AI crawler policy protecting `/api/`, `/admin/`, `/webhook/`, `/mcp/`.
 *   7. Web Entrypoint (`index.html`) Enhancement — Chromium Speculation Rules API (`<script type="speculationrules">`),
 *      dark-first `#060610` `<meta name="theme-color">`, Google Consent Mode v2 default-deny (`gcs=G100`), and 8-pillar meta marker.
 *   8. Consumer Code, Screen & Component Migration to VoiceKit ($17,000 Startup Credits Grant replacing ElevenLabs)
 *      across `bricklabor.com`, `projectsites.dev`, `mission.megabyte.space`, `njsk.org`, and `install.doctor`.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_REPOS_ROOT = existsSync("/home/professormanhattan/ai/repos")
  ? "/home/professormanhattan/ai/repos"
  : "/Users/Apple/emdash/repositories";

function buildAgentsMd(repoName: string): string {
  const domain = repoName.includes(".") ? repoName : `${repoName}.megabyte.space`;
  return `# AGENTS.md — ${repoName}

This repository (\`${repoName}\` · \`https://${domain}\`) is part of the Sovereign 55-Repository Emdash & Paperclip (\`swarml.ink\`) Engineering Fleet.

## 1. Stack & \`@theme.tools/*\` Thin-Shell Architecture

- **Runtime & Edge**: Cloudflare Workers + Hono + D1/Neon + Drizzle ORM + Better Auth + Stripe + VoiceKit (\`$17,000\` Startup Credits Grant).
- **Frontend**: React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps), Dark-First \`#060610\` background & \`#00E5FF\` accent, \`0.333s\` OKLCH transitions across all 16 interaction states, APCA \`Lc >= 60\`.
- **Canonical Shared Libraries (\`@theme.tools/*\` 28 Default Packages)**: Extract all reusable UI components, calculators, workflows, auth, billing, CRM, media/video, SEO/GEO, and telemetry logic into \`heymegabyte/theme.tools\`. Keep this repository a clean thin-shell composition layer.

## 2. 4-Harness + Local Fallback Routing (\`cr\`) & OpenSpec Governance

- **Frontier Architect Only for OpenSpec (\`claude-1/2/3\` / \`codex\` / \`gemini\` — NEVER \`opencode\`)**: Author and update \`openspec/project.md\` and \`openspec/changes/<change-id>/\` before material behavior, UI, or schema changes.
- **DeepSeek Off-Peak (\`16:30–00:30 UTC\`) & Local GPU Ollama Offload**: Offload mechanical, batch, and throughput-safe tasks onto \`deepseek-v4-pro\`, \`deepseek-flash\`, and local \`ollama\` (\`hybrid-coder\`) via Claw Router (\`cr\`) and LiteLLM Gateway (\`https://llm.megabyte.space\`).

## 3. VoiceKit (\`$17,000\` Credits Tier — Replaces ElevenLabs Everywhere)

- Use **VoiceKit** (\`voicekit-mcp\`, \`@theme.tools/media-video\` \`buildVoiceKitTtsRequest\` / \`buildVoiceKitPodcastStudioRequest\`, \`VOICEKIT_API_KEY\`, \`VOICEKIT_AGENT_ID\`) for all real-time voice agents, two-host podcast conversations (\`voicekit-sage\` + \`voicekit-river\`), and TTS narration, backed by \`@cf/myshell-ai/melotts\` on Cloudflare Workers AI and local Piper ONNX fallback. Never introduce new ElevenLabs dependencies.

## 4. Cloudflare 13-Dimension Free-Tier Edge Security & Sovereign 8-Pillar Telemetry

- **Edge Security**: Protected by 5 Free WAF Custom Rules, 1 Auth Rate Limit Rule, 4 Edge Security Headers, 2 Edge Cache Rules, Zstd+Brotli+Gzip Compression Rule, API-Safe Email-Obfuscation-Bypass Config Rule, Smart Tiered Cache, Bot Fight Mode + AI Scraper Block, Leaked Credential Checks, Page Shield, DNSSEC, RFC-3986 URL Normalization (\`scope: "both"\`), and 25 Zone Settings (including 1-year HSTS Preload, Post-Quantum ML-KEM \`pq_keyex\`, ECH, and Speed Brain).
- **8-Pillar Telemetry**: PostHog 4-Event AI Tree, Sentry Envelope v7, GA4 Measurement Protocol, GTM Consent Mode v2 default-deny (\`gcs=G100\`), Langfuse Cloud v4 OTLP (\`2500ms\` \`AbortSignal.timeout(2500)\` fail-open + 3-strike circuit breaker), Cloudflare First-Party RUM Proxy, W3C \`traceparent\`, and Promptfoo 25/25 Synthetic Evals.
`;
}

function buildClaudeMd(repoName: string): string {
  return `# CLAUDE.md — ${repoName}

Load [AGENTS.md](./AGENTS.md) and [openspec/project.md](./openspec/project.md) for repository architecture, stack defaults, and verification gates.
Load \`~/.agentskills/CONVENTIONS.md\` and \`~/.agentskills/_router.md\` for Emdash skill routing across all 28 \`@theme.tools/*\` packages.
`;
}

function buildOpenSpecProjectMd(repoName: string): string {
  const domain = repoName.includes(".") ? repoName : `${repoName}.megabyte.space`;
  return `# OpenSpec Project Specification — ${repoName}

## 1. Overview & Domain

- **Repository**: \`heymegabyte/${repoName}\`
- **Primary Domain**: \`https://${domain}\`
- **Control Plane**: Paperclip (\`https://swarml.ink\`) + OpenClaw (\`https://openclaw.swarml.ink\`)

## 2. Canonical \`@theme.tools/*\` Capability Bindings

- **Tier 1 (Core UI & Content)**: \`@theme.tools/themes\`, \`@theme.tools/ui\`, \`@theme.tools/blog\`, \`@theme.tools/catalog\`, \`@theme.tools/testing\`
- **Tier 2 (CF-Native SaaS Engines)**: \`@theme.tools/workflows\`, \`@theme.tools/integrations\`, \`@theme.tools/forms\`, \`@theme.tools/crm\`, \`@theme.tools/billing\`, \`@theme.tools/status\`, \`@theme.tools/kb\`
- **Tier 3 (Foundational Utilities)**: \`@theme.tools/telemetry\`, \`@theme.tools/auth\`, \`@theme.tools/flags\`, \`@theme.tools/agent-ui\`, \`@theme.tools/seo-geo\`, \`@theme.tools/media-video\` (VoiceKit \`$17,000\` Credits Tier), \`@theme.tools/crawl-research\`, \`@theme.tools/i18n-a11y\`

## 3. Verification & Multi-Axis Convergence Gates

- **TypeScript Strict**: Zero \`any\`, Zod validation on all external inputs, RFC 9457 \`application/problem+json\` error responses with W3C \`traceparent\`.
- **UI & Accessibility**: 6 Playwright breakpoints (\`320px\`, \`375px\`, \`768px\`, \`1024px\`, \`1280px\`, \`1536px\`), dark-first \`#060610\` palette, APCA contrast \`Lc >= 60\`, \`CLS = 0\`, \`INP <= 200ms\`.
- **Telemetry**: Langfuse \`2500ms\` fail-open timeout (\`AbortSignal.timeout(2500)\`), GTM Consent Mode v2 default-deny (\`gcs=G100\`), and zero leaked credentials/PII.
`;
}

function buildSecurityTxt(repoName: string): string {
  const domain = repoName.includes(".") ? repoName : `${repoName}.megabyte.space`;
  return `Contact: mailto:security@megabyte.space
Contact: https://swarml.ink/security
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://${domain}/.well-known/security.txt
Policy: https://megabyte.space/security-policy
`;
}

function buildLlmsTxt(repoName: string): string {
  const domain = repoName.includes(".") ? repoName : `${repoName}.megabyte.space`;
  return `# ${repoName} (${domain})

> Sovereign Cloudflare-native web property & application powered by the 28 canonical \`@theme.tools/*\` libraries, Paperclip (\`swarml.ink\`), OpenClaw (\`openclaw.swarml.ink\`), and VoiceKit (\`$17,000\` startup credits voice/audio platform).

## Architecture & Capabilities

- **Edge Runtime**: Cloudflare Workers + Hono + D1/Neon + R2 + Queues + AI Gateway.
- **Voice & Media**: VoiceKit Neural TTS & Conversational Voice AI (\`$17,000\` credits tier) + Cloudflare Workers AI MeloTTS (\`@cf/myshell-ai/melotts\`) + HyperFrames 4K video pipeline.
- **Observability**: Sovereign 8-Pillar Telemetry (\`@theme.tools/telemetry\`, W3C \`traceparent\`, GTM Consent Mode v2, Langfuse v4 \`2500ms\` fail-open, PostHog, Sentry Envelope v7).
- **Security**: RFC 9116 \`/.well-known/security.txt\`, 13-dimension Cloudflare Free-Tier Edge Hardening (5 WAF rules, Rate Limiting, 4 Security Headers, Cache Rules, Zstd Compression, HSTS Preload, Post-Quantum ML-KEM, Page Shield, DNSSEC, URL Normalization \`scope=both\`).

## Key Endpoints & Resources

- [Homepage](https://${domain}/)
- [Security Policy](https://${domain}/.well-known/security.txt)
- [Robots Policy](https://${domain}/robots.txt)
`;
}

function buildRobotsTxt(repoName: string): string {
  const domain = repoName.includes(".") ? repoName : `${repoName}.megabyte.space`;
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /webhook/
Disallow: /mcp/

Sitemap: https://${domain}/sitemap.xml
# GEO / LLM Discovery: https://${domain}/llms.txt
`;
}

const HEAD_INJECTION_SNIPPET = `
  <!-- Sovereign 8-Pillar Telemetry, Dark-First #060610 Theme, GTM Consent Mode v2 (gcs=G100) & Speculation Rules API -->
  <meta name="theme-color" content="#060610" />
  <meta name="color-scheme" content="dark light" />
  <meta name="x-sovereign-telemetry-pillars" content="posthog,sentry,ga4,gtm-consent-v2,langfuse-2500ms,cf-rum,w3c-traceparent,promptfoo" />
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'security_storage': 'granted',
      'wait_for_update': 500
    });
  </script>
  <script type="speculationrules">
    {
      "prefetch": [
        {
          "source": "document",
          "where": {
            "and": [
              { "href_matches": "/*" },
              { "not": { "href_matches": "/api/*" } },
              { "not": { "href_matches": "/admin*" } },
              { "not": { "href_matches": "/webhook*" } },
              { "not": { "href_matches": "/mcp*" } },
              { "not": { "href_matches": "/logout*" } }
            ]
          },
          "eagerness": "conservative"
        }
      ]
    }
  </script>
</head>`;

function enhanceIndexHtmlFile(htmlPath: string): boolean {
  if (!existsSync(htmlPath)) return false;
  const raw = readFileSync(htmlPath, "utf8");
  let next = raw;

  if (!next.includes("speculationrules") || !next.includes("ad_storage") || !next.includes('name="theme-color"')) {
    const injectBlocks: string[] = [];
    if (!next.includes('name="theme-color"')) {
      injectBlocks.push('  <meta name="theme-color" content="#060610" />');
      injectBlocks.push('  <meta name="color-scheme" content="dark light" />');
    }
    if (!next.includes('name="x-sovereign-telemetry-pillars"')) {
      injectBlocks.push(
        '  <meta name="x-sovereign-telemetry-pillars" content="posthog,sentry,ga4,gtm-consent-v2,langfuse-2500ms,cf-rum,w3c-traceparent,promptfoo" />',
      );
    }
    if (!next.includes("ad_storage") && !next.includes("consent")) {
      injectBlocks.push(
        `  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',security_storage:'granted',wait_for_update:500});</script>`,
      );
    }
    if (!next.includes("speculationrules")) {
      injectBlocks.push(
        `  <script type="speculationrules">{"prefetch":[{"source":"document","where":{"and":[{"href_matches":"/*"},{"not":{"href_matches":"/api/*"}},{"not":{"href_matches":"/admin*"}},{"not":{"href_matches":"/webhook*"}},{"not":{"href_matches":"/mcp*"}},{"not":{"href_matches":"/logout*"}}]},"eagerness":"conservative"}]}</script>`,
      );
    }
    if (injectBlocks.length > 0 && next.includes("</head>")) {
      next = next.replace("</head>", `${injectBlocks.join("\n")}\n</head>`);
    }
  }

  if (next !== raw) {
    writeFileSync(htmlPath, next, "utf8");
    return true;
  }
  return false;
}

function migrateConsumerRepoVoiceKit(repoDir: string, repoName: string): number {
  let edits = 0;

  // 1. bricklabor.com voice-ai-intake & AGENTS.md
  if (repoName === "bricklabor.com") {
    const agentsMd = join(repoDir, "AGENTS.md");
    if (existsSync(agentsMd)) {
      const src = readFileSync(agentsMd, "utf8");
      const next = src.replace(
        /\*\*Voice storytelling:\*\*[^\n]+/g,
        "**Voice storytelling & intake:** use VoiceKit (`voicekit-mcp`, `$17,000` startup credits grant, replacing ElevenLabs) with MeloTTS Workers AI fallback for stories, voice booking, and audio summaries.",
      );
      if (next !== src) {
        writeFileSync(agentsMd, next, "utf8");
        edits++;
      }
    }
    const svcPath = join(repoDir, "workers/main/src/features/voice-ai-intake/service.ts");
    if (existsSync(svcPath)) {
      const src = readFileSync(svcPath, "utf8");
      const next = src
        .replace(
          /interface ElevenLabsEnv \{[\s\S]*?\}/,
          `interface VoiceKitAndLegacyElevenLabsEnv {\n  VOICEKIT_API_KEY?: string;\n  VOICEKIT_AGENT_ID?: string;\n  VOICEKIT_WSS_BASE?: string;\n  ELEVENLABS_API_KEY?: string;\n  ELEVENLABS_AGENT_ID?: string;\n  ELEVENLABS_WSS_BASE?: string;\n}`,
        )
        .replace(/as unknown as ElevenLabsEnv/g, "as unknown as VoiceKitAndLegacyElevenLabsEnv")
        .replace(
          /const agentId = e\.ELEVENLABS_AGENT_ID\?\.trim\(\);/,
          "const agentId = (e.VOICEKIT_AGENT_ID ?? e.ELEVENLABS_AGENT_ID)?.trim();",
        )
        .replace(
          /const base = \(e\.ELEVENLABS_WSS_BASE\?\.trim\(\) \|\| 'wss:\/\/api\.elevenlabs\.io\/v1\/convai\/conversation'\)/,
          "const base = ((e.VOICEKIT_WSS_BASE ?? e.ELEVENLABS_WSS_BASE)?.trim() || 'wss://api.voicekit.ai/v1/convai/conversation')",
        );
      if (next !== src) {
        writeFileSync(svcPath, next, "utf8");
        edits++;
      }
    }
    const routesPath = join(repoDir, "workers/main/src/features/voice-ai-intake/routes.ts");
    if (existsSync(routesPath)) {
      const src = readFileSync(routesPath, "utf8");
      let next = src.replace(
        /interface VoiceEnv extends Env \{[\s\S]*?\}/,
        `interface VoiceEnv extends Env {\n  VOICEKIT_API_KEY?: string;\n  VOICEKIT_AGENT_ID?: string;\n  VOICEKIT_WSS_BASE?: string;\n  VOICEKIT_TOOL_BEARER?: string;\n  ELEVENLABS_API_KEY?: string;\n  ELEVENLABS_AGENT_ID?: string;\n  ELEVENLABS_WSS_BASE?: string;\n  ELEVENLABS_TOOL_BEARER?: string;\n  TWILIO_ACCOUNT_SID?: string;\n}`,
      );
      next = next.replace(
        /const expected = c\.env\.ELEVENLABS_TOOL_BEARER;/g,
        "const expected = c.env.VOICEKIT_TOOL_BEARER ?? c.env.ELEVENLABS_TOOL_BEARER;",
      );
      if (!next.includes("'/webhook/voicekit'")) {
        next = next.replace(
          "app.post('/webhook/elevenlabs'",
          "app.post('/webhook/voicekit', requireToolBearer, async (c) => {\n    const raw = await c.req.json().catch(() => null);\n    const parsed = ElevenLabsWebhookSchema.safeParse(raw);\n    if (!parsed.success) return c.json({ ok: false, error: 'invalid_payload' }, 400);\n    const result = await applyElevenLabsWebhook(c.env.DB, parsed.data);\n    return c.json({ ok: true, provider: 'voicekit', call: result });\n  });\n\n  app.post('/webhook/elevenlabs'",
        );
      }
      if (next !== src) {
        writeFileSync(routesPath, next, "utf8");
        edits++;
      }
    }
  }

  // 2. projectsites.dev Angular admin screens & worker env
  if (repoName === "projectsites.dev") {
    const mcpProvPath = join(repoDir, "apps/project-sites/frontend/src/app/pages/admin/sections/mcp-providers.ts");
    if (existsSync(mcpProvPath)) {
      const src = readFileSync(mcpProvPath, "utf8");
      if (!src.includes("id: 'voicekit'")) {
        const next = src.replace(
          "{ id: 'elevenlabs',",
          "{ id: 'voicekit',        label: 'VoiceKit ($17k Credits)', desc: 'Primary voice synthesis, real-time IVR & two-host podcast studio ($17,000 credit grant).', color: '#00E5FF', needsOauth: false, oauth_supported: false, group: 'AI Providers' },\n  { id: 'elevenlabs',",
        );
        if (next !== src) {
          writeFileSync(mcpProvPath, next, "utf8");
          edits++;
        }
      }
    }
    const voiceCompPath = join(
      repoDir,
      "apps/project-sites/frontend/src/app/pages/admin/sections/voice/agent-settings.component.ts",
    );
    if (existsSync(voiceCompPath)) {
      const src = readFileSync(voiceCompPath, "utf8");
      const next = src.replace(
        "Voice ids are ElevenLabs ids — the provider itself is platform-managed and not editable here.",
        "Voice ids use VoiceKit ($17,000 Credits Tier, e.g. voicekit-sage / voicekit-river) with legacy ElevenLabs ID compatibility.",
      );
      if (next !== src) {
        writeFileSync(voiceCompPath, next, "utf8");
        edits++;
      }
    }
    const envPath = join(repoDir, "apps/project-sites/src/types/env.ts");
    if (existsSync(envPath)) {
      const src = readFileSync(envPath, "utf8");
      if (!src.includes("VOICEKIT_API_KEY")) {
        const next = src.replace(
          "ELEVENLABS_API_KEY?: string;",
          "/** VoiceKit ($17,000 startup credits grant) primary API key & voice override. */\n  VOICEKIT_API_KEY?: string;\n  VOICEKIT_VOICE_ID?: string;\n  VOICEKIT_AGENT_ID?: string;\n  ELEVENLABS_API_KEY?: string;",
        );
        if (next !== src) {
          writeFileSync(envPath, next, "utf8");
          edits++;
        }
      }
    }
  }

  // 3. mission.megabyte.space
  if (repoName === "mission.megabyte.space") {
    for (const rel of ["src/index.ts", "src/automations.ts"]) {
      const p = join(repoDir, rel);
      if (existsSync(p)) {
        const src = readFileSync(p, "utf8");
        if (!src.includes("VOICEKIT_API_KEY")) {
          const next = src.replace(
            "ELEVENLABS_API_KEY?: string;",
            "VOICEKIT_API_KEY?: string;\n  ELEVENLABS_API_KEY?: string;",
          );
          if (next !== src) {
            writeFileSync(p, next, "utf8");
            edits++;
          }
        }
      }
    }
  }

  // 4. install.doctor
  if (repoName === "install.doctor") {
    const tmplPath = join(repoDir, "home/dot_config/shell/private_private.sh.tmpl");
    if (existsSync(tmplPath)) {
      const src = readFileSync(tmplPath, "utf8");
      if (!src.includes("VOICEKIT_API_KEY")) {
        const next = src.replace(
          "### Elevenlabs",
          '### VoiceKit ($17,000 Startup Credits Grant — Replaces ElevenLabs)\nexport VOICEKIT_API_KEY="{{ if (stat (joinPath .chezmoi.sourceDir ".chezmoitemplates" (printf "%s%s" "secrets-" .chezmoi.hostname) "VOICEKIT_API_KEY")) }}{{ includeTemplate (printf "%s%s" (printf "%s%s" "secrets-" .chezmoi.hostname) "/VOICEKIT_API_KEY") | decrypt | trim }}{{ else }}{{ env "VOICEKIT_API_KEY" }}{{ end }}"\n\n### Elevenlabs (Legacy Compatibility)',
        );
        if (next !== src) {
          writeFileSync(tmplPath, next, "utf8");
          edits++;
        }
      }
    }
    const secDocPath = join(repoDir, "docs/customization/secrets.md");
    if (existsSync(secDocPath)) {
      const src = readFileSync(secDocPath, "utf8");
      if (!src.includes("VOICEKIT_API_KEY")) {
        const next = src.replace(
          "| `ELEVENLABS_API_KEY`",
          "| `VOICEKIT_API_KEY`               | Primary VoiceKit ($17,000 startup credits grant) API key for real-time voice agents, two-host Podcast Studio, and Neural TTS (replaces ElevenLabs) |\n| `ELEVENLABS_API_KEY`",
        );
        if (next !== src) {
          writeFileSync(secDocPath, next, "utf8");
          edits++;
        }
      }
    }
  }

  return edits;
}

async function convergeSingleRepository(
  reposRoot: string,
  repoName: string,
  preserveCleanSet: ReadonlySet<string>,
): Promise<{
  readonly repoName: string;
  readonly skippedPreserveClean: boolean;
  readonly agentsMdReady: boolean;
  readonly claudeMdReady: boolean;
  readonly openSpecReady: boolean;
  readonly securityTxtReady: boolean;
  readonly llmsTxtReady: boolean;
  readonly robotsTxtReady: boolean;
  readonly htmlFilesEnhanced: number;
  readonly voicekitCodeEdits: number;
}> {
  const repoDir = join(reposRoot, repoName);
  if (preserveCleanSet.has(repoName)) {
    return {
      repoName,
      skippedPreserveClean: true,
      agentsMdReady: existsSync(join(repoDir, "AGENTS.md")),
      claudeMdReady: existsSync(join(repoDir, "CLAUDE.md")),
      openSpecReady: existsSync(join(repoDir, "openspec/project.md")),
      securityTxtReady: existsSync(join(repoDir, "public/.well-known/security.txt")),
      llmsTxtReady: existsSync(join(repoDir, "public/llms.txt")) || existsSync(join(repoDir, "llms.txt")),
      robotsTxtReady: existsSync(join(repoDir, "public/robots.txt")),
      htmlFilesEnhanced: 0,
      voicekitCodeEdits: 0,
    };
  }

  // 1. AGENTS.md
  const agentsMdPath = join(repoDir, "AGENTS.md");
  if (!existsSync(agentsMdPath)) {
    writeFileSync(agentsMdPath, buildAgentsMd(repoName), "utf8");
  }

  // 2. CLAUDE.md
  const claudeMdPath = join(repoDir, "CLAUDE.md");
  if (!existsSync(claudeMdPath)) {
    writeFileSync(claudeMdPath, buildClaudeMd(repoName), "utf8");
  }

  // 3. openspec/project.md
  const openSpecDir = join(repoDir, "openspec");
  const openSpecChangesDir = join(openSpecDir, "changes");
  const openSpecProjectPath = join(openSpecDir, "project.md");
  if (!existsSync(openSpecProjectPath)) {
    mkdirSync(openSpecChangesDir, { recursive: true });
    writeFileSync(openSpecProjectPath, buildOpenSpecProjectMd(repoName), "utf8");
  }

  // Determine public directory
  const pubDir = existsSync(join(repoDir, "frontend/public"))
    ? join(repoDir, "frontend/public")
    : join(repoDir, "public");
  mkdirSync(join(pubDir, ".well-known"), { recursive: true });

  // 4. RFC 9116 .well-known/security.txt
  const secTxtPath = join(pubDir, ".well-known", "security.txt");
  const altSecTxtPath = join(repoDir, "public/.well-known/security.txt");
  if (!existsSync(secTxtPath) && !existsSync(altSecTxtPath)) {
    writeFileSync(secTxtPath, buildSecurityTxt(repoName), "utf8");
  }
  if (!existsSync(altSecTxtPath)) {
    mkdirSync(join(repoDir, "public/.well-known"), { recursive: true });
    writeFileSync(altSecTxtPath, buildSecurityTxt(repoName), "utf8");
  }

  // 5. GEO / AI Discovery llms.txt
  const llmsTxtPath = join(repoDir, "public/llms.txt");
  if (!existsSync(llmsTxtPath) && !existsSync(join(repoDir, "llms.txt")) && !existsSync(join(pubDir, "llms.txt"))) {
    writeFileSync(llmsTxtPath, buildLlmsTxt(repoName), "utf8");
  } else if (!existsSync(llmsTxtPath) && existsSync(join(repoDir, "llms.txt"))) {
    writeFileSync(llmsTxtPath, readFileSync(join(repoDir, "llms.txt"), "utf8"), "utf8");
  }

  // 6. AI-aware robots.txt
  const robotsTxtPath = join(repoDir, "public/robots.txt");
  if (!existsSync(robotsTxtPath) && !existsSync(join(pubDir, "robots.txt"))) {
    writeFileSync(robotsTxtPath, buildRobotsTxt(repoName), "utf8");
  }

  // 7. Enhance primary index.html entrypoints
  let htmlFilesEnhanced = 0;
  for (const rel of [
    "index.html",
    "frontend/index.html",
    "apps/web/index.html",
    "public/index.html",
    "site/index.html",
    "angular/src/index.html",
    "src/index.html",
    "src-web/index.html",
  ]) {
    if (enhanceIndexHtmlFile(join(repoDir, rel))) {
      htmlFilesEnhanced++;
    }
  }

  // 8. Consumer VoiceKit $17,000 Credits migration
  const voicekitCodeEdits = migrateConsumerRepoVoiceKit(repoDir, repoName);

  return {
    repoName,
    skippedPreserveClean: false,
    agentsMdReady: existsSync(join(repoDir, "AGENTS.md")),
    claudeMdReady: existsSync(join(repoDir, "CLAUDE.md")),
    openSpecReady: existsSync(join(repoDir, "openspec/project.md")),
    securityTxtReady:
      existsSync(join(repoDir, "public/.well-known/security.txt")) ||
      existsSync(join(repoDir, "frontend/public/.well-known/security.txt")),
    llmsTxtReady:
      existsSync(join(repoDir, "public/llms.txt")) ||
      existsSync(join(repoDir, "llms.txt")) ||
      existsSync(join(repoDir, "frontend/public/llms.txt")),
    robotsTxtReady:
      existsSync(join(repoDir, "public/robots.txt")) ||
      existsSync(join(repoDir, "frontend/public/robots.txt")),
    htmlFilesEnhanced,
    voicekitCodeEdits,
  };
}

export async function runFleet55RepoMultiAxisConvergence(options?: {
  readonly reposRoot?: string;
  readonly preserveCleanRepos?: readonly string[];
}): Promise<{
  readonly ok: boolean;
  readonly reposRoot: string;
  readonly totalRepositories: number;
  readonly agentsMdConverged: number;
  readonly claudeMdConverged: number;
  readonly openSpecConverged: number;
  readonly securityTxtConverged: number;
  readonly llmsTxtConverged: number;
  readonly robotsTxtConverged: number;
  readonly htmlFilesEnhancedTotal: number;
  readonly voicekitCodeEditsTotal: number;
}> {
  const reposRoot = options?.reposRoot ?? DEFAULT_REPOS_ROOT;
  const preserveCleanSet = new Set(options?.preserveCleanRepos ?? []);
  const repoNames = readdirSync(reposRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort();

  const results = await Promise.all(
    repoNames.map((name) => convergeSingleRepository(reposRoot, name, preserveCleanSet)),
  );

  return {
    ok: true,
    reposRoot,
    totalRepositories: results.length,
    agentsMdConverged: results.filter((r) => r.agentsMdReady).length,
    claudeMdConverged: results.filter((r) => r.claudeMdReady).length,
    openSpecConverged: results.filter((r) => r.openSpecReady).length,
    securityTxtConverged: results.filter((r) => r.securityTxtReady).length,
    llmsTxtConverged: results.filter((r) => r.llmsTxtReady).length,
    robotsTxtConverged: results.filter((r) => r.robotsTxtReady).length,
    htmlFilesEnhancedTotal: results.reduce((acc, r) => acc + r.htmlFilesEnhanced, 0),
    voicekitCodeEditsTotal: results.reduce((acc, r) => acc + r.voicekitCodeEdits, 0),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const rootIdx = args.indexOf("--root");
  const reposRoot = rootIdx !== -1 && args[rootIdx + 1] ? args[rootIdx + 1]! : DEFAULT_REPOS_ROOT;
  const preserveIdx = args.indexOf("--preserve-clean");
  const preserveCleanRepos =
    preserveIdx !== -1 && args[preserveIdx + 1] ? args[preserveIdx + 1]!.split(",") : [];
  runFleet55RepoMultiAxisConvergence({ reposRoot, preserveCleanRepos })
    .then((summary) => {
      console.log(JSON.stringify(summary, null, 2));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
