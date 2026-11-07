---
last_reviewed: 2026-10-28
superseded_by: null
name: "go-application-policy"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Go Application Architecture and Dependency Policy

Apply this policy to every new or modified Go application.

## Language boundaries

- Build terminal utilities and CLIs in Go. Use the `terminal-development` skill for CLI and TUI architecture.
- Build desktop applications in Go with Wails v2 (`github.com/wailsapp/wails/v2`). Do not use Electron unless the user explicitly approves a demonstrated Chromium/Node-native requirement.
- Build initial backend services in TypeScript with Hono or an equivalent approved framework for iteration speed.
- Consider WASM only after the product stabilizes and profiling identifies a material bottleneck. Require benchmarks, runtime compatibility, an incremental boundary, rollback, and a measured improvement; never perform a speculative rewrite merely to use WASM.

## TUI selection

- Prefer tview over tcell for structured widgets, grids, flex layouts, forms, modals, trees, and tables.
- Use tcell directly only for low-level screen, input, or custom-canvas behavior tview cannot cleanly provide.
- Use Bubble Tea + Lip Gloss instead when an Elm-style declarative state machine is the better interaction model.
- Choose one primary TUI runtime. Do not mix Bubble Tea and tview event loops without an isolated, documented requirement.

## Approved third-party Go modules

Go standard-library imports are always allowed. New direct third-party imports are restricted to:

- `github.com/charmbracelet/bubbletea`
- `github.com/charmbracelet/lipgloss`
- `github.com/rivo/tview`
- `github.com/gdamore/tcell` and its versioned module path when required
- `github.com/spf13/cobra`
- `github.com/spf13/viper`
- `github.com/wailsapp/wails/v2`
- `github.com/go-resty/resty/v2`
- `gorm.io/gorm`
- `github.com/go-playground/validator/v10`
- `github.com/casbin/casbin/v2`
- `go.uber.org/zap`
- `github.com/stretchr/testify`

GoReleaser (`github.com/goreleaser/goreleaser`) is an approved release tool, not an application import. Pin it in CI/tooling rather than importing it into product code.

Approved modules' unavoidable transitive dependencies may appear in `go.sum`; do not import those modules directly unless they are added to this allowlist or receive explicit HITL approval. Database drivers and Wails plugins are not implicitly approved merely because GORM or Wails is approved.

## Dependency gate

Before adding or generating a third-party import:

1. Inspect the proposed direct imports and `go.mod` change.
2. Use the standard library or an approved module when it meets the requirement.
3. If an unapproved module is necessary, stop before modifying skills, source, `go.mod`, or `go.sum` to add it.
4. Present the missing capability, proposed module and version, license, maintenance/security evidence, alternatives considered, transitive/build impact, and containment or removal plan.
5. Ask for explicit Human-in-the-Loop approval naming the module.
6. After approval, record the decision and whether approval is one-project, one-use, or a permanent allowlist amendment.

Do not interpret convenience, popularity, an indirect dependency, generated code, or a framework template as approval.

## Default responsibilities

- Cobra: commands, subcommands, flags, help, and completion.
- Viper: layered configuration, instantiated and injected rather than global.
- Bubble Tea + Lip Gloss: declarative custom TUIs and semantic styling.
- tview + tcell: widget-heavy TUIs and low-level terminal primitives.
- Wails v2: Go-backed desktop shell and bindings.
- Resty v2: HTTP/REST clients when `net/http` would create needless repetitive code.
- GORM: persistence when an ORM is justified; its database driver still needs separate approval if not allowlisted.
- validator v10: struct and field validation at Go boundaries.
- Casbin v2: policy-based RBAC, ABAC, or ACL when authorization complexity warrants an engine.
- Zap: structured application logging; never corrupt terminal rendering or expose secrets.
- Testify: assertions, suites, and mocks when standard testing alone is insufficient.
- GoReleaser: reproducible cross-platform artifacts, archives, checksums, and release automation.

Pin versions, run `go mod tidy`, review `go mod graph`, scan dependencies, and verify licenses before release.
