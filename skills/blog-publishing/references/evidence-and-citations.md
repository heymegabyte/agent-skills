# Evidence, Source Capture, and Claim-Level Citations (`C01–C30`)

Implementation module: `@theme-tools/blog/evidence` (`packages/blog/src/evidence.ts`).

## 1. SSRF Protection & URL Canonicalization (`C01–C06`)

- `canonicalizeSourceUrl`: Strips tracking parameters (`utm_*`, `fbclid`, `gclid`), normalizes hostname casing, enforces `https:`/`http:`, and preserves meaningful query keys.
- `validateSafeExternalUrl` & `validateRedirectChain`: Blocks loopback (`127.0.0.0/8`, `::1`, `localhost`), RFC1918 private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.169.254`, `fe80::/10`), and non-HTTP schemes (`file:`, `javascript:`, `data:`) on every hop of a redirect chain.

## 2. Prompt-Injection Sanitization (`C07`)

`sanitizeRetrievedPassage` strips adversarial instructions (`ignore previous instructions`, `<system>`, tool-call spoofing, zero-width characters) from fetched external documents before quoting or feeding into synthesis stages.

## 3. Immutable Source Versions & Evidence Passages (`C08–C13`)

Every cited source requires:

1. `SourceRecord`: Canonical URL, title, publisher, authority tier (`primary_specification`, `peer_reviewed_research`, `official_vendor_docs`, `empirical_benchmark`, `industry_analysis`), and license policy.
2. `SourceVersion`: Immutable snapshot with `contentSha256`, `retrievedAt`, and `r2SnapshotKey`.
3. `EvidenceReference`: Exact `excerptOrParaphrase`, `sectionLocator` (e.g., `"Section 8.1 Color Type"`), and `supportsClaimIds`.

## 4. Claim Ledger & Recorded Calculations (`C14–C20`)

- Every factual, numerical, pricing, or benchmark assertion is registered in `ClaimRecordSchema` (`verificationStatus: "verified"`).
- Worked calculations are verified deterministically via `evaluateRecordedCalculation` (`formulaName`, `inputs`, `expectedOutput`, `tolerance`).
- `validateCitationAndClaimIntegrity` enforces:
  - Zero uncited factual/numerical claims.
  - Every `CitationNode` (`type: "citation"`) resolves to a valid `SourceRecord` and `ClaimRecord`.
  - No synthetic bibliography metadata (`C27`).

## 5. Inline Citations & Bottom Bibliography (`C17–C18`, `F08–F09`)

- `resolveCitationsAndBibliography` assigns deterministic `[1]`, `[2]`, `[3]` numbers in order of first appearance in the Plate document.
- Repeated citations to the same source reuse its `[n]` number and generate unique back-link anchors (`#cite-ref-src-id-1`, `#cite-ref-src-id-2`) displayed inside the bottom `BibliographyWidget`.
