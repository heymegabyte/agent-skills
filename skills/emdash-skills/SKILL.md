---
name: emdash-skills
description: Canonical master index and routing catalog for all 24 Emdash skill categories, 53 fleet skills, 29 Paperclip agents, and 26 local_stdio MCP tool connections.
---

# Emdash Skills — Master Fleet Capability Catalog

Load `CONVENTIONS.md` for stack defaults and `_router.md` for category skill routing.

## Stack Defaults

- **Edge & API**: Cloudflare Workers + Hono (inline handlers for RPC type inference) + Zod validation
- **Frontend**: React 19 + Vite + shadcn/ui (sites) / Angular 22 + Spartan UI (apps), Dark-first (`#060610` bg, `#00E5FF` accent)
- **Data**: Cloudflare D1 / Neon / PostgreSQL 17 + Drizzle ORM
- **Runtime & Scripting**: TypeScript strict (Node 24 native strip-types / `.mjs` / Bun — never Python by default)
- **Fleet Routing (`cr`)**: 4 CLI Harnesses (`claude-1/2/3`, `codex`, `gemini`, `opencode`) + Local GPU Ollama via Claw Router (`cr`) and LiteLLM Gateway (`https://llm.megabyte.space`)

## Canonical Skill Categories (`~/.agentskills/skills/<slug>/SKILL.md`)

1. `operating-system` (`01-operating-system`) — Fleet execution model, Auftragstaktik, verification gates
2. `goal-and-brief` (`02-goal-and-brief`) — OpenSpec brief decomposition, RICE scoring, acceptance criteria
3. `preference-and-memory` (`03-preference-and-memory`) — Persistent memory, conventions, triad extraction
4. `architecture-and-stack` (`04-architecture-and-stack`) — Repository boundaries, Hono/Worker contracts, ADRs
5. `experience-and-design-system` (`05-experience-and-design-system`) — 16-state UI matrix, OKLCH tokens, WCAG AAA
6. `motion-and-interaction-system` (`06-motion-and-interaction-system`) — `0.333s` spring motion physics, micro-interactions
7. `app-foundation` (`07-app-foundation`) — Auth, tenancy, session security, layout shell
8. `functional` (`08-functional`) — End-to-end vertical feature implementation
9. `brand-and-content-system` (`09-brand-and-content-system`) — Editorial voice, typography, brand system
10. `media-orchestration` (`10-media-orchestration`) — HyperFrames 4K programmatic video, audio mastering (`-14 LUFS`)
11. `quality-and-verification` (`11-quality-and-verification`) — Zero-defect verification gates, Playwright 6 breakpoints
12. `observability-and-growth` (`12-observability-and-growth`) — PostHog, Sentry, Langfuse (`2500ms` fail-open), FinOps
13. `platform-delivery` (`13-platform-delivery`) — Cloudflare Workers deploy, CDN cache purge, zero-downtime rollout
14. `cf-integrations-reference` (`14-cf-integrations-reference`) — Cloudflare D1, R2, KV, Queues, Zero Trust Access
15. `site-generation` (`15-site-generation`) — Multi-site generation and `@theme.tools/*` thin-shell composition
16. `independent-idea-engine` (`16-independent-idea-engine`) — Recursive multi-round improvement and convergence loops
17. `build-and-slice-loop` (`17-build-and-slice-loop`) — Iterative micro-task build & slice convergence
18. `tdd-and-verification` (`18-tdd-and-verification`) — Failing test first, deterministic unit/integration/E2E suites
19. `deploy-and-runtime-verification` (`19-deploy-and-runtime-verification`) — Live production HTTP/DOM/SQL proof of life
20. `visual-experience` (`20-visual-experience`) — Visual regression, layout geometry, responsive polish
21. `quality-performance` (`21-quality-performance`) — Sub-50ms TTFR, Core Web Vitals, bundle optimization
22. `trust-compliance` (`22-trust-compliance`) — AppSec, STRIDE threat modeling, secret hygiene, CSP/egress guards
23. `content-seo` (`23-content-seo`) — Technical SEO, Schema.org JSON-LD, GEO, `llms.txt`
24. `release-announcement` (`24-release-announcement`) — Release notes, changelog automation, distribution
25. `blog-publishing` (`skills/blog-publishing`) — 2,000–3,000+ substantive word reference articles (`@theme.tools/blog`)
26. `openclaw-integration` (`openclaw-integration`) — Serene 4-harness OpenClaw + Paperclip + `cr` integration
27. `tri-harness-deepseek-ollama-routing` (`skills/tri-harness-deepseek-ollama-routing`) — DeepSeek & Ollama quota offload

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Decompose work into contract-locked OpenSpec DAG nodes, convene a right-sized SCRUM quorum (`claude` + `codex` + `gemini`) for key decisions, and offload all throughput-safe implementation, plugin catalogs, unit tests (100% coverage), and parallel Cloudflare Browser Run E2E suites to `opencode` (DeepSeek) swarms.
- **Whole-change dispatch**. Apply `rules/openspec-change-ownership.md` and `rules/agent-provider-policy.md`. Assign each OpenSpec change one owner through verification. Route suitable bounded changes to OpenCode with DeepSeek through LiteLLM.
- **Architecture and verification**: Route material decisions through `rules/evidence-gated-autonomous-orchestration.md`. Its conference and risk gates govern provider selection and independence.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: Review reuse during implementation under `control-plane/RUNTIME.md`. Capture cited proposals for application code in `theme.tools`, host configuration in `install.doctor`, and agent guidance in `agent-skills`. Submit authorized findings to same-run OpenSpec admission.
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent work concurrently whenever doing so reduces time to verified delivery. Delegate every suitable task to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
