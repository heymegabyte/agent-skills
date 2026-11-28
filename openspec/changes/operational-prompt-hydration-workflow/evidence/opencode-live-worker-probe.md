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

## Independent live fallback changes

- At `deeedff4`, the frozen-change queue ran two independent changes through the live Codex development launcher, using two approved fixture slots. The measured peak was two overlapping launcher calls.
- Each worker changed only its distinct owned Markdown file, passed `git diff --check`, and returned an integrated receipt. The host serialized the exact accepted patches onto the disposable Git repository. Both expected edits were committed and the checkout was clean.
- The fixture demonstrates live parallel scheduling and local integration using a documented premium fallback. It does not establish live OpenCode capacity, remote delivery, or production orchestration.

## Pinned runtime comparison

The host CLI reported OpenCode 1.19.4. The `install.doctor` lock at `b7b84dfd` pinned 2.2.5 for its desktop runtime. A temporary macOS ARM64 copy matched the lock's archive size and SHA-256, and the extracted binary reported 2.2.5. The same broker-backed LiteLLM Flash reply probe still exited 1 with no text response. The installed CLI was left in place. This shows that using the pinned desktop runtime alone did not restore inference in the tested environment.

## Plugin isolation and current gateway responses

A fresh OpenCode 1.19.4 Flash reply probe emitted `UnknownError` with a generic server message and a diagnostic reference. Repeating it with `--pure` and error logging produced the same exit code (1) and no reply. Neither response exposed an HTTP code or Cloudflare Ray ID. The direct DeepSeek fallback exited 4 because its brokered credential was unavailable.

In separate authenticated requests, the LiteLLM `/v1/models` and `/v1/chat/completions` endpoints both returned HTTP 403 with plain-text responses and Ray IDs `a618ca2d1ea0fbc3-EWR` and `a618ca2e7b61fbc3-EWR`, respectively. These IDs identify the direct requests only. The earlier Browser Integrity Check attribution was for a different, correlated Ray. Live OpenCode capacity remains unverified.

Cloudflare Security Events matched both direct-request Rays at `2026-11-28T10:46:36Z`. Each event had action `block` and source and rule ID `bic`, on the expected hostname and path. This confirms Browser Integrity Check blocked both direct probes. OpenCode's own error still lacks a matching edge event.

## Gateway authentication configuration

Read-only Cloudflare checks showed Browser Integrity Check enabled on the zone. Neither of the two enabled configuration rules sets BIC. Cloudflare Access has distinct applications for the LiteLLM hostname, admin UI, and API. The API application has a bypass decision and is described as virtual-key gated. The hostname application lists identity and machine policies, and the admin UI has its own allow policy. The API application metadata indicates that its credential check is expected at LiteLLM. Actual rejection of unauthenticated API requests at the gateway origin remains unverified because the correlated requests stopped at BIC.

A standard curl client reached LiteLLM through the existing public route. Unauthenticated `GET /v1/models` returned JSON HTTP 401 (Ray `a618ce80e886fbc3-EWR`). With the brokered credential, model listing returned JSON HTTP 200 (Ray `a618ce833816fbc3-EWR`) and a bounded Flash inference returned JSON HTTP 200 with the exact requested reply (Ray `a618ce8b49dcfbc3-EWR`). This verifies the credential boundary and inference for the curl client on the unchanged route. Earlier Python requests were blocked by BIC. OpenCode still needs its own successful reply and a parallel worker verification before it can supply throughput capacity.

## Live OpenCode with an isolated provider configuration

OpenCode 1.19.4 returned the exact expected text through the broker-backed LiteLLM Flash route using a minimal custom provider configuration. That configuration used an explicit environment reference for its credential and separate temporary configuration, data, and state directories. A separate attempt adding only the credential reference to the normal profile still failed with `UnknownError`.

Two isolated OpenCode worker processes then used the minimal profile concurrently. Each launched through `opencode-deepseek.sh`, received one disposable directory, and used read and write tools to replace only that directory's README with its exact expected text. Both exited zero, and their measured process lifetimes overlapped by 11.56 seconds. The temporary directories were removed. This demonstrates two live LiteLLM-backed OpenCode slots for the isolated profile. Scheduler integration, production host activation, and the cause of the normal profile failure remain open.

The approved process adapter subsequently launched the local OpenCode development launcher with the isolated Flash profile. It obtained the broker credential, exited zero, and wrote the exact requested README contents in a disposable checkout. Fifty scheduler and coordinator tests passed, including a regression proving two overlapping adapter launches receive private, distinct, and cleaned profile directories. This verifies one real process-adapter launch. Whole-change integration and production host activation still require a live run.
