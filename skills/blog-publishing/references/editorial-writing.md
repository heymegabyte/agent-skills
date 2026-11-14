# Editorial Writing, Depth, and Anti-Slop Standards (`D01–D30`)

Implementation modules: `@theme-tools/blog/schema` (`computeSubstantiveWordCount`) and `@theme-tools/blog/workflow` (`auditEditorialWritingAndStructure`).

## 1. Substantive Editorial Word Count (`D01–D03`)

Every new generated article must contain **at least 2,000 substantive editorial words** (target range `2,000–3,000`, or `>3,000` when comprehensive coverage requires it).

`computeSubstantiveWordCount` counts prose in paragraphs (`p`), headings (`h2`, `h3`, `h4`), list items (`ul`, `ol`), blockquotes (`blockquote`), callout body text (`callout`), sequence step prose (`sequence`), and progressive disclosure prose (`disclosure`), while **strictly excluding**:

- Navigation chrome and breadcrumbs
- Bottom bibliography entries and source metadata
- Comparison table cell values and headers (`comparison_table`)
- Chart axis labels and series values (`chart`)
- Figure captions and image `alt` text (`figure`)
- Code blocks (`code_block`)
- Calculator input labels (`calculator`)

## 2. Anti-Padding & Anti-Slop Audits (`D08–D16`)

`auditEditorialWritingAndStructure` rejects articles that fail any of these structural checks:

- **Banned AI Slop Vocabulary**: Rejects `delve`, `leverage`, `unleash`, `revolutionize`, `seamless`, `robust`, `synergy`, `elevate`, `empower`, `transformative`, `best-in-class`, `cutting-edge`, `in conclusion`, `it is important to note`.
- **Paragraph & Section Rhythm**: Flags walls of text (`>4` consecutive prose paragraphs without a visual, table, callout, or subheading) and enforces clean heading hierarchy (`H1 -> H2 -> H3` with zero skipped levels).
- **Near-Duplicate Paragraph Detection**: Rejects repetitive restatements designed to inflate word count.

## 3. Mandatory Reference-Page Anatomy (`D04–D07`, `D17–D30`)

Every article must include:

1. **Direct Answer Lead & Executive TL;DR Callout (`D04–D05`)**: Answers the primary search intent in the opening 60 words, followed by a structured `variant: "tldr"` callout.
2. **Concrete Worked Examples (`D17`)**: Real configuration payloads, token schemas, or mathematical derivations with verified outputs.
3. **Failure Modes & Edge Cases (`D18`)**: Honest engineering trade-offs, browser/runtime limitations, and mitigation steps.
4. **Explicit Labeling of Non-Facts (`D19`)**: Clearly distinguish verified facts (`[n]` cited) from editorial recommendations, worked examples, and hypotheses.
