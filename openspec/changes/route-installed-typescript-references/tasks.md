## Tasks

- [x] Reproduce the generic path route with the normal offline CLI.
- [x] Verify the exact command and its near match, then check generated discovery and packaged reference closure.

## Verification

The actual offline router on a disposable TypeScript consumer reported a generic path match for the installed command at baseline. The candidate reported a direct trigger, while the lookalike command retained the generic path route. The deterministic evaluator passed all 17 cases and the router unit suite passed all 32 tests.

The local npm archive was extracted into a separate directory and evaluated with no source-root override. Its own router produced the same exact and lookalike results in a new fixture database. The generated Codex skill advertises the TypeScript workflows and links to the existing compiler instructions, which are present in both the archive and the plugin file manifest.
