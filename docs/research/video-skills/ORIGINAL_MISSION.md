# ORIGINAL_MISSION (immutable — never paraphrase or replace)

> "Use heavy research to discover and install the best video creation skills in my AI
> skills. Loop through every aspect that matters. Produce the best 25 ideas, rank them,
> and implement the top 27%, rounded up. Recursively reapply this exact original mission
> to the resulting implementation and prompt until no changes remain."

IMPLEMENTATION_COUNT = ceil(25 × 0.27) = **7**.

Convergence condition (all must hold for **two** consecutive complete reapplications):
A. Zero functional implementation changes · B. Zero executable-prompt changes ·
C. Zero new critical findings · D. All required quality gates pass.
Min 3 passes; max 20; on exhaustion → report **NON-CONVERGED** (never a false fixed point).

Canonical repo: `heymegabyte/agent-skills` (local: `~/.claude/plugins/heymegabyte-agent-skills` = `~/.agentskills`).
Extension point: `12-media-orchestration/` (currently image-only — video is the gap).
This file is the stored ORIGINAL_MISSION asset referenced by the convergence program.
