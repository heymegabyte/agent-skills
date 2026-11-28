# Live policy 1.3.0 loading

Fresh, non-persistent Codex and Claude CLI sessions were each asked to report the managed policy version and its first sentence from the instructions available at startup. The prompt did not supply either value. Both commands exited zero and returned version `1.3.0` and the exact opening sentence from the policy projected in `3dfd15ee`. Codex used read-only sandbox mode and Claude's tools were disabled.

Gemini's installed policy file matched the projection. A subsequent probe found Antigravity CLI 1.5.18 at `~/.local/bin/agy`. From an empty temporary directory, a fresh `agy --sandbox --mode plan --print-timeout 45s --print` session was asked to report the version and first sentence from startup instructions without opening files or using tools. The prompt supplied neither value. The session exited zero and returned `1.3.0` and the exact opening sentence.

This verifies Antigravity policy loading. The standalone `gemini` executable remains unavailable. The probes verify startup instruction loading, while live OpenCode throughput and full production orchestration remain open.
