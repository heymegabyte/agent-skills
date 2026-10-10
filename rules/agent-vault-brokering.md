---
name: "agent-vault-brokering"
priority: 2
pack: "infra"
triggers:
  - "agent vault"
  - "infisical agent"
  - "credential broker"
  - "egress proxy"
  - "oidc machine identity"
  - "strict deny"
last_reviewed: 2026-10-10
superseded_by: null
---

# Agent Vault — brokered credential use for autonomous agents

Infisical stays the **secret source of truth**; Agent Vault is the **controlled credential-USE layer**.
The shape is `Infisical → Agent Vault → credential-injected HTTP → approved service` — the agent holds a
**placeholder**, the broker injects the real secret into the outbound request, the agent never sees it.
NOT "copy every secret into the agent env." Extends — never replaces — [[secrets-portable-resolution]]
and [[get-secret]]. Research + decisions in [[ADR-0001-agent-tooling-fabric]].

## What it is (shipping, not concept)

- **Agent Vault** = OSS `Infisical/agent-vault` (MIT): a forward/MITM HTTPS proxy beside the agent. Commercial
  sibling = **Infisical Agent Proxy**. Config via `agent-vault service …` / YAML; clients point at it with
  `HTTPS_PROXY=http://{token}:{vault}@host:14322` + trust its CA (`NODE_EXTRA_CA_CERTS`/`SSL_CERT_FILE`/…).
- Credential store = Infisical (read-only pull via machine identity). Infisical remains authoritative; the
  broker's local data is cache/runtime state, never canonical.

## Preserve what already works

- `get-secret NAME` stays the stable interface; its backend may be Infisical ([[secrets-portable-resolution]]).
  Do NOT force every deterministic script onto the broker. Migration direction: raw retrieval where
  unavoidable → **brokered use where practical**.
- **Never broker Claude/Codex subscription OAuth.** Those stay owned by the official CLIs. In the broker they
  are `--auth-type passthrough` services (forwarded, NO injection). Likewise `NO_PROXY=localhost,127.0.0.1`
  for the OpenClaw gateway + local MCP servers.
- **DeepSeek stays direct** (`DEEPSEEK_API_KEY` via OpenCode) — never through Cloudflare AI Gateway
  ([[agent-provider-policy]]). Broker it only if direct-DeepSeek behavior is preserved.

## Isolation reality (be honest)

- Agent Vault's strongest model runs the broker on a **separate host** from the agent, or with
  `--isolation=container` (per-session Docker bridge, `iptables OUTPUT DROP` → only the proxy is reachable).
- We run **one primary Ubuntu VM** today. Same-host, non-container Agent Vault does **NOT** provide that
  guarantee — a local agent can read the broker's files/sockets. Interim hardening: dedicated service
  user, private bind address, strict file perms, systemd hardening, documented residual same-host risk.
  Design so the broker can later move to its own host **without changing agent workflows**. Do not add a
  second machine solely to satisfy this.

## Strict egress policy (phased)

- Target `unmatched_host_policy=deny` for privileged brokered sessions — but only AFTER enumerating every
  legitimate upstream (Anthropic, OpenAI/Codex, GitHub, package registries, Cloudflare, DeepSeek). Enabling
  deny first silently breaks tools. Observe traffic → add precise, path-scoped service entries → then deny.

## Known gap — no staleness surface

- Agent Vault exposes **no last-good-snapshot age / `/healthz`**. If Infisical is down, treat credential
  availability as a hard dependency; `mise run vault:doctor` reports reachability + says the age is "not
  exposed" rather than faking freshness.

## GitHub Actions — Infisical OIDC (no static secret)

- Prefer **OIDC machine identity** over a long-lived Infisical client secret. Workflow sets
  `permissions: id-token: write`; GitHub issues the OIDC JWT; Infisical trusts it.
- Bind trust NARROWLY. Because project workflows call the canonical reusable workflow in
  `heymegabyte/agent-skills`, bind the **`job_workflow_ref`** claim (reusable-workflow identity) +
  `repository_owner_id` — not "any workflow in the org." Action: `Infisical/secrets-action` (SHA-pinned).

## Service manifest

- The declarative, **secret-free** service/capability manifest lives at
  `control-plane/agent-vault.services.yaml` (logical name · host/path scope · auth type · Infisical
  credential-reference NAME · projects/roles allowed · read|write|admin · passthrough? · notes). NEVER a
  secret value. Agent Vault config is generated/applied from it. Cloudflare: separate capabilities for
  read/status vs dev-management vs prod-management — not every agent gets the strongest token. Application
  Workers get a Secrets Store binding, never a management token.
