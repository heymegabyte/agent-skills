---
name: theme-tools-streamlined-migration
description: Upgrade and converge any repository into a streamlined @theme.tools v2 thin-shell consumer across all 28 canonical @theme.tools/* packages, screen/section/component bindings, VoiceKit ($17,000 credits), 13-dimension Cloudflare Free-Tier edge hardening, and Sovereign 8-Pillar Telemetry.
metadata:
  version: "2.0.0"
---
# Streamlined `@theme.tools` v2 Thin-Shell Consumer Migration Skill

## 1. Thin-Shell Architecture Mandate (`heymegabyte/theme.tools`)

Every repository in the 55-repository fleet operates as a **streamlined thin-shell consumer** of **`@theme.tools/*` (`heymegabyte/theme.tools`)**:
- **Upstream Reusable Code First**: Any reusable UI widget, calculator, workflow, validator, hook, SEO/GEO generator, audio/video builder, or telemetry adapter MUST live in one of the **28 Canonical `@theme.tools/*` Libraries**.
- **Consumer Repositories Are Thin Shells**: Consumer repositories own only routing, domain configuration (`theme.tools.json` `schemaVersion: 2`), thin runtime bindings (`src/theme-tools-thin-shell.ts`), and project-specific OpenSpec proposals (`openspec/project.md` and `openspec/changes/streamline-theme-tools-28-library-adoption/proposal.md`).

## 2. The 5 Repository Archetypes (`@theme.tools/sdk/streamlined-thin-shell-composer`)

1. **`saas-shortener-link-engine`** (`aidl.ink`, `deskl.ink`, `fundl.ink`, `gitl.ink`, `inboxl.ink`, `skillsl.ink`, `soupl.ink`):
   - Core Tier 1 + Tier 3 + `@theme.tools/links`, `@theme.tools/keys`, `@theme.tools/billing`, `@theme.tools/workflows`, `@theme.tools/integrations`, `@theme.tools/notifications`, `@theme.tools/status`, `@theme.tools/kb`.
2. **`control-plane-and-observability`** (`swarml.ink`, `coolify.megabyte.space`, `grafana.megabyte.space`, `health.megabyte.space`, `legion.megabyte.space`, `megabyte.space`, `omen.megabyte.space`, `proxmox.megabyte.space`, `pulse.megabyte.space`, `status.megabyte.space`, `ubuntu.megabyte.space`, `zen.megabyte.space`):
   - Core Tier 1 + Tier 3 + `@theme.tools/status`, `@theme.tools/workflows`, `@theme.tools/integrations`, `@theme.tools/keys`, `@theme.tools/notifications`, `@theme.tools/kb`, `@theme.tools/dataplane`, `@theme.tools/billing`.
3. **`media-cinema-and-directory`** (`bz.rocks`, `indie-music-toolkit`, `musicblobs.com`, `thebestsites.com`, `videoblobs.com`, `pdf.kitchen`, `open-seo`):
   - Core Tier 1 + Tier 3 (`@theme.tools/media-video` with **VoiceKit `$17,000` Credits Grant**) + `@theme.tools/social`, `@theme.tools/signing`, `@theme.tools/forms`, `@theme.tools/links`, `@theme.tools/kb`, `@theme.tools/status`, `@theme.tools/billing`.
4. **`commercial-field-service-and-client-sites`** (`apply.help`, `bricklabor.com`, `claimyour.site`, `crawl.cheap`, `ghost.claims`, `inbox.vision`, `lonemountainglobal.com`, `michael.megabyte.space`, `mission.megabyte.space`, `njsk.org`, `oneprompt.site`, `projectsites.dev`, `template.projectsites.dev`, `tomy.house`):
   - Binds all **28/28 Canonical `@theme.tools/*` Libraries** (including `@theme.tools/workflows` `voice-ai-intake` with VoiceKit `$17,000` credits, `@theme.tools/scheduling`, `@theme.tools/crm`, `@theme.tools/forms`, `@theme.tools/billing`, `@theme.tools/signing`, `@theme.tools/inbox`).
5. **`workstation-and-developer-platform`** (`agent-skills`, `browse.computer`, `browse.tools`, `cloudflare-os`, `coolify-host-config`, `desktop.management`, `desktop.tools`, `homebrew-tap`, `install.doctor`, `runner-ops`, `semantic-release-python`, `theme.tools`):
   - Core Tier 1 + Tier 3 + `@theme.tools/keys`, `@theme.tools/integrations`, `@theme.tools/workflows`, `@theme.tools/kb`, `@theme.tools/status`, `@theme.tools/dataplane`.

## 3. Automated Fleet-Wide Execution

Run the parallel 55-repository converger via `install.doctor` or `agent-skills`:
```bash
theme-tools-thin-shell-converge
# or directly:
node --experimental-strip-types ~/.agentskills/bin/fleet-55-repo-multi-axis-converger.ts
```

## Multi-Swarm Parallelization & OpenCode (DeepSeek) Offload Mandate

- **Whole-change dispatch**. Apply `rules/openspec-change-ownership.md` and `rules/agent-provider-policy.md`. Assign each OpenSpec change one owner through verification. Route suitable bounded changes to OpenCode with DeepSeek through LiteLLM.
- **Architecture and verification**: Route material decisions through `rules/evidence-gated-autonomous-orchestration.md`. Its conference and risk gates govern provider selection and independence.
- **Reuse review**: Review reuse during implementation under `control-plane/RUNTIME.md`. Capture cited proposals for application code in `theme.tools`, host configuration in `install.doctor`, and agent guidance in `agent-skills`. Submit authorized findings to same-run OpenSpec admission.
- **DeepSeek-first parallel dispatch** At intake and after each dependency clears, dispatch independent work concurrently whenever doing so reduces time to verified delivery. Delegate every suitable task to OpenCode with DeepSeek through LiteLLM when it meets the acceptance bar and improves throughput. Use Codex, Gemini, or Claude for work that benefits materially from premium capability or independent review, and record concrete reasons for premium routing or limited dispatch. Scale worker count to ready work, isolation, and approved capacity.
- **Concurrent End-of-Prompt Delivery Closure**: Run documentation/comment reconciliation and bounded `theme.tools`, `install.doctor`, and `agent-skills` extraction reviews concurrently with proportional tests and release preparation. After reconciling those changes and generated outputs, revalidate the exact final tree. Commit only that tested tree, push it normally to `main`, promote it through the approved production rail, and run production smoke plus critical E2E verification. Fail closed without mutating production when authority, credentials, spending permission, review, recovery, validation, or provenance gates are missing; record the exact blocker instead.
