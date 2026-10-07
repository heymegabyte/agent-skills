---
description: Reconcile the Cloudflare agent fabric: official skills, API MCP, MCP Portal candidates, AI Search, Secrets Store, Dynamic Routes, Browser Run and telemetry.
argument-hint: "(optional project/domain)"
---

# /cloudflare-bootstrap

Idempotent. Follow `[[cloudflare-agent-fabric]]`.

1. Ensure official `cloudflare/skills` are installed for each detected harness.
2. Ensure `https://mcp.cloudflare.com/mcp` is connected.
3. Run `node bin/audit-cloudflare-mcp-fleet.mjs`.
4. Register appropriate remote HTTP MCPs in the Cloudflare MCP Server Portal; keep local stdio/localhost tools local unless intentionally re-hosted. Keep the broad Cloudflare API MCP direct.
5. Reconcile Dynamic Route intents on `megabyte-space` and `projectsites-dev`: fast, standard, premium, vision, bulk. Use current provider/model availability, conditions, budgets/rate limits, retries/timeouts and fallbacks.
6. Follow `[[ai-search-knowledge-fabric]]`: first wave = skills, requirements, project/site knowledge, whole-site research, deploy evidence, incidents, competitive intelligence, accepted agent learning.
7. Discover only actual secrets the project uses, place them in Secrets Store, and bind only the minimal required subset per Worker. Keep normal config in vars; never bind Cloudflare account-management credentials into product Workers.
8. No Worker Preview. Build/test on local/Daytona/Coolify/GitHub runner as appropriate, deploy once, then Browser Run/CDP the real production URL.
9. Ensure long-running Worker/agent surfaces emit Tail-Worker-friendly telemetry: project, skill, agent, run_id, phase, trace_id, model_route, cost, duration_ms, result, rollback_id.

Return exactly what changed, what stayed direct/local, and production verification evidence.
