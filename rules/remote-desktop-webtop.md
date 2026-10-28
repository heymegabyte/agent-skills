---
name: remote-desktop-webtop
description: Any desktop presented in a browser DEFAULTS to a KasmVNC webtop (linuxserver/webtop) behind Cloudflare Access Zero Trust + Google SSO (single sign-in); Selkies ONLY when low-latency WebRTC/GPU streaming is absolutely necessary. Use when standing up / exposing / provisioning a remote desktop, webtop, VNC, "desktop in the browser", or choosing between KasmVNC / Selkies / noVNC / Guacamole.
triggers: ["kasmvnc", "webtop", "selkies", "remote desktop", "desktop in the browser", "vnc", "novnc", "guacamole", "web desktop", "browser desktop", "gnome-remote-desktop"]
---

# Remote Desktop = KasmVNC Webtop (Selkies only when absolutely necessary)

**Origin:** Brian 2026-10-28. Standing doctrine for presenting ANY desktop in a browser.
Supersedes the Selkies-first framing of the `ubuntu.megabyte.space` web desktop.

## The mandate

- **Default = KasmVNC webtop.** Any time a desktop is presented in a browser, use a **genuine
  KasmVNC webtop** — the `kasmweb/*` images (`kasmweb/core-ubuntu-noble` + XFCE, real
  `kasmvncserver`/`Xkasmvnc`). This is the standing default.
- **⚠️ `linuxserver/webtop` + `lsiodev/kasmvnc-base` are NOT KasmVNC anymore** — linuxserver
  migrated their web-desktop images to a **Selkies** backend (`/usr/share/selkies`,
  `selkies-desktop` procs). They LOOK like KasmVNC (and the page `<title>` even says "Selkies");
  verify the backend (`grep -i selkies` the container) before trusting any image's lineage —
  don't assume from the image name (`[[verify-against-source-of-truth]]`).
- **Selkies ONLY when absolutely necessary.** Reserve Selkies for a demonstrated need KasmVNC
  can't meet: true low-latency **WebRTC/WebCodecs/H.264** streaming, GPU-accelerated encode, or
  gaming-grade input latency. Justify it in writing (one line) — never reach for it by default.
- **Behind Cloudflare Access (Zero Trust) + Google SSO as the SOLE gate — single sign-in.** No
  app-level basic-auth layered on top (it breaks single sign-in; Access fails closed). A 2nd
  factor = a stricter CF Access policy (device posture / hardware key), never a desktop password.
  See ``web-desktop-auth-model`` (the single-sign-in fix + the WARP-verify gotcha).
- **Origin binds `127.0.0.1` only**, reachable exclusively through the Access-gated cloudflared
  tunnel. Never expose the webtop/VNC port on the LAN or a public interface.

## Why KasmVNC is the default (over Selkies)

- Simpler + battle-tested (linuxserver/webtop), smaller attack surface, no WebCodecs/secure-context
  quirks, clipboard + audio + file up/download built in, traverses a plain CF tunnel cleanly.
- Selkies adds WebRTC/WebCodecs complexity + a heavier image for latency most desktops don't need.
- Per `brian-preferences` priority order (simplicity > cost > speed > compatibility): KasmVNC wins
  unless the *speed* of a real-time stream is the actual requirement.

## How (reference pattern)

- **Image:** build FROM `kasmweb/core-ubuntu-noble:<ver>` (genuine KasmVNC + XFCE) and add the
  browser (install `google-chrome-stable`) — the `core` image has no browser. Serves HTTPS on
  **:6901** (self-signed). Persist `/home/kasm-user` for a durable desktop.
- **Single sign-in = disable KasmVNC's own auth, let CF Access be the sole gate.** Set
  `VNCOPTIONS=-disableBasicAuth` (the flag is read from `$VNCOPTIONS` by `vnc_startup.sh`; it is NOT
  a `kasmvnc.yaml` setting) → no KasmVNC login form, security `None` at the RFB layer, gated
  entirely by CF Access + the loopback-only origin. `VNC_PW` must still be set (the startup requires
  a `.kasmpasswd` to exist) but it is never prompted. Never layer an app password on top of Access.
- **Expose:** cloudflared tunnel ingress `desktop.example.com → https://127.0.0.1:6901`
  (`noTLSVerify`, `http2Origin`), plus a CF Access self-hosted app + Google IdP + owner-only policy.
- **Chrome launch flags (container):** `--no-sandbox` + `--lang=en-US` on the `.desktop` launcher.
- **Verify the PUBLIC Access gate OFF-WARP** (CF Browser-Rendering screenshot MCP) — a WARP-enrolled
  box silently passes Access, so a local curl shows the origin, not the login (`[[verify-against-source-of-truth]]`).

## Browser-locale gotcha (egress-IP geolocation)

- A desktop browser's **page content follows the container's EGRESS-IP geolocation**, not its
  `LANG`. When egress exits via Cloudflare WARP (or any VPN), sites like Google geolocate that IP
  and auto-serve that country's language — e.g. a fully-English desktop served **Russian** Google
  because the WARP egress geolocated to RU (ubuntu.megabyte.space, 2026-10-28).
- **Fix at the browser:** force English — a managed policy `ApplicationLocaleValue=en-US` +
  `Accept-Language: en-US,en` + default homepage `https://www.google.com/ncr?hl=en&gl=us`.
- **Fix at the egress (root):** exclude the Docker/desktop subnet from WARP (split-tunnel) so the
  container uses the host's native IP, or pin a WARP egress location. Bake the locale fix into the
  webtop image so it can't recur.

## Cross-links

``web-desktop-auth-model`` (CF Zero Trust single sign-in + WARP-verify) · `[[public-front-door]]` ·
`cf-access-iap` · `[[verify-against-source-of-truth]]` (verify the gate off-WARP) ·
`[[cloudflare-native-provisioning]]` (tunnel + Access API).
