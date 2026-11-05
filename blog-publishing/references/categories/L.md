# L — AGENT SKILLS, REUSE, EVALUATION, AND IMPLEMENTATION GOVERNANCE

Load this category only when the article task, affected runtime boundary, or release risk selects it. The directives below are exact authorized requirements. Record applicability and live evidence in the adopting repository; policy presence is not runtime verification.

- **L01.** Add a concise triggerable editorial orchestrator skill that applies to writing, researching, updating, designing, or publishing blog content across the ecosystem.
- **L02.** Keep the orchestrator short and reference focused guides for DataForSEO, evidence, writing, visuals, Plate authoring, and publishing; avoid loading 360 requirements into every unrelated task.
- **L03.** Make the 15-idea research step and existing-content check mandatory before any new SEO article, with explicit allowances for a user-selected topic and direct revision requests.
- **L04.** Teach agents to obtain a real DataForSEO brief before claiming keyword research; require provenance, locale, collection date, selected query, supporting terms, and measured-cost output.
- **L05.** Teach density as descriptive measurement and repetition detection, with no universal percentage target or claim that term frequency alone improves rank.
- **L06.** Require a claim ledger and structured citation nodes as article inputs; failed evidence checks must be repaired or the affected assertion removed before release.
- **L07.** Require agent-generated artwork to follow the current site tokens and visual brief; forbid invented charts, fake screenshots, or generated imagery presented as factual observation.
- **L08.** Require shared component lookup through the installed registry and Storybook documentation before creating new article widgets or local CSS systems.
- **L09.** Require new reusable UI, Plate nodes, visual recipes, and blog rendering utilities to live in theme.tools and be demonstrated in ui.theme.tools.
- **L10.** Configure @storybook/addon-mcp where supported and useful, including current component documentation/manifests; verify its actual preview-version capabilities instead of assuming all APIs are stable. [S15]
- **L11.** Configure @storybook/addon-vitest and accessibility checks for supported frameworks, reusing existing tests and stories; use the documented compatible fallback where needed. [S16]
- **L12.** Add canonical examples of a researched article, evidence ledger, keyword brief, visual manifest, citation widget, and valid Plate document without embedding real secrets.
- **L13.** Document at least three substantial guides: editorial research and SEO; shared article components and authoring; publishing, permissions, operations, and recovery.
- **L14.** Maintain a requirement manifest containing every A01–L30 ID, implementation location, dependency, evidence of verification, and status. Do not equate a checklist tick with working behavior.
- **L15.** Reconcile requirements against current capabilities before implementation; record reuse, fixes, extension, or genuinely new work and remove duplicate paths.
- **L16.** Preserve existing user preferences and repository instructions unless this request explicitly changes them; do not replace the entire agent-skills library with blog-only guidance.
- **L17.** Use versioned schemas, backward-compatible migrations, a published compatibility matrix, and rollback instructions for consumers of shared packages.
- **L18.** Keep prompts, scoring weights, review policies, provider choices, and cost assumptions versioned so an article can be traced to its exact generating configuration.
- **L19.** Define typed tool contracts and validate inputs/outputs. Agents should manipulate article documents and provider adapters through supported APIs, not ad hoc database edits.
- **L20.** Keep tools least-privileged by task: research can read evidence, drafting can write draft revisions, and publishing requires a scoped publishing capability.
- **L21.** Separate trusted instructions from retrieved content, tool payloads, and article text. Test that malicious source text cannot change permissions, leak secrets, or bypass publishing checks.
- **L22.** Include small, meaningful evaluation fixtures for unsupported citations, wrong units, duplicate ideas, keyword stuffing, hallucinated metrics, poor art, and lost editor content.
- **L23.** Evaluate agents against expected outcomes and evidence, including false-positive reviewer behavior; do not reward them solely for longer answers or more generated components.
- **L24.** Use independent review roles where valuable, with shared evidence and clear authority. A reviewer should challenge unsupported claims rather than merely agree with the drafter.
- **L25.** Prefer documented official APIs and current installed versions; check licensing and runtime compatibility before absorbing an upstream implementation or using paid features.
- **L26.** Update agent configuration consistently for Antigravity and the already-supported coding agents without introducing conflicting copies of the editorial rules.
- **L27.** Persist skill changes in the existing canonical git workflow, with a reviewable diff and appropriate commit/sync under the repository's authorization rules.
- **L28.** Run implementation in finite, dependency-aware phases; keep working until the acceptance criteria pass, and report specific blockers rather than claiming infinite convergence or perfection.
- **L29.** After validation, remove temporary scaffolding, duplicate dependencies, dead code, and obsolete conflicting rules; retain useful fixtures and operational documentation.
- **L30.** Finish with a concise implementation report listing actual changed repositories/files, verified flows, configured schedules and costs, remaining configuration, and accurate publication status.
