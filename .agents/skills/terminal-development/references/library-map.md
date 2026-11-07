# Preferred Go terminal libraries

Use this reference to select the smallest coherent stack. Verify current major-version migration notes before adding or upgrading a dependency.

## Foundation

### Cobra

- Repository: https://github.com/spf13/cobra
- Prefer for command trees, subcommands, POSIX-style flags, help, argument validation, suggestions, and shell completion.
- Keep command constructors side-effect free. Inject services and `io.Writer` values; return errors to one execution boundary.
- Use `RunE`, `Args`, `SilenceUsage`, and `SilenceErrors` deliberately. Usage is for invalid invocation, not every runtime failure.
- Avoid package-level mutable command state in tests.

### Viper

- Repository: https://github.com/spf13/viper
- Prefer when configuration must combine flags, environment variables, files, defaults, or remote sources.
- Use `viper.New()` per application or test. Decode into a typed struct and validate at the boundary.
- Make precedence explicit: `Set` overrides, flags, environment variables, config files, key/value stores, then defaults. For normal application UX, reserve `Set` for deliberate programmatic overrides and present the user-facing contract as flags > environment > file > defaults.
- Viper keys are case-insensitive. Environment variables are case-sensitive, and environment values are read when accessed rather than cached.
- `BindPFlag` does not assign a value immediately; it connects lookup to the flag.
- Do not call `WatchConfig` unless live reload has a product requirement and synchronization is designed.

## Custom, state-driven TUI stack

### Bubble Tea

- Repository: https://github.com/charmbracelet/bubbletea
- Prefer for custom interactive programs using an Elm-style `Model`, `Init`, `Update`, and `View` loop.
- Represent events as messages. Run I/O in `tea.Cmd`; never perform blocking work in `Update` or `View`.
- Keep state transitions deterministic. Split large models into components with explicit message ownership.
- Use alternate-screen mode only for full-screen applications; avoid it for short prompts or output users need in scrollback.
- Check the current major-version API and migration guide before implementation.

### Lip Gloss

- Repository: https://github.com/charmbracelet/lipgloss
- Prefer for declarative terminal styles, borders, alignment, padding, colors, and layout.
- Centralize semantic styles in a theme. Adapt to terminal background and color capability.
- Compute layout from actual terminal width and rendered string width, not byte length.
- Keep content separate from presentation so plain and JSON renderers remain available.
- Check the current major-version API and migration guide before implementation.

## Widget-driven TUI stack

### tview

- Repository: https://github.com/rivo/tview
- Prefer for rich widgets including forms, tables, trees, lists, text views, grids, pages, and modals.
- Treat the application event loop as the owner of widget mutation. Queue updates from background goroutines through the framework's update mechanism.
- Build screens from small primitives and centralize focus transitions and keyboard bindings.
- Use tview's tcell dependency rather than adding a second terminal abstraction.

### tcell

- Repository: https://github.com/gdamore/tcell
- Prefer for low-level screen cells, terminal events, colors, Unicode, mouse input, and custom widgets, normally through tview.
- Call screen initialization/finalization as one guarded lifecycle. Ensure `Fini` runs on every exit path.
- Poll events in the owning loop and coordinate interruption/cancellation rather than mutating the screen concurrently.
- Account for wide and combining characters; do not assume one byte, rune, or glyph equals one terminal cell.

## Composition matrix

| Need | Default |
| --- | --- |
| Simple single-command utility | Standard library `flag` may be sufficient |
| Multi-command professional CLI | Cobra |
| Layered application configuration | Viper + typed validation |
| Custom responsive TUI | Bubble Tea + Lip Gloss |
| Forms/tables/trees/widget dashboard | tview + tcell |
| Custom terminal primitive | tcell, preferably behind tview |
| Automation or pipelines | Cobra/plain renderer + `--json`; no mandatory TUI |

Do not add both TUI stacks speculatively. Start with the stack that matches the dominant interaction model and introduce another only behind an isolated adapter with tests.
