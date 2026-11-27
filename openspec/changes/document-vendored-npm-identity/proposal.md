## Why

A digest-valid vendored npm archive can still disagree with the lockfile package identity. The release guide describes physical path and checksum checks but omits the new strict identity guarantee.

## What Changes

Document the strict installed verifier, npm alias identity, and how to reconcile disagreements using qualified release evidence.
