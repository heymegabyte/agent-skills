# Capability Matrix

Where each capability actually works today, per surface. Be realistic: "works on
my laptop" ≠ "works headless on the web."

**Legend** — `verified` = confirmed working · `configured-unverified` = wired but
not yet proven end-to-end.
`unsupported` = not possible on this surface · `requires-user-approval` = needs a
one-time human action (set a secret, grant OAuth, click upload).

| Capability            | Local Code            | Claude Code Web         | Claude Chat/Cowork      | Browser                 | CI                      |
| --------------------- | --------------------- | ----------------------- | ----------------------- | ----------------------- | ----------------------- |
| Resolve target        | verified              | verified                | configured-unverified   | unsupported             | verified                |
| Risk classify         | verified              | verified                | configured-unverified   | unsupported             | verified                |
| Implement change      | verified              | verified                | configured-unverified   | unsupported             | unsupported             |
| Run tests             | verified              | verified                | unsupported             | unsupported             | verified                |
| Build                 | verified              | verified                | unsupported             | unsupported             | verified                |
| Deploy preview        | verified              | requires-user-approval  | unsupported             | unsupported             | configured-unverified   |
| Deploy prod           | verified              | requires-user-approval  | unsupported             | unsupported             | configured-unverified   |
| HTTP verify           | verified              | verified                | configured-unverified   | unsupported             | verified                |
| Browser visual verify | configured-unverified | configured-unverified   | unsupported             | verified                | configured-unverified   |
| Rollback              | verified              | requires-user-approval  | unsupported             | unsupported             | configured-unverified   |
| Cache invalidate      | verified              | requires-user-approval  | unsupported             | unsupported             | configured-unverified   |
| Push branch/PR        | verified              | verified                | requires-user-approval  | unsupported             | verified                |
| Cloudflare MCP read   | verified              | configured-unverified   | configured-unverified   | unsupported             | unsupported             |
| Gmail draft           | requires-user-approval| requires-user-approval  | requires-user-approval  | requires-user-approval  | unsupported             |
| Skills sync           | verified              | unsupported             | requires-user-approval  | requires-user-approval  | unsupported             |
| Run-the-loop          | verified              | configured-unverified   | unsupported             | unsupported             | configured-unverified   |
| Resource broker       | verified              | requires-user-approval  | unsupported             | unsupported             | configured-unverified   |

Notes on the `requires-user-approval` cells: **web deploy / rollback / cache /
resource-broker** all need Cloud-Environment Cloudflare credentials
(`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`), which a human sets once.
**Gmail** needs the Google Workspace connector's OAuth grant. **Skills sync to
the account** is a manual upload in the claude.ai Skills UI (the web session
can't push to the account itself).
