#!/usr/bin/env -S node --experimental-strip-types
/**
 * Dynamic Effort, Turn-Budget & Timeout Escalator (`effort-escalator.ts`)
 *
 * Classifies prompts across all 4 CLI harnesses (`claude-1/2/3`, `codex`, `gemini`, `opencode`)
 * into three execution profiles:
 *   - `throughput_fast`: routine heartbeats, summaries, status cards, hygiene checks
 *   - `standard`: bounded feature slices, bug fixes, tests, refactors
 *   - `frontier_deep`: OpenSpec authoring, ADR/STRIDE architecture, multi-repo convergence
 */

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

export function computeEffortEscalationPlan(
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
      recommendedModel: isVisual
        ? "gemini-4-carbon-high"
        : isAdversarial
          ? "codex"
          : "claude-1",
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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const promptArg = process.argv.slice(2).join(" ");
  const plan = computeEffortEscalationPlan(promptArg, process.env);
  console.log(JSON.stringify(plan, null, 2));
}
