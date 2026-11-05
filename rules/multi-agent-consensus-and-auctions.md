# Multi-Agent Consensus, Task Auctions & Reputation Governance

## 1. Doctrinal Intent
Decentralized agent swarms require mathematically sound coordination mechanisms to allocate work, reach consensus on architectural changes, prevent deadlocks, and dynamically govern execution autonomy.

## 2. Core Protocols

### Byzantine Fault Tolerant Consensus
- Breaking changes, security policy updates, and major architectural shifts require a 2/3 Byzantine quorum evaluated via [`bin/consensus-engine.ts`](file:///Users/Apple/.agentskills/bin/consensus-engine.ts).
- Quorum involves voting across Architect, QA, and SRE agents.

### Decentralized Task Auctions
- Tasks are auctioned across available agents using [`bin/task-auction-arbiter.ts`](file:///Users/Apple/.agentskills/bin/task-auction-arbiter.ts).
- The winning bidder is chosen based on a composite metric weighting domain skill match (40%), current context capacity (30%), and historical pass rate (30%).

### Deadlock Detection & Mutual Code Review
- Inter-agent wait conditions are monitored using [`bin/deadlock-detector.ts`](file:///Users/Apple/.agentskills/bin/deadlock-detector.ts) to identify cyclic dependencies and preempt stalled tasks.
- All code pull requests must pass through the circular review ring via [`bin/code-review-ring.ts`](file:///Users/Apple/.agentskills/bin/code-review-ring.ts) with sign-offs from Inspector, Sentry, and Architect.
- Autonomous ROE privileges are governed dynamically by each agent's historical performance tracked in [`bin/reputation-ledger.ts`](file:///Users/Apple/.agentskills/bin/reputation-ledger.ts).
