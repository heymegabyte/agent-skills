---
name: twilio
description: "Twilio - Messaging API skill — auto-forged from OpenAPI 1.0.0. This is the public Twilio REST API."
triggers: ["twilio API", "working with Twilio - Messaging"]
version: 1.0.0
forged-from: openapi
api-title: Twilio - Messaging
api-version: 1.0.0
---

# Twilio - Messaging API Skill

<!-- commands-collapsed -->
> **Per-endpoint pages collapsed.** The 58 `commands/*.md` files (one per endpoint) were removed to cut file count — they were forge-generated, unrouted, and reproduce what Context7 (live API docs) and the typed `client.ts` already provide (some integrations also expose a live MCP server). The **Slash Commands** inventory below is retained.
> Restore full offline curl/param detail any time: `node bin/forge-skill-from-openapi.mjs <spec-url> skills/twilio --name twilio`.


Auto-forged from the Twilio - Messaging OpenAPI spec (v1.0.0).

## What this skill provides

- **58 slash commands** — one per API endpoint, with curl examples and typed guidance
- **`types.ts`** — TypeScript types auto-generated from OpenAPI schemas
- **`client.ts`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

- `/get-v1-services-servicesid-alphasenders` — 
- `/post-v1-services-servicesid-alphasenders` — 
- `/get-v1-services-servicesid-alphasenders-sid` — 
- `/delete-v1-services-servicesid-alphasenders-sid` — 
- `/post-v1-a2p-brandregistrations-brandregistrationsid-smsotp` — 
- `/get-v1-a2p-brandregistrations-sid` — 
- `/post-v1-a2p-brandregistrations-sid` — 
- `/get-v1-a2p-brandregistrations` — 
- `/post-v1-a2p-brandregistrations` — 
- `/get-v1-a2p-brandregistrations-brandsid-vettings` — 
- `/post-v1-a2p-brandregistrations-brandsid-vettings` — 
- `/get-v1-a2p-brandregistrations-brandsid-vettings-brandvettingsid` — 
- `/get-v1-services-messagingservicesid-channelsenders` — 
- `/post-v1-services-messagingservicesid-channelsenders` — 
- `/get-v1-services-messagingservicesid-channelsenders-sid` — 
- `/delete-v1-services-messagingservicesid-channelsenders-sid` — 
- `/get-v1-deactivations` — Fetch a list of all United States numbers that have been deactivated on a specific date.
- `/get-v1-services-servicesid-destinationalphasenders` — 
- `/post-v1-services-servicesid-destinationalphasenders` — 
- `/get-v1-services-servicesid-destinationalphasenders-sid` — 
- `/delete-v1-services-servicesid-destinationalphasenders-sid` — 
- `/get-v1-linkshortening-domains-domainsid-certificate` — 
- `/post-v1-linkshortening-domains-domainsid-certificate` — 
- `/delete-v1-linkshortening-domains-domainsid-certificate` — 
- `/get-v1-linkshortening-domains-domainsid-config` — 
- `/post-v1-linkshortening-domains-domainsid-config` — 
- `/get-v1-linkshortening-messagingservice-messagingservicesid-domai` — 
- `/get-v1-linkshortening-domains-domainsid-validatedns` — 
- `/post-v1-services-preregisteredusa2p` — 
- `/post-v1-linkshortening-domains-domainsid-messagingservices-messag` — 
- `/delete-v1-linkshortening-domains-domainsid-messagingservices-messag` — 
- `/get-v1-linkshortening-messagingservices-messagingservicesid-doma` — 
- `/get-v1-services-servicesid-phonenumbers` — 
- `/post-v1-services-servicesid-phonenumbers` — 
- `/get-v1-services-servicesid-phonenumbers-sid` — 
- `/delete-v1-services-servicesid-phonenumbers-sid` — 
- `/post-v1-linkshortening-domains-domainsid-requestmanagedcert` — 
- `/get-v1-services` — 
- `/post-v1-services` — 
- `/get-v1-services-sid` — 
- `/post-v1-services-sid` — 
- `/delete-v1-services-sid` — 
- `/get-v1-services-servicesid-shortcodes` — 
- `/post-v1-services-servicesid-shortcodes` — 
- `/get-v1-services-servicesid-shortcodes-sid` — 
- `/delete-v1-services-servicesid-shortcodes-sid` — 
- `/get-v1-tollfree-verifications-sid` — Retrieve a tollfree verification
- `/post-v1-tollfree-verifications-sid` — Edit a tollfree verification
- `/delete-v1-tollfree-verifications-sid` — Delete a tollfree verification
- `/get-v1-tollfree-verifications` — List tollfree verifications
- `/post-v1-tollfree-verifications` — Create a tollfree verification
- `/get-v1-services-messagingservicesid-compliance-usa2p` — 
- `/post-v1-services-messagingservicesid-compliance-usa2p` — 
- `/get-v1-services-messagingservicesid-compliance-usa2p-sid` — 
- `/post-v1-services-messagingservicesid-compliance-usa2p-sid` — 
- `/delete-v1-services-messagingservicesid-compliance-usa2p-sid` — 
- `/get-v1-services-messagingservicesid-compliance-usa2p-usecases` — 
- `/get-v1-services-usecases` — 

## Usage

```ts
import { TwilioClient } from './twilio/client.js';

const client = new TwilioClient(process.env.TWILIO_API_TOKEN!);
```

## Auth pattern

Set `API_TOKEN` (or the env var specific to this API) before running any command.
All generated curl examples use `-H "Authorization: Bearer $API_TOKEN"`.

## Maintenance

- **Re-forge**: `node ~/.agentskills/bin/forge-skill-from-openapi.mjs <spec-url> skills/twilio --name twilio`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits in `commands/*.md` survive if you rename the file.

## Source

Generated 2026-06-18 by forge-skill-from-openapi.
Spec: https://messaging.twilio.com
