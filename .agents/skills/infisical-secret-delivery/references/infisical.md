# Infisical implementation notes

- Machine identities authenticate through an auth method and receive access tokens. Prefer native/cloud/OIDC methods when the runtime supports them; otherwise use Universal Auth with expiring client secrets.
- Access-token TTL, maximum TTL, maximum uses, and trusted IPs are auth-method controls. Defaults can be broad or long-lived; set them deliberately.
- Revocation may remain effective only after a cache window. For urgent revocation, delete/revoke the issuing credential or identity and verify denial.
- Role grants are additive. A narrow new grant does not cancel a broader inherited role.
- `infisical run` injects secrets selected by project/environment/path into a child process. Use a dedicated leaf path and manifest allowlist; do not rely on a broad parent path as least privilege.
- GitHub Actions should prefer OIDC with constrained repository/ref/environment claims instead of stored long-lived client secrets.
- Agent/template rendering is useful for services that consume files, but rendered files are persistent secret material and require atomic permissions, reload behavior, cleanup, and revocation semantics.
- Audit identity authentication, secret access metadata, grant changes, credential expiry, and failed/denied access. Keep secret values out of logs.

Primary sources:

- https://github.com/Infisical/infisical/blob/main/docs/documentation/platform/identities/machine-identities.mdx
- https://github.com/Infisical/infisical/blob/main/docs/documentation/platform/identities/universal-auth.mdx
- https://github.com/Infisical/infisical/blob/main/docs/documentation/platform/identities/oidc-auth/github.mdx
- https://github.com/Infisical/infisical/blob/main/docs/documentation/platform/access-controls/role-based-access-controls.mdx
- https://github.com/Infisical/infisical/blob/main/docs/integrations/platforms/infisical-agent.mdx
- https://github.com/Infisical/cli
