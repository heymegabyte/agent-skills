# Secrets on persistent agent hosts

Applies to local OpenClaw/native CLI execution, including the primary Ubuntu VM. This host policy overrides legacy assumptions about macOS/chezmoi paths and bulk credential discovery. Cloudflare-hosted application secret bindings remain a separate deployment concern.

- Use the existing `get-secret` interface and machine profile. On this host, `get-secret --exists NAME` checks availability without printing; retrieval belongs inside the consuming process. Preserve an existing broker. Infisical enrollment is optional protected machine configuration, never git data.
- Do not export retrieved secrets to GitHub Actions command files (`GITHUB_ENV`, `GITHUB_OUTPUT`, `GITHUB_STATE`, `GITHUB_STEP_SUMMARY`) or shared shell startup files. Do not print environment dumps, shell tracing, secret-returning commands, or raw provider transcripts in run artifacts.
- Workflow/native child environments omit Actions command-file paths and runner tokens. This reduces accidental leakage; it does not isolate tools executing as the same OS user. Privileged runners must execute trusted owner code only.
- Resolve a particular needed credential through the broker. Do not bulk-read sibling projects' `.env` files, browser profiles or authentication homes for discovery. Check deployed secret names when appropriate; listing a name does not reveal its value.
- Official Codex/Claude CLIs own OAuth. Never parse/copy their credentials into a gateway, application API or GitHub artifact. Local DeepSeek receives its key directly; no Cloudflare AI Gateway.
- Generate a new app-owned signing secret only when the task authorizes that app/configuration and no existing value needs preservation. Never overwrite live data-encryption keys or rotate third-party credentials blindly.
- If exposure is confirmed, stop the leaking path, remove confirmed public logs, record non-secret provenance, and arrange provider rotation. Log deletion is containment, not revocation. Report the limits of the audit.

Canonical host operations: [FLEET.md](../control-plane/FLEET.md). Generic product provisioning: [secret-provisioning.md](secret-provisioning.md).
