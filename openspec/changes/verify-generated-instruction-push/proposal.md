## Why

Canonical agent-skills workflows reported successful cross-platform synchronization after Git rejected their pushes. Runs with unchanged output also attempted an unnecessary push.

## What changes

Separate the unchanged result from a generated commit that needs to publish. Bind the publication step to its validated source SHA and fail on a rejected push. Preserve fast-forward-only integration.
