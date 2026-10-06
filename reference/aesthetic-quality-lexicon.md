---
name: aesthetic-quality-lexicon
description: "Canonical creative vocabulary for the studio. Maps aesthetic adjectives (beautiful, gorgeous, cinematic, premium, sophisticated, immersive, future-forward…) to OBSERVABLE, buildable, verifiable properties — plus an anti-lexicon for detecting generated-looking work. The single source of truth that 09/10/11/12/16/22 and every creative agent interpret and evaluate against. Load when a request uses evaluative design language (make it beautiful / gorgeous / stunning / cinematic / premium / world-class / art direction / wow) or when critiquing a visual surface."
triggers:
  - beautiful
  - gorgeous
  - stunning
  - breathtaking
  - cinematic
  - premium
  - luxurious
  - sophisticated
  - polished
  - immersive
  - "world class"
  - "award winning"
  - "portfolio quality"
  - "make it look better"
  - "make this impressive"
  - "art direction"
  - "creative direction"
  - "future forward"
  - "next generation"
  - wow
  - awe
priority: 2
---

# Aesthetic Quality Lexicon

The studio's shared language for *what we are aiming at* and *what we are avoiding*. Adjectives are
**lenses for interpretation and evaluation — never mandates to apply every technique**. A word in
the positive list does not authorize an effect; it names a target whose *observable properties* a
specialist then achieves through the smallest coherent means. Detection of an anti-lexicon term
triggers **critique**, never an automatic predetermined restyle.

Two hard disciplines govern every use of this vocabulary:

1. **Not every term belongs in every design.** "Luxurious" ruins a children's product; "playful"
   ruins a compliance console. The brief ([[09-brand-and-content-system]]) and the creative thesis
   select which terms apply. Restraint is itself a positive value (see *restrained*, *effortless*,
   *inevitable*).
2. **The medium follows the concept.** None of these words require WebGL, particles, video, glass,
   or motion. A breathtaking editorial typographic hero can out-score a shader. One signature
   moment with quiet space around it beats ten competing effects.

---

## 1 · Positive vocabulary → observable properties

Grouped so each term resolves to things you can *build, screenshot, and verify*. Achieve the
property; do not stack the effects.

### Composition & hierarchy

*coherent · harmonious · editorial · architectural · balanced · precise · intentional · refined*

- Clear single focal point per view; secondary/tertiary hierarchy is unambiguous at a glance.
- Deliberate negative space; elements grouped by Gestalt proximity, not scattered.
- Alignment to a grid *or* intentional, confident asymmetry — never accidental drift.
- Modular type/space scale (consistent ratio); optical centering over mechanical centering.
- Section pacing has rhythm: dense passages earn their density; airy passages earn their rest.
- **Reject** when it collapses to hero → 3 cards → 3 cards → testimonial → pricing → CTA.

### Typography

*typographic · exquisite · immaculate · expressive · meticulous*

- Display vs text faces chosen for reading distance; optical sizing where the face supports it.
- Measure 45–75ch for prose; `text-wrap: balance` on headings, `pretty` on body.
- Tabular numerals for data; true hierarchy (size + weight + color + space), not size alone.
- Tracking tightens as size grows; leading loosens as measure widens.
- Subsetted, `font-display: swap`, no layout shift; multilingual + fallback stacks considered.
- Type *can be the imagery* — a kinetic or oversized headline may be the signature moment.

### Material, light & depth

*material · tactile · dimensional · luminous · atmospheric · sculptural · rich · layered · textural*

- One coherent material story per surface (see [[materiality]] when it lands): matte / satin /
  glossy / frosted / metallic / paper / emissive — pick a vocabulary, don't mix all.
- Depth from *motivated* light: a consistent light direction, soft vs hard shadow used with intent.
- Translucency/blur only where a layer genuinely sits above another; grain 3–6% to kill banding.
- Contrast and edge treatment carry hierarchy before color does.
- **Reject** glass-on-everything, same-radius-everywhere, same-glow-everywhere.

### Motion (defer to [[11-motion-and-interaction-system]] for the token system)

*kinetic · fluid · alive · responsive · crafted*

- Motion communicates feedback, continuity, or intentional delight — or it does not exist.
- Duration bands by role (feedback ~70–180ms · transitions ~160–400ms · narrative 400–900ms);
  easing expresses personality consistently across the product.
- Every motion has a `prefers-reduced-motion` path that is *also* art-directed (static ≠ ugly).
- **Reject** animation-for-animation's-sake, motion with no referent, movement that blocks reading.

### Media & imagery (defer to [[12-media-orchestration]])

*photographic · cinematic · striking · bespoke*

- Images belong to one world (consistent light, grade, subject treatment, crop logic).
- Each asset has a reason to exist and a responsive crop strategy; nothing merely decorative.
- Real/authentic beats synthetic when authenticity is the point; never waxy over-processing.

### Emotional & positioning effect

*memorable · distinctive · original · signature · iconic · emotionally resonant · magnetic ·
dramatic · elegant · effortless · inevitable · delightful · surprising*

- A first-time viewer can name *one* feeling and *one* thing they remember.
- The result looks authored, not assembled — it could not be mistaken for a template.
- "Effortless"/"inevitable" = the hard choices are hidden; nothing looks fussed-over or arbitrary.

### Studio-grade shorthands (quality bar, not a style)

*stunning · gorgeous · breathtaking · premium · luxurious · flagship-quality · showpiece ·
award-caliber · museum-grade · studio-grade · production-grade · world-class · obsessively finished ·
portfolio-defining · future-forward · post-2030-grade*

These are *outcomes*, not instructions. They are earned when the operational definitions below hold
simultaneously. Treat **post-2030-grade** as internal aspirational shorthand — never a factual claim
about the future (see [[always]] truth discipline).

---

## 2 · Operational definitions (the load-bearing five)

Each names a target and, crucially, what it does **not** mean.

### Cinematic

**Is:** deliberate framing · clear focal hierarchy · motivated light + depth · intentional pacing and
transitions · narrative progression · atmosphere (and, in time-based media, sound).
**Is NOT:** particles everywhere · a dark gradient · a canvas starfield on every page.

### Premium

**Is:** excellent typography · exact, consistent spacing · high-quality coherent media · one material
story · restrained controls · zero broken/placeholder states · immaculate interaction details.
**Is NOT:** more effects · gold accents · the word "premium" in the copy.

### Sophisticated

**Is:** intelligent information architecture · nuanced responsive behavior · context-sensitive UI ·
advanced yet legible state handling · precision · non-obvious capability that rewards use.
**Is NOT:** visual complexity · density for its own sake · jargon.

### Immersive

**Is:** continuity between states · spatial awareness · multimodal feedback used sparingly · depth ·
full-attention moments *earned* by the content.
**Is NOT:** autoplaying sound · forced full-screen · motion that hijacks scroll.
Only when it serves the product; never on a form or a settings page.

### Future-forward

**Is:** multimodal/AI-native workflows · generative or adaptive UI · realtime/collaborative state ·
spatial visualization · direct manipulation · voice or live context *where they reduce effort*.
**Is NOT:** sci-fi decoration · an "advanced API" checklist · neon-on-black as a personality.
The real frontier bar: **advanced technology becoming easier to use.** Every frontier capability
still needs feature-detection, a permission path, a fallback, and cleanup ([[god-tier-engineering]]).

---

## 3 · Anti-lexicon → the observable tell (triggers critique, not auto-restyle)

When a surface earns one of these, name it, locate the cause, and propose a *directed* fix — do not
reflexively apply the house look.

| Term | Observable tell |
|---|---|
| generic / template-like / framework-looking | hero→3 cards→3 cards→CTA; default shadcn/ Tailwind defaults unchanged |
| default / stock / flat | one type size doing all the work; no focal hierarchy; stock-looking imagery |
| timid / under-designed | no signature moment; everything the same weight; afraid of scale or space |
| over-designed / overcrowded | multiple elements competing for the eye; no rest; every section "loud" |
| gimmicky / gratuitous | effect with no referent; motion/particles unrelated to meaning |
| AI-slop / gradient-slop / glassmorphism-slop | purple→blue gradient + glass card + blurred blob, no concept |
| card-wall / bento-for-no-reason | bento grid used as default layout, not because the content is modular |
| particle-noise / animation-for-animation's-sake | background motion that carries zero information |
| centered-stack-everywhere / same-radius-everywhere | one centered column + identical radius/shadow on every element |
| fake-premium | "premium/luxury" in copy while spacing, type, and states are sloppy |
| uncanny / cheap-looking / sloppy / inconsistent | waxy faces, broken states, mismatched icon sets, drifting spacing |

A product can be dark + cyan + animated and still be slop; it can be light, quiet, and static and be
world-class. The discriminator is **coherence + intent + craft**, not effect count.

---

## 4 · Using the lexicon in practice

- **Interpretation (before building):** translate the user's evaluative words into the observable
  properties above; let the creative thesis + brand pick which terms apply.
- **Evaluation (seeing the app):** score named *dimensions* (art direction · composition · typography ·
  brand fidelity · originality · craft · interaction · motion · media · accessibility · performance ·
  functional clarity · emotional effect) with reasons — never one gameable scalar. Pair each
  anti-lexicon hit with a located, directed fix.
- **Internal vs external layers:** this vocabulary drives *our* reasoning. It is NOT customer copy —
  banned marketing clichés ([[copy-writing]]) still apply to shipped text.
- **Restraint check:** before adding, run the Apple test — if two elements compete, remove one. The
  signature needs quiet space around it.

Related: [[09-brand-and-content-system]] · [[10-experience-and-design-system]] ·
[[11-motion-and-interaction-system]] · [[12-media-orchestration]] ·
[[16-cinematic-website-prime-directive]] · [[22-visual-experience]] · [[supreme-polish]] ·
[[gorgeous-by-default]]
