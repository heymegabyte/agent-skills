---
last_reviewed: 2026-10-03
superseded_by: null
name: "agent-neutrality"
priority: 2
pack: "ai"
triggers:
  - "agent neutral"
  - "agent-neutral"
  - "de-claude"
  - "platform neutral"
  - "rebrand agent skills"
paths:
  - "rules/**"
  - "**/SKILL.md"
  - "_router.md"
---

# Agent Neutrality — No Privileged Tool

The system brands as **Agent Skills** and works identically across 32+ AI coding tools. Claude Code
is ONE platform among them — listed, never privileged. Neutral ≠ erased: platform-specific adapters
keep their precision; only the BRAND and generic prose are neutral. (Brian directive 2026-10-03.)

## Default phrasing (new skills/rules/docs)

- "the agent" = the host harness · "the model" = the LLM · "your AI tool" = the user's choice.
- Never bare "Claude"/"Claude Code" when ANY agent is meant; never a Claude-only install command as THE install path (lead with `npx`/`git clone`, list per-tool methods equally).
- Routing maps every platform's config equally: `CLAUDE.md`, `AGENTS.md`, `CODEX.md`, `GEMINI.md`, `.cursor/**`, `.windsurf/**` → skill 01.

## Adapter exceptions — legit, never "fix" these

- **Runtime paths/config**: `~/.claude/**`, `.claude/**`, `CLAUDE.md` (the Claude adapter entry), `claude_desktop_config.json`, `CLAUDE_CODE_*`/`CLAUDE_*` env vars, `.claude-plugin/`.
- **Model mechanics**: model IDs (`claude-sonnet-4-6`, …), tier/pricing/quota tables (`model-routing`, `opus-quota-fallback`), vision-protocol model names.
- **Real commands/flags**: `claude …`, `npx claude`, `claude plugin|mcp|config`, Playwright's `--loop=claude`.
- **Product names**: Claude Code, Claude Desktop, claude.ai, Claude Agent SDK, Anthropic API, ClaudeBot/Claude-SearchBot UAs.
- **Identifiers/slugs**: `claude-skills` repo/npm/plugin slugs, `claude.megabyte.space`, `claude-code:` compatibility frontmatter (platform-gate metadata other tools ignore).
- **Records**: incident logs, retrospectives, `supremacy-wars`, dated quotes — records are never rewritten.

## The test

- *"Would this sentence be TRUE and USEFUL verbatim inside Codex / Cursor / Gemini CLI?"* Yes → write it neutral. No, because it names real Claude-only mechanics → it's adapter content; keep it precise and scoped, don't dilute it.
- Neutral core lives in skills/rules/`AGENTSKILLS.md`; per-platform wiring lives in the adapter layers (`CLAUDE.md`, the 32 generated variants, hooks).

## Verifier recipe

- `grep -rin claude rules/ <skill-dirs>` minus the exception patterns above ≈ the brand-drift surface. 2026-10-03 audit: 59 files mentioned claude; only 9 lines across 6 rules were drift (fixed in `heymegabyte/agent-skills@fire-5`); everything else classified adapter.

Cross-links: `[[prompt-as-training-signal]]` · `[[drift-detection]]` · `[[instruction-compression-playbook]]` · `[[model-routing]]`.
