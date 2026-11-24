# Serene Paperclip + OpenClaw + `cr` + `agent-skills` Recursive 15-Idea Convergence Loop

> **Self-Driving Prompt & Autonomous Execution Contract**
> Invoke via: `node --experimental-strip-types ~/.agentskills/bin/serene-convergence-loop.ts`

## Mission & Loop Termination Rule

You are operating the **Serene Paperclip + OpenClaw + `cr` + `agent-skills` Recursive Convergence Loop**.

In each round $R \in \{1, 2, 3, \dots, N\}$:

1. **Deep Audit**: Inspect the live state of:
   - **Paperclip Control Plane (`swarml.ink`) & PostgreSQL 17 (`agent-paperclip-database-1`)**: all 114 tables (`agents`, `issues`, `heartbeat_runs`, `agent_wakeup_requests`, `routines`, `routine_triggers`, `issue_watchdogs`, `tool_connections`, `company_secrets`, `company_secret_versions`, `environment_leases`, `run_identity_contexts`, `agent_instruction_working_copies`, `agent_instruction_revisions`, `agent_instruction_heads`, `tool_mcp_gateway_tokens`, `workspace_operations`, `agent_task_sessions`, `issue_recovery_actions`, `decision_retention`, `documents`, `document_revisions`, `cost_events`, `budget_policies`, `plugins`, `execution_workspaces`, database triggers, and self-healing functions).
   - **OpenClaw Runtime (`openclaw.swarml.ink`)**: `~/.openclaw/openclaw.json`, `~/.openclaw/state/openclaw.sqlite`, `~/.openclaw/state/openclaw-quarantine.sqlite`, `~/.openclaw/agents/*/agent/openclaw-agent.sqlite`, `~/.openclaw/workspaces/*/AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `HEARTBEAT.md`, `paperclip-claimed-api-key.json`, `skills/` symlinks, and `~/.openclaw/cron/jobs.json`.
   - **OpenClaw Fleet Plugin (`openclaw-fleet`) & `cr` (`claw-router`)**: `~/.agentskills/control-plane/openclaw-fleet/cli.ts`, `cli.mjs`, `index.js`, `~/.agentskills/bin/effort-escalator.ts`, `~/.agentskills/bin/fleet-cr-sync.ts`, `~/.local/share/claw-router/bin/cr`, `providers/{claude,codex,gemini,opencode}.sh`, and `~/.config/claw-router/config.json`.
   - **Agent Skills (`~/.agentskills` & `/home/professormanhattan/ai/repos/agent-skills`)**: `bin/sync-paperclip-fleet.mjs`, `mcp-servers/paperclip-mcp-stdio-runner.mjs`, `skills/*` canonical symlinks, and `skills/emdash-skills/SKILL.md`.
2. **Formulate Top 15 Ideas for Round $R$**:
   - Propose exactly **15 concrete, non-destructive, high-leverage improvements** addressing any remaining defects, drift, bloat, fragile fallbacks, or configuration gaps discovered in the audit.
3. **Score Every Idea on the 10-Point Serene Confidence Rubric**:
   - **Evidence Certainty (0–3 pts)**: Backed by exact database query counts, log errors, or source code lines (`3` = deterministic proof, `0` = speculative).
   - **Zero-Noise / Serene Guarantee (0–3 pts)**: Eliminates background churn, prevents future errors via DB triggers/self-healing, or removes failure modes without introducing polling/noise (`3` = permanent structural prevention).
   - **Reversibility & Safety (0–2 pts)**: Preserves data integrity, active issues, credentials, and loopback/Cloudflare Access security boundaries (`2` = 100% safe and idempotent).
   - **Immediate Measurable Impact (0–2 pts)**: Measurable reduction in latency, storage bloat, error rate, or drift (`2` = verified before/after metric).
4. **Confidence Gate (`>= 8.0 / 10.0`)**:
   - **If the round's ideas have Confidence $\ge 8.0/10$**: Implement all 15 ideas immediately, verify every post-condition against live state, record the before/after metrics, and automatically proceed to **Round $R + 1$**.
   - **If the candidate ideas in Round $R$ drop below Confidence $< 8.0/10$**: **STOP**. Do not implement speculative, low-confidence, or churn-inducing changes. Output the complete round-by-round convergence report and explain why the remaining candidate ideas fall below the confidence threshold.

---

## Canonical Serene Invariants (Enforced Every Round)

1. **Zero Pointless Background Churn**:
   - `agents.adapter_config.heartbeat.enabled = false` and `intervalSec = 0` on all 29 agents (enforced by PostgreSQL trigger `trg_paperclip_disable_agent_timer_heartbeats`).
   - `0` active cron `routines` or `routine_triggers` (blocked by `trg_paperclip_block_routine_triggers`).
   - `0` `issue_watchdogs` (blocked by `trg_paperclip_block_issue_watchdogs`).
   - `agent_wakeup_requests` only permitted when attached to an active `todo` / `in_progress` / `in_review` issue (enforced by `trg_paperclip_self_heal_agent_wakeup_requests` and `trg_paperclip_auto_prune_terminal_wakeups`).
   - `0` internal OpenClaw `cron_jobs` in `openclaw.sqlite` and `~/.openclaw/cron/jobs.json`.
2. **100% Native TypeScript & Node 24 Strip-Types Compatibility**:
   - `cli.ts` is the canonical TypeScript source; `cli.mjs` is the pre-stripped ESM artifact (generated via `stripTypeScriptTypes` from `node:module`) so OpenClaw's `/node_modules/openclaw-fleet/` plugin capture directory runs with zero `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`.
3. **4-Harness + Local Fallback Routing via `cr`**:
   - `claude-1`, `claude-2`, `claude-3`, `codex`, `gemini`, `opencode` (`deepseek-v4-pro`, `glm-5.1`, `qwen-3.6-plus`), and `ollama` (`qwen2.5-coder:32b`) all route through `cr` with deterministic 4-attempt effort escalation (`medium -> high -> xhigh -> max`), automatic circuit-breaker expiry pruning (`cooldownUntilMs <= Date.now()`), and thread-pinned worktree locking.
4. **31/31 Healthy `tool_connections`, 31/31 `tool_applications`, 26/26 `tool_stdio_command_templates`, 26/26 `tool_runtime_slots`, 557 `tool_catalog_entries`, 6/6 Configured Paperclip Plugins & 54/54 `company_skill_source_entries` (`local_stdio` Hardened)**:
   - All 31 Paperclip tool connections (`26` `local_stdio` via `paperclip-mcp-stdio-runner.mjs` including `voicekit-mcp` + `3` `rest_api` + `2` `runtime_auth`, `0` `mcp_remote`) operate with `status = 'active'`, `health_status = 'ok'`, dedicated `31/31` active `tool_applications`, `32` active `connection_grants`, `26/26` matching `tool_stdio_command_templates`, `26/26` `ok` `tool_runtime_slots`, `557` cataloged tools in `tool_catalog_entries`, `6/6` configured Paperclip plugins in `plugin_config`, and `54/54` `company_skill_source_entries`.
5. **56/65 Enabled OpenClaw Plugins (`voicekit` Replaces `elevenlabs`), 18 Registered `mcp.servers`, 59 Hardened Cloudflare Free-Tier Zones, Verified Config Backup & 8192 MiB V8 Heap**:
   - OpenClaw runs **56/65** verified capability, tool, multimodal, migration & provider plugins (`fleet-cli`, `voicekit` [`$17,000` credits tier], `active-memory`, `memory-wiki`, `memory-core`, `browser`, `cua-computer`, `code-mode-quickjs`, `document-extract`, `web-readability`, `llm-task`, `oc-path`, `policy`, `file-transfer`, `linux-node`, `device-pair`, `litellm`, `ollama`, `github`, `workboard`, `anthropic`, `openai`, `google`, `clawrouter`, `migrate-claude`, `tts-local-cli`, `openrouter`, `opencode-go`, `together`, `huggingface`, `xai`, `vllm`, `sglang`, `lmstudio`, `nvidia`, `a2a`, `agentsapi`, `alibaba`, `azure-speech`, `beam`, `canvas`, `copilot-proxy`, `crabbox`, `deepgram`, `fal`, `geolocation`, `github-copilot`, `kie`, `microsoft`, `microsoft-foundry`, `migrate-hermes`, `minimax`, `runway`, `senseaudio`, `session-share`, `talk-voice` — synced via `openclaw plugins registry --refresh`), keeping `elevenlabs` and the 9 architectural/OS/security-excluded plugins disabled (`elevenlabs`, `apple-fm`, `logbook`, `imap`, `telegram`, `reef`, `bonjour`, `admin-http-rpc`, `onepassword`, `vault`), plus 18 local stdio MCP servers in `~/.openclaw/openclaw.json`, 59 Cloudflare Free-Tier hardened zones (`bin/cloudflare-free-tier-hardener.ts`: 5 Free WAF rules, 1 Rate Limit rule, 4 Edge Security Headers, Smart Tiered Cache, 13 Zone Settings), a verified backup archive in `~/.openclaw/backups`, and `--max-old-space-size=8192`.
6. **Sovereign 8-Pillar Telemetry Synchrony (`@theme.tools/telemetry` + `@theme.tools/ai-gateway` + `@theme.tools/agent-memory` + `@install-doctor/ga-gtm` + `agent-skills`)**:
   - Every agent turn correlates across all 8 observability pillars via W3C Level 1 `traceparent` (`00-<32hex>-<16hex>-01`), `tracestate`, W3C `baggage`, and recursive PII/secret scrubbing (`bin/lib/sovereign-8-pillar-agent-telemetry.ts`):
     1. **Langfuse Cloud v4 OTLP** (`/api/public/otel/v1/traces` with `x-langfuse-ingestion-version: 4`, OpenTelemetry GenAI `gen_ai.agent.*`, `gen_ai.conversation.id`, and `deepseek.is_off_peak_utc` attributes, `2500ms` `AbortSignal.timeout(2500)`, 3-strike circuit breaker, fail-open `~/.agentskills/logs/langfuse-spool.jsonl` + bounded `telemetry-spool-archive.jsonl`)
     2. **PostHog 4-Event AI Tree** (`$ai_trace` -> `$ai_span` -> `$ai_generation` + `$ai_feedback` + `maskAllInputs: true` privacy contract)
     3. **Sentry** (Envelope v7 `application/x-sentry-envelope` with FNV-1a fingerprinting)
     4. **GA4** (Measurement Protocol `/mp/collect` with sanitized `<=40` char snake_case parameters & `_ga` cookie `transaction_id` server purchase deduplication)
     5. **GTM** (Consent Mode v2 5-flag state builder & `gcs` [`G100`/`G101`/`G110`/`G111`] + `gcd` wire parameter encoder defaulting ad flags to `'denied'` under GDPR/GPC)
     6. **Cloudflare** (First-Party Worker Telemetry, Core Web Vitals RUM & AI Gateway Proxy `/ph/*`, `/g/collect`, `/gtm/*`, `/api/telemetry/sentry`, `/api/public/otel/v1/traces`, `/ai-gateway/*`, `/cwv/beacon`)
     7. **OpenTelemetry** (W3C `traceparent` + `tracestate: themetools=1,paperclip=1,openclaw=1` + W3C `baggage`)
     8. **Promptfoo** (`13/13` synthetic fleet evaluation assertions verified via `fleet-control.ts promptfoo-eval`)
7. **Direct Live `agent-skills` Symlinks**:
   - All 53 skills in `/home/professormanhattan/ai/repos/agent-skills/skills/` resolve to live git-tracked directories in `agent-skills` (zero links to frozen `~/.paperclip/.../__versions__/` snapshots), and all 35 OpenClaw workspaces (`29` role agents + `1` main + `5` project repos) have deduplicated `AGENTS.md`, `paperclip-claimed-api-key.json`, and `skills/` symlinks.
8. **Zero Orphaned Telemetry, Completed Issue Backlog, Routine Health-Check Audit Noise, or Storage Bloat**:
   - Historical `done` and `cancelled` Paperclip issues (and their dependent contracts, documents, revisions, pipeline cases, and runs) are automatically pruned by `fn_paperclip_prune_operational_telemetry(3)` and `trg_paperclip_auto_prune_on_issue_done`.
   - Routine `outcome = 'success'` health-check and credential-resolution rows (`tool_connection.health_check`, `tool_connection.credential_resolution`) are dropped before insert by `trg_paperclip_drop_routine_healthcheck_audit_noise` while preserving all `failure`, `policy_decision`, and `tool_invocation` audit events.
   - `company_secret_versions` retains only the current active version per secret (`trg_paperclip_prune_old_secret_versions`), and `document_revisions` / `agent_instruction_revisions` retain only active head revisions.
   - High-volume audit/log tables (`activity_log`, `tool_access_audit_events`, `secret_access_events`, `plugin_job_runs`, `plugin_entities`, `connection_event_deliveries`, `heartbeat_runs`, `heartbeat_run_events`, `agent_wakeup_requests`, `workspace_operations`, `environment_leases`, `run_identity_contexts`, `agent_instruction_working_copies`, `tool_mcp_gateway_tokens`, `agent_task_sessions`) are continuously pruned so old data never accumulates.
   - OpenClaw SQLite databases (`openclaw.sqlite` and `agents/*/agent/openclaw-agent.sqlite`) are checkpointed (`PRAGMA wal_checkpoint(TRUNCATE)` both before and after `VACUUM`), pruned of unbounded `memory-core` ephemeral cache rows and old FTS transcript rows, and vacuumed with zero orphaned timer session events.
