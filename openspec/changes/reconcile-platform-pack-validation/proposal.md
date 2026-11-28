## Why

The approved parallel-delivery rule moved into the platform pack in source commit d791e90d. The scoped policy manifest and validation allowlist still describe the previous membership, which rejects the current pack.

## What Changes

Register the existing rule in the scoped manifest and validator, preserving strict rejection of unregistered members.
