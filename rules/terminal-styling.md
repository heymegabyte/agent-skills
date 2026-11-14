---
name: "terminal-styling"
priority: 2
pack: "infra"
triggers:
  - "gum"
  - "echo"
  - "terminal"
  - "cli"
  - "shell script"
  - "bash script"
  - "tui"
  - "styling"
  - "spinner"
  - "go cli"
  - "aid"
  - "install.doctor"
last_reviewed: 2026-10-27
superseded_by: null
---

# Native Go CLIs and Enhanced Terminal Styling

Build new CLIs in **native Go**, reusing mature dependencies and the appropriate Charm libraries. Every authored shell script + CLI surface uses enhanced terminal styling. For existing shell tooling, `source ~/.claude/hooks/style.sh` and call `emdash_*` (gum-backed, CI-safe fallback). The `enforce-terminal-styling.py` PostToolUse hook checks shell output.

## Native CLI standard

- Use **Cobra** for command structure and evaluate **Fang** for polished help, errors, completions, versions and manpages. Keep Fang behind the presentation layer; check its current stability and pin a compatible release.
- Build gorgeous, branded, keyboard-accessible human interfaces with **Bubble Tea, Bubbles and Lip Gloss**. Use **Huh** for attractive setup/auth/configuration forms and **Gum** for existing Bash prompts. Prefer maintained components to hand-written terminal controls.
- Use current compatible Charm major versions together. For v2 APIs, follow the upstream `charm.land/.../v2` migration guides; do not mix old tutorial imports with new types.
- Keep command execution separate from TUI rendering. Provide stable exit codes, `--json`, explicit noninteractive operation, context cancellation and timeouts. Machine results go to stdout; human progress/diagnostics go to stderr. Respect TTY detection, `NO_COLOR`, terminal width and accessible/plain output.
- Render runbooks and reports with **Glamour** inside Go and **Glow** as a standalone viewer. Retain a plain Markdown fallback.
- Reuse the official Cloudflare Go SDK, existing vendor CLIs, **Task**, **GoReleaser**, and **restic/rclone** where their features fit. Add Koanf or a database driver only for a concrete configuration/state need; do not import the entire ecosystem into every binary.
- Validate actual command behavior: non-TTY pipelines, JSON/exit codes, cancellation, credential handling and supported OS builds. Use targeted Go tests/testscript and compatible TUI tests; VHS demos are supporting evidence, not proof of business correctness.
- Go is the native CLI choice, not a requirement to compile the CLI or Charm stack to WASM. Rust/WASM selection follows `05-architecture-and-stack/SKILL.md`.

## The mandate (strict)

- **NEVER raw `echo`/`printf` for human output.** `source ~/.claude/hooks/style.sh` → use `emdash_*`. The wrappers are **gum when present, plain fallback when absent** (CI-safe — never break a pipeline that lacks gum).
- Applies to ALL authored scripts: `bin/*.sh`, `scripts/*.sh`, deploy/CI helpers, generated-project tooling, `package.json` script one-liners, and interactive prompts.
- Exempt: `style.sh` itself (it IS the fallback impl); machine-readable output (JSON to stdout, `--json` modes) — that stays plain + goes to stdout, styling to stderr.
- The `enforce-terminal-styling.py` hook fires on every `*.sh` Write/Edit and flags raw `echo` — treat its system-reminder as a must-fix.

## `emdash_*` API (`~/.claude/hooks/style.sh`)

- `emdash_header <text>` — cyan bordered section banner.
- `emdash_log <msg> [info|warn|error|debug]` — structured log line.
- `emdash_success|warn|info <msg>` · `emdash_error <msg>` (→ stderr) — status lines with glyphs.
- `emdash_confirm <prompt>` — y/N UI helper. Never treat a noninteractive fallback as authorization; require an explicitly authorized action/flag before a consequential mutation.
- `emdash_input <placeholder>` · `emdash_choose <opt...>` — prompt / pick, prints the value.
- `emdash_spin <title> -- <cmd...>` — run a command behind a spinner.
- `emdash_md <file>` — render markdown (glow → gum format → cat).

## Charm ecosystem (use each for its purpose)

| Component | Use when needed |
|---|---|
| Bubble Tea / Bubbles / Lip Gloss | Stateful TUI, reusable widgets, shared theme/layout |
| Huh / Gum | Go forms and shell prompts, with accessible/noninteractive alternatives |
| Glamour / Glow | Embedded Markdown rendering and standalone runbooks |
| Log | Human diagnostics; use its `slog` integration and structured output when appropriate |
| Fang | Presentation wrapper around Cobra; verify current stability |
| Harmonica | Small purposeful animations; do not delay work for visual effects |
| VHS / Freeze | Reproducible terminal demos and code/output images |
| Wish / Wishlist | SSH application or host directory only when that surface is required |
| Soft Serve / Pop | Optional Git service or SMTP client; reuse existing GitHub/Stalwart services |
| Crush | Optional existing AI terminal client; preserve approved OpenCode/orchestrator choices |
| Skate | Optional local shell state; not a secrets service or synchronized configuration authority |

**Retired defaults:** Mods was archived on 2026-03-09 in favor of Crush (`crush run`). Charm Cloud sunset on 2024-11-29; current Skate/Glow do not provide its former synchronization. Never reintroduce those retired services from old examples.

## AID product client

- Extend the existing **`aid` entrypoint**; do not introduce a separate `mb` portfolio CLI. Preserve its **OpenCode** integration and use the approved **aidl.ink-compatible endpoint/model**, predominantly DeepSeek. Do not replace it with Crush or silently change existing fleet provider routes.
- Keep `aid --help`, version, and known command parsing deterministic and available offline. Route unknown positional natural language (for example, `aid tell me whats the hostname`) through the configured AI and typed local tools; malformed flags remain normal CLI errors. Never treat generated shell text as an automatically authorized action.
- Compile the production base URL, stable public model alias and public OAuth client ID into the release. Select the backing provider/model on the service side; users should not configure provider keys. Pin and verify the OpenCode authentication adapter, including access-token renewal during long sessions.
- Make login browser/device OAuth in the style of `gh auth login`, with user-scoped application sessions. Keep provider secrets on the backend; never ship a shared provider/API key in a binary, generated config or public install script. Keep official Claude/Codex subscription credentials with their own CLIs.
- Install the configured **per-user daemon** during setup, with visible status and pause/uninstall controls. Use native OS capture permissions and a user-session process where required; installing the service does not itself grant capture or tool permissions. Keep refresh credentials in the supported OS credential broker and use protected local IPC.
- Treat **install.doctor's configuration repository** as the desired-configuration source; `aid` applies the selected version and reports the observed state. Resolve the real repository/endpoint from project configuration before changing it.
- **aidl.ink owns monitoring and user-visible settings.** Version watched roots/exclusions, clipboard intake, screenshot cadence/triggers, supported app/display scope, raw-image/text/meaning retention, processing/upload mode and resource budgets. Show desired versus applied configuration, the public model alias, authentication, capture state and errors; provider selection is operator-controlled. Reuse that product's existing reporting path rather than inventing a separate telemetry CLI.
- After the owner enables clipboard prompt capture, ingest prompts automatically without requiring `aid:` markers or confirmation for every capture. Provide visible capture state and pause/disable controls. Optional screenshots are separately configurable and require native OS permissions; do not bypass them or enable capture merely by installing the CLI.
- Build the local MCP bridge with the **official Go MCP SDK**: `aid mcp serve` uses stdio and forwards granted tools/resources over protected daemon IPC. Keep diagnostics off protocol stdout. Remote access uses an authenticated service and the device's outbound connection; enforce device/path/action grants in handlers and keep observed clipboard/screenshot content separate from executable authority.
- Preserve the internal subscription/direct-DeepSeek policy outside this explicitly approved product-client path; see `[[agent-provider-policy]]`.

## Other CLIs — integrate whenever available (prefer over plain coreutils)

- **fzf** — fuzzy pick (files, branches, choices) instead of hand-rolled menus.
- **bat** — `cat` with syntax highlight + line numbers. **eza** — `ls` with icons/git/tree.
- **delta** — beautiful `git diff`/`grep` pager. **rg** (ripgrep) over `grep`; **fd** over `find`.
- **jq** / **fx** — JSON query/interactive-explore. **yq** — YAML. **sd** — simpler `sed`.
- **dust** — `du` tree · **procs** — `ps` · **zoxide** — smart `cd` · **hyperfine** — benchmark · **dog** — `dig` · **btop** — top.
- Rule of thumb: if a modern CLI renders the same data more legibly, reach for it — but always **detect + fall back** (`command -v X`), never hard-require an optional tool in a script that must run in CI.

## Fallback discipline (CI-safe by construction)

- `style.sh` detects `gum`/`glow` once and degrades gracefully — so sourcing it + using `emdash_*` is safe in CI, cron, and minimal containers.
- For a direct CLI call in a script, guard it: `if command -v bat >/dev/null; then bat file; else cat file; fi` — or route through an `emdash_*` helper.
- Noninteractive → skip optional prompts and animations; require flags/config for missing required input and fail clearly. Honor explicit authorization such as an applicable `--yes`; lack of a TTY does not grant permission. Never hang a headless run on a TUI.

## Generated products, too

- CLIs/scripts shipped in generated projects (deploy scripts, `bin/`, dev-server banners) get the same treatment — gum-styled, branded (black `#060610` / cyan `#00E5FF`), with fallback. A plain-`echo` deploy script is off-brand + a defect.

## Anti-patterns

- Raw `echo "…"` for status/headers/prompts (use `emdash_*`).
- Hard-requiring gum/bat/fzf in a CI script with no fallback (breaks the pipeline).
- Styling machine-readable stdout (breaks parsers — keep JSON plain on stdout, style on stderr).
- Hand-rolled `select`/`read` menus when `gum choose`/`fzf` exist.

## Cross-links

- `[[code-style]]` — Bash conventions (this rule owns the terminal-output standard).
- `[[verification-loop]]` — scripts print progress/results via `emdash_*`.
- `[[package-preference-registry]]` — dependency selection; `[[agent-provider-policy]]` — internal providers and the AID product-client boundary.
- Enforcement: `~/.claude/hooks/enforce-terminal-styling.py` (PostToolUse) + `~/.claude/hooks/style.sh` (the library).

## Upstream references

[Charm v2](https://charm.land/blog/v2/) · [Fang migration](https://github.com/charmbracelet/fang/blob/main/UPGRADE_GUIDE_V2.md) · [Mods retirement](https://github.com/charmbracelet/mods) · [Charm Cloud retirement](https://github.com/charmbracelet/charm) · [Cobra](https://github.com/spf13/cobra). Recheck versions and maintenance before adoption.
