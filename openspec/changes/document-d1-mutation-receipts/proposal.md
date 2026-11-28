## Why

A Browse profile draft update committed while its API returned a conflict. D1's mutation metadata counted dependent trigger writes, so a one-row check misclassified the update.

## What Changes

Add this boundary case to the existing database skill. Require an operation-specific outcome when triggers or cascading effects can change aggregate mutation counts, and verify both the committed mutation and the rejected stale attempt in the target runtime.
