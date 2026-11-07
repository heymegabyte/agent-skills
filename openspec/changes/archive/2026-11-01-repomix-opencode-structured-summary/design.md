# Design

`parent → repomix-opencode-summary.mjs → repomix-pack.sh → Repomix XML attachment → OpenCode/LiteLLM/DeepSeek → raw JSON events → extracted model JSON → schema/size validation → atomic compact summary`

The output envelope has a stable discriminator and semantic `schema_version`. Required v1 fields remain stable; optional additions go under additive properties or `extensions`. Consumers reject unknown major versions. Evidence uses paths and optional line/symbol references instead of copied source. The default summary ceiling prevents the child transcript from becoming a new context dump.

Ajv 2020 validates the returned object against the published Draft 2020-12 schema after a fast structural pre-check. For repositories above the safe 900K input budget, explicit Repomix include globs select the complete task dependency closure; oversized packs fail rather than truncate.
