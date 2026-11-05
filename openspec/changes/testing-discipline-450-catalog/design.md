# Design

## Architecture

Keep `07-quality-and-verification/tdd-verification.md` as the concise dispatcher. Load detailed obligations from fifteen family references only when the application profile and change risk select them. Validate the catalog, profiles, manifests, selection, evidence, and final verdict at runtime boundaries with JSON Schema-backed Node helpers.

The shared policy and evaluations live in agent-skills. Application-neutral adapters are templates. Canonical UI fixtures and reusable UI test utilities belong in theme.tools; component and full-page stories are documented by ui.theme.tools. Pilot repositories consume versioned shared contracts rather than copying components, themes, or fixtures.

## Selection and gate

`testing-select.mjs` reads validated changed-input mappings and emits a conservative manifest. Unknown inputs, missing baselines, stale mappings, or graph errors widen selection and can never create an empty pass. `testing-gate.mjs` reconciles every selected obligation and shard into fresh-pass, valid-cache, failed, incomplete, blocked, or not-applicable states. Required missing, skipped, cancelled, timed-out, zero-discovery, or lost-artifact results block.

Nx is an optional adapter selected only after installed-version inspection; mise remains this repository's established task front door. Remote Chromium uses Playwright over Cloudflare Browser Run CDP with exact-preview identity, one session per worker, bounded permits and launch rate, fresh contexts, backend namespaces, and finally cleanup. Firefox, WebKit, real-device, and human checks remain separate when required.

## Evidence and rollout

Policy coverage is distinct from application rollout. The catalog ledger accounts for exactly 450 IDs and records default layer/tier plus implementation state. Application manifests bind requirements and risks to stable tests, dependencies, execution tiers, immutable revisions, and evidence. The normal required path targets 300 seconds without turning incomplete work into success.

## Safety

No paid service is introduced. Live providers and Browser Run require existing credentials, quotas, exact approved origins, redaction, retention, and explicit budgets. Production-destructive tests are forbidden. Cache trust domains are isolated. Application pilots begin with auth, tenant isolation, billing, durable writes/deletion, migrations, publishing/rollback, Preview/Production, AI tools, and one complete journey.

## Rollback

Adapters are additive and opt-in. Revert the testing change and its generated mirrors; existing mise tasks remain intact. Selector uncertainty always widens, so disabling a faulty optimization restores broader execution without weakening required checks.
