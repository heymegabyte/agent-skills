#!/usr/bin/env node
/**
 * @file bin/lib/langfuse-safe.ts
 * @description Always-on Langfuse telemetry client with strict bounded timeout (default 2500ms),
 * 3-strike circuit breaker (60s cooldown), and fail-open local JSONL spool fallback so a slow or
 * unreachable Langfuse endpoint never blocks or fails an LLM call, Worker request, or agent turn.
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface LangfuseSafeConfig {
  baseUrl?: string;
  publicKey?: string;
  secretKey?: string;
  timeoutMs?: number;
  failureThreshold?: number;
  cooldownMs?: number;
  spoolFilePath?: string;
  fetchImpl?: typeof fetch;
}

export interface LangfuseTraceEvent {
  id: string;
  name: string;
  model?: string;
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    totalCostUsd?: number;
  };
  timestamp?: string;
}

export interface LangfuseSafeResult {
  delivered: boolean;
  spooled: boolean;
  circuitOpen: boolean;
  durationMs: number;
  status?: number;
  error?: string;
}

export interface CircuitBreakerState {
  consecutiveFailures: number;
  openedAtEpochMs: number | null;
  totalDelivered: number;
  totalSpooled: number;
  totalFallbackHits: number;
}

const DEFAULT_TIMEOUT_MS = 2500;
const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_COOLDOWN_MS = 60_000;

export class LangfuseSafeClient {
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly secretKey: string;
  private readonly timeoutMs: number;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly spoolFilePath: string;
  private readonly fetchImpl: typeof fetch;
  private readonly promptCache = new Map<string, string>();

  private state: CircuitBreakerState = {
    consecutiveFailures: 0,
    openedAtEpochMs: null,
    totalDelivered: 0,
    totalSpooled: 0,
    totalFallbackHits: 0,
  };

  constructor(config: LangfuseSafeConfig = {}) {
    this.baseUrl = (
      config.baseUrl ??
      process.env.LANGFUSE_HOST ??
      process.env.LANGFUSE_BASEURL ??
      'https://us.cloud.langfuse.com'
    ).replace(/\/+$/, '');
    this.publicKey = config.publicKey ?? process.env.LANGFUSE_PUBLIC_KEY ?? '';
    this.secretKey = config.secretKey ?? process.env.LANGFUSE_SECRET_KEY ?? '';
    const envTimeout = Number(process.env.LANGFUSE_TIMEOUT_MS ?? '');
    this.timeoutMs =
      config.timeoutMs ??
      (Number.isFinite(envTimeout) && envTimeout > 0 ? envTimeout : DEFAULT_TIMEOUT_MS);
    this.failureThreshold = config.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
    this.cooldownMs = config.cooldownMs ?? DEFAULT_COOLDOWN_MS;
    const defaultSpoolDir =
      process.env.LANGFUSE_SPOOL_DIR ??
      path.join(
        process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache'),
        'megabyte',
        'ai',
        'langfuse-spool',
      );
    this.spoolFilePath = config.spoolFilePath ?? path.join(defaultSpoolDir, 'traces.jsonl');
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch;
  }

  public getCircuitState(): Readonly<CircuitBreakerState> {
    return { ...this.state };
  }

  public isCircuitOpen(nowMs = Date.now()): boolean {
    if (this.state.openedAtEpochMs === null) {
      return false;
    }
    if (nowMs - this.state.openedAtEpochMs >= this.cooldownMs) {
      // Half-open: allow next probe through
      this.state.openedAtEpochMs = null;
      this.state.consecutiveFailures = 0;
      return false;
    }
    return true;
  }

  private recordSuccess(): void {
    this.state.consecutiveFailures = 0;
    this.state.openedAtEpochMs = null;
    this.state.totalDelivered += 1;
  }

  private recordFailure(nowMs = Date.now()): void {
    this.state.consecutiveFailures += 1;
    this.state.totalFallbackHits += 1;
    if (this.state.consecutiveFailures >= this.failureThreshold) {
      this.state.openedAtEpochMs = nowMs;
    }
  }

  private writeToSpool(event: LangfuseTraceEvent, reason: string): boolean {
    try {
      fs.mkdirSync(path.dirname(this.spoolFilePath), { recursive: true });
      const record = JSON.stringify({
        spooledAt: new Date().toISOString(),
        reason,
        event,
      });
      fs.appendFileSync(this.spoolFilePath, `${record}\n`, 'utf8');
      this.state.totalSpooled += 1;
      return true;
    } catch {
      return false;
    }
  }

  private buildAuthHeader(): string | null {
    if (!this.publicKey || !this.secretKey) {
      return null;
    }
    const token = Buffer.from(`${this.publicKey}:${this.secretKey}`, 'utf8').toString('base64');
    return `Basic ${token}`;
  }

  /**
   * Sends a trace/generation ingestion batch to Langfuse with a strict timeout.
   * Never throws: if Langfuse is unconfigured, down, slow, or circuit-broken,
   * spools locally and returns `{ delivered: false, spooled: true }`.
   */
  public async traceSafe(event: LangfuseTraceEvent): Promise<LangfuseSafeResult> {
    const startMs = Date.now();
    const enrichedEvent: LangfuseTraceEvent = {
      ...event,
      timestamp: event.timestamp ?? new Date().toISOString(),
    };

    if (this.isCircuitOpen(startMs)) {
      const spooled = this.writeToSpool(enrichedEvent, 'circuit_open');
      return {
        delivered: false,
        spooled,
        circuitOpen: true,
        durationMs: Date.now() - startMs,
        error: 'Langfuse circuit breaker is open; trace spooled locally',
      };
    }

    const authHeader = this.buildAuthHeader();
    if (!authHeader) {
      const spooled = this.writeToSpool(enrichedEvent, 'missing_credentials');
      return {
        delivered: false,
        spooled,
        circuitOpen: false,
        durationMs: Date.now() - startMs,
        error: 'Langfuse credentials not present; trace spooled locally',
      };
    }

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/public/ingestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          batch: [
            {
              id: enrichedEvent.id,
              type: 'trace-create',
              timestamp: enrichedEvent.timestamp,
              body: {
                id: enrichedEvent.id,
                name: enrichedEvent.name,
                input: enrichedEvent.input,
                output: enrichedEvent.output,
                metadata: {
                  ...enrichedEvent.metadata,
                  model: enrichedEvent.model,
                  usage: enrichedEvent.usage,
                },
              },
            },
          ],
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok && response.status !== 207) {
        this.recordFailure();
        const spooled = this.writeToSpool(enrichedEvent, `http_${response.status}`);
        return {
          delivered: false,
          spooled,
          circuitOpen: this.isCircuitOpen(),
          durationMs: Date.now() - startMs,
          status: response.status,
          error: `Langfuse ingestion returned HTTP ${response.status}`,
        };
      }

      this.recordSuccess();
      return {
        delivered: true,
        spooled: false,
        circuitOpen: false,
        durationMs: Date.now() - startMs,
        status: response.status,
      };
    } catch (err) {
      this.recordFailure();
      const message = err instanceof Error ? err.message : String(err);
      const spooled = this.writeToSpool(enrichedEvent, message);
      return {
        delivered: false,
        spooled,
        circuitOpen: this.isCircuitOpen(),
        durationMs: Date.now() - startMs,
        error: message,
      };
    }
  }

  /**
   * Fetches a managed prompt from Langfuse with a strict timeout and falls back
   * to cached or provided default prompt text if Langfuse is down.
   */
  public async getPromptWithFallback(promptName: string, fallbackPrompt: string): Promise<string> {
    if (this.isCircuitOpen()) {
      this.state.totalFallbackHits += 1;
      return this.promptCache.get(promptName) ?? fallbackPrompt;
    }

    const authHeader = this.buildAuthHeader();
    if (!authHeader) {
      this.state.totalFallbackHits += 1;
      return this.promptCache.get(promptName) ?? fallbackPrompt;
    }

    try {
      const url = `${this.baseUrl}/api/public/v2/prompts/${encodeURIComponent(promptName)}`;
      const response = await this.fetchImpl(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: authHeader,
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });

      if (!response.ok) {
        this.recordFailure();
        return this.promptCache.get(promptName) ?? fallbackPrompt;
      }

      const payload = (await response.json()) as { prompt?: string };
      if (typeof payload.prompt === 'string' && payload.prompt.length > 0) {
        this.promptCache.set(promptName, payload.prompt);
        this.recordSuccess();
        return payload.prompt;
      }

      return this.promptCache.get(promptName) ?? fallbackPrompt;
    } catch {
      this.recordFailure();
      return this.promptCache.get(promptName) ?? fallbackPrompt;
    }
  }

  /**
   * Probes `/api/public/health` with a strict bounded timeout. Never throws.
   */
  public async probeHealth(): Promise<{
    healthy: boolean;
    latencyMs: number;
    status?: number;
    circuitOpen: boolean;
    error?: string;
  }> {
    const startMs = Date.now();
    try {
      const response = await this.fetchImpl(`${this.baseUrl}/api/public/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      const healthy = response.ok;
      if (healthy) {
        this.state.consecutiveFailures = 0;
        this.state.openedAtEpochMs = null;
      } else {
        this.recordFailure();
      }
      return {
        healthy,
        latencyMs: Date.now() - startMs,
        status: response.status,
        circuitOpen: this.isCircuitOpen(),
      };
    } catch (err) {
      this.recordFailure();
      return {
        healthy: false,
        latencyMs: Date.now() - startMs,
        circuitOpen: this.isCircuitOpen(),
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Replays locally spooled traces when Langfuse recovers.
   */
  public async replaySpool(): Promise<{ replayed: number; remaining: number }> {
    if (!fs.existsSync(this.spoolFilePath)) {
      return { replayed: 0, remaining: 0 };
    }
    const raw = fs.readFileSync(this.spoolFilePath, 'utf8').trim();
    if (!raw) {
      return { replayed: 0, remaining: 0 };
    }
    const lines = raw.split('\n').filter(Boolean);
    const remainingLines: string[] = [];
    let replayed = 0;

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as { event?: LangfuseTraceEvent };
        if (!parsed.event) {
          continue;
        }
        if (this.isCircuitOpen()) {
          remainingLines.push(line);
          continue;
        }
        const res = await this.traceSafe(parsed.event);
        if (res.delivered) {
          replayed += 1;
        } else {
          remainingLines.push(line);
        }
      } catch {
        // Drop malformed line
      }
    }

    fs.writeFileSync(
      this.spoolFilePath,
      remainingLines.length > 0 ? `${remainingLines.join('\n')}\n` : '',
      'utf8',
    );
    return { replayed, remaining: remainingLines.length };
  }
}
