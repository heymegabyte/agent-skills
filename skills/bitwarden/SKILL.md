---
name: bitwarden
description: "Bitwarden Public API skill — auto-forged from OpenAPI 1.0.0. Bitwarden Public API for Organizations — manage members, collections, groups, events, and policies."
triggers: ["bitwarden API", "working with Bitwarden Public API"]
version: 1.0.0
forged-from: openapi
api-title: Bitwarden Public API
api-version: 1.0.0
---

# Bitwarden Public API API Skill

<!-- commands-collapsed -->
> **Per-endpoint pages collapsed.** The 28 `commands/*.md` files (one per endpoint) were removed to cut file count — they were forge-generated, unrouted, and reproduce what Context7 (live API docs) and the typed `client.ts` already provide (some integrations also expose a live MCP server). The **Slash Commands** inventory below is retained.
> Restore full offline curl/param detail any time: `node bin/forge-skill-from-openapi.mjs <spec-url> skills/bitwarden --name bitwarden`.


Auto-forged from the Bitwarden Public API OpenAPI spec (v1.0.0).

## What this skill provides

- **28 slash commands** — one per API endpoint, with curl examples and typed guidance
- **`types.ts`** — TypeScript types auto-generated from OpenAPI schemas
- **`client.ts`** — Typed fetch-based API client (zero deps, Workers-compatible)

## Slash Commands

- `/get-ciphers` — List all items in the organization vault
- `/get-ciphers-id` — Retrieve a vault item
- `/put-ciphers-id` — Update a vault item
- `/delete-ciphers-id` — Delete a vault item
- `/post-ciphers-create` — Create a new vault item in an existing collection
- `/get-collections` — List all collections in the organization
- `/post-collections` — Create a new collection
- `/get-collections-id` — Retrieve a collection
- `/put-collections-id` — Update a collection
- `/delete-collections-id` — Delete a collection
- `/get-members` — List all members of the organization
- `/post-members` — Invite a new member to the organization
- `/get-members-id` — Retrieve a member of the organization
- `/put-members-id` — Update an organization member
- `/delete-members-id` — Remove a member from the organization
- `/post-members-id-reinvite` — Re-invite a member to the organization
- `/post-members-id-confirm` — Confirm a member of the organization
- `/get-groups` — List all groups in the organization
- `/post-groups` — Create a new group
- `/get-groups-id` — Retrieve a group
- `/put-groups-id` — Update a group
- `/delete-groups-id` — Delete a group
- `/get-groups-id-member-ids` — Get member IDs for a group
- `/put-groups-id-member-ids` — Update members of a group
- `/get-events` — List organization event logs
- `/get-policies` — List all policies for the organization
- `/get-policies-type` — Retrieve a policy by type
- `/put-policies-type` — Update a policy

## Auth — OAuth2 `client_credentials` flow (NOT a simple API key)

Bitwarden Public API uses OAuth2 `client_credentials`. There is no bearer API key — you must
exchange credentials for a short-lived access token first.

### Step 1 — Get credentials from the Bitwarden web vault

1. Log in at `https://vault.bitwarden.com` (or your self-hosted URL).
2. Go to **Settings → Organizations → [Your Org] → Settings → API Key**.
3. Copy `client_id` (format: `organization.<uuid>`) and `client_secret`.

### Step 2 — Exchange for an access token

```bash
curl -s -X POST https://identity.bitwarden.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$BW_CLIENT_ID" \
  -d "client_secret=$BW_CLIENT_SECRET" \
  -d "scope=api.organization" \
  | jq -r '.access_token'
```

Response shape:

```json
{
  "access_token": "eyJ...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "api.organization"
}
```

### Step 3 — Call the API with the token

```bash
export BW_TOKEN=$(curl -s -X POST https://identity.bitwarden.com/connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=$BW_CLIENT_ID&client_secret=$BW_CLIENT_SECRET&scope=api.organization" \
  | jq -r '.access_token')

curl -s https://api.bitwarden.com/public/members \
  -H "Authorization: Bearer $BW_TOKEN"
```

### Step 4 — Token TTL and refresh

- Tokens expire after **1 hour** (`expires_in: 3600`).
- There is no refresh token in `client_credentials` flow — re-run the token endpoint to get a new one.
- For long-running scripts, re-fetch the token before each session or on 401 response.

### .env pattern

```bash
# ~/.env or project .env (never commit)
BW_CLIENT_ID=organization.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
BW_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Load with `get-secret BW_CLIENT_ID` / `get-secret BW_CLIENT_SECRET` per the project secret pattern,
or `source $CLAUDE_ENV_FILE` when the env file is set.

### TypeScript client usage

```ts
import { BitwardenClient } from './bitwarden/client.js';

// Exchange credentials for token first
const tokenRes = await fetch('https://identity.bitwarden.com/connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.BW_CLIENT_ID!,
    client_secret: process.env.BW_CLIENT_SECRET!,
    scope: 'api.organization',
  }),
});
const { access_token } = await tokenRes.json();

const client = new BitwardenClient(access_token);
```

> **Do not** pass `BW_CLIENT_ID` or `BW_CLIENT_SECRET` directly to `BitwardenClient` — the constructor
> expects the short-lived `access_token`, not the long-lived credentials.

## Maintenance

- **Re-forge**: `node ~/.agentskills/bin/forge-skill-from-openapi.mjs <spec-url> skills/bitwarden --name bitwarden`
- **Hand-edit**: add examples, tweak descriptions, add business-context to commands.
- **Spec drift**: re-running forge overwrites generated files; custom edits in `commands/*.md` survive if you rename the file.

## Source

Generated 2026-06-18 by forge-skill-from-openapi.
Spec: https://api.bitwarden.com/public
