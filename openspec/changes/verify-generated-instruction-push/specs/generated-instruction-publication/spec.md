## ADDED Requirements

### Requirement: Report authoritative instruction synchronization outcomes

Cross-platform synchronization SHALL distinguish unchanged generated files from a completed generated-file publication. It SHALL compare the checkout with the validated source revision and report a rejected fast-forward push as a job failure.

#### Scenario: A newer main precedes an earlier generated commit

- **GIVEN** a validated checkout with generated changes ready to commit
- **WHEN** another revision has already advanced the target branch
- **THEN** the older run fails its ordinary push and preserves the newer branch contents.

#### Scenario: Generation yields no differences

- **GIVEN** a validated checkout matching the generator output
- **WHEN** the publication step runs
- **THEN** it records that source revision as unchanged without contacting the push remote.
