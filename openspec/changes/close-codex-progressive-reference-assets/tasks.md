# Tasks

- [x] Generate the Codex manifest from declared progressive reference assets.
- [x] Verify manifest-only access and generated package closure.

A temporary projection copied only the manifest's files. The original 47-file manifest could not resolve the TypeScript contract-testing link. The generated 171-file manifest resolved it and kept references on demand. The package closure gate rejected the original manifest and passed the generated manifest and its npm file list. The harness manifest validator passed.
