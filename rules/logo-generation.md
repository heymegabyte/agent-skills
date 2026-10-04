# Logo Generation — Every Brand Gets a Real, Clever Mark (Research → Ideogram → Select → Integrate)

Every website / app / product / brand build MUST ship a real logo — a crafted ICON mark plus a
high-weight wordmark — never a bare text string or a lone glyph (`◆ brand`). A text-only "logo"
is an under-delivery: the brand's first impression deserves a designed mark. This rule owns HOW a
logo is created; `[[logo-contrast]]` owns how it's SIZED + made legible in the navbar. (Brian
directive 2026-10-03, after ask.megabyte.space shipped a `◆ ask` text wordmark with no real icon.)

<!-- grow-ok -->
<!-- growth 2026-10-04: CF-native generation path + recursive loop + auto-fire + the directives below (Brian) -->

**2026-10-04 directives (Brian):** (1) the LOGO INCLUDES TEXT — ship the icon + wordmark TOGETHER as
the navbar lockup (icon LEFT, high-weight brand text RIGHT); when the generator renders legible text
(Ideogram), the wordmark MAY be baked into the generated lockup, else render crisp font text beside the
generated icon. (2) The FAVICON must JUST WORK from the same mark — favicon + apple-touch + PWA icons are
**TRANSPARENT** (never a flattened black/box background — a dark-tile favicon reads as an ugly black
square in a browser tab). Produce the full set like realfavicongenerator (favicon 16/32/48, apple-touch
180, maskable 192/512, webmanifest). (3) Use **Ideogram almost strictly for the logo** when a valid
Ideogram `Api-Key` is available (store via `get-secret` + add it to the CF AI Gateway as the provider
key); **CF Workers AI (flux) is the FALLBACK** so a missing key never wastes the generated work.

Cross-links: `[[logo-contrast]]` · `[[image-quality]]` · `[[gorgeous-by-default]]` ·
`[[website-build-doctrine]]` · `[[cloudflare-native-provisioning]]` (CF Workers AI image gen) · `[[extra-mile]]`.

## Auto-fire — generate whenever a logo is MISSING

This rule fires automatically, same turn, whenever a brand surface lacks a real logo: a bare
glyph/emoji/text wordmark, a placeholder, a missing/empty favicon, or a generic default. Never ship a
surface without a real mark — if none exists, run the pipeline below and generate one. **Cloudflare
Workers AI image generation is always available** (no third-party key), so "no key / no credit" is
NEVER an excuse to defer the logo.

## The pipeline (every brand, in order)

1. **RESEARCH a pre-existing same-brand logo FIRST.** Before generating anything, look for a real
   mark to enhance+reuse: owned sites, the domain's `/favicon.ico` + `/apple-touch-icon.png` + OG
   image, Wayback, Clearbit/Brandfetch, the parent/umbrella brand's logo, press kits. A found real
   mark is ENHANCED (vectorize, clean, recolor to brand, transparent-bg, trim) + reused — never
   discarded for a generated one. Record what you found (or "none exists") in the build notes.
2. **GENERATE candidates when none exists — CF-native FIRST (it always works).** Primary generator:
   **Cloudflare Workers AI image models** — `@cf/black-forest-labs/flux-1-schnell` (fast) / `flux-2-dev`
   (best) / `@cf/leonardo/lucid-origin` — via `POST /accounts/{acct}/ai/run/{model}` with the global
   key. CF-native, billed through Cloudflare, needs NO third-party key. Ideogram is nice for crisp
   lettering BUT its CF AI-Gateway route (`/{acct}/{gw}/ideogram/v1/ideogram-v3/generate`) still needs
   a valid Ideogram **`Api-Key`** (BYO) — CF **Unified Billing does NOT cover Ideogram** (only
   OpenAI/Anthropic/Google/xAI/Groq as of 2026-10); with no Ideogram key, use Workers AI. Generate
   **≥4–6 candidates** per round as a SQUARE, TEXTLESS ICON. Reference impl: `scripts/gen-logo.mjs`
   (batch-generates + stitches ONE horizontal CONTACT SHEET so the whole batch is one AI-vision read).
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

## Prompt + the RECURSIVE refinement loop (improve until it plateaus)

Iterate, never one-shot — the first batch is a starting point, not the answer:

1. **Round 1** — 4–6 candidates from DISTINCT concepts (bubble+?, monogram, negative-space reveal, the
   product's object). Prompt template:
   > "A minimalist iconic logo MARK for [brand] — [one clever concept]. Flat vector, geometric, bold,
   > simple, high-contrast, [#accent1]-to-[#accent2] gradient on a solid near-black background, soft
   > glow, centered, fills the frame. No text, no letters, no words, no photorealism."

   Repeat "no text, no letters, no words" — diffusion models WILL bake in garbled lettering otherwise.
2. **Review the contact sheet with AI vision** — score each 0–10 on simple / scalable / distinctive /
   on-brand / gorgeous; pick the best AND write the critique (what to push next: richer gradient? a
   tail for "chat"? a clever dot (the brand mark as the "?" dot)? drop a cliché?).
3. **Round 2+** — rewrite the prompts toward the winner's direction + the critique; regenerate. Repeat
   until the top score PLATEAUS (no new round beats the last) — bounded **2–3 rounds** (loops must
   terminate per `[[loop-driven-development]]`; a strong ≥9/10 mark is done). Record each round's pick.
4. **PROCESS the winner** — `scripts/process-logo.mjs` does luminance-keyed alpha (a near-black bg + a
   dark knockout "?" both go transparent, so the mark FLOATS on the dark navbar) + trim + derives
   favicon/apple-touch/PWA from the one source. Render the wordmark as REAL FONT TEXT beside the icon
   (never baked into the raster). If a raster still looks soft at 44px, trace the concept to a crisp SVG.

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

## Reference incident (ask.megabyte.space, 2026-10-04) — generated via CF Workers AI

The hand-drawn SVG from 2026-10-03 was "okay" but not gorgeous. Ideogram-direct was still key-dead and
CF Unified Billing doesn't cover Ideogram — so generation ran on **Cloudflare Workers AI** image models
(`flux-1-schnell`), CF-native + CF-billed, no third-party key. **Two recursive rounds** (6 then 5
candidates, each reviewed as a contact sheet via AI vision) converged on a rich cyan→violet→magenta
gradient rounded-diamond speech-bubble mark with a tail + knockout "?" — a clear step up, ~9/10.
`scripts/gen-logo.mjs` + `scripts/process-logo.mjs` are the reusable pipeline; `AskMark` renders the
transparent `logo-mark.png`. Lesson: **CF Workers AI image gen is the always-available CF-native
generator** — reach for it first; Ideogram only when a valid `Api-Key` exists.
