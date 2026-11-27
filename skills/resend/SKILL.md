---
name: resend
description: "Resend API skill — auto-forged from OpenAPI 1.5.0. Resend is the email platform for developers."
triggers: ["resend API", "working with Resend"]
version: 1.0.0
forged-from: openapi
api-title: Resend
api-version: 1.5.0
---

# Resend API Skill

<!-- commands-collapsed -->
> **Per-endpoint pages collapsed.** The 83 `commands/*.md` files (one per endpoint) were removed to cut file count — they were forge-generated, unrouted, and reproduce what Context7 (live API docs) and the typed `client.ts` already provide (some integrations also expose a live MCP server). The **Slash Commands** inventory below is retained.
> Restore full offline curl/param detail any time: `node bin/forge-skill-from-openapi.mjs <spec-url> skills/resend --name resend`.


Auto-forged from the Resend OpenAPI spec (v1.5.0).

## What this skill provides

- **83 slash commands** — one per API endpoint, with curl examples and typed guidance
- **`types.ts`** — TypeScript types auto-generated from OpenAPI schemas
- **`client.ts`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

- `/get-emails` — Retrieve a list of emails
- `/post-emails` — Send an email
- `/get-emails-email-id` — Retrieve a single email
- `/patch-emails-email-id` — Update a single email
- `/post-emails-email-id-cancel` — Cancel the schedule of the e-mail.
- `/post-emails-batch` — Trigger up to 100 batch emails at once.
- `/get-emails-email-id-attachments` — Retrieve a list of attachments for a sent email
- `/get-emails-email-id-attachments-attachment-id` — Retrieve a single attachment for a sent email
- `/get-emails-receiving` — Retrieve a list of received emails
- `/get-emails-receiving-email-id` — Retrieve a single received email
- `/get-emails-receiving-email-id-attachments` — Retrieve a list of attachments for a received email
- `/get-emails-receiving-email-id-attachments-attachment-id` — Retrieve a single attachment for a received email
- `/get-domains` — Retrieve a list of domains
- `/post-domains` — Create a new domain
- `/get-domains-domain-id` — Retrieve a single domain
- `/patch-domains-domain-id` — Update an existing domain
- `/delete-domains-domain-id` — Remove an existing domain
- `/post-domains-domain-id-verify` — Verify an existing domain
- `/get-api-keys` — Retrieve a list of API keys
- `/post-api-keys` — Create a new API key
- `/delete-api-keys-api-key-id` — Remove an existing API key
- `/get-templates` — Retrieve a list of templates
- `/post-templates` — Create a template
- `/get-templates-id` — Retrieve a single template
- `/patch-templates-id` — Update an existing template
- `/delete-templates-id` — Remove an existing template
- `/post-templates-id-publish` — Publish a template
- `/post-templates-id-duplicate` — Duplicate a template
- `/get-audiences` — Retrieve a list of audiences
- `/post-audiences` — Create a list of contacts
- `/get-audiences-id` — Retrieve a single audience
- `/delete-audiences-id` — Remove an existing audience
- `/get-contacts` — Retrieve a list of contacts
- `/post-contacts` — Create a new contact
- `/get-contacts-id` — Retrieve a single contact by ID or email
- `/patch-contacts-id` — Update a single contact by ID or email
- `/delete-contacts-id` — Remove an existing contact by ID or email
- `/get-broadcasts` — Retrieve a list of broadcasts
- `/post-broadcasts` — Create a broadcast
- `/get-broadcasts-id` — Retrieve a single broadcast
- `/patch-broadcasts-id` — Update an existing broadcast
- `/delete-broadcasts-id` — Remove an existing broadcast that is in the draft status
- `/post-broadcasts-id-send` — Send or schedule a broadcast
- `/get-webhooks` — Retrieve a list of webhooks
- `/post-webhooks` — Create a new webhook
- `/get-webhooks-webhook-id` — Retrieve a single webhook
- `/patch-webhooks-webhook-id` — Update an existing webhook
- `/delete-webhooks-webhook-id` — Remove an existing webhook
- `/get-segments` — Retrieve a list of segments
- `/post-segments` — Create a new segment
- `/get-segments-id` — Retrieve a single segment
- `/delete-segments-id` — Remove an existing segment
- `/get-topics` — Retrieve a list of topics
- `/post-topics` — Create a new topic
- `/get-topics-id` — Retrieve a single topic
- `/patch-topics-id` — Update an existing topic
- `/delete-topics-id` — Remove an existing topic
- `/get-contact-properties` — Retrieve a list of contact properties
- `/post-contact-properties` — Create a new contact property
- `/get-contact-properties-id` — Retrieve a single contact property
- `/patch-contact-properties-id` — Update an existing contact property
- `/delete-contact-properties-id` — Remove an existing contact property
- `/get-contacts-contact-id-segments` — Retrieve a list of segments for a contact
- `/post-contacts-contact-id-segments-segment-id` — Add a contact to a segment
- `/delete-contacts-contact-id-segments-segment-id` — Remove a contact from a segment
- `/get-contacts-contact-id-topics` — Retrieve topics for a contact
- `/patch-contacts-contact-id-topics` — Update topics for a contact
- `/get-logs` — Retrieve a list of logs
- `/get-logs-log-id` — Retrieve a single log
- `/get-automations` — Retrieve a list of automations
- `/post-automations` — Create an automation
- `/get-automations-automation-id` — Retrieve a single automation
- `/patch-automations-automation-id` — Update an automation
- `/delete-automations-automation-id` — Delete an automation
- `/post-automations-automation-id-stop` — Stop an automation
- `/get-automations-automation-id-runs` — Retrieve a list of automation runs
- `/get-automations-automation-id-runs-run-id` — Retrieve a single automation run
- `/get-events` — Retrieve a list of events
- `/post-events` — Create an event
- `/post-events-send` — Send an event
- `/get-events-identifier` — Retrieve a single event
- `/patch-events-identifier` — Update an event
- `/delete-events-identifier` — Delete an event

## Usage

```ts
import { ResendClient } from './resend/client.js';

const client = new ResendClient(process.env.RESEND_API_TOKEN!);
```

## Auth pattern

Set `API_TOKEN` (or the env var specific to this API) before running any command.
All generated curl examples use `-H "Authorization: Bearer $API_TOKEN"`.

## Maintenance

- **Re-forge**: `node ~/.agentskills/bin/forge-skill-from-openapi.mjs <spec-url> skills/resend --name resend`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits in `commands/*.md` survive if you rename the file.

## Source

Generated 2026-06-18 by forge-skill-from-openapi.
Spec: https://api.resend.com

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Domain Swarm Directive**: Decompose work into contract-locked OpenSpec DAG nodes, convene a right-sized SCRUM quorum (`claude` + `codex` + `gemini`) for key decisions, and offload all throughput-safe implementation, plugin catalogs, unit tests (100% coverage), and parallel Cloudflare Browser Run E2E suites to `opencode` (DeepSeek) swarms.
- **Massive OpenCode (DeepSeek) Offload**: Whenever a task slice is throughput-safe (bounded implementation, plugin catalog shards, 100% unit test generation, Playwright E2E specs, migrations, or documentation), offload it to parallel **`opencode` swarms powered by DeepSeek** (`~/.agentskills/bin/opencode-deepseek.sh` via the LiteLLM 4-key pool `https://llm.megabyte.space/v1`) rather than consuming premium `claude`, `codex`, or `gemini` client quota.
- **Tri-Frontier Parallel Swarms & Right-Sized SCRUM Quorum**: When complex architectural synthesis, speculative critical-path racing, or adversarial verification is needed, run `claude`, `codex`, and `gemini` in parallel across isolated Git worktrees (approved host adapters for `bin/evidence-gated-orchestrator.ts`) guided by a right-sized collaborative SCRUM meeting (`bin/scrum-deliberation-quorum.ts`) of only the required specialist agents. See `rules/parallel-multi-swarm-orchestration.md`.
- **End-of-Round Parallel Meaning & Preference Triad Extraction (`bin/triad-end-of-turn-sync.ts`)**: At the end of every prompt round (running in parallel with final verification, deployment, and reporting), extract any possible meaning, preference, architectural lesson, reusable site code, or system configuration from the current agent window and store it concurrently into **`heymegabyte/agent-skills`** (for AI skills/rules/prompts — always updated under the **Minimum-Prompt Ecosystem Completeness Assumption**: assuming the skills *should have already been written* so that we write **as few prompts as possible** to finish **as complete a product or multi-repo ecosystem as possible** via massive parallel agent swarms), **`heymegabyte/theme.tools`** (for reusable site/app code across the 28 canonical `@theme.tools/*` libraries), and **`heymegabyte/install.doctor`** (for reusable system/host code).
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
