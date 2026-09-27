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
last_reviewed: 2026-09-26
superseded_by: null
---

# Enhanced Terminal Styling (STRICT — gum over echo, CLIs everywhere)

Every authored shell script + CLI surface uses **enhanced terminal styling**. Raw `echo`/`printf` for human-facing output is a **defect**: `source ~/.claude/hooks/style.sh` and call `emdash_*` (gum-backed, CI-safe fallback). Integrate the charm ecosystem + modern CLIs wherever they add clarity. Enforced deterministically by the `enforce-terminal-styling.py` PostToolUse hook (hooks > rules).

## The mandate (strict)

- **NEVER raw `echo`/`printf` for human output.** `source ~/.claude/hooks/style.sh` → use `emdash_*`. The wrappers are **gum when present, plain fallback when absent** (CI-safe — never break a pipeline that lacks gum).
- Applies to ALL authored scripts: `bin/*.sh`, `scripts/*.sh`, deploy/CI helpers, generated-project tooling, `package.json` script one-liners, and interactive prompts.
- Exempt: `style.sh` itself (it IS the fallback impl); machine-readable output (JSON to stdout, `--json` modes) — that stays plain + goes to stdout, styling to stderr.
- The `enforce-terminal-styling.py` hook fires on every `*.sh` Write/Edit and flags raw `echo` — treat its system-reminder as a must-fix.

## `emdash_*` API (`~/.claude/hooks/style.sh`)

- `emdash_header <text>` — cyan bordered section banner.
- `emdash_log <msg> [info|warn|error|debug]` — structured log line.
- `emdash_success|warn|info <msg>` · `emdash_error <msg>` (→ stderr) — status lines with glyphs.
- `emdash_confirm <prompt>` — y/N gate (auto-yes when non-interactive, so CI never hangs).
- `emdash_input <placeholder>` · `emdash_choose <opt...>` — prompt / pick, prints the value.
- `emdash_spin <title> -- <cmd...>` — run a command behind a spinner.
- `emdash_md <file>` — render markdown (glow → gum format → cat).

## Charm ecosystem (use each for its purpose)

- **gum** — the workhorse: `style` (color/border/pad), `log`, `spin`, `confirm`, `choose`, `filter`, `input`, `write`, `format`, `table`, `pager`, `join`.
- **glow** — render markdown files/READMEs in the terminal (`emdash_md`).
- **freeze** — code/terminal → PNG (docs, changelog art, PR screenshots).
- **vhs** — script + record terminal demos → GIF/MP4 (README/marketing demos).
- **mods** — pipe text through an LLM in the shell (`… | mods 'summarize'`).
- **skate** — a personal KV store for scripts (config/state without a DB).
- **huh** — rich multi-field forms (when `gum input`/`choose` isn't enough).

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
- Non-interactive (`[ -t 0 ]` false) → skip prompts / auto-confirm; never block a headless run on a TUI.

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
- Enforcement: `~/.claude/hooks/enforce-terminal-styling.py` (PostToolUse) + `~/.claude/hooks/style.sh` (the library).
