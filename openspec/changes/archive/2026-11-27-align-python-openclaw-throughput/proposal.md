## Why

The Python fleet entrypoint sends every named OpenCode DeepSeek tier to direct `deepseek-chat`, even with the configured LiteLLM gateway key.

## What Changes

- Select the configured LiteLLM Pro or Flash tier for Python OpenCode throughput commands.
- Preserve the direct DeepSeek fallback when the gateway credential is absent.

## Capabilities

### New Capabilities

- `openclaw-fleet-routing`: Select the intended OpenCode model without mixing provider credentials.
