# Design

## Execution path

`Gemini/Antigravity | Claude | Codex → JSON task manifest → opencode-swarm.mjs → opencode-task.sh → deepseek-control-plane.mjs → opencode-deepseek.sh → litellm/deepseek-* → llm.megabyte.space → four-key DeepSeek rotation`

The parent harness decomposes and judges. The swarm runner owns bounded concurrency and accounting. Each child task performs skill routing and context hydration, then OpenCode executes it through the gateway.

## Concurrency

The runner uses a shared in-process queue and `min(taskCount, requestedWidth, 200)` workers. The 200 ceiling represents the four-key aggregate throughput pool; operators can lower it through `--max-workers` or `OPENCODE_SWARM_MAX_WORKERS`. Premium-native subagent limits remain separate.

## Context

DeepSeek exposes a 1,048,576-token context window. Substantial workers target up to 900K useful tokens from their exact transitive repository surface, fully selected skills, Context7, AI Search, and authoritative sources. The remaining window is reserved for reasoning, tool results, and output. Context is slice-specific and deduplicated.

## Failure and rollback

Each task result records exit code and bounded stdout/stderr; any failure makes the swarm command fail. The existing task launcher retries retryable provider errors and falls back from Pro to Flash on circuit-break conditions. Operators may set width to one or explicitly select the direct DeepSeek rail without changing manifests.

## Security

The gateway key is resolved at runtime and inherited only by the OpenCode child. Reports contain task results, never credentials. High-risk decisions and shared/destructive writes do not enter the swarm.
