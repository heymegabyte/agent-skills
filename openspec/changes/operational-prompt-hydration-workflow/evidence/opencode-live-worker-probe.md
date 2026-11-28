# Live OpenCode worker probe

- Source revision: `319c4e19`.
- The configured launcher was exercised in a disposable detached Git worktree for a single README edit within the assigned path.
- `litellm/deepseek-v4-pro` exited with code 1 before acceptance. A read-only response probe against the same route also exited with code 1 and produced no text event.
- A read-only `litellm/deepseek-flash` probe exited with code 1, produced a JSON error event, and produced no text event. The probe did not capture a classified error code.
- Result: worker delivery remains unverified. The failed probes establish launcher failure but do not establish its cause.

## Diagnostic retry

- OpenCode 1.19.4 listed both DeepSeek Pro and Flash under the configured LiteLLM provider.
- The Flash response probe returned `UnknownError` with the message “Unexpected server error. Check server logs for details.” It supplied no HTTP status.
- A Pro response probe with error logging enabled also exited with code 1. The available client diagnostics did not identify a provider status, network error, or underlying exception.
- The next useful evidence is a correlated server-side execution trace. Model listing alone confirms discovery and leaves inference availability unverified.

## Direct gateway comparison

- A minimal chat-completion request sent through the documented LiteLLM endpoint with the configured broker credential returned HTTP 403 for both `deepseek-flash` and `deepseek-v4-pro`. Neither response provided a LiteLLM JSON error object.
- A repeat Flash request reported `Server: cloudflare`, `Content-Type: text/plain`, and Ray ID `a6178f69ee14fbc3-EWR`. The response had no recognized Cloudflare Access or block-page marker.
- The rejection reproduces without the OpenCode CLI. Correlate the Ray ID with edge and upstream logs before altering launcher configuration or attributing the rejection to a specific layer.

## Fallback comparison

- On `86d002ae`, the documented direct `deepseek/deepseek-chat` fallback exited with code 4 because the configured broker did not supply its credential. The implementation fixture remained unchanged.
- The Codex development launcher completed the equivalent documentation fixture in a detached Git worktree. The worker changed only `README.md`, the expected line was present, `git diff --check` passed, and the source checkout remained clean.
- This establishes live bounded worktree execution on the premium fallback. OpenCode throughput and integration from the live scheduler remain unverified.

## Scheduled fallback integration

- On `47e758ea`, the frozen-change queue dispatched one live Codex worker through the process adapter and recorded the throughput-provider exception. The worker edited only the owned README path. The configured `git diff --check` command exited zero.
- The initial probe stopped on its staged-patch digest check. A separate reproduction showed that Git's configured prefixes differed between worktree and staged output for the same file content. The repeated fixture used explicit source and destination prefixes for both patch digests.
- The retry returned an `integrated` receipt. The disposable repository contained the expected README edit in a commit and had a clean working tree. This verifies the live fallback through local scheduling and integration for one controlled change. The OpenCode route and multi-change production integration remain open.

## Dependent live fallback changes

- On `11887800`, the frozen-change queue dispatched two live Codex fixture changes that shared an owned README path. The second declared the first as a prerequisite.
- The dependent worktree started at the exact first integration commit and contained the first change's expected text before its worker launched. Both workers changed only README.md and passed `git diff --check`.
- Both receipts reported `integrated`. The disposable repository contained both expected edits and was clean at the end. This verifies dependent execution and integration on the premium fallback. Independent production parallelism and OpenCode throughput are still open.

## Cloudflare event correlation

- The authenticated Cloudflare Security Events query matched Ray ID `a6178f69ee14fbc3-EWR` at `2026-11-28T07:11:43Z` for `/v1/chat/completions`.
- The event reported action `block`, source `bic`, and rule ID `bic`. This identifies Browser Integrity Check as the cause of that direct gateway probe's rejection. The prior OpenCode failures lack Ray IDs, so their exact causes remain unverified.
- No edge policy mutation was made. Verify the intended machine-client access policy and run a newly correlated OpenCode request after the gateway owner reconciles it.

## OpenCode-specific correlation attempt

- The configured OpenCode LiteLLM base is `https://llm.megabyte.space/v1`. A fresh Flash request ran from `2026-11-28T07:53:53Z` through `07:54:01Z`, returned `UnknownError`, and exited 1.
- The Cloudflare Security Events query for that hostname from `07:53:40Z` through `07:54:15Z` returned no rows. The earlier query for `/v1/chat/completions` returned three Browser Integrity Check events identified as Python clients.
- The empty sampled event set does not establish whether OpenCode reached the gateway. The exact Python probe attribution therefore does not extend to OpenCode without a client response identifier or an upstream trace.
