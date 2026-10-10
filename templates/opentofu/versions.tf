# versions.tf — pin OpenTofu + the Cloudflare provider (v5 generation).
# tofu is itself pinned in mise.toml (1.13.1) + mise.lock. Commit .terraform.lock.hcl
# populated for BOTH platforms: tofu providers lock -platform=linux_amd64 -platform=darwin_arm64
terraform {
  required_version = ">= 1.13.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
  }

  # STATE: R2 via the s3 backend WITHOUT native use_lockfile (OpenTofu #4405 is
  # CLOSED "not planned" — self-collision risk). Mutual exclusion = repo-scoped
  # execution lock on the single primary host. See rules/opentofu-infrastructure.md.
  # Copy backend.tf.example → backend.tf per project; NEVER commit state.
}

# Provider reads CLOUDFLARE_API_TOKEN from the environment — resolved at runtime via
# `export CLOUDFLARE_API_TOKEN=$(get-secret CLOUDFLARE_API_TOKEN)` (or the Agent Vault
# broker). NEVER a hardcoded token (semgrep: hardcoded-cloudflare-token-shell).
provider "cloudflare" {}
