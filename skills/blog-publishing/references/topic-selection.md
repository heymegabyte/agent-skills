# Topic Selection, 15-Idea Slate, and Atomic Reservation (`A01–A30`)

Implementation module: `@theme-tools/blog/topic-strategy` (`packages/blog/src/topic-strategy.ts`).

## 1. Site Editorial Charter (`A01–A06`)

Every adopting repository defines a `SiteEditorialCharter` (`SiteEditorialCharterSchema`):

- `siteId` & `tenantId`: Canonical tenant/site identifiers (e.g., `"theme.tools"`).
- `editorialPillars`: Weighted topic pillars with target share ratios (`targetShareRatio`), audience persona levels, and pillar-specific quality criteria.
- `disallowedTopics`: Explicit out-of-bounds topics, YMYL exclusions, and competitor-defamation blocks.
- `targetLocationCode` (`2840` US default) and `targetLanguageCode` (`"en"`).

## 2. Mandatory 15-Idea Research Prompt (`A07–A10`)

Before drafting any article, run the 15-idea generation pass (`selectAndReserveFromFifteenSlate`):

> “Based on fresh, heavy web research, propose the best 15 distinct blog article ideas related to this seed. For each, identify the reader's problem, search intent, original contribution, evidence available, useful visual opportunities, and overlap with existing or planned articles. Rank them and choose the strongest eligible idea.”

Each of the 15 candidates (`IdeaCandidateSchema`) must record:

- `candidateRank` (`1..15`)
- `headline`, `proposedSlug`, `targetPrimaryKeyword`
- `readerProblem`, `searchIntent`, `originalContribution`
- `availablePrimarySources` (minimum 2 primary specification/empirical sources)
- `visualOpportunities` (mapped to `E01–E30` application codes)
- `scores`: `audienceFit`, `searchOpportunity`, `originality`, `evidenceStrength`, `visualRichness`, `productRelevance`, `overlapPenalty` (`0..100`)

## 3. Weighted Editorial Ranking Formula (`A09`)

`computeWeightedEditorialScore` computes a deterministic 0–100 score:

```ts
score =
  audienceFit * 0.20 +
  searchOpportunity * 0.18 +
  originality * 0.18 +
  evidenceStrength * 0.18 +
  visualRichness * 0.14 +
  productRelevance * 0.12 -
  overlapPenalty * 0.35
```

## 4. Cannibalization & Overlap Detection (`A11–A14`)

`evaluateCandidateOverlap` checks candidate #1 against all `published`, `drafted`, `scheduled`, and `reserved` articles:

1. **Exact Slug or Primary Keyword Collision**: Immediate rejection (`overlapScore = 1.0`).
2. **Cosine / Token Jaccard Similarity >= 0.68**: Flags substantial overlap (`recommendedAction: "update_existing"` or `"fallback_next_candidate"`).
3. **Sequential Fallback**: If candidate #1 overlaps, evaluate candidate #2, then #3..#15. If all 15 overlap, return `recommendedAction: "refresh_existing_article"` rather than manufacturing a duplicate page to fill a daily slot.

## 5. Atomic Topic Reservation (`A14`)

Before spending DataForSEO SERP or image-generation budget, call `AtomicTopicReservationStore.tryReserve()`:

- Acquires a TTL-scoped lock (`leaseExpiresAt`) keyed by normalized `siteId + primaryKeyword + canonicalSlug`.
- Prevents concurrent Cloudflare Workflow workers from researching or drafting the same topic simultaneously.
