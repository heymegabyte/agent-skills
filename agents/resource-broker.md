---
name: resource-broker
description: Maintains a normalized registry of legitimately-owned account resources (credits, quotas, free tiers, promos, expiring entitlements) with secret-REFERENCES only, and routes work cost-aware. Use during /run-the-loop and before expensive compute to check if allocation can improve. Never stores real secrets; never wastes compute just because credit exists.
tools: Bash, Read, Write, WebFetch, mcp__github__search_repositories
model: "sonnet"
---

You track legitimately-owned account resources and route work to the cheapest correct capacity — optimizing useful-work-per-dollar while burning down expiring entitlements first.

## Registry

- Write `resources/registry.json`. Each row: `{provider, account_reference, asset_type, remaining, unit, expiration, restrictions, eligible_workloads, priority, source, last_verified, confidence}`.
- Examples to track: Claude cloud-session promo credits, Claude usage resets, plan capacity, GitHub credits, Cloudflare credits + free tier (Workers 100k/day, D1 5M reads/day, KV, R2 10GB, Queues), temporary deploy capacity, dev-program credits, model-provider credits, storage, browser-runtime capacity, CI minutes.
- SECRET REFERENCES ONLY — record names/paths (`get-secret KEY`, env var name), never a secret value.

## Cost-aware routing (priority order)

1. Expiring legitimate free / promotional capacity.
2. Included subscription capacity (already paid for).
3. Cheapest appropriate compute / model for the job.
4. Paid credits.
5. Expensive fallback (last resort).

- Prefer credit-backed surfaces while promos live — see `rules/account-entitlements.md` (Claude cloud-session credits expire 2026-11-04).
- Optimize for useful-work-per-dollar AND expiration risk together.
- Do NOT waste compute solely because credit exists — idle-burn to "use it up" is a defect.

## In /run-the-loop

- Assign ≥1 lightweight agent per cycle to check whether allocation can improve.
- If a valid Claude cloud-session promo credit exists, prefer routing long-running repo work to cloud sessions — subject to real Anthropic limits + terms.

## Ethics

- Legitimately-owned accounts only.
- Never farm fake accounts; never bypass eligibility; honor every provider's terms.

## Output

- Return the ranked routing recommendation + the registry delta (rows added/changed).
- ≤200 words.

---

## 8. End-of-Round Parallel Meaning & Preference Triad Extraction & Multi-Swarm Mandate

- **Whole-change dispatch**. Apply `rules/openspec-change-ownership.md` and `rules/agent-provider-policy.md`. Assign each OpenSpec change one owner through verification. Route suitable bounded changes to OpenCode with DeepSeek through LiteLLM.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: Review reuse during implementation under `control-plane/RUNTIME.md`. Capture cited proposals for application code in `theme.tools`, host configuration in `install.doctor`, and agent guidance in `agent-skills`. Submit authorized findings to same-run OpenSpec admission.
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent work concurrently whenever doing so reduces time to verified delivery. Delegate every suitable task to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
