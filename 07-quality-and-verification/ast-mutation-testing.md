---
name: "ast-mutation-testing"
version: "3.0.0"
updated: "2026-11-05"
description: "Mathematical proof of test suite quality via AST mutation analysis and strict zero-any TypeScript compiler checks (bin/ast-mutation-tester.ts, bin/strict-ast-enforcer.ts)."
triggers:
  - "mutation-testing"
  - "ast-mutation"
  - "strict-types"
  - "zero-any"
---

# AST Mutation Testing & Strict Type Enforcement

This skill guarantees that tests actually detect injected defects, and that source code adheres to strict type safety without shortcut `any` types.

## 1. Operating Doctrine

- **Mutation Score Mandate**: Every test suite must achieve $\ge 80\%$ mutation score via [`bin/ast-mutation-tester.ts`](file:///Users/Apple/.agentskills/bin/ast-mutation-tester.ts).
- **Zero-Any TypeScript**: All source files are scanned via [`bin/strict-ast-enforcer.ts`](file:///Users/Apple/.agentskills/bin/strict-ast-enforcer.ts). Any presence of `: any`, `as any`, `@ts-ignore`, or unchecked double assertions fails verification closed.
- **Complexity Cap**: Functions exceeding cyclomatic complexity 12 must be decomposed via [`bin/complexity-linter.ts`](file:///Users/Apple/.agentskills/bin/complexity-linter.ts).
