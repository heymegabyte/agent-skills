---
last_reviewed: 2026-11-11
superseded_by: null
name: "idempotency-by-default"
priority: 2
pack: "infra"
triggers:
  - "migration"
  - "provisioning"
  - "setup script"
  - "deploy"
paths:
  - "*"
---

# Idempotency By Default — Every Step Is Safe to Run Twice

Every script, migration, provisioning step, deploy, and setup action is safe to run again — same
result, no duplicate, no crash, no half-state. "Run exactly once or it breaks" is a defect, because
real operations get retried: a flaky network, a resumed run, a re-fired cron, a second machine, a
recovery drill. Design for the second run from the first line.

Cross-links: `[[machine-recovery-repo]]` · `[[secret-provisioning]]` · `[[cloudflare-native-provisioning]]` · `[[fail-fast-build-fail-soft-prod]]` · `[[error-recovery]]` · `[[state-is-the-enemy]]`

## The rule

- **Check-before-create / upsert everywhere.** `CREATE TABLE IF NOT EXISTS`, `INSERT … ON CONFLICT`,
  "does the resource exist?" before provisioning, `mkdir -p`, memoized one-time setup per isolate.
- **Migrations are re-runnable.** Guard each by a check or a versioned ledger; re-applying is a no-op,
  never a duplicate column / double-seed / error.
- **Provisioning reconciles to desired state**, it doesn't blindly re-create. Running the installer /
  `setup.sh` / tunnel-provision twice converges to the same box — the recovery-repo contract.
- **External side-effects get an idempotency key.** Payments, emails, webhooks, order creation: a
  client-supplied key so a retry doesn't double-charge / double-send.
- **Partial-failure leaves a resumable state.** A step that dies midway can be re-run to completion,
  never a wedged half-state that needs manual surgery.

## Anti-patterns

- A setup/migration script that errors or duplicates on the second run ("just run it once").
- Blind `CREATE`/`INSERT` with no existence check or conflict clause.
- A provisioning step that re-creates instead of reconciling (new resource every run).
- A money/email/webhook side-effect with no idempotency key — a retry double-fires.
