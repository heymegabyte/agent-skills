# OrcaQ inspiration for embedded database editors

Primary references:

- Project: https://github.com/cin12211/orca-q
- Product: https://orca-q.com/

Use OrcaQ as a product and interaction reference whenever designing or implementing embedded database browsing, querying, schema inspection, or data-editing features. Study the current project before substantial design work because its capabilities may evolve. Draw inspiration from its workflows; do not copy code, branding, or layouts blindly, and do not add OrcaQ as a dependency unless the product actually needs it.

## Patterns worth evaluating

- Local-first operation and machine-side credentials.
- Named workspaces and connection profiles.
- Clear dev, staging, and production environment labels.
- Strict mode and explicit confirmation before mutations.
- Schema trees with fast DDL and metadata previews.
- High-performance data grids with pagination, sorting, filtering, inline editing, bulk actions, and foreign-key navigation.
- Raw SQL editing with syntax support, autocomplete, variables, multiple results, and EXPLAIN analysis.
- Interactive ERDs and relationship navigation.
- Schema comparison with migration previews and a non-destructive safe mode.
- Query/script organization, recent activity, command palette, and keyboard-first navigation.
- Backup, restore, import, export, and visible job progress.
- Portable application state without silently exporting credentials.
- AI assistance that proposes and explains SQL but never auto-executes mutations.

## Embedded-product adaptation

Embed only the smallest workflow users need. Start with read-only schema navigation and paginated browsing, then add editing when a real use case justifies the risk. Preserve the host product's navigation, permissions, design system, and data-access abstractions rather than recreating a full database IDE.

For every editing surface:

1. Display the active database, environment, schema, table, filters, and transaction state.
2. Default production and unknown environments to read-only.
3. Preview generated SQL or an equivalent change set before mutation.
4. Validate types, constraints, tenant scope, and permissions server-side.
5. Require stronger confirmation for bulk updates, deletes, DDL, or unbounded statements.
6. Prefer transactions and offer rollback where the engine supports them.
7. Record actor, time, target, before/after values, and correlation ID in an audit trail.
8. Redact credentials and sensitive columns from logs, exports, AI context, and telemetry.
9. Provide stable non-visual APIs for automation and testing.
10. Test empty, loading, error, huge-result, concurrent-edit, stale-row, and partial-failure states.

## Review question

Before shipping, ask: “Which OrcaQ-class affordances would make this workflow faster, clearer, or safer, and which would be unnecessary product bloat?” Document the choices for mutation safety, environment awareness, query inspection, recovery, accessibility, and auditability.
