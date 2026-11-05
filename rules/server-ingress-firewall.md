---
name: server-ingress-firewall
description: Provision every server with cloudflared as the default ingress and an enabled default-deny inbound host firewall. Use for server setup, VM or bare-metal provisioning, self-hosted services, SSH, Docker/Coolify/Proxmox deployments, firewall changes, public hostnames, and any request to expose a port or service.
priority: 1
pack: infra
triggers:
  - "server"
  - "ubuntu server"
  - "server setup"
  - "provision server"
  - "docker"
  - "cloudflared"
  - "cloudflare tunnel"
  - "firewall"
  - "ufw"
  - "firewalld"
  - "open port"
  - "expose service"
  - "ssh server"
  - "self-hosted"
  - "proxmox"
  - "coolify"
paths:
  - "**/Dockerfile"
  - "**/docker-compose*.yml"
  - "**/docker-compose*.yaml"
---

# Server ingress = cloudflared + default-deny host firewall

## Ownership split

- **This rule owns policy**: required posture, exception criteria, and verification gates.
- **Install Doctor owns universal mechanisms**: install/enable `cloudflared` and the platform firewall, apply safe defaults, and expose idempotent health/verification commands. It does not choose production hostnames, origin ports, Access policies, or permanent exceptions.
- **Each host recovery repo owns machine desired state**: tunnel identity reference, ingress entries, Access intent, firewall exception records, reconciliation, rollback, and recovery.
- **Cloudflare and the live host are reconciled runtime state**: dashboard-only or hand-edited rules are drift, not source of truth.

Do not duplicate host declarations in Install Doctor or universal policy in a host repo. Installing software never authorizes opening its port.

## Mandatory baseline

- Serve inbound application, admin, and SSH traffic through a remotely managed **Cloudflare Tunnel (`cloudflared`)**. Do not expose an origin port publicly when Tunnel can carry the protocol.
- Bind origins to `127.0.0.1`, a container-only network, or a private interface required by the tunnel connector. Never use `0.0.0.0` by habit.
- Install, enable, and start the host firewall during provisioning. Default policy: **deny inbound, allow established/related traffic, allow outbound**.
- Keep the public edge at Cloudflare: proxied DNS, a least-privilege tunnel ingress rule per hostname/service, and Cloudflare Access for admin, SSH, dashboards, and other non-public surfaces.
- Treat Cloudflare as the front door, not as a substitute for host defense. Tunnel-only ingress and the host firewall are both required.

## Exceptions are explicit objects

Open direct inbound traffic only when a demonstrated protocol or operational requirement cannot use Tunnel (for example, a required LAN-only discovery protocol, hypervisor cluster traffic, or a break-glass management path).

For every exception, create a dedicated rule that records:

1. Purpose and owner.
2. Protocol and exact port/range.
3. Narrowest source CIDR, interface, VLAN, or peer set; never `0.0.0.0/0` without a written one-way-door security decision.
4. Whether the exposure is LAN-only, mesh/VPN-only, or public.
5. Expiry/review condition and removal command.
6. Verification proving allowed traffic works and disallowed sources remain blocked.

Do not disable the firewall to debug. Add a temporary scoped rule with an expiry, observe, then remove or formalize it.

## Provisioning order

1. Preserve the current management session with a temporary source-scoped rule when needed.
2. Install and enroll `cloudflared`; create one tunnel ingress rule per service.
3. Bind the origin privately and verify it locally.
4. Configure the firewall baseline and explicit exceptions.
5. Enable the firewall, then verify Tunnel/Access from the real edge before closing the bootstrap path.
6. Persist tunnel, DNS, Access, firewall exception, reconciliation, and rollback configuration in the host's recovery repo; Install Doctor retains only the portable mechanism.

## Verification gate

- `cloudflared` is enabled, healthy, and connected after reboot.
- The public hostname resolves to Cloudflare and reaches the intended origin through Tunnel.
- Access fails closed for protected services; verify from an off-WARP/untrusted path.
- The host firewall is enabled with default-deny inbound.
- A socket inventory (`ss -lntup` or platform equivalent) matches the documented rules; no unintended service listens on a public interface.
- An external scan confirms origin ports are closed. Test every exception from both an allowed and denied source.
- Reboot or restore testing proves the posture persists.

## Cross-links

`05-architecture-and-stack/coolify-docker-proxmox.md` · `26-platform-delivery/SKILL.md` ·
`[[machine-recovery-repo]]` · `[[remote-desktop-webtop]]` · `[[verify-against-source-of-truth]]` ·
`[[cloudflare-native-provisioning]]` · `[[cf-zero-trust-access]]`.
