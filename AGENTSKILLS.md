# AGENTSKILLS.md — Durable Agent Operating Doctrine

Brian Zalewski. Principal SE, 14yr. Megabyte Labs / HeyMegabyte. Solo AI builder.

## Mission

One person with AI builds what took twenty (canonical: `CLAUDE.md` § Identity). Every prompt is a training signal, every correction a gradient, every repeated task a skill waiting to be extracted.

## Self-Improving OS

This is a living agent operating system. It converts:

- **Follow-up corrections** → memory or rules
- **Repeated task patterns** → skills or saved prompts
- **"Always/never" directives** → rules
- **Tech preferences** → prefs files
- **Repo drift** → updated docs or configs
- **3× repeated pattern** → skill
- **Re-issued prompt on same surface** → `monitor-orchestration.md` § Known shortcomings

## Routing (hooks > rules > skills > prompts)

| Signal | Destination |
|---|---|
| Universal, every-session | `~/.claude/CLAUDE.md` |
| Personal doctrine, philosophy | `AGENTSKILLS.md` |
| Reusable workflow, procedure | `~/.claude/skills/<name>/SKILL.md` |
| Copy-paste prompt template | `prompts/<nn>-<name>.md` |
| Project-specific workflow | `project/.claude/skills/<name>/SKILL.md` |
| Human-readable policy | `project/docs/<NAME>.md` |
| Deterministic lifecycle hook | `~/.claude/hooks/<name>.<ext>` |
| Noisy, parallelizable scan | subagent |
| Superseded, low-value | `archives/` |
| Audience: future agents | `LEDGER.md` |

## Core Loop

1. One relentless session: architect → parallel phases → spawn/kill agents → verify → ship
2. End-of-turn retrospective: did this turn reveal something worth keeping?
3. Extract to smallest correct destination
4. Log to LEDGER.md
5. Sync repo if global changes imply repo behavior

## Thinking Disciplines

Canonical: `CLAUDE.md` § Thinking — Boil the Lake · Phase -1 Gates · Three-Layer Knowledge · Self-Argue · Anti-Apology.

## Autonomy

Per `CLAUDE.md` § Autonomy + `rules/full-autonomy.md`. Approval only for huge/destructive/irreversible/expensive/prod/security/legal/customer.

## Conflict Resolution

1. This file > plugin CLAUDE.md
2. `01-operating-system` > all other skills
3. Project > global
4. Specific > general
5. Brian > defaults

## See Also

- `LEDGER.md` — auditable record of every durable change
- `routing-matrix.md` — detailed routing decision table
- `prompts/` — canonical reusable prompt library (~10 prompts)
- `templates/` — templates for skills, prompts, ledger entries
- `archives/` — superseded material
- `rules/prompt-as-training-signal.md` — doctrinal rule for learning extraction
- `_router.md` — skill routing index
