---
last_reviewed: 2026-11-11
superseded_by: null
name: "agent-readable-by-default"
priority: 2
pack: "ai"
triggers:
  - "mcp"
  - "llms.txt"
  - "agent"
  - "api"
paths:
  - "*"
---

# Agent-Readable By Default — Humans Aren't the Only Users

Build every surface to be consumed by an AI agent TOO, not only a human with a mouse. The web is
becoming agent-driven; a product that only a human can operate is already legacy. Every capability is
exposed as a tool an agent can call, every page carries machine context, and nothing on an
agent-facing surface fights the agent. The UI is ONE client, not the whole product.

Cross-links: `[[dual-reader-artifacts]]` · `[[tool-design-as-api]]` · `[[mcp-server-hardening]]` · `[[ai-agent-security]]` · `[[contract-first-ai]]` · `[[seo-geo]]`

## The rule

- **Every capability is an MCP tool, not just a button.** If a human can do it in the UI, an authorized
  agent can do it via a typed, schema-described, consent-gated tool. Expose the capability, then let
  the UI be one consumer of it (desktop.tools is the canonical shape: the computer AS tools for any AI).
- **Ship machine context on every page.** `llms.txt` / `llms-full.txt`, structured JSON-LD, stable
  anchors, a documented JSON API behind the HTML. An agent should understand the surface without
  scraping rendered pixels.
- **Never wall an agent-facing surface against bots.** Bot-challenge / JS-detection / aggressive WAF on
  a surface meant to be read by agents contradicts the goal AND tanks it (deprecated-API injection,
  blackholed server-to-server). Turn it off there; gate with real auth instead.
- **Tools are typed + validated + traced.** Zod-validated I/O, clear errors, scopes, rate limits, audit
  — an agent calling a tool gets the same rigor as a user clicking a button (`[[tool-design-as-api]]`).
- **Structured over prose at the boundary.** Agent-facing responses are parse-ready (`[[dual-reader-artifacts]]`).

## Anti-patterns

- A capability reachable only by clicking the UI, with no tool/API an agent can call.
- An agent-facing site behind Bot Fight Mode / Turnstile / JS-challenge that blocks legitimate agents.
- Pages with no `llms.txt` / JSON-LD / documented API — an agent must scrape pixels to act.
- Untyped, unvalidated, un-scoped "agent" endpoints (an injection + reliability hole — `[[ai-agent-security]]`).
