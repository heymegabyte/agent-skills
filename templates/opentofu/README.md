# templates/opentofu — reusable Cloudflare "cf-static-site" module

A proven CF topology unit (durable R2 assets bucket + proxied apex DNS record) for the
OpenTofu-managed layer. Clone per project under `infra/` and supply `terraform.tfvars`.
Doctrine + the state/backend/#4405 decisions: [`rules/opentofu-infrastructure.md`](../../rules/opentofu-infrastructure.md).

## Boundary

OpenTofu owns **long-lived topology** (zones, DNS, R2, D1, KV, Access). Wrangler/app-CI owns
**Worker code**. Never both on the same resource.

## Use

```bash
cp backend.tf.example backend.tf            # set per-project R2 state bucket (NO use_lockfile)
cp terraform.tfvars.example terraform.tfvars # NO secrets here
export CLOUDFLARE_API_TOKEN=$(get-secret CLOUDFLARE_API_TOKEN)

mise run infra:fmt        # tofu fmt -check
mise run infra:validate   # backend-free init + validate -lint=all
mise run infra:test       # plan-only assertions (mock provider, no real resources, offline)
mise run infra:plan       # structured change evidence (no apply)
mise run infra:drift      # plan -detailed-exitcode (2 = drift)
```

## Adopting existing resources (do NOT recreate)

Use config-driven `import {}` blocks → `tofu plan -generate-config-out` → strip computed attrs →
apply → remove import blocks → `tofu plan` until **no changes**. Never mass-import blindly.

## Guarantees in this template

- Provider pinned `cloudflare/cloudflare ~> 5`; `.terraform.lock.hcl` committed for
  `linux_amd64` + `darwin_arm64` (GPG-verified checksums).
- v5 resource names/args (`cloudflare_dns_record` + `content`, `cloudflare_r2_bucket` + `location`).
- No secrets in any committed file; the API token is read from the environment.
- `tests/plan.tftest.hcl` proves topology with a `mock_provider` — CI-safe, creates nothing.
