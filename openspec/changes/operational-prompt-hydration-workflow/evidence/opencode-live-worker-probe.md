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
