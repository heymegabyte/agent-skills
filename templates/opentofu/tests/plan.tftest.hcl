# plan.tftest.hcl — plan-only assertions. command = plan + mock_provider means NO real
# resources are created and NO credentials/network are needed (runs in CI offline).
# Run via: mise run infra:test  (bin/tofu-helper.sh test).

mock_provider "cloudflare" {}

variables {
  account_id         = "acct000000000000000000000000test"
  zone_id            = "zone000000000000000000000000test"
  site_hostname      = "example.test"
  origin_hostname    = "origin.workers.dev"
  assets_bucket_name = "example-assets-test"
  r2_location        = "wnam"
}

run "plans_expected_topology" {
  command = plan

  assert {
    condition     = cloudflare_r2_bucket.assets.name == "example-assets-test"
    error_message = "R2 assets bucket name must come from assets_bucket_name."
  }

  assert {
    condition     = cloudflare_dns_record.apex.type == "CNAME"
    error_message = "Apex record must be a proxied CNAME."
  }

  assert {
    condition     = cloudflare_dns_record.apex.content == "origin.workers.dev"
    error_message = "Apex record content must point at the origin hostname (v5 uses `content`)."
  }
}
