# deepseek-proxy

Keeps DeepSeek V4 **thinking mode** usable behind Claude Code.

## The bug

DeepSeek's Anthropic-compatible endpoint (`https://api.deepseek.com/anthropic`) requires the
reasoning it returned for a turn to be sent back on every later request while thinking is
enabled. Claude Code converts Anthropic <-> OpenAI internally and drops that reasoning, so the
second request of any tool-calling agentic task fails deterministically:

```text
HTTP 400
{"error":{"message":"The `content[].thinking` in the thinking mode must be passed back to the API."}}
```

A plain-text assistant turn survives; an assistant turn that carries `tool_use` does not. That is
why the failure lands on **turn 2** of every tool-using task.

Two things make this hard to see from the client side:

- Claude Code sends `thinking: {"type":"adaptive"}` (plus `output_config`), not
  `{"type":"enabled"}`. The endpoint accepts that shape, so the bug looks intermittent.
- DeepSeek issues a `signature` for each thinking block — a UUID that also appears as the
  `message_start` id. If that signature does not survive the client's round trip, the replay is
  rejected. The 400 message names `content[].thinking`, not the signature, which sends you
  looking in the wrong place.

## The fix

`proxy.mjs` is a zero-dependency local server that sits between Claude Code and DeepSeek:

1. **Capture** — reads `reasoning_content` / `reasoning` / `thinking_delta` text from the
   upstream response and files it under every `tool_call_id` the response announces, plus the
   assistant text prefix as a secondary key.
2. **Re-inject** — prepends a `thinking` content block to matching assistant messages that lost
   it. Requests that already carry reasoning pass through unchanged.
3. **Strip** — removes `output_config` / `reasoning_effort` from requests whose
   `thinking.type` is `disabled`, so subagent calls do not trip the thinking-mode validation.

Unknown request fields, headers, and the upstream status code are forwarded verbatim. Two
transport details matter and are handled:

- The client's `accept-encoding` is dropped. Claude Code asks for zstd, Node does not decode it,
  and the client otherwise fails with `ZstdDecompressionError`.
- The upstream base path is preserved, so `/v1/messages` reaches `/anthropic/v1/messages`.

## Run it

```bash
# everything wired, proxy lifecycle managed
bin/deepseek-proxy.sh

# or manage the proxy yourself
node bin/deepseek-proxy/proxy.mjs
ANTHROPIC_BASE_URL=http://127.0.0.1:8788 claude
```

| Env | Default | Meaning |
| --- | --- | --- |
| `DEEPSEEK_PROXY_PORT` | `8788` | listen port |
| `DEEPSEEK_PROXY_HOST` | `127.0.0.1` | listen host (loopback only by default) |
| `DEEPSEEK_UPSTREAM_URL` | `https://api.deepseek.com/anthropic` | upstream base |
| `DEEPSEEK_PROXY_MAX_ENTRIES` | `2000` | reasoning cache bound (oldest evicted first) |
| `DEEPSEEK_API_KEY` | — | forwarded as `Authorization: Bearer` only when the client sends no credential |

## Known boundary

The cache is in-memory and keyed by what the proxy has already seen. If Claude Code sends a
`tool_use` id the proxy never observed — a resumed session, a different proxy process, or a
conversation started before the proxy was running — there is no reasoning to inject and DeepSeek
still returns 400. Restart the conversation through the proxy, or run without thinking mode
(`--no-proxy` plus a thinking-disabled config) for such resumes.

## Verification

Unit + integration (a fake upstream that reproduces the 400, including a negative control that
proves the conversation fails on turn 2 without the proxy):

```bash
node --test bin/__tests__/deepseek-proxy.test.mjs
```

Live, against the real endpoint with real Claude Code (2026-10-26, `deepseek-v4-pro`,
`thinking.type: adaptive`, `MAX_THINKING_TOKENS=4096`):

| Path | Result |
| --- | --- |
| Raw `curl`, assistant `tool_use` turn without `thinking` | `HTTP 400` (deterministic) |
| Same request through the proxy | `HTTP 200` |
| `claude -p "<tool-calling prompt>"` through `bin/deepseek-proxy.sh` | `num_turns: 2`, `is_error: false`, result `DONE` |
