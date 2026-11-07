---
name: linux-desktop-gnome-preference
description: Prefer the host distribution's native GNOME desktop and share its existing session via native host KasmVNC (`kasmvncserver` / `Xkasmvnc` + `xtigervncviewer` bridging `gnome-remote-desktop-daemon`) for Linux VMs, desktops, and old laptop-type runners instead of creating container webtops or alternate desktop variants.
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Prefer Native GNOME + Host KasmVNC Bridge for Linux Desktops & Laptop Runners

When a Linux machine (Proxmox VM, physical desktop, or repurposed old laptop-type runner) is provisioned
with a graphical session, Ubuntu GNOME is the canonical graphical environment. Prefer the distribution's
native GNOME session over XFCE, KDE Plasma, LXQt, MATE, Cinnamon, or Docker container webtops (`kasmweb/*`,
`linuxserver/webtop`) unless the user explicitly requests a different environment.

On `ubuntu-proxmox-primary` (`ubuntu`, `ubuntu.megabyte.space`) and any old laptop-type Linux runner,
the browser endpoint at `https://<host>.megabyte.space` MUST share the host's live Ubuntu GNOME session
through native host KasmVNC (`ubuntu-kasmvnc.service` on `127.0.0.1:6901` bridging `ubuntu-vnc.service`
on `127.0.0.1:5900`), never an isolated container webtop.

## Remote access contract (Native KasmVNC + GNOME Wayland Bridge)

- Remote access MUST attach to and share the existing host GNOME session so the physical/Proxmox console
  and the browser KasmVNC client view and control the exact same desktop (`/home/<user>`).
- Do not start a second desktop login, container home directory (`/home/kasm-user`), or duplicate browser
  profile to provide browser-based remote access.
- On Ubuntu GNOME/Wayland (where Mutter owns `:0` and `@/tmp/.X11-unix/X1`), use the two-unit native
  KasmVNC bridge pattern (reference: `ubuntu.megabyte.space`):
  1. `ubuntu-vnc.service`: runs `gnome-remote-desktop-daemon` on `127.0.0.1:5900` (built with file-backed
     credentials `grd_credentials_file_new` at `~/.config/gnome-remote-desktop/credentials.ini` so
     autologin reboots never lose the VNC password when the GNOME login keyring is locked).
  2. `ubuntu-kasmvnc.service`: runs native `/usr/bin/Xkasmvnc :20` on `127.0.0.1:6901` (`-interface 127.0.0.1 -UseIPv4 1 -UseIPv6 0 -localhost 1 -websocketPort 6901 -sslOnly 1 -DisableBasicAuth 1 -SecurityTypes None -AlwaysShared 1 -DisconnectClients 0`) with `openbox` and fullscreen `xtigervncviewer -FullScreen=1 -FullScreenMode=All -RemoteResize=1 -Shared=1 -PreferredEncoding=Raw` connected to `127.0.0.1::5900`.
- Keep both `127.0.0.1:5900` (raw RFB) and `127.0.0.1:6901` (KasmVNC HTTPS/WebSocket) loopback-only.
  Publish only `https://127.0.0.1:6901` through `cloudflared` behind an owner-only Cloudflare Access policy.
- On **old laptop-type runners**, configure `/etc/systemd/logind.conf.d/00-runner-lid.conf`
  (`HandleLidSwitch=ignore`, `HandleLidSwitchExternalPower=ignore`, `HandleLidSwitchDocked=ignore`),
  GDM autologin, and GNOME `sleep-inactive-ac-type='nothing'` / `sleep-inactive-battery-type='nothing'`
  so closing the laptop lid never suspends the machine or breaks the live GNOME + KasmVNC session.
- Preserve one authoritative host browser profile (`/etc/opt/chrome/policies/managed/00-english.json`
  enforcing `en-US` against WARP egress geolocation).

## Acceptance

Prove session identity interactively: open or move a window on the GNOME Wayland session (`wayland-0`)
and verify the pixel change is immediately visible on `Xkasmvnc :20` / `https://127.0.0.1:6901`, plus run
`scripts/verify-vnc.py` (verifying `/websockify` `RFB 003.008`, `xtigervncviewer` → `127.0.0.1:5900`
bridge, and non-blank `:20` framebuffer).
