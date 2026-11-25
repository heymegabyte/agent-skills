---
name: "media-orchestration"
description: "Section-by-section media planning and generation. Image generation (GPT Image 2 primary, built-in fallback), logo/icon generation (Ideogram v3 → favicon set), video generation (Veo 3.1), social preview images (OG 1200x630 + AI search optimization), stock photo curation (Pexels, Pixabay), critique/remix loops (max 3 rounds), asset compression pipeline, and media performance budgets."
metadata:
  version: "2.1.0"
  updated: "2026-05-03"
  context: "fork"
  effort: "high"
  model: "sonnet"
license: "Rutgers"
compatibility:
  claude-code: ">=2.0.0"
  agentskills: ">=1.0.0"
submodules:
  - 30-ideogram-methods.md
  - build-breaking-rules.md
  - compression-pipeline.md
  - image-optimization.md
  - image-profiling.md
  - lightbox-classifier.md
  - media-prompts.md
  - notebooklm-pipeline.md
  - og-image-generation.md
  - social-brand-hex.md
  - technical-diagramming.md
priority: 3
pack: "media"
stage: stable
triggers:
  - "image gen"
  - "dalle"
  - "media"
  - "og image"
paths:
  - "org:website_build"
---

# 12 — Media Orchestration

Generate all site media section-by-section: images (GPT Image 2), logos (Ideogram v3), video (Veo 3.1), OG cards, and compression pipeline.

> **Model migration note (pass-77, 2026-06-09)**: `DALL-E` → **GPT Image 2** (2026-04; 2.5 branded 2026-09 — API id unconfirmed, check current id at integration) + `GPT-4o` → **GPT Image 2 vision**. Per `platform.openai.com/docs/deprecations`.
>
> **Video rail (2026-10-04)**: Sora retired (app 2026-04-26, API 2026-09-24) — **Veo 3.1 is the video rail**. Fallbacks: Kling 3.0 / Runway Gen-4.5.

## Submodules

- **media-prompts** — prompt templates, Ideogram v3 API
- **compression-pipeline** — Python code, format tables, CF Image Transforms, CLS, broken image detection
- **og-image-generation** — Satori edge-rendered OG, KV / R2 cache, meta-tag helper
- **image-optimization** — Sharp processing, responsive srcset, WebP/AVIF, blur placeholders, R2 pipeline
- **image-profiling** — GPT Image 2 vision batch profiling
- **lightbox-classifier** — per-image eligibility: `kind!=logo` + ≥1024×768 + score≥7
- **social-brand-hex** — canonical brand-color map per social platform
- **notebooklm-pipeline** — per-site podcast via VoiceKit Studio ($17,000 Credits Tier, replacing ElevenLabs) + MeloTTS Workers AI fallback + infographic via Vega-Lite/Recraft/GPT-Image-2 + HeyGen video + CF Stream + RSS + JSON-LD + cost ceiling $3.50/site

## Strategy by Section

Hero → GPT Image 2 / Veo 3.1 · Features → GPT Image 2 / SVG · How It Works → GPT Image 2 · Testimonials → stock · About → stock/real · Blog → GPT Image 2 · Social → Satori OG 1200×630 · Icons → Ideogram v3

Pre-gen: communication goal · brand style · dimensions · format · budget · stock vs. generated?

## Visual Inspection (MANDATORY)

Read every image before deploy: blur · artifacts · watermarks · wrong colors · hallucinations · gibberish text. Fail → regenerate with improved prompt. Quality bar: 2× retina, no artifacts, brand palette, consistent style, no uncanny valley.

## Brian's Style

- Space/cosmic — `#00E5FF` + `#7C3AED`, deep black (`#060610`); connections/dots — quantum, neural, constellation
- "Ultra realistic" scenes; transparent logos; simpler always; motifs — squirrels, turtles

## Image Generation

- **GPT Image 2** (`gpt-image-2`) preferred (best quality); **GPT Image 1** for speed; **GPT Image 1-mini** for bulk/drafts
- Fallback: `scripts/image_gen.py`; product screenshots: Playwright on live URL
- Be specific: include colors, specify avoidances

## GPT Image 2 First Slot-Fill (CANONICAL — UNIVERSAL)

PRIMARY originator for every slot real-entity sources (Places / uploads / scrape) didn't fill. GPT Image 2 invoked BEFORE generic stock; stock APIs run parallel speed-pass fallback (instant return if GPT Image 2 hangs >15s). See skill 15 `media-acquisition` + Fail-CLOSED auto-regenerate (5 attempts, $0.40 worst-case ceiling per slot).

## Per-Slot Prompt Mandatory Fields (BUILD-BREAKING — `validate-image-prompts.mjs` + `validate-dalle-slot-fill.mjs`)

Every GPT Image 2 call MUST encode 6 fields from `_media_slots.json`:

1. Page topic + intent verbatim from `topic_intent`
2. Brand palette tokens from `_brand.json.colors` (inline hex)
3. Composition + aspect ratio matching `aspect`
4. Subject specificity (NEVER "people" — always "octogenarian volunteer plating soup, soft window light, documentary style")
5. Photographic technical specs (camera, lens, lighting, DoF — "shot on Hasselblad, 85mm prime, golden hour, shallow DoF")
6. Negative prompt block ("no text, no watermarks, no logos, no extra fingers, no AI artifacts, no stock-photo cliches")

Generic prompts FAIL validator. Same template applies to FLUX, Recraft, Stability.

## Fail-CLOSED Auto-Regenerate (BUILD-BREAKING — `validate-no-empty-slots.mjs`)

Every slot MUST end build w/ `filled_url != null AND filled_score >= relevance_floor` (default 8/10 via GPT Image 2 vision). Failure modes (Pexels empty, NSFW-flagged, broken scrape, vision below floor) → immediate re-gen w/ REFINED prompt — NEVER silent skip, NEVER substitute brand-gradient unless 5 attempts exhausted. `media_pipeline_orchestrator` sub-agent owns this loop. See `media-acquisition.md` § Fail-CLOSED chain.

## Logo / Icon / Video / OG

- **Logo** — Ideogram v3 (best text rendering); **Icons** — Recraft V3; output: PNG transparent + SVG; bg removal → favicon set (16/32/180/192/512 + maskable); brand mark MUST be vector-clean
  - Ideogram 4.0 (open-weight, Apache 2.0) is current — generates native transparent backgrounds (reduces bg-strip need); v3 endpoint remains valid
- **Video** — Veo 3.1 (primary rail: cinematic + narrative stitching, 7-8 × 8-sec clips → 60-sec arc); Kling 3.0 / Runway Gen-4.5 fallbacks; HeyGen (explainer/spokesperson); captions VTT + transcript; `prefers-reduced-motion` → static poster fallback
- **OG (1200×630)** — Satori edge-rendered, per-route unique, BRANDED CARD never raw photo, ≤100KB, cached KV 7d / R2 forever

## Stock Photography + Asset Compression + Performance

**Stock**: Pexels first (free, API); Pixabay second. Never Unsplash (generic), iStock/Getty (paid). Critique-and-remix loop max 3 rounds; AI vision <7/10 = reject + regenerate.

**Compression**: AVIF primary (94% browser support, 20-30% smaller than WebP); WebP fallback (Safari 14+); JPEG legacy. Sharp: 320/640/1280/1920w srcset; blur placeholder; dominant color → CSS bg fill. R2 upload per-extension content-type.

**Budgets**: total images/page ≤500KB; largest single ≤200KB; Hero LCP `fetchpriority="high"` + preload; `loading="lazy"` + `decoding="async"` on all others.

## See submodules for: media-prompts, compression-pipeline, og-image-generation, image-optimization, image-profiling, lightbox-classifier, social-brand-hex, notebooklm-pipeline, build-breaking-rules.

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Fan out bespoke SVG technical diagram generation, AVIF/WebP asset optimization, dynamic OG card endpoints, and HyperFrames/Remotion scene composition across parallel `opencode` (DeepSeek) and free-tier media worker swarms.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (`bin/multi-swarm-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.

## Theme.tools ecosystem contract (required)

Before implementation, load `rules/theme-tools-skill-integration.md` from the agent-skills repository and the entry for this skill in `config/theme-tools-skill-map.json`. Apply catalog-first reuse, upstream contribution, thin-consumer adoption, UI-first theme.tools implementation and test-driven verification, and `.tools/telemetry` routing proportionally to this task.
