# Logo Generation — Every Brand Gets a Real, Clever Mark (Research → Ideogram → Select → Integrate)

Every website / app / product / brand build MUST ship a real logo — a crafted ICON mark plus a
high-weight wordmark — never a bare text string or a lone glyph (`◆ brand`). A text-only "logo"
is an under-delivery: the brand's first impression deserves a designed mark. This rule owns HOW a
logo is created; `[[logo-contrast]]` owns how it's SIZED + made legible in the navbar. (Brian
directive 2026-10-03, after ask.megabyte.space shipped a `◆ ask` text wordmark with no real icon.)

Cross-links: `[[logo-contrast]]` · `[[image-quality]]` · `[[gorgeous-by-default]]` ·
`[[website-build-doctrine]]` · `[[cloudflare-native-provisioning]]` (keyless/Ideogram) · `[[extra-mile]]`.

## The pipeline (every brand, in order)

1. **RESEARCH a pre-existing same-brand logo FIRST.** Before generating anything, look for a real
   mark to enhance+reuse: owned sites, the domain's `/favicon.ico` + `/apple-touch-icon.png` + OG
   image, Wayback, Clearbit/Brandfetch, the parent/umbrella brand's logo, press kits. A found real
   mark is ENHANCED (vectorize, clean, recolor to brand, transparent-bg, trim) + reused — never
   discarded for a generated one. Record what you found (or "none exists") in the build notes.
2. **GENERATE candidates when none exists.** Use **Ideogram** (v3; via the Ideogram API or the
   Replicate model `ideogram-ai/ideogram-v3-turbo` / `-v3`) — Ideogram renders crisp logo-grade
   vectorish art + legible lettering better than generic diffusion. Generate **≥4–6 candidates**
   following the logo-design guide below. Produce the **ICON mark** as a SQUARE (`ASPECT_1_1`), and
   a horizontal wordmark only when a lockup image is wanted (`ASPECT_3_1`, per `[[logo-contrast]]`).
3. **SELECT the best with AI vision.** Read every candidate PNG, score each against the
   rubric below, pick the winner, and WRITE DOWN why (one line). Prefer the one that reads at 16px
   and in one color — not the most detailed.
4. **PROCESS the winner.** Background-strip to transparent, `trim()` margins (per `[[logo-contrast]]`
   over-trim guard), export the icon + derive favicon (32/16), `apple-touch-icon` 180×180, maskable
   PWA icons (192/512 with safe padding), and a branded OG card. One source mark → all derivatives.
5. **INTEGRATE into the navbar — gorgeous, big, simple.** Icon LEFT + wordmark text RIGHT. The
   wordmark is a **high-weight font** (700–800) that pairs with the site + icon (brand display font,
   e.g. Space Grotesk / Sora), single-line, sized to fill a real chunk of the header (icon ~48–56px,
   wordmark ~24px fluid) per `[[logo-contrast]]`. The mark takes up a decent, confident amount of
   space — never a timid afterthought.
6. **VERIFY in a real browser.** Screenshot the navbar at 375 + 1280; confirm the icon renders
   crisp + transparent, the wordmark is single-line + AA-legible, nothing overflows. A file that
   200s is not proof — only a render is.

## The logo-design guide (what "clever + cool + creative + simple" means)

- **One idea, executed cleanly.** The best marks carry a single clever concept: a dual-meaning, a
  negative-space reveal, a monogram, or a geometric distillation of what the product DOES. Encode the
  product's concept — for a Q&A/decision tool, a speech bubble + question/fork; for a router, a node;
  for a forge, an anvil/spark. Never decorate; mean something.
- **Simple + scalable.** Must be recognizable at 16px and in a single flat color. If it needs gradients
  or fine detail to read, it's too complex — strip it back.
- **Memorable + distinctive.** Avoid the clichés (generic globe, swoosh, chat-bubble-with-three-dots,
  rainbow gradient blob) UNLESS you subvert them cleverly. Aim for a shape someone could redraw from
  memory.
- **On-brand + versatile.** 1–2 brand colors + a mono version; works on dark AND light; works as a
  tiny favicon AND a large hero. Build on a grid / optical balance (golden-ratio or 8px grid).
- **Timeless over trendy.** No year-stamped fads. A mark should survive a decade.

## Ideogram prompt template (fill the brackets)

> "A minimalist, iconic logo MARK for [brand] — [one clever concept, e.g. 'a speech bubble whose tail
> forms a question mark']. Flat vector, geometric, bold, simple, high-contrast, memorable, centered,
> on a solid [#bg] background, [#accent] accent. No text, no wordmark, no photorealism, no gradient
> mesh, fills the frame. Professional tech-brand logo, works at small sizes." + `ASPECT_1_1`, a
> magic-prompt-off deterministic style, 4–6 images.

- Generate the ICON textless (lettering generators muddy a small mark); render the wordmark as REAL
  FONT TEXT in the navbar (crisp, themeable) rather than baking it into the raster.
- If the best raster still looks soft at navbar size, trace it to a crisp **SVG** rendition of the
  chosen concept — an Ideogram concept + a hand-cleaned SVG is the strongest navbar result.

## Anti-patterns (fix on sight)

- Shipping a bare text wordmark or a single Unicode glyph (`◆`, `●`, an emoji) as "the logo."
- Generating before researching whether a real brand mark already exists.
- Picking the most detailed/ornate candidate — it dies at favicon size.
- Baking wordmark text into the raster icon (blurry, un-themeable) instead of high-weight font text.
- A tiny timid mark in the navbar — the logo must be big + confident per `[[logo-contrast]]`.
- A raster favicon/OG derived from a different source than the navbar icon (drift).

## Reference incident (ask.megabyte.space, 2026-10-03)

The navbar shipped a bare `◆ ask` glyph — no real mark (this rule's trigger). On the fix, BOTH
external generators were credential-blocked: the direct Ideogram API key **401'd** (expired/invalid)
and Replicate returned **402 (no credit)** for `ideogram-ai/ideogram-v3-turbo`. Per the enhancement
path, the mark was crafted as a crisp **SVG** instead — a cyan→violet gradient speech-bubble squircle
with a masked question-mark knockout whose dot is the brand **◆ diamond** (unifying the prior favicon
bubble + the navbar ◆ into one mark), locked up with an `ask` wordmark in Space Grotesk;
`apps/ask/scripts/gen-icons.mjs` derives favicon + apple-touch + PWA icons from the one SVG (no drift).
Lesson: **CHECK generator creds first** (`get-secret IDEOGRAM_API_KEY` validity + Replicate balance);
when blocked, the SVG-trace fallback ships a real mark the SAME turn — never defer the logo to "later".
