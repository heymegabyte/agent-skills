---
name: "F07 — Generated and adversarial inputs"
familyId: "F07"
defaultLayer: "property"
defaultTier: "required_ci"
itemCount: 30
---

# F07: Generated and adversarial inputs (F07.01–F07.30)

- **Default Verification Layer**: `property`
- **Default Execution Tier**: `required_ci`
- **Authorized Pilot Implementation**: `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx`

## Complete 30-Recommendation Obligation Matrix

| ID | Title | Obligation | Layer | Tier | Pilot Status | Evidence / Location |
|---|---|---|---|---|---|---|
| `F07.01` | **Independent invariants** | Derive property tests from mathematical/domain invariants rather than copying implementation code. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.02` | **Valid domain generators** | Generate valid OKLCH colors, slugs, micro-USD budgets, and Plate AST documents. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.03` | **Targeted invalid generators** | Generate single-constraint violations (e.g. location_code on search_intent, private SSRF IPs). | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.04` | **Biased edge exploration** | Bias inputs toward 0, 1, 1999, 2000, 2001 words, DST boundaries, and max batch sizes. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.05` | **Useful shrinking** | Produce minimal counterexamples that preserve schema validity up to the failing invariant. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.06` | **Reproducible counterexamples** | Record deterministic seeds and replay parameters in test failure reports. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.07` | **Controlled nondeterminism** | Inject deterministic clocks and token generators so property runs replay identically. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.08` | **Round-trip properties** | Verify encodeTheme/decodeTheme and canonicalJson serialization round-trips losslessly. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.09` | **Idempotence properties** | Verify normalizePlateDocument(normalizePlateDocument(doc)) === normalizePlateDocument(doc). | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.10` | **Metamorphic relationships** | Verify adding code blocks or table cells never increases computeSubstantiveWordCount. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.11` | **Conservation properties** | Verify MicroUsdBudgetManager reserved + remaining always equals total configured cap. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.12` | **Commutativity boundaries** | Verify independent topic reservations commute while same-slug reservations serialize. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.13` | **Model-based sequences** | Validate scheduler state transitions (idea -> researched -> drafted -> reviewed -> scheduled -> published). | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.14` | **Controlled schedule generation** | Exercise competing slot claims and draft saves across interleaved execution orders. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.15` | **Differential oracles** | Compare static HTML renderer headings/citations against Plate editor view-mode output. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.16` | **Parser structure limits** | Reject deeply nested or oversized untrusted JSON/HTML payloads before exhausting memory. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.17` | **Unicode adversaries** | Exercise RTL, CJK, zero-width joiners, and combining marks across word counters and slugs. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.18` | **Numeric adversaries** | Reject NaN, Infinity, negative micro-USD, and out-of-gamut lightness/chroma values. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.19` | **Temporal adversaries** | Exercise America/New_York spring-forward and fall-back DST transitions on 09:00/14:00/19:00 slots. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.20` | **Protocol fuzzing** | Exercise malformed POST bodies and disallowed HTTP methods against Worker API routes. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.21` | **Delivery permutations** | Exercise duplicate and out-of-order queue/webhook callbacks against idempotent handlers. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.22` | **Schema evolution inputs** | Exercise legacy article imports and optional metadata fields across schema versions. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.23` | **Relational fixture generation** | Generate linked articles, revisions, claims, sources, and citations verifying referential integrity. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.24` | **Actor-resource combinations** | Exhaustively test all 6 roles × 11 editorial actions × cross-tenant combinations. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.25` | **Constrained combinations** | Cover theme polarity (light/dark) × viewport × role combinations systematically. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.26` | **Bounded campaigns** | Enforce strict iteration and runtime budgets on property and fuzzing suites in CI. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.27` | **Realistic distributions** | Test multi-citation paragraphs, 2,500-word prose blocks, and skewed SERP overlap distributions. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.28` | **Coverage-guided exploration** | Target URL canonicalization, SSRF validation, and HTML/SVG sanitizers with hostile inputs. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.29` | **Hostile file corpora** | Exercise polyglot, truncated, oversized, and script-injected SVG/PNG/JPEG byte arrays. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
| `F07.30` | **Curated regression corpus** | Retain minimized regression fixtures for every discovered bug in versioned test files. | `property` | `required_ci` | `verified` | `packages/testing/test/testing-discipline.test.ts & apps/ui/stories/BlogComponents.stories.tsx` |
