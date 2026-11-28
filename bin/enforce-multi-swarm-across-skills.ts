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
const TRIAD_BULLET_MARKER = '**Reuse review**';
const LEGACY_TRIAD_BULLET_MARKER = '**End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**';
const DELIVERY_CLOSURE_MARKER = '**Concurrent End-of-Prompt Delivery Closure**';
const AGENT_SECTION_HEADING = '## 8. End-of-Round Parallel Meaning & Preference Triad Extraction & Multi-Swarm Mandate';

const DISPATCH_MARKER = '**DeepSeek-first parallel dispatch**';
const DISPATCH_DIRECTIVE = `- ${DISPATCH_MARKER} At intake and after each dependency clears, dispatch independent OpenSpec changes concurrently whenever doing so reduces time to verified delivery. Delegate suitable whole OpenSpec changes to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.`;

const DOMAIN_GUIDANCE: Record<string, string> = {
  '01-operating-system':
    'Hydrate material requests, audit relevant product gaps, and route approved outcomes through governed OpenSpec execution.',
  '02-goal-and-brief':
    'Research each material outcome and its relevant alternatives. Give the architect evidence-backed briefs and candidate acceptance criteria.',
  '04-preference-and-memory':
    'Preserve durable operator preferences across parallel worktree swarms: default to autonomous completion on `main`, full plugin catalog fan-out, and aggressive `opencode` (DeepSeek via LiteLLM) offloading to protect finite `claude`/`codex`/`gemini` subscription windows.',
  '05-architecture-and-stack':
    'Have the assigned architect freeze Hono RPC, Drizzle, Zod, and shared adapter contracts. Dispatch independent OpenSpec changes after dependency and ownership checks.',
  '06-build-and-slice-loop':
    'For material product gaps, define bounded OpenSpec changes with end-to-end acceptance. Execute independent changes in isolated worktrees through approved host adapters.',
  '07-quality-and-verification':
    'Keep tests with the change owner. Verify applicable responsive and interaction states using the existing browser rail and escalate consequential findings for independent review.',
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
    'Research improvement opportunities during implementation. Preserve concrete findings in OpenSpec and execute admitted follow-ups in the same run.',
  '15-site-generation':
    'Decompose multi-page site generation, pSEO route matrices, local-SEO schemas, and `@theme.tools/*` block composition into disjoint OpenSpec DAG shards executed concurrently by `opencode` (DeepSeek) worker swarms.',
  '16-cinematic-website-prime-directive':
    'Translate cinematic requirements into scoped acceptance criteria for responsive layouts, interaction states, and browser checks.',
  '21-app-foundation':
    'Audit and scaffold foundational SaaS pillars (Auth/RBAC, multi-tab Settings, Workspaces, Plugin Registry, `@theme.tools/*` thin-shell config) on pass 1 by fanning out independent foundation modules to parallel `opencode` (DeepSeek) workers.',
  '22-visual-experience':
    'Enforce 16-state OKLCH visual completeness and styled pill/chip rendering (`string[]` never comma-joined) across all views in parallel using `opencode` (DeepSeek) UI shards verified by `gemini`/`claude` visual QA.',
  '23-content-seo':
    'Generate per-route metadata, JSON-LD graphs, `sitemap.xml`, `llms.txt`, and research-backed editorial content in parallel waves using `opencode` (DeepSeek) workers.',
  '24-functional':
    'Group plugin, settings, and workflow work into independently verifiable OpenSpec changes with end-to-end owners.',
  '25-quality-performance':
    'Include applicable performance budgets and responsive browser coverage in each change contract. The implementation owner runs those checks.',
  '26-platform-delivery':
    'Automate `main`-branch folding, `wrangler.toml` binding provisioning, custom domain connection, Cloudflare production deployment, and CDN cache purging at the conclusion of every multi-swarm build.',
  '27-trust-compliance':
    'Verify RBAC, tenant isolation, CSP Level 3, Trusted Types, GDPR/CCPA data export/deletion in Settings, and secret hygiene via adversarial `codex` security review over `opencode` (DeepSeek) implementation shards.',
  '28-cf-integrations-reference':
    'Provision Cloudflare Workers, D1, KV, R2, Queues, Workflows, AI, and Browser Rendering (`[browser]` / `@cloudflare/playwright`) bindings in parallel worktrees with deterministic local port leasing.',
  'openclaw-integration':
    'Route OpenClaw work through Paperclip governance and governed OpenSpec execution, respecting provider capability and approved worker capacity.',
};

const TRIAD_BULLET =
  `- ${TRIAD_BULLET_MARKER}: Review reuse during implementation under \`control-plane/RUNTIME.md\`. Capture cited proposals for application code in \`theme.tools\`, host configuration in \`install.doctor\`, and agent guidance in \`agent-skills\`. Submit authorized findings to same-run OpenSpec admission.`;

const DELIVERY_CLOSURE_BULLET =
  `- ${DELIVERY_CLOSURE_MARKER}: Run documentation/comment reconciliation and bounded \`theme.tools\`, \`install.doctor\`, and \`agent-skills\` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to \`main\`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.`;

function findSkillFiles(rootDir: string): string[] {
  const results: string[] = [];
  if (!existsSync(rootDir)) return results;

  for (const entry of readdirSync(rootDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === '.git') continue;
    const directSkill = join(rootDir, entry.name, 'SKILL.md');
    if (existsSync(directSkill) && statSync(directSkill).isFile()) {
      results.push(directSkill);
    }
    if (entry.name === '.agents') {
      results.push(...findSkillFiles(join(rootDir, entry.name)));
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

const WHOLE_CHANGE_DISPATCH = '- **Whole-change dispatch**. Apply `rules/openspec-change-ownership.md` and `rules/agent-provider-policy.md`. Assign each OpenSpec change one owner through verification. Route suitable bounded changes to OpenCode with DeepSeek through LiteLLM.';

function buildSkillSection(skillDirName: string): string {
  const specific = DOMAIN_GUIDANCE[skillDirName];

  return [
    '',
    SECTION_HEADING,
    '',
    ...(specific ? [`- **Domain Swarm Directive**: ${specific}`] : []),
    WHOLE_CHANGE_DISPATCH,
    '- **Architecture and verification**: Route material decisions through `rules/evidence-gated-autonomous-orchestration.md`. Its conference and risk gates govern provider selection and independence.',
    TRIAD_BULLET,
    DISPATCH_DIRECTIVE,
    DELIVERY_CLOSURE_BULLET,
    '',
  ].join('\n');
}

function buildAgentSection(): string {
  return [
    '',
    '---',
    '',
    AGENT_SECTION_HEADING,
    '',
    WHOLE_CHANGE_DISPATCH,
    TRIAD_BULLET,
    DISPATCH_DIRECTIVE,
    DELIVERY_CLOSURE_BULLET,
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
    } else {
      const missingDirectives = [
        !content.includes(DISPATCH_MARKER) ? DISPATCH_DIRECTIVE : '',
        !content.includes(TRIAD_BULLET_MARKER) && !content.includes(LEGACY_TRIAD_BULLET_MARKER) ? TRIAD_BULLET : '',
        !content.includes(DELIVERY_CLOSURE_MARKER) ? DELIVERY_CLOSURE_BULLET : '',
      ].filter(Boolean);
      if (missingDirectives.length) {
        const nextContent = `${content.replace(/\s+$/, '')}\n${missingDirectives.join('\n')}\n`;
        writeFileSync(filePath, nextContent, 'utf8');
        skillsUpdated += 1;
      }
    }
  }

  for (const agentPath of findAgentFiles(rootDir)) {
    const content = readFileSync(agentPath, 'utf8');
    if (!content.includes(AGENT_SECTION_HEADING)) {
      const nextContent = `${content.replace(/\s+$/, '')}\n${buildAgentSection()}`;
      writeFileSync(agentPath, nextContent, 'utf8');
      agentsUpdated += 1;
    } else {
      const missingDirectives = [
        !content.includes(DISPATCH_MARKER) ? DISPATCH_DIRECTIVE : '',
        !content.includes(DELIVERY_CLOSURE_MARKER) ? DELIVERY_CLOSURE_BULLET : '',
      ].filter(Boolean);
      if (missingDirectives.length) {
        const nextContent = `${content.replace(/\s+$/, '')}\n${missingDirectives.join('\n')}\n`;
        writeFileSync(agentPath, nextContent, 'utf8');
        agentsUpdated += 1;
      }
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
