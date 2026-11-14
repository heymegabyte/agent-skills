# Canonical Plate/Slate Document & Inline Authoring (`G01–G30`, `H01–H30`)

Implementation modules: `@theme-tools/blog/schema`, `@theme-tools/blog/renderer`, `@theme-tools/blog/editor`, and `@theme-tools/blog/migration`.

## 1. Single Canonical Plate Document (`G01–G02`, `H01–H03`)

Every article revision stores a single `ValidatedPlateDocument` (`PlateBlockNode[]` validated by Zod v4 in jitless mode):

- **Public Readers (`ArticleStaticRenderer`)**: Renders complete semantic HTML (`<article>`, `<figure>`, `<table>`, `<details>`, `<ol>`, JSON-LD `BlogPosting`) with **zero Plate/Slate editor runtime** downloaded (`H03`).
- **Authorized Editors (`PlateArticleAuthoringShell`)**: Lazy-loaded via `React.lazy(() => import("./LazyPlateEditor"))` only when an authenticated site member with `author`, `editor`, `publisher`, or `owner` role clicks `+ New article` or `Edit Article in Plate`.

## 2. Supported Plate Block & Inline Node Types (`F01`, `G06–G14`)

- **Block Nodes**: `h2`, `h3`, `h4`, `p`, `blockquote`, `ul`, `ol`, `code_block`, `callout` (`note`, `tip`, `important`, `warning`, `caution`, `tldr`, `methodology`), `figure`, `chart`, `comparison_table`, `calculator`, `sequence`, `disclosure`.
- **Inline Nodes**: `text` (`bold`, `italic`, `code`), `link` (`href`), `citation` (`CitationNode` with `claimId`, `sourceId`, `evidenceId`, ` children`).

## 3. Prominent `+ New article` Homepage Button (`G04–G05`)

- `BlogHomepageNewArticleButton` (`data-testid="new-article-button"`) renders prominently on `/blog` **only** when `canUserWriteDraft(user, siteId)` returns `true`.
- Anonymous visitors and signed-in non-members (`role: "viewer"`) never see the button; non-members receive an explicit read-only notice (`data-testid="editorial-access-denied-notice"`).

## 4. Immutable Publish Pointer & Optimistic Concurrency (`G16–G25`)

- Published articles are selected by `ArticleRecord.publishedRevisionId`. Editing creates a new draft `ArticleRevision` (`latestDraftRevisionId`) and never mutates the live public revision until publish succeeds.
- Saving a draft requires `expectedBaseRevisionId`; stale base revisions return a structured conflict (`conflictReason: "STALE_BASE_REVISION"`).
- Offline drafts in `localStorage` are namespaced by `tenantId + siteId + userId + articleId + baseRevisionId` and wiped on `clearUserOfflineDraftsOnLogout` (`G18`, `K22`).
