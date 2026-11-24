#!/usr/bin/env -S node --experimental-strip-types
/**
 * Gmail MCP Automated Inbox Triage & Issue Resolution Script
 *
 * Scans `in:inbox` via Gmail MCP (`mcpsrv_01QPHJFoUE19dgRRxyLMTXuJ`), classifies
 * every thread into:
 *   - DELETE (`trash_thread`): monitoring/infra alerts (Grafana, Pulse, Healthchecks,
 *     Sentry), Postiz channel refresh/posting failures, failed payment/collection
 *     notices, and expired OTP/magic-link codes.
 *   - ARCHIVE (`unlabel_thread` removing `["INBOX", "UNREAD"]`): resolved threads,
 *     receipts, newsletters, and informational emails.
 */

import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const GMAIL_MCP_PROXY_URL =
  process.env.GMAIL_MCP_PROXY_URL ??
  "https://mcp-proxy.anthropic.com/v1/mcp/mcpsrv_01QPHJFoUE19dgRRxyLMTXuJ";

interface GmailThreadSummary {
  readonly id: string;
  readonly snippet?: string;
}

interface GmailTriageReport {
  readonly scannedThreads: number;
  readonly deleteCandidates: number;
  readonly archiveCandidates: number;
  readonly deletedCount: number;
  readonly archivedCount: number;
  readonly modifyScopeAuthorized: boolean;
  readonly modifyScopeMessage: string | null;
}

function resolveClaudeOAuthToken(): string {
  if (process.env.GMAIL_MCP_OAUTH_TOKEN) {
    return process.env.GMAIL_MCP_OAUTH_TOKEN.trim();
  }
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    return process.env.CLAUDE_CODE_OAUTH_TOKEN.trim();
  }
  const home = homedir();
  for (const candidate of [
    join(home, ".claude", ".credentials.json"),
    join(home, ".config", "agent-fleet", "secrets", "CLAUDE_OAUTH_ACCESS_TOKEN"),
  ]) {
    if (!existsSync(candidate)) continue;
    try {
      const raw = readFileSync(candidate, "utf8").trim();
      const parsed = JSON.parse(raw) as { claudeAiOauth?: { accessToken?: string } };
      if (parsed.claudeAiOauth?.accessToken) {
        return parsed.claudeAiOauth.accessToken.trim();
      }
    } catch {
      // continue
    }
  }
  if (process.platform === "darwin") {
    try {
      const raw = execFileSync(
        "security",
        ["find-generic-password", "-s", "Claude Code-credentials", "-w"],
        { encoding: "utf8" },
      ).trim();
      const parsed = JSON.parse(raw) as { claudeAiOauth?: { accessToken?: string } };
      if (parsed.claudeAiOauth?.accessToken) {
        return parsed.claudeAiOauth.accessToken.trim();
      }
    } catch {
      // continue
    }
  }
  throw new Error("Unable to resolve Claude OAuth token for Gmail MCP proxy.");
}

const DELETE_PATTERNS: readonly string[] = [
  "grafana@megabyte.space",
  "alerts@megabyte.space",
  "healthchecks@megabyte.space",
  "[firing:",
  "[resolved]",
  "[pulse alert",
  "healthchecks",
  "litellmdeploymentunhealthy",
  "disk space low",
  "targetdown",
  "could not refresh your reddit channel",
  "couldn't post to facebook",
  "could not post to facebook",
  "error posting on slack",
  "noreply@md.getsentry.com",
  "slow db query has regressed",
  "inbox-vision-",
  "failed-payments@stripe.com",
  "final attempt to collect payment",
  "account balance past due",
  "terminated due to non-payment",
  "payment failed",
  "failed payment",
  "unsuccessful payment",
  "payment was unsuccessful",
  "was unsuccessful again",
  "payment assistance",
  "unable to charge",
  "past due",
  "overdue",
  "action required: payment",
  "verification code",
  "sign-in code",
  "sign-in link",
  "login code",
  "your login to",
  "one-time passcode",
  "magic link to sign in",
  "security alert",
  "correction: take action",
  "delivery status notification (failure)",
  "undeliverable:",
];

export function shouldDeleteEmailThread(combinedText: string): boolean {
  const lower = combinedText.toLowerCase();
  return DELETE_PATTERNS.some((pattern) => lower.includes(pattern));
}

async function callGmailMcpTool(
  token: string,
  sessionId: string,
  rpcId: number,
  name: string,
  args: Record<string, unknown>,
): Promise<{ readonly isError: boolean; readonly text: string; readonly parsed: Record<string, unknown> }> {
  const res = await fetch(GMAIL_MCP_PROXY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "X-Mcp-Client-Session-Id": sessionId,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "mcp-servers-2025-12-04",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: rpcId,
      method: "tools/call",
      params: { name, arguments: args },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  const rawText = await res.text();
  const dataLine = rawText.split("\n").find((line) => line.startsWith("data: "));
  const envelope = JSON.parse(dataLine ? dataLine.slice(6) : rawText) as {
    result?: { isError?: boolean; content?: Array<{ text?: string }> };
    error?: { message?: string };
  };
  if (envelope.error) {
    return { isError: true, text: envelope.error.message ?? "RPC error", parsed: {} };
  }
  const contentText = envelope.result?.content?.[0]?.text ?? "{}";
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(contentText) as Record<string, unknown>;
  } catch {
    parsed = {};
  }
  return {
    isError: Boolean(envelope.result?.isError),
    text: contentText,
    parsed,
  };
}

async function main(): Promise<void> {
  const token = resolveClaudeOAuthToken();
  const sessionId = randomUUID();
  let rpcId = 1;

  const searchRes = await callGmailMcpTool(token, sessionId, rpcId++, "search_threads", {
    query: "in:inbox",
    pageSize: 50,
  });
  const threads = (Array.isArray(searchRes.parsed.threads) ? searchRes.parsed.threads : []) as GmailThreadSummary[];

  let deleteCandidates = 0;
  let archiveCandidates = 0;
  let deletedCount = 0;
  let archivedCount = 0;
  let modifyScopeAuthorized = true;
  let modifyScopeMessage: string | null = null;

  for (const thread of threads) {
    const full = await callGmailMcpTool(token, sessionId, rpcId++, "get_thread", {
      threadId: thread.id,
      messageFormat: "MINIMAL",
    });
    const combined = `${thread.snippet ?? ""} ${full.text}`;
    const isDelete = shouldDeleteEmailThread(combined);
    if (isDelete) {
      deleteCandidates++;
      if (modifyScopeAuthorized) {
        const tr = await callGmailMcpTool(token, sessionId, rpcId++, "trash_thread", { threadId: thread.id });
        if (tr.isError && tr.text.includes("insufficient authentication scopes")) {
          modifyScopeAuthorized = false;
          modifyScopeMessage = tr.text;
        } else if (!tr.isError) {
          deletedCount++;
        }
      }
    } else {
      archiveCandidates++;
      if (modifyScopeAuthorized) {
        const un = await callGmailMcpTool(token, sessionId, rpcId++, "unlabel_thread", {
          threadId: thread.id,
          labelIds: ["INBOX", "UNREAD"],
        });
        if (un.isError && un.text.includes("insufficient authentication scopes")) {
          modifyScopeAuthorized = false;
          modifyScopeMessage = un.text;
        } else if (!un.isError) {
          archivedCount++;
        }
      }
    }
  }

  const report: GmailTriageReport = {
    scannedThreads: threads.length,
    deleteCandidates,
    archiveCandidates,
    deletedCount,
    archivedCount,
    modifyScopeAuthorized,
    modifyScopeMessage,
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
