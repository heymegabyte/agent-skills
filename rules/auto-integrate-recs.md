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
4. **Requires design conversation / external blocker / irreversible decision?** → THIS is a Rec. Surface with cost/value pitch + concrete next-prompt language.

## Top-N / Top-30 Full-Cohort Implementation Rule (90–100% Ship Rate, Never Cap at 4–6)

- **User preference calibration (Brian 2026-11-04):** Brian is in favor of **almost all (~90–95%+)** of the ideas in any "Top 30" / "Top N" list. Older guidance to "pick only the best 4–6" or "ship only the top 30%" is **RETIRED** because it leaves ~20+ wanted features unbuilt and forces unnecessary follow-up prompts.
- **Default disposition — Implement the ENTIRE safe cohort (~25–30 of 30) in the same turn:**
  1. **When a task involves building, auditing, or provisioning a surface/host**: proactively generate the Top 30 missing/improvement items internally and **implement ALL safe, aligned items in the same turn** before finishing.
  2. **When the user explicitly asks for a "Top 30" / "Top N" list**: generate the 30 evidence-backed items, **filter out only explicit negative-blocklist items** (`Superset`, `onlykey`, `fido2`, `Biome`, `Resend`, isolated XFCE desktop replacements) **and genuinely destructive/irreversible items** (`approval-required` tier), and **implement the entire remaining cohort in the same turn** (fanning out independent units via `~/.agentskills/bin/opencode-swarm.mjs`, using feature flags or lazy CLI shims `cnf-build-shims` where appropriate so there is zero bloat).
- NEVER print a passive list of 30 ideas with 0 implementations when the items are safe and reversible to ship.

## Post-"Top X" Selection Root-Cause & Pre-Emptive Skill Upgrade

Whenever a "Top X" (e.g., Top 30) list has been printed and the user responds with which items they want implemented (or which ones to exclude/modify):

1. **Note Wanted vs. Excluded Items**: Track the exact subset of items the user approved for implementation and any items they rejected or trimmed.
2. **Ask Why Each Wanted Feature Wasn't Already Auto-Implemented**: For every item the user wants implemented, ask yourself: *"Why wasn't this feature automatically implemented already, before the user had to ask for the Top X ideas?"*
3. **Modify Agent Skills for Automatic Next-Time Integration**: Update the governing skill/rule in `~/.agentskills` (`heymegabyte/agent-skills`) and any upstream bootstrap/starter repository (`install.doctor`, `template.projectsites.dev`) **in the same turn** so those features get **automatically integrated on pass 1 next time—before the user ever asks for a "Top X" list**.
4. **Blocklist Rejected Items**: Add rejected items as explicit negative guardrails in the owning rule/skill so they are never suggested or installed again.
5. **Cross-links**: `[[prompt-as-training-signal]]` §8 · `[[predictive-completeness]]` · `[[always]]`.

## Anti-patterns

- Padding Recs to look thorough — every Rec line is a tax on the user's attention.
- Listing "could do X" when X takes 5 minutes — DO X.
- Same Rec across multiple turns without implementing — if it's in Recs twice, it should already be code by turn 2.
- Mixing implementable items with genuine-need-input items — implementable goes to Changes, true-blockers stay in Recs.
