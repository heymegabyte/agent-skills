---
last_reviewed: 2026-10-20
superseded_by: null
name: "paste-target-text-sanitization"
priority: 3
pack: "misc"
triggers: []
paths:
  - "*"
---

# Paste-Target Text Sanitization

When you emit copy a human will paste into a single reflowing text field (a "description box"), strip YOUR hard line wraps from the prose by default. The field wraps to its own width — your ~75-char wraps paste in as ragged, broken-looking lines. Applies identically whether you print to chat or write a file (e.g. a `.txt` to `~/Desktop/`).

## The move

- **Prose → one unbroken line per paragraph.** Blank line between paragraphs. Let the destination reflow.
- **Never hand off your own hand-wraps.** Do it by DEFAULT for paste targets — don't wait to be asked.
- A re-prompt of "remove the line breaks" means the prior output already shipped your wraps. This rule exists because that happened (bz.rocks YouTube descriptions, 2026-10-20).

## Preserve structure — JUDGMENT, not a mechanical strip

Keep the newlines that ARE the formatting; join only consecutive prose lines inside a paragraph.

- Numbered / bulleted lists (tracklists, feature lists, steps)
- One-URL-per-line link blocks · section headers · divider bars
- Lyrics, verses, poetry, addresses, timestamps, code
- Unsure whether a block is prose or a list → treat as structure, DON'T join. A run-on tracklist is worse than an extra break.

## Also sanitize when prose is derived from a marked-up source

- Strip leaked markdown: leading `#` headings, `**bold**` / `*` / `_` / backtick tokens, section markers like `**[Chorus]**` → `[Chorus]` or drop.
- Collapse 3+ blank lines → one. Trim trailing whitespace. Kill zero-width + stray non-breaking chars.
- Keep typographic quotes/dashes unless the target is strict plain-text.
- Ties to the bz.rocks `track-meta.ts` fix — `# Title` was leaking straight into `<meta description>` + OG/Twitter cards.

## Paste targets that want unwrapped prose (caps are current-ish — VERIFY, platforms drift)

| Target | Char cap |
| --- | --- |
| YouTube description (video/playlist) | 5000 |
| Spotify playlist description | 300 |
| Podcast show + episode description (Apple / Spotify) | long OK |
| SEO `<meta description>` · OG / Twitter `description` | ~155 display |
| X bio · post | 160 · 280 |
| Instagram bio · caption | 150 · 2200 |
| TikTok bio · caption | 80 · 2200 |
| LinkedIn headline · about | 220 · 2600 |
| Facebook page intro · Pinterest description | 101 · 500 |
| App Store description (promo text) · Google Play short/full | 4000 (170) · 80 / 4000 |
| Store listings: Shopify / Etsy / Amazon / Bandcamp / SoundCloud / Gumroad | varies |
| Google Business Profile · Maps · calendar event | 750 · — |
| Link-in-bio / Linktree · marketplace + job listings | varies |
| Alt text · image caption · aria-label | ≤125 alt |
| Spreadsheet / CSV cell · DB text column · JSON string · YAML / front-matter `description:` | — |

## Where NOT to strip — keep the breaks

- Markdown / README / docs, code, config, logs
- Lyrics sheets, poetry, structured verse
- Any field where the newline is semantic (CSV embedded-newline cells, pre-formatted blocks)
- Chat where newlines already render as sent

## File handoff convention

- "print it on the desktop" / "give me a file" → write `~/Desktop/<slug>.txt`, paste-ready, prose unwrapped.
- Before reporting done, count characters the way the platform counts — code points, NOT bytes (`[...s].length`) — and state it vs the cap. Multibyte `━ — ✌️ " "` make byte count ≫ char count.

Siblings: `[[copy-writing]]` (voice, length limits, banned words) · `[[output-compression]]`.
