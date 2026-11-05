#!/usr/bin/env node
/**
 * deepseek-proxy.test.mjs — regression coverage for the DeepSeek V4 thinking-mode proxy.
 *
 * The fake upstream mimics DeepSeek's Anthropic-compatible endpoint: while thinking is
 * enabled it REJECTS (HTTP 400) any request whose assistant messages omit the reasoning
 * that the previous turn returned. That is the exact bug MEG-207 tracks — without the
 * proxy a 3-turn tool-calling conversation dies on turn 2.
 *
 * Covered:
 *   - pure helpers: reasoning extraction, tool-call ids, strip, re-inject, cache bounds
 *   - end-to-end 3-turn tool-calling conversation through the proxy (SSE, thinking on)
 *   - negative control: the same conversation WITHOUT the proxy fails on turn 2
 *   - thinking disabled -> output_config / reasoning_effort stripped
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  createReasoningCache,
  createProxy,
  reinjectReasoning,
  reasoningFromChunk,
  toolCallIdsFromChunk,
  stripThinkingControls,
  rewriteRequest,
  textOf,
} from '../deepseek-proxy/proxy.mjs';

const TOOL_TURN_REASONING = 'I should inspect the workspace before editing anything.';

/* ------------------------------------------------------------------ *
 * Fake DeepSeek upstream
 * ------------------------------------------------------------------ */

function sse(events) {
  return events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
}

function startFakeUpstream() {
  const seen = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
    });
    req.on('end', () => {
      const body = JSON.parse(raw);
      seen.push(body);
      const thinkingOff = body.thinking && body.thinking.type === 'disabled';

      if (!thinkingOff && body.output_config) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            type: 'error',
            error: { type: 'invalid_request_error', message: 'output_config is not supported with thinking' },
          }),
        );
        return;
      }

      const assistants = (body.messages || []).filter((m) => m.role === 'assistant');
      if (!thinkingOff) {
        for (const message of assistants) {
          const blocks = Array.isArray(message.content) ? message.content : [];
          const hasTool = blocks.some((b) => b.type === 'tool_use');
          const hasThinking = blocks.some((b) => b.type === 'thinking' && b.thinking);
          if (hasTool && !hasThinking) {
            res.writeHead(400, { 'content-type': 'application/json' });
            res.end(
              JSON.stringify({
                type: 'error',
                error: {
                  type: 'invalid_request_error',
                  message:
                    'reasoning_content is required on assistant messages with tool_calls when thinking is enabled',
                },
              }),
            );
            return;
          }
        }
      }

      const isFirstTurn = assistants.length === 0;
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
      });
      if (isFirstTurn) {
        res.end(
          sse([
            { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: TOOL_TURN_REASONING } },
            { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'Checking the workspace.' } },
            { type: 'content_block_delta', index: 2, delta: { type: 'input_json_delta', partial_json: '' } },
            { type: 'message_delta', delta: { stop_reason: 'tool_use' } },
          ]),
        );
        return;
      }
      res.end(
        sse([
          { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Done: the workspace is clean.' } },
          { type: 'message_delta', delta: { stop_reason: 'end_turn' } },
        ]),
      );
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, port, seen });
    });
  });
}

function post(port, path, payload) {
  const data = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port, path, method: 'POST', headers: { 'content-type': 'application/json' } },
      (res) => {
        let text = '';
        res.on('data', (c) => {
          text += c;
        });
        res.on('end', () => resolve({ status: res.statusCode, text }));
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

/**
 * Replay a 3-turn conversation. Turn 1: tool call. Turn 2: assistant message carrying the
 * tool result. Turn 3: final answer. Claude Code's conversion drops `thinking` from the
 * assistant turn even though the tool call survives — that is what breaks turn 2 upstream.
 */
async function conversation({ port, path }) {
  const messages = [{ role: 'user', content: 'Fix the failing test.' }];

  const turn1 = await post(port, path, { model: 'deepseek-v4-pro', thinking: { type: 'enabled' }, messages });
  assert.equal(turn1.status, 200, `turn 1 failed: ${turn1.text}`);
  const reasoning = reasoningFromChunk(
    turn1.text
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => JSON.parse(l.slice(5)))
      .find((e) => e.delta && e.delta.type === 'thinking_delta'),
  );
  assert.equal(reasoning, TOOL_TURN_REASONING);

  messages.push({
    role: 'assistant',
    content: [{ type: 'text', text: 'Checking the workspace.' }, { type: 'tool_use', id: 'toolu_01', name: 'Bash', input: { cmd: 'git status' } }],
  });
  messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_01', content: 'clean' }] });
  const turn2 = await post(port, path, { model: 'deepseek-v4-pro', thinking: { type: 'enabled' }, messages });
  assert.equal(turn2.status, 200, `turn 2 failed: ${turn2.text}`);

  messages.push({ role: 'assistant', content: 'Done: the workspace is clean.' });
  messages.push({ role: 'user', content: 'Thanks.' });
  const turn3 = await post(port, path, { model: 'deepseek-v4-pro', thinking: { type: 'enabled' }, messages });
  assert.equal(turn3.status, 200, `turn 3 failed: ${turn3.text}`);
  return { turn2, turn3 };
}

/* ------------------------------------------------------------------ *
 * Helper tests
 * ------------------------------------------------------------------ */

test('reasoningFromChunk reads every provider field it may see', () => {
  assert.equal(reasoningFromChunk({ delta: { type: 'thinking_delta', thinking: 'a' } }), 'a');
  assert.equal(reasoningFromChunk({ delta: { reasoning_content: 'b' } }), 'b');
  assert.equal(reasoningFromChunk({ choices: [{ delta: { reasoning_content: 'c' } }] }), 'c');
  assert.equal(reasoningFromChunk({ content: [{ type: 'thinking', thinking: 'd' }] }), 'd');
  assert.equal(reasoningFromChunk({ content: [{ type: 'text', text: 'no' }] }), '');
});

test('toolCallIdsFromChunk reads OpenAI and Anthropic shapes', () => {
  assert.deepEqual(toolCallIdsFromChunk({ delta: { tool_calls: [{ id: 'call_1' }] } }), ['call_1']);
  assert.deepEqual(toolCallIdsFromChunk({ content: [{ type: 'tool_use', id: 'toolu_2' }] }), ['toolu_2']);
  assert.deepEqual(toolCallIdsFromChunk({ delta: { text: 'x' } }), []);
});

test('textOf joins text blocks only', () => {
  assert.equal(textOf([{ type: 'text', text: 'a' }, { type: 'tool_use', id: 't' }, { type: 'text', text: 'b' }]), 'ab');
  assert.equal(textOf('plain'), 'plain');
});

test('stripThinkingControls removes output_config and reasoning_effort', () => {
  const body = { thinking: { type: 'disabled' }, output_config: { effort: 'high' }, reasoning_effort: 'high', messages: [] };
  stripThinkingControls(body);
  assert.equal('output_config' in body, false);
  assert.equal('reasoning_effort' in body, false);
  assert.deepEqual(body.messages, []);
});

test('reinjectReasoning restores a thinking block keyed by tool_use id', () => {
  const cache = createReasoningCache(10);
  cache.rememberToolCall('toolu_9', 'why');
  const body = {
    thinking: { type: 'enabled' },
    messages: [{ role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_9', name: 'x', input: {} }] }],
  };
  const out = reinjectReasoning(body, cache);
  assert.equal(out.injected, 1);
  assert.equal(out.body.messages[0].content[0].type, 'thinking');
  assert.equal(out.body.messages[0].content[0].thinking, 'why');
  assert.equal(out.body.messages[0].content[1].type, 'tool_use');
  // Source body untouched.
  assert.equal(body.messages[0].content.length, 1);
});

test('reinjectReasoning is a no-op when a thinking block already exists', () => {
  const cache = createReasoningCache(10);
  cache.rememberToolCall('toolu_9', 'why');
  const body = {
    thinking: { type: 'enabled' },
    messages: [{ role: 'assistant', content: [{ type: 'thinking', thinking: 'kept' }, { type: 'tool_use', id: 'toolu_9' }] }],
  };
  assert.equal(reinjectReasoning(body, cache).injected, 0);
});

test('reinjectReasoning skips requests that disabled thinking', () => {
  const cache = createReasoningCache(10);
  cache.rememberToolCall('toolu_9', 'why');
  const body = {
    thinking: { type: 'disabled' },
    messages: [{ role: 'assistant', content: [{ type: 'tool_use', id: 'toolu_9' }] }],
  };
  assert.equal(reinjectReasoning(body, cache).injected, 0);
});

test('cache evicts the oldest entries past its bound', () => {
  const cache = createReasoningCache(2);
  cache.rememberToolCall('a', '1');
  cache.rememberToolCall('b', '2');
  cache.rememberToolCall('c', '3');
  assert.equal(cache.lookupToolCall('a'), undefined);
  assert.equal(cache.lookupToolCall('b'), '2');
  assert.equal(cache.lookupToolCall('c'), '3');
});

test('rewriteRequest strips for disabled thinking and injects for enabled', () => {
  const cache = createReasoningCache(10);
  cache.rememberToolCall('t1', 'r');
  const stats = { stripped: 0, injectedMessages: 0, requests: 0, capturedResponses: 0 };
  const disabled = rewriteRequest(
    { thinking: { type: 'disabled' }, output_config: { e: 1 }, messages: [] },
    cache,
    stats,
  );
  assert.equal('output_config' in disabled, false);
  assert.equal(stats.stripped, 1);

  const enabled = rewriteRequest(
    { thinking: { type: 'enabled' }, messages: [{ role: 'assistant', content: [{ type: 'tool_use', id: 't1' }] }] },
    cache,
    stats,
  );
  assert.equal(enabled.messages[0].content[0].type, 'thinking');
  assert.equal(stats.injectedMessages, 1);
});

/* ------------------------------------------------------------------ *
 * End-to-end
 * ------------------------------------------------------------------ */

test('negative control: without the proxy the 3-turn conversation fails on turn 2', async () => {
  const { server, port } = await startFakeUpstream();
  try {
    await assert.rejects(conversation({ port, path: '/v1/messages' }), /turn 2 failed:[\s\S]*400/);
  } finally {
    server.close();
  }
});

test('through the proxy the 3-turn thinking conversation succeeds', async () => {
  const { server: upstream, port: upstreamPort } = await startFakeUpstream();
  const proxy = createProxy({
    upstream: `http://127.0.0.1:${upstreamPort}`,
    cache: createReasoningCache(100),
  });
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  const { port } = proxy.address();
  try {
    await conversation({ port, path: '/v1/messages' });
    assert.equal(proxy.proxyStats.capturedResponses, 1);
    assert.ok(proxy.proxyStats.injectedMessages >= 2, 'each later turn re-injects the reasoning');
  } finally {
    proxy.close();
    upstream.close();
  }
});

test('through the proxy a thinking-disabled subagent request has controls stripped', async () => {
  const { server: upstream, port: upstreamPort, seen } = await startFakeUpstream();
  const proxy = createProxy({ upstream: `http://127.0.0.1:${upstreamPort}` });
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  const { port } = proxy.address();
  try {
    const res = await post(port, '/v1/messages', {
      model: 'deepseek-v4-pro',
      thinking: { type: 'disabled' },
      output_config: { effort: 'high' },
      reasoning_effort: 'high',
      messages: [{ role: 'user', content: 'hi' }],
    });
    assert.equal(res.status, 200, res.text);
    assert.equal('output_config' in seen.at(-1), false);
    assert.equal('reasoning_effort' in seen.at(-1), false);
  } finally {
    proxy.close();
    upstream.close();
  }
});

test('the proxy drops accept-encoding so the client receives plaintext SSE', async () => {
  let seenEncoding = 'missing';
  const upstream = http.createServer((req, res) => {
    seenEncoding = req.headers['accept-encoding'] ?? 'missing';
    req.on('data', () => {});
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.end('data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"plain"}}\n\n');
    });
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const proxy = createProxy({ upstream: `http://127.0.0.1:${upstream.address().port}` });
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  const port = proxy.address().port;
  try {
    const res = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          host: '127.0.0.1',
          port,
          path: '/v1/messages',
          method: 'POST',
          headers: { 'content-type': 'application/json', 'accept-encoding': 'zstd, br, gzip' },
        },
        (r) => {
          let t = '';
          r.on('data', (c) => { t += c; });
          r.on('end', () => resolve({ status: r.statusCode, text: t, headers: r.headers }));
        },
      );
      req.on('error', reject);
      req.end(JSON.stringify({ messages: [] }));
    });
    assert.equal(seenEncoding, 'missing');
    assert.equal(res.status, 200);
    assert.match(res.text, /plain/);
    assert.equal(res.headers['content-encoding'], undefined);
  } finally {
    proxy.close();
    upstream.close();
  }
});

test('the proxy preserves the upstream base path and the request path', async () => {
  let seenUrl;
  const upstream = http.createServer((req, res) => {
    seenUrl = req.url;
    req.on('data', () => {});
    req.on('end', () => {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end('{}');
    });
  });
  await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
  const proxy = createProxy({ upstream: `http://127.0.0.1:${upstream.address().port}/anthropic` });
  await new Promise((resolve) => proxy.listen(0, '127.0.0.1', resolve));
  try {
    const res = await post(proxy.address().port, '/v1/messages?beta=true', { messages: [] });
    assert.equal(res.status, 200);
    assert.equal(seenUrl, '/anthropic/v1/messages?beta=true');
  } finally {
    proxy.close();
    upstream.close();
  }
});
