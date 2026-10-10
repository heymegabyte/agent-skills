---
name: "opentofu-infrastructure"
priority: 2
pack: "infra"
triggers:
  - "opentofu"
  - "tofu"
  - "terraform"
  - "infrastructure as code"
  - "cloudflare provider"
  - "tfstate"
last_reviewed: 2026-10-10
superseded_by: null
---

# OpenTofu — declarative ownership of long-lived infrastructure

OpenTofu owns **durable infrastructure topology**; Wrangler/app-CI owns **frequently-changing
Worker code**. Never let both believe they own the same resource. Lifecycle runs through mise
(`mise run infra:*`, wrapping `bin/tofu-helper.sh`). Decisions here are fixed by research in
[[ADR-0001-agent-tooling-fabric]]. Credentials come from [[secrets-portable-resolution]] /
[[agent-vault-brokering]], never from committed files.

## Responsibility boundary

- **OpenTofu owns:** CF zones/DNS, R2 buckets, D1, KV namespaces, Queues, Access apps/policies,
  Tunnels, Hyperdrive, account-level config, GitHub repo infrastructure — things that live for
  months and rarely change.
- **Wrangler/app-CI owns:** Worker code, bindings wired in `wrangler.toml`, per-push deploys.
- Rule of thumb: if it changes every deploy it is NOT OpenTofu's; if it is topology you'd be scared
  to click-delete in the dashboard, it IS.

## Provider + locking

- Provider `cloudflare/cloudflare` **v5** (`~> 5`); auth via `CLOUDFLARE_API_TOKEN` env only (never
  hardcoded — enforced by semgrep `hardcoded-cloudflare-token-shell`).
- Commit `.terraform.lock.hcl`; populate BOTH platforms:
  `tofu providers lock -platform=linux_amd64 -platform=darwin_arm64`.
- `tofu` itself is pinned in `mise.toml` (1.13.1) + locked in `mise.lock` across platforms.

## State — current verified choice (see [[ADR-0001-agent-tooling-fabric]])

- **State is NEVER committed** (`.gitignore`: `*.tfstate*`, `*.tfplan*`). It can contain secret values.
- **Backend = Cloudflare R2 via the `s3` backend WITHOUT native `use_lockfile`.** OpenTofu issue
  **#4405** (R2 + `use_lockfile` self-collision leaving an orphaned lock) was **CLOSED 2026-09-09 as
  "not planned"** — the fix PR was rejected. Do NOT enable `use_lockfile` on R2. Mutual exclusion comes
  from the **repo-scoped execution lock** (one primary host, serialized loop fires) instead.
- **Multi-machine path:** when a second executor appears, add a real lock layer (DynamoDB-style table or
  an `http`/Terrakube backend) and `tofu init -migrate-state` — do NOT invent a distributed lock early.

## State encryption

- Enable OpenTofu `encryption` (method `aes_gcm`) only where state holds sensitive values. Key via
  `pbkdf2` passphrase sourced from `get-secret TOFU_STATE_PASSPHRASE` — never in git/tfvars.
- **Losing the key = permanently unrecoverable state.** Back the key in the secret rail, document
  rotation (prepend new key in `keys`/`fallback`, apply, drop old), and TEST recovery before relying on it.

## Standard tasks (mise)

- `infra:fmt` — `tofu fmt -check`. `infra:validate` — backend-free `init -backend=false` + `validate -lint=all`.
- `infra:test` — `tofu test` with `command = plan` assertions (creates NO real resources; pair `mock_provider`).
- `infra:plan` — structured plan evidence. `infra:drift` — `plan -detailed-exitcode` (2 = drift).

## Plans are first-class evidence + safe apply

- Classify every plan: **no-op · create · in-place update · replacement · destroy · unknown**.
- Additive/reversible creates+updates the project requires → proceed per autonomous-engineering tier.
- **Replacement/destroy → approval-required.** Never auto-apply a destroy because a generated plan
  contains deletes. A compact plan summary (`+N ~M -K`, replacements, drift) goes to the GitHub Step
  Summary — never state values or secrets.

## Adopting existing resources (do NOT recreate)

Most infra already exists. Adopt non-destructively:

1. inventory the live resource → 2. config-driven `import { id=… to=… }` blocks (+ `tofu plan
   -generate-config-out`) → 3. strip computed attrs → 4. `tofu apply` → 5. remove import blocks →
   6. `tofu plan` until **"no changes"**. Only then is OpenTofu authoritative. Never mass-import blindly.

## OpenTofu + Infisical

- Infisical provider `infisical/infisical` exists; prefer **ephemeral resources** so secrets never land
  in state. On GitHub Actions use **OIDC machine identity** (see [[agent-vault-brokering]]), not static
  client secrets. Never write provider creds into committed `*.tfvars` (only `*.tfvars.example`).

## Reusable modules

- Create a module only where ≥2 projects share real topology. A good CF module encodes a proven
  architectural unit (e.g. "static site zone + R2 + cache rules"), not a thin wrapper around one resource.
- Template at `templates/opentofu/` — clone per project under `infra/`; projectsites.dev + megabyte.space
  (CF-heavy) are the first adoption candidates.
