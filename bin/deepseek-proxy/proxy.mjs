#!/usr/bin/env node
/**
 * deepseek-proxy — keep DeepSeek V4 thinking mode usable behind Claude Code.
 *
 * Problem: DeepSeek's Anthropic-compatible endpoint (`https://api.deepseek.com/anthropic`)
 * requires `reasoning_content` to be sent back with every assistant turn while thinking is
 * enabled. Claude Code converts Anthropic <-> OpenAI internally and drops it, so the second
 * request of any tool-calling agentic task fails with a deterministic HTTP 400.
 *
 * Fix (three behaviours, all transparent to the client):
 *   1. Capture `reasoning_content` / `reasoning` / `thinking_delta` text from the streaming
 *      response, keyed by `tool_call_id` AND by the assistant text prefix.
 *   2. Re-inject the captured reasoning as a `thinking` content block (or the provider's
 *      `reasoning_content` field) into the matching assistant message on later turns.
 *   3. Strip `output_config` / `reasoning_effort` from requests whose `thinking.type` is
 *      `disabled`, so subagent calls do not trip DeepSeek's thinking-mode validation.
 *
 * Usage:
 *   node bin/deepseek-proxy/proxy.mjs
 *   ANTHROPIC_BASE_URL=http://127.0.0.1:8788 claude
 *
 * Env:
 *   DEEPSEEK_PROXY_PORT        listen port (default 8788)
 *   DEEPSEEK_PROXY_HOST        listen host (default 127.0.0.1)
 *   DEEPSEEK_UPSTREAM_URL      upstream base (default https://api.deepseek.com/anthropic)
 *   DEEPSEEK_PROXY_MAX_ENTRIES in-memory reasoning cache bound (default 2000)
 *   DEEPSEEK_API_KEY           forwarded as Authorization: Bearer when the client sends none
 *
 * Invariants: never logs the API key or request bodies; forwards unknown fields untouched;
 * returns the upstream status verbatim; works on Node >= 20 with zero dependencies.
 */
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const DEFAULTS = {
  port: Number(process.env.DEEPSEEK_PROXY_PORT || 8788),
  host: process.env.DEEPSEEK_PROXY_HOST || '127.0.0.1',
  upstream: process.env.DEEPSEEK_UPSTREAM_URL || 'https://api.deepseek.com/anthropic',
  maxEntries: Number(process.env.DEEPSEEK_PROXY_MAX_ENTRIES || 2000),
};

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

/**
 * Request headers we must not forward. Claude Code asks for zstd; Node's http client
 * does not decode it, so the client receives compressed bytes and fails with
 * ZstdDecompressionError. Dropping the header makes the upstream answer uncompressed,
 * which is what the SSE tap needs to read anyway.
 */
const DROP_REQUEST_HEADERS = new Set(['accept-encoding']);

/* ------------------------------------------------------------------ *
 * Reasoning cache
 * ------------------------------------------------------------------ */

/**
 * Bounded insertion-ordered map. Claude Code replays history from the newest
 * turn backwards far more often than it asks for something ancient, so oldest
 * entries are evicted first.
 */
export function createReasoningCache(maxEntries = DEFAULTS.maxEntries) {
  const byToolCall = new Map();
  const byTextPrefix = new Map();

  const remember = (map, key, value) => {
    if (!key || !value) return;
    if (map.has(key)) map.delete(key);
    map.set(key, value);
    while (map.size > maxEntries) {
      const oldest = map.keys().next().value;
      map.delete(oldest);
    }
  };

  return {
    rememberToolCall(toolCallId, reasoning) {
      remember(byToolCall, toolCallId, reasoning);
    },
    rememberText(prefix, reasoning) {
      if (!prefix || prefix.length < 16) return;
      remember(byTextPrefix, prefix, reasoning);
    },
    lookupToolCall(toolCallId) {
      return byToolCall.get(toolCallId);
    },
    lookupText(text) {
      if (!text) return undefined;
      const direct = byTextPrefix.get(text);
      if (direct) return direct;
      for (const [prefix, reasoning] of byTextPrefix) {
        if (text.startsWith(prefix)) return reasoning;
      }
      return undefined;
    },
    get size() {
      return byToolCall.size + byTextPrefix.size;
    },
    clear() {
      byToolCall.clear();
      byTextPrefix.clear();
    },
  };
}

/* ------------------------------------------------------------------ *
 * Message helpers
 * ------------------------------------------------------------------ */

export function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('');
}

export function toolCallIdsOf(content) {
  if (!Array.isArray(content)) return [];
  return content
    .filter((b) => b && b.type === 'tool_use' && typeof b.id === 'string')
    .map((b) => b.id);
}

export function hasThinkingBlock(content) {
  return (
    Array.isArray(content) &&
    content.some((b) => b && (b.type === 'thinking' || b.type === 'redacted_thinking'))
  );
}

/**
 * Normalise a message's content to a block array so thinking can be prepended.
 * A bare string becomes one text block.
 */
export function toBlocks(content) {
  if (typeof content === 'string') return content ? [{ type: 'text', text: content }] : [];
  return Array.isArray(content) ? content.slice() : [];
}

/* ------------------------------------------------------------------ *
 * Request rewriting
 * ------------------------------------------------------------------ */

function thinkingDisabled(body) {
  const t = body && body.thinking;
  return Boolean(t) && t.type === 'disabled';
}

/** Remove fields DeepSeek rejects when the caller explicitly disabled thinking. */
export function stripThinkingControls(body) {
  if (!body || typeof body !== 'object') return body;
  let changed = false;
  for (const field of ['output_config', 'reasoning_effort', 'reasoning']) {
    if (field in body) {
      delete body[field];
      changed = true;
    }
  }
  return changed ? body : body;
}

/**
 * Re-inject captured reasoning into assistant messages that lost it.
 * Mutates a shallow clone; the caller's object is never touched.
 */
export function reinjectReasoning(body, cache) {
  if (!body || !Array.isArray(body.messages)) return { body, injected: 0 };
  const wantsThinking = !thinkingDisabled(body);
  if (!wantsThinking) return { body, injected: 0 };

  let injected = 0;
  const messages = body.messages.map((message) => {
    if (!message || message.role !== 'assistant') return message;

    let reasoning;
    let key;
    for (const id of toolCallIdsOf(message.content)) {
      reasoning = cache.lookupToolCall(id);
      if (reasoning) {
        key = `tool:${id}`;
        break;
      }
    }
    if (!reasoning) {
      const text = textOf(message.content);
      reasoning = cache.lookupText(text);
      if (reasoning) key = `text:${text.slice(0, 64)}`;
    }
    if (!reasoning) return message;

    if (hasThinkingBlock(message.content)) return message;

    injected += 1;
    const blocks = toBlocks(message.content);
    const next = [
      { type: 'thinking', thinking: reasoning, signature: `deepseek-proxy:${key}` },
      ...blocks,
    ];
    return { ...message, content: next };
  });

  if (!injected) return { body, injected: 0 };
  return { body: { ...body, messages }, injected };
}

/* ------------------------------------------------------------------ *
 * SSE parsing
 * ------------------------------------------------------------------ */

/** Extract `reasoning_content` / `reasoning` / `thinking_delta` text from one JSON chunk. */
export function reasoningFromChunk(chunk) {
  if (!chunk || typeof chunk !== 'object') return '';
  const parts = [];

  const delta = chunk.delta || chunk.choices?.[0]?.delta || chunk.choices?.[0]?.message;
  if (delta && typeof delta === 'object') {
    for (const field of ['reasoning_content', 'reasoning']) {
      if (typeof delta[field] === 'string') parts.push(delta[field]);
    }
    if (typeof delta.thinking === 'string') parts.push(delta.thinking);
    if (Array.isArray(delta.content)) {
      for (const block of delta.content) {
        if (block && block.type === 'thinking_delta' && typeof block.thinking === 'string') {
          parts.push(block.thinking);
        }
      }
    }
  }

  // Non-streaming / content-block form.
  for (const block of chunk.content || []) {
    if (block && block.type === 'thinking' && typeof block.thinking === 'string') {
      parts.push(block.thinking);
    }
  }
  if (typeof chunk.reasoning_content === 'string') parts.push(chunk.reasoning_content);
  return parts.join('');
}

/** Extract tool-call ids announced in one chunk (OpenAI or Anthropic shape). */
export function toolCallIdsFromChunk(chunk) {
  if (!chunk || typeof chunk !== 'object') return [];
  const ids = [];
  const delta = chunk.delta || chunk.choices?.[0]?.delta;
  if (delta && Array.isArray(delta.tool_calls)) {
    for (const call of delta.tool_calls) if (call && call.id) ids.push(call.id);
  }
  if (Array.isArray(chunk.content)) {
    for (const block of chunk.content) {
      if (block && block.type === 'tool_use' && block.id) ids.push(block.id);
    }
  }
  return ids;
}

/** Extract assistant text deltas (used as a secondary cache key). */
export function textFromChunk(chunk) {
  if (!chunk || typeof chunk !== 'object') return '';
  const parts = [];
  const delta = chunk.delta || chunk.choices?.[0]?.delta;
  if (delta && typeof delta.text === 'string') parts.push(delta.text);
  if (typeof chunk.text === 'string') parts.push(chunk.text);
  if (Array.isArray(chunk.content)) {
    for (const block of chunk.content) {
      if (block && block.type === 'text_delta' && typeof block.text === 'string') {
        parts.push(block.text);
      }
    }
  }
  return parts.join('');
}

/**
 * Consume a byte stream, feed complete SSE `data:` JSON lines to `onJson`,
 * and tee the raw bytes through to `onBytes`. Returns when the stream ends.
 */
export function makeSseTap(onJson, onBytes) {
  let buffer = '';
  return {
    push(text) {
      if (onBytes) onBytes(text);
      buffer += text;
      let index;
      while ((index = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, index).replace(/\r$/, '');
        buffer = buffer.slice(index + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          onJson(JSON.parse(payload));
        } catch {
          /* non-JSON data line: ignore */
        }
      }
    },
    end() {
      const rest = buffer.trim();
      buffer = '';
      if (!rest.startsWith('data:')) return;
      const payload = rest.slice(5).trim();
      if (!payload || payload === '[DONE]') return;
      try {
        onJson(JSON.parse(payload));
      } catch {
        /* ignore */
      }
    },
  };
}

/* ------------------------------------------------------------------ *
 * Response capture
 * ------------------------------------------------------------------ */

/**
 * Accumulates reasoning text and tool-call ids for one upstream response, then
 * files them into the cache under every key it learns.
 */
export function createCapture(cache) {
  let reasoning = '';
  let text = '';
  const toolCallIds = [];

  return {
    chunk(json) {
      reasoning += reasoningFromChunk(json);
      text += textFromChunk(json);
      for (const id of toolCallIdsFromChunk(json)) {
        if (!toolCallIds.includes(id)) toolCallIds.push(id);
      }
    },
    finish() {
      const trimmed = reasoning.trim();
      if (!trimmed) return { stored: false, chars: 0 };
      for (const id of toolCallIds) cache.rememberToolCall(id, trimmed);
      cache.rememberText(text.trim(), trimmed);
      return { stored: true, chars: trimmed.length, keys: toolCallIds.length };
    },
  };
}

/* ------------------------------------------------------------------ *
 * HTTP server
 * ------------------------------------------------------------------ */

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 64 * 1024 * 1024) {
        reject(new Error('request_body_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function forwardHeaders(req) {
  const headers = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (HOP_BY_HOP.has(name.toLowerCase())) continue;
    if (DROP_REQUEST_HEADERS.has(name.toLowerCase())) continue;
    headers[name] = value;
  }
  if (!headers.authorization && !headers['x-api-key'] && process.env.DEEPSEEK_API_KEY) {
    headers.authorization = `Bearer ${process.env.DEEPSEEK_API_KEY}`;
  }
  return headers;
}

export function createProxy(options = {}) {
  const config = { ...DEFAULTS, ...options };
  const upstream = new URL(config.upstream);
  const transport = upstream.protocol === 'http:' ? http : https;
  const cache = options.cache || createReasoningCache(config.maxEntries);
  const stats = { requests: 0, injectedMessages: 0, capturedResponses: 0, stripped: 0 };

  const server = http.createServer(async (req, res) => {
    let raw;
    try {
      raw = await readBody(req);
    } catch (error) {
      res.writeHead(413, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ type: 'error', error: { type: 'request_too_large', message: error.message } }));
      return;
    }

    let body;
    let bodyText;
    try {
      body = raw.length ? JSON.parse(raw.toString('utf8')) : undefined;
      bodyText = body === undefined ? undefined : JSON.stringify(rewriteRequest(body, cache, stats));
    } catch {
      body = undefined;
      bodyText = raw.length ? raw : undefined;
    }

    const headers = forwardHeaders(req);
    if (bodyText && bodyText !== raw) {
      headers['content-length'] = Buffer.byteLength(bodyText);
      delete headers['transfer-encoding'];
    } else if (raw.length) {
      headers['content-length'] = raw.length;
    }

    const target = new URL(upstream.href.replace(/\/$/, '') + req.url);
    stats.requests += 1;

    const upstreamReq = transport.request(
      target,
      { method: req.method, headers },
      (upstreamRes) => {
        const responseHeaders = {};
        for (const [name, value] of Object.entries(upstreamRes.headers)) {
          if (HOP_BY_HOP.has(name.toLowerCase())) continue;
          if (name.toLowerCase() === 'content-encoding') continue;
          responseHeaders[name] = value;
        }
        res.writeHead(upstreamRes.statusCode || 502, responseHeaders);

        const contentType = String(upstreamRes.headers['content-type'] || '');
        const isSse = contentType.includes('text/event-stream');
        const isJson = contentType.includes('application/json');

        if (!isSse && !isJson) {
          upstreamRes.pipe(res);
          return;
        }

        const capture = createCapture(cache);
        const tap = makeSseTap(
          (json) => capture.chunk(json),
          (text) => res.write(text),
        );

        upstreamRes.setEncoding('utf8');
        if (isSse) {
          upstreamRes.on('data', (text) => tap.push(text));
          upstreamRes.on('end', () => {
            tap.end();
            if ((upstreamRes.statusCode || 0) < 400 && capture.finish().stored) {
              stats.capturedResponses += 1;
            }
            res.end();
          });
        } else {
          let jsonText = '';
          upstreamRes.on('data', (text) => {
            jsonText += text;
          });
          upstreamRes.on('end', () => {
            if ((upstreamRes.statusCode || 0) < 400) {
              try {
                const json = JSON.parse(jsonText);
                capture.chunk(json);
                const finish = capture.finish();
                if (finish.stored) {
                  stats.capturedResponses += 1;
                  jsonText = JSON.stringify(json);
                }
              } catch {
                /* pass through unparsed */
              }
            }
            res.end(jsonText);
          });
        }

        upstreamRes.on('error', () => res.destroy());
      },
    );

    upstreamReq.on('error', (error) => {
      if (!res.headersSent) {
        res.writeHead(502, { 'content-type': 'application/json' });
      }
      res.end(
        JSON.stringify({
          type: 'error',
          error: { type: 'upstream_unavailable', message: error.message },
        }),
      );
    });

    if (bodyText) upstreamReq.write(bodyText);
    upstreamReq.end();
  });

  server.on('request', () => {});
  server.proxyStats = stats;
  server.proxyCache = cache;
  return server;
}

export function rewriteRequest(body, cache, stats) {
  if (!body || typeof body !== 'object') return body;
  let next = body;
  if (thinkingDisabled(next)) {
    next = { ...next };
    stripThinkingControls(next);
    if (stats) stats.stripped += 1;
  }
  const result = reinjectReasoning(next, cache);
  if (stats) stats.injectedMessages += result.injected;
  return result.body;
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */

function isMain() {
  try {
    return process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
  } catch {
    return false;
  }
}

if (isMain()) {
  const server = createProxy();
  server.listen(DEFAULTS.port, DEFAULTS.host, () => {
    process.stdout.write(
      `deepseek-proxy listening on http://${DEFAULTS.host}:${DEFAULTS.port} -> ${DEFAULTS.upstream}\n`,
    );
  });
  const shutdown = () => server.close(() => process.exit(0));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
