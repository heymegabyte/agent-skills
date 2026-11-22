#!/usr/bin/env node
/**
 * Enforces:
 * 1. Multi-Swarm Parallel Orchestration (Claude + Codex + Gemini) & OpenCode (DeepSeek) Swarm Offload
 * 2. End-of-Round Parallel Meaning & Preference Triad Extraction (`agent-skills` for AI skills under
 *    the Minimum-Prompt Ecosystem Completeness Assumption, `theme.tools` for site code, and
 *    `install.doctor` for system code)
 * across every single SKILL.md file AND every single Agent-Specific Master Prompt (`agents/*.md`)
 * in the repository and live ~/.agentskills plugin checkout.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SECTION_HEADING = '## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate';
const TRIAD_BULLET_MARKER = '**End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**';
const AGENT_SECTION_HEADING = '## 8. End-of-Round Parallel Meaning & Preference Triad Extraction & Multi-Swarm Mandate';

const DOMAIN_GUIDANCE: Record<string, string> = {
  '01-operating-system':
    'Intercept every prompt via `bin/prompt-hydrator.ts`, audit missing product surfaces (e.g., `Settings`, `Plugin Catalogs`, `@theme.tools/*`), convene a right-sized SCRUM deliberation quorum (`bin/scrum-deliberation-quorum.ts`) across `claude`, `codex`, and `gemini`, lock OpenSpec DAG contracts, and offload 80%+ of throughput-safe volume to parallel `opencode` (DeepSeek) worktree swarms.',
  '02-goal-and-brief':
    'Hydrate every brief with parallel web research and competitor tear-downs across all 10 product categories (`C01`–`C10`), convene only the required specialist agents in a SCRUM synthesis meeting, and compile parallel OpenSpec task DAGs for `opencode` (DeepSeek) swarm execution.',
  '04-preference-and-memory':
    'Preserve durable operator preferences across parallel worktree swarms: default to autonomous completion on `main`, full plugin catalog fan-out, and aggressive `opencode` (DeepSeek via LiteLLM) offloading to protect finite `claude`/`codex`/`gemini` subscription windows.',
  '05-architecture-and-stack':
    'Have the Frontier Architect (`claude` / `codex` / `gemini` — never `opencode`) lock Hono RPC routes, Drizzle schemas, Zod contracts, and OpenSpec DAGs (`task-graph.json`), then fan out independent service, migration, and `@theme.tools/*` adapter shards to parallel `opencode` (DeepSeek) worktree swarms.',
  '06-build-and-slice-loop':
    'Execute vertical slices and full 12-plugin starter catalogs in parallel worktrees using `bin/multi-swarm-orchestrator.ts`. Auto-complete audited gaps (such as multi-tab `Settings`, `Notifications`, and `Billing`) by offloading bounded slice implementation to parallel `opencode` (DeepSeek) workers.',
  '07-quality-and-verification':
    'Fan out test generation across parallel `opencode` (DeepSeek) swarms to achieve **100% unit test coverage** and **near-100% E2E coverage** executed in parallel via **Cloudflare Browser Run** (`@cloudflare/playwright` bound to `env.MYBROWSER` / `BROWSER`) across all 6 breakpoints and 16 OKLCH visual states, gated by cross-model `codex`/`gemini` adversarial review.',
  '08-deploy-and-runtime-verification':
    'Run pre-deploy contract gates in parallel, fold verified swarm worktrees cleanly onto `main`, provision Cloudflare Worker bindings (`wrangler.toml`) and custom domain SSL routing, deploy to production, purge the Cloudflare CDN cache, and run parallel post-deploy Browser Run smoke probes.',
  '09-brand-and-content-system':
    'Parallelize competitor copy research, technical documentation updates, inline JSDoc/TSDoc enrichment, and multi-article `@theme.tools/blog` generation across `opencode` (DeepSeek) content swarms after `claude`/`gemini` locks editorial voice and E-E-A-T citations.',
  '10-experience-and-design-system':
    'Have `claude`/`gemini` lock the OKLCH token palette (`#060610` canvas, `#00E5FF` accent) and 16-state interaction contracts, then fan out component state matrices, Storybook stories, and `@theme.tools/ui` thin-shell bindings across parallel `opencode` (DeepSeek) swarms.',
  '11-motion-and-interaction-system':
    'Standardize `0.333s` (`cubic-bezier(0.22, 1, 0.36, 1)`) choreography and reduced-motion fallbacks in shared `@theme.tools/ui` primitives, offloading per-route transition wiring and INP (`<=100ms`) regression specs to parallel `opencode` (DeepSeek) workers.',
  '12-media-orchestration':
    'Fan out bespoke SVG technical diagram generation, AVIF/WebP asset optimization, dynamic OG card endpoints, and HyperFrames/Remotion scene composition across parallel `opencode` (DeepSeek) and free-tier media worker swarms.',
  '13-observability-and-growth':
    'Wire all 7 observability rails (PostHog, GA4, GTM, Sentry, Cloudflare Web Analytics, OTLP, and Langfuse `2500ms` fail-open tracing) and Stripe/Link billing webhooks in parallel across `opencode` (DeepSeek) worktree shards.',
  '14-independent-idea-engine':
    'Cycle through every categorical aspect of the product with heavy web research until zero recommendable ideas remain, then implement 100% of recommendable ideas in the same turn via massive parallel `opencode` (DeepSeek) swarms rather than presenting passive recommendation lists.',
  '15-site-generation':
    'Decompose multi-page site generation, pSEO route matrices, local-SEO schemas, and `@theme.tools/*` block composition into disjoint OpenSpec DAG shards executed concurrently by `opencode` (DeepSeek) worker swarms.',
  '16-cinematic-website-prime-directive':
    'Combine tri-frontier architectural direction (`claude` + `codex` + `gemini` SCRUM quorum) with massive `opencode` (DeepSeek) parallel worktree execution so all 100+ cinematic rules, 6 breakpoints, 16 states, and Cloudflare Browser Run E2E checks finish in a single autonomous pass.',
  '21-app-foundation':
    'Audit and scaffold foundational SaaS pillars (Auth/RBAC, multi-tab Settings, Workspaces, Plugin Registry, `@theme.tools/*` thin-shell config) on pass 1 by fanning out independent foundation modules to parallel `opencode` (DeepSeek) workers.',
  '22-visual-experience':
    'Enforce 16-state OKLCH visual completeness and styled pill/chip rendering (`string[]` never comma-joined) across all views in parallel using `opencode` (DeepSeek) UI shards verified by `gemini`/`claude` visual QA.',
  '23-content-seo':
    'Generate per-route metadata, JSON-LD graphs, `sitemap.xml`, `llms.txt`, and research-backed editorial content in parallel waves using `opencode` (DeepSeek) workers.',
  '24-functional':
    'Decompose functional feature requests into contract-locked OpenSpec DAG nodes, implementing full plugin catalogs, Settings panels, and domain workflows in parallel via `opencode` (DeepSeek) swarms.',
  '25-quality-performance':
    'Enforce 100% unit test coverage, sub-200ms TTFR, and parallel Cloudflare Browser Run (`@cloudflare/playwright`) 6-breakpoint E2E verification using concurrent `opencode` (DeepSeek) test-writer swarms.',
  '26-platform-delivery':
    'Automate `main`-branch folding, `wrangler.toml` binding provisioning, custom domain connection, Cloudflare production deployment, and CDN cache purging at the conclusion of every multi-swarm build.',
  '27-trust-compliance':
    'Verify RBAC, tenant isolation, CSP Level 3, Trusted Types, GDPR/CCPA data export/deletion in Settings, and secret hygiene via adversarial `codex` security review over `opencode` (DeepSeek) implementation shards.',
  '28-cf-integrations-reference':
    'Provision Cloudflare Workers, D1, KV, R2, Queues, Workflows, AI, and Browser Rendering (`[browser]` / `@cloudflare/playwright`) bindings in parallel worktrees with deterministic local port leasing.',
  'openclaw-integration':
    'Coordinate Paperclip governance and OpenClaw 35-agent execution by routing frontier architecture and SCRUM synthesis to `claude`/`codex`/`gemini` while offloading 80%+ of throughput-safe coding and plugin swarms to `opencode` (DeepSeek via LiteLLM).',
};

const TRIAD_BULLET =
  `- ${TRIAD_BULLET_MARKER}: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **\`heymegabyte/agent-skills\`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **\`heymegabyte/theme.tools\`** (for reusable site/app code across the 28 canonical \`@theme.tools/*\` libraries), and **\`heymegabyte/install.doctor\`** (for reusable system/host code).`;

function findSkillFiles(rootDir: string): string[] {
  const results: string[] = [];
  if (!existsSync(rootDir)) return results;

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === '.git') continue;
    const directSkill = join(rootDir, entry.name, 'SKILL.md');
    if (existsSync(directSkill) && statSync(directSkill).isFile()) {
      results.push(directSkill);
    }
    if (entry.name === 'skills') {
      const skillsDir = join(rootDir, 'skills');
      for (const sub of readdirSync(skillsDir, { withFileTypes: true })) {
        if (!sub.isDirectory()) continue;
        const nestedSkill = join(skillsDir, sub.name, 'SKILL.md');
        if (existsSync(nestedSkill) && statSync(nestedSkill).isFile()) {
          results.push(nestedSkill);
        }
      }
    }
  }
  return results.sort();
}

function findAgentFiles(rootDir: string): string[] {
  const agentsDir = join(rootDir, 'agents');
  if (!existsSync(agentsDir)) return [];
  return readdirSync(agentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => join(agentsDir, entry.name))
    .sort();
}

function buildSkillSection(skillDirName: string): string {
  const specific =
    DOMAIN_GUIDANCE[skillDirName] ||
    'Decompose work into contract-locked OpenSpec DAG nodes, convene a right-sized SCRUM quorum (`claude` + `codex` + `gemini`) for key decisions, and offload all throughput-safe implementation, plugin catalogs, unit tests (100% coverage), and parallel Cloudflare Browser Run E2E suites to `opencode` (DeepSeek) swarms.';

  return [
    '',
    SECTION_HEADING,
    '',
    `- **Domain Swarm Directive**: ${specific}`,
    '- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.',
    '- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (`bin/multi-swarm-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.',
    TRIAD_BULLET,
    '',
  ].join('\n');
}

function buildAgentSection(agentFileName: string): string {
  const agentName = agentFileName.replace(/\.md$/, '');
  return [
    '',
    '---',
    '',
    AGENT_SECTION_HEADING,
    '',
    `- **Massive Parallel Swarm Execution (\`${agentName}\`)**: Participate in right-sized collaborative SCRUM deliberation quorums (\`bin/scrum-deliberation-quorum.ts\`) only when your domain is active, and offload all throughput-safe implementation, plugin catalog shards, 100% unit tests, parallel Cloudflare Browser Run (\`@cloudflare/playwright\`) E2E suites, migrations, and documentation to parallel **\`opencode\` (DeepSeek)** worktree swarms (\`bin/multi-swarm-orchestrator.ts\`).`,
    '- **End-of-Round Parallel Triad Meaning & Preference Extraction (`bin/triad-end-of-turn-sync.ts`)**: In parallel with Phase 4 Debrief & Verification at the end of every prompt round, extract any possible meaning, operator preference, architectural insight, reusable site component, or system config from the current agent window and store it concurrently into:',
    '  1. **`heymegabyte/agent-skills` (AI Skills, Rules & Agent Master Prompts)** — updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: always author and refine skills assuming they *should have already been written* so that the operator writes **as few prompts as possible (ideally one)** to finish **as complete a product (or entire multi-repo ecosystem) as possible** by automatically expanding scope and executing via massive parallel agent swarms (`Claude` + `Codex` + `Gemini` + 80%+ `OpenCode` DeepSeek offload).',
    '  2. **`heymegabyte/theme.tools` (Site & Application Code)** — extracting reusable UI components (16 visual states, `0.333s` OKLCH transitions), themes, calculators, workflows, validators, hooks, and plugin adapters into the 28 canonical `@theme.tools/*` libraries so consumer repositories remain thin shells.',
    '  3. **`heymegabyte/install.doctor` (System & Host Code)** — extracting reusable dotfiles, shell environment defaults, lazy CLI shims (`cnf-build-shims`), daemon units, and workstation/server provisioning logic.',
    '',
  ].join('\n');
}

export function enforceAcrossRoot(rootDir: string): {
  skillsUpdated: number;
  agentsUpdated: number;
} {
  let skillsUpdated = 0;
  let agentsUpdated = 0;

  for (const filePath of findSkillFiles(rootDir)) {
    const content = readFileSync(filePath, 'utf8');
    const skillDirName = basename(dirname(filePath));
    if (!content.includes(SECTION_HEADING)) {
      const nextContent = `${content.replace(/\s+$/, '')}\n${buildSkillSection(skillDirName)}`;
      writeFileSync(filePath, nextContent, 'utf8');
      skillsUpdated += 1;
    } else if (!content.includes(TRIAD_BULLET_MARKER)) {
      const nextContent = `${content.replace(/\s+$/, '')}\n${TRIAD_BULLET}\n`;
      writeFileSync(filePath, nextContent, 'utf8');
      skillsUpdated += 1;
    }
  }

  for (const agentPath of findAgentFiles(rootDir)) {
    const content = readFileSync(agentPath, 'utf8');
    if (!content.includes(AGENT_SECTION_HEADING)) {
      const nextContent = `${content.replace(/\s+$/, '')}\n${buildAgentSection(basename(agentPath))}`;
      writeFileSync(agentPath, nextContent, 'utf8');
      agentsUpdated += 1;
    }
  }

  return { skillsUpdated, agentsUpdated };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const roots = [REPO_ROOT];
  const livePluginRoot = resolve(process.env.HOME || '/Users/Apple', '.agentskills');
  if (existsSync(livePluginRoot) && livePluginRoot !== REPO_ROOT) {
    roots.push(livePluginRoot);
  }
  for (const root of roots) {
    const res = enforceAcrossRoot(root);
    console.log(JSON.stringify({ root, ...res }));
  }
}
