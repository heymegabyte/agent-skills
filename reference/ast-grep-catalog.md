# ast-grep — 40-use integration catalog (AST-01…40)

40 concrete ast-grep integration opportunities absorbed from REVISION-2 Appendix A. A prioritized catalog, NOT 40 mandatory blocking linters. For each: discover existing capability, decide applicability, choose a rule/query/codemod OR a better tool, add evidence, record an explicit deferral where appropriate. Pointed to by `rules/ast-grep-structural-capability.md`.

## Inherited invariants (every entry)

- A structural hit is a CANDIDATE to investigate, not proof — ast-grep is syntax-aware, NOT scope/type/dataflow/taint-aware. Pair with semantic (Serena/LSP) or runtime evidence for consequential claims.
- Scanner-health before "zero findings": zero selected files / missing grammars / parse errors / skipped paths / truncated output = incomplete, not clean (`scan --inspect`).
- Introduce uncertain rules REPORT-ONLY; promote to BLOCKING only after validating false-positive rate with +/- /edge fixtures.

## A1. Context + discovery

- **AST-01** Structural-search router: route call/decl/JSX/decorator/syntax questions to ast-grep; keep `rg` for literal/prose/path, semantic tooling for resolved references.
- **AST-02** Cheap code outlines: bounded decl/signature outlines for selected files; feature-detect the alpha `outline` command, keep a stable fallback.
- **AST-03** Framework inventory: find route handlers / middleware / queue handlers / Worker exports / bindings; verify dynamic/generated registrations via their authoritative mechanism.
- **AST-04** Task evidence slices: file/path/line/source-hash refs for matched structures + small context; fetch exact originals before implementing.
- **AST-05** Reusable pattern discovery: search authorized repos for a proven implementation of a shape; inspect contracts + licenses before reuse; never copy product-private code into agent-skills.

## A2. Architecture + interface conventions

- **AST-06** Import boundaries: exact forbidden direct imports / layer bypasses; use dependency-cruiser or semantic analysis for the transitive/resolved graph.
- **AST-07** Provider-wrapper conventions: direct AI/payment/email/provider calls that should use an approved adapter; resolve aliases + genuine exceptions first.
- **AST-08** Protected-route conventions: routes missing the expected auth/authz wrapper shape; prove actual access control with runtime/contract checks.
- **AST-09** Validation entry points: handlers omitting the required input-validation convention; separately verify schemas/coercion/error/negative cases.
- **AST-10** Feature-flag conventions: inconsistent direct provider usage / missing evaluation context; verify targeting/identity with the real flag integration.

## A3. Async execution + failures

- **AST-11** Serial work in concurrent constructs: expressions already awaited inside `Promise.all` inputs; suggest a change only after checking dependency/ordering/failure semantics.
- **AST-12** Async `forEach` callbacks: async callbacks whose returned promises are ignored; choose serial or bounded-parallel per intended behavior.
- **AST-13** Unmanaged background work: fire-and-forget calls + missing lifetime management in Workers/CLI/jobs; use semantic/runtime evidence to decide if work is actually lost.
- **AST-14** Swallowed failures: empty catches / catch-to-success / log-only paths; retain intentional recovery with explicit documented outcome semantics.
- **AST-15** Unbounded fan-out: `Promise.all(map(...))` large fan-out; inspect actual input bounds before adding concurrency control.

## A4. Data, queues, platform

- **AST-16** Query-construction candidates: interpolated/concatenated SQL/query strings for review; use typed query APIs + security analysis + tests to establish whether a path is unsafe.
- **AST-17** KV mutation hotspots: read-modify-write shapes around eventually-consistent stores; assess concurrency with the actual storage guarantees, don't claim a race from the shape.
- **AST-18** Queue lifecycle conventions: ack / retry / dead-letter handling shapes; test delivery/retry + shared attempt budgets in the real execution architecture.
- **AST-19** Pagination candidates: single-page list calls + suspicious cursor loops; inspect each official API's pagination contract, termination, duplicates, resumability.
- **AST-20** Runtime/config drift: forbidden Node-only imports / obsolete binding access / outdated config shapes in Worker code; combine with current platform/type/schema validation.

## A5. Security-sensitive structural candidates

- **AST-21** Dynamic evaluation: inventory `eval` / `new Function` sinks; inspect provenance + intended use rather than treating every match as exploitable.
- **AST-22** Shell execution: `exec`/`spawn` wrappers + command construction; verify argument separation / trust boundaries / permissions / process lifecycle.
- **AST-23** Sensitive logging: raw request/prompt/token/body logging + bypassed redaction wrappers; also run dedicated secret scanning + inspect payload schemas.
- **AST-24** Raw HTML insertion: dangerous HTML/render sinks + sanitizer bypasses; verify context-specific escaping / trusted boundaries / real attack cases.
- **AST-25** Access-control config shapes: block exact known-disallowed local policy/config patterns with tested rules; use dedicated policy/schema checks for the full effective configuration.

## A6. Product UI + tests

- **AST-26** Design-system bypasses: raw controls / direct third-party components where an approved local component is required; respect legitimate layout/a11y exceptions.
- **AST-27** Theme-token drift: hardcoded visual values where design tokens exist; avoid rewriting intentional illustrations / data colors / generated assets.
- **AST-28** Interaction conventions: missing expected form labels / explicit button types / local form-contract patterns; use axe + real-browser/manual checks for a11y outcomes.
- **AST-29** Focused/disabled tests: committed `test.only`/`describe.only` + unexplained skips/todos; allow documented temporary exclusions with an owner + reassessment date.
- **AST-30** Fragile sleeps: fixed-delay waits in browser/async tests; replace with observable conditions only after verifying the correct readiness signal.

## A7. Migrations + broad edits

- **AST-31** Version-aware SDK codemods: encode tested old→new call shapes only AFTER inspecting the installed version + official migration guide + semantics + runtime requirements.
- **AST-32** Import/export migrations: rewrite bounded module paths/export usage, then check package exports / generated code / public consumers / type compatibility.
- **AST-33** Semantic-rename assistance: narrow candidate syntax for a Serena/LSP-assisted rename; do NOT claim a text/AST replacement resolves symbol identity or shadowing.
- **AST-34** Obsolete-adapter residue: retired package calls / old endpoints / stale init patterns after a migration; also inspect config / deps / runtime traffic.
- **AST-35** Cross-repository campaigns: one proven transform via linked OpenSpec changes + pinned versions + canary repos + per-repo previews + serialized integration + rollback.

## A8. Evidence, routing, feedback

- **AST-36** Spec/code evidence pointers: extract stable requirement/test IDs + expected structural touchpoints; presence is traceability evidence, NEVER proof of completed behavior.
- **AST-37** Relevant rule selection: choose packs by language/framework/task-type/risk/changed-paths; explain skipped mandatory checks; don't run every rule on every task.
- **AST-38** Rule regression fixtures: require positive/negative/edge fixtures + safe-fix expectations for reusable rules; verify parser/grammar differences + idempotence.
- **AST-39** CI evidence receipts: scoped changed-file reports with tool/rule versions + scanned/skipped counts + source revision + match locations + complete exit status; distinguish tool failure from clean results.
- **AST-40** Learn from recurring failures: convert repeated real defects into small tested structural checks when syntax detects them reliably; otherwise use a semantic test, runtime assertion, or workflow correction.

## Official sources

ast-grep.github.io: `/advanced/faq` · `/guide/outline-code` · `/guide/rule-config` · `/guide/rule-config/utility-rule` · `/guide/test-rule.html` · `/guide/rewrite-code` · `/reference/cli/scan` · github.com/ast-grep/ast-grep-mcp.
