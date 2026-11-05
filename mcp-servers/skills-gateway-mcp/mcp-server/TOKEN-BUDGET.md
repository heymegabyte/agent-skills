# Token budget — before and after the skills gateway

Measured on 2026-10-26 against this repository: **176 skills, 176 rules, 28 agents, 36 commands** (416 indexed files).

Tokens are `ceil(bytes / 4)` — the same ratio the repo's
`bin/audit-always-load-budget.mjs` uses. Regenerate with:

```bash
cd mcp-servers/skills-gateway-mcp/mcp-server
npm install && npm run build && npm run measure:json
```

## Headline

| What is paid per session | Bytes | ~Tokens |
| --- | ---: | ---: |
| **Before** — skill/agent/command frontmatter + every rule body | 1,078,519 | **269,630** |
| **Before** — every indexed markdown file, loaded in full | 2,824,050 | **706,013** |
| **After** — the 3 tool definitions (constant per session) | 1,484 | **371** |
| **After** — typical turn: definitions + one 5-hit search | — | **855** |
| **After** — `find_rule` result (rule body, capped at 4,000 chars) | 10,720 | 2,680 |
| **After** — `load_skill` on a one-line stub | 43 | 11 |
| Index held server-side (never sent to the model) | 747,617 | 186,905 |

- Typical turn is **99.7% smaller** than the always-load
  baseline and **99.9% smaller** than loading
  everything.
- Roughly **268,775 tokens saved per session** against the
  always-load baseline.

## What "before" means

Two baselines are reported because the issue's "~50K tokens" figure depends on how
much a client loads up front, and this repository has grown well past the
20-skill/117-rule shape it was written against.

- **metadata** — each skill, agent, and command contributes its YAML frontmatter
  (`name`, `description`, `priority`, `paths`, `tags`), and every rule contributes
  its whole body because rules are always-eligible. This is the "descriptions
  and rule frontmatter before the user types" shape the issue describes.
- **allMarkdown** — every indexed file in full. This is the hard ceiling a client
  would pay with no gateway at all.

## What "after" means

The 3 tool definitions are the only constant cost. The index is built and held by
the server process; it is never placed in the model's context. A call returns
only that call's result.

`find_rule` is deliberately the most expensive call: it returns the authoritative
rule body, capped at 4,000 characters per rule (about 1,000 tokens), and the
probe measured here is the realistic worst case for a 3-rule answer.

## Heaviest indexed files

These dominate the "before" numbers, which is why loading them up front is
expensive and loading them on demand is cheap.

| File | Kind | ~Tokens |
| --- | --- | ---: |
| `15-site-generation/build-prompts.md` | skill | 22,091 |
| `15-site-generation/build-breaking-rules.md` | skill | 21,886 |
| `12-media-orchestration/build-breaking-rules.md` | skill | 12,330 |
| `15-site-generation/quality-gates.md` | skill | 11,922 |
| `15-site-generation/template-system.md` | skill | 10,156 |
| `15-site-generation/media-acquisition.md` | skill | 10,028 |
| `10-experience-and-design-system/build-breaking-rules.md` | skill | 9,366 |
| `rules/principles-incident-log.md` | rule | 6,846 |

## Method

`src/measure.ts` builds the real index from the plugin root, runs the real
`search_skills`, `find_rule`, and `load_skill` formatters against it, and sums
the byte counts of what a client would have received. No numbers are estimated.
The unit suite asserts that tool definitions stay under 1,000 tokens and a
typical turn stays under 2,000, so a future change that inlines skill bodies into
the tool manifest fails CI rather than silently regressing the budget.
