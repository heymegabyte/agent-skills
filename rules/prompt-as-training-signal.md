---
last_reviewed: 2026-06-29
superseded_by: null
name: "prompt-as-training-signal"
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Prompt as Training Signal

Every user prompt is a training signal — and evidence the previous turn under-delivered. Extract the wisdom and fold it into the durable layer (skills, rules, prefs, memory) IN THE SAME TURN before doing the requested work.

## The principle

- A repeat prompt on the same project/domain/surface = the prior turn was incomplete; the prompt names the dimension. Capture the corrective gradient, update the model.
- Cost of capturing: seconds. Cost of relearning next month: hours.
- **A re-prompt on the same surface = a PREDICTION MISS** — the first pass delivered the literal subset, not the full arc. Root-cause WHY it wasn't predicted, add the missed item to the predictive checklist THE SAME TURN, and the permanent fix is to predict the 80% from the 20% up front rather than iterate to it. Per `[[predictive-completeness]]`.

## The seven prompt shapes (and what each teaches)

### 1. "Now do X" / "Also do Y" / "Don't forget Z"

- **Means:** prior turn under-scoped; X/Y/Z was implicit and got dropped.
- **Extract:** the missing element is part of the surface's invariant set.
- **Write to:**
  - Universal must-have → `rules/always.md` § matching section
  - Domain-specific → skill that owns that domain
  - Brian habit → `rules/brian-preferences.md`

### 2. `"Make sure to ___"` / `"Always ___"` / `"Never ___"` <!-- validator-ignore: filler -->

- **Means:** a hard rule the user expects respected, not a request.
- **Write to:** `rules/always.md` (if universal) OR the relevant rule file. Phrasing: declarative, build-fail if violated.

### 3. `"Actually ___"` / `"I meant ___"` / `"It should be ___"`

- **Means:** a wrong assumption was baked in; the user just corrected the model.
- **Write to:** `feedback_<topic>.md` memory file with **Why:** + **How to apply:**

### 4. Re-issuing a near-identical prompt

- **Means:** prior turn was wrong-SHAPED (decomposition / monitor-fire / parallelization failed), not wrong-content.
- **Write to:** `rules/monitor-orchestration.md` § Known shortcomings — new numbered entry: `<symptom>` → `<root cause>` → `<rule that prevents it>`. Cross-links: `[[monitor-orchestration]]` · `[[auto-integrate-recs]]`.

### 5. `"How can we improve ___"` / `"What else ___"` / `"Top N ideas"`

- **Means:** invitation to operate at full extra-mile/auto-integrate-recs surface — and a signal that pass-1 predictive completeness left high-value ideas on the table.
- **Extract:** which surface the user is investing in — note in a project memory entry, and once the user selects from the "Top X" list, execute §8 below in the same turn.

### 6. `"Ensure ___ is in ___"` / `"Save ___ to memory"` / `"Add ___ to the rules"`

- **Means:** explicit meta-instruction; the user is teaching.
- **Do:** highest-priority capture. Write the artifact this turn. Cross-link from sibling rules so the lesson surfaces in unrelated contexts later.

### 7. `"Why didn't ___?"` / `"How come ___?"` / venting

- **Means:** a behavior violated a prior preference or the user's implicit model.
- **Write to:** `feedback_<topic>.md` memory with the prohibited behavior + reason given. Surface conflict under `~/.claude/CLAUDE.md` § Conflict Resolution if applicable.

### 8. Selection / Approval from a Printed `"Top X"` List (`"implement these"`, `"remove X, skip Y, and implement the rest"`)

- **Means:** every item the user selects from a printed "Top X" (e.g., Top 30) list is a feature/config that **should have been automatically implemented before the user ever had to ask for the 30 ideas**. Any item the user explicitly drops or rejects is a permanent negative preference.
- **Mandatory 4-Step Pre-Emptive Integration Loop (run in the SAME turn):**
  1. **Note Wanted vs. Rejected Items**: Record which items from the "Top X" list the user wants implemented and which items they explicitly excluded or removed.
  2. **Root-Cause Why It Wasn't Auto-Implemented**: For every wanted item, ask yourself: *"Why wasn't this feature/configuration already automatically implemented on pass 1, before the user asked for the Top X ideas?"* Identify the exact gap in the predictive checklist, domain skill, or bootstrap/starter template.
  3. **Modify Agent Skills & Upstream Defaults**: Update the owning skill/rule in `~/.agentskills` (`heymegabyte/agent-skills`) and any canonical upstream bootstrap/template repo (`heymegabyte/install.doctor`, `template.projectsites.dev`) **in the same turn** so the idea is **automatically integrated next time before the user ever asks for a "Top X" list**.
  4. **Codify Exclusions**: Record any rejected/removed items as explicit `NEVER` guardrails in the relevant skill/rule so they are never proposed or provisioned again.
- **Cross-links:** `[[auto-integrate-recs]]` · `[[predictive-completeness]]` · `[[always]]`.

## Extraction protocol

For every prompt:

1. **Read the prompt shape** (which of the 7 above?).
2. **Name the gradient** — what did the prior turn miss / get wrong / under-scope / mis-shape?
3. **Identify the durable home** — which skill, rule, preference, or memory should grow?
4. **Write the artifact** — append to the file, update the index, commit + push.
5. **Cross-link** — add `[[backlink]]` from both sides. Skipping this step lets the same lesson recur in unrelated projects weeks later.
6. **THEN execute the requested work** with the new wisdom already in force.

## Every-turn parallel upstream triad integration decision (`agent-skills` + `install.doctor` + `theme.tools` + touched projects)

Whenever the agent asks itself at the end of a prompt pass what updates can be inferred from the prompt and response for `agent-skills`, it **MUST run all three upstream syncs in parallel** (plus any other implicated project) — without waiting for the user to ask:

1. **`heymegabyte/agent-skills` (`~/.agentskills`)**: Did this turn reveal a reusable rule, skill, convergence loop check, verification script, or orchestration pattern? Update `agent-skills` immediately.
2. **`heymegabyte/install.doctor` (`/Users/Apple/emdash/repositories/install.doctor`)**: Did this turn reveal reusable system configuration, dotfiles, shell env exports, package-manager settings, security, service units, lazy CLI shims (`cnf-build-shims`), monitoring, backup, recovery, or host-integration logic? Reconcile it into `install.doctor` in parallel next to `agent-skills`.
3. **`heymegabyte/theme.tools` & `ui.theme.tools` (`/Users/Apple/emdash/repositories/theme.tools`)**: Did this turn reveal reusable themes, OKLCH design tokens, 16-state visual component contracts, widget micro-loop patterns, Storybook visual gates, or shared web components (`@theme-tools/ui`, `@theme-tools/themes`)? Reconcile or queue future work in `theme.tools` via OpenSpec in parallel next to `agent-skills` and `install.doctor`.
4. **OpenSpec + Paperclip Issue Registration Across Every Touched Repository**:
   - Properly use **OpenSpec** (`openspec/changes/<change-id>/{proposal.md,design.md,tasks.md,specs/}`) in each respective repository (`agent-skills`, `install.doctor`, `theme.tools`, and any other project) to save the work and generate the task files.
   - **Frontier Architect Mandate**: OpenSpec `proposal.md`, `design.md`, `tasks.md`, and `specs/` MUST be authored by **Claude Code (`claude`) with a fully-loaded, hydrated context** (or `codex` / `antigravity`). **NEVER spell out the details of the app or OpenSpec with `opencode`.**
   - Add/sync the corresponding issue/task in **Paperclip** (via `~/.agentskills/bin/openspec-paperclip-sync.ts`, Paperclip MCP, or `paperclipai issue create`) with the **direct deep link to the OpenSpec definition(s)** in each Paperclip project (`agent-skills`, `install.doctor`, `theme.tools`, etc.).
5. **Recommendations, Next Steps & Deferred Work → OpenSpec + Paperclip**:
   - At the end of any prompt (or whenever a huge prompt cannot be 100% finished in the current pass and the agent defers remaining sub-features), materialize any remaining recommendations, next steps, or unfinished sub-features as an **OpenSpec** change AND file the linked issue in **Paperclip** so Paperclip automatically tends to it (`[[total-convergence-and-openspec-handoff]]`).

This is a mandatory parallel workstream on every turn. Cross-links: `[[total-convergence-and-openspec-handoff]]` · `[[workstation-shared-provisioning-policy]]` · `[[openspec-operating-contract]]`.

## Where the artifacts live

- **Universal rules** → `~/.claude/plugins/heymegabyte-agent-skills/rules/<topic>.md`
- **Universal skills** → `~/.claude/plugins/heymegabyte-agent-skills/<NN-skill-name>/SKILL.md`
- **User-level overrides** → `~/.claude/CLAUDE.md` § Local Overrides
- **Project-level rules** → `<project>/.claude/rules/<topic>.md` (path-scoped)
- **Project memories** → `~/.claude/projects/<encoded-path>/memory/<name>.md` + index in `MEMORY.md`
- **Brian preferences** → `rules/brian-preferences.md`
- **Stack preferences** → `rules/code-style.md`
- **Recurring shortcomings** → `rules/monitor-orchestration.md` § Known shortcomings

## What NOT to capture

- Code patterns derivable from `git log` / `git blame` / current repo state
- Project-specific scaffolding choices (lives in project's CLAUDE.md, not `~/.claude/`)
- Ephemeral conversation context (use TaskCreate/plan instead)
- Anything already covered by an existing rule — UPDATE the existing rule, never duplicate

## Boil-the-lake gradient extraction

When a prompt produces a lesson, also ask:

- "What CLASS of gap does this belong to?"
- "What sibling projects / surfaces / future prompts will hit the same class?"
- "Is there a generalizable rule one level higher?"

Write the GENERALIZED rule, not the project-specific instance. Project instances become `## Reference incident` blocks anchoring the abstract rule.

## Self-reinforcement

This rule is subject to itself. If a future prompt teaches that prompt-extraction missed a dimension, append a §8/§9/§N prompt-shape entry above with the new pattern and reference incident.
