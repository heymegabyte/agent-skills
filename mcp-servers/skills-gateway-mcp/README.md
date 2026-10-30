# skills-gateway-mcp

An MCP server that indexes every skill, rule, agent, and command in this plugin
behind 3 meta-tools. Instead of loading ~50K+ tokens of descriptions and rule
frontmatter before the user types, a client pays ~0.4K tokens for the tool
schemas and then loads exactly one skill on demand.

Pattern: [mcpzip](https://github.com/hypercall-public/mcpzip) — aggregate N tools
into a few meta-tools.

## Tools

| Tool | Purpose |
| --- | --- |
| `search_skills(query, kind?, max_results?)` | Ranked full-text search across skills, rules, agents, and commands. Returns short summaries plus the exact `name` to pass to `load_skill`. |
| `load_skill(name, sections?)` | Load one entry's full markdown. `sections` returns only the requested headings. Unknown names fail with `isError: true` and a "did you mean" hint. |
| `find_rule(topic, max_results?)` | Authoritative rule text for a topic. Returns rule files only, so a doctrine question never yields a skill. |

Inputs are Zod `.strict()` schemas: an unknown key or an out-of-range
`max_results` is an error, not a silent clamp.

## Measured token budget

Produced by `npm run measure` against this repository (`node dist/measure.js`).
Tokens are `ceil(bytes / 4)` — the same ratio `bin/audit-always-load-budget.mjs`
uses. Every number is measured, not estimated: the "after" figures replay the
real search and formatter against the real index.

| Session cost | Tokens |
| --- | --- |
| **Before** — skill/agent/command frontmatter + every rule body | **~269,630** |
| **Before** — every indexed markdown file loaded in full | **~706,013** |
| **After** — the 3 tool definitions (constant) | **~371** |
| **After** — typical turn (definitions + one 5-hit search) | **~855** |

That is a **~99.7%** reduction against the always-load baseline and **~99.9%**
against loading everything. The index itself is ~186,905 tokens on disk
(747,617 B), but it never enters the model's context — the server holds it and
returns only the current call's result.

Reproduce:

```bash
npm install
npm run build
npm run measure          # human-readable
npm run measure:json     # machine-readable, for the before/after report
npm test                 # index, search, server, and budget unit tests
node ../evals/run-golden-evals.mjs   # 22 golden evals over the real stdio transport
```

The committed baseline lives in [`mcp-server/TOKEN-BUDGET.md`](./mcp-server/TOKEN-BUDGET.md).

## What gets indexed

- `NN-<slug>/**.md` — every skill file and nested reference (176 files)
- `rules/**.md` — every doctrinal rule (176 files)
- `agents/**.md` — every agent definition (28 files)
- `commands/**.md` — every slash command (36 files)

Nested `verts/` bundles under the site-generation skill are indexed but
deferred: `buildIndex` walks one level of the skill tree today. Extending it is
a bounded follow-up, not a blocker for the 1K budget.

## How the index works

`src/index-builder.ts` walks the plugin root, parses frontmatter without a YAML
dependency, and stores a **body-free** entry per file: name, aliases, path,
description, first-paragraph summary, heading list, size, and mtime. The
serialised index is cached at `<root>/.skills-gateway-index.json`; the cache is
reused when its digest matches the tree and rewritten otherwise.

`src/search.ts` scores discrete fields with fixed weights (name 60, path 20,
description 10, tags/headings 4), requires half the query tokens to match, and
applies explicit tiebreaks: a direct name hit, then a numbered-directory slug
hit ranking that folder's `SKILL.md`, then priority-1 rules, then `SKILL.md`
files over their siblings. A small acronym table maps `a11y`, `i18n`, `cwv`,
`pseo`, and friends onto their long forms in both the query and the haystack.

`src/index.ts` is the MCP wiring. It returns `isError: true` for every failure
and a normal empty result for a search miss, so a client can retry rather than
treat a miss as a crash.

## Configuration

| Variable | Default | Effect |
| --- | --- | --- |
| `SKILLS_GATEWAY_ROOT` | four levels above `dist/` | Plugin root to index. Set it for tests or a vendored copy. |
| `SKILLS_GATEWAY_NO_CACHE` | unset | `1` skips the on-disk index cache. |

## Client configuration

```json
{
  "mcpServers": {
    "skills-gateway": {
      "command": "node",
      "args": ["/path/to/agent-skills/mcp-servers/skills-gateway-mcp/mcp-server/dist/index.js"]
    }
  }
}
```

Remove the eager skill/rules/agents loading from the client so the gateway is
the only path to that content.
