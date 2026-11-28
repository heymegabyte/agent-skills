# Live OpenCode worker probe

- Source revision: `319c4e19`.
- The configured launcher was exercised in a disposable detached Git worktree for a single README edit within the assigned path.
- `litellm/deepseek-v4-pro` exited with code 1 before acceptance. A read-only response probe against the same route also exited with code 1 and produced no text event.
- A read-only `litellm/deepseek-flash` probe exited with code 1, produced a JSON error event, and produced no text event. The probe did not capture a classified error code.
- Result: worker delivery remains unverified. The failed probes establish launcher failure but do not establish its cause.
