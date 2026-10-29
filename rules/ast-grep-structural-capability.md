---
last_reviewed: 2026-10-29
superseded_by: null
name: ast-grep-structural-capability
description: ast-grep as a first-class structural search / rule / codemod capability — syntax-aware (NOT semantic), report-only→blocking promotion, scanner-health before zero-findings; the 40-use catalog lives in reference/
pack: "testing"
priority: 3
triggers:
  - "ast-grep"
  - "structural search"
  - "codemod"
  - "structural lint"
  - "syntax pattern"
---

# ast-grep — structural capability (§12)

Before scanning or rewriting broad CODE patterns, consider whether ast-grep can identify the actual SYNTAX more precisely + cheaply than `rg`. Use it routinely where it fits; never force it into non-code/prose search or a task a better tool already solves. Use the explicit `ast-grep` executable (avoid the unrelated `sg` command collision).

## Limits — a structural hit is a CANDIDATE, not proof

- Syntax-aware ONLY. It does NOT establish scope / type / control-flow / dataflow / taint, a complete cross-file call graph, or that a route is secure. A heuristic hit is a candidate to investigate UNLESS it enforces an exact tested syntactic invariant.
- The `outline` command is alpha — feature-detect + pin tested versions; fall back to stable structural queries or semantic tooling (Serena/LSP) when unavailable.
- Pair with semantic/runtime evidence for any consequential claim.

## Rule architecture

- Shared agent-skills pack: portable rule templates + reusable utility rules + CLI wrappers + sanitized fixtures + trigger metadata. Project repo: local wrappers/allowlists + suppressions (reason + expiry) + project fixtures.
- Reuse existing ESLint / Semgrep / schema / secret scanners — don't reimplement them badly.
- Introduce uncertain rules REPORT-ONLY; promote to BLOCKING only after validating the false-positive rate. Require positive / negative / edge / alias-shadowing / formatting / comment-string fixtures.
- **Scanner-health before accepting zero findings:** zero selected files, missing grammars, parse/config errors, skipped required paths, unavailable tooling, or truncated output are incomplete/failed checks — NOT clean results. Record scope/exclusions; use `scan --inspect`.

## Codemod transaction

- Identify the semantic change → discover candidates → inspect exact source + references → test the transform → preview the full diff → apply in bounded batches → format → typecheck → relevant tests + consumer checks → review public/API compatibility → verify no unrelated changes → integrate main-first.
- Capture the source hashes the preview used + recheck immediately before applying (recompute on mismatch; reject overlapping replacements; never apply stale offsets). Require idempotence (a 2nd pass makes no changes). NEVER use a syntactic replace for a SEMANTIC rename without reference/type tooling.

## The 40-use catalog

- `reference/ast-grep-catalog.md` — AST-01…40 across discovery · architecture conventions · async/failures · data-queues-platform · security-sensitive · UI/tests · migrations · evidence-routing. Each entry carries its applicability + the "verify with semantic/runtime" caveat + a deferral note. Implement low-risk high-value rules first on a representative repo; **40 ideas are NOT 40 mandatory blocking checks on every change** (§12.5).

## Cross-links

`[[lint-doctrine]]` (the lint/structural-rule doctrine) · `[[code-style]]` · `[[drift-detection]]` · `reference/ast-grep-catalog.md`. Official: ast-grep.github.io (rule-config · test-rule · rewrite-code · reference/cli/scan) + github.com/ast-grep/ast-grep-mcp.
