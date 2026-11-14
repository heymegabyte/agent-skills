---
last_reviewed: 2026-11-11
superseded_by: null
name: "dual-reader-artifacts"
priority: 2
pack: "core"
triggers:
  - "api response"
  - "output format"
  - "report"
paths:
  - "*"
---

# Dual-Reader Artifacts — Human Skim + Machine Parse, Always Both

Every artifact we emit has TWO readers: a human who skims (wants a headline + two sentences + the one
link) and a machine that parses (wants structured, typed, schema-valid data). Serve BOTH in the same
artifact — never one at the cost of the other. A wall of prose a parser chokes on, or a raw JSON blob
a human can't skim, is half-built.

Cross-links: `[[uniform-json-output]]` · `[[structured-logging]]` · `[[tool-design-as-api]]` · `[[agent-readable-by-default]]` · `[[copy-writing]]` · `[[documentation-as-code]]`

## The rule

- **Reports / PR bodies / commit messages:** lead with a 4–8 word headline + ≤2-sentence summary a
  human skims in 3s; put the machine-usable detail (counts, file lists, IDs) in a structured block below.
- **API + tool responses:** return typed, schema-valid JSON (the machine contract) AND a short human
  `message`/`summary` field — never force a human to read raw payloads or a machine to scrape prose.
- **CLIs:** machine-readable data to stdout (JSON under `--json`), human-styled progress to stderr —
  one stream per reader, never interleaved (see `[[terminal-styling]]`).
- **Logs:** structured fields (queryable) + a human-legible message line. Both, every event.
- **Docs:** a skimmable headline/TOC for humans + stable anchors/front-matter/`llms.txt` for agents.

## Why (the MCP-apps lesson)

Subagents are told their final text IS the return value, so they return raw data; humans reading the
same surface need the headline. The fix is never "pick one" — it's dual fields: a `summary` a human
reads and a `data` block a machine parses. Designing for both readers is what makes an artifact
reusable by the next agent AND legible to the person.

## Anti-patterns

- A prose-only report a downstream parser can't consume (no counts/IDs/structure).
- A raw JSON dump with no human summary line — the reader has to parse to understand.
- Interleaving machine output and human styling on one stream (breaks parsers).
- A tool result that serves the agent but not the human watching, or vice versa.
