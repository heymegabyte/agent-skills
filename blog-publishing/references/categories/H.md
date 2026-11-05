# H — TECHNICAL SEO, ACCESSIBILITY, AND PERFORMANCE

Load this category only when the article task, affected runtime boundary, or release risk selects it. The directives below are exact authorized requirements. Record applicability and live evidence in the adopting repository; policy presence is not runtime verification.

- **H01.** Render the full public article, headings, tables, citations, and critical links into semantic HTML; do not make primary content depend on editor hydration or a login session.
- **H02.** Keep editor code out of anonymous reader bundles and lazy-load secondary interactive features. Verify the actual network and bundle graph, not just component filenames.
- **H03.** Maintain one descriptive H1 and a logical heading hierarchy with stable section anchors and landmarks for article, navigation, and complementary material.
- **H04.** Preserve one canonical article URL per locale across revisions; normalize URL variants consistently. Keep historical revision routes private or under an explicit nonindexable archive policy instead of creating an indexed article for every edit.
- **H05.** Generate unique, accurate title tags and meta descriptions from the final article; display previews without promising a fixed search snippet or ranking.
- **H06.** Use Article or BlogPosting structured data with real author, headline, image, dates, and publisher details that match the visible page. Validate against current eligibility rules. [S05]
- **H07.** Preserve the original publication date; update dateModified and sitemap lastmod only for appropriate substantive changes, not every job or page view. [S06]
- **H08.** Update the sitemap and RSS/Atom feeds on successful publication, correction, withdrawal, and canonical changes; exclude drafts and noncanonical duplicate routes.
- **H09.** Use ordinary sitemap discovery and supported Search Console workflows for blog indexing. Do not misuse Google's restricted Indexing API or claim guaranteed indexing. [S07]
- **H10.** Validate robots directives, canonical tags, HTTP status, and crawl access from the public route; preview authentication and noindex metadata must not leak into production.
- **H11.** Keep unpublished drafts and private evidence behind authentication. A robots.txt rule or noindex tag is not a privacy boundary.
- **H12.** Use crawlable contextual internal links and real category/topic hubs. Detect orphan articles, dead links, redirect chains, and empty taxonomy pages.
- **H13.** Include accurate Open Graph/social metadata and intentional image crops; title artwork and visible article metadata must remain consistent.
- **H14.** Serve responsive image variants with width/height or aspect ratio, srcset, sizes, appropriate formats, and fallbacks; prevent layout shifts as images load.
- **H15.** Load the likely LCP hero promptly, with appropriate priority and preload only when warranted; lazy-load below-the-fold images and embeds. [S14]
- **H16.** Make LCP at most 2.5 seconds, INP at most 200 milliseconds, and CLS at most 0.1 the real-user p75 goals for mobile and desktop; distinguish field measurements from lab approximations. [S13]
- **H17.** Set project-specific page byte and JavaScript budgets after measuring the current site. Enforce regressions against the budget without pretending one universal transfer cap fits every article.
- **H18.** Give every meaningful image appropriate alt text; decorative images use empty alt. Describe complex charts with a nearby explanation and accessible data table. [S09]
- **H19.** Use semantic tables with captions, row/column headers, keyboard-safe scrolling, and a mobile layout that preserves the association between values and labels.
- **H20.** Ensure charts convey information through labels, shapes, and patterns as well as color; test configured light/dark themes and common color-vision differences.
- **H21.** Implement WCAG 2.2 AA as the target: keyboard navigation, visible focus, adequate contrast, usable target sizes, reflow, and screen-reader names throughout the reader and editor. [S10]
- **H22.** Respect reduced motion and user preferences. Citation animations, galleries, comparison sliders, and chart transitions must retain full meaning when motion is disabled. [S11, S12]
- **H23.** Keep content readable at zoom and narrow widths. Prevent horizontal page overflow, clipped citations, unreadable code, and sticky bars that obscure article content.
- **H24.** Provide captions and transcripts for useful audio/video additions, with no autoplay audio and controls that work with a keyboard.
- **H25.** Make embedded third-party content consent-aware where needed, isolated, lazily loaded, and replaceable with a useful text/link fallback.
- **H26.** Provide print-friendly and export-friendly presentation, preserving article order, references, chart meanings, and readable links without interactive-only controls.
- **H27.** Use localization-aware typography, dates, numbers, and link handling. Add hreflang only for real localized equivalents and maintain their canonical relationships.
- **H28.** Fail gracefully when a nonessential widget errors: keep its readable static content, citations, and surrounding article intact; never blank the page.
- **H29.** Validate structured data, link integrity, a11y, public rendering, and representative mobile/desktop performance in the actual deployment path before declaring readiness.
- **H30.** Measure real-user performance and reader errors after publishing; regressions create actionable repair work associated with the component, article revision, and deployment.
