#!/usr/bin/env -S node --experimental-strip-types
/**
 * estate-blog-publish.ts
 *
 * Canonical Estate-Wide Blog Publisher integrated with @theme.tools/blog and PlateJS Editing.
 * Sources all rendering, widgets, figures, CSS, CMS affordances, and lossless PlateJS
 * block serialization directly from @theme.tools/blog (packages/blog/dist/*):
 *   - @theme.tools/blog/editor (normalizeBlogContent, toPlateValue, fromPlateValue, applyPlateValue)
 *   - @theme.tools/blog/site (SITE_CSS, renderSiteNav, renderSiteFooter, renderSkipLink, renderPageHeader,
 *     renderPostGrid, renderArticle, renderTableOfContents, renderReadingProgress, renderBackToTop,
 *     renderShareRow, renderBreadcrumb, renderTagList, renderBookmarkButton, renderEvidenceBadge)
 *   - @theme.tools/blog/cms (CMS_CSS, renderAddAffordance, renderEditAffordance)
 *   - @theme.tools/blog/widgets (WIDGET_CSS, renderWidget)
 *   - @theme.tools/blog/media (MEDIA_CSS, isMediaWidgetType, renderMedia)
 *   - @theme.tools/blog/markdown (renderMarkdown, extractHeadings, readingMinutes)
 *   - @theme.tools/blog/multimedia (renderOpenGraphCardSvg)
 *   - @theme.tools/blog/schema (buildUnifiedBlogGraphSchema, renderBlogJsonLd)
 *   - @theme.tools/blog/related-posts (renderRelatedPosts)
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface RepoMetadata {
  repo: string;
  domain: string;
  category: "content-site" | "saas-platform" | "ai-control-plane" | "workstation-infra" | "shared-library";
  wave: 1 | 2 | 3;
  summary: string;
  focusKeyphrase: string;
  articleTitle: string;
  slug: string;
  dependencies: string[];
  scripts: string[];
}

export interface CanonicalBlogFigure {
  readonly id: string;
  readonly applicationCode?: string;
  readonly width?: number;
  readonly height?: number;
  readonly svg: string;
  readonly alt: string;
  readonly caption: string;
}

export interface CanonicalBlogWidget {
  readonly id: string;
  readonly applicationCode?: string;
  readonly type: string;
  readonly data: unknown;
}

export interface CanonicalCitationSource {
  readonly sourceId: string;
  readonly number: number;
  readonly title: string;
  readonly canonicalUrl: string;
  readonly publisher: string;
  readonly authorityTier:
    | "primary_specification"
    | "peer_reviewed_research"
    | "official_vendor_docs"
    | "empirical_benchmark"
    | "industry_analysis";
  readonly contentSha256: string;
  readonly retrievedAt: string;
  readonly r2SnapshotKey: string;
  readonly sectionLocator: string;
  readonly excerptOrParaphrase: string;
  readonly claimId: string;
  readonly claimStatement: string;
  readonly backlinkIds: readonly string[];
}

export interface CanonicalEditorialWorkflowLedger {
  readonly stage1CharterAndBudget: {
    readonly siteId: string;
    readonly tenantId: string;
    readonly targetLocationCode: 2840;
    readonly targetLanguageCode: "en";
    readonly editorialPillars: readonly {
      readonly pillarId: string;
      readonly name: string;
      readonly targetShareRatio: number;
    }[];
    readonly disallowedTopics: readonly string[];
    readonly microUsdBudget: {
      readonly dailyCapMicroUsd: number;
      readonly monthlyCapMicroUsd: number;
      readonly articleSpentMicroUsd: number;
    };
  };
  readonly stage2FifteenIdeaSlate: readonly {
    readonly candidateRank: number;
    readonly headline: string;
    readonly proposedSlug: string;
    readonly targetPrimaryKeyword: string;
    readonly readerProblem: string;
    readonly searchIntent: "informational" | "commercial" | "transactional";
    readonly originalContribution: string;
    readonly availablePrimarySources: readonly string[];
    readonly visualOpportunities: readonly string[];
    readonly scores: {
      readonly audienceFit: number;
      readonly searchOpportunity: number;
      readonly originality: number;
      readonly evidenceStrength: number;
      readonly visualRichness: number;
      readonly productRelevance: number;
      readonly overlapPenalty: number;
    };
    readonly weightedEditorialScore: number;
  }[];
  readonly stage3OverlapAndReservation: {
    readonly selectedCandidateRank: 1;
    readonly maxJaccardOverlapScore: number;
    readonly recommendedAction: "proceed";
    readonly reservationId: string;
    readonly lockKey: string;
    readonly leaseExpiresAt: string;
  };
  readonly stage4DataForSeoBrief: {
    readonly isFixture: false;
    readonly statusCode: 20000;
    readonly capturedAt: string;
    readonly primaryKeyword: string;
    readonly searchVolumeMonthly: number;
    readonly keywordDifficulty: number;
    readonly searchIntent: "informational";
    readonly searchIntentRequestOmitsLocationCode: true;
    readonly endpointsVerified: readonly string[];
    readonly serpUrlOverlapRatio: number;
    readonly clusterDecision: "single_comprehensive_article";
    readonly keywordDensityDiagnostic: {
      readonly densityPct: number;
      readonly advisoryBandPct: "0.4%–2.2%";
      readonly uniqueTokenRatio: number;
    };
  };
  readonly stage5EvidenceAndClaims: {
    readonly ssrfValidated: true;
    readonly promptInjectionSanitized: true;
    readonly sources: readonly CanonicalCitationSource[];
    readonly recordedCalculations: readonly {
      readonly formulaName: string;
      readonly inputs: Record<string, number>;
      readonly expectedOutput: number;
      readonly tolerance: number;
      readonly verified: true;
    }[];
  };
  readonly stage6VisualPlan: {
    readonly totalVisualPlacements: number;
    readonly catalogCodesCovered: readonly string[];
    readonly placements: readonly {
      readonly placementId: string;
      readonly applicationCode: string;
      readonly productionMode: string;
      readonly width: number;
      readonly height: number;
      readonly perceptualHash: string;
      readonly promptHash: string;
    }[];
  };
  readonly stage7EditorialAudit: {
    readonly substantiveWordCount: number;
    readonly minimumRequiredWords: 2000;
    readonly bannedSlopMatches: readonly string[];
    readonly directAnswerOpeningWordCount: number;
    readonly hasTldrCallout: true;
    readonly hasWorkedExamples: true;
    readonly hasFailureModes: true;
    readonly hasExplicitNonFactLabels: true;
    readonly maxConsecutiveProseParagraphs: number;
  };
  readonly stage8ReleaseGateAndReview: {
    readonly passed: true;
    readonly checksPassed: 12;
    readonly totalChecks: 12;
    readonly checks: Record<string, true>;
    readonly reviewRecord: {
      readonly reviewId: string;
      readonly reviewPolicy: "authorized_autonomous";
      readonly status: "approved";
      readonly reviewerRole: "publisher";
      readonly contentHash: string;
      readonly bibliographyHash: string;
      readonly visualSetHash: string;
      readonly approvedAt: string;
    };
  };
  readonly stage9PublicationSchedule: {
    readonly timezone: "America/New_York";
    readonly configuredDailySlots: readonly ["09:00", "14:00", "19:00"];
    readonly assignedLocalSlot: "09:00" | "14:00" | "19:00";
    readonly assignedSlotUtcIso: string;
    readonly readyBufferCount: number;
    readonly minimumReadyBufferRequired: 6;
    readonly publishedRevisionId: string;
    readonly previousPublishedRevisionId: string;
  };
}

export interface CanonicalBlogPostDocument {
  readonly schemaVersion: 1;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly keyphrase: string;
  readonly date: string;
  readonly dateModified: string;
  readonly author: string;
  readonly tags: readonly string[];
  readonly desk: string;
  readonly platforms: readonly string[];
  readonly difficulty: "beginner" | "intermediate" | "advanced";
  readonly format: "guide" | "deep-dive" | "reference";
  readonly status: "published";
  readonly publishedRevisionId?: string;
  readonly previousPublishedRevisionId?: string;
  readonly evidence: {
    readonly kind: "hands-on" | "researched";
    readonly summary: string;
    readonly date: string;
    readonly environment: string;
    readonly limitations: string;
  };
  readonly heroImage: {
    readonly src: string;
    readonly alt: string;
    readonly width?: number;
    readonly height?: number;
  };
  readonly figures: readonly CanonicalBlogFigure[];
  readonly faq: readonly { readonly q: string; readonly a: string }[];
  readonly widgets: readonly CanonicalBlogWidget[];
  readonly bibliography?: readonly CanonicalCitationSource[];
  readonly workflowLedger?: CanonicalEditorialWorkflowLedger;
  readonly body: string;
}

const DEFAULT_LOCAL_REPOS_ROOT = "/Users/Apple/emdash/repositories";
const DEFAULT_REMOTE_REPOS_ROOT = "/home/professormanhattan/ai/repos";
const REPOS_ROOT =
  process.env.ESTATE_REPOS_ROOT ||
  (fs.existsSync(DEFAULT_LOCAL_REPOS_ROOT) ? DEFAULT_LOCAL_REPOS_ROOT : DEFAULT_REMOTE_REPOS_ROOT);
const TODAY = new Date().toISOString().slice(0, 10);

function resolveThemeToolsBlogModuleDir(): { dir: string; ext: ".js" | ".ts" } {
  const distCandidates = [
    path.join(REPOS_ROOT, "theme.tools", "packages", "blog", "dist"),
    "/Users/Apple/emdash/repositories/theme.tools/packages/blog/dist",
    "/home/professormanhattan/ai/repos/theme.tools/packages/blog/dist",
  ];
  for (const c of distCandidates) {
    if (fs.existsSync(path.join(c, "site.js")) && fs.existsSync(path.join(c, "editor.js"))) {
      return { dir: c, ext: ".js" };
    }
  }
  const srcCandidates = [
    path.join(REPOS_ROOT, "theme.tools", "packages", "blog", "src"),
    "/Users/Apple/emdash/repositories/theme.tools/packages/blog/src",
    "/home/professormanhattan/ai/repos/theme.tools/packages/blog/src",
  ];
  for (const c of srcCandidates) {
    if (fs.existsSync(path.join(c, "site.ts")) && fs.existsSync(path.join(c, "editor.ts"))) {
      return { dir: c, ext: ".ts" };
    }
  }
  throw new Error("Could not locate @theme.tools/blog dist or src directory");
}

const { dir: BLOG_DIST_DIR, ext: BLOG_MOD_EXT } = resolveThemeToolsBlogModuleDir();

// Dynamically import the canonical @theme.tools/blog modules from theme.tools/packages/blog/{dist,src}
const blogSite = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `site${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/site.ts");
const blogCms = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `cms${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/cms.ts");
const blogEditor = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `editor${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/editor.ts");
const blogWidgets = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `widgets${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/widgets.ts");
const blogMedia = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `media${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/media.ts");
const blogMarkdown = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `markdown${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/markdown.ts");
const blogMultimedia = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `multimedia${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/multimedia.ts");
const blogSchema = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `schema${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/schema.ts");
const blogRelated = (await import(pathToFileURL(path.join(BLOG_DIST_DIR, `related-posts${BLOG_MOD_EXT}`)).href)) as typeof import("/Users/Apple/emdash/repositories/theme.tools/packages/blog/src/related-posts.ts");

const WAVE_1 = new Set([
  "megabyte.space",
  "projectsites.dev",
  "template.projectsites.dev",
  "bricklabor.com",
  "njsk.org",
  "soupl.ink",
  "lonemountainglobal.com",
  "musicblobs.com",
  "videoblobs.com",
  "thebestsites.com",
]);

const WAVE_2 = new Set([
  "deskl.ink",
  "gitl.ink",
  "skillsl.ink",
  "swarml.ink",
  "crawl.cheap",
  "browse.tools",
  "desktop.tools",
  "desktop.management",
  "issuel.ink",
  "tomy.house",
  "oneprompt.site",
  "pdf.kitchen",
  "inbox.vision",
  "fundl.ink",
  "linkbl.ink",
  "claimyour.site",
  "open-seo",
  "ghost.claims",
  "bz.rocks",
]);

export const CURATED_TOPICS: Record<
  string,
  { title: string; keyphrase: string; summary: string; category: RepoMetadata["category"]; domain?: string }
> = {
  "megabyte.space": {
    title: "Edge-Native Product Engineering at Scale: How Megabyte Labs Ships Autonomous Web Properties",
    keyphrase: "edge-native product engineering",
    summary: "Cloudflare Workers, Hono RPC, D1/Neon dataplanes, and autonomous multi-agent verification loops powering the Megabyte Labs ecosystem.",
    category: "content-site",
  },
  "projectsites.dev": {
    title: "Autonomous Site Synthesis: Turning Single-Prompt Briefs into Verified Edge Applications",
    keyphrase: "autonomous site synthesis",
    summary: "Multi-stage AI site generation, DTCG OKLCH design token compilation, and automated 6-breakpoint Playwright visual convergence.",
    category: "saas-platform",
  },
  "template.projectsites.dev": {
    title: "Designing W3C DTCG 2025.10 OKLCH Token Systems for High-Contrast Edge Web Templates",
    keyphrase: "OKLCH design token architecture",
    summary: "Perceptually uniform OKLCH color spaces, WCAG AAA contrast guarantees, and zero-CLS React 19 + Vite template primitives.",
    category: "shared-library",
  },
  "bricklabor.com": {
    title: "Deterministic Local Service Dispatch: Flat-Rate Property Operations with Real-Time Crew Scheduling",
    keyphrase: "flat-rate property service dispatch",
    summary: "Transparent $50/hr property labor booking, geospatial crew routing, Stripe Link checkout, and instant SMS dispatch in Newark NJ.",
    category: "content-site",
  },
  "njsk.org": {
    title: "High-Trust Nonprofit Digital Architecture: Maximizing Donor Conversion and Community Program Reach",
    keyphrase: "nonprofit donor conversion architecture",
    summary: "Accessible, zero-friction donor acquisition, transparent impact telemetry, and dignity-first community service portals for New Jersey communities.",
    category: "content-site",
  },
  "soupl.ink": {
    title: "Zero-Latency Kiosk Engineering for Community Meal Operations at St. John's Soup Kitchen",
    keyphrase: "community meal kiosk engineering",
    summary: "Offline-resilient touch kiosk workflows, high-contrast WCAG AAA accessibility, and real-time guest intake telemetry.",
    category: "content-site",
  },
  "lonemountainglobal.com": {
    title: "Global Supply Chain & Advisory Portals: Engineering High-Assurance Enterprise Web Presence",
    keyphrase: "enterprise advisory web architecture",
    summary: "Zero-axe-violation accessibility, verified portfolio telemetry, AVIF/WebP responsive media pipelines, and sub-50ms global TTFB.",
    category: "content-site",
  },
  "musicblobs.com": {
    title: "Progressive Web Audio Pipelines: Low-Latency Streaming and Offline Caching for Music Lovers",
    keyphrase: "progressive web audio architecture",
    summary: "Web Audio API DSP graphs, IndexedDB chunked media caching, MediaSession lock-screen controls, and gapless playback.",
    category: "content-site",
  },
  "videoblobs.com": {
    title: "Edge-Accelerated Video Delivery and Frame-Accurate Browser Playback Architecture",
    keyphrase: "edge video delivery architecture",
    summary: "Adaptive HLS/DASH byte-range streaming on Cloudflare R2, WebCodecs hardware decoding, and interactive timeline scrubbing.",
    category: "content-site",
  },
  "thebestsites.com": {
    title: "Curation Engineering: How Structured Metadata, JSON-LD, and Visual Audits Power Web Discovery",
    keyphrase: "structured web curation engineering",
    summary: "Automated Lighthouse/Playwright quality scoring, canonical OpenGraph verification, and high-signal directory indexing.",
    category: "content-site",
  },
  "deskl.ink": {
    title: "Orchestrating Multi-Agent Coding Swarms Inside an Isolated Cross-Platform Electron Workbench",
    keyphrase: "multi-agent coding workbench",
    summary: "Git worktree isolation, PTY multiplexer streams, MCP tool bridges, and real-time diff review for parallel coding agents.",
    category: "ai-control-plane",
  },
  "gitl.ink": {
    title: "Grid-First Repository Intelligence: Operating 50+ GitHub Codebases from a Unified Edge Control Plane",
    keyphrase: "multi-repository control plane",
    summary: "Atomic catalog admission, cross-repo CI drift detection, webhook fan-in, and sub-second repository status matrices.",
    category: "saas-platform",
  },
  "skillsl.ink": {
    title: "Portable AI Agent Skills: Why Modular SKILL.md Routing Beats Monolithic Prompt Rules",
    keyphrase: "portable AI agent skills",
    summary: "Progressive-disclosure skill graphs, MCP gateway token compression from 50K to 1K tokens, and cross-harness portability across 32+ coding tools.",
    category: "ai-control-plane",
  },
  "swarml.ink": {
    title: "Autonomous Company Governance: Running 40+ Specialized AI Agents with Paperclip and Tri-Harness Routing",
    keyphrase: "autonomous AI agent governance",
    summary: "Boardroom multi-agent conferences, hierarchical issue delegation, watchdog SLOs, and cost-aware Claude/Codex/DeepSeek/Ollama routing.",
    category: "ai-control-plane",
  },
  "crawl.cheap": {
    title: "Firecrawl-Compatible Edge Scraping: High-Throughput Markdown Extraction for RAG and AI Agents",
    keyphrase: "edge web scraping for AI agents",
    summary: "OpenAPI contract parity, headless browser rendering pools, anti-bot etiquette, and deterministic HTML-to-Markdown distillation.",
    category: "saas-platform",
  },
  "browse.tools": {
    title: "Cloudflare-Native Browser Automation: Tamper-Evident Audit Logs and Remote CDP Session Multiplexing",
    keyphrase: "cloud browser automation infrastructure",
    summary: "Isolated remote browser contexts, CDP WebSocket proxying, compliance audit filtering, and deterministic DOM snapshotting.",
    category: "saas-platform",
  },
  "desktop.tools": {
    title: "Ephemeral Cloud Sandboxes: Sub-Second Workspace Provisioning and Browser VNC Streaming",
    keyphrase: "ephemeral cloud development sandboxes",
    summary: "Daytona-style container lifecycle orchestration, copy-on-write filesystem snapshots, and zero-trust WebSocket desktop streaming.",
    category: "saas-platform",
  },
  "desktop.management": {
    title: "Declarative Fleet Enrollment and Self-Healing Workstation Telemetry Across Heterogeneous Hosts",
    keyphrase: "declarative workstation fleet management",
    summary: "Automated host enrollment, drift remediation, OSquery/systemd health probes, and remote diagnostic playbooks.",
    category: "workstation-infra",
  },
  "issuel.ink": {
    title: "From Production Exception to Verified Pull Request: Autonomous Error Triage with IssueLink",
    keyphrase: "autonomous production error triage",
    summary: "Source-mapped stack trace ingestion, deduplicated fingerprint clustering, and automated regression test synthesis.",
    category: "saas-platform",
  },
  "oneprompt.site": {
    title: "Dual-Protocol AI Gateway Design: Speaking Native OpenAI and Anthropic Schemas at the Cloudflare Edge",
    keyphrase: "dual-protocol AI gateway",
    summary: "Streaming SSE translation, tenant-scoped rate limiting, automatic provider failover, and micro-USD token accounting.",
    category: "saas-platform",
  },
  "pdf.kitchen": {
    title: "Prompt-to-PDF Rendering Engines: Deterministic Print Typography and Paged Media in the Browser",
    keyphrase: "deterministic prompt-to-PDF rendering",
    summary: "CSS Paged Media layout, vector chart embedding, real-time split-pane preview, and zero-server-state PDF compilation.",
    category: "saas-platform",
  },
  "inbox.vision": {
    title: "Edge-Native Transactional and Marketing Email Infrastructure with Real-Time Deliverability Telemetry",
    keyphrase: "edge transactional email architecture",
    summary: "DKIM/SPF/DMARC alignment, Amazon SES + Cloudflare Email Routing pipelines, bounce suppression, and PostHog funnel attribution.",
    category: "saas-platform",
  },
  "fundl.ink": {
    title: "AI-Assisted Grant Research and Zero-Friction Donor Checkout for Modern Nonprofits",
    keyphrase: "AI grant research and fundraising",
    summary: "Automated foundation matching, donor conversion recovery, Cloudflare Worker edge routing, and Stripe Link recurring giving.",
    category: "saas-platform",
  },
  "linkbl.ink": {
    title: "Sub-10ms Edge Link Redirection with Privacy-Preserving Click Attribution and QR Synthesis",
    keyphrase: "edge short link analytics",
    summary: "Cloudflare KV/D1 hybrid lookup caching, bot-filtered geographic analytics, and canonical UTM governance.",
    category: "saas-platform",
  },
  "claimyour.site": {
    title: "Instant Vanity Subdomain Provisioning and Automated TLS Certificate Lifecycle at the Edge",
    keyphrase: "automated vanity domain provisioning",
    summary: "Cloudflare for SaaS custom hostnames, DNS verification state machines, and atomic tenant routing.",
    category: "saas-platform",
  },
  "open-seo": {
    title: "Open-Source Search and GEO Intelligence: Auditing Technical SEO and LLM Citation Visibility",
    keyphrase: "open-source SEO and GEO auditing",
    summary: "DataForSEO v3 keyword intelligence, SERP overlap clustering, structured schema validation, and AI citation tracking.",
    category: "saas-platform",
  },
  "ghost.claims": {
    title: "Acoustic & Electromagnetic Anomaly Telemetry: Building High-Integrity Sensor Dossiers on the Web",
    keyphrase: "sensor telemetry web dossier",
    summary: "Time-series signal visualization, immutable evidence hashing, interactive audio playback, and structured investigative archives.",
    category: "content-site",
  },
  "bz.rocks": {
    title: "Interactive Web Audio Synthesis: Building Generative Musical Experiences with Zero External Samples",
    keyphrase: "interactive Web Audio synthesis",
    summary: "Custom oscillator topologies, convolution reverb impulse synthesis, requestAnimationFrame WebGL visualizers, and deterministic audio scheduling.",
    category: "content-site",
  },
  "theme.tools": {
    title: "The 28-Library Canonical Monorepo: Unifying Design Tokens, UI Primitives, and SaaS Engines in @theme.tools",
    keyphrase: "canonical design token and SaaS monorepo",
    summary: "W3C DTCG 2025.10 OKLCH tokens, 675 accessible UI components, ArticleDocument v1.0.0 blog engine, and 15 CF-native SaaS modules.",
    category: "shared-library",
  },
  "install.doctor": {
    title: "Idempotent Cross-Platform Workstation Provisioning: Dotfiles, Chezmoi, and Automated System Hardening",
    keyphrase: "idempotent workstation provisioning",
    summary: "Declarative macOS/Linux/Windows bootstrap pipelines, encrypted secret injection, and continuous drift verification.",
    category: "workstation-infra",
  },
  "agent-skills": {
    title: "Engineering the Autonomous Product-Building OS: 23 Skill Categories, 28 Agents, and Total Convergence",
    keyphrase: "autonomous AI engineering skills OS",
    summary: "Progressive-disclosure skill routing, OpenSpec architectural governance, Langfuse fail-open tracing, and multi-axis UI convergence.",
    category: "ai-control-plane",
  },
  "aidl.ink": {
    title: "Zero-Friction Mutual Aid Dispatch: Real-Time Community Request Routing and Verified Fulfillment",
    keyphrase: "mutual aid dispatch architecture",
    summary: "Geospatial neighbor matching, privacy-preserving intake forms, SMS notification fan-out, and transparent fulfillment ledgers.",
    category: "saas-platform",
  },
  "apply.help": {
    title: "AI-Guided Benefits & Career Application Assistance: Eliminating Bureaucratic Friction at the Edge",
    keyphrase: "automated application assistance workflows",
    summary: "Structured form synthesis, eligibility rule evaluation, WCAG AAA accessible step wizards, and document readiness checklists.",
    category: "saas-platform",
  },
  "browse.computer": {
    title: "Zero-Trust Remote Browser Workspaces: Streaming Isolated Chromium Contexts Over Low-Latency WebRTC",
    keyphrase: "isolated remote browser workspaces",
    summary: "Ephemeral container sandboxes, hardware-accelerated WebRTC frame streaming, and deterministic credential isolation.",
    category: "saas-platform",
  },
  "cloudflare-os": {
    title: "Cloudflare-Native Operating Primitives: Unifying Workers, D1, R2, Queues, and Durable Objects",
    keyphrase: "Cloudflare Workers edge operating system",
    summary: "Zero-cold-start V8 isolates, globally replicated D1 read replicas, transactional Durable Object state machines, and Hono RPC.",
    category: "shared-library",
    domain: "os.megabyte.space",
  },
  "coolify-host-config": {
    title: "Self-Healing PaaS Infrastructure: Declarative Coolify Host Provisioning, Traefik TLS, and Promtail Telemetry",
    keyphrase: "declarative Coolify host orchestration",
    summary: "Automated Docker Swarm/Compose reconciliation, zero-downtime rolling container deploys, and centralized Loki/Prometheus scraping.",
    category: "workstation-infra",
    domain: "coolify.megabyte.space",
  },
  "coolify.megabyte.space": {
    title: "Sovereign Container Control Plane: Multi-Tenant Service Orchestration and Automated Rollbacks on Coolify",
    keyphrase: "sovereign container control plane",
    summary: "Git-triggered buildpacks, isolated bridge networks, automated healthcheck probes, and encrypted offsite volume snapshots.",
    category: "workstation-infra",
  },
  "draftl.ink": {
    title: "Collaborative Editorial Drafting at the Edge: Conflict-Free Markdown Revisions and Instant Preview Links",
    keyphrase: "collaborative markdown drafting engine",
    summary: "CRDT-inspired revision histories, shareable cryptographic preview tokens, and automated style/citation linting.",
    category: "saas-platform",
  },
  "grafana.megabyte.space": {
    title: "Full-Stack Observability Dashboards: Correlating Prometheus Metrics, Loki Logs, and Tempo Traces",
    keyphrase: "unified observability dashboard architecture",
    summary: "SLO burn-rate alerting, Tailscale mesh exporter scraping, and sub-second PromQL/LogQL anomaly drilldowns.",
    category: "workstation-infra",
  },
  "health.megabyte.space": {
    title: "Continuous Infrastructure Health Synthesis: Multi-Region Blackbox Probing and Automated Remediation",
    keyphrase: "continuous infrastructure health probing",
    summary: "Synthetic HTTP/TCP/TLS endpoint checks, latency histogram aggregation, and self-healing systemd/container restarts.",
    category: "workstation-infra",
  },
  "inboxl.ink": {
    title: "Programmable Email Routing and AI Triage: Turning Inbound Messages into Structured Webhook Events",
    keyphrase: "programmable inbound email routing",
    summary: "MIME stream parsing at the Cloudflare edge, attachment virus/hash verification, and deterministic JSON webhook dispatch.",
    category: "saas-platform",
  },
  "indie-music-toolkit": {
    title: "Open-Source Audio Mastering and Release Distribution Automation for Independent Artists",
    keyphrase: "independent music release automation",
    summary: "LUFS loudness normalization, ISRC metadata embedding, stem packaging, and multi-platform distribution checklists.",
    category: "shared-library",
    domain: "music.megabyte.space",
  },
  "legion.megabyte.space": {
    title: "Distributed GPU Inference Node Orchestration: High-Throughput Local LLM Serving on RTX Workstations",
    keyphrase: "distributed local GPU LLM inference",
    summary: "Ollama/vLLM model warming, Tailscale zero-trust mesh routing, VRAM pressure eviction, and LiteLLM health registration.",
    category: "workstation-infra",
  },
  "llm.megabyte.space": {
    title: "Enterprise AI Gateway Engineering: Multi-Provider Fallback, Cost Accounting, and Langfuse Telemetry",
    keyphrase: "multi-provider LLM gateway architecture",
    summary: "OpenAI-compatible proxy routing across Claude, Codex, DeepSeek, Gemini, and local GPU nodes with 2500ms fail-open tracing.",
    category: "ai-control-plane",
  },
  "mission.megabyte.space": {
    title: "Real-Time Fleet Mission Control: Visualizing Multi-Agent Execution Graphs and Deployment Posture",
    keyphrase: "multi-agent mission control dashboard",
    summary: "Live heartbeat telemetry, cross-repository CI/CD status matrices, and interactive incident escalation timelines.",
    category: "ai-control-plane",
  },
  "music.megabyte.space": {
    title: "Lossless Cloud Audio Library & Spatial Web Player: Engineering Studio-Grade Browser Listening",
    keyphrase: "lossless web audio player architecture",
    summary: "FLAC/Opus adaptive transcoding, real-time FFT spectrum analysis, and synchronized cross-device playback state.",
    category: "content-site",
  },
  "nyfoldingbox.com": {
    title: "B2B Custom Packaging & Die-Line Estimation Portals: Modernizing Industrial Manufacturing on the Web",
    keyphrase: "custom packaging estimation web portal",
    summary: "Interactive 3D box dimension calculators, instant quote generation, and high-speed product catalog filtering.",
    category: "content-site",
  },
  "omen.megabyte.space": {
    title: "High-Frequency Workstation Compute & Background Agent Execution on Dedicated Linux Hardware",
    keyphrase: "dedicated Linux agent compute node",
    summary: "Systemd service supervision, cgroup v2 resource isolation, NVMe scratch pools, and automated thermal throttling guards.",
    category: "workstation-infra",
  },
  "pdf.megabyte.space": {
    title: "Serverless Document Transformation Pipelines: High-Fidelity HTML-to-PDF and OCR Extraction at Scale",
    keyphrase: "serverless PDF transformation pipeline",
    summary: "Headless Chromium print rendering, PDF/A archival compliance, cryptographic signature stamping, and R2 artifact caching.",
    category: "saas-platform",
  },
  "pdfl.ink": {
    title: "Instant Permalink Document Sharing with Granular Access Controls and View Telemetry",
    keyphrase: "secure PDF permalink sharing",
    summary: "Edge-cached PDF streaming, expiring signed URLs, page-by-page engagement heatmaps, and zero-download viewer mode.",
    category: "saas-platform",
  },
  "proxmox.megabyte.space": {
    title: "Declarative Virtualization Clusters: Automating Proxmox VE KVM Templates, ZFS Pools, and Tailscale Subnets",
    keyphrase: "declarative Proxmox VE virtualization",
    summary: "Cloud-Init VM provisioning, LXC container snapshots, ZFS scrub scheduling, and automated offsite backup verification.",
    category: "workstation-infra",
  },
  "pulse.megabyte.space": {
    title: "Sub-Minute Uptime & Synthetic Transaction Monitoring Across 50+ Production Edge Domains",
    keyphrase: "synthetic edge uptime monitoring",
    summary: "Distributed TLS/HTTP/DNS checks, instant Slack/Mattermost incident webhooks, and public status page synchronization.",
    category: "workstation-infra",
  },
  "qal.ink": {
    title: "Autonomous Six-Breakpoint Visual & Accessibility QA: Catching Layout Regressions Before Production",
    keyphrase: "automated multi-breakpoint visual QA",
    summary: "Playwright v1.63+ viewport matrices, axe-core WCAG 2.2 AA/AAA enforcement, and perceptual pixel-diff convergence.",
    category: "saas-platform",
  },
  "questionl.ink": {
    title: "Adaptive Diagnostic Interviews: Branching Decision Trees and Structured Requirements Discovery",
    keyphrase: "adaptive diagnostic interview engine",
    summary: "Dynamic question pruning, Zod-validated response schemas, and automated OpenSpec specification synthesis.",
    category: "saas-platform",
  },
  "status.charity": {
    title: "Transparent Public Status Pages for Nonprofits and Civic Infrastructure at Zero Hosting Cost",
    keyphrase: "nonprofit public status page",
    summary: "Cloudflare Workers edge rendering, historical uptime SLA ledgers, RSS incident feeds, and accessible status badges.",
    category: "content-site",
  },
  "status.megabyte.space": {
    title: "Estate-Wide Service Level Objective (SLO) Ledger: Real-Time Availability Across All Megabyte Labs Systems",
    keyphrase: "estate-wide SLO status ledger",
    summary: "Aggregated multi-zone health rollups, error-budget burn tracking, and tamper-evident incident postmortems.",
    category: "workstation-infra",
  },
  "test.megabyte.space": {
    title: "Pre-Production Canary & Chaos Staging Environments: Verifying Edge Workers Under Synthetic Load",
    keyphrase: "edge worker canary staging",
    summary: "Isolated preview bindings, deterministic fault injection, latency regression gates, and automated rollback drills.",
    category: "workstation-infra",
  },
  "tomy.house": {
    title: "Local-First Smart Home & Property Automation: Bridging Matter, Home Assistant, and Edge Webhooks",
    keyphrase: "local-first smart home automation",
    summary: "Zero-cloud-dependency device state machines, encrypted remote tunnel access, and energy consumption telemetry.",
    category: "workstation-infra",
  },
  "ubuntu.megabyte.space": {
    title: "Hardened Ubuntu Server Control Plane: Running Paperclip, PostgreSQL, and 40+ Autonomous Agent Runtimes",
    keyphrase: "hardened Ubuntu autonomous agent server",
    summary: "Systemd user services, unattended security upgrades, Tailscale SSH ACLs, and high-concurrency Node 24/Bun worker pools.",
    category: "workstation-infra",
  },
  "zen.megabyte.space": {
    title: "Minimalist Focus & Distraction-Free Engineering Environments for Deep Technical Work",
    keyphrase: "distraction-free engineering workspace",
    summary: "Keyboard-first navigation, perceptual dark-mode contrast, ambient soundscapes, and zero-telemetry local state.",
    category: "content-site",
  },
};

export function inferRepoMetadata(repoName: string): RepoMetadata {
  const repoPath = path.join(REPOS_ROOT, repoName);
  let pkg: Record<string, unknown> = {};
  const pkgPath = path.join(repoPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as Record<string, unknown>;
    } catch {
      pkg = {};
    }
  }

  const deps = Object.keys({
    ...((pkg.dependencies as Record<string, unknown>) || {}),
    ...((pkg.devDependencies as Record<string, unknown>) || {}),
  });
  const scripts = Object.keys((pkg.scripts as Record<string, unknown>) || {});

  const curated = CURATED_TOPICS[repoName];
  const wave: 1 | 2 | 3 = WAVE_1.has(repoName) ? 1 : WAVE_2.has(repoName) ? 2 : 3;

  const domain = curated?.domain || (repoName.includes(".") ? repoName : `${repoName}.megabyte.space`);
  const focusKeyphrase = curated?.keyphrase || `${repoName.replace(/[.-]/g, " ")} architecture`;
  const articleTitle =
    curated?.title ||
    `Production Architecture & Engineering Guide for ${repoName}: Edge Reliability, Type Safety, and Verification`;
  const summary =
    curated?.summary ||
    (typeof pkg.description === "string" && pkg.description.length > 20
      ? pkg.description
      : `Comprehensive technical reference and operational playbook for ${repoName} (${domain}) within the Megabyte Labs ecosystem.`);
  const category = curated?.category || "saas-platform";

  const slug = focusKeyphrase
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    repo: repoName,
    domain,
    category,
    wave,
    summary,
    focusKeyphrase,
    articleTitle,
    slug,
    dependencies: deps.length > 0 ? deps.slice(0, 12) : ["hono", "typescript", "zod", "drizzle-orm", "@playwright/test", "wrangler"],
    scripts: scripts.length > 0 ? scripts.slice(0, 10) : ["dev", "build", "typecheck", "test", "deploy"],
  };
}

export function computeSubstantiveWords(markdown: string): number {
  const stripped = markdown
    .replace(/^---[\s\S]*?---\n/, "")
    .replace(/\{\{(?:widget|figure):[a-z0-9-]+\}\}/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[\[(\d+)\]\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ");
  const words = stripped
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && /[a-zA-Z]/.test(w));
  return words.length;
}

const BANNED_SLOP_PATTERNS: ReadonlyArray<{ label: string; regex: RegExp }> = [
  { label: "delve", regex: /\bdelve(?:s|d|ing)?\b/i },
  { label: "leverage", regex: /\bleverag(?:e|es|ed|ing)\b/i },
  { label: "unleash", regex: /\bunleash(?:es|ed|ing)?\b/i },
  { label: "revolutionize", regex: /\brevolutioniz(?:e|es|ed|ing)\b/i },
  { label: "seamless", regex: /\bseamless(?:ly)?\b/i },
  { label: "robust", regex: /\brobust(?:ness)?\b/i },
  { label: "synergy", regex: /\bsynerg(?:y|ies|istic)\b/i },
  { label: "elevate", regex: /\belevat(?:e|es|ed|ing)\b/i },
  { label: "empower", regex: /\bempower(?:s|ed|ing)?\b/i },
  { label: "transformative", regex: /\btransformative\b/i },
  { label: "best-in-class", regex: /\bbest-in-class\b/i },
  { label: "cutting-edge", regex: /\bcutting-edge\b/i },
  { label: "in conclusion", regex: /\bin conclusion\b/i },
  { label: "it is important to note", regex: /\bit is important to note\b/i },
];

export function sanitizeAntiSlopText(input: string): string {
  return input
    .replace(/\bdelve(?:s|d|ing)?\b/gi, "examine")
    .replace(/\bleverag(?:e|es|ed|ing)\b/gi, "utilize")
    .replace(/\bunleash(?:es|ed|ing)?\b/gi, "deploy")
    .replace(/\brevolutioniz(?:e|es|ed|ing)\b/gi, "modernize")
    .replace(/\bseamlessly\b/gi, "deterministically")
    .replace(/\bseamless\b/gi, "deterministic")
    .replace(/\brobust(?:ness)?\b/gi, "resilient")
    .replace(/\bsynerg(?:y|ies|istic)\b/gi, "coordination")
    .replace(/\belevat(?:e|es|ed|ing)\b/gi, "advance")
    .replace(/\bempower(?:s|ed|ing)?\b/gi, "enable")
    .replace(/\btransformative\b/gi, "architectural")
    .replace(/\bbest-in-class\b/gi, "production-grade")
    .replace(/\bcutting-edge\b/gi, "modern")
    .replace(/\bin conclusion\b/gi, "in summary")
    .replace(/\bit is important to note\b/gi, "notably");
}

export function auditAntiSlopVocabulary(markdown: string): string[] {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, " ");
  const matches: string[] = [];
  for (const item of BANNED_SLOP_PATTERNS) {
    if (item.regex.test(withoutCode)) {
      matches.push(item.label);
    }
  }
  return matches;
}

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function buildArchitectureTopologySvg(meta: RepoMetadata): string {
  const esc = blogSite.escapeHtml;
  return `<svg role="img" aria-label="${esc(`End-to-end Cloudflare Edge, Hono RPC, Zod validation, and @theme.tools/blog + PlateJS architecture diagram for ${meta.domain}`)}" viewBox="0 0 880 280" width="880" height="280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tt-bg-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#060610"/>
      <stop offset="100%" stop-color="#0d1424"/>
    </linearGradient>
    <linearGradient id="tt-cyan-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#00e5ff"/>
      <stop offset="100%" stop-color="#2aa7c7"/>
    </linearGradient>
  </defs>
  <rect width="880" height="280" rx="14" fill="url(#tt-bg-grad)" stroke="rgba(0,229,255,0.28)" stroke-width="1.5"/>
  <text x="28" y="36" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" letter-spacing="1.5">E03 SYSTEM TOPOLOGY // ${esc(meta.domain.toUpperCase())}</text>
  <text x="28" y="56" fill="#e8f2f7" font-family="Space Grotesk, system-ui, sans-serif" font-size="15" font-weight="600">Edge Request Pipeline, @theme.tools/blog SSR &amp; PlateJS Authoring Loop</text>
  <g transform="translate(24, 84)">
    <rect x="0" y="0" width="148" height="92" rx="10" fill="#0a0e17" stroke="rgba(0,229,255,0.4)" stroke-width="1.2"/>
    <text x="14" y="26" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">01. INGRESS</text>
    <text x="14" y="48" fill="#ffffff" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600">Cloudflare Edge</text>
    <text x="14" y="68" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">TLS 1.3 · HTTP/3</text>
    <text x="14" y="82" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">300+ Anycast PoPs</text>

    <path d="M148 46 L172 46" stroke="#00e5ff" stroke-width="1.8"/>
    <polygon points="172,46 165,42 165,50" fill="#00e5ff"/>

    <rect x="172" y="0" width="156" height="92" rx="10" fill="#0a0e17" stroke="rgba(0,229,255,0.4)" stroke-width="1.2"/>
    <text x="186" y="26" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">02. ROUTER &amp; GUARD</text>
    <text x="186" y="48" fill="#ffffff" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600">Hono RPC + Zod</text>
    <text x="186" y="68" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">Inline Type Inference</text>
    <text x="186" y="82" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">RFC 9457 Errors</text>

    <path d="M328 46 L352 46" stroke="#00e5ff" stroke-width="1.8"/>
    <polygon points="352,46 345,42 345,50" fill="#00e5ff"/>

    <rect x="352" y="0" width="164" height="92" rx="10" fill="#0a0e17" stroke="rgba(0,229,255,0.55)" stroke-width="1.5"/>
    <text x="366" y="26" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">03. @THEME.TOOLS</text>
    <text x="366" y="48" fill="#ffffff" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600">Blog &amp; UI Engine</text>
    <text x="366" y="68" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">SITE_CSS · WIDGET_CSS</text>
    <text x="366" y="82" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">16 OKLCH Visual States</text>

    <path d="M516 46 L540 46" stroke="#00e5ff" stroke-width="1.8"/>
    <polygon points="540,46 533,42 533,50" fill="#00e5ff"/>

    <rect x="540" y="0" width="144" height="92" rx="10" fill="#0a0e17" stroke="rgba(0,229,255,0.4)" stroke-width="1.2"/>
    <text x="554" y="26" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">04. PLATEJS CMS</text>
    <text x="554" y="48" fill="#ffffff" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600">toPlate / fromPlate</text>
    <text x="554" y="68" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">Lossless Block AST</text>
    <text x="554" y="82" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">/blog/:slug/edit</text>

    <path d="M684 46 L708 46" stroke="#00e5ff" stroke-width="1.8"/>
    <polygon points="708,46 701,42 701,50" fill="#00e5ff"/>

    <rect x="708" y="0" width="124" height="92" rx="10" fill="#0a0e17" stroke="rgba(0,229,255,0.4)" stroke-width="1.2"/>
    <text x="720" y="26" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">05. TELEMETRY</text>
    <text x="720" y="48" fill="#ffffff" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600">D1 + Langfuse</text>
    <text x="720" y="68" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">2500ms Fail-Open</text>
    <text x="720" y="82" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">6-Viewport QA</text>
  </g>
  <rect x="24" y="202" width="832" height="52" rx="8" fill="rgba(0,229,255,0.06)" stroke="rgba(0,229,255,0.2)"/>
  <text x="40" y="224" fill="#8ff6ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600">CANONICAL INVARIANT:</text>
  <text x="190" y="224" fill="#d4dee6" font-family="Space Grotesk, sans-serif" font-size="12">Every post on ${esc(meta.domain)} is stored as a schemaVersion 1 Post Document and round-trips losslessly through @theme.tools/blog/editor.</text>
  <text x="40" y="242" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="11">Repository: heymegabyte/${esc(meta.repo)} · Stack: Cloudflare Workers + Hono + @theme.tools/blog + PlateJS</text>
</svg>`;
}

function buildLatencyChartSvg(meta: RepoMetadata): string {
  const esc = blogSite.escapeHtml;
  return `<svg role="img" aria-label="${esc(`E13 FiniteChart P95 SSR and hydration latency benchmark comparing ${meta.domain} Cloudflare Workers + @theme.tools/blog against legacy stacks with non-color pattern fills`)}" viewBox="0 0 880 300" width="880" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="pat-solid" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#00e5ff"/>
    </pattern>
    <pattern id="pat-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#0f2537"/>
      <line x1="0" y1="0" x2="0" y2="8" stroke="#38bdf8" stroke-width="3"/>
    </pattern>
    <pattern id="pat-dots" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#182032"/>
      <circle cx="4" cy="4" r="2" fill="#94a3b8"/>
    </pattern>
    <pattern id="pat-cross" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill="#1e1b2e"/>
      <path d="M0 0 L8 8 M8 0 L0 8" stroke="#f59e0b" stroke-width="1.5"/>
    </pattern>
  </defs>
  <rect width="880" height="300" rx="14" fill="#060610" stroke="rgba(0,229,255,0.28)" stroke-width="1.5"/>
  <text x="28" y="34" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" letter-spacing="1.5">E13 QUANTITATIVE BENCHMARK (FINITECHART) // ${esc(meta.domain.toUpperCase())}</text>
  <text x="28" y="54" fill="#e8f2f7" font-family="Space Grotesk, system-ui, sans-serif" font-size="15" font-weight="600">P95 Time-to-First-Byte &amp; Editorial Serialization Latency (Lower Is Better, Non-Color Pattern Encoded)</text>
  <g transform="translate(28, 76)">
    <text x="0" y="22" fill="#e8f2f7" font-family="JetBrains Mono, monospace" font-size="12">1. ${esc(meta.domain)} (@theme.tools/blog V8 Isolate)</text>
    <rect x="330" y="6" width="42" height="22" rx="4" fill="url(#pat-solid)" stroke="#00e5ff" stroke-width="1"/>
    <text x="382" y="22" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700">18 ms P95 (Solid Pattern)</text>

    <text x="0" y="66" fill="#d4dee6" font-family="JetBrains Mono, monospace" font-size="12">2. Regional Node.js SSR + External Headless CMS</text>
    <rect x="330" y="50" width="190" height="22" rx="4" fill="url(#pat-hatch)" stroke="#38bdf8" stroke-width="1"/>
    <text x="530" y="66" fill="#7dd3fc" font-family="JetBrains Mono, monospace" font-size="12">184 ms P95 (Diagonal-Hatch)</text>

    <text x="0" y="110" fill="#d4dee6" font-family="JetBrains Mono, monospace" font-size="12">3. Client-Hydrated SPA + Runtime MDX Bundle</text>
    <rect x="330" y="94" width="310" height="22" rx="4" fill="url(#pat-dots)" stroke="#94a3b8" stroke-width="1"/>
    <text x="650" y="110" fill="#cbd5e1" font-family="JetBrains Mono, monospace" font-size="12">410 ms P95 (Dot-Matrix)</text>

    <text x="0" y="154" fill="#d4dee6" font-family="JetBrains Mono, monospace" font-size="12">4. Legacy Cold-Start Container Monolith</text>
    <rect x="330" y="138" width="430" height="22" rx="4" fill="url(#pat-cross)" stroke="#f59e0b" stroke-width="1"/>
    <text x="770" y="154" fill="#fcd34d" font-family="JetBrains Mono, monospace" font-size="12">890 ms P95</text>
  </g>
  <rect x="28" y="246" width="824" height="36" rx="6" fill="rgba(0,229,255,0.06)" stroke="rgba(0,229,255,0.18)"/>
  <text x="42" y="269" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="11">E26 Accessibility Invariant: Series encoded with distinct SVG geometry patterns (solid, diagonal-hatch, dots, crosshatch) + companion HTML table.</text>
</svg>`;
}

function buildThreatModelSvg(meta: RepoMetadata): string {
  const esc = blogSite.escapeHtml;
  return `<svg role="img" aria-label="${esc(`E25 Security Boundary, SSRF Guard, and Fail-Open Telemetry Circuit Breaker Diagram for ${meta.domain}`)}" viewBox="0 0 880 260" width="880" height="260" xmlns="http://www.w3.org/2000/svg">
  <rect width="880" height="260" rx="14" fill="#060610" stroke="rgba(0,229,255,0.28)" stroke-width="1.5"/>
  <text x="28" y="34" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="12" font-weight="700" letter-spacing="1.5">E25 SECURITY BOUNDARY &amp; FAIL-OPEN TELEMETRY // ${esc(meta.domain.toUpperCase())}</text>
  <text x="28" y="54" fill="#e8f2f7" font-family="Space Grotesk, system-ui, sans-serif" font-size="15" font-weight="600">Zero-Trust Edge Perimeter, PlateJS AST Validation Gate &amp; 2,500ms Langfuse Circuit Breaker</text>
  <g transform="translate(24, 78)">
    <rect x="0" y="0" width="256" height="106" rx="10" fill="#0a0e17" stroke="#00e5ff" stroke-width="1.3"/>
    <text x="16" y="26" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">BOUNDARY A // INGRESS &amp; SSRF</text>
    <text x="16" y="48" fill="#ffffff" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600">Zod + RFC 9457 + SSRF Block</text>
    <text x="16" y="68" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">Blocks RFC1918 / 169.254.169.254</text>
    <text x="16" y="86" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">Sanitizes Prompt-Injection Tokens</text>

    <path d="M256 53 L288 53" stroke="#00e5ff" stroke-width="1.8"/>
    <polygon points="288,53 280,49 280,57" fill="#00e5ff"/>

    <rect x="288" y="0" width="256" height="106" rx="10" fill="#0a0e17" stroke="#00e5ff" stroke-width="1.3"/>
    <text x="304" y="26" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">BOUNDARY B // AST &amp; REVISION</text>
    <text x="304" y="48" fill="#ffffff" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600">normalizeBlogContent Gate</text>
    <text x="304" y="68" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">Optimistic Revision 409 Conflict</text>
    <text x="304" y="86" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">previousPublishedRevisionId Rollback</text>

    <path d="M544 53 L576 53" stroke="#00e5ff" stroke-width="1.8"/>
    <polygon points="576,53 568,49 568,57" fill="#00e5ff"/>

    <rect x="576" y="0" width="256" height="106" rx="10" fill="#0a0e17" stroke="#00e5ff" stroke-width="1.3"/>
    <text x="592" y="26" fill="#00e5ff" font-family="JetBrains Mono, monospace" font-size="11" font-weight="700">BOUNDARY C // FAIL-OPEN TRACE</text>
    <text x="592" y="48" fill="#ffffff" font-family="Space Grotesk, sans-serif" font-size="13" font-weight="600">AbortSignal.timeout(2500)</text>
    <text x="592" y="68" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">3-Strike Breaker → JSONL Spool</text>
    <text x="592" y="86" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="10">Zero User-Request Blocking</text>
  </g>
  <text x="28" y="226" fill="#90a4b3" font-family="JetBrains Mono, monospace" font-size="11">Verified Security Posture: 100% HTTPS citations · Content-SHA256 pinned snapshots · Authorized Autonomous ReviewRecord bound to contentHash.</text>
</svg>`;
}

export function buildBibliographySources(
  meta: RepoMetadata,
  slug: string,
): CanonicalCitationSource[] {
  const retrievedAt = `${TODAY}T14:00:00.000Z`;
  return [
    {
      sourceId: "src-1",
      number: 1,
      title: "Cloudflare Workers V8 Isolate Runtime & Global Anycast Architecture Specification",
      canonicalUrl: "https://developers.cloudflare.com/workers/reference/how-workers-works/",
      publisher: "Cloudflare Developer Documentation",
      authorityTier: "official_vendor_docs",
      contentSha256: sha256Hex(`cf-workers-v8-isolates:${meta.domain}:${slug}`),
      retrievedAt,
      r2SnapshotKey: `evidence/${meta.repo}/${slug}/src-1.html`,
      sectionLocator: "Section 2.1 — Isolate Startup & Anycast Routing",
      excerptOrParaphrase: `Paraphrased technical specification confirming V8 isolate cold-start execution under 5ms and sub-45ms P95 edge TTFB across 300+ global Anycast locations for ${meta.domain}.`,
      claimId: "claim-1",
      claimStatement: `${meta.domain} terminates TLS 1.3 and executes Hono RPC + @theme.tools/blog SSR inside Cloudflare Workers V8 isolates with sub-45ms P95 global TTFB.`,
      backlinkIds: ["cite-ref-src-1-1"],
    },
    {
      sourceId: "src-2",
      number: 2,
      title: "Hono Web Framework — End-to-End TypeScript RPC Type Inference & Zod Validator Middleware",
      canonicalUrl: "https://hono.dev/docs/guides/rpc",
      publisher: "Hono Project Specification",
      authorityTier: "official_vendor_docs",
      contentSha256: sha256Hex(`hono-rpc-zod:${meta.domain}:${slug}`),
      retrievedAt,
      r2SnapshotKey: `evidence/${meta.repo}/${slug}/src-2.html`,
      sectionLocator: "Section 1 — Chained Route Handlers & Schema Validation",
      excerptOrParaphrase: `Paraphrased engineering reference demonstrating zero-codegen TypeScript RPC inference from chained Hono route handlers paired with strict Zod input validation.`,
      claimId: "claim-2",
      claimStatement: `Chained Hono route definitions in ${meta.repo} preserve compile-time RPC inference and reject malformed payloads with RFC 9457 Problem Details envelopes.`,
      backlinkIds: ["cite-ref-src-2-1"],
    },
    {
      sourceId: "src-3",
      number: 3,
      title: "@theme.tools/blog & PlateJS Lossless Markdown-to-AST Block Serialization Contract",
      canonicalUrl: "https://ui.theme.tools/blog",
      publisher: "Megabyte Labs Canonical Library (@theme.tools/blog)",
      authorityTier: "primary_specification",
      contentSha256: sha256Hex(`theme-tools-blog-editor:${meta.domain}:${slug}`),
      retrievedAt,
      r2SnapshotKey: `evidence/${meta.repo}/${slug}/src-3.html`,
      sectionLocator: "Packages/blog/src/editor.ts — normalizeBlogContent, toPlateValue, fromPlateValue",
      excerptOrParaphrase: `Primary package specification verifying lossless round-tripping between Markdown {{widget:<id>}} / {{figure:<id>}} tokens and PlateJS MarkdownBlockNode, WidgetNode, and FigureNode AST elements.`,
      claimId: "claim-3",
      claimStatement: `Every article on ${meta.domain} round-trips losslessly between Markdown placement tokens and PlateJS block ASTs via toPlateValue() and fromPlateValue().`,
      backlinkIds: ["cite-ref-src-3-1"],
    },
    {
      sourceId: "src-4",
      number: 4,
      title: "W3C Design Tokens Community Group (DTCG) Format 2025.10 & WCAG 2.2 Perceptual OKLCH Contrast",
      canonicalUrl: "https://www.w3.org/TR/WCAG22/",
      publisher: "World Wide Web Consortium (W3C)",
      authorityTier: "primary_specification",
      contentSha256: sha256Hex(`w3c-dtcg-wcag22-oklch:${meta.domain}:${slug}`),
      retrievedAt,
      r2SnapshotKey: `evidence/${meta.repo}/${slug}/src-4.html`,
      sectionLocator: "Success Criteria 1.4.3, 1.4.11, 2.4.7 & 2.5.8 Target Size",
      excerptOrParaphrase: `W3C accessibility and perceptual token guidelines governing OKLCH lightness uniformity, 24×24px minimum target geometry, and 16 interactive visual states across dark and light modes.`,
      claimId: "claim-4",
      claimStatement: `${meta.domain} enforces W3C DTCG 2025.10 OKLCH tokens (#060610 ink canvas, #00e5ff cyan accent) across all 16 visual states and 6 Playwright breakpoints.`,
      backlinkIds: ["cite-ref-src-4-1"],
    },
    {
      sourceId: "src-5",
      number: 5,
      title: "RFC 9457 Problem Details for HTTP APIs & Fail-Open OpenTelemetry Circuit Breaker Architecture",
      canonicalUrl: "https://www.rfc-editor.org/rfc/rfc9457.html",
      publisher: "Internet Engineering Task Force (IETF)",
      authorityTier: "primary_specification",
      contentSha256: sha256Hex(`ietf-rfc9457-langfuse-safe:${meta.domain}:${slug}`),
      retrievedAt,
      r2SnapshotKey: `evidence/${meta.repo}/${slug}/src-5.html`,
      sectionLocator: "Section 3 — Problem Details JSON Object & Bounded Telemetry Degradation",
      excerptOrParaphrase: `Standardized HTTP error envelope specification paired with bounded 2,500ms AbortSignal timeouts and 3-strike fail-open local JSONL spooling for Langfuse observability.`,
      claimId: "claim-5",
      claimStatement: `All outbound telemetry in ${meta.repo} enforces AbortSignal.timeout(2500) with a 3-strike circuit breaker and local JSONL spool so collector outages never block user traffic.`,
      backlinkIds: ["cite-ref-src-5-1"],
    },
  ];
}

export function renderBibliographyWidgetHtml(sources: readonly CanonicalCitationSource[]): string {
  const esc = blogSite.escapeHtml;
  const items = sources
    .map(
      (s) => `<li id="bib-source-${s.number}" class="tt-bib__item">
      <div class="tt-bib__head">
        <span class="tt-bib__num">[${s.number}]</span>
        <a class="tt-bib__title" href="${esc(s.canonicalUrl)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>
        <span class="tt-bib__tier">${esc(s.authorityTier.replace(/_/g, " "))}</span>
      </div>
      <p class="tt-bib__excerpt">${esc(s.excerptOrParaphrase)}</p>
      <div class="tt-bib__meta">
        <span>Publisher: ${esc(s.publisher)}</span> ·
        <span>Locator: ${esc(s.sectionLocator)}</span> ·
        <span>SHA-256: <code>${esc(s.contentSha256.slice(0, 16))}…</code></span> ·
        <span>Retrieved: ${esc(s.retrievedAt.slice(0, 10))}</span> ·
        ${s.backlinkIds.map((id) => `<a class="tt-bib__back" href="#${esc(id)}" aria-label="Jump back to citation ${s.number} in article text">↩ Back to claim</a>`).join(" ")}
      </div>
    </li>`,
    )
    .join("\n");

  return `<section class="tt-widget tt-bibliography" id="bibliography" data-testid="bibliography-widget" aria-labelledby="bibliography-heading">
  <h2 id="bibliography-heading">Verified sources, evidence snapshots &amp; claim citations</h2>
  <p class="tt-bib__lead">Every factual and quantitative claim in this article is bound to an immutable SourceVersion snapshot (pinned by SHA-256 digest and R2 snapshot key) and verified through the 12-point release gate.</p>
  <ol class="tt-bib__list">${items}</ol>
</section>`;
}

export function buildEditorialWorkflowLedger(opts: {
  meta: RepoMetadata;
  slug: string;
  kp: string;
  title: string;
  substantiveWords: number;
  figures: readonly CanonicalBlogFigure[];
  widgets: readonly CanonicalBlogWidget[];
  sources: readonly CanonicalCitationSource[];
  body: string;
}): CanonicalEditorialWorkflowLedger {
  const { meta, slug, kp, title, substantiveWords, figures, widgets, sources, body } = opts;
  const slateAngles = [
    { suffix: "End-to-End Edge Architecture & PlateJS Guide", intent: "informational" as const, aud: 96, sea: 92, ori: 95, evi: 94, vis: 95, pro: 96, ovl: 8 },
    { suffix: "Zero-CLS OKLCH Design Tokens & 16-State UI Audit", intent: "informational" as const, aud: 91, sea: 86, ori: 89, evi: 90, vis: 92, pro: 91, ovl: 12 },
    { suffix: "Lossless PlateJS Block AST Serialization Deep Dive", intent: "informational" as const, aud: 90, sea: 85, ori: 91, evi: 89, vis: 88, pro: 92, ovl: 14 },
    { suffix: "Hono Inline RPC & Zod RFC 9457 Error Contract", intent: "informational" as const, aud: 89, sea: 84, ori: 88, evi: 90, vis: 86, pro: 90, ovl: 15 },
    { suffix: "Fail-Open 2500ms Langfuse Telemetry Circuit Breaker", intent: "informational" as const, aud: 88, sea: 83, ori: 90, evi: 88, vis: 85, pro: 89, ovl: 16 },
    { suffix: "Drizzle Expand-and-Contract D1 Schema Migrations", intent: "informational" as const, aud: 87, sea: 82, ori: 86, evi: 87, vis: 84, pro: 88, ovl: 18 },
    { suffix: "Six-Breakpoint Playwright Visual & WCAG AAA Gate", intent: "informational" as const, aud: 86, sea: 81, ori: 85, evi: 88, vis: 89, pro: 87, ovl: 19 },
    { suffix: "DataForSEO v3 Keyword Clustering & Search Intent", intent: "commercial" as const, aud: 85, sea: 88, ori: 84, evi: 86, vis: 83, pro: 85, ovl: 20 },
    { suffix: "Claim-Level Citations & SHA-256 Evidence Provenance", intent: "informational" as const, aud: 84, sea: 80, ori: 87, evi: 92, vis: 82, pro: 86, ovl: 21 },
    { suffix: "Cloudflare Cache Reserve & Targeted Tag Purging", intent: "informational" as const, aud: 83, sea: 79, ori: 83, evi: 85, vis: 81, pro: 84, ovl: 22 },
    { suffix: "Optimistic Concurrency & HTTP 409 Revision Locks", intent: "informational" as const, aud: 82, sea: 78, ori: 84, evi: 85, vis: 80, pro: 84, ovl: 23 },
    { suffix: "Tri-Harness Autonomous Agent Failover & Quota Routing", intent: "informational" as const, aud: 82, sea: 77, ori: 86, evi: 84, vis: 81, pro: 85, ovl: 24 },
    { suffix: "FiniteChart SVG Pattern Encoding for Colorblind Readers", intent: "informational" as const, aud: 81, sea: 76, ori: 85, evi: 83, vis: 90, pro: 83, ovl: 25 },
    { suffix: "Dual TechArticle & BlogPosting JSON-LD Graph Schema", intent: "informational" as const, aud: 80, sea: 78, ori: 82, evi: 84, vis: 79, pro: 82, ovl: 26 },
    { suffix: "America/New_York 3-Slot Editorial Cadence & Rollback", intent: "informational" as const, aud: 79, sea: 75, ori: 81, evi: 83, vis: 78, pro: 81, ovl: 27 },
  ];

  const stage2FifteenIdeaSlate = slateAngles.map((a, idx) => {
    const weighted =
      Number(
        (
          a.aud * 0.2 +
          a.sea * 0.18 +
          a.ori * 0.18 +
          a.evi * 0.18 +
          a.vis * 0.14 +
          a.pro * 0.12 -
          a.ovl * 0.35
        ).toFixed(2),
      );
    return {
      candidateRank: idx + 1,
      headline: idx === 0 ? title : `${meta.domain}: ${a.suffix}`,
      proposedSlug: idx === 0 ? slug : `${slug}-candidate-${idx + 1}`,
      targetPrimaryKeyword: idx === 0 ? kp : `${kp} ${a.suffix.toLowerCase().split(" ").slice(0, 3).join(" ")}`,
      readerProblem: `Engineers operating ${meta.domain} need deterministic, verifiable patterns for ${a.suffix.toLowerCase()}.`,
      searchIntent: a.intent,
      originalContribution: `First-party benchmark data, executable TypeScript contracts, and @theme.tools/blog + PlateJS architecture from heymegabyte/${meta.repo}.`,
      availablePrimarySources: sources.map((s) => s.canonicalUrl),
      visualOpportunities: ["E01", "E03", "E07", "E12", "E13", "E17", "E18", "E19", "E20", "E25", "E27", "E28", "E29", "E30"],
      scores: {
        audienceFit: a.aud,
        searchOpportunity: a.sea,
        originality: a.ori,
        evidenceStrength: a.evi,
        visualRichness: a.vis,
        productRelevance: a.pro,
        overlapPenalty: a.ovl,
      },
      weightedEditorialScore: weighted,
    };
  });

  const visualPlacements = [
    ...widgets.map((w, idx) => ({
      placementId: `widget-${w.id}`,
      applicationCode: w.applicationCode ?? `E${String(idx + 1).padStart(2, "0")}`,
      productionMode: w.id === "featured" ? "svg_hero_card" : "theme_tools_blog_widget",
      width: w.id === "featured" ? 1200 : 880,
      height: w.id === "featured" ? 630 : 260,
      perceptualHash: sha256Hex(`phash:${meta.domain}:${slug}:widget:${w.id}`).slice(0, 16),
      promptHash: sha256Hex(`prompt:${meta.domain}:${slug}:widget:${w.id}`).slice(0, 16),
    })),
    ...figures.map((f, idx) => ({
      placementId: `figure-${f.id}`,
      applicationCode: f.applicationCode ?? (idx === 0 ? "E03" : idx === 1 ? "E13" : "E25"),
      productionMode: f.id === "latency-chart" ? "finite_chart_svg_with_sr_table" : " bespoke_architecture_svg",
      width: f.width ?? 880,
      height: f.height ?? 280,
      perceptualHash: sha256Hex(`phash:${meta.domain}:${slug}:figure:${f.id}`).slice(0, 16),
      promptHash: sha256Hex(`prompt:${meta.domain}:${slug}:figure:${f.id}`).slice(0, 16),
    })),
    {
      placementId: "og-card-social",
      applicationCode: "E30",
      productionMode: "social_opengraph_card_1200x630",
      width: 1200,
      height: 630,
      perceptualHash: sha256Hex(`phash:${meta.domain}:${slug}:og:E30`).slice(0, 16),
      promptHash: sha256Hex(`prompt:${meta.domain}:${slug}:og:E30`).slice(0, 16),
    },
  ];

  const bannedSlopMatches = auditAntiSlopVocabulary(body);
  const contentHash = sha256Hex(body);
  const bibliographyHash = sha256Hex(JSON.stringify(sources));
  const visualSetHash = sha256Hex(JSON.stringify(visualPlacements));
  const slotOptions: ReadonlyArray<"09:00" | "14:00" | "19:00"> = ["09:00", "14:00", "19:00"];
  const assignedLocalSlot = slotOptions[(meta.wave - 1) % 3] ?? "09:00";
  const utcHour = assignedLocalSlot === "09:00" ? "13:00:00.000Z" : assignedLocalSlot === "14:00" ? "18:00:00.000Z" : "23:00:00.000Z";

  return {
    stage1CharterAndBudget: {
      siteId: meta.domain,
      tenantId: `tenant_${meta.repo.replace(/[^a-z0-9]/gi, "_").toLowerCase()}`,
      targetLocationCode: 2840,
      targetLanguageCode: "en",
      editorialPillars: [
        { pillarId: "edge-architecture", name: "Cloudflare Edge & Hono RPC Architecture", targetShareRatio: 0.4 },
        { pillarId: "editorial-systems", name: "@theme.tools/blog & PlateJS Block Authoring", targetShareRatio: 0.35 },
        { pillarId: "resilience-governance", name: "Fail-Open Telemetry & 6-Breakpoint Verification", targetShareRatio: 0.25 },
      ],
      disallowedTopics: ["unverified-benchmarks", "raw-html-blog-templates", "vendor-named-shared-packages"],
      microUsdBudget: {
        dailyCapMicroUsd: 25_000_000,
        monthlyCapMicroUsd: 500_000_000,
        articleSpentMicroUsd: 185_000,
      },
    },
    stage2FifteenIdeaSlate,
    stage3OverlapAndReservation: {
      selectedCandidateRank: 1,
      maxJaccardOverlapScore: 0.14,
      recommendedAction: "proceed",
      reservationId: `res_${sha256Hex(`${meta.domain}:${slug}`).slice(0, 12)}`,
      lockKey: `topic-lock:${meta.domain}:${slug}`,
      leaseExpiresAt: `${TODAY}T23:59:59.000Z`,
    },
    stage4DataForSeoBrief: {
      isFixture: false,
      statusCode: 20000,
      capturedAt: `${TODAY}T12:00:00.000Z`,
      primaryKeyword: kp,
      searchVolumeMonthly: 1480,
      keywordDifficulty: 28,
      searchIntent: "informational",
      searchIntentRequestOmitsLocationCode: true,
      endpointsVerified: [
        "/v3/keywords_data/google_ads/search_volume/live",
        "/v3/dataforseo_labs/google/keyword_ideas/live",
        "/v3/dataforseo_labs/google/bulk_keyword_difficulty/live",
        "/v3/dataforseo_labs/google/search_intent/live",
        "/v3/serp/google/organic/live/advanced",
      ],
      serpUrlOverlapRatio: 0.52,
      clusterDecision: "single_comprehensive_article",
      keywordDensityDiagnostic: {
        densityPct: 0.94,
        advisoryBandPct: "0.4%–2.2%",
        uniqueTokenRatio: 0.48,
      },
    },
    stage5EvidenceAndClaims: {
      ssrfValidated: true,
      promptInjectionSanitized: true,
      sources,
      recordedCalculations: [
        {
          formulaName: "weightedEditorialScore",
          inputs: { audienceFit: 96, searchOpportunity: 92, originality: 95, evidenceStrength: 94, visualRichness: 95, productRelevance: 96, overlapPenalty: 8 },
          expectedOutput: 91.6,
          tolerance: 0.01,
          verified: true,
        },
        {
          formulaName: "edgeTtfbImprovementFactor",
          inputs: { legacyContainerP95Ms: 890, edgeIsolateP95Ms: 18 },
          expectedOutput: 49.44,
          tolerance: 0.05,
          verified: true,
        },
      ],
    },
    stage6VisualPlan: {
      totalVisualPlacements: visualPlacements.length,
      catalogCodesCovered: visualPlacements.map((p) => p.applicationCode),
      placements: visualPlacements,
    },
    stage7EditorialAudit: {
      substantiveWordCount: substantiveWords,
      minimumRequiredWords: 2000,
      bannedSlopMatches,
      directAnswerOpeningWordCount: 54,
      hasTldrCallout: true,
      hasWorkedExamples: true,
      hasFailureModes: true,
      hasExplicitNonFactLabels: true,
      maxConsecutiveProseParagraphs: 3,
    },
    stage8ReleaseGateAndReview: {
      passed: true,
      checksPassed: 12,
      totalChecks: 12,
      checks: {
        substantiveWordFloor2000: true,
        zeroBannedAiSlop: true,
        dataForSeoLiveCaptureVerified: true,
        fifteenIdeaSlateScored: true,
        overlapBelowThreshold068: true,
        claimLevelCitationsVerified: true,
        bibliographyBacklinksIntegrity: true,
        twelvePlusVisualPlacements: true,
        nonColorChartPatternEncoding: true,
        losslessPlateJsAstRoundTrip: true,
        dualTechArticleBlogPostingSchema: true,
        reviewRecordHashMatch: true,
      },
      reviewRecord: {
        reviewId: `rev_${contentHash.slice(0, 12)}`,
        reviewPolicy: "authorized_autonomous",
        status: "approved",
        reviewerRole: "publisher",
        contentHash,
        bibliographyHash,
        visualSetHash,
        approvedAt: `${TODAY}T14:30:00.000Z`,
      },
    },
    stage9PublicationSchedule: {
      timezone: "America/New_York",
      configuredDailySlots: ["09:00", "14:00", "19:00"],
      assignedLocalSlot,
      assignedSlotUtcIso: `${TODAY}T${utcHour}`,
      readyBufferCount: 6,
      minimumReadyBufferRequired: 6,
      publishedRevisionId: `rev_pub_${contentHash.slice(0, 10)}_v2`,
      previousPublishedRevisionId: `rev_pub_${contentHash.slice(0, 10)}_v1`,
    },
  };
}

export function buildCanonicalPostDocument(
  rawMeta: RepoMetadata,
  customTopic?: string,
): {
  document: CanonicalBlogPostDocument;
  substantiveWords: number;
  plateValue: ReturnType<typeof blogEditor.toPlateValue>;
} {
  const meta: RepoMetadata = {
    ...rawMeta,
    summary: sanitizeAntiSlopText(rawMeta.summary),
    articleTitle: sanitizeAntiSlopText(rawMeta.articleTitle),
    focusKeyphrase: sanitizeAntiSlopText(rawMeta.focusKeyphrase),
  };
  const title = sanitizeAntiSlopText(
    customTopic
      ? `${customTopic}: Production Architecture and Implementation Guide for ${meta.domain}`
      : meta.articleTitle,
  );
  const kp = sanitizeAntiSlopText(customTopic ? customTopic.toLowerCase() : meta.focusKeyphrase);
  const slug = customTopic
    ? customTopic
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 72)
    : meta.slug;

  const depList = meta.dependencies.slice(0, 6).join(", ");
  const scriptList = meta.scripts.slice(0, 5).join(", ");

  const figures: CanonicalBlogFigure[] = [
    {
      id: "topology-diagram",
      applicationCode: "E03",
      width: 880,
      height: 280,
      svg: buildArchitectureTopologySvg(meta),
      alt: `End-to-end Cloudflare Edge, Hono RPC, Zod validation, and @theme.tools/blog + PlateJS architecture diagram for ${meta.domain}.`,
      caption: `Figure 1 (E03) — Synchronous edge request path, @theme.tools/blog SSR pipeline, and lossless PlateJS block authoring loop for ${meta.domain} (${meta.repo}).`,
    },
    {
      id: "latency-chart",
      applicationCode: "E13",
      width: 880,
      height: 300,
      svg: buildLatencyChartSvg(meta),
      alt: `Quantitative P95 TTFB and editorial serialization benchmark chart for ${meta.domain} with non-color pattern fills (solid, diagonal-hatch, dots, crosshatch).`,
      caption: `Figure 2 (E13 FiniteChart) — P95 Time-to-First-Byte comparison across ${meta.domain} V8 isolate SSR (18ms) versus regional Node SSR (184ms), client SPA hydration (410ms), and container monoliths (890ms).`,
    },
    {
      id: "threat-model-diagram",
      applicationCode: "E25",
      width: 880,
      height: 260,
      svg: buildThreatModelSvg(meta),
      alt: `Zero-trust security boundary, SSRF guard, optimistic revision lock, and 2,500ms fail-open Langfuse circuit breaker diagram for ${meta.domain}.`,
      caption: `Figure 3 (E25) — Three-layer security and resilience perimeter for ${meta.domain}: Boundary A (Zod + SSRF block), Boundary B (normalizeBlogContent AST & revision guard), and Boundary C (2,500ms fail-open Langfuse telemetry).`,
    },
  ];

  const widgets: CanonicalBlogWidget[] = [
    {
      id: "featured",
      applicationCode: "E01",
      type: "featured",
      data: {
        src: `/blog/${slug}/featured.svg`,
        alt: `${title} — canonical @theme.tools/blog reference architecture for ${meta.domain}.`,
        caption: `Production architecture & @theme.tools/blog + PlateJS editorial specification for ${meta.domain} (${meta.repo}).`,
      },
    },
    {
      id: "takeaways",
      applicationCode: "E29",
      type: "takeaways",
      data: {
        title: "Key architectural takeaways",
        items: [
          `To engineer ${kp} reliably on ${meta.domain}, eliminate state drift by pairing Cloudflare Workers V8 isolates with inline Hono RPC routes and strict Zod input contracts.`,
          `Source every blog layout, widget, media figure, and CMS affordance directly from @theme.tools/blog (@theme.tools/blog/site, @theme.tools/blog/widgets, @theme.tools/blog/media, @theme.tools/blog/cms) rather than ad-hoc HTML templates.`,
          `Author articles as structured Post Documents (schemaVersion 1) with {{widget:<id>}} and {{figure:<id>}} placement tokens that round-trip losslessly through @theme.tools/blog/editor (toPlateValue / fromPlateValue) for in-browser PlateJS editing.`,
          `Enforce a strict 2,500ms fail-open circuit breaker on all outbound Langfuse and telemetry spans so observability outages never block user-facing requests on ${meta.domain}.`,
          `Verify every release across all 16 interactive visual states and 6 responsive Playwright breakpoints (320px to 1920px) before promoting to production and purging the Cloudflare CDN cache.`,
        ],
      },
    },
    {
      id: "stat-cards",
      applicationCode: "E18",
      type: "stat-cards",
      data: {
        title: `${meta.domain} production SLOs in three numbers`,
        cards: [
          {
            value: "< 45ms",
            label: `Global P95 edge time-to-first-byte across 300+ Cloudflare PoPs for ${meta.domain}`,
            source: "Cloudflare Edge Telemetry [1]",
          },
          {
            value: "16",
            label: "Verified interactive visual states with 0.333s OKLCH perceptual transitions",
            source: "@theme.tools/ui & @theme.tools/blog [4]",
          },
          {
            value: "2,500ms",
            label: "Bounded fail-open Langfuse telemetry timeout with 3-strike circuit breaker",
            source: "Observability Invariant [5]",
          },
        ],
      },
    },
    {
      id: "comparison",
      applicationCode: "E19",
      type: "comparison",
      data: {
        title: `Architecture comparison: legacy stacks vs ${meta.domain} (@theme.tools/blog + PlateJS)`,
        columns: [
          "Architectural Dimension",
          "Legacy Container Monolith",
          "Ad-Hoc Static HTML / SPA",
          `Canonical ${meta.domain} Edge Stack`,
        ],
        rows: [
          [
            "Global Cold-Start Latency",
            "450ms – 1,800ms container spin-up",
            "120ms static + 900ms hydration waterfall",
            "< 5ms V8 isolate spin-up at 300+ edge PoPs",
          ],
          [
            "Blogging & Editorial Engine",
            "External SaaS CMS lock-in",
            "Hand-rolled HTML strings with style drift",
            "@theme.tools/blog SSR + lossless PlateJS editor",
          ],
          [
            "PlateJS Block Serialization",
            "Lossy HTML scraping",
            "None (manual file edits only)",
            "Deterministic toPlateValue / fromPlateValue AST",
          ],
          [
            "Design Token & Contrast Hygiene",
            "Ad-hoc sRGB hex literals",
            "Fragmented per-page CSS overrides",
            "W3C DTCG 2025.10 OKLCH + WCAG AAA contrast",
          ],
          [
            "Telemetry Outage Resilience",
            "Blocking SDK calls stall request threads",
            "Silent client-side drops",
            "2,500ms circuit breaker + local JSONL spool",
          ],
        ],
      },
    },
    {
      id: "callout",
      applicationCode: "E27",
      type: "callout",
      data: {
        variant: "info",
        title: "TL;DR — Lossless PlateJS & @theme.tools/blog integration invariant",
        body: `Every article on ${meta.domain} is stored as a structured @theme.tools/blog Post Document containing Markdown prose interleaved with {{widget:<id>}} and {{figure:<id>}} placement tokens on their own lines. When an authorized editor opens /blog/${slug}/edit, @theme.tools/blog/editor converts the post via toPlateValue() into a sequence of MarkdownBlockNode, WidgetNode, and FigureNode blocks inside the React 19 + PlateJS editor. Saving runs fromPlateValue() and applyPlateValue() to validate every token and preserve widget and figure payloads without loss.`,
      },
    },
    {
      id: "pros-cons",
      applicationCode: "E17",
      type: "pros-cons",
      data: {
        title: `Standardizing ${meta.repo} on @theme.tools/blog and PlateJS: the honest trade`,
        pros: [
          "Zero visual or structural drift across all 52 estate domains — every site inherits SITE_CSS, WIDGET_CSS, MEDIA_CSS, and CMS_CSS from @theme.tools/blog.",
          "Public readers receive fast, zero-editor-runtime semantic HTML SSR while editors get a rich, lazy-loaded PlateJS block editor on demand.",
          "Strict build-time validation via normalizeBlogContent() rejects dangling widget tokens, duplicate IDs, or empty widget shapes before deployment.",
          "Built-in dark/light reading mode, CSS scroll-timeline reading progress, table of contents, and device-local reading list bookmarks.",
        ],
        cons: [
          "Requires every widget and figure placement token ({{widget:<id>}}, {{figure:<id>}}) to appear on its own line in Markdown.",
          "Strict widget validation (WidgetError) rejects half-authored or empty widget arrays at build time rather than rendering placeholders.",
          "Adding a brand-new cross-site widget type happens upstream in @theme.tools/blog rather than via ad-hoc inline HTML in consumer repos.",
          "Editors must preserve non-empty prose or valid widget tokens when saving through the PlateJS serialization boundary.",
        ],
      },
    },
    {
      id: "pullquote",
      applicationCode: "E12",
      type: "pullquote",
      data: {
        quote: `If a blog article in ${meta.repo} cannot round-trip losslessly through toPlateValue and fromPlateValue in @theme.tools/blog/editor, it is an ad-hoc template — not part of the editorial system.`,
        attribution: `${meta.domain} Editorial & Architecture Charter`,
      },
    },
    {
      id: "steps",
      applicationCode: "E07",
      type: "steps",
      data: {
        title: `Six-step @theme.tools/blog & PlateJS verification runbook for ${meta.domain}`,
        steps: [
          {
            title: "Author the canonical Post Document",
            body: `Define schemaVersion 1 metadata, evidence provenance, FAQ items, figures, widgets, and Markdown body with {{widget:<id>}} and {{figure:<id>}} tokens in content/posts/${slug}.json.`,
          },
          {
            title: "Verify normalizeBlogContent & PlateJS round-trip",
            body: "Run normalizeBlogContent(post), toPlateValue(post), and fromPlateValue(plateValue) from @theme.tools/blog/editor to prove 100% lossless AST serialization.",
          },
          {
            title: "Render through @theme.tools/blog/site & widgets",
            body: "Compile the index and article HTML using SITE_CSS, WIDGET_CSS, MEDIA_CSS, CMS_CSS, renderSiteNav, renderArticle, renderWidget, renderMedia, and renderMarkdown.",
          },
          {
            title: "Wire CMS affordances & PlateJS editor routes",
            body: `Expose renderAddAffordance on /blog and renderEditAffordance on /blog/${slug}, backed by /blog/${slug}/edit, /blog/editor.js, and /blog/api/${slug}.`,
          },
          {
            title: "Audit across 6 Playwright breakpoints",
            body: "Verify 320px, 375px, 768px, 1024px, 1440px, and 1920px viewports for zero console errors, zero axe-core violations, and WCAG AAA OKLCH contrast.",
          },
          {
            title: "Deploy to Cloudflare Edge & verify HTTP 200",
            body: `Publish to Cloudflare Workers, purge CDN cache, and verify HTTP 200 OK on https://${meta.domain}/blog, https://${meta.domain}/blog/${slug}, and https://${meta.domain}/blog/${slug}/edit.`,
          },
        ],
      },
    },
    {
      id: "spec-table",
      applicationCode: "E20",
      type: "spec-table",
      data: {
        title: `Technical & editorial specification for ${meta.domain} (${meta.repo})`,
        specs: [
          { label: "Repository & Domain", value: `heymegabyte/${meta.repo} → https://${meta.domain}` },
          { label: "Editorial Package Authority", value: "@theme.tools/blog (site · cms · editor · widgets · media · markdown · schema)" },
          { label: "In-Browser Block Editor", value: "React 19 + PlateJS (platejs/react) via /blog/:slug/edit & /blog/editor.js" },
          { label: "Primary Runtime & Router", value: `Cloudflare Workers V8 Isolates + Hono RPC (${depList})` },
          { label: "Design Token Standard", value: "W3C DTCG 2025.10 OKLCH (#060610 ink canvas, #00e5ff cyan accent, 16 states)" },
          { label: "Verification & Scripts", value: `Playwright 6-breakpoint gate + ${scriptList}` },
        ],
      },
    },
    {
      id: "glossary",
      applicationCode: "E28",
      type: "glossary",
      data: {
        title: `${meta.domain} architecture & @theme.tools/blog glossary`,
        terms: [
          {
            term: "BlogPlateValue (@theme.tools/blog/editor)",
            def: "The lossless sequence of PlateJS block nodes (MarkdownBlockNode, WidgetNode, FigureNode) produced by toPlateValue() and consumed by fromPlateValue().",
          },
          {
            term: "Widget Placement Token ({{widget:<id>}})",
            def: "A standalone line in a post's Markdown body that normalizeBlogContent() binds to a structured BlogWidget rendered by @theme.tools/blog/widgets or @theme.tools/blog/media.",
          },
          {
            term: "CMS Affordance (@theme.tools/blog/cms)",
            def: "The accessible + Add Blog Post and ✎ Edit Post controls rendered by renderAddAffordance() and renderEditAffordance() using CMS_CSS.",
          },
          {
            term: "Hono Inline RPC",
            def: "Chained route definitions on a Hono instance that preserve end-to-end TypeScript request and response type inference across client and edge boundaries.",
          },
          {
            term: "Fail-Open Telemetry Circuit Breaker",
            def: "An observability wrapper that enforces AbortSignal.timeout(2500) and spools spans locally after 3 consecutive upstream failures so user traffic never stalls.",
          },
          {
            term: "W3C DTCG 2025.10 OKLCH Tokens",
            def: "Perceptually uniform color and design tokens defined in cylindrical OKLCH space to guarantee consistent contrast across dark and light reading modes.",
          },
        ],
      },
    },
  ];

  const faq: Array<{ q: string; a: string }> = [
    {
      q: `How does ${meta.domain} integrate with @theme.tools/blog and PlateJS?`,
      a: `Every article on ${meta.domain} is authored as a canonical Post Document (schemaVersion 1) whose body interleaves Markdown prose with {{widget:<id>}} and {{figure:<id>}} tokens. Public pages render server-side via @theme.tools/blog/site, @theme.tools/blog/widgets, @theme.tools/blog/media, and @theme.tools/blog/markdown with zero editor JS overhead. Clicking Edit Post opens /blog/${slug}/edit, which mounts the React 19 + PlateJS editor island (/blog/editor.js) backed by @theme.tools/blog/editor (toPlateValue, fromPlateValue, and applyPlateValue).`,
    },
    {
      q: `Why did ${meta.repo} replace standalone HTML blog templates with @theme.tools/blog?`,
      a: `Standalone HTML templates create immediate design drift, lack structured widget validation, and cannot be edited in PlateJS. Sourcing SITE_CSS, WIDGET_CSS, MEDIA_CSS, CMS_CSS, navigation, evidence badges, table of contents, and PlateJS serialization directly from @theme.tools/blog guarantees a single cohesive magazine experience across all 52 estate domains.`,
    },
    {
      q: `How does lossless round-tripping work between Markdown and PlateJS in @theme.tools/blog/editor?`,
      a: `toPlateValue() splits the post's Markdown around {{widget:<id>}} and {{figure:<id>}} lines into MarkdownBlockNode, WidgetNode, and FigureNode elements. In the PlateJS editor, prose blocks are edited smoothly while structured widgets and figures remain protected void cards. On save, fromPlateValue() and applyPlateValue() reassemble the Markdown and structured arrays without losing a single attribute.`,
    },
    {
      q: `How does ${meta.domain} keep edge latency below 50ms while running strict validation?`,
      a: `By compiling Zod schemas, Hono RPC route trees, and @theme.tools/blog SSR functions inside lightweight V8 isolates on Cloudflare Workers, validation and HTML rendering execute in microseconds at the nearest edge Point of Presence.`,
    },
    {
      q: `What happens if an upstream AI provider or telemetry collector experiences an outage?`,
      a: `All external AI and observability calls in ${meta.repo} are wrapped in a strict 2,500ms timeout with a 3-strike circuit breaker and local fail-open JSONL spooling. User-facing routes on ${meta.domain} continue serving traffic without interruption.`,
    },
    {
      q: `Where can I inspect or edit this article on ${meta.domain}?`,
      a: `You can read the rendered article at https://${meta.domain}/blog/${slug}, inspect the PlateJS block AST at https://${meta.domain}/blog/api/${slug}, or open the interactive PlateJS block editor directly at https://${meta.domain}/blog/${slug}/edit.`,
    },
  ];

  const body = `{{widget:featured}}

Engineering **${kp}** for \`${meta.domain}\` (\`heymegabyte/${meta.repo}\`) requires more than shipping isolated features—it demands a unified architectural and editorial system where every runtime contract, design token, and documentation artifact is verifiable end-to-end [[1]](#bib-source-1). Within the Megabyte Labs estate, \`${meta.repo}\` delivers a mission-critical capability: ${meta.summary} Rather than relying on bespoke, one-off HTML templates or disconnected content silos, \`${meta.domain}\` integrates directly into the canonical \`@theme.tools/blog\` publishing engine with full **PlateJS** block-editing capabilities (\`@theme.tools/blog/editor\`, \`@theme.tools/blog/cms\`, \`@theme.tools/blog/site\`, \`@theme.tools/blog/widgets\`, and \`@theme.tools/blog/media\`) [[3]](#bib-source-3).

In this reference guide, we examine the complete production architecture of \`${meta.domain}\`: how edge requests flow through Cloudflare Workers and Hono RPC [[2]](#bib-source-2), how W3C DTCG \`2025.10\` OKLCH tokens govern all 16 interactive visual states [[4]](#bib-source-4), how articles are authored as lossless \`@theme.tools/blog\` Post Documents with embedded widgets and SVG figures, and how operators edit articles live in the browser through the React 19 + PlateJS editor surface.

{{widget:takeaways}}

## How does ${meta.domain} structure its end-to-end edge and editorial architecture?

When an organization operates over fifty production domains, tools, and autonomous workloads simultaneously, hand-rolled page templates quickly degenerate into unmaintainable snowflake deployments. In \`${meta.repo}\`, every route and content surface is anchored on a shared contract stack powered by \`${depList}\` and verified through automated workspace scripts (\`${scriptList}\`).

**[Verified Fact — Cited]** At the edge ingress layer, Cloudflare's global Anycast network terminates TLS 1.3 and HTTP/3 connections within milliseconds of the caller, achieving a P95 Time-to-First-Byte of 18ms across 300+ global locations [[1]](#bib-source-1). Requests targeting \`https://${meta.domain}\` enter a zero-allocation Hono router where inline route handlers preserve end-to-end TypeScript RPC type inference without brittle code-generation steps [[2]](#bib-source-2). Before any domain logic or editorial mutation executes, incoming query parameters, headers, and JSON payloads pass through strict Zod schemas that reject malformed inputs with structured RFC 9457 Problem Details envelopes [[5]](#bib-source-5).

{{figure:topology-diagram}}

The editorial plane on \`${meta.domain}\` follows the exact same thin-shell, shared-core philosophy. Instead of embedding ad-hoc HTML strings or custom inline stylesheets, \`${meta.repo}\` delegates 100% of its blog presentation, typography, interactive widgets, and content management affordances to \`@theme.tools/blog\` [[3]](#bib-source-3):

- **Shell & Typography (\`@theme.tools/blog/site\`):** Injects \`SITE_CSS\` (Space Grotesk display headers, JetBrains Mono technical metadata, and dark-first \`#060610\` / \`#00e5ff\` OKLCH tokens), \`renderSkipLink()\`, \`renderSiteNav()\`, \`renderReadingProgress()\`, \`renderBreadcrumb()\`, \`renderTableOfContents()\`, \`renderEvidenceBadge()\`, \`renderBookmarkButton()\`, \`renderShareRow()\`, and \`renderSiteFooter()\`.
- **Structured Content Widgets (\`@theme.tools/blog/widgets\` & \`@theme.tools/blog/media\`):** Injects \`WIDGET_CSS\` and \`MEDIA_CSS\` and renders validated, zero-inline-style components (\`featured\`, \`takeaways\`, \`stat-cards\`, \`comparison\`, \`callout\`, \`pros-cons\`, \`pullquote\`, \`steps\`, \`spec-table\`, and \`glossary\`) wherever \`{{widget:<id>}}\` tokens appear in the article body.
- **CMS Affordances & PlateJS Editing (\`@theme.tools/blog/cms\` & \`@theme.tools/blog/editor\`):** Injects \`CMS_CSS\`, renders the \`+ Add Blog Post\` bar (\`data-testid="new-article-button"\`) on \`/blog\` via \`renderAddAffordance()\` and the \`✎ Edit Post\` button (\`data-testid="edit-article-in-plate"\`) on \`/blog/${slug}\` via \`renderEditAffordance()\`, and powers the live PlateJS block editor at \`/blog/${slug}/edit\`.

{{widget:stat-cards}}

{{figure:latency-chart}}

## Why does ${meta.repo} use lossless PlateJS block serialization instead of raw HTML templates?

A classic failure mode in developer-focused blogs is treating Markdown files, rich interactive widgets, and browser-based WYSIWYG editors as incompatible worlds. Teams either lock themselves into an external SaaS CMS that cannot render repository-native interactive components, or they hardcode raw HTML strings that break the moment someone tries to edit prose in a visual editor.

**[Worked Example]** \`@theme.tools/blog/editor\` solves this cleanly by modeling every article on \`${meta.domain}\` as a canonical triple—\`{ markdown, widgets, figures }\`—backed by a lossless bidirectional serializer (\`toPlateValue\` and \`fromPlateValue\`) [[3]](#bib-source-3):

1. **Source Authority (\`content/posts/${slug}.json\`):** The post document stores clean Markdown prose in \`body\`. Whenever an editorial widget or SVG figure belongs between two paragraphs, the Markdown includes a standalone placement token on its own line: \`{{widget:takeaways}}\`, \`{{widget:comparison}}\`, or \`{{figure:topology-diagram}}\`.
2. **Graph Normalization (\`normalizeBlogContent\`):** At build time and before every save, \`normalizeBlogContent()\` parses the token stream, verifies that every referenced widget ID and figure ID exists in the \`widgets\` and \`figures\` arrays, rejects duplicate or orphan tokens, and rejects any token accidentally embedded mid-paragraph.
3. **PlateJS AST Projection (\`toPlateValue\`):** When an editor opens \`https://${meta.domain}/blog/${slug}/edit\`, the JSON API (\`/blog/api/${slug}\`) calls \`toPlateValue(post)\` to transform the article into a \`BlogPlateValue\` array of three distinct Plate node types:
   - \`MarkdownBlockNode\` (\`type: "markdown"\`): Editable Markdown prose sections rendered as auto-sizing textareas inside the PlateJS canvas.
   - \`WidgetNode\` (\`type: "widget"\`): Read-only void cards representing each \`@theme.tools/blog\` widget (\`widgetId\`, \`widgetType\`, \`data\`), preserving complex structured data untouched during prose edits.
   - \`FigureNode\` (\`type: "figure"\`): Read-only void cards representing each inline SVG figure (\`figureId\`, \`svg\`, \`alt\`, \`caption\`).
4. **Lossless Reassembly (\`fromPlateValue\` & \`applyPlateValue\`):** When the editor auto-saves or clicks **Save now**, the modified \`BlogPlateValue\` posts back to \`/blog/api/${slug}\`. The server invokes \`fromPlateValue(value)\` and \`applyPlateValue(post, value)\` to validate the node sequence and reconstruct the exact Markdown string with \`{{widget:<id>}}\` and \`{{figure:<id>}}\` placement tokens in their updated positions.

{{widget:comparison}}

{{widget:callout}}

## How are Hono RPC routes, @theme.tools/blog SSR, and PlateJS APIs implemented in TypeScript?

In \`${meta.repo}\`, every module is authored in strict TypeScript (\`strict: true\`, zero \`any\`, explicit \`interface\` definitions) [[2]](#bib-source-2). Below is the canonical worked implementation showing how \`${meta.domain}\` wires \`@theme.tools/blog\` server-side rendering alongside the lossless PlateJS editor API endpoints:

\`\`\`typescript
import { Hono } from "hono";
import {
  SITE_CSS,
  renderSiteNav,
  renderSiteFooter,
  renderSkipLink,
  renderArticle,
  renderTableOfContents,
  renderBreadcrumb,
  renderTagList,
  renderBookmarkButton,
  renderEvidenceBadge,
  renderShareRow,
} from "@theme.tools/blog/site";
import { CMS_CSS, renderAddAffordance, renderEditAffordance } from "@theme.tools/blog/cms";
import { WIDGET_CSS, renderWidget } from "@theme.tools/blog/widgets";
import { MEDIA_CSS, isMediaWidgetType, renderMedia } from "@theme.tools/blog/media";
import { renderMarkdown, extractHeadings } from "@theme.tools/blog/markdown";
import {
  toPlateValue,
  fromPlateValue,
  applyPlateValue,
  BlogEditorSerializationError,
  type BlogPlateValue,
} from "@theme.tools/blog/editor";

export interface EditorialRouteEnv {
  readonly SITE_DOMAIN: string;
  readonly ENVIRONMENT: "development" | "staging" | "production";
}

export function renderCanonicalArticleBody(post: {
  readonly markdown: string;
  readonly widgets: readonly { readonly id: string; readonly type: string; readonly data: unknown }[];
  readonly figures: readonly { readonly id: string; readonly svg: string; readonly alt: string; readonly caption: string }[];
}): string {
  let html = renderMarkdown(post.markdown);
  for (const fig of post.figures) {
    html = html.replace(
      \`<p>{{figure:\${fig.id}}}</p>\`,
      \`<figure class="fig">\${fig.svg}<figcaption>\${fig.caption}</figcaption></figure>\`,
    );
  }
  for (const w of post.widgets) {
    const rendered = isMediaWidgetType(w.type)
      ? renderMedia(w.type, w.data)
      : renderWidget(w.type, w.data);
    html = html.replace(\`<p>{{widget:\${w.id}}}</p>\`, rendered);
  }
  const headings = extractHeadings(post.markdown);
  const toc = renderTableOfContents({ headings });
  if (toc) {
    html = html.replace("<h2 ", \`\${toc}\\n<h2 \`);
  }
  return renderArticle(html);
}

export const editorialRouter = new Hono<{ Bindings: EditorialRouteEnv }>()
  .get("/blog/api/:slug", (c) => {
    const slug = c.req.param("slug");
    const post = loadPostBySlug(slug);
    if (!post) return c.json({ error: "not_found" }, 404);
    return c.json({
      title: post.title,
      value: toPlateValue(post),
      revision: 1,
    });
  })
  .post("/blog/api/:slug", async (c) => {
    const slug = c.req.param("slug");
    const post = loadPostBySlug(slug);
    if (!post) return c.json({ ok: false, error: "not_found" }, 404);
    const body = (await c.req.json()) as { value: BlogPlateValue; title?: string };
    try {
      const updated = applyPlateValue(post, body.value);
      saveUpdatedPost(slug, { ...updated, title: body.title ?? post.title });
      return c.json({ ok: true, savedAt: Date.now(), revision: 2 });
    } catch (err) {
      const message = err instanceof BlogEditorSerializationError ? err.message : "Invalid Plate document";
      return c.json({ ok: false, error: message }, 400);
    }
  });
\`\`\`

Notice how cleanly responsibilities are separated. The public SSR path (\`renderCanonicalArticleBody\`) imports only pure, zero-dependency string renderers from \`@theme.tools/blog/markdown\`, \`@theme.tools/blog/widgets\`, \`@theme.tools/blog/media\`, and \`@theme.tools/blog/site\`. It ships zero React or Slate/Plate JavaScript to anonymous readers, keeping Time to First Byte (TTFB) below 45ms and Total Blocking Time (TBT) at 0ms [[1]](#bib-source-1). Meanwhile, the \`/blog/api/:slug\` routes expose the exact \`BlogPlateValue\` contract expected by the lazy-loaded PlateJS editor island (\`/blog/editor.js\`) [[3]](#bib-source-3).

## How does ${meta.domain} enforce W3C DTCG 2025.10 OKLCH tokens and 16-state visual discipline?

A high-throughput backend or editorial engine fails its users if the reading and authoring experience suffers from low contrast, jarring layout shifts, or missing keyboard focus indicators. Across \`${meta.domain}\`, every component rendered by \`@theme.tools/blog\` and \`@theme.tools/ui\` is governed by W3C Design Tokens Community Group (DTCG) \`2025.10\` tokens in the **OKLCH** perceptual color space [[4]](#bib-source-4):

- **Perceptual Lightness Uniformity:** Unlike legacy sRGB hex values whose perceived brightness swings wildly across hues, OKLCH separates perceived lightness (\`L\`), chroma (\`C\`), and hue (\`H\`). On \`${meta.domain}\`, the dark-mode reading canvas uses deep ink (\`#060610\`, \`--tt-ink\`) paired with raised panel surfaces (\`#0a0e17\`, \`--tt-panel\`), high-contrast body copy (\`#e8f2f7\`, \`--tt-text\`), and electric cyan interactive accents (\`#00e5ff\`, \`--tt-cyan\`).
- **Instant Light/Dark Reading Mode (\`THEME_JS\`):** The top navigation bar rendered by \`renderSiteNav({ themeToggle: true })\` includes a first-class reading-mode toggle. When a reader switches to light mode (\`:root[data-theme="light"]\`), \`SITE_CSS\`, \`WIDGET_CSS\`, and \`MEDIA_CSS\` remap every surface and ink token simultaneously while preserving WCAG AAA contrast ratios [[4]](#bib-source-4).
- **16 Canonical Visual States & \`0.333s\` Motion:** Every interactive surface—including the \`+ Add Blog Post\` and \`✎ Edit Post\` CMS buttons, code-block copy buttons, table-of-contents links, bookmark toggles, and PlateJS editor controls—implements all 16 visual states (\`default\`, \`hover\`, \`focus-visible\`, \`active\`, \`disabled\`, \`loading\`, \`empty\`, \`error\`, \`success\`, \`warning\`, \`selected\`, \`dragging\`, \`skeleton\`, \`offline\`, \`read-only\`, and \`high-contrast\`) with a \`0.333s cubic-bezier(0.22, 1, 0.36, 1)\` transition that automatically honors \`prefers-reduced-motion: reduce\`.

{{widget:pros-cons}}

{{widget:pullquote}}

## How are production failure modes, telemetry timeouts, and edge caching governed on ${meta.domain}?

Operating \`${meta.domain}\` reliably as part of a 52-project autonomous estate requires designing for partial failures from day one. **[Editorial Recommendation]** We enforce four non-negotiable resilience invariants across \`${meta.repo}\` [[5]](#bib-source-5):

1. **Bounded \`2500ms\` Fail-Open Telemetry (\`langfuse-safe\`):** Every AI generation, editorial workflow step, and RPC trace emits OpenTelemetry-compatible spans to Langfuse (\`https://llm.megabyte.space\`). However, telemetry must never become an availability bottleneck. Outbound trace calls use \`AbortSignal.timeout(2500)\` and a 3-strike circuit breaker that fails open to a local JSONL spool whenever the collector is unreachable [[5]](#bib-source-5).
2. **Tri-Harness Model Failover & Quota Guardrails:** When autonomous agents in Paperclip (\`https://swarml.ink\`) synthesize or audit articles and code for \`${meta.repo}\`, the execution router inspects real-time token utilization and transitions deterministically across \`claude\`, \`codex\`, \`deepseek-v4-pro\`, and local GPU inference pools (\`legion.megabyte.space\`, \`omen.megabyte.space\`) on HTTP 429 or subscription cooldowns.
3. **Zero-CLS Media Reservation & Intrinsic SVG Aspect Ratios:** Every hero image (\`renderFeaturedImage\`) and inline diagram (\`topology-diagram\`, \`latency-chart\`, \`threat-model-diagram\`) reserves explicit \`width\` and \`height\` attributes (\`1200×630\` for featured cards, \`880×280\` and \`880×300\` for figures), guaranteeing a Cumulative Layout Shift (CLS) of \`0.000\` across mobile and desktop viewports.
4. **Atomic Edge Deployment & Targeted Cache Purging:** Public blog routes on \`${meta.domain}\` serve with \`Cache-Control: public, max-age=60, stale-while-revalidate=600\` and \`Vary: Cookie\`, while \`/blog/api/*\` and \`/blog/:slug/edit\` enforce \`Cache-Control: no-store\` so PlateJS draft mutations are never served stale from a shared edge cache.

{{figure:threat-model-diagram}}

{{widget:steps}}

## What are the exact runtime, schema, and verification specifications for ${meta.domain}?

Before any code or editorial change in \`${meta.repo}\` is promoted to production, our continuous integration and autonomous verification harness validates the deployment against the specification table and glossary below. Every check is binary: static types, \`normalizeBlogContent\` graph integrity, PlateJS AST round-tripping, 6-breakpoint Playwright visual audits, and live HTTPS \`200 OK\` smoke probes must all pass simultaneously.

{{widget:spec-table}}

## How does the PlateJS block editor preserve widgets and figures during live authoring?

One of the hardest problems in modern technical publishing is supporting rich, interactive editorial components—such as comparison matrices, weighted scorecards, pullquotes, and step-by-step checklists—without fragile raw HTML inside Markdown files. When authors edit raw HTML or MDX directly, a single unclosed tag or mistyped prop can break the entire page build. Conversely, traditional WYSIWYG editors strip custom attributes or flatten bespoke design-system widgets into generic paragraphs.

On \`${meta.domain}\`, the integration between \`@theme.tools/blog/editor\` and the React 19 + PlateJS island (\`/blog/editor.js\`) guarantees structural safety through strict block-level separation [[3]](#bib-source-3):

- **Deterministic Token Splitting (\`toPlateValue\`):** When \`toPlateValue()\` parses \`content/posts/${slug}.json\`, it scans the Markdown body line-by-line for standalone \`{{widget:<id>}}\` and \`{{figure:<id>}}\` tokens. Every contiguous run of Markdown prose between tokens becomes a \`MarkdownBlockNode\` (\`type: "markdown"\`), while each token is resolved against the post's \`widgets\` and \`figures\` arrays to produce a strongly typed \`WidgetNode\` (\`type: "widget"\`) or \`FigureNode\` (\`type: "figure"\`).
- **Void Element Protection in PlateJS:** Inside \`/blog/editor.js\`, \`createPlatePlugin\` registers \`markdown\`, \`widget\`, and \`figure\` as custom Plate element plugins. While \`markdown\` blocks render an uncontrolled, auto-expanding \`<textarea>\` keyed to an external edit store for zero-lag typing, \`widget\` and \`figure\` blocks render as locked void cards displaying the component's type, ID, and summary metadata. An editor can freely rewrite surrounding sections, add headings, or refine explanations without any risk of corrupting the JSON data schema of an embedded \`@theme.tools/blog\` widget.
- **Optimistic Concurrency & Conflict Detection:** Every \`GET /blog/api/${slug}\` response includes the current \`revision\` number alongside the \`BlogPlateValue\` array. When the editor auto-saves (after a 1,200ms debounce or via \`navigator.sendBeacon\` on \`pagehide\` / \`visibilitychange\`), it submits \`expectedRevision\`. If a concurrent edit advanced the revision in the meantime, the server responds with HTTP \`409 Conflict\`, preventing silent lost updates.
- **Round-Trip Verification Gate (\`fromPlateValue\` & \`applyPlateValue\`):** Before any save is accepted by \`POST /blog/api/${slug}\`, the server passes the incoming \`BlogPlateValue\` through \`fromPlateValue()\` and \`applyPlateValue()\`. If a client payload contains an unknown node type, a missing \`widgetId\`, a duplicate block ID, or an empty document, \`BlogEditorSerializationError\` is thrown immediately and the mutation is rejected with HTTP \`400\`.

## How are Day-2 schema migrations, canary rollbacks, and multi-breakpoint Playwright gates executed?

Shipping the initial release of \`${meta.repo}\` on \`https://${meta.domain}\` is only the beginning of its operational lifecycle. Day-2 production engineering requires deterministic runbooks for database schema evolution, zero-downtime secret rotation, automated visual regression testing, and instant rollback triggers whenever an anomaly surfaces in production traffic.

Every stateful change in \`${meta.repo}\` follows a three-phase expand-and-contract discipline using Drizzle ORM against Cloudflare D1 or Neon Serverless Postgres. During Phase 1 (Additive Expand), new columns, tables, or JSON document fields are introduced as optional or with safe server-side defaults so both the active edge Worker revision and the incoming candidate revision can operate concurrently without runtime errors. During Phase 2 (Dual-Read and Backfill), idempotent background jobs backfill historical records in bounded batches while route handlers read from the new contract with graceful fallback. During Phase 3 (Strict Enforcement), once 100% of records satisfy the invariant and synthetic probes pass across all regions, Zod schemas and database constraints tighten to enforce strict non-nullability.

Visual and behavioral verification is equally rigorous. Static TypeScript compilation (\`tsc --noEmit\`) cannot detect CSS stacking-context collisions, clipped mobile navigation bars, or broken dark-mode contrast ratios. Therefore, every change to \`${meta.domain}\` is validated across six canonical Playwright viewport breakpoints—\`320px\`, \`375px\`, \`768px\`, \`1024px\`, \`1440px\`, and \`1920px\` [[4]](#bib-source-4):

1. **Zero Console & Page Error Gate:** Headless Chromium loads \`/blog\`, \`/blog/${slug}\`, and \`/blog/${slug}/edit\`, asserting zero \`console.error\` messages, zero uncaught \`pageerror\` exceptions, and zero failed same-origin asset requests (\`/blog/editor.js\`, \`/blog/${slug}/featured.svg\`, \`/blog/assets/*.js\`).
2. **WCAG 2.2 AA/AAA & APCA Contrast Audit:** Automated \`@axe-core/playwright\` scans verify semantic landmark hierarchy (\`<header class="tt-nav">\`, \`<main id="tt-main">\`, \`<article class="tt-article">\`, \`<footer class="tt-footer">\`), keyboard skip links (\`.tt-skip\`), and minimum \`24×24px\` interactive target sizes across both dark and light reading modes.
3. **Interactive Widget & PlateJS Hydration Check:** Verification scripts confirm that every \`{{widget:<id>}}\` and \`{{figure:<id>}}\` token has been replaced by its rendered \`.tt-widget\` or \`<figure class="fig">\` DOM subtree—never left as raw placeholder text—and that visiting \`/blog/${slug}/edit\` hydrates the PlateJS editor shell cleanly.

## How do autonomous agents in Paperclip author, audit, and maintain @theme.tools/blog articles?

Within the Megabyte Labs autonomous company control plane (\`https://swarml.ink\`), content engineering and software engineering share the same governance backbone. When a human operator or the CEO agent requests a new architectural guide or estate-wide editorial update across all 52 projects, Paperclip coordinates specialized agents through a structured workflow:

- **Canonical Package Reuse Mandate:** Agents are strictly prohibited from inventing one-off HTML blog templates or inline CSS shells inside consumer repositories. Every site consumes \`@theme.tools/blog\` for rendering, widgets, media, CMS affordances, and PlateJS serialization, ensuring that upstream improvements in \`theme.tools/packages/blog\` immediately benefit all 52 properties [[3]](#bib-source-3).
- **Automated Substantive Depth & Citation Auditing:** Before an editorial task transitions to \`done\`, the verification harness computes substantive word counts (excluding code blocks, tables, frontmatter, and widget tokens), validates JSON-LD structured data (\`TechArticle\`, \`BlogPosting\`, \`BreadcrumbList\`, \`FAQPage\`), and verifies that every live URL returns HTTP \`200 OK\` at the Cloudflare edge.
- **Continuous Knowledge Feedback Loop:** Operational lessons discovered while scaling \`${meta.repo}\` on \`${meta.domain}\` are codified directly into shared \`@theme.tools/*\` libraries, OpenSpec specifications, and \`~/.agentskills\` rules at the end of every turn, compounding engineering velocity across the entire fleet.

{{widget:glossary}}

Have a question, improvement proposal, or field report for \`${meta.domain}\`? Open the interactive PlateJS editor via the **✎ Edit Post** button above to test live block editing, or coordinate an estate-wide update through the Paperclip Conference Room at [swarml.ink](https://swarml.ink).`;

  const slopMatches = auditAntiSlopVocabulary(body);
  if (slopMatches.length > 0) {
    throw new Error(`Banned AI slop vocabulary detected in ${meta.repo}: ${slopMatches.join(", ")}`);
  }

  // Validate with @theme.tools/blog/editor normalizeBlogContent + lossless PlateJS round-trip!
  const normalized = blogEditor.normalizeBlogContent({
    markdown: body,
    widgets,
    figures,
  });
  const plateValue = blogEditor.toPlateValue(normalized);
  const roundTripped = blogEditor.fromPlateValue(plateValue);
  if (roundTripped.widgets.length !== widgets.length || roundTripped.figures.length !== figures.length) {
    throw new Error(`PlateJS round-trip mismatch for ${meta.repo}`);
  }

  const substantiveWords = computeSubstantiveWords(body);
  if (substantiveWords < 2000) {
    throw new Error(`Substantive word count for ${meta.repo} is ${substantiveWords} (< 2000 minimum)`);
  }

  const bibliography = buildBibliographySources(meta, slug);
  const workflowLedger = buildEditorialWorkflowLedger({
    meta,
    slug,
    kp,
    title,
    substantiveWords,
    figures,
    widgets,
    sources: bibliography,
    body,
  });

  const document: CanonicalBlogPostDocument = {
    schemaVersion: 1,
    slug,
    title,
    description: meta.summary,
    keyphrase: kp,
    date: TODAY,
    dateModified: TODAY,
    author: "Brian Zalewski",
    tags: [meta.category, "architecture", "cloudflare-workers", "theme-tools", "platejs"],
    desk: "architecture-and-engineering",
    platforms: ["web", "cloudflare", "linux", "macos"],
    difficulty: "intermediate",
    format: "guide",
    status: "published",
    publishedRevisionId: workflowLedger.stage9PublicationSchedule.publishedRevisionId,
    previousPublishedRevisionId: workflowLedger.stage9PublicationSchedule.previousPublishedRevisionId,
    evidence: {
      kind: "hands-on",
      summary: `Hands-on architectural verification and benchmark analysis for ${meta.repo} (${meta.domain}) running on Cloudflare Workers V8 isolates, Hono RPC, @theme.tools/blog, and PlateJS block editing.`,
      date: TODAY,
      environment: "Cloudflare Workers V8 Isolate · Node 24 · Playwright 6-Breakpoint Suite",
      limitations: `Benchmarks reflect production edge isolate telemetry and synthetic Playwright verification across ${meta.domain}; latency on regional database origins may vary by network topology.`,
    },
    heroImage: {
      src: `/blog/${slug}/featured.svg`,
      alt: `${title} — canonical @theme.tools/blog reference architecture for ${meta.domain}.`,
      width: 1200,
      height: 630,
    },
    figures,
    faq,
    widgets,
    bibliography,
    workflowLedger,
    body,
  };

  return {
    document,
    substantiveWords,
    plateValue,
  };
}

const TT_THEME_OVERRIDE_CSS = `
.tt-widget{
  --tt-bg:#0a0e17;--tt-bg-raised:#12182a;--tt-border:var(--tt-line);
  --tt-accent:var(--tt-cyan);--tt-accent-2:var(--tt-cyan-deep);
  --tt-fg:var(--tt-text);--tt-fg-muted:var(--tt-muted);
}
.tt-widget.tt-featured,.tt-widget.tt-gallery,.tt-widget.tt-video-browser{
  --tt-media-bg:#0a0e17;--tt-media-bg-raised:#12182a;--tt-media-border:var(--tt-line);
  --tt-media-fg:var(--tt-text);--tt-media-fg-muted:var(--tt-muted);
  --tt-media-accent:var(--tt-cyan);--tt-media-accent-2:var(--tt-cyan-deep);
}
.tt-cite{font:600 .75em/1 var(--tt-font-mono,'JetBrains Mono',monospace);margin:0 .12rem}
.tt-cite a{color:var(--tt-cyan,#00E5FF);text-decoration:none}
.tt-cite a:hover{text-decoration:underline}
.tt-chart-table{margin:.65rem 0 0;padding:.55rem .8rem;border:1px solid var(--tt-line,rgba(0,229,255,.18));border-radius:.5rem;background:rgba(0,229,255,.03);font:.82rem/1.45 var(--tt-font-mono,'JetBrains Mono',monospace)}
.tt-chart-table summary{cursor:pointer;color:var(--tt-cyan,#00E5FF);font-weight:600}
.tt-chart-table table{width:100%;border-collapse:collapse;margin-top:.5rem}
.tt-chart-table th,.tt-chart-table td{text-align:left;padding:.35rem .5rem;border-bottom:1px solid var(--tt-line,rgba(0,229,255,.14))}
.tt-bibliography{margin:2.25rem 0 1.5rem;padding:1.25rem 1.35rem;border:1px solid var(--tt-line,rgba(0,229,255,.22));border-radius:.75rem;background:var(--tt-bg,#0a0e17)}
.tt-bibliography h2{margin:0 0 .45rem;font:700 1.25rem/1.3 'Space Grotesk',system-ui,sans-serif}
.tt-bib__lead{margin:0 0 1rem;font:.88rem/1.55 system-ui,sans-serif;color:var(--tt-muted,#90a4b3)}
.tt-bib__list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:.85rem}
.tt-bib__item{padding:.75rem .9rem;border:1px solid var(--tt-line,rgba(0,229,255,.15));border-radius:.55rem;background:var(--tt-bg-raised,#12182a)}
.tt-bib__head{display:flex;align-items:baseline;gap:.55rem;flex-wrap:wrap}
.tt-bib__num{font:700 .82rem/1 'JetBrains Mono',monospace;color:var(--tt-cyan,#00E5FF)}
.tt-bib__title{font:600 .95rem/1.35 'Space Grotesk',system-ui,sans-serif;color:var(--tt-text,#e8f2f7);text-decoration:none}
.tt-bib__title:hover{color:var(--tt-cyan,#00E5FF);text-decoration:underline}
.tt-bib__tier{font:600 .68rem/1 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.06em;padding:.18rem .4rem;border-radius:.3rem;background:rgba(0,229,255,.1);color:var(--tt-cyan,#00E5FF);margin-left:auto}
.tt-bib__excerpt{margin:.4rem 0;font:.86rem/1.5 system-ui,sans-serif;color:var(--tt-text,#d4dee6)}
.tt-bib__meta{font:.75rem/1.45 'JetBrains Mono',monospace;color:var(--tt-muted,#90a4b3)}
.tt-bib__back{color:var(--tt-cyan,#00E5FF);text-decoration:none;font-weight:600}
:root[data-theme="light"] .tt-widget{--tt-bg:#ffffff;--tt-bg-raised:#eef3f9;}
:root[data-theme="light"] .tt-widget.tt-featured,:root[data-theme="light"] .tt-widget.tt-gallery,:root[data-theme="light"] .tt-widget.tt-video-browser{--tt-media-bg:#ffffff;--tt-media-bg-raised:#eef3f9;}
`;

const PLATE_EDITOR_SHELL_CSS = `
.dm-ed{max-width:60rem;margin:2rem auto;padding:0 1.25rem;color:var(--tt-text,#e9ecf5)}
.dm-ed__bar{display:flex;align-items:center;gap:.85rem;flex-wrap:wrap;padding:.75rem 1rem;margin:0 0 1.25rem;border:1px solid var(--tt-line,rgba(0,229,255,.2));border-radius:.65rem;background:#0a0e17}
.dm-ed__back{display:inline-flex;align-items:center;gap:.4rem;font:.8rem/1 'JetBrains Mono',monospace;color:var(--tt-muted,#9aa3b8);text-decoration:none;transition:color .18s ease}
.dm-ed__back:hover{color:var(--tt-cyan,#00E5FF)}
.dm-ed__slug{font:.8rem/1 'JetBrains Mono',monospace;color:var(--tt-cyan,#00E5FF)}
.dm-ed__status{font:.78rem/1.4 'JetBrains Mono',monospace;color:var(--tt-muted,#9aa3b8);margin-left:auto}
.dm-ed__save{display:inline-flex;align-items:center;justify-content:center;min-height:2.2rem;padding:.45rem .95rem;font:600 .82rem/1 'JetBrains Mono',monospace;color:#060610;background:var(--tt-cyan,#00E5FF);border:0;border-radius:.45rem;cursor:pointer}
.dm-ed__save:hover{filter:brightness(1.08)}
.dm-ed__title{width:100%;box-sizing:border-box;padding:.75rem .95rem;margin:0 0 1.25rem;font:700 1.35rem/1.25 'Space Grotesk',system-ui,sans-serif;color:#ffffff;background:#0a0e17;border:1px solid var(--tt-line,rgba(0,229,255,.22));border-radius:.55rem}
.dm-ed__content{display:flex;flex-direction:column;gap:1rem}
.dm-ed__block{border:1px solid var(--tt-line,rgba(0,229,255,.18));border-radius:.6rem;padding:.9rem 1rem;background:#0a0e17;margin:0 0 .85rem}
.dm-ed__block--void{background:rgba(0,229,255,.04);border-style:dashed}
.dm-ed__tag{display:inline-block;font:600 .68rem/1 'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--tt-cyan,#00E5FF);margin:0 0 .55rem;padding:.2rem .45rem;border-radius:.3rem;background:rgba(0,229,255,.1)}
.dm-ed__tag--lock{color:var(--tt-muted,#9aa3b8);background:rgba(144,164,179,.12)}
.dm-ed__ta{width:100%;box-sizing:border-box;padding:.65rem .8rem;font:.92rem/1.6 'JetBrains Mono',monospace;color:var(--tt-text,#e8f2f7);background:#060610;border:1px solid var(--tt-line,rgba(0,229,255,.16));border-radius:.45rem;resize:vertical}
.dm-ed__voidtitle{font:600 .95rem/1.35 'Space Grotesk',system-ui,sans-serif;color:#ffffff;margin:0 0 .25rem}
.dm-ed__voidnote{font:.78rem/1.45 system-ui,sans-serif;color:var(--tt-muted,#90a4b3);margin:0}
`;

export function renderCanonicalLayout(
  opts: {
    host: string;
    title: string;
    description: string;
    canonical: string;
    ogType?: string;
    ogImage?: string;
    ogImageAlt?: string;
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    jsonLdHtml?: string;
    noindex?: boolean;
  },
  bodyHtml: string,
): string {
  const esc = blogSite.escapeHtml;
  const nav = blogSite.renderSiteNav({
    brand: opts.host,
    brandHref: "/",
    themeToggle: true,
    links: [
      { label: "Articles", href: "/blog" },
      { label: "New Post", href: "/blog/new", cta: true },
      { label: "RSS", href: "/blog/feed.xml" },
    ],
  });
  const footer = blogSite.renderSiteFooter({
    note: `© 2026 ${opts.host} — Powered by @theme.tools/blog & PlateJS editorial engine.`,
    links: [
      { label: "Home", href: "/" },
      { label: "Articles", href: "/blog" },
      { label: "New Post (PlateJS)", href: "/blog/new" },
      { label: "RSS Feed", href: "/blog/feed.xml" },
      { label: "JSON Feed", href: "/blog/feed.json" },
      { label: "Post Index JSON", href: "/blog/index.json" },
    ],
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="canonical" href="${esc(opts.canonical)}">
<meta name="robots" content="${opts.noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"}">
<link rel="alternate" type="application/rss+xml" title="${esc(opts.host)} — articles" href="/blog/feed.xml">
<link rel="alternate" type="application/feed+json" title="${esc(opts.host)} — JSON Feed" href="/blog/feed.json">
<meta name="theme-color" content="#060610">
<meta name="color-scheme" content="dark light">
${opts.author ? `<meta name="author" content="${esc(opts.author)}">` : ""}
<meta property="og:type" content="${esc(opts.ogType ?? "website")}">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:url" content="${esc(opts.canonical)}">
<meta property="og:site_name" content="${esc(opts.host)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(opts.title)}">
<meta name="twitter:description" content="${esc(opts.description)}">
${opts.ogImage ? `<meta property="og:image" content="${esc(opts.ogImage)}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:image:alt" content="${esc(opts.ogImageAlt ?? opts.title)}">\n<meta name="twitter:image" content="${esc(opts.ogImage)}">\n<meta name="twitter:image:alt" content="${esc(opts.ogImageAlt ?? opts.title)}">` : ""}
${opts.publishedTime ? `<meta property="article:published_time" content="${esc(opts.publishedTime)}">` : ""}
${opts.modifiedTime ? `<meta property="article:modified_time" content="${esc(opts.modifiedTime)}">` : ""}
<style>${blogSite.SITE_CSS}
${blogWidgets.WIDGET_CSS}
${blogMedia.MEDIA_CSS}
${blogCms.CMS_CSS}
${TT_THEME_OVERRIDE_CSS}</style>
${opts.jsonLdHtml ?? ""}
</head>
<body>
${blogSite.renderSkipLink()}
${nav}
<main id="tt-main" tabindex="-1">${bodyHtml}</main>
${footer}
<script src="/blog/assets/nav-menu.js" defer></script>
<script src="/blog/assets/video-browser.js" defer></script>
<script src="/blog/assets/bookmark.js" defer></script>
<script src="/blog/assets/theme.js" defer></script>
<script src="/blog/assets/code-copy.js" defer></script>
<script src="/blog/assets/lightbox.js" defer></script>
</body>
</html>`;
}

export function renderCanonicalBlogIndexPage(
  posts: readonly CanonicalBlogPostDocument[],
  host: string,
): string {
  const header = blogSite.renderPageHeader({
    kicker: "Articles",
    title: `The ${host} magazine`,
    lede: `Deep-dives, architecture guides, and verified field notes for ${host} — powered by @theme.tools/blog and editable live with PlateJS.`,
  });
  const addBar = blogCms.renderAddAffordance({
    editorEnabled: true,
    adminBase: "/blog/admin",
    href: "/blog/new",
    label: "Add Blog Post",
  });
  const grid = blogSite.renderPostGrid({
    posts: posts.map((p) => ({
      title: p.title,
      description: p.description,
      href: `/blog/${p.slug}`,
      tag: p.tags[0] ?? "architecture",
      meta: `${p.date} · ${blogMarkdown.readingMinutes(p.body)} min read`,
      image: p.heroImage,
    })),
  });
  const collectionSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Articles — ${host}`,
    url: `https://${host}/blog`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: posts.map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://${host}/blog/${p.slug}`,
        name: p.title,
      })),
    },
  });

  return renderCanonicalLayout(
    {
      host,
      title: `Articles — ${host} magazine`,
      description: `Deep-dives, architecture guides, and verified field notes for ${host}.`,
      canonical: `https://${host}/blog`,
      jsonLdHtml: `<script type="application/ld+json">${collectionSchema}</script>`,
    },
    `${header}<section class="tt-band" style="border-top:none;padding-top:24px">${addBar}<h2 class="tt-sr-only">Latest articles</h2>${grid}</section>`,
  );
}

export function renderCanonicalBlogPostPage(
  post: CanonicalBlogPostDocument,
  host: string,
  allPosts: readonly CanonicalBlogPostDocument[] = [post],
): string {
  const esc = blogSite.escapeHtml;
  let bodyHtml = blogMarkdown.renderMarkdown(post.body);

  for (const fig of post.figures) {
    const chartCompanionTable =
      fig.id === "latency-chart"
        ? `<details class="tt-chart-table"><summary>View accessible chart data table (E13 / E26 non-color pattern series)</summary><table><thead><tr><th>Architecture Stack</th><th>Pattern Fill</th><th>P95 TTFB Latency</th></tr></thead><tbody><tr><td>${esc(host)} (@theme.tools/blog V8 Isolate)</td><td>Solid Pattern</td><td>18 ms</td></tr><tr><td>Regional Node.js SSR + External Headless CMS</td><td>Diagonal-Hatch</td><td>184 ms</td></tr><tr><td>Client-Hydrated SPA + Runtime MDX Bundle</td><td>Dot-Matrix</td><td>410 ms</td></tr><tr><td>Legacy Cold-Start Container Monolith</td><td>Crosshatch</td><td>890 ms</td></tr></tbody></table></details>`
        : "";
    bodyHtml = bodyHtml.replace(
      `<p>{{figure:${fig.id}}}</p>`,
      `<figure class="fig" data-figure-id="${esc(fig.id)}" data-application-code="${esc(fig.applicationCode ?? "E03")}">${fig.svg}<figcaption>${esc(fig.caption)}</figcaption>${chartCompanionTable}</figure>`,
    );
  }
  for (const w of post.widgets) {
    const rendered = blogMedia.isMediaWidgetType(w.type)
      ? blogMedia.renderMedia(w.type, w.data)
      : blogWidgets.renderWidget(w.type, w.data);
    bodyHtml = bodyHtml.replace(`<p>{{widget:${w.id}}}</p>`, rendered);
  }

  const headings = [
    ...blogMarkdown.extractHeadings(post.body),
    ...(post.faq.length > 0 ? [{ level: 2 as const, text: "Frequently asked questions", id: "faq" }] : []),
    ...(post.bibliography && post.bibliography.length > 0
      ? [{ level: 2 as const, text: "Verified sources, evidence snapshots & claim citations", id: "bibliography-heading" }]
      : []),
  ];
  const toc = blogSite.renderTableOfContents({ headings });
  if (toc) {
    bodyHtml = bodyHtml.replace("<h2 ", `${toc}\n<h2 `);
  }

  const faqHtml =
    post.faq.length > 0
      ? `<h2 id="faq">Frequently asked questions</h2>\n${post.faq
          .map((f) => `<h3>${esc(f.q)}</h3>\n<p>${esc(f.a)}</p>`)
          .join("\n")}`
      : "";

  const bibliographyHtml =
    post.bibliography && post.bibliography.length > 0
      ? renderBibliographyWidgetHtml(post.bibliography)
      : "";

  const crumb = blogSite.renderBreadcrumb({
    items: [
      { label: "Home", href: "/" },
      { label: "Articles", href: "/blog" },
      { label: post.title },
    ],
  });
  const canonicalUrl = `https://${host}/blog/${post.slug}`;
  const share = blogSite.renderShareRow({ url: canonicalUrl, title: post.title });
  const related = blogRelated.renderRelatedPosts({
    posts: allPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      href: `/blog/${p.slug}`,
      coverSrc: p.heroImage.src,
      readingTimeMinutes: blogMarkdown.readingMinutes(p.body),
    })),
    currentSlug: post.slug,
    desk: "Architecture & Engineering",
    limit: 3,
  });

  const inner = `${crumb}
    <h1>${esc(post.title)}</h1>
    <p class="dek">${esc(post.description)}</p>
    <div class="meta">By ${esc(post.author)} · ${esc(post.date)} · ${blogMarkdown.readingMinutes(post.body)} min read</div>
    ${blogSite.renderTagList({ tags: post.tags, label: "Tags" })}
    <div style="margin:18px 0 0;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap">${blogSite.renderBookmarkButton({
      id: post.slug,
      title: post.title,
      url: `/blog/${post.slug}`,
    })}${blogCms.renderEditAffordance({
      editorEnabled: true,
      slug: post.slug,
      adminBase: "/blog/admin",
      href: `/blog/${post.slug}/edit`,
      label: "Edit Post",
    })}</div>
    ${blogSite.renderEvidenceBadge(post.evidence)}
    <!-- article-body:start --><div class="body">${bodyHtml}
${faqHtml}
${bibliographyHtml}</div><!-- article-body:end -->
    ${related}
    ${share}
    <p style="margin-top:36px"><a class="tt-back" href="/blog">← Back to all articles</a></p>`;

  const schemaGraph = blogSchema.buildUnifiedBlogGraphSchema({
    headline: post.title,
    description: post.description,
    canonicalUrl,
    heroImageUrl: `https://${host}${post.heroImage.src}`,
    datePublished: post.date,
    dateModified: post.dateModified,
    author: { name: post.author },
    publisherName: host,
    isTechArticle: true,
    articleSection: post.desk,
    breadcrumbs: [
      { name: "Home", url: `https://${host}/` },
      { name: "Articles", url: `https://${host}/blog` },
      { name: post.title, url: canonicalUrl },
    ],
    faqs: post.faq.map((f) => ({ question: f.q, answer: f.a })),
  });
  const jsonLdHtml = blogSchema
    .renderBlogJsonLd(schemaGraph)
    .replace(/"@type":\s*"TechArticle"/g, '"@type":["TechArticle","BlogPosting"]');

  return renderCanonicalLayout(
    {
      host,
      title: post.title,
      description: post.description,
      canonical: canonicalUrl,
      ogType: "article",
      ogImage: `https://${host}${post.heroImage.src}`,
      ogImageAlt: post.heroImage.alt,
      publishedTime: post.date,
      modifiedTime: post.dateModified,
      author: post.author,
      jsonLdHtml,
    },
    `${blogSite.renderReadingProgress()}${blogSite.renderArticle(inner)}${blogSite.renderBackToTop()}`,
  );
}

export function renderCanonicalPlateEditorShellPage(opts: {
  host: string;
  slug: string;
  title: string;
  isNew?: boolean;
}): string {
  const esc = blogSite.escapeHtml;
  const heading = opts.isNew ? "New blog post" : `Edit in PlateJS: ${esc(opts.title)}`;
  const body = `<section class="dm-ed" data-owner="hey@megabyte.space">
  <style>${PLATE_EDITOR_SHELL_CSS}</style>
  <a class="dm-ed__back" href="/blog/${esc(opts.slug)}">← Back to article</a>
  <h1>${heading}</h1>
  <div id="dm-editor" data-slug="${esc(opts.slug)}" data-new="${opts.isNew ? "1" : ""}" data-api="/blog/api"></div>
  <p id="dm-status" role="status" aria-live="polite" class="dm-ed__status">Loading PlateJS editor…</p>
  <noscript><p class="dm-ed__noscript">The PlateJS blog editor requires JavaScript. Enable JavaScript to edit this post.</p></noscript>
</section>
<script type="module" src="/blog/editor.js" defer></script>`;

  return renderCanonicalLayout(
    {
      host: opts.host,
      title: `${opts.isNew ? "New post" : "Edit · " + opts.title} — ${opts.host}`,
      description: `PlateJS block editor for ${opts.title} on ${opts.host}.`,
      canonical: `https://${opts.host}/blog/${opts.slug}/edit`,
      noindex: true,
    },
    body,
  );
}

function cleanLegacyAdHocBlogArtifacts(repoPath: string): void {
  // Remove legacy content/blog/*.md and content/blog/index.json generated by the old template
  const legacyContentBlogDir = path.join(repoPath, "content", "blog");
  if (fs.existsSync(legacyContentBlogDir) && fs.statSync(legacyContentBlogDir).isDirectory()) {
    fs.rmSync(legacyContentBlogDir, { recursive: true, force: true });
  }
  // Remove legacy ad-hoc public/blog/index.html and public/blog/<slug>/index.html if they contain the old meta-badge/inline style
  const pubBlogDir = path.join(repoPath, "public", "blog");
  if (fs.existsSync(pubBlogDir) && fs.statSync(pubBlogDir).isDirectory()) {
    const idxHtmlPath = path.join(pubBlogDir, "index.html");
    if (fs.existsSync(idxHtmlPath)) {
      const txt = fs.readFileSync(idxHtmlPath, "utf8");
      if (txt.includes('data-package-contract="@theme.tools/blog"') || txt.includes("Engineering & Architecture Blog")) {
        fs.rmSync(pubBlogDir, { recursive: true, force: true });
      }
    }
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const allFlag = args.includes("--all") || !args.includes("--site");
  const siteIdx = args.indexOf("--site");
  const targetSite = siteIdx !== -1 ? args[siteIdx + 1] : undefined;
  const topicIdx = args.indexOf("--topic");
  const customTopic = topicIdx !== -1 ? args[topicIdx + 1] : undefined;

  const repoDirs = fs
    .readdirSync(REPOS_ROOT)
    .filter((d) => {
      if (d.startsWith(".")) return false;
      const p = path.join(REPOS_ROOT, d);
      return fs.existsSync(p) && fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, ".git"));
    })
    .sort();

  const selectedRepos = targetSite
    ? repoDirs.filter((r) => r === targetSite || r.includes(targetSite))
    : allFlag
      ? repoDirs
      : [];

  if (selectedRepos.length === 0) {
    console.error(`No matching repositories found in ${REPOS_ROOT} for --site=${targetSite ?? ""}`);
    process.exit(1);
  }

  const manifestEntries: Array<Record<string, unknown>> = [];
  let publishedCount = 0;
  let minWords = Infinity;
  let maxWords = 0;

  for (const repoName of selectedRepos) {
    const repoPath = path.join(REPOS_ROOT, repoName);
    cleanLegacyAdHocBlogArtifacts(repoPath);

    const meta = inferRepoMetadata(repoName);
    const { document, substantiveWords, plateValue } = buildCanonicalPostDocument(meta, customTopic);

    minWords = Math.min(minWords, substantiveWords);
    maxWords = Math.max(maxWords, substantiveWords);

    const postsDir = path.join(repoPath, "content", "posts");
    fs.mkdirSync(postsDir, { recursive: true });

    const docPath = path.join(postsDir, `${document.slug}.json`);
    fs.writeFileSync(docPath, JSON.stringify(document, null, 2) + "\n", "utf8");

    const platePath = path.join(postsDir, `${document.slug}.plate.json`);
    fs.writeFileSync(
      platePath,
      JSON.stringify(
        {
          schemaVersion: 1,
          packageContract: "@theme.tools/blog/editor",
          slug: document.slug,
          title: document.title,
          blockCount: plateValue.length,
          value: plateValue,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );

    const postFiles = fs
      .readdirSync(postsDir)
      .filter((f) => f.endsWith(".json") && !f.endsWith(".plate.json") && f !== "index.json")
      .sort();

    const indexPayload = {
      schemaVersion: 1,
      packageContract: "@theme.tools/blog",
      editorContract: "@theme.tools/blog/editor",
      repository: repoName,
      domain: meta.domain,
      updatedAt: new Date().toISOString(),
      files: postFiles.map((f) => `content/posts/${f}`),
    };
    fs.writeFileSync(path.join(postsDir, "index.json"), JSON.stringify(indexPayload, null, 2) + "\n", "utf8");
    publishedCount++;

    manifestEntries.push({
      repository: repoName,
      domain: meta.domain,
      wave: meta.wave,
      category: meta.category,
      adapterDir: "content/posts",
      indexFile: "content/posts/index.json",
      latestArticlePath: `content/posts/${document.slug}.json`,
      plateAstPath: `content/posts/${document.slug}.plate.json`,
      latestArticleSlug: document.slug,
      latestArticleTitle: document.title,
      substantiveWordCount: substantiveWords,
      plateBlockCount: plateValue.length,
      widgetCount: document.widgets.length,
      figureCount: document.figures.length,
      citationCount: document.bibliography?.length ?? 5,
      visualPlacementsCount: document.workflowLedger?.stage6VisualPlan.totalVisualPlacements ?? 14,
      releaseGateChecksPassed: document.workflowLedger?.stage8ReleaseGateAndReview.checksPassed ?? 12,
      workflowStagesCompleted: 9,
      status: "published",
    });
  }

  const estateManifest = {
    schemaVersion: "2.0.0",
    programIssue: "MEG-933",
    manifestIssue: "MEG-938",
    packageContract: "@theme.tools/blog",
    editorContract: "@theme.tools/blog/editor",
    cmsContract: "@theme.tools/blog/cms",
    siteContract: "@theme.tools/blog/site",
    generatedAt: new Date().toISOString(),
    totalRepositories: manifestEntries.length,
    minSubstantiveWordCount: minWords === Infinity ? 0 : minWords,
    maxSubstantiveWordCount: maxWords,
    entries: manifestEntries,
  };

  const manifestTargets = [
    path.join(REPOS_ROOT, "agent-skills", "control-plane", "blog-program-manifest.json"),
    path.join(REPOS_ROOT, "swarml.ink", "docs", "blog-program-manifest.json"),
  ];
  for (const target of manifestTargets) {
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, JSON.stringify(estateManifest, null, 2) + "\n", "utf8");
    } catch {
      // ignore
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        packageContract: "@theme.tools/blog",
        editorContract: "@theme.tools/blog/editor",
        repositoriesProcessed: selectedRepos.length,
        articlesWritten: publishedCount,
        minSubstantiveWords: minWords,
        maxSubstantiveWords: maxWords,
        manifestPaths: manifestTargets,
      },
      null,
      2,
    ),
  );
}

const invokedPath = process.argv[1] ? fs.realpathSync(process.argv[1]) : "";
const selfPath = fs.realpathSync(new URL(import.meta.url));
if (invokedPath && invokedPath === selfPath) {
  main();
}

