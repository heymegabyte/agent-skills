# DataForSEO v3 Keyword & SERP Intelligence (`B01–B30`)

Implementation module: `@theme-tools/blog/dataforseo` (`packages/blog/src/dataforseo.ts`).
Verified provider capture: `packages/blog/src/fixtures/live-dataforseo-brief.json`.

## 1. Authentication & Secret Hygiene (`B01–B03`)

- Credentials (`DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, or `DATAFORSEO_BASIC_AUTH_BASE64`) are loaded exclusively on the server/worker via Infisical or Worker secret bindings.
- Never import `@theme-tools/blog/dataforseo` in client browser code; `redactDataForSeoSecrets` strips `Authorization` headers and credentials from all structured logs and stored `ProviderOperation` envelopes.

## 2. Canonical DataForSEO v3 Endpoints & Request Shapes (`B04–B10`)

| Purpose | Endpoint Path | Location/Language Rule |
| --- | --- | --- |
| Keyword Suggestions | `/v3/dataforseo_labs/google/keyword_suggestions/live` | Requires `location_code` (`2840`) + `language_code` (`"en"`) |
| Related Keywords | `/v3/dataforseo_labs/google/related_keywords/live` | Requires `location_code` (`2840`) + `language_code` (`"en"`) |
| Bulk Keyword Difficulty | `/v3/dataforseo_labs/google/bulk_keyword_difficulty/live` | Requires `location_code` (`2840`) + `language_code` (`"en"`) |
| Search Intent | `/v3/dataforseo_labs/google/search_intent/live` | **Requires `language_code` (`"en"`) ONLY — forbid `location_code` (`B08`)** |
| Organic Live SERP | `/v3/serp/google/organic/live/advanced` | Requires `location_code` (`2840`) + `language_code` (`"en"`) |

`DataForSeoSearchIntentRequestSchema` uses `.strict()` and explicitly rejects `location_code` so invalid parameters never silently fail or waste credits.

## 3. Envelope Validation & Redirect Unwrapping (`B11–B15`)

- `validateDataForSeoEnvelope` verifies `status_code === 20000` at both top-level and task-level before accepting any payload.
- `unwrapGoogleRedirectUrl` inspects organic SERP items and falls back to `breadcrumb` domain/path extraction whenever a SERP URL is wrapped in `https://www.google.com/url?...`.

## 4. SERP Overlap Clustering: Single Article vs. Separate Page (`B16–B18`)

`computeSerpUrlOverlapRatio(urlsA, urlsB)` compares the top-10 normalized organic URLs between two keywords:

- **Overlap >= 40% (`0.40`)**: Target both keywords within a **single comprehensive article** (`clusterDecision: "single_comprehensive_article"`).
- **Overlap < 40%**: Keep as **distinct articles** (`clusterDecision: "separate_articles"`) to prevent intent dilution.

## 5. Keyword Density as Diagnostic Only (`B22–B25`)

- `computeKeywordDensityDiagnostic` measures primary phrase density (`0.4%–2.2%` advisory band) and lexical diversity (`uniqueTokenRatio`).
- Never enforce a fixed repetition count or require supporting words to appear less frequently than a multi-word primary phrase.
- `isFixture: true` briefs are hard-blocked by `runQualityAndReleaseGate` (`check #3`).
