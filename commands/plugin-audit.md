---
description: Audit .claude-plugin/plugin.json against the filesystem (agents, skills, counts); fix drift in-turn
argument-hint: none
---

<!-- <SUBAGENT-STOP>: skip this skill when running inside a subagent. Meta-skills must not leak into spawned subagent contexts. -->
<SUBAGENT-STOP/>

Validate the plugin manifest — what Claude Code actually LOADS — against the real filesystem.

**Purpose** — the manifest silently drifted (agents[] listed 18 of 28; the description advertised "20-category, 18+ agents, 117 rules, 20+ commands, 32 platforms" while reality was 23/28/177/36/37). This command pins it back per [[drift-detection]].

**When to use** — after adding/removing an agent, skill, command, rule, or platform variant; before publishing the plugin; on demand.

Run:

```bash
node bin/audit-plugin-manifest.mjs
```

Checks:

- `plugin.json agents[]` ↔ `agents/*.md` (exact set; every listed file exists, no agent file missing).
- `plugin.json skills[]` ↔ the `NN-*` skill dirs (exact set).
- `description` prose counts (`N-category`, `N agents`, `N doctrine rules`, `N slash commands`, `N AI-tool platform variants`) ↔ the actual filesystem counts.

**Outputs** — exit 0 + a one-line summary when clean; exit 1 + a `✘ PLUGIN MANIFEST DRIFT` list naming every mismatch.

**On drift** — edit `.claude-plugin/plugin.json` (agents[], skills[], description counts) to match the filesystem, then re-run until green. Fix in-turn; do not defer.

**Can update ~/.agentskills or ~/.claude?** Yes — this command's whole job is to correct `plugin.json` drift. Commit + push after fixing.
