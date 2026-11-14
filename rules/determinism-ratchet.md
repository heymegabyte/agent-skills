---
last_reviewed: 2026-11-11
superseded_by: null
name: "determinism-ratchet"
priority: 2
pack: "core"
triggers:
  - "repeated correction"
  - "keeps happening"
  - "enforce"
paths:
  - "*"
---

# Determinism Ratchet — Push Repeated Corrections DOWN the Ladder

Determinism order is `hooks > rules > skills > prompts`. The ratchet: every time a behavior has to be
corrected, push its enforcement DOWN one rung toward determinism — and the ratchet only ever turns
that way. A behavior corrected a THIRD time must become a hook / lint / test / rule, never a fourth
polite reminder. Re-explaining is the failure mode; encoding is the fix.

Cross-links: `[[prompt-as-training-signal]]` · `[[supremacy-wars]]` · `[[drift-detection]]` · `[[lint-doctrine]]` · `[[instruction-compression-playbook]]` · `[[auto-integrate-recs]]`

## The ladder (most deterministic first)

- **Hook / lint / test / CI gate** — fires automatically, can't be ignored, zero ongoing attention. Prefer this.
- **Rule** — always-loaded doctrine the model reads every prompt.
- **Skill** — loaded on trigger/path match.
- **Prompt** — a one-off reminder. The WEAKEST rung; a correction that lives only here WILL recur.

## The rule

- **1st correction:** fix it + note the lesson. **2nd:** write/strengthen the rule. **3rd:** make it
  DETERMINISTic — a hook, a lint rule, a failing test, a build gate. No 4th reminder.
- **A hook that catches what a rule already said = promote to `[[supremacy-wars]]`.** The gap between
  "the doctrine said it" and "the model did it anyway" is exactly what must become deterministic.
- **Prefer the lowest rung that can enforce it.** Don't write a rule when a lint rule would catch it;
  don't rely on a prompt when a hook would. Encode at the most automatic level available.
- **The ratchet is one-way.** Never move enforcement UP the ladder (hook → rule → prompt) to "keep it
  flexible" — that's how a solved problem silently un-solves itself.

## Anti-patterns

- Re-explaining the same correction a 3rd+ time instead of encoding it as a hook/lint/test.
- Writing a rule for something a deterministic gate could enforce automatically.
- Leaving a repeatedly-missed behavior at the prompt rung "for now" — it will recur next session.
- Relaxing a deterministic gate back into advisory prose to reduce friction.
