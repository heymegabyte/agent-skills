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
