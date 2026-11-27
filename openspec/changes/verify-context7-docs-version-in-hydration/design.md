## Decisions

**Architect:** codex

**Architect Role:** assigned

Place the rule in canonical context hydration. Identify the installed version from the dependency or lockfile and verify returned version metadata or a matching upstream tag. If exact identity is absent or unverified, record the gap and use official versioned material. The installed ctx7 0.13.1 fixture verified both the exact TypeScript 5.9.3 response and a successful unverified fallback. [Context7 CLI version behavior](https://context7.com/docs/clients/cli)
