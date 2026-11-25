# OpenSpec delivery trace operations

The machine-readable `delivery-trace.json` is the delivery ledger. Proposal, design, specification, and task Markdown remain human-readable OpenSpec artifacts; checkboxes are planning state only. Never maintain a second manual trace table.

## Stable identifiers

- `REQ-*` identifies one observable behavior and survives task replanning.
- `SCN-*` identifies a WHEN/THEN scenario owned by a requirement.
- `TASK-*` identifies one owned execution unit with dependencies, paths, packages, acceptance criteria, and expected evidence.
- `TRACE:<requirement>:<task>` identifies the requirement-to-task record.
- `VERIFY:*`, `EVIDENCE:*`, `BLOCKER:*`, `CONSUMER:*`, and deployment identifiers bind observed evidence to the record.
- `MCP:*` identifies one selected MCP. `MCP-SELECTION-*` is selection-pending scope and MUST NOT be presented as a selected or executable MCP record.

Do not recycle identifiers for a different behavior. Renames preserve the identifier; splits create new identifiers and retain an explicit dependency or supersession edge.

## Artifact lifecycle

1. **Hydrate and compile:** compile hydrated scope into distinct `proposal.md`, `design.md`, `specs/<change>/spec.md`, `tasks.md`, and a proposed ledger. Proposed records intentionally contain `unverified` and `pending` edges.
2. **Implement and reconcile:** append observed code paths, verification receipts, tested/integrated commit, remote-main result, and applicable release, consumer, and production evidence. Reconciliation computes missing edges; it never trusts a checked box.
3. **Update:** edit the hydrated scope or canonical OpenSpec input, preserve stable IDs, then regenerate. Do not hand-edit derived trace tables.
4. **Sync:** after behavior is integrated, sync delta specifications to main specs and retain the ledger evidence bound to the exact commit.
5. **Archive:** archive only after every required edge is complete, or after an external blocker is recorded with owner, evidence, and exact next action. Archiving never upgrades `pending`, `unverified`, controlled, or local evidence into remote/live proof.

## Executable examples

Compile the fixture into a temporary output directory:

```bash
trace_tmp="$(mktemp -d)"
node --experimental-strip-types bin/openspec-delivery-trace.ts compile \
  --scope fixtures/delivery-trace/hydrated-scope.json \
  --schema schemas/delivery-trace.schema.json \
  --output "$trace_tmp"
```

Validate and query without copying rows into Markdown:

```bash
node --experimental-strip-types bin/openspec-delivery-trace.ts validate \
  --ledger fixtures/delivery-trace/complete.json \
  --schema schemas/delivery-trace.schema.json

node --experimental-strip-types bin/openspec-delivery-trace.ts query \
  --ledger fixtures/delivery-trace/complete.json \
  --requirement REQ-001
```

Reconcile a run by supplying a JSON array of task evidence; write the result to a new receipt rather than overwriting the input ledger:

```bash
node --experimental-strip-types bin/openspec-delivery-trace.ts reconcile \
  --ledger "$trace_tmp/delivery-trace.json" \
  --evidence fixtures/delivery-trace/task-evidence.json \
  --schema schemas/delivery-trace.schema.json \
  --output "$trace_tmp/reconciliation-receipt.json"
```

## Strict MCP inventory authoring

Catalog scope first records `selection-pending`; it is not an MCP inventory. After selection, author exactly one strict record per `MCP:*` ID with metadata, current provenance, transport, installation, authentication, update behavior, listing/connection/execution status, shared and unique requirements, tasks, verification, and explicit unknown-resolution entries.

`execution: verified` requires verified transport/install/auth/connection prerequisites and a passing `live` receipt. A controlled fixture proves mechanics only. Validate the fixture with:

```bash
node --experimental-strip-types bin/openspec-delivery-trace.ts validate-mcp \
  --inventory fixtures/mcp-catalog/inventory-positive.json \
  --schema schemas/mcp-inventory.schema.json
```

Focused documentation examples are exercised by `tests/delivery-trace-docs.test.ts`.
