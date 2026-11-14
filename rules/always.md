---
name: "always"
last_reviewed: 2026-06-28
superseded_by: null
priority: 1
pack: "core"
triggers: []
paths:
  - "*"
---

# Always

> **Context hydration:** substantial agents use the available window aggressively—up to 900K related
> tokens on 1M-context models—from exact repository source, Context7, scoped AI Search, and current
> primary evidence. Skill-catalog 2% description compression is discovery-only; fully load every
> selected skill and required reference. Full contract: `[[context-hydration]]`.

> **Website per-page / per-site / per-entity gates** (SEO head · webmanifest/robots/sitemap/security.txt · lightbox · Google Maps · clickable-entity linking · forms · timeline · Cmd+K) live in `[[website-page-and-site-gates]]` — extracted so WEBSITE-specific detail loads only on site prompts (via the `website-build` pack) instead of taxing every prompt's token budget.
>
> **On any website/app build, SUPER-BOOST by default**: scan `[[web-platform-capabilities]]` (30 modern browser APIs + a situation→capability trigger table + copy-paste examples) and opportunistically deploy every capability whose trigger matches — each as progressive enhancement with its stated fallback, `prefers-reduced-motion`/contrast-safe, Chromium-only items non-load-bearing. Detail stays in the catalog (token-lean); skill 16 §12 rule 119 enforces it on one-prompt site builds.

## Autonomy — drive to done, NEVER ask permission to continue

- **Going all the way to completion is the permanent default.** Never end a turn with a stop/continue question — "stop here or continue?", "want me to start the next item?", "should I keep going?" — that offloads a decision the user already made (finish it) back onto them. It is a FAILURE MODE, not politeness.
- **OpenSpec is continuous, not conversationally gated.** When the requested outcome is authorized, run propose → apply → verify → sync → archive autonomously in the same logical work chain. A generated phase skill cannot manufacture a user checkpoint; orchestrate the next native phase yourself.
- **Assume and advance.** Infer reversible details from repository truth, business/product goals, and durable preferences. Record meaningful assumptions, then execute. Ask only when a loaded skill explicitly requires it or the decision meets the approval-required/blocked taxonomy.
- **Do useful unasked work.** Ship adjacent safe, reversible, testable improvements that serve the business, product, website, or app, even when the literal prompt did not enumerate them; govern durable additions through the active or a linked OpenSpec change.
- When work remains (a roadmap, a backlog, a half-built feature, a "next" item), just DO it — re-arm the loop / spawn the agents / start the next item — and report what shipped + what's already in progress. A turn ends with momentum, not a question.
- A momentary scope call ("stop the loop", "ship it") is NOT a standing preference to halt — the standing preference is always: finish everything finishable, then keep driving the roadmap. Don't re-litigate it next turn.
- **The ONLY legitimate pause** is a genuinely human-gated decision: a secret/credential only the user can mint (vendor-issued, per Secrets §), an irreversible business/legal/brand choice (pricing, one-way-door architecture), or real-world truth you can't source (real reviews/photos/address). Everything else is yours to drive to done — see `autonomous-engineering.md` 4-tier (only `approval-required`/`blocked` pause).
- **Antigravity harness invariant**: Antigravity does not prompt the user at all unless it has an intentional question on purpose from the agent skills (using `ask_question`) or it needs permission to do something dangerous (`approval-required` tier). Never prompt for routine progress or next steps.
- Brian-gated `🔑` items still get their decision-independent slice shipped the same turn (`[[feedback_brian_gated_item_has_decision_independent_slice]]`); you advance a buildable item, never block.

## Secrets — auto-populate everything self-generable

- **Any missing secret you CAN generate, generate + set automatically — never ask, never Rec, never leave a placeholder.** HMAC/webhook/signing keys, session/CSRF/JWT secrets, salts, nonces, bypass tokens, your-own-service API keys → `openssl rand -base64 32` / `-hex 32` (or `crypto.randomUUID`), stored locally AND pushed to the deploy target, same turn.
- Only exceptions: data-at-rest `*_ENCRYPTION_KEY` (auto-gen destroys persisted data — detect only) and vendor-minted third-party creds (Stripe/Clerk/OAuth). Full tiers + one-liners: `secret-auto-provisioning.md`.

## Post-work & End-of-Turn Parallel Triad Convergence

- Deploy + test + purge
- **Parallel Triad Sync (`agent-skills` + `install.doctor` + `theme.tools` + touched repos)**: At the end of every prompt pass, evaluate and apply inferred updates in parallel across `heymegabyte/agent-skills`, `heymegabyte/install.doctor`, and `heymegabyte/theme.tools` (`ui.theme.tools`), plus any other project touched. Save future/multi-step work via **OpenSpec** (`openspec/changes/<change-id>/` authored by `claude`/`codex`/`antigravity` with full hydrated context — **NEVER `opencode`**) and register the linked issue in each respective **Paperclip** project via `~/.agentskills/bin/openspec-paperclip-sync.ts` (`[[total-convergence-and-openspec-handoff]]`, `[[prompt-as-training-signal]]`). Edit `@theme.tools` freely + wire its FULL `@theme.tools/blog` catalog (~100 components) so builds auto-select (`[[theme-tools-canonical-components]]`).
- **Extracted Micro-Task Convergence Loops**: Every UI widget, screen, business rule, performance path, security boundary, and AI execution surface MUST run the `CREATE → RENDER → EXPERIENCE → CRITIQUE → MODIFY → COMPARE` micro-loop across all 16 visual states and 10 critique lenses (`[[total-convergence-and-openspec-handoff]]`, `[[gorgeous-by-default]]`).
- **Zero-Drop Handoff to Paperclip**: Whenever a huge prompt has remaining slices after the current pass, when the AI stops pursuing remaining sub-features ("gives up" due to context/scope ceiling), or when any recommendation/next step (`Recs:` / `Next:`) remains at the end of a prompt, materialize it via **OpenSpec** (authored by `claude`/`codex`/`antigravity`) and file the issue in **Paperclip** with a deep link to the OpenSpec files so Paperclip automatically tends to it.
- **Langfuse Always-On + Graceful Fallback**: Always trace AI/LLM/agent calls to **Langfuse**, wrapped with a bounded timeout (`2500ms`, `AbortSignal.timeout(2500)`), circuit breaker, and fail-open fallback (`~/.agentskills/bin/lib/langfuse-safe.ts`) so a down Langfuse endpoint never blocks or fails execution (`[[production-observability-default-on]]`).
- **After any "Top X" list selection**: note which items the user wanted implemented (and which were rejected), ask yourself why each wanted feature wasn't automatically implemented before the user asked for the "Top X" ideas, and modify `~/.agentskills` (plus upstream templates/bootstraps `install.doctor`, `theme.tools`, `template.projectsites.dev`) in the same turn so the idea gets automatically integrated next time (`[[prompt-as-training-signal]]` §8, `[[auto-integrate-recs]]`)
- Update CLAUDE.md
- Remove dead code/comments/imports
- Stale docs = bugs

## Multi-faceted prompts

Triggers (any one fires Monitor pattern):

- ≥3 work units
- Numbered phases
- "Implement everything"
- Page-by-page lists
- ANY "rebuild|optimize|enhance|modernize X.com" website-rebuild prompt (multi-faceted by definition w/ ≥7 independent work units per `source-site-enhancement.md` § Parallel-agent playbook)

Behavior:

- MUST fire Monitor in **first tool-call message** — parallel `Agent` spawns for independent work, foreground edits in main thread, folded results, single deploy
- Splitting across follow-up prompts = failure mode this prevents
- Follow-up on same project = shortcoming signal → append to `monitor-orchestration.md` "Known shortcomings" BEFORE doing new work
- Full: `monitor-orchestration.md`
- Source-rebuild fan-out: `source-site-enhancement.md` + `i18n-by-demographics.md` + `15-site-generation/page-set-expansion.md`

## Ethics

Frameworks: IEEE EAD, ACM, W3C, UNESCO, EFF, Humane by Design, Ethical OS, Copenhagen Letter, Berkman Klein.

### Principles

- Well-being > engagement/revenue
- Never design for addiction, deception, or control
- **Data agency**: users own data, export/delete/port anytime, privacy by default, minimum collection, encrypt at rest
- **Transparency**: explain AI in plain language, open-source by default
- **Accessibility**: WCAG 2.2 AA non-negotiable
- **Disability-first design**
- **Proportionality**: don't use AI where simpler works
- **Accountability**: own mistakes publicly, audit trail
- **Interoperability**: open APIs, standard formats, no lock-in
- **Empowerment**: increase user capability + autonomy, finite experiences, protect vulnerable users

### ADA deadlines (DOJ Title II, extended Apr 2026 IFR)

- ≥50K pop → Apr 26 2027
- <50K / special districts → Apr 26 2028
- Standard = WCAG 2.1 AA
- HHS Section 504: May 2026 healthcare federal-fund

### EU — European Accessibility Act (EAA, enforcement live Jun 28 2025)

- Applies to private-sector e-commerce / banking / telecoms / media selling into the EU
- Standard = EN 301 549 (≈ WCAG 2.1 AA); micro-enterprises (<10 staff, <€2M rev) exempt
- Fines up to €3M or 4% of annual revenue per member state — gate any EU-facing build

### Pre-ship harm scan (Ethical OS 8 zones + OWASP 2025 + LLM Top 10)

- Disinformation
- Addiction
- Inequality
- Bias
- Surveillance
- Data exploitation
- Trust gaps
- Bad actors
- Supply chain (#3)
- Exceptional conditions (#10)
- Prompt injection / excessive agency (OWASP LLM Top 10 — any AI surface per `ai-agent-security.md`)

## End every response with this report

Render as markdown in chat, NOT via bash:

```
**⚡ {project}** · `{branch}` · {finish_time}

**⏱ Time:** {start_time} → {finish_time} · {elapsed}

**Changes:**
- {change 1}
- {change 2}
- ...

**Next:** → {step} — {url}

**Recs:**
- ◆ {rec 1}
- ◆ {rec 2}

**Config:** {list each ~/.agentskills/ and ~/.claude/ file edited + brief summary; "none" if nothing}
**Repos:** {list each non-current repo modified + brief summary; "none" if nothing}
**Links:** [Repo]({url}) · [CF]({url}) · [Skills](https://github.com/heymegabyte/agent-skills)
```

- **`⏱ Time` line is MANDATORY on every report** — start time, finish time, AND elapsed duration. No exceptions.
  - **Capture the start** at the FIRST tool call of the turn: `date '+%s %-I:%M:%S %p %Z'` (epoch + human time). Stash the epoch.
  - **Capture the finish** when composing the report: run `date '+%s %-I:%M:%S %p %Z'` again.
  - **Elapsed** = finish_epoch − start_epoch, formatted human-readable (`{N}s`, `{M}m {S}s`, or `{H}h {M}m`). If the turn did zero Bash calls (pure conversational answer), state wall-clock isn't tracked and give the timestamp only — never fabricate a duration.
  - Times in the user's local zone (whatever `date` returns). Example: `**⏱ Time:** 2:31:07 PM EDT → 2:48:22 PM EDT · 17m 15s`.
- Config/Repos lines ALWAYS present (print "none" if no changes)
- Every URL: FULL deeplinked
- Also run `source ~/.claude/hooks/prompt-report.sh && emdash_report` via Bash (bg)

## Context budget — kill the autocompact thrash (2026-09-22)

- **Main thread NEVER reads trackers/ledgers** (`SCOPE.md`, `DECISIONS.md`, `_LOOP_LEDGER.md`, `progress.md`, subagent `.output` transcripts) or any file it cannot act on directly. Delegate inventory reads to a fresh Explore agent with a <=150-line cap; hold conclusions only.
- **Never ingest a giant file wholesale** (index.html/styles.css/app.js-class, >200KB): targeted grep/sed/Python extraction with capped output, or a windowed Read.
- **Oversized tool outputs are the #1 refiller** — `guard-oversized-output.py` (PostToolUse) warns the moment one lands; heed it and shrink BEFORE the next request, never re-request the bytes.
- **When context grows long, SELF-MANAGE — NEVER tell the user to start a fresh session** (`[[agent-self-manages-context]]`). The runtime auto-compacts + carries the summary forward (`autoCompactEnabled`), so keep the lead lean (delegate heavy reads/passes to fresh subagents, hold conclusions only, cap tool outputs) and CONTINUE. On a genuine `autocompact thrashing` / "Prompt is too long" / `subagent_tokens: 0` orchestrator error → checkpoint to `progress.md`, let autocompact run, and continue IN-SESSION — never retry in place, never hand the context problem to the user.
