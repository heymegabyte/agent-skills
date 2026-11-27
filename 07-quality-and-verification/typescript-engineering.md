# TypeScript engineering workflow

Start at the consumer root. Read its lockfile, Nx targets, TypeScript project graph,
and runtime configuration. Confirm the installed shared package exposes the
subpaths you plan to use. Current shared entry points include
`@theme-tools/testing/tsconfig-presets`, `@theme-tools/testing/eslint-config`,
`@theme-tools/testing/eslint-plugin`, and `@theme-tools/testing/typescript-ai-platform`.

- **Typed implementation and schemas.** Match the compiler profile to the runtime.
  Parse external data at the boundary. Keep raw input, parsed output, wire data,
  and persisted records distinct. Preserve the relationship between each event
  name and its payload.
- **Symbol navigation and refactors.** Resolve declarations, signatures,
  implementations, references, tests, exports, and downstream consumers with the
  TypeScript language service or another backend that verifies symbol identity.
  Record the project root, compiler version, and freshness of the results.
  Inspect persisted keys, wire names, and string references separately before
  applying a rename.
- **Configuration changes.** Keep paths and runtime facts in the consumer and
  resolve typed lint from the consumer root. Check real project includes for
  scripts, tests, stories, and configs. Run the authoritative compiler target
  for the project graph and verify the effective ESLint configuration on
  representative files. See [typed linting](https://typescripteslint.com/getting-started/typed-linting/)
  and [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html).
- **Rules and repeatable migrations.** Reuse an existing rule when it expresses
  the policy. Use typed ESLint when symbol identity matters and structural tools
  for syntax patterns. Exercise passing and failing fixtures. For fixes, verify
  exact output, parseability, and a second pass with zero changes.
- **Publication and deployment.** Generate runtime bindings before dependent
  checks. Exercise exported subpaths from a clean installed copy of the
  candidate archive. Record source revision, artifact identity, checked scope,
  and the deployed version in release evidence.
- **Runtime verification and repair.** Verify accepted and rejected runtime
  boundaries and compile positive and negative type assertions. Reproduce
  failing behavior on the previous revision when practical. Re-run the normal
  target on the candidate and capture results and elapsed time.

## Native TypeScript and compiler API selection

Check the consumer's installed compiler with the normal typecheck entry point.
Record its version separately from the backend used for typed lint and semantic
navigation. A native TypeScript 7 installation can compile the project while
its JavaScript package entry point lacks the classic language service.

Use the installed `theme-ts-references` CLI with its default compiler when that
compiler supplies the supported language service. When the consumer has a
qualified classic compiler in a separate installed package, pass its package
name with `--compiler-api` and record the backend and version in the evidence.
Check the installed typescript-eslint peer range before changing the root
compiler. Verify that the two compilers resolve the intended project and
that navigation reports the expected declaration. Map each use to the
[TypeScript 7 migration guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).

During rollouts, use `theme-verify-source-coverage --typecheck` when the
coverage receipt needs to prove both project membership and compiler
diagnostics. Check the installed CLI's result for `typechecked: true`.
Exercise a source file with a known type error, confirm it fails, and check
the clean result using the same projects and required file list.
