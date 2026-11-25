# Documentation and learning delivery contract

Behavioral work includes two concurrent responsibilities: keep affected guidance executable and route durable learning to its canonical destination. The task compiler surfaces both responsibilities and the durable worker brief carries their applicability, targets, and acceptance criteria through resume and reassignment.

Completion requires digest-bound documentation and learning receipts. Each receipt identifies updated targets, evidence, exact source revision, obsolete guidance removed, and either an update or a justified verified-no-change result. A blocked responsibility keeps the behavioral task open.

The runtime source of truth is `bin/documentation-learning-responsibilities.ts`; scoped storage and correction behavior live in `bin/scoped-learning-router.ts`. Documentation should link to those contracts instead of copying their algorithms.

## Executable example

```sh
node --experimental-strip-types --test tests/documentation-learning-responsibilities.test.ts
```

The example proves that worker briefs include both responsibilities, receipt-less completion fails, obsolete guidance removal is attributable, and verified-no-change is explicit.
