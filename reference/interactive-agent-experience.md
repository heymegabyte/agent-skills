# Interactive Agent Experience — 30 implementation patterns

Use this inventory when building Claude Code, OpenCode, Paperclip, Cua or prompt-intake UX. Apply only context-relevant items.

1. Split requests into independent work and blocking decisions; start the former before asking.
2. Give questions IDs, rationale, affected work, recommended default and answer deadline.
3. Scale questioning with ambiguity × irreversibility × business impact.
4. Accept choice, text, voice, screenshot annotation and “use recommended.”
5. Classify queued steering as replace, add, reprioritize or cancel at safe boundaries.
6. Support side questions that do not contaminate the main task context.
7. Show active/background/waiting/failed jobs, model, elapsed time, budget and controls.
8. Prefer periodic evidence/checkpoint cards to noisy narration.
9. Run lint, tests and security asynchronously; return only actionable failures.
10. Trace session, prompt, permission, task, subagent, model-switch and stop lifecycle events.
11. Use narrow requirements, UX, risk and acceptance-test interview agents conditionally.
12. Delegate noisy exploration; synthesize a short decision memo in the main context.
13. Govern fan-out by independence, concurrency, cost, depth and time.
14. Separate approval questions from product questions and format each appropriately.
15. Allow deferral and resumable questions instead of holding a process open.
16. Use a local intake state machine: quarantine → redact → classify → dedupe → route → confirm.
17. Make each capture modality visibly armed, pausable, scoped and consent-expiring.
18. OCR/transcribe/scan locally; transmit only the minimal redacted artifact.
19. Store provenance and hashes without sensitive payload; encrypt short-lived payloads.
20. Discard suspected secrets by default and provide rotation guidance without echoing them.
21. Classify intake as discard, note, action, issue or ask with confidence and duplicate key.
22. Choose one work-item authority and one-way idempotent synchronization.
23. Generate concise typed issues with outcome, evidence and acceptance criteria.
24. Map priority/status/effort into native work-item fields.
25. Deduplicate by intent, repository, component and semantic fingerprint.
26. Route desktop actions through disposable Cua Spaces over ACP.
27. Prefer background native-app control; take the foreground only for human judgment.
28. Give risky desktop work read-only scopes, snapshots, observation and no host secrets.
29. Define checkpoints for irreversible action, design choice, local secret entry, CAPTCHA and takeover.
30. Normalize keyboard, voice, gaze, accessibility and future BCI into `intent + confidence + consent + correction`; keep experimental inputs optional.

Primary references: Claude Code [interactive mode](https://code.claude.com/docs/en/interactive-mode), [hooks](https://code.claude.com/docs/en/hooks), [user input](https://code.claude.com/docs/en/agent-sdk/user-input), and [subagents](https://code.claude.com/docs/en/sub-agents); Cua [coding agents](https://cua.ai/docs/spaces/guides/coding-agents-in-a-space); NIST [data minimization](https://csrc.nist.gov/glossary/term/minimization); OWASP [logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet).
