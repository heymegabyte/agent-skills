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
