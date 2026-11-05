# AST Mutation Testing & Strict Type-Safety Enforcement

## 1. Doctrinal Intent
Code quality must be mathematically verified rather than assumed. Tests must be proven effective through mutation analysis, source code must adhere strictly to zero-any TypeScript discipline, and complexity must remain bounded.

## 2. Core Protocols

### AST Mutation Testing
- Test suites must be validated using [`bin/ast-mutation-tester.ts`](file:///Users/Apple/.agentskills/bin/ast-mutation-tester.ts) to guarantee a mutation score of $\ge 80\%$.
- Any test suite that passes regardless of operator inversions or boolean flips is flagged as ineffective and rejected.

### Zero-Any & Strict Type Enforcement
- All TypeScript files are scanned by [`bin/strict-ast-enforcer.ts`](file:///Users/Apple/.agentskills/bin/strict-ast-enforcer.ts).
- Explicit `any`, double assertion casts (`as unknown as T`), and `@ts-ignore` comments are classified as fatal violations.

### Complexity & Runtime Matrix Validation
- Functions exceeding a cyclomatic complexity threshold of 12 are flagged for decomposition by [`bin/complexity-linter.ts`](file:///Users/Apple/.agentskills/bin/complexity-linter.ts).
- Client-side mocks must be synthesized with type-safe fixtures using [`bin/msw-synthesizer.ts`](file:///Users/Apple/.agentskills/bin/msw-synthesizer.ts).
- Runtime compatibility across Node 24, Bun, and Cloudflare Workers `workerd` must be verified by [`bin/runtime-matrix-verifier.ts`](file:///Users/Apple/.agentskills/bin/runtime-matrix-verifier.ts).
