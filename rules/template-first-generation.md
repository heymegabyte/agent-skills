---
last_reviewed: 2026-11-16
superseded_by: null
name: "template-first-generation"
priority: 2
pack: "ai"
triggers:
  - "ai generation"
  - "template-first"
  - "fill the page"
  - "one page fit"
  - "over-generates"
  - "ai output constraint"
  - "ai doc generation"
paths:
  - "concern:ai-features"
---

# Template-First Generation — Deterministic Structure, AI Fills the Slots

When an AI output must satisfy a HARD STRUCTURAL CONSTRAINT (fit exactly one page, match a fixed schema, stay within a bounded size, look like a known template), do NOT rely on prompt instructions + a runtime fixup to enforce it. Make the STRUCTURE deterministic and have the model fill only the VARIABLE content. Prompt-tweaking + post-hoc scaling can STEER output but cannot GUARANTEE a hard constraint; a fixed structure with length-clamped slots can.

Cross-links: `[[contract-first-ai]]` · `[[verify-against-source-of-truth]]` · `[[verification-loop]]` · `[[predictive-completeness]]` · `[[first-time-excellence]]` · `[[kill-the-cliche]]`

## The principle

- **Prompt instructions are a bias, not a guarantee.** Few-shot exemplars + a SYSTEM prompt out-vote a per-turn "keep it to one page" note; the model regresses to its dominant pattern. A runtime fixup (auto-scale, truncate) can only rescue a near-miss, never a 3× over-run.
- **Split the output: fixed shell + variable fill.** Author a deterministic template (a fixed component tree / layout / schema) that MEETS the constraint by construction. The model returns only the copy/data for labelled slots; the template renders it.
- **Clamp every slot.** Bounded slots × fixed structure = bounded output = the constraint holds even at the model's worst case. Hard-clamp lengths/counts in code (the guarantee lives in the renderer, not the prompt).
- **Parse robustly + fall back.** Have the model emit simple labelled fields (`KEY: value`, repeatable rows) — far more reliable on a mid-tier model than strict JSON. On a parse miss, fall back to the free-form path so template-first is NEVER worse than today.
- **Route conservatively.** Only divert to the template when the request clearly matches (explicit create-intent + type word; skip when a competing noun precedes). A miss just means the old behaviour; a false divert mangles an unrelated doc.
- **The fit/shape is then offline-testable** (no model, no quota): render worst-case slot values through the real renderer in a real browser and assert the constraint. This is the deterministic proof prompt-tweaking could never provide.

## Verify generation changes with a LIVE end-to-end run — offline injection hides gate bugs

- **Offline injection (inject a crafted doc → measure) proves the RENDERER, not the ROUTE.** It structurally cannot catch a gating bug in "when does the template path fire." Always run ONE real end-to-end generation against prod before calling it done (`[[verification-loop]]`).
- **Fresh-vs-edit is "first turn" (no history), NOT "content is empty."** Editors seed a non-empty STARTER placeholder, so an empty-content gate reads the FIRST prompt as an edit and skips the new path. A real edit always has prior conversation; the first generate never does.

## Anti-patterns

- Trying to force a hard output constraint with prompt wording + more exemplars (it regresses).
- Relying on a runtime auto-fix (scale/truncate) to rescue output that over-runs the constraint by a wide margin.
- Shipping a generation-path change verified ONLY by offline injection — the route/gate is untested.
- Gating "generate from scratch" on empty content when the surface seeds a placeholder.

## Reference incident (pdf.kitchen, 2026-11-16)

"Make a flyer" over-generated to 4–6 pages of editorial density that runtime auto-fit couldn't rescue (scaling 4→1 fell below the legibility floor). Prompt-tweaking the per-turn note never got it to 1 page (few-shot exemplars out-voted it). Fix = template-first: `detectPromoType` → the model fills labelled copy slots → a fixed flex-column template (`renderPromo`) with length-clamped slots → guaranteed 1 page, flag-gated with a free-form fallback. The deterministic fit was proven offline (worst-case slots → 1 page in a browser). The LIVE E2E then caught a gate bug offline injection had missed: the guest editor seeds a non-empty `STARTER_HTML`, so the "currentHtml empty = fresh" gate skipped template-first on the first prompt (→ 6-page free-form); the fix was to gate on `history.length === 0`.
