# Proposal

## Problem

The shared OpenCode configuration defaults to the rotating LiteLLM DeepSeek pool, but `opencode-task.sh` receives `deepseek/*` routes from the capability plane and therefore bypasses LiteLLM. Cross-harness instructions mention DeepSeek without requiring an executable delegation path, and the only fleet limit is five workers despite four DeepSeek keys supporting a much larger isolated throughput pool.

## Change

- Route eligible internal throughput work from Gemini/Antigravity, Claude, and Codex through one canonical OpenCode swarm command.
- Emit `litellm/deepseek-*` model identifiers by default; retain direct DeepSeek only as an explicit fallback rail.
- Add an adaptive, bounded queue runner with a hard maximum of 200 workers, disjoint task briefs, per-task working directories, failure accounting, and machine-readable reports.
- Keep frontier judgment, integration, security, auth, payment, and destructive decisions with subscription frontier agents.

## Rollback

Set `OPENCODE_SWARM_MAX_WORKERS=1` for serial operation or `OPENCODE_DEEPSEEK_RAIL=direct` for the direct DeepSeek fallback. Reverting the launcher and instruction files restores the prior behavior without data migration.
