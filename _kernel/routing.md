# Skill routing

Start with the [task and file routing index](../_router.md). The executable
[skill router](../bin/skill-router.py) combines project fingerprints, prompt
triggers, tool context, pack membership, and session history. It applies
priority and token limits and can use semantic ranking when the configured
embedding service is available. Offline routing uses repository metadata.

For a deterministic first pass, run this command from the skills checkout.
Set the working directory to the project being evaluated.

```bash
python3 bin/skill-router.py route 'Plan independent OpenSpec changes' \
  --cwd /absolute/path/to/project --pass initial --offline
```

Check the selected IDs, their reasons, any budget drops, and dependency errors.
Follow [authoring standards](standards.md) for shared definitions and update
the governing skill when a routed instruction is stale.

Claude's configured [prompt hook](../bin/prompt-hydration-hook.mjs) can attach
routing context at submission. The [entrypoint inventory](../config/prompt-hydration-entrypoints.json)
lists the explicit wrappers for other harnesses. During split synthesis, a
configured host can load matching installed guidance through the
[local slice router](../bin/local-slice-skill-router.ts).
