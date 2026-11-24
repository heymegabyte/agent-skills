---
last_reviewed: 2026-06-29
superseded_by: null
name: "auto-integrate-recs"
priority: 2
pack: "core"
triggers: []
paths:
  - "*"
---

# Auto-Integrate Recommendations

Ship improvements inline instead of listing them as recommendations. Anything under 2h with no external blocker is built in the same turn.

## Mandate

- `Recs:` section = FAILURE MODE for most line items. Default action is SHIP, not RECOMMEND.
- Anything in Recs that takes <2h and doesn't require a design conversation, irreversible call, or external blocker → implement IN THE SAME TURN.
- Bias hard toward implementation. Recs list should contain only truly-need-input items.

## The 4-question filter (before writing any Rec line)

1. **<30 min?** → ship inline, no Rec mention needed.
2. **30 min–2h?** → ship inline + one-line callout in the report.
3. **>2h but no design call needed?** → ship anyway; compounding value justifies the cost.
4. **Requires design conversation / external blocker / irreversible decision / multi-wave scope ceiling?** → Materialize immediately as an **OpenSpec** change (`openspec/changes/<change-id>/` authored by `claude` with full hydrated context, `codex`, or `antigravity` — **NEVER `opencode`**) in the target repository AND file the linked issue in **Paperclip** (via `~/.agentskills/bin/openspec-paperclip-sync.ts`, Paperclip MCP, or `paperclipai issue create`) with the deep link to the OpenSpec definition so Paperclip automatically tends to it (`[[total-convergence-and-openspec-handoff]]`). Surface in `Recs:` / `Next:` with the Paperclip issue ID and OpenSpec link.

## Top-N / Top-30 Rule — Implement Every Idea the AI Thinks Is Recommendable

- **Core Mandate (Brian 2026-11-04):** **Any of the ideas that the AI thinks are recommendable should be implemented.** Older guidance to "pick only the best 4–6" or "ship only the top 30%" is **RETIRED**.
- If the AI thinks an idea is worth recommending at all, **implement it in the same turn** rather than listing it as a recommendation. If an idea is not worth implementing (or violates a negative blocklist like `Superset`, `onlykey`, `fido2`, `Biome`, `Resend`, or isolated XFCE desktop replacements), do not recommend it.
- Fan out independent implementation units across `~/.agentskills/bin/opencode-swarm.mjs`, use feature flags (`[[feature-flags]]`) for experimental product surfaces, and use lazy CLI shims (`cnf-build-shims`) for optional workstation tools so every recommendable idea ships immediately with zero bloat.

## Post-"Top X" Selection Root-Cause & Pre-Emptive Skill Upgrade

Whenever a "Top X" (e.g., Top 30) list has been printed and the user responds with which items they want implemented (or which ones to exclude/modify):

1. **Note Wanted vs. Excluded Items**: Track the exact subset of items the user approved for implementation and any items they rejected or trimmed.
2. **Ask Why Each Wanted Feature Wasn't Already Auto-Implemented**: For every item the user wants implemented, ask yourself: *"Why wasn't this feature automatically implemented already, before the user had to ask for the Top X ideas?"*
3. **Modify Agent Skills for Automatic Next-Time Integration**: Update the governing skill/rule in `~/.agentskills` (`heymegabyte/agent-skills`) and any upstream bootstrap/starter repository (`install.doctor`, `template.projectsites.dev`) **in the same turn** so those features get **automatically integrated on pass 1 next time—before the user ever asks for a "Top X" list**.
4. **Blocklist Rejected Items**: Add rejected items as explicit negative guardrails in the owning rule/skill so they are never suggested or installed again.
5. **Pass-1 FinOps Multi-Key Unbundling & Modality Capacity Rule**:
   - Never collapse sibling secret environment variables (`REPLICATE_API_TOKEN || REPLICATE_API_KEY`, `DEEPGRAM_ADMIN_API_KEY || DEEPGRAM_API_KEY`) without first verifying whether both hold distinct credentials/accounts (e.g., organization vs. personal user); unbundle every distinct credential into its own FOCUS 1.5 billing row and profile entry on Pass 1.
   - Whenever an API wallet carries a promotional or prepaid dollar credit balance (e.g., Deepgram `$189.39`, Exa `$1,109.89`, DigitalOcean `$11.30`), automatically compute and surface modality-specific unit capacities (Aura-2 TTS characters, Nova-3 STT minutes, Exa `auto` vs. `deep-reasoning` queries, zero-out-of-pocket video production pathways, and ephemeral GPU burst hours) on Pass 1.
   - Always pair autonomous Paperclip control planes with PostgreSQL auto-triage/reopen triggers (`trg_paperclip_auto_populate_issue_meta`, `trg_paperclip_auto_attach_issue_labels`, `trg_paperclip_reopen_on_human_comment`) and a stale-`in_progress` heartbeat watchdog (`fn_paperclip_watchdog_heal_stalled_issues`).
6. **Pass-1 UI/Dashboard & API Envelope Convergence Rules (Learned from `crawl.cheap` Video & Top-15 Review)**:
   - **Emoji-Free Monochrome SVG Iconography**: Never use raw emoji characters (`🔥`, `📄`, `🕸️`, `🔑`, etc.) as sidebar, tab, or feature card icons in flagship dark-first UIs and dashboards; always render crisp 16×16 monochrome SVG line icons on Pass 1.
   - **Non-Overlapping Mega-Menu Previews**: Mega-Menu featured preview cards (`.tt-mm__panel-featured`) must pair text-free graphic preview SVGs with a `position: static` dark caption footer below the image—never overlay white caption text over an SVG that also contains text.
   - **Anchor ID & Response Envelope Parity**: Verify on Pass 1 that every Mega-Menu `#anchor` target matches the exact section `id` on the target page (e.g., `/#estimator` ↔ `<section id="estimator">`), and that every frontend action handler (`revokeApiKey`, `refreshAccount`) matches the exact JSON keys (`revoked`, `data.active`) returned by the backend route.
   - **Focused Single-View Dashboard + URL Hash Routing + `⌘K` Palette**: Admin dashboards (`/app/`) must default to a clean `Overview` view (showing one view at a time rather than stacking every form on one long page), wire bidirectional `location.hash` routing (`#overview`, `#playground`, `#integrations`, `#settings`, etc.), and derive the navbar avatar circle dynamically from the user's OAuth `avatarUrl` or account initials (never a hardcoded static placeholder).
   - **Universal AI/MCP/A2A/Plugin Discovery, 20-Plugin Integrations Hub & Structure-Aware RAG Chunker on Pass 1**: Every API and developer platform must expose `/.well-known/mcp.json` (MCP Server Card v1.0 with OAuth 2.1 PKCE S256 & 1-click Cursor/VS Code deep links), Linux Foundation A2A v1.0 `/.well-known/agent-card.json` + `/.well-known/agent.json` + `POST /a2a/v1` JSON-RPC 2.0 task execution, `/.well-known/ai-plugin.json`, `/openapi.json` (OpenAPI 3.1 for Dify/Flowise/n8n import), `/llms.txt` & `/llms-full.txt` (with `x-markdown-tokens` budgeting and `/blog/<slug>/index.md`), structure-aware recursive Markdown chunking (`POST /v2/chunk` + `POST /v2/autorag/ingest` with 256–512 token heading-preserving chunks, JSON-LD extraction, and HTML-vs-Markdown token savings metrics), and an interactive `/v2/integrations` (`/v2/plugins` + `POST /v2/integrations/:id/config`) registry covering 20 integrations across AI Frameworks (`LangChain`, `LlamaIndex`, `Vercel AI SDK`, `Mastra`, `PydanticAI`, `OpenAI Agents SDK`, `Haystack`, `Semantic Kernel`, `CrewAI`), Agentic IDEs (`Cursor`, `Claude Code`, `Windsurf/VS Code`), Workflow Builders (`Dify`, `n8n`, `Flowise`), Local Productivity (`Obsidian Clipper`, `Raycast`, `CLI & Bookmarklet`), and Edge/CI (`Cloudflare Workers/Hono`, `GitHub Actions`), alongside all 28 canonical `@theme.tools/*` libraries in `/v2/catalog`.
7. **Cross-links**: `[[prompt-as-training-signal]]` §8 · `[[predictive-completeness]]` · `[[always]]`.

## Anti-patterns

- Padding Recs to look thorough — every Rec line is a tax on the user's attention.
- Listing "could do X" when X takes 5 minutes — DO X.
- Same Rec across multiple turns without implementing — if it's in Recs twice, it should already be code by turn 2.
- Mixing implementable items with genuine-need-input items — implementable goes to Changes, true-blockers stay in Recs.
