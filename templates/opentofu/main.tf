# main.tf — a proven CF unit: durable static-asset bucket + apex DNS record.
# Reusable "cf-static-site" topology. Clone per project under infra/ and set tfvars.
# Uses v5 resource names/args (cloudflare_dns_record + content; cloudflare_r2_bucket + location).

resource "cloudflare_r2_bucket" "assets" {
  account_id = var.account_id
  name       = var.assets_bucket_name
  location   = var.r2_location
}

resource "cloudflare_dns_record" "apex" {
  zone_id = var.zone_id
  name    = var.site_hostname
  type    = "CNAME"
  content = var.origin_hostname
  ttl     = 1 # 1 = automatic when proxied
  proxied = true
}

output "assets_bucket" {
  value       = cloudflare_r2_bucket.assets.name
  description = "Name of the R2 assets bucket under management."
}

output "apex_record" {
  value       = cloudflare_dns_record.apex.name
  description = "Apex DNS record hostname under management."
}
