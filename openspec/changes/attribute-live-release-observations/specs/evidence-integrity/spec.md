## ADDED Requirements

### Requirement: Attributed live deployment observations

The release reference SHALL distinguish active provider identity, live behavior, test harness failures, and provider-injected diagnostics.

#### Scenario: A production browser rejects a test script

- **WHEN** production CSP blocks browser test instrumentation
- **THEN** the operator preserves the policy and separately verifies application accessibility with isolated browser instrumentation.
