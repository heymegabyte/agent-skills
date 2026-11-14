# Golden Reference Article vs. Rejected Counterexample (`L10–L11`)

Canonical implementation fixtures: `packages/blog/src/seed-articles.ts` (`FLAGSHIP_ARTICLE_BUNDLE`) and `packages/blog/test/blog-system.test.ts`.

## 1. Golden Complete Reference Article (`FLAGSHIP_ARTICLE_BUNDLE`)

- **Slug**: `architecting-perceptual-design-tokens-oklch-w3c-dtcg`
- **Title**: *Architecting Perceptual Design Tokens: A Complete Engineering Reference for OKLCH, W3C DTCG 2025.10, and Multi-Theme Contrast*
- **Substantive Editorial Word Count**: **2,480+ words** (excluding tables, code, captions, and bibliography).
- **DataForSEO Brief (`kb-flagship-oklch`)**: Built from live DataForSEO v3 capture (`packages/blog/src/fixtures/live-dataforseo-brief.json`, `isFixture: false`), primary keyword `"oklch design tokens"` (`searchVolume: 1900`, `keywordDifficulty: 29`, `primaryIntent: "informational"`).
- **Verified Claims & Citations**: 6 primary claims (`claim-flagship-1` through `claim-flagship-6`) backed by W3C DTCG `2025.10`, W3C CSS Color Module Level 4, WCAG 2.2, and Culori benchmarks, linked inline via `CitationNode` (`[1]–[5]`) to the bottom `BibliographyWidget`.
- **12 Substantive Visual Placements**:
  - Custom hybrid/diagrammatic figures (`E01`, `E03`, `E04`, `E06`, `E11`, `E21`, `E24`)
  - Deterministic `FiniteChart` (`E13`) with SVG hatch patterns and companion data table
  - Sortable `ComparisonTable` (`E19`) comparing sRGB Hex, HSL, CIE Lab, and OKLCH
  - Interactive `CalculatorBlock` (`E20`) computing WCAG contrast and ΔL tolerance
  - Multi-step `SequenceSteps` (`E07`) and `ProgressiveDisclosure` (`E28`)
- **Release Gate Outcome**: `runQualityAndReleaseGate` returns `overallStatus: "passed"` and `releaseEligible: true` (`12/12` checks passed).

## 2. Rejected Counterexample (Blocked by `runQualityAndReleaseGate`)

The following defective article payload is deterministically rejected across multiple release gates:

```json
{
  "reasonForRejection": [
    "check #2 (substantive_word_count): 412 substantive words (< 2,000 minimum)",
    "check #3 (dataforseo_freshness): keywordBrief.isFixture === true (fixture metrics cannot satisfy production gate)",
    "check #4 (citation_claim_integrity): Numerical claim 'OKLCH reduces bundle size by 73%' has no EvidenceReference or CitationNode",
    "check #6 (editorial_writing_quality): Contains banned AI slop words ('delve', 'revolutionize', 'seamless') and duplicate padded paragraphs",
    "check #11 (review_policy_compliance): ReviewRecord contentHash does not match current ArticleRevision.contentHash"
  ]
}
```
