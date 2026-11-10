---
last_reviewed: 2026-11-09
superseded_by: null
name: "automated-alert-hygiene-and-hysteresis"
priority: 2
pack: "core"
triggers:
  - "netdata"
  - "alarm"
  - "alert"
  - "pager"
  - "hysteresis"
  - "false positive"
  - "alert flood"
  - "monitoring threshold"
  - "promql"
  - "grafana alert"
  - "pulse"
  - "status page"
  - "smartd"
  - "smartctl"
  - "apfs"
  - "macos memory"
  - "unified memory"
  - "postfix"
  - "smbios"
  - "proxmox"
  - "qemu balloon"
paths:
  - "**/netdata/**"
  - "**/health.d/**"
  - "**/netdata.conf"
  - "**/smartd.conf"
  - "**/postfix/**"
  - "**/main.cf"
  - "**/alerts/**"
  - "**/*alert*.yml"
  - "**/*alert*.yaml"
  - "**/*.promql"
  - "**/*rules*.yml"
  - "scripts/**"
---

# Automated Alert Hygiene & Hysteresis

A paging alert that fires on a healthy steady state is a monitoring defect, not telemetry. These six rules are mandatory fleet-wide: each was a confirmed false-positive class found during 30-day incident remediation, and each one masked real incidents in the noise it generated.

## 1. macOS memory alarms MUST use active + wired + compressor

- MUST compute pressure as `($active + $wired + $compressor) / <total physical memory> × 100` (from `vm_stat` page counts × page size, or `hw.memsize`).
- MUST exclude `inactive`, `purgeable`, and `speculative` file cache — macOS keeps them as cheap, instantly reclaimable cache; counting them makes a healthy idle Mac read ~90% "used" and pages continuously.
- MUST NOT alarm on raw `used`, `user + system`, `$system.ram.used`, or `system.ram` used-including-cached dimensions.
- Keep warn/crit on the active+wired+compressor ratio only (macOS legitimately holds high cache); memory-pressure signals (`memory_pressure`) MAY supplement but never replace the ratio.

## 2. macOS disk alarms MUST measure /System/Volumes/Data and filter by mount label

- MUST measure `/System/Volumes/Data` — the sealed read-only `/` volume reports the system snapshot, not user storage, and its utilization is meaningless as a capacity signal.
- MUST exclude secondary APFS and Nix volumes: `/Volumes/*` (Nix store, external, VM images), `/System/Volumes/*` siblings (Preboot, VM, Update, xarts, iSCPreboot, Hardware), and `/private/tmp/*` (synthetic firmlinks/APFS mounts). A single unmounted-image volume at 100% otherwise pins the alarm red forever.
- Netdata v2 MUST scope via chart labels: `chart labels: mount_point=/System/Volumes/Data` (exact match on the label). MUST NOT use deprecated `families:` filters — they no longer scope v2 charts and silently widen the alarm back to every mounted volume.
- PromQL MUST select the Data mountpoint precisely and, when an aggregate is unavoidable, exclude via `mountpoint!~"/Volumes/.*|/System/Volumes/(Preboot|VM|Update|iSCPreboot|xarts|Hardware|Recovery).*|/private/tmp/.*"`. RE2 has no lookahead — enumerate exclusions, never `(?!Data)`.
- The same mount filter governs Netdata, Pulse, Grafana/node_exporter, and `@theme.tools/status` checks; one unfiltered query re-introduces the flood.

## 3. Virtualized QEMU/Proxmox guests MUST silence SMBIOS DIMM false-positives

- Hero/guest VMs expose SMBIOS Type 17 memory devices; ballooning and RAM resize make a DIMM appear removed or resized with no hardware change, firing `smbios_memory_confirmed_loss` forever.
- MUST silence `smbios_memory_confirmed_loss` on virtualized guests (detect `systemd-detect-virt` = `kvm`/`qemu`, or DMI product/sysvendor identifying QEMU/KVM), scoped per host — never disable SMBIOS collection fleet-wide.
- MUST keep real memory health alarming instead: available-memory pressure and ECC corrected/uncorrected errors where the platform actually exposes them. A silenced false positive MUST be paired with a working true positive.
- Keep the check live on bare metal; the silence is a virtualization-shaped exception, not a permanent mute.

## 4. Helium HDDs with sticky Attribute 190 MUST pass `-I 190 -W 4,55,60`

- Seagate Exos X16 (and similar helium enterprise drives) retain a historical airflow-temperature failure flag — `Attribute 190 Airflow_Temperature_Cel`, `WHEN_FAILED=In_the_past` — after a past transient over-temp. smartd then reports a failure on every poll although current normalized values are healthy.
- Every `/etc/smartd.conf` stanza covering such a drive MUST pass `-I 190 -W 4,55,60`: ignore attribute 190 for FAILED reporting, and monitor temperature with DIFF=4°C, INFO=55°C, CRIT=60°C.
- MUST keep `-a -o on -S on` self-tests and remain alerting on reallocated/pending sectors (5, 197, 198) and other attributes; `-I 190` suppresses only the sticky temperature failure flag, not temperature tracking.
- Reference stanza: `/dev/sdX -a -o on -S on -s (S/../.././02|L/../../6/03) -I 190 -W 4,55,60 -m root`.
- An alert on `WHEN_FAILED=In_the_past` alone MUST NOT page; current-value failure and self-test failure MUST.

## 5. IPv4-only hosts MUST force Postfix IPv4 and relay authenticated

- A host with an IPv4-only uplink but a ULA (`fd00::/8`) bridge interface makes Postfix prefer IPv6, fail to reach remote MX, and back the queue up into alert storms.
- MUST set `inet_protocols = ipv4` in `main.cf` on every IPv4-only host, even when a ULA bridge exists; set `myhostname` to the FQDN.
- MUST route local `root`/admin aliases through an authenticated SES SMTP relay over TLS (`smtp_sasl_auth_enable = yes`, `smtp_tls_security_level = encrypt`, port 587/465, credentials from get-secret) — never outbound unauthenticated port 25, which providers and clouds block or spam-classify so system mail fails closed and silently.
- Alias `root`/admin to a real monitored mailbox; a null or unmonitored alias makes every local alert undeliverable and invisible.

## 6. Every threshold alert MUST pair hysteresis with a hold window

- Every threshold alert across Netdata, Pulse, Grafana, and `@theme.tools/status` MUST define both an explicit trigger AND an explicit clear condition, each with a minimum hold/duration window — no bare instantaneous threshold may page.
- Netdata: v2 alarms use `metricTimeThresholds`; legacy health uses `delay: up … down …` plus `lookup … at -Nm` sustained windows. Grafana: `for:` ≥ 5m on every rule. Pulse and status checks: explicit pending → firing → resolved state durations.
- MUST require N consecutive samples (or ≥5m hold) above threshold to fire, and clear at a lower threshold (or after a stable window) — one-sided alerts flap.
- MUST absorb short transients by design: a ≤60s build/swarm CPU/memory spike and a container recreate (2–3m of down) MUST NOT page. Typical: service-down hold 2–3m, CPU >90% for 5m / clear <75% for 5m, disk >90% hold 15m.
- Alerts MUST dedupe and suppress flapping, carry a resolvable clear, and be verified with a deliberate load test plus one container-recreate test before enabling paging.

## Definition of done

- [MUST] Grep every alert config (`health.d/`, `*.promql`, Grafana rules, Pulse, status checks) for a hold/duration field before shipping a new alarm.
- [MUST] Reload or redeploy the monitoring config and confirm in the UI that the alarm state is CLEAR at steady state.
- [MUST] Reproduce one spike and one container recreate and confirm neither pages.

Cross-links: [[production-observability-default-on]] · [[observability-ops-supervisor]] · [[principle-stability-monitoring]] · [[machine-recovery-repo]] · [[verification-loop]].
