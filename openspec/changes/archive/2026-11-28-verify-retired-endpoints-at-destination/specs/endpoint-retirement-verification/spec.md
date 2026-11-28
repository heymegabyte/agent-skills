## ADDED Requirements

### Requirement: Verify retired public endpoints at their actual destinations

The deployment skill SHALL require privacy-safe verification of the old public route on each controlled serving path before claiming retirement.

#### Scenario: Retired public submission still exists in cached clients

- **WHEN** a sensitive submission endpoint and its entry point are retired
- **THEN** the release operator verifies method, declared response status, absence of historical data and side effects, and cache policy on the production URLs and known aliases using synthetic inputs

### Requirement: Qualify delivery claims with receiver evidence

The deployment skill SHALL distinguish application acceptance, provider acceptance, and destination delivery in release evidence.

#### Scenario: Application responds successfully but destination evidence is unavailable

- **WHEN** an application returns a successful submission response and no receiver receipt is available
- **THEN** the release evidence records the strongest observed state and leaves destination delivery unverified
