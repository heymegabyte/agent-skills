#!/usr/bin/env sh
# PreCompact hook — remind the agent to persist ownership + progress + newly-discovered
# recommendations into OpenSpec BEFORE context is compacted.
#
# Emits AGENT CONTEXT on stdout (machine-facing, exempt from terminal-styling). Read-only,
# bounded, idempotent, recursion-safe, launches no model. Canonical: rules/openspec-change-ownership.md
printf '%s\n' "Before compaction: persist change OWNER + PROGRESS + any newly-discovered RECOMMENDATIONS into OpenSpec NOW — owner via bin/change-ownership.ts (owner.json), progress via the change's tasks.md checkboxes, recommendations as real proposal content under openspec/changes/<id>/. On-disk OpenSpec artifacts + owner.json survive compaction/resume; in-chat-only notes do not. Retain your owned change(s) through completion verification."
exit 0
