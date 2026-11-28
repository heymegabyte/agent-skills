# Live policy 1.3.0 loading

Fresh, non-persistent Codex and Claude CLI sessions were each asked to report the managed policy version and its first sentence from the instructions available at startup. The prompt did not supply either value. Both commands exited zero and returned version `1.3.0` and the exact opening sentence from the policy projected in `3dfd15ee`. Codex used read-only sandbox mode and Claude's tools were disabled.

Gemini's installed policy file matched the projection. A subsequent probe found Antigravity CLI 1.5.18 at `~/.local/bin/agy`. From an empty temporary directory, a fresh `agy --sandbox --mode plan --print-timeout 45s --print` session was asked to report the version and first sentence from startup instructions without opening files or using tools. The prompt supplied neither value. The session exited zero and returned `1.3.0` and the exact opening sentence.

This verifies Antigravity policy loading. The standalone `gemini` executable remains unavailable. The probes verify startup instruction loading, while live OpenCode throughput and full production orchestration remain open.

## Antigravity architect availability

Antigravity listed the Gemini 4 Hydrogen High and Medium models on 2026-11-28. A sandboxed plan-mode connectivity probe with High returned `RESOURCE_EXHAUSTED` (429), and a separate Medium request to partition two documentation outcomes into independently owned OpenSpec changes returned `PERMISSION_DENIED` (403), citing account eligibility in its location. The same planning request with the default model returned the individual quota error (429). Each request emitted a conversation ID and a terminal error with zero tokens and no response. Architect capacity for these attempts is zero. Recheck eligibility or quota before advertising Antigravity as an available architect and use another approved premium provider for current execution.
