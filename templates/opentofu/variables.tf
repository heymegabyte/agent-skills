# variables.tf — all inputs; no secrets (the API token comes from the environment).
variable "account_id" {
  type        = string
  description = "Cloudflare account ID that owns these resources."
}

variable "zone_id" {
  type        = string
  description = "Cloudflare zone ID for the site's apex domain."
}

variable "site_hostname" {
  type        = string
  description = "Apex hostname, e.g. projectsites.dev."
}

variable "origin_hostname" {
  type        = string
  description = "Origin the apex DNS record points at (e.g. the Workers route target)."
}

variable "assets_bucket_name" {
  type        = string
  description = "R2 bucket for durable static assets."
}

variable "r2_location" {
  type        = string
  default     = "wnam"
  description = "R2 location hint (v5 arg is `location`, not legacy `location_hint`)."
}
