---
description: Fires on `/deploy` or "deploy" with NO code change — self-resolves the target via ccctl, runs check→build→deploy, and verifies the live URL before reporting success.
argument-hint: "[domain] [--preview]"
---

# /deploy — repo-agnostic deploy + verify (no code change)

Ship the current tree to prod (or a preview) and PROVE it is live. Never edit code here — use `/ship` for that.

## RESOLVE

- Run `node .claude/control-plane/ccctl.mjs plan [domain] "deploy"` (or `ccctl resolve [domain]`) FIRST.
  Fallback path: `~/.claude/plugins/heymegabyte-claude-skills/control-plane/ccctl.mjs`.
- Read `target`: `checkCmd`, `buildCmd`, `deployCmd`, `deployNoBuildCmd`, `verifyUrl`, `dnsStatus`, `healthPath`, `repo`, `worker`.
- Never ask the user for any of these — ccctl resolves them.

## BUILD

- Run `target.checkCmd` → then `target.buildCmd` (or `deployCmd` if it chains check+build+deploy).
- Any failure halts — do not deploy a red build.

## DEPLOY (prefer push→Workers Builds for prod)

- Capture the rollback ref first: `npx wrangler deployments list` → current version id.
- PROD: prefer **GitHub push → Cloudflare Workers Builds** when long-lived creds shouldn't sit in the VM
  (CC-web sandbox, shared runner). Else `target.deployCmd`.
- Capability order: ProjectSites MCP → Cloudflare MCP / CF plugin → wrangler + CF REST (`X-Auth-Email`+`X-Auth-Key`) → GitHub push → Workers Builds.
- NEVER `wrangler deploy` while a build is mid-write (partial `dist/` → site-wide 404). Use the build-then-deploy chain.

## VERIFY (mandatory — never report success unchecked)

- `ccctl verify <target.verifyUrl> --status 200 --asset <healthPath>` (real Chrome UA, exit 1 on fail).
  `verifyUrl` = workers.dev when `dnsStatus` pending, else the custom domain.
- Remote browser smoke (CF Browser Rendering REST → Browserbase/Stagehand → Playwright):
  load `verifyUrl`, assert 0 console errors, 0 failed network requests, expected content present.
- Never report success until the deployed URL was ACTUALLY checked in a browser.

## PREVIEW path (`--preview`)

- Use a **Workers Builds preview** deployment, or a temporary `wrangler deploy` to a `*.workers.dev` preview alias when appropriate.
- Verify the preview URL the same way; report it as preview (do not touch the prod alias).

## REPORT

- Live URL + commit + version id + branch + rollback ref (+ preview URL when `--preview`).
- Verification evidence: HTTP status + browser (console/network clean, content asserted).
