---
name: "customer-support-doctrine"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Customer Support Doctrine — AI-first, RESOLUTION over deflection

Support is a core business function AND a retention lever (`[[autonomous-growth-orchestrator]]` — a bad support experience churns silently). Every app we build ships support that an AI RESOLVES end-to-end, grounded + escalation-safe — never a dead-end chatbot. (Added 2026-10-25, estate-upgrade audit — `[[estate-upgrade-audit]]`; the estate's missing core-business-function rule.)

## The law — resolution, not deflection

- **Deflection LIES.** "Didn't reach a human" counts give-ups + hallucinated answers as wins. The north-star is **verified resolution = no human touched it AND the customer did NOT re-contact about the same issue within 7 days on ANY channel** (the cross-channel subtraction is what makes it honest). AI-native agentic support hits 55–70% verified resolution (70–85% with deep backend integration) vs 10–25% for a legacy ticket tool + an AI add-on — a structural 3–7× gap.
- **Agentic, not a FAQ bot:** the agent reads the KB → looks up the customer's order → executes the fix → updates + closes the ticket, end-to-end. A reply that quotes the return policy and goes quiet has deflected, not resolved.

## Grounding is the #1 control (never ship an ungrounded support LLM)

- Ungrounded models hallucinate in **15–30% of support answers**; grounding cuts it to **<5%**. The agent answers ONLY from the knowledge base / a live system-of-record lookup (RAG), **cites the chunk** behind every factual claim, and says **"I don't know" → escalates** below a confidence threshold rather than inventing. Route every response through a context guard: a claim not backed by retrieved context / a tool result / a known rule is BLOCKED or sent to review. (Per `[[verify-against-source-of-truth]]` + `[[ai-abundance-maximalism]]` grounded-generation + `[[contract-first-ai]]`.)
- **Liability is real** — a wrong answer can bind you (the Air-Canada-chatbot precedent). A fabricated refund amount / wrong policy outweighs a vague wording; weight errors by consequence.
- **The KB is the foundation** — audit it before go-live (outdated/contradictory docs → hallucinations); build it from the questions customers ACTUALLY ask.

## Escalation is a FEATURE, not a failure

- **Firm, unconditional triggers:** detected frustration / repeated rephrasing · 2nd–3rd contact on the same issue · any policy-exception request · high-value order or top-tier account · emotional/medical/legal/safety content · below-confidence-threshold. Reliable systems route the unknown to a human rather than generate something plausible.
- **Implementation pattern — the firm-trigger override must be DETERMINISTIC, ADDITIVE, and run LAST in the resolution gate.** A confidence-gated auto-resolve/auto-send decision (`decide(): auto_resolve | handoff`) is NOT doctrine-complete with a confidence floor alone — a high-confidence KB match on a refund/legal/safety/"get me a human"/frustrated message would auto-answer it (the #1 liability). Add a pure `sensitiveHandoffReason(message, sentiment): reason|null` that fires on word-FAMILY regexes (word-boundary matched so "issue"≠"sue"; families not single phrases so a synonym can't dodge) + the AI-classified negative sentiment, and compose it as the LAST check before the final `auto_resolve` return — so it is strictly ADDITIVE (can only convert a would-be auto_resolve into a handoff, never weaken an earlier handoff) and existing callers/tests that omit the new fields stay green. Deterministic (a safety gate can't depend on a model's judgment) + erring toward handoff is the SAFE direction here (unlike a filter, over-escalation is acceptable — route the uncertain to a human). Exhaustively UNIT-test the pure gate (it's the authoritative gate — an e2e on a fresh no-KB tenant can't isolate the override, since the earlier grounding/confidence gates already hand off). Ref incident: inbox.vision fire 57 — `decideResolution` was confidence-only; added `sensitiveHandoffReason` (legal_or_safety · money_or_policy_exception · human_requested · frustration · negative_sentiment) run last + threaded the customer's latest message + `conv.sentiment` into both the `/ai-resolve` preview and `/ai-resolve/execute` callers (auto-resolve is default-OFF → zero behavior change for non-opted-in tenants); 23 pure unit tests, scans the MESSAGE body only (not the subject, which can be noisy/auto-generated).
- **Make "talk to a human" visible from the FIRST message** (never buried under menus); on handoff, transfer the FULL conversation + verified context + actions taken → humans resolve escalations 35–45% faster with complete context.
  - **A typed-keyword detector is NOT this control** — it forces the visitor to guess the magic words. The control is an ALWAYS-VISIBLE button/affordance in the chat header. Implement it reusing the EXISTING handoff pipe (flip `handling`→human + the same `conversation.handoff` webhook + live cockpit update), never a parallel one: one shared `escalateToHuman(reason, source)` core, called by both the keyword path AND the button's public endpoint (`POST /widget/:token/request-human`). Idempotent. Nuance: if conversations DEFAULT to human-handling, the button CONFIRMS connection when already-human AND genuinely escalates only when AI/automation took over — so it stays valuable in both states (show the "you're connected to our team" confirmation regardless of whether this click flipped it). Deterministically e2e-testable (force ai→then-request→assert escalated+store-reconciled→re-request idempotent). Ref: inbox.vision fire 58 — the widget had the typed-keyword `detectInboundHandoff` but NO visible button; added `iv-human` header button → `/request-human` → `requestHumanHandoff` sharing the keyword path's escalation core.
- **Read wide, write narrow:** broad READ access (orders, tickets, shipments, subscriptions) but tightly-constrained WRITE actions; any irreversible/high-stakes write (refund, cancel, credit) is HITL-gated with evidence + a full audit log of every agent action (per `[[ai-agent-security]]` least-privilege + out-of-band confirm).

## Measure a SCORECARD by intent (not one vanity number)

- Track, segmented by intent: **verified-resolution** (minus 7-day cross-channel recontact) · **unsupported-answer / hallucination rate** (sampled vs ground truth, weighted by severity) · **CSAT on AI-handled chats** · **recontact rate** · **cost-per-resolution**. A high deflection number + falling CSAT = customers giving up. Per `[[production-observability-default-on]]` + `[[evals]]`.
- **Retire the AI from weak intents:** if AI-CSAT on an intent falls >10 pts below the human baseline, OR accuracy <90% with hallucinations >2% → route that intent back to humans, fix the KB gap, re-enable. Deflection >60% deserves scrutiny (confirm it's solving, not stalling).

## Support → product feedback loop

- Hallucination clusters flag exactly which KB/docs/product surfaces are weak — the retire-and-fix loop IS the support→product signal. Feed recurring tickets + unresolved intents into the product backlog (per `[[interconnectedness]]` — support is a product signal, not a cost center) and self-serve docs (per `[[embarrassingly-easy-to-use]]` — the best ticket is the one a visible self-serve answer prevented).

## CF-native stack (estate default)

- **Retrieval/grounding:** `[[ai-search-knowledge-fabric]]` (Cloudflare AI Search over the KB in R2) is the grounded-answer layer — it already exists; point the support agent at it. **Model:** Workers AI `env.AI` (customer-facing product axis per `[[ai-abundance-maximalism]]`). **Actions:** typed tools (refund via `[[payments]]`, account changes) behind the write-narrow gate. **Channel:** a Worker chat endpoint + an MCP App surface (`[[ai-abundance-maximalism]]` § MCP Apps) so the agent can render an actionable card, not a wall of text. **Observability:** Langfuse traces + the scorecard. Don't reach for Fin/Decagon/Sierra by default — build CF-native; name a managed vendor only on explicit request.

## Cross-links

`[[autonomous-growth-orchestrator]]` (support = retention) · `[[ai-agent-security]]` (untrusted input, write-narrow, HITL) · `[[verify-against-source-of-truth]]` + `[[ai-abundance-maximalism]]` (grounded generation) · `[[ai-search-knowledge-fabric]]` (the KB retrieval layer) · `[[embarrassingly-easy-to-use]]` (visible self-serve + escalation) · `[[saas-feature-completeness]]` (support is table-stakes SaaS) · `[[estate-upgrade-audit]]`.
