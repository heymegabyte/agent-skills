---
name: "Semgrep Codebase Rules"
version: "3.0.0"
updated: "2026-11-25"
description: "Choose, test, and run shared Semgrep policies with explicit scope and fail-closed release evidence."
---

# Semgrep Codebase Rules

Use Semgrep for patterns the configured language and engine can establish. Check existing shared rules in theme.tools before writing one. Put reusable rules and executable adapters in the shared package. Keep project-specific target paths, exceptions, and boundary facts with the consumer.

## Choose the right check

- Use existing ESLint rules for TypeScript types, imports, and promises. Use typed rules or the language service when a check depends on symbol identity.
- Use Semgrep for supported syntax and explicitly modeled data flow. Treat incomplete cross-file analysis as a limit. Verify authorization, schema validation, and runtime behavior with behavioral tests.
- Use workflow, schema, and secret scanners for their own formats. Choose each tool from the failure you need to detect.

## Verify rules and repairs

Record each rule's trigger, affected languages, engine version, diagnostic, and exclusions. Add matching and nonmatching fixtures, including realistic aliases or wrappers if supported. Run the pinned Semgrep rule tests before enabling the policy. Use suggestions when a repair depends on intent. For an automatic fix, test exact output, parser validity, comments, behavior, and a second pass with no changes.

## Require complete evidence

Use a named local rule config, pinned scanner, explicit targets, and strict error handling. Require a nonempty scan that covers every required target. Treat findings, scanner errors, missing tools, invalid configuration, or skipped required targets as failed qualification. A clean exit alone does not prove coverage. Retain only the revision, scope, outcome, and actionable diagnostics needed for repair. Keep source text and credentials out of shared evidence.

For the shared Node TLS check, use the installed `theme-semgrep-tls` command from `@theme-tools/testing`. It accepts explicit JavaScript or TypeScript source files and reconciles the pinned scanner's report. The rule covers direct assignments that disable certificate verification. Check computed values, shell configuration, and per-request TLS options separately when they are in scope.

[Semgrep rule tests](https://docs.semgrep.dev/writing-rules/testing-rules) · [Semgrep CLI reference](https://semgrep.dev/docs/cli-reference/)
