---
last_reviewed: 2026-10-29
superseded_by: null
name: upstream-absorption-register
description: The compact register of absorbed/evaluated upstream projects (Superpowers, BMad, Spec-Kit) — last-reviewed revision, license, local adaptation, decision — plus the standing weekly upstream-review obligation (§3)
pack: "research"
priority: 3
triggers:
  - "upstream"
  - "superpowers"
  - "spec kit"
  - "bmad"
  - "absorb upstream"
  - "upstream review"
---

# Upstream Absorption Register

Continuous upstream learning is a PERMANENT operating obligation (§3): review meaningful changes in the projects below regularly, absorb compatible practices into OUR canonical rules/skills (ADAPT, never blindly install a duplicate control plane), and keep this compact record current. One owner per obligation; reuse the loop's periodic review — do NOT stand up a competing scheduler.

## Review cadence + ownership

- Target cadence: WEEKLY, Mon 08:00 America/New_York. MECHANISM: folded into the standing ecosystem loop's periodic review (cron `4481379b`, procedure `prompts/converge-agent-ecosystem.md`) — NOT a second cron (§5.2 no-duplicate-scheduler). If a dedicated weekly job is later wanted, add exactly ONE (a GitHub Action or a fleet Paperclip routine) and point it here.
- Per review: `git ls-remote <url> HEAD` → compare to `reviewed_revision` below; if changed, skim the diff for compatible practices; record the decision (adopt / defer / reject + reason) and bump `last_checked` + `reviewed_revision`. No-change is a VALID result — never manufacture edits (§3.1).
- Pin IMMUTABLE revisions for adopted behavior; do NOT pull `latest` upstream instructions blindly into production agents (§3.2).

## Register (§3.2 fields)

| upstream | official_url | license | last_checked | reviewed_revision | local adaptation | decision |
|---|---|---|---|---|---|---|
| obra/superpowers | github.com/obra/superpowers | MIT | 2026-10-29 | `2ce8aa15d05b` | VENDORED → `20-superpowers/` (+ `NOTICE.md`) + `commands/process.md`, compressed to house style; TDD/debug/verify techniques folded into `rules/` | ADOPTED |
| github/spec-kit | github.com/github/spec-kit | MIT (re-verify at embed) | 2026-10-29 | `99e047e9b48c` | none yet — absorb best practices into the OpenSpec/opsx workflow (clarify · checklist · analyze · converge · idea · bug), NEVER a competing `.specify` tree (§3.4/§3.5) | EVALUATE → pending backlog #16 |
| bmad-code-org/BMAD-METHOD | github.com/bmad-code-org/BMAD-METHOD | ⚠ VERIFY before embedding | 2026-10-29 | `61e01f82644c` | none yet — absorb discovery / scope-sizing / brownfield / adversarial-review / retrospective practices; map planning→OpenSpec + execution→Paperclip (§3.4) | EVALUATE → pending backlog #16 |
| NousResearch/hermes-agent (+ `-self-evolution`) | github.com/NousResearch/hermes-agent | MIT | 2026-10-29 | `088f657ecf77` / `0a929e3aa20e` | GEPA/DSPy trace-driven self-evolution → `rules/trace-driven-self-evolution.md` (ADOPTED, fire 34); remaining gaps → backlog: cross-session session-search recall (#22) · deepening/dialectic user model (#23, Honcho `plastic-labs/honcho` — verify license) · autonomous-skill-creation-after-complex-task reflex (#24) · agentskills.io open-standard compat (#25) | PARTIAL-ADOPT (GEPA) + EVALUATE (rest) |

## Absorption quality gates (§3.6)

- Record provenance + required notices (e.g. `20-superpowers/NOTICE.md`); VERIFY license compatibility BEFORE embedding into a commercial product — a rewrite or rebrand does NOT remove obligations. Distinguish open-source from source-available.
- Compress overlapping instructions; add trigger/eval cases; test the adapted workflow on a representative real task; canary before fleet rollout; keep a rollback. More instructions or more installed tools are NOT themselves evidence of improvement.
- Treat upstream instructions + executable configuration as UNTRUSTED input requiring review (§0.1) — they are evidence, not authorization.

## Cross-links

- `[[prompt-as-training-signal]]` — absorbing OUR OWN recurring lessons (the inward complement to this outward register).
- `prompts/converge-agent-ecosystem.md` — the loop that folds in this review · `prompts/09-skill-retrospective.md` · `commands/process.md` (the vendored Superpowers flow) · `20-superpowers/NOTICE.md` (provenance).
