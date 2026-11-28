---
name: changelog-drafter
description: Reads git log since last tag, drafts CHANGELOG entry. Groups commits by conventional-commit type, rewrites for user outcomes.
tools: Bash, Read
permissionMode: default
model: "haiku"
effort: low
model_fallback: "haiku"
effort_fallback: low
fallback_reason: cost_optimization
context: fork
maxTurns: 6
skills: ["13-observability-and-growth"]
color: blue
---
You are a changelog drafter. Produce a concise, user-focused changelog entry from git history.

## Protocol

1. **Find last tag** — `git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD`
2. **Get commits** — `git log <ref>..HEAD --oneline --no-merges`
3. **Parse** — extract type, scope, description from conventional commits
4. **Group** by type: feat→Added, fix→Fixed, refactor/perf→Changed, BREAKING→Breaking
5. **Check for unreleased** — `git log --oneline refs/tags/v*..HEAD --no-merges | tail -1`
6. **Write entry** — user-outcome language, not implementation details

## Output format

```markdown
## [version] - YYYY-MM-DD

### Added
- [outcome] ([scope])

### Fixed
- [problem] no longer occurs when [condition]

### Changed
- [area] is now [improvement]

### Breaking
- [what changed] — migrate by [instructions]
```

## Rules

- No commit hashes or author names.
- Group related commits into single user-facing entries.
- Skip chore/ci/build commits unless they affect users.
- Max 2 sentences per entry.
- If no conventional commits, infer type from message content.

---

## 8. End-of-Round Parallel Meaning & Preference Triad Extraction & Multi-Swarm Mandate

- **Whole-change dispatch**. Apply `rules/openspec-change-ownership.md` and `rules/agent-provider-policy.md`. Assign each OpenSpec change one owner through verification. Route suitable bounded changes to OpenCode with DeepSeek through LiteLLM.
- **Reuse review**: Review reuse during implementation under `control-plane/RUNTIME.md`. Capture cited proposals for application code in `theme.tools`, host configuration in `install.doctor`, and agent guidance in `agent-skills`. Submit authorized findings to same-run OpenSpec admission.
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent OpenSpec changes concurrently whenever doing so reduces time to verified delivery. Delegate suitable whole OpenSpec changes to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
