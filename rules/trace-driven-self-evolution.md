---
last_reviewed: 2026-10-29
superseded_by: null
name: trace-driven-self-evolution
description: Automated, trace-driven evolutionary optimization of prompts/skills/tool-descriptions (GEPA/DSPy) — the automated complement to the manual improvement-audit; read execution traces to understand WHY it failed, propose targeted mutations, Pareto-select, gate hard, PR never direct-commit. Absorbed from NousResearch/hermes-agent-self-evolution.
pack: "ai"
priority: 3
triggers:
  - "self-evolution"
  - "self-evolving"
  - "GEPA"
  - "DSPy"
  - "evolve the prompt"
  - "evolve a skill"
  - "optimize prompt"
  - "prompt optimization"
---

# Trace-Driven Self-Evolution (automate the improvement-audit for AI prompts/skills)

When a surface is an AI PROMPT / SKILL / tool-description with a MEASURABLE eval signal + real EXECUTION TRACES, automate the [[improvement-audit]] loop instead of hand-generating candidates: read the traces to understand WHY it fails, propose TARGETED mutations, evaluate on a dataset, and Pareto-select the best — a reflective evolutionary search. Absorbed from `NousResearch/hermes-agent-self-evolution` (GEPA + DSPy, MIT, ICLR 2026 Oral); it is the automated sibling of our manual 30-candidate audit, not a replacement for judgment.

## When to reach for it (vs the manual improvement-audit)

- Target has a measurable eval signal (a dataset / rubric / Promptfoo suite) AND real execution traces to learn from → automate.
- No eval signal or no traces → use the MANUAL [[improvement-audit]] (30-candidate, 10-factor) instead; never fabricate a dataset to look rigorous.
- Good targets: a skill's `SKILL.md`, a system-prompt section, a tool description, a router/generation prompt with a known failure class.
- NOT for safety-/money-/auth-critical prompts without heavy human review — a mutated prompt is still an untrusted change ([[ai-agent-security]]).

## The loop (reflective, not blind)

- Read the CURRENT prompt/skill, then generate or pull an eval dataset — prefer REAL session history over synthetic where available.
- Run it, capture EXECUTION TRACES; the optimizer reads the traces to understand WHY a case failed (not merely THAT it failed) and proposes TARGETED edits — reflective mutation beats random.
- Keep a PARETO FRONTIER of diverse winners (Genetic-Pareto), not a single "best" — it preserves variants strong on different cases.
- Evaluate each candidate on the dataset, select, iterate a BOUNDED number of rounds.
- Economy: API-only, NO GPU, ~$2-10/run — run the mutation/eval loop on DeepSeek-via-OpenCode (cheap throughput, [[agent-provider-policy]]); reserve frontier models for the final judge.

## Guardrails (NON-NEGOTIABLE — these are already OUR gates; GEPA slots into them)

- **Full test/eval suite passes 100%** — a variant that regresses any case is rejected.
- **Size limits** — a skill stays small (Hermes caps ≤~15KB; tool descriptions ≤~500 chars); evolution must not bloat — and NEVER grow an always-loaded (`pack: core` / `priority: 1`) rule past the always-load budget.
- **Caching compatibility** — NO mid-conversation prompt mutation (it busts [[prompt-cache]]); evolve BETWEEN sessions and pin the winner.
- **Semantic preservation** — the variant must not drift from the original PURPOSE; eval against the purpose, not just the metric (a metric-gamed prompt is a 🚫).
- **NEVER direct-commit** — every evolved variant lands via a reviewed PR / independent diversity review ([[autonomous-engineering]] review tier, main-first), never auto-merged into a canonical skill.
- **Provenance + rollback** — record the parent revision + the eval delta; keep the prior version so a regression is one revert away.

## Provenance + licenses (absorb the PRACTICE; isolate AGPL code)

- GEPA (`gepa-ai/gepa`, MIT) + DSPy (`stanfordnlp/dspy`, MIT) = the reflective-evolution engines — safe to adopt/reference.
- Darwinian Evolver (`imbue-ai/darwinian_evolver`, AGPL v3) = code evolution — EXTERNAL CLI ONLY, never vendored into a proprietary repo ([[agpl-isolation-via-http-boundary]]).
- Absorbed from `NousResearch/hermes-agent-self-evolution` (MIT) per [[upstream-absorption-register]]; this rule is the adapted PRACTICE, not an installed pipeline.

## Cross-links

[[improvement-audit]] (the manual engine this automates) · [[evals]] + Promptfoo (the eval signal it optimizes against) · [[prompt-cache]] (why no mid-conversation mutation) · [[agent-provider-policy]] (cheap DeepSeek for the loop) · [[upstream-absorption-register]] (provenance) · [[agpl-isolation-via-http-boundary]] (Darwinian Evolver) · [[prompt-as-training-signal]] (the inward lesson-capture complement).
