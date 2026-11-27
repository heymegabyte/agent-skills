## Tasks

- [x] Reproduce and attribute all four baseline diagnostics.
- [x] Restore version-2 validator strictness and the authored policy entrypoint.
- [x] Verify legacy projection survival, native checks, packaged closure, and hosted workflow syntax.

At baseline `269d0dee` the policy validator exited 1 with four schema, scope, module, and entrypoint diagnostics. The correction passed the validator and its 20 unit tests, 32 skill-router tests, the pack and 496-file package-closure checks, and validation from an actual extracted npm tarball. The current instruction generator round-tripped all 32 targets without changing authored AGENTS bytes or creating generated changes. Hosted actionlint 1.7.7 and the workflow SHA-pin check passed locally.
