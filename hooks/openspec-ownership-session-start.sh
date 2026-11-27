#!/usr/bin/env sh
# SessionStart hook — surface the OpenSpec change-ownership invariant + active owned work.
#
# Emits AGENT CONTEXT on stdout (machine-facing, injected into the session — NOT human terminal
# UI, so plain text is correct and this is exempt from terminal-styling). Read-only, bounded,
# idempotent, recursion-safe, launches no model. Scoped: the active-change listing only runs when
# the cwd is an OpenSpec repo. Canonical: rules/openspec-change-ownership.md
printf '%s\n' "OpenSpec change-ownership invariant — plan & decompose early into coherent OpenSpec changes; each active change has exactly ONE owning agent instance that performs every subtask; parallelize ACROSS changes, not within one; capture high-value recommendations into OpenSpec the moment they surface. Claim/own a change via bin/change-ownership.ts. Detail: rules/openspec-change-ownership.md."
if [ -d "openspec/changes" ]; then
  printf '\nActive OpenSpec changes (this repo):\n'
  openspec list 2>/dev/null | grep -ivE 'mise|shorthands' | sed -n '2,40p' || true
  if command -v node >/dev/null 2>&1 && [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -f "$CLAUDE_PLUGIN_ROOT/bin/change-ownership.ts" ]; then
    owned=$(node "$CLAUDE_PLUGIN_ROOT/bin/change-ownership.ts" list 2>/dev/null | grep -ivE 'mise|shorthands')
    [ -n "$owned" ] && printf '\nClaimed changes (change-id / owner / state):\n%s\n' "$owned"
  fi
fi
exit 0
