---
name: "goal-and-brief"
description: "Establish project thesis before first code. Infer product type from domain/folder/README. Identify users, business model, pSEO strategy, AI-native dev approach. Maintain PROJECT_BRIEF.md as source of truth."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  effort: "medium"
  model: "haiku"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
priority: 2
pack: "website-build"
stage: beta
triggers:
  - "new project"
  - "project brief"
  - "goals"
paths:
  - "org:website_build"
---

# 02 — Goal and Brief

Establish the project thesis and maintain `PROJECT_BRIEF.md` as the source of truth before any code is written.

## Run FIRST on every new project / rebuild

Before code, write `PROJECT_BRIEF.md`. The brief drives every downstream decision (skill 05 stack, skill 06 build, skill 09 brand, skill 16 site mode).

> **One-line website prompt? Hand off after the brief**: `16-cinematic-website-prime-directive` is the prime directive (trumps generic 06-build); `website-build-manifest` is the acceptance index of every gate; `website-build-doctrine` is the Phase -1→8 sequence. Brief → manifest → doctrine → build.

## Org-type inference (drives everything)

Detect from domain + folder name + scraped homepage + Google Places category:

| Pattern | Org type |
|---|---|
| `*.com` w/ pricing page + signup → | **saas** |
| `*.org` w/ donate button + 501(c)(3) → | **nonprofit** |
| Google Places category in {restaurant, salon, medical, legal, fitness, automotive, retail, photography, real-estate, education, financial, pet, wedding} → | **local-business** |
| `*.com` portfolio of links + bio + projects → | **portfolio** |
| `*.gov` / `.gov.uk` / `.ca.gov` → | **government** |
| `*.edu` / `*.ac.uk` → | **edu** |
| `*.church` / parish JSON-LD → | **church** |
| ProductHunt / G2 / Capterra listing → | **saas** |

Output: `_org_type.json` = `{type, confidence, evidence[]}`.

## PROJECT_BRIEF.md (source of truth)

```md
# {Project Name}

## Thesis
One sentence: what this project does + for whom + why now.

## Org type
{saas | nonprofit | local-business | portfolio | edu | gov | church}

## Primary user
- Persona: {role + context}
- Job to be done: {task they're trying to accomplish}
- Success metric: {what "done" looks like for them}

## Business model
- Revenue: {subscription / donation / one-time / B2B / B2C / ads}
- Pricing: {tier list w/ values}
- Margins: {high / medium / low + rationale}

## pSEO strategy (5 types)
- Integration pages (`/integrations/{tool}`) — Y/N
- Comparison (`/compare/{a}-vs-{b}`) — Y/N
- Use-case (`/for/{audience}`) — Y/N
- Template (`/templates/{type}`) — Y/N
- Location (`/{city}-{service}`) — Y/N

## AI-native development approach
- AI-first features: {list}
- Workers AI / Llama 4 Scout for first-pass content
- Opus 4.8 for top-10 conversion polish
- AI vision QA on every visual surface

## Constraints
- Budget
- Timeline
- Compliance (HIPAA / SOC 2 / GDPR / FERPA / ADA)
- Localization needs (`_kernel/standards.md` § ADA + `rules/i18n-by-demographics.md`)

## Decision log
{Every architectural decision + rationale + alternatives considered}
```

## Question discipline

- Before code, scan brief for gaps. Use `AskUserQuestion` ONLY for genuinely unresolvable items (e.g., bilingual-staff confirmation, NAP verification, license number).
- Per `brian-preferences.md`: pick ONE answer when inferable, never offer options.
- Silence = approval.

## What this skill produces

- `PROJECT_BRIEF.md` — committed
- `_org_type.json` — input to skill 05 (stack) + skill 09 (brand) + skill 16 (site mode)
- `_brief_summary.txt` — 100-word digest for downstream agents

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Hydrate every brief with parallel web research and competitor tear-downs across all 10 product categories (`C01`–`C10`), convene only the required specialist agents in a SCRUM synthesis meeting, and compile parallel OpenSpec task DAGs for `opencode` (DeepSeek) swarm execution.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (`bin/multi-swarm-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
