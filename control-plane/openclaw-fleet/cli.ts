#!/usr/bin/env -S node --experimental-strip-types
/**
 * Native TypeScript OpenClaw Fleet CLI Backend (`control-plane/openclaw-fleet/cli.ts`)
 *
 * Replaces legacy `cli.py` with zero-overhead Node 24 TypeScript execution and implements:
 *   1. Unified 4-Harness routing via Claw Router (`cr`) across `claude-1`, `claude-2`, `claude-3`,
 *      `codex`, `gemini`, and `opencode` (plus `deepseek-v4-pro`, `deepseek-flash`, `hybrid-coder`, `ollama`).
 *   2. Per-account 429 / quota-exhaustion circuit breaker (`~/.claw-router/circuit-breaker.json`).
 *   3. Fast local stdio MCP config injection (`--mcp-config ~/.openclaw/fleet-mcp-config.json`).
 *   4. Cross-harness workspace handoff packet (`~/.openclaw/state/handoffs/<workspace-hash>.json`).
 *   5. Dynamic effort, turn-budget, and timeout escalation (`effort-escalator.ts`).
 *   6. Bounded 2500ms fail-open Langfuse telemetry + local JSONL spool (`~/.agentskills/logs/langfuse-spool.jsonl`).
 */

import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type ExecutionProfileTier = "throughput_fast" | "standard" | "frontier_deep";

export interface EffortEscalationPlan {
  readonly tier: ExecutionProfileTier;
  readonly taskTier: "frontier" | "throughput";
  readonly maxTurns: number;
  readonly timeoutSeconds: number;
  readonly reasoningEffort: "low" | "medium" | "high";
  readonly opencodeVariant: "fast" | "balanced" | "deep";
  readonly recommendedHarness: "claude" | "codex" | "gemini" | "opencode";
  readonly recommendedModel: string;
}

const FRONTIER_DEEP_RE =
  /(\bopenspec\/changes\/\b|\bproposal\.md\b|\bdesign\.md\b|\btasks\.md\b|\bspecs\/[a-z0-9_-]+\/spec\.md\b|\bADR-\d{4}\b|\bSTRIDE\b|\bthreat\s+model\b|\bzero-day\b|\bcritical\s+incident\b|\barchitecture\s+fixed\s+point\b|\bmulti-repo\s+convergence\b)/i;

const THROUGHPUT_FAST_RE =
  /(\bsummariz|\bsitrep\b|\bheartbeat\b|\broutine\b|\bstatus\s+card\b|\bsummary\s+slot\b|\bhygiene\b|\baudit\s+sweep\b|\bboilerplate\b|\blint\b|\bformat\b|\bseo\s+audit\b|\ba11y\s+audit\b|\bfinops\b|\bcost\s+report\b|\bchangelog\b|\breadme\b)/i;

const VISUAL_OR_MEDIA_RE =
  /(\bhyperframes\b|\bvideo\b|\bcua-driver\b|\bcomputer-use\b|\bplaywright\s+visual\b|\boklch\b|\b16-state\b|\bfigma\b)/i;

const ADVERSARIAL_OR_BACKEND_RE =
  /(\breview\b|\baudit\b|\badversarial\b|\bsecond\s+opinion\b|\bmigration\b|\bdrizzle\b|\bsql\b|\bpostgres\b|\bd1\b|\bqueue\b|\brate\s+limit\b)/i;

function computeEffortEscalationPlan(
  rawPrompt: string,
  env: Record<string, string | undefined> = process.env,
): EffortEscalationPlan {
  const wakeReason = (env.PAPERCLIP_WAKE_REASON ?? "").toLowerCase();
  const forceFrontier = env.PAPERCLIP_FORCE_FRONTIER === "1";
  const forceThroughput = env.PAPERCLIP_FORCE_THROUGHPUT === "1";

  if (
    !forceFrontier &&
    (forceThroughput ||
      wakeReason === "heartbeat_timer" ||
      wakeReason === "routine_trigger" ||
      wakeReason === "scheduled_routine" ||
      (THROUGHPUT_FAST_RE.test(rawPrompt) && rawPrompt.length < 32_000))
  ) {
    return {
      tier: "throughput_fast",
      taskTier: "throughput",
      maxTurns: 12,
      timeoutSeconds: 120,
      reasoningEffort: "low",
      opencodeVariant: "fast",
      recommendedHarness: "opencode",
      recommendedModel: "litellm/deepseek-flash",
    };
  }

  if (forceFrontier || FRONTIER_DEEP_RE.test(rawPrompt) || rawPrompt.length > 64_000) {
    const isAdversarial = ADVERSARIAL_OR_BACKEND_RE.test(rawPrompt);
    const isVisual = VISUAL_OR_MEDIA_RE.test(rawPrompt);
    return {
      tier: "frontier_deep",
      taskTier: "frontier",
      maxTurns: 35,
      timeoutSeconds: 600,
      reasoningEffort: "high",
      opencodeVariant: "deep",
      recommendedHarness: isVisual ? "gemini" : isAdversarial ? "codex" : "claude",
      recommendedModel: isVisual ? "gemini-4-carbon-high" : isAdversarial ? "codex" : "claude-1",
    };
  }

  return {
    tier: "standard",
    taskTier: THROUGHPUT_FAST_RE.test(rawPrompt) ? "throughput" : "frontier",
    maxTurns: 25,
    timeoutSeconds: 300,
    reasoningEffort: "medium",
    opencodeVariant: "balanced",
    recommendedHarness: VISUAL_OR_MEDIA_RE.test(rawPrompt)
      ? "gemini"
      : ADVERSARIAL_OR_BACKEND_RE.test(rawPrompt)
        ? "codex"
        : "opencode",
    recommendedModel: VISUAL_OR_MEDIA_RE.test(rawPrompt)
      ? "gemini-4-carbon-high"
      : ADVERSARIAL_OR_BACKEND_RE.test(rawPrompt)
        ? "codex"
        : "litellm/deepseek-v4-pro",
  };
}

const MAX_EVENTS = 200;
const MAX_RECORD = 2 * 1024 * 1024;
const MAX_TEXT = 1024 * 1024;
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes on 429/rate-limit

const ALLOWED_MODELS = new Set([
  "codex",
  "codex-1",
  "claude",
  "claude-1",
  "claude-2",
  "claude-3",
  "deepseek",
  "deepseek-v4-pro",
  "deepseek-flash",
  "ollama",
  "hybrid-coder",
  "opencode",
  "claude-deepseek",
  "claude-ollama",
  "codex-deepseek",
  "codex-ollama",
  "gemini",
  "gemini-1",
  "gemini-4-carbon-high",
  "gemini-4-argon-high",
  "gemini-3.8-flash-high",
]);

const SCRUB_ENV_KEYS = [
  "OPENAI_API_KEY",
  "CODEX_API_KEY",
  "CODEX_ACCESS_TOKEN",
  "OPENAI_BASE_URL",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_BASE_URL",
  "CLAUDE_CODE_OAUTH_TOKEN",
  "GITHUB_ENV",
  "GITHUB_PATH",
  "GITHUB_OUTPUT",
  "GITHUB_STEP_SUMMARY",
  "GITHUB_STATE",
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "ACTIONS_RUNTIME_TOKEN",
  "ACTIONS_ID_TOKEN_REQUEST_TOKEN",
  "GITHUB_ACTIONS",
] as const;

interface CircuitBreakerState {
  readonly accounts: Record<
    string,
    {
      readonly trippedAtMs: number;
      readonly cooldownUntilMs: number;
      readonly reason: string;
      readonly consecutiveFailures: number;
    }
  >;
}

interface WorkspaceHandoffPacket {
  readonly workspace: string;
  readonly updatedAt: string;
  readonly lastRuntime: string;
  readonly lastRunId: string | null;
  readonly gitHeadSha: string | null;
  readonly recentModifiedFiles: readonly string[];
  readonly lastSummaryExcerpt: string;
}

interface ParsedOutputResult {
  readonly events: Array<Record<string, unknown>>;
  readonly parts: string[];
  readonly postCommandParts: string[];
  readonly session: string | null;
  readonly failures: string[];
  readonly hitRateLimit: boolean;
}

function resolveSecret(name: string, env: Record<string, string | undefined>, home: string): string {
  if (env[name] && env[name]!.trim().length > 0) {
    return env[name]!.trim();
  }
  const secretFile = join(home, ".config", "agent-fleet", "secrets", name);
  if (existsSync(secretFile)) {
    try {
      const val = readFileSync(secretFile, "utf8").trim();
      if (val) return val;
    } catch {
      // ignore
    }
  }
  const envFile = join(home, ".config", "paperclip", "deepseek.env");
  if (existsSync(envFile)) {
    try {
      for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
        if (line.startsWith(`${name}=`)) {
          const val = line.slice(name.length + 1).trim().replace(/^['"]|['"]$/g, "");
          if (val) return val;
        }
      }
    } catch {
      // ignore
    }
  }
  try {
    const out = execFileSync("get-secret", [name], {
      env: env as NodeJS.ProcessEnv,
      encoding: "utf8",
      timeout: 5_000,
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return out;
  } catch {
    return "";
  }
}

function readCircuitBreaker(home: string): CircuitBreakerState {
  const cbPath = join(home, ".claw-router", "circuit-breaker.json");
  if (!existsSync(cbPath)) {
    return { accounts: {} };
  }
  try {
    const parsed = JSON.parse(readFileSync(cbPath, "utf8")) as CircuitBreakerState;
    if (!parsed || typeof parsed.accounts !== "object") {
      return { accounts: {} };
    }
    const now = Date.now();
    const activeAccounts: Record<string, CircuitBreakerState["accounts"][string]> = {};
    let prunedExpired = false;
    for (const [acct, entry] of Object.entries(parsed.accounts)) {
      if (entry && typeof entry.cooldownUntilMs === "number" && entry.cooldownUntilMs > now) {
        activeAccounts[acct] = entry;
      } else {
        prunedExpired = true;
      }
    }
    if (prunedExpired) {
      try {
        writeFileSync(cbPath, JSON.stringify({ accounts: activeAccounts }, null, 2), "utf8");
      } catch {
        // ignore write failure on read path
      }
    }
    return { accounts: activeAccounts };
  } catch {
    return { accounts: {} };
  }
}

const CLAUDE_ACCOUNT_EMAILS: Record<string, string> = {
  "claude-1": "brian@megabyte.space",
  "claude-2": "hey@megabyte.space",
  "claude-3": "blzalewski@gmail.com",
};

function isAccountCircuitOpen(home: string, candidateModel: string): boolean {
  const cb = readCircuitBreaker(home);
  const entry = cb.accounts[candidateModel];
  if (!entry) return false;
  const email = CLAUDE_ACCOUNT_EMAILS[candidateModel];
  if (email) {
    const credPath = join(home, ".claw-router", "accounts", email, ".credentials.json");
    if (existsSync(credPath)) {
      try {
        if (statSync(credPath).mtimeMs > entry.trippedAtMs) {
          return false;
        }
      } catch {
        // ignore
      }
    }
  }
  return entry.cooldownUntilMs > Date.now();
}

function recordCircuitOutcome(
  home: string,
  candidateModel: string,
  success: boolean,
  reason = "",
): void {
  const cbDir = join(home, ".claw-router");
  const cbPath = join(cbDir, "circuit-breaker.json");
  try {
    mkdirSync(cbDir, { recursive: true });
    const current = readCircuitBreaker(home);
    const nextAccounts = { ...current.accounts };
    if (success) {
      delete nextAccounts[candidateModel];
    } else {
      const prev = nextAccounts[candidateModel]?.consecutiveFailures ?? 0;
      const now = Date.now();
      const baseCooldown = /oauth|auth/i.test(reason) ? 30 * 60 * 1000 : CIRCUIT_COOLDOWN_MS;
      nextAccounts[candidateModel] = {
        trippedAtMs: now,
        cooldownUntilMs: now + baseCooldown * Math.min(4, prev + 1),
        reason: reason.slice(0, 200),
        consecutiveFailures: prev + 1,
      };
    }
    writeFileSync(cbPath, JSON.stringify({ accounts: nextAccounts }, null, 2), "utf8");
  } catch {
    // fail-soft
  }
}

function readWorkspaceHandoff(home: string, workspace: string): WorkspaceHandoffPacket | null {
  try {
    const hash = createHash("sha256").update(workspace).digest("hex").slice(0, 16);
    const file = join(home, ".openclaw", "state", "handoffs", `${hash}.json`);
    if (!existsSync(file)) return null;
    return JSON.parse(readFileSync(file, "utf8")) as WorkspaceHandoffPacket;
  } catch {
    return null;
  }
}

function writeWorkspaceHandoff(
  home: string,
  workspace: string,
  runtime: string,
  runId: string | null,
  summaryText: string,
): void {
  try {
    const handoffDir = join(home, ".openclaw", "state", "handoffs");
    mkdirSync(handoffDir, { recursive: true });
    const hash = createHash("sha256").update(workspace).digest("hex").slice(0, 16);
    let gitHeadSha: string | null = null;
    let recentModifiedFiles: string[] = [];
    if (existsSync(join(workspace, ".git"))) {
      try {
        gitHeadSha = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
          cwd: workspace,
          encoding: "utf8",
          timeout: 3_000,
          stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        recentModifiedFiles = execFileSync("git", ["diff", "--name-only", "HEAD~1..HEAD"], {
          cwd: workspace,
          encoding: "utf8",
          timeout: 3_000,
          stdio: ["ignore", "pipe", "ignore"],
        })
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 15);
      } catch {
        // ignore git errors
      }
    }
    const packet: WorkspaceHandoffPacket = {
      workspace,
      updatedAt: new Date().toISOString(),
      lastRuntime: runtime,
      lastRunId: runId,
      gitHeadSha,
      recentModifiedFiles,
      lastSummaryExcerpt: summaryText.slice(0, 600),
    };
    writeFileSync(join(handoffDir, `${hash}.json`), JSON.stringify(packet, null, 2), "utf8");
  } catch {
    // fail-soft
  }
}

const SENSITIVE_TRACE_KEY_RE =
  /(?:^|[._-])(authorization|api[_-]?key|secret|password|passwd|access[_-]?token|refresh[_-]?token|bearer|cookie|private[_-]?key)(?:$|[._-])/i;
const TRACE_BEARER_RE = /\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}\b/gi;
const TRACE_API_KEY_RE =
  /\b(?:sk-ant-[A-Za-z0-9_-]{8,}|sk-proj-[A-Za-z0-9_-]{8,}|sk-lf-[A-Za-z0-9_-]{6,}|pk-lf-[A-Za-z0-9_-]{6,}|phc_[A-Za-z0-9_-]{8,}|sk_live_[A-Za-z0-9_-]{8,}|ghp_[A-Za-z0-9_-]{12,}|github_pat_[A-Za-z0-9_-]{12,}|sk-[A-Za-z0-9_-]{16,})\b/g;

function scrubTracePayload(val: unknown, depth = 0): unknown {
  if (depth > 6) return "[TRUNCATED]";
  if (typeof val === "string") {
    return val.replace(TRACE_BEARER_RE, "Bearer [REDACTED]").replace(TRACE_API_KEY_RE, "[REDACTED_KEY]");
  }
  if (!val || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.slice(0, 50).map((x) => scrubTracePayload(x, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    out[k] = SENSITIVE_TRACE_KEY_RE.test(k) ? "[REDACTED]" : scrubTracePayload(v, depth + 1);
  }
  return out;
}

async function emitLangfuseTraceSafe(
  home: string,
  env: Record<string, string | undefined>,
  rawPayload: Record<string, unknown>,
): Promise<void> {
  const payload = scrubTracePayload(rawPayload) as Record<string, unknown>;
  const traceId = createHash("sha256")
    .update(`${payload.runId ?? ""}-${Date.now()}-${Math.random()}`)
    .digest("hex")
    .slice(0, 32);
  const spanId = traceId.slice(0, 16);
  const traceparent = env.TRACEPARENT || `00-${traceId}-${spanId}-01`;
  const baggage = `paperclip.company_id=${env.PAPERCLIP_COMPANY_ID ?? "72408921-0094-4ffb-b4f4-f24db9026191"},paperclip.agent_id=${encodeURIComponent(String(env.PAPERCLIP_AGENT_ID ?? payload.requestedRuntime ?? "openclaw"))},paperclip.escalation_tier=${encodeURIComponent(String(payload.escalationTier ?? "standard"))}`;
  const enrichedPayload = {
    ...payload,
    traceId,
    spanId,
    traceparent,
    tracestate: "themetools=1,paperclip=1,openclaw=1",
    baggage,
  };

  const spoolDir = join(home, ".agentskills", "logs");
  const spoolFile = join(spoolDir, "langfuse-spool.jsonl");
  const eightPillarSpoolFile = join(spoolDir, "telemetry-8pillar-spool.jsonl");
  try {
    mkdirSync(spoolDir, { recursive: true });
    writeFileSync(
      spoolFile,
      `${JSON.stringify({ timestamp: new Date().toISOString(), ...enrichedPayload })}\n`,
      { encoding: "utf8", flag: "a" },
    );
    writeFileSync(
      eightPillarSpoolFile,
      `${JSON.stringify({
        timestamp: new Date().toISOString(),
        traceId,
        traceparent,
        pillars: {
          posthog: {
            event: "$ai_generation",
            $ai_model: payload.runtime,
            $ai_latency: payload.durationSeconds,
            $ai_input_tokens: Math.ceil(Number(payload.inputCharacters ?? 0) / 4),
            $ai_is_error: payload.exitCode !== 0,
          },
          ga4: {
            event: payload.exitCode === 0 ? "agent_turn_completed" : "agent_turn_failed",
            runtime: payload.runtime,
            escalation_tier: payload.escalationTier,
          },
          gtm: {
            event: "tt_agent_turn",
            consent_mode_v2: {
              ad_storage: "denied",
              analytics_storage: "granted",
              ad_user_data: "denied",
              ad_personalization: "denied",
              security_storage: "granted",
            },
          },
          sentry:
            payload.exitCode !== 0
              ? { level: "error", fingerprint: ["openclaw-fleet", String(payload.runtime ?? "default")] }
              : null,
        },
      })}\n`,
      { encoding: "utf8", flag: "a" },
    );
  } catch {
    // ignore spool write error
  }

  const publicKey = resolveSecret("LANGFUSE_PUBLIC_KEY", env, home);
  const secretKey = resolveSecret("LANGFUSE_SECRET_KEY", env, home);
  const host = env.LANGFUSE_HOST || "https://langfuse.megabyte.space";
  const inputTokensEst = Math.ceil(Number(payload.inputCharacters ?? 0) / 4);
  const durationMs = Math.max(1, Math.round(Number(payload.durationSeconds ?? 0) * 1000));
  const endNano = (BigInt(Date.now()) * 1_000_000n).toString(10);
  const startNano = (BigInt(Math.max(1, Date.now() - durationMs)) * 1_000_000n).toString(10);
  const nowUtcDate = new Date();
  const utcMins = nowUtcDate.getUTCHours() * 60 + nowUtcDate.getUTCMinutes();
  const isDeepSeekOffPeakUtc = utcMins >= 990 || utcMins < 30;
  if (publicKey && secretKey) {
    try {
      const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
      await fetch(`${host.replace(/\/$/, "")}/api/public/otel/v1/traces`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
          "x-langfuse-ingestion-version": "4",
          traceparent,
          baggage,
        },
        body: JSON.stringify({
          resourceSpans: [
            {
              resource: {
                attributes: [
                  { key: "service.name", value: { stringValue: "@theme.tools/telemetry-openclaw-fleet" } },
                  { key: "telemetry.sdk.language", value: { stringValue: "nodejs" } },
                ],
              },
              scopeSpans: [
                {
                  scope: { name: "@theme.tools/telemetry/langfuse-v4-otlp", version: "4.0.0" },
                  spans: [
                    {
                      traceId,
                      spanId,
                      name: `openclaw-fleet:${payload.runtime ?? "unknown"}`,
                      kind: 3,
                      startTimeUnixNano: startNano,
                      endTimeUnixNano: endNano,
                      attributes: [
                        { key: "gen_ai.operation.name", value: { stringValue: "invoke_agent" } },
                        { key: "gen_ai.provider.name", value: { stringValue: String(payload.runtime ?? "openclaw") } },
                        { key: "gen_ai.request.model", value: { stringValue: String(payload.runtime ?? "unknown") } },
                        { key: "gen_ai.agent.id", value: { stringValue: String(env.PAPERCLIP_AGENT_ID ?? payload.requestedRuntime ?? "openclaw") } },
                        { key: "gen_ai.agent.name", value: { stringValue: String(payload.requestedRuntime ?? "openclaw") } },
                        { key: "gen_ai.conversation.id", value: { stringValue: String(payload.session ?? payload.runId ?? traceId) } },
                        { key: "gen_ai.usage.input_tokens", value: { intValue: String(inputTokensEst) } },
                        { key: "gen_ai.usage.output_tokens", value: { intValue: "256" } },
                        { key: "paperclip.escalation_tier", value: { stringValue: String(payload.escalationTier ?? "standard") } },
                        { key: "paperclip.task_tier", value: { stringValue: String(payload.taskTier ?? "frontier") } },
                        { key: "deepseek.is_off_peak_utc", value: { boolValue: isDeepSeekOffPeakUtc } },
                        { key: "deepseek.discount_pct", value: { intValue: isDeepSeekOffPeakUtc ? "50" : "0" } },
                      ],
                      status: payload.exitCode === 0 ? { code: 1 } : { code: 2, message: "turn_failed" },
                    },
                  ],
                },
              ],
            },
          ],
        }),
        signal: AbortSignal.timeout(2_500),
      });
    } catch {
      // 2500ms fail-open contract: never block execution on Langfuse timeout
    }
  }

  const posthogKey = resolveSecret("POSTHOG_API_KEY", env, home) || resolveSecret("POSTHOG_PERSONAL_API_KEY", env, home);
  const posthogHost = env.POSTHOG_HOST || "https://us.i.posthog.com";
  if (posthogKey && posthogKey.startsWith("phc_")) {
    try {
      const distinctId = String(payload.requestedRuntime ?? "openclaw-fleet");
      const nowIso = new Date().toISOString();
      await fetch(`${posthogHost.replace(/\/$/, "")}/batch/`, {
        method: "POST",
        headers: { "Content-Type": "application/json", traceparent },
        body: JSON.stringify({
          api_key: posthogKey,
          batch: [
            {
              event: "$ai_trace",
              distinct_id: distinctId,
              timestamp: nowIso,
              properties: {
                $ai_trace_id: traceId,
                $ai_latency: payload.durationSeconds,
                $ai_is_error: payload.exitCode !== 0,
                traceparent,
              },
            },
            {
              event: "$ai_span",
              distinct_id: distinctId,
              timestamp: nowIso,
              properties: {
                $ai_trace_id: traceId,
                $ai_span_id: spanId,
                $ai_parent_id: traceId,
                $ai_span_name: `cr:${payload.runtime ?? "unknown"}`,
                $ai_latency: payload.durationSeconds,
                traceparent,
              },
            },
            {
              event: "$ai_generation",
              distinct_id: distinctId,
              timestamp: nowIso,
              properties: {
                $ai_trace_id: traceId,
                $ai_span_id: spanId,
                $ai_parent_id: spanId,
                $ai_model: payload.runtime,
                $ai_provider: payload.requestedRuntime,
                $ai_latency: payload.durationSeconds,
                $ai_input_tokens: inputTokensEst,
                $ai_is_error: payload.exitCode !== 0,
                traceparent,
                escalation_tier: payload.escalationTier,
              },
            },
          ],
        }),
        signal: AbortSignal.timeout(2_500),
      });
    } catch {
      // 2500ms fail-open
    }
  }
}

function buildCommand(
  providerModel: string,
  home: string,
  skillsRoot: string,
  systemPromptFile: string | null,
  baseEnv: Record<string, string | undefined>,
  maxTurns: number,
  opencodeVariant: string,
): { readonly cmd: string[]; readonly usesPromptFileFlag: boolean; readonly runEnv: Record<string, string | undefined> } {
  const runEnv: Record<string, string | undefined> = { ...baseEnv };
  const crBin = existsSync(join(home, ".local", "bin", "cr")) ? join(home, ".local", "bin", "cr") : "cr";
  const codexBin = existsSync(join(home, ".local", "bin", "codex"))
    ? join(home, ".local", "bin", "codex")
    : "codex";
  const opencodeWrapper = join(skillsRoot, "bin", "opencode-deepseek.sh");
  const fleetMcpConfig = join(home, ".openclaw", "fleet-mcp-config.json");

  if (providerModel === "codex" || providerModel === "codex-1") {
    const cmd = [
      crBin,
      "--provider",
      "codex",
      "exec",
      "--json",
      "--skip-git-repo-check",
      "--dangerously-bypass-approvals-and-sandbox",
      "-",
    ];
    return { cmd, usesPromptFileFlag: false, runEnv };
  }

  if (providerModel === "codex-deepseek" || providerModel === "codex-ollama") {
    const litellmKey =
      resolveSecret("LITELLM_API_KEY", runEnv, home) ||
      resolveSecret("DEEPSEEK_API_KEY", runEnv, home);
    if (litellmKey) {
      runEnv.LITELLM_API_KEY = litellmKey;
    }
    const targetModel = providerModel === "codex-ollama" ? "hybrid-coder" : "deepseek-chat";
    const cmd = [
      codexBin,
      "exec",
      "--json",
      "--skip-git-repo-check",
      "--dangerously-bypass-approvals-and-sandbox",
      "-c",
      'model_provider="litellm"',
      "-c",
      'model_providers.litellm.name="LiteLLM"',
      "-c",
      'model_providers.litellm.base_url="https://llm.megabyte.space/v1"',
      "-c",
      'model_providers.litellm.env_key="LITELLM_API_KEY"',
      "-c",
      'model_providers.litellm.wire_api="responses"',
      "-m",
      targetModel,
      "-",
    ];
    return { cmd, usesPromptFileFlag: false, runEnv };
  }

  if (
    providerModel === "claude" ||
    providerModel === "claude-1" ||
    providerModel === "claude-2" ||
    providerModel === "claude-3"
  ) {
    runEnv.CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT = "1";
    const accountArgs =
      providerModel === "claude" ? ["--provider", "claude"] : [`@${providerModel}`, "--provider", "claude"];
    const mcpArgs = existsSync(fleetMcpConfig)
      ? ["--strict-mcp-config", "--mcp-config", fleetMcpConfig]
      : ["--strict-mcp-config"];
    const cmd = [
      crBin,
      ...accountArgs,
      "-p",
      "--output-format",
      "stream-json",
      "--verbose",
      "--dangerously-skip-permissions",
      "--max-turns",
      String(maxTurns),
      ...mcpArgs,
    ];
    if (systemPromptFile && existsSync(systemPromptFile)) {
      cmd.push("--append-system-prompt-file", resolve(systemPromptFile));
    }
    return { cmd, usesPromptFileFlag: true, runEnv };
  }

  if (providerModel === "claude-deepseek" || providerModel === "claude-ollama") {
    runEnv.CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT = "1";
    const backendTag = providerModel === "claude-ollama" ? "@ollama" : "@deepseek";
    const mcpArgs = existsSync(fleetMcpConfig)
      ? ["--strict-mcp-config", "--mcp-config", fleetMcpConfig]
      : ["--strict-mcp-config"];
    const cmd = [
      crBin,
      backendTag,
      "--provider",
      "claude",
      "-p",
      "--output-format",
      "stream-json",
      "--verbose",
      "--dangerously-skip-permissions",
      "--max-turns",
      String(maxTurns),
      ...mcpArgs,
    ];
    if (systemPromptFile && existsSync(systemPromptFile)) {
      cmd.push("--append-system-prompt-file", resolve(systemPromptFile));
    }
    return { cmd, usesPromptFileFlag: true, runEnv };
  }

  if (providerModel.startsWith("gemini")) {
    const agyModel =
      providerModel === "gemini" || providerModel === "gemini-1"
        ? "gemini-4-carbon-high"
        : providerModel;
    const agyBin = existsSync(join(home, ".local", "bin", "agy"))
      ? join(home, ".local", "bin", "agy")
      : "agy";
    const cmd = [
      agyBin,
      "--model",
      agyModel,
      "--output-format",
      "stream-json",
      "--dangerously-skip-permissions",
    ];
    return { cmd, usesPromptFileFlag: false, runEnv };
  }

  if (providerModel === "ollama" || providerModel === "hybrid-coder") {
    const cmd = [opencodeWrapper, "run", "--format", "json", "-m", "litellm/hybrid-coder"];
    return { cmd, usesPromptFileFlag: false, runEnv };
  }

  if (providerModel === "deepseek-v4-pro") {
    const hasLitellm = Boolean(resolveSecret("LITELLM_API_KEY", runEnv, home));
    const target = hasLitellm ? "litellm/deepseek-v4-pro" : "deepseek/deepseek-chat";
    const cmd = [opencodeWrapper, "run", "--format", "json", "-m", target];
    return { cmd, usesPromptFileFlag: false, runEnv };
  }

  if (providerModel === "deepseek-flash") {
    const hasLitellm = Boolean(resolveSecret("LITELLM_API_KEY", runEnv, home));
    const target = hasLitellm ? "litellm/deepseek-flash" : "deepseek/deepseek-chat";
    const cmd = [opencodeWrapper, "run", "--format", "json", "-m", target];
    return { cmd, usesPromptFileFlag: false, runEnv };
  }

  // Default throughput / opencode model
  const defaultModel =
    opencodeVariant === "deep" && resolveSecret("LITELLM_API_KEY", runEnv, home)
      ? "litellm/deepseek-v4-pro"
      : "deepseek/deepseek-chat";
  const cmd = [opencodeWrapper, "run", "--format", "json", "-m", defaultModel];
  return { cmd, usesPromptFileFlag: false, runEnv };
}

function parseOutputStream(rawStdout: string): ParsedOutputResult {
  const events: Array<Record<string, unknown>> = [];
  const parts: string[] = [];
  const postCommandParts: string[] = [];
  const failures: string[] = [];
  const toolSummaries: string[] = [];
  let session: string | null = null;
  let hitRateLimit = false;

  for (const line of rawStdout.split(/\r?\n/)) {
    if (!line) continue;
    if (line.length > MAX_RECORD) {
      failures.push("CLI event exceeds record limit");
      break;
    }
    let item: Record<string, unknown>;
    try {
      const parsed = JSON.parse(line);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      item = parsed as Record<string, unknown>;
    } catch {
      continue;
    }

    const kind = String(item.type ?? item.event ?? "");
    if (kind === "thread.started" || kind === "init") {
      const initObj =
        item.init && typeof item.init === "object" ? (item.init as Record<string, unknown>) : {};
      session =
        String(
          item.thread_id ??
            item.session_id ??
            item.conversation_id ??
            initObj.conversation_id ??
            session ??
            "",
        ) || session;
    }
    if (kind === "step_update") {
      const su =
        item.step_update && typeof item.step_update === "object"
          ? (item.step_update as Record<string, unknown>)
          : item;
      const stepType = String(su.step_type ?? "");
      const stepState = String(su.state ?? su.status ?? "");
      if (stepType === "PLANNER_RESPONSE" || stepType === "agent_response") {
        const delta = String(su.text_delta ?? su.content ?? "").slice(0, MAX_TEXT);
        if (delta && (stepType === "agent_response" || stepState === "DONE")) {
          parts.push(delta);
          postCommandParts.push(delta);
        }
      }
    }
    if (kind === "item.completed") {
      const record =
        item.item && typeof item.item === "object" ? (item.item as Record<string, unknown>) : {};
      const recType = String(record.type ?? "");
      if (recType === "agent_message") {
        const msgText = String(record.text ?? "").slice(0, MAX_TEXT);
        parts.push(msgText);
        postCommandParts.push(msgText);
      }
      if (
        recType === "command_execution" ||
        recType === "mcp_tool_call" ||
        recType === "web_search" ||
        recType === "file_change"
      ) {
        postCommandParts.length = 0;
        toolSummaries.push(recType);
      }
      if (recType === "command_execution" && events.length < MAX_EVENTS) {
        events.push({
          command: "[native command; contents private]",
          exitCode: record.exit_code,
        });
      }
    }
    if ((kind === "turn.completed" || kind === "result" || kind === "step_finish") && events.length < MAX_EVENTS) {
      const partObj =
        item.part && typeof item.part === "object" ? (item.part as Record<string, unknown>) : {};
      const usageRaw = item.usage ?? partObj.tokens;
      if (usageRaw && typeof usageRaw === "object" && !Array.isArray(usageRaw)) {
        const cleanUsage: Record<string, number> = {};
        for (const [k, v] of Object.entries(usageRaw as Record<string, unknown>)) {
          if (typeof v === "number" && Number.isFinite(v)) {
            cleanUsage[k] = v;
          }
        }
        events.push({ usage: cleanUsage });
      }
    }
    if (item.is_api_error_message || item.error) {
      const errStr = String(item.error ?? "api_error");
      if (/429|rate.?limit|quota|exhausted|authentication_failed|oauth|usage limit|overloaded/i.test(errStr)) {
        hitRateLimit = true;
      }
      failures.push(`CLI API error: ${errStr}`);
      continue;
    }
    if (kind === "result") {
      if (item.subtype === "error_max_turns" || item.terminal_reason === "max_turns") {
        const numTurns = Number(item.num_turns ?? toolSummaries.length) || 1;
        let summaryMsg = `Completed ${numTurns} execution turns in this heartbeat window.`;
        if (toolSummaries.length > 0) {
          summaryMsg += ` Actions: ${toolSummaries.slice(-8).join("; ")}`;
        }
        const narrationRe = /^(i['\u2019]ll\b|let me\b|i am going to\b|i'm going to\b|first,\s*i\b)/i;
        const cleanPost = postCommandParts.filter(
          (pt) => pt.trim().length > 0 && !narrationRe.test(pt.trim()),
        );
        if (cleanPost.length === 0) {
          postCommandParts.length = 0;
          postCommandParts.push(summaryMsg);
        }
        if (!parts.some((pt) => pt.trim().length > 0 && !narrationRe.test(pt.trim()))) {
          parts.push(summaryMsg);
        }
        if (typeof item.session_id === "string") session = item.session_id;
        continue;
      }
      if (item.is_error || item.terminal_reason === "api_error") {
        const errRes = String(item.result ?? "").trim();
        if (/429|rate.?limit|quota|exhausted|failed to authenticate|oauth session expired|usage limit|overloaded/i.test(errRes)) {
          hitRateLimit = true;
        }
        if (errRes || !parts.some((pt) => pt.trim().length > 0)) {
          failures.push(`CLI reported an error result: ${errRes.slice(0, 160)}`);
          parts.length = 0;
          postCommandParts.length = 0;
        }
        if (typeof item.session_id === "string") session = item.session_id;
        continue;
      }
      const resObj = item.result;
      if (resObj && typeof resObj === "object" && !Array.isArray(resObj)) {
        const rec = resObj as Record<string, unknown>;
        const respText = String(rec.response ?? "").slice(0, MAX_TEXT);
        if (respText && parts.length === 0) {
          parts.push(respText);
          postCommandParts.push(respText);
        }
        session = String(rec.conversation_id ?? item.session_id ?? session ?? "") || session;
      } else {
        const resStr = String(resObj ?? "").slice(0, MAX_TEXT);
        if (/^(Failed to authenticate:|API Error:\s*Request rejected|API Error:\s*\d{3}\b)/i.test(resStr.trim())) {
          if (/429|rate.?limit|quota|failed to authenticate|oauth/i.test(resStr)) hitRateLimit = true;
          failures.push(`CLI returned upstream error string: ${resStr.slice(0, 160)}`);
          parts.length = 0;
          postCommandParts.length = 0;
          continue;
        }
        if (resStr.trim()) {
          parts.push(resStr);
        }
        if (typeof item.session_id === "string") session = item.session_id;
      }
    }
    if (kind === "error" || kind === "turn.failed") {
      const errMsg = String(item.message ?? item.error ?? "");
      if (/429|rate.?limit|quota|exhausted|failed to authenticate|oauth|usage limit/i.test(errMsg)) {
        hitRateLimit = true;
      }
      if (!/(Heads up:|Reconnecting)/i.test(errMsg)) {
        failures.push("CLI reported a failure event");
      }
    }
    if (kind === "assistant") {
      const msgObj =
        item.message && typeof item.message === "object"
          ? (item.message as Record<string, unknown>)
          : {};
      const contentList = Array.isArray(msgObj.content) ? msgObj.content : [];
      for (const block of contentList) {
        if (!block || typeof block !== "object") continue;
        const b = block as Record<string, unknown>;
        if (b.type === "text") {
          const txt = String(b.text ?? "").slice(0, MAX_TEXT);
          if (txt.trim()) {
            parts.push(txt);
            postCommandParts.push(txt);
          }
        } else if (b.type === "tool_use") {
          postCommandParts.length = 0;
          const inp = b.input && typeof b.input === "object" ? (b.input as Record<string, unknown>) : {};
          const desc = String(inp.description ?? b.name ?? "tool_use").slice(0, 80);
          toolSummaries.push(desc);
        }
      }
      if (typeof item.session_id === "string") session = item.session_id;
    }
    if (kind === "tool_use") {
      postCommandParts.length = 0;
      const partObj =
        item.part && typeof item.part === "object" ? (item.part as Record<string, unknown>) : {};
      const stateObj =
        partObj.state && typeof partObj.state === "object"
          ? (partObj.state as Record<string, unknown>)
          : {};
      const toolName = String(stateObj.title ?? partObj.tool ?? "tool_use").slice(0, 80);
      toolSummaries.push(toolName);
      if (events.length < MAX_EVENTS) {
        events.push({ command: `[opencode tool: ${toolName}]`, exitCode: 0 });
      }
      if (typeof item.sessionID === "string") session = item.sessionID;
    }
    if (kind === "text") {
      const partObj =
        item.part && typeof item.part === "object" ? (item.part as Record<string, unknown>) : {};
      const txt = String(partObj.text ?? "").slice(0, MAX_TEXT);
      if (txt.trim()) {
        parts.push(txt);
        postCommandParts.push(txt);
      }
      if (typeof item.sessionID === "string") session = item.sessionID;
    }
    const totalLen = parts.reduce((acc, s) => acc + s.length, 0);
    if (totalLen > MAX_TEXT) {
      failures.push("CLI reply exceeds text limit");
      break;
    }
  }

  return { events, parts, postCommandParts, session, failures, hitRateLimit };
}

function runSubprocessWithTimeout(
  cmd: string[],
  cwd: string,
  env: Record<string, string | undefined>,
  stdinPayload: string,
  timeoutSec: number,
  stderrFile: string,
): Promise<{ readonly code: number; readonly stdout: string }> {
  return new Promise((resolvePromise) => {
    const child = spawn(cmd[0]!, cmd.slice(1), {
      cwd,
      env: env as NodeJS.ProcessEnv,
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let settled = false;

    const killChildGroup = () => {
      if (!child.pid) return;
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (!child.pid) return;
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          // ignore
        }
      }, 1_500).unref();
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      killChildGroup();
      try {
        writeFileSync(stderrFile, Buffer.concat(stderrChunks));
      } catch {}
      resolvePromise({ code: 124, stdout: Buffer.concat(stdoutChunks).toString("utf8") });
    }, Math.max(1_000, Math.floor(timeoutSec * 1000)));

    child.stdout.on("data", (chunk: Buffer) => stdoutChunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderrChunks.push(chunk));

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      stderrChunks.push(Buffer.from(String(err)));
      try {
        writeFileSync(stderrFile, Buffer.concat(stderrChunks));
      } catch {}
      resolvePromise({ code: 1, stdout: Buffer.concat(stdoutChunks).toString("utf8") });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        writeFileSync(stderrFile, Buffer.concat(stderrChunks));
      } catch {}
      resolvePromise({ code: code ?? 1, stdout: Buffer.concat(stdoutChunks).toString("utf8") });
    });

    if (stdinPayload) {
      child.stdin.write(stdinPayload);
    }
    child.stdin.end();
  });
}

async function main(): Promise<number> {
  let providerModel = "codex";
  let systemPromptFile: string | null = null;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--provider-model" && argv[i + 1]) {
      providerModel = argv[++i]!;
    } else if (argv[i] === "--system-prompt-file" && argv[i + 1]) {
      systemPromptFile = argv[++i]!;
    }
  }
  if (!ALLOWED_MODELS.has(providerModel)) {
    process.stderr.write(`Unsupported --provider-model: ${providerModel}\n`);
    return 2;
  }

  const rawPrompt = readFileSync(0, "utf8");
  const home = homedir();
  const env: Record<string, string | undefined> = { ...process.env };
  env.PATH = [
    join(home, ".volta", "tools", "image", "node", "24.21.0", "bin"),
    join(home, ".volta", "bin"),
    join(home, ".local", "bin"),
    join(home, "ai", "tools", "bin"),
    env.PATH ?? "/usr/bin:/bin",
  ].join(":");

  for (const key of SCRUB_ENV_KEYS) {
    delete env[key];
  }

  let workspace = env.AI_RUN_WORKSPACE || process.cwd();
  for (const match of rawPrompt.matchAll(/^(PAPERCLIP_[A-Z0-9_]+)=([^\r\n]+)$/gm)) {
    const pcKey = match[1]!;
    const pcVal = match[2]!.trim();
    if (pcKey !== "PAPERCLIP_API_KEY" && pcVal && !pcVal.startsWith("<")) {
      env[pcKey] = pcVal;
    }
  }

  if (env.PAPERCLIP_RUN_ID) {
    if (!env.PAPERCLIP_API_URL || env.PAPERCLIP_API_URL.includes("swarml.ink")) {
      env.PAPERCLIP_API_URL = "http://127.0.0.1:3100";
    }
    const promptKeyPathMatch = rawPrompt.match(
      /(\/[^\s>"']+\/\.openclaw\/workspaces?\/[^\s>"']+\/paperclip-claimed-api-key[^\s>"']*\.json)/,
    );
    const candidates = [
      ...(promptKeyPathMatch ? [promptKeyPathMatch[1]!] : []),
      join(home, ".openclaw", "workspace", `paperclip-claimed-api-key-${env.PAPERCLIP_RUN_ID}.json`),
      join(home, ".openclaw", "workspace", "paperclip-claimed-api-key.json"),
      join(home, "ai", "workspace", "paperclip-claimed-api-key.json"),
    ];
    const wsRoot = join(home, ".openclaw", "workspaces");
    if (existsSync(wsRoot)) {
      try {
        for (const sub of readdirSync(wsRoot)) {
          candidates.push(join(wsRoot, sub, "paperclip-claimed-api-key.json"));
        }
      } catch {
        // ignore
      }
    }
    for (const kc of candidates) {
      if (existsSync(kc)) {
        try {
          const kp = JSON.parse(readFileSync(kc, "utf8")) as Record<string, unknown>;
          if (
            env.PAPERCLIP_AGENT_ID &&
            typeof kp.agentId === "string" &&
            kp.agentId !== env.PAPERCLIP_AGENT_ID &&
            kc !== promptKeyPathMatch?.[1]
          ) {
            continue;
          }
          const tok = kp.token ?? kp.apiKey ?? kp.PAPERCLIP_API_KEY;
          if (typeof tok === "string" && tok.trim()) {
            env.PAPERCLIP_API_KEY = tok.trim();
            break;
          }
        } catch {
          // ignore
        }
      }
    }
  }
  env.CR_NO_AUTO_REFRESH = "1";
  env.SHELL = env.SHELL || "/bin/bash";

  const escalation = computeEffortEscalationPlan(rawPrompt, env);
  let timeout = 3600.0;
  const fleetRunMatch = rawPrompt.match(/<fleet-run>([^\n]+)<\/fleet-run>/);
  if (fleetRunMatch) {
    const run = JSON.parse(fleetRunMatch[1]!) as Record<string, unknown>;
    const candidate = resolve(String(run.workspace ?? ""));
    const logs = resolve(String(run.logdir ?? ""));
    const worktreesRoot = resolve(join(home, "ai", "worktrees"));
    const logsRoot = resolve(join(home, "ai", "logs"));
    if (!candidate.startsWith(`${worktreesRoot}/`) && candidate !== worktreesRoot) {
      throw new Error("Workspace outside ~/ai/worktrees");
    }
    if (!logs.startsWith(`${logsRoot}/`) && logs !== logsRoot) {
      throw new Error("Logdir outside ~/ai/logs");
    }
    workspace = candidate;
    env.AI_RUN_ID = String(run.runId ?? "");
    env.AI_RUN_WORKSPACE = workspace;
    env.AI_RUN_LOG_DIR = logs;
    env.AI_FLEET_REPORT = join(logs, "agent-report.json");
    if (run.deadlineEpoch !== undefined) {
      const deadline = Number(run.deadlineEpoch);
      if (!Number.isFinite(deadline)) {
        throw new Error("Run deadline must be finite");
      }
      timeout = Math.min(timeout, deadline - Date.now() / 1000);
    }
  }

  const selfFile = fileURLToPath(import.meta.url);
  let skillsRoot = resolve(dirname(selfFile), "..", "..");
  const identityPath = join(home, ".config", "agent-fleet", "machine.json");
  if (existsSync(identityPath)) {
    try {
      const identity = JSON.parse(readFileSync(identityPath, "utf8")) as { profile?: string };
      if (typeof identity.profile === "string") {
        skillsRoot = resolve(dirname(resolve(identity.profile.replace(/^~/, home))), "..");
      }
    } catch {
      // ignore
    }
  }
  if (!existsSync(join(skillsRoot, "bin", "opencode-deepseek.sh"))) {
    skillsRoot = join(home, "ai", "repos", "agent-skills");
  }

  const logdir = env.AI_RUN_LOG_DIR || join(home, "ai", "logs", "manual");
  mkdirSync(logdir, { recursive: true, mode: 0o700 });
  const nowNs = `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
  const traceFile = join(logdir, `compute-${nowNs}.json`);

  const taskTier = escalation.taskTier;
  let rawCandidates: string[] = [];
  if (["ollama", "hybrid-coder", "claude-ollama", "codex-ollama"].includes(providerModel)) {
    rawCandidates = [
      providerModel,
      "ollama",
      "claude-ollama",
      "codex-ollama",
      "claude-deepseek",
      "deepseek",
      "codex-deepseek",
      "codex",
      "claude-1",
      "claude-2",
      "claude-3",
      "gemini",
    ];
  } else if (
    ["deepseek", "deepseek-v4-pro", "deepseek-flash", "opencode", "claude-deepseek", "codex-deepseek"].includes(
      providerModel,
    )
  ) {
    rawCandidates = systemPromptFile
      ? ["claude-deepseek", "deepseek", "codex", "claude-1", "claude-2", "gemini"]
      : [providerModel, "claude-deepseek", "deepseek", "codex", "claude-1", "claude-2", "gemini"];
  } else if (taskTier === "throughput") {
    rawCandidates = [
      "claude-deepseek",
      "deepseek",
      providerModel,
      "codex",
      "claude-1",
      "claude-2",
      "claude-3",
      "gemini",
    ];
  } else {
    rawCandidates = [
      providerModel,
      "claude-1",
      "claude-2",
      "claude-3",
      "claude",
      "codex",
      "claude-deepseek",
      "codex-deepseek",
      "deepseek",
      "gemini",
    ];
  }

  // Deduplicate and filter out accounts with open circuit breakers (keeping at least 2 fallbacks)
  const deduped = Array.from(new Set(rawCandidates));
  const healthyCandidates = deduped.filter((c) => !isAccountCircuitOpen(home, c));
  const candidates = (healthyCandidates.length >= 2 ? healthyCandidates : deduped).slice(0, 5);

  if (systemPromptFile && existsSync(systemPromptFile)) {
    try {
      const persistedPrompt = join(logdir, `system-prompt-${nowNs}.md`);
      writeFileSync(persistedPrompt, readFileSync(systemPromptFile, "utf8"), "utf8");
      systemPromptFile = persistedPrompt;
    } catch {
      // ignore
    }
  }

  // Attach compact cross-harness workspace handoff packet if available
  const priorHandoff = readWorkspaceHandoff(home, workspace);
  const handoffHeader = priorHandoff
    ? `<fleet-handoff workspace="${priorHandoff.workspace}" lastRuntime="${priorHandoff.lastRuntime}" gitHead="${priorHandoff.gitHeadSha ?? "unknown"}" recentFiles="${priorHandoff.recentModifiedFiles.join(",")}">\n`
    : "";

  let events: Array<Record<string, unknown>> = [];
  let parts: string[] = [];
  let postCommandParts: string[] = [];
  let failures: string[] = [];
  let session: string | null = null;
  let code = 1;
  let activeModel = providerModel;
  const startedMs = performance.now();

  try {
    if (timeout <= 0) {
      throw new Error("TimeoutError: Run deadline already expired; CLI was not launched");
    }

    for (const candidateModel of candidates) {
      activeModel = candidateModel;
      const { cmd, usesPromptFileFlag, runEnv } = buildCommand(
        candidateModel,
        home,
        skillsRoot,
        systemPromptFile,
        env,
        escalation.maxTurns,
        escalation.opencodeVariant,
      );

      let prompt = handoffHeader ? `${handoffHeader}${rawPrompt}` : rawPrompt;
      if (systemPromptFile && !usesPromptFileFlag && existsSync(systemPromptFile)) {
        prompt = `<openclaw-policy>\n${readFileSync(systemPromptFile, "utf8")}\n</openclaw-policy>\n${prompt}`;
      }

      let runCmd = [...cmd];
      let stdinPayload = prompt;
      if (candidateModel.startsWith("gemini")) {
        if (Buffer.byteLength(prompt, "utf8") > 90_000) {
          const promptFile = join(logdir, `gemini-prompt-${Date.now()}.md`);
          writeFileSync(promptFile, prompt, "utf8");
          runCmd = [
            ...runCmd,
            "-p",
            `Read and execute the full instructions in ${promptFile} inside workspace ${workspace}.`,
          ];
        } else {
          runCmd = [...runCmd, "-p", prompt];
        }
        stdinPayload = "";
      }

      const stderrFile = join(logdir, `cli-${Date.now()}.stderr`);
      const perAttemptTimeout = Math.min(timeout, escalation.timeoutSeconds);
      const procRes = await runSubprocessWithTimeout(
        runCmd,
        existsSync(workspace) ? workspace : home,
        runEnv,
        stdinPayload,
        perAttemptTimeout,
        stderrFile,
      );
      code = procRes.code;

      if (code === 124) {
        failures.push(`${candidateModel}: CLI exceeded run deadline`);
      }

      const parsed = parseOutputStream(procRes.stdout);
      let cParts = parsed.parts;
      let cPostParts = parsed.postCommandParts;
      if (!cParts.some((pt) => pt.trim().length > 0) && parsed.events.length > 0 && parsed.failures.length === 0) {
        cParts = [`Completed ${parsed.events.length} execution steps in this heartbeat window.`];
        cPostParts = [...cParts];
      }

      const upstreamErrRe = /^(Failed to authenticate:|API Error:\s*Request rejected|API Error:\s*\d{3}\b)/i;
      const validParts = cParts.filter((pt) => pt.trim().length > 0 && !upstreamErrRe.test(pt.trim()));
      const lastNonEmpty = cParts.map((pt) => pt.trim()).filter(Boolean);
      const lastIsUpstreamErr =
        lastNonEmpty.length > 0 && upstreamErrRe.test(lastNonEmpty[lastNonEmpty.length - 1]!);

      if (validParts.length > 0 && !lastIsUpstreamErr) {
        events = parsed.events;
        parts = validParts;
        postCommandParts = cPostParts.filter(
          (pt) => pt.trim().length > 0 && !upstreamErrRe.test(pt.trim()),
        );
        session = parsed.session;
        failures = [];
        code = 0;
        recordCircuitOutcome(home, candidateModel, true);
        break;
      } else {
        if (parsed.hitRateLimit) {
          recordCircuitOutcome(home, candidateModel, false, "429_or_quota_exhausted");
        }
        failures.push(
          ...(parsed.failures.length > 0
            ? parsed.failures
            : [`${candidateModel}: CLI produced no final reply`]),
        );
        code = code || 1;
      }
    }

    // Ultimate HTTP fallback to DeepSeek direct API if all CLI candidates fail
    if (code !== 0 || !parts.some((pt) => pt.trim().length > 0)) {
      const dsKey = resolveSecret("DEEPSEEK_API_KEY", env, home);
      if (dsKey) {
        try {
          const sysContent =
            systemPromptFile && existsSync(systemPromptFile)
              ? readFileSync(systemPromptFile, "utf8").slice(0, 16_000)
              : "You are a Paperclip autonomous specialist agent executing a task on swarml.ink. Provide a concise, concrete status and action summary.";
          const res = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${dsKey}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              temperature: 0.2,
              max_tokens: 2048,
              messages: [
                { role: "system", content: sysContent },
                { role: "user", content: rawPrompt.slice(0, 32_000) },
              ],
            }),
            signal: AbortSignal.timeout(60_000),
          });
          const respJson = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
            usage?: Record<string, number>;
          };
          const dsContent = respJson.choices?.[0]?.message?.content?.trim() ?? "";
          if (dsContent) {
            activeModel = "deepseek-http-fallback";
            parts = [dsContent];
            postCommandParts = [dsContent];
            if (respJson.usage && typeof respJson.usage === "object") {
              events = [{ usage: respJson.usage }];
            }
            failures = [];
            code = 0;
          }
        } catch (dsErr) {
          failures.push(
            `deepseek-http-fallback: ${dsErr instanceof Error ? dsErr.name : "Error"}`,
          );
        }
      }
    }
  } catch (err) {
    const errName = err instanceof Error ? err.message : String(err);
    failures.push(errName.startsWith("TimeoutError") ? "TimeoutError" : err instanceof Error ? err.name : "Error");
    code = errName.startsWith("TimeoutError") ? 124 : 1;
  } finally {
    let revision: string | null = null;
    try {
      revision = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: skillsRoot,
        encoding: "utf8",
        timeout: 5_000,
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      revision = null;
    }

    const durationSeconds = Number(((performance.now() - startedMs) / 1000).toFixed(3));
    const tracePayload = {
      adapterRevision: revision,
      adapterSha256: createHash("sha256").update(readFileSync(selfFile)).digest("hex"),
      inputCharacters: rawPrompt.length,
      runId: env.AI_RUN_ID ?? env.PAPERCLIP_RUN_ID ?? null,
      runtime: activeModel,
      requestedRuntime: providerModel,
      taskTier,
      escalationTier: escalation.tier,
      router: !["deepseek", "ollama", "hybrid-coder", "opencode"].includes(activeModel),
      session,
      exitCode: code,
      durationSeconds,
      events,
      failures,
      systemPromptTransport: systemPromptFile ? "file" : "none",
    };
    writeFileSync(traceFile, `${JSON.stringify(tracePayload, null, 2)}\n`, "utf8");
    chmodSync(traceFile, 0o600);

    await emitLangfuseTraceSafe(home, env, tracePayload);
  }

  if (code !== 0 || !parts.some((pt) => pt.trim().length > 0)) {
    process.stderr.write(`${activeModel} exited ${code || 1}; private diagnostics: ${logdir}\n`);
    return code || 1;
  }

  let finalParts =
    postCommandParts.filter((pt) => pt.trim().length > 0).length > 0
      ? postCommandParts.filter((pt) => pt.trim().length > 0)
      : parts.filter((pt) => pt.trim().length > 0).slice(-1);
  if (
    finalParts.length > 1 &&
    /^(i['\u2019]ll\b|let me\b|i am going to\b|i'm going to\b)/i.test(finalParts[0]!.trim())
  ) {
    finalParts = finalParts.slice(-1);
  }

  const finalReply = finalParts.join("\n");
  writeWorkspaceHandoff(home, workspace, activeModel, env.AI_RUN_ID ?? env.PAPERCLIP_RUN_ID ?? null, finalReply);

  process.stdout.write(`${JSON.stringify({ result: finalReply, session_id: session })}\n`);
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
