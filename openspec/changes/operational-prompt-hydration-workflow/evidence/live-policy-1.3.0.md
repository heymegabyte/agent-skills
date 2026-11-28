# Live policy 1.3.0 loading

Fresh, non-persistent Codex and Claude CLI sessions were each asked to report the managed policy version and its first sentence from the instructions available at startup. The prompt did not supply either value. Both commands exited zero and returned version `1.3.0` and the exact opening sentence from the policy projected in `3dfd15ee`. Codex used read-only sandbox mode and Claude's tools were disabled.

Gemini's installed policy file matched the projection. No Gemini executable was available on the probe's PATH, so its live loading remains unverified. These probes verify instruction loading, while live OpenCode throughput and full production orchestration remain open.
