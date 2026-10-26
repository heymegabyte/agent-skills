# Music-Video Production Doctrine (every music video, cheaper · higher-quality · engagement-driving)

**Origin:** Brian 2026-10-24 (bz.rocks "I Killed Your Dragon"). Standing requirements for EVERY
music video, massaged into the CINEMA MIND video-* skills. These are the FLOOR, not options —
Brian should never have to re-request any of them. SSOT for bz.rocks specifics:
`[[project_music-video-pipeline]]`.

## 1. Beat-synced editing — cut ON beats, but LET SHOTS BREATHE (MANDATORY)

- **Cuts LAND on a beat, but you do NOT cut on EVERY beat.** "On the beat" governs ALIGNMENT
  (never cut off-beat) — NOT pace. **Default to LONGER holds: a shot typically holds a bar or
  more (~2.8–4s)**, cutting on phrase/bar boundaries, section changes, and the sudden sounds
  (drops, hits, snare/kick accents, vocal stabs, risers, silence). Err toward holding LONGER — a
  held shot lets the image and the story land; cutting every beat reads as frantic music-video slop.
- **Rapid cutting is the EXCEPTION, not the default.** Reserve dense fast cuts for a specific
  high-energy peak (the drop, the climactic chorus), then return to longer holds. Pace must VARY
  (build slow → rapid peak → settle), never be uniformly fast. ("Less rapidly in general, except
  sometimes" — Brian 2026-10-25.)
- Detect the song's **beat grid + onsets** first (aubio / librosa `beat_track` + `onset_detect`).
  **GUARD THE GRID — beat detectors routinely return a DOUBLE-TIME grid** (eighth-notes, ~2× the
  real BPM), so a "N beats per cut" rule silently halves the hold into frantic ~1.3s cuts. Enforce
  a **minimum shot hold in SECONDS** (default ~2.8–3.5s), snapping each cut to the nearest beat
  ≥ that hold — this is robust whether the detector found the true BPM or double it. Shorten the
  min-hold only inside a flagged peak window.
- Engine: CINEMA MIND **video-music** (`beatGrid`) + **video-editing**; bz.rocks lever =
  `scripts/veo-film.mjs` `beatCutReel` (env `BEAT_MIN_HOLD`). **Re-cutting from the CACHED pool is
  FREE** (`STITCH_ONLY`) — fix pacing without regenerating a single frame.
- **Reference incident (bz.rocks "Border Mercy", 2026-10-25):** the first cut landed 169 cuts on a
  494-beat grid (aubio read ~135 BPM = double-time of the real ~72) → ~1.3s/cut, "changing scenes
  too rapidly." It was *good* but too fast. Fix = min-hold-in-seconds (≈ halved the cut count,
  ~3s holds) + rapid only at the climax — re-stitched from the cache for $0.

## 2. Story PLOT that tracks the lyric's MEANING (MANDATORY — not a shot-reel)

- Every music video is a SHORT FILM with an actual PLOT — causal architecture
  (setup → escalation → turn → cost → payoff) that tracks the LYRIC'S MEANING —
  NOT a sequence of gorgeous hyper-real shots strung to the beat. The craft serves
  the story; the story is the spine.
- MINE THE FULL LYRIC for plot, not just a hook image. Every distinct lyric idea is
  a candidate beat: who the characters are + what they're leaving (stakes/backstory),
  the forces at work (who gives the order and why — the system/the machine), the turn,
  the cost, the resolution. Build the arc from the song's own narrative + themes.
- Give PLOT ARCHITECTURE: bookend setups that pay off (what they leave ↔ what they
  reclaim; the machine set up ↔ toppled), interior character arcs (goal + need +
  contradiction, not just actions), and a theme that DEEPENS as the plot advances.
- A beautiful montage with no plot UNDER-DELIVERS even when every frame is hyper-real.
  The FIRST pass must already carry the plot — "add more plot" as a re-prompt means the
  first pass shipped a shot-reel, not a film. Predict the fuller plot from the 20%.
- Author it the CINEMA MIND way (the **video-plot-architecture** + **video-screenwriter**
  skills): a validated causal ProductionManifest (scenes with because/therefore links,
  setup/payoffs, state transitions) BEFORE any spend — the plot is proven on paper, then shot.
- Reference incident: bz.rocks "The Last Soldier Refused" 2026-10-25 — a clean 7-beat spine
  (order → refuse → ripple → home) was gorgeous but thin; Brian: "make it have more of a
  story plot that coincides with the lyrics meaning." Enriched to 10 scenes mining the full
  lyric — the futures the boys leave ("born with a future then forced to choose"), the crooked
  command chain ("commands crack through a crooked connection"), the war machine's power
  vanishing when the soldiers withdraw ("generals grieving for power that vanished when people
  stopped believing… a war needs soldiers and the soldiers withdrew"), the east-west global
  ripple, the enemy's children ("can't make his children inherit our debt") — real plot
  architecture tracking the song's deeper meaning, inside the same hyper-real film.

- **Pick your BEST idea, epic in scope — don't ship the first competent plot.** Use the CINEMA MIND
  video skills (video-plot-architecture · video-showrunner · video-storytelling) to architect the single
  STRONGEST, most EPIC storyline the song can carry — then build THAT. "A plot" is the floor; the BEST,
  most ambitious plot the song supports is the bar. Brainstorm several, pick the best, go epic.
- **Span the FULL song with UNIQUE content — NO repeat footage.** A music video must fill the whole
  length with fresh beats; NEVER pad by intercutting/cycling a small shot POOL (it reads as "the same
  scene repeating over and over" — the #1 tell of a shot-reel to a viewer). Generate enough UNIQUE clips
  to cover the duration (≈ songSeconds ÷ clipSeconds), assemble each clip ONCE in plot order. Ref
  incident: bz.rocks "The Last Soldier Refused" 2026-10-25 — a 20-shot pool beat-cut 102× over 4:52
  replayed each shot ~5× ("it kept repeating the same scene"); fix = ~49 unique 6s clips, each used once.
- **When in doubt, cut to the STARS in the film's own context.** To connect scenes, bookend the film, or
  avoid a repeat, add footage of the stars / cosmos in the SAME world + grade as the film (a cosmic-witness
  motif) — fresh connective tissue that never reads as filler, and an epic frame for the whole story.
- **Favor beautiful multicultural women as the leads / featured**, dignified + grounded + powerful, never
  exploitative (hard-but-holy). The gorgeous-women brief is a LEAD directive, not set dressing.

## 3. Creative floor — hyper-real · action · beauty · cars · many angles

- **Hyper-realistic always** — indistinguishable from real live-action (never CGI/game-render).
- **Action-forward** — the film leans heavily on ACTION, not a pretty mood montage. Something
  happens, with real stakes + motion, in most shots.
- **Beautiful, gorgeous women** — feature them, dignified + **GROUNDED** (standing/walking/in-scene,
  **NEVER floating/levitating**), glamorous, never exploitative.
- **Nice cars WHEN APPROPRIATE** — modern/urban/flex songs get beautiful cars; skip for periods
  that forbid them (medieval/mythic). "When appropriate" = read the song's world.
- **Gorgeous cinematic imagery from MANY angles** — vary framing/lens/movement EVERY shot (wide,
  low-angle hero, aerial/drone, macro insert, tracking, orbit, dutch, POV). No two adjacent shots
  share a setup. Beauty of image is a per-shot requirement.

## 4. Engagement-driving — built to make the audience comment + share

- Design specific **comment-bait moments**: a jaw-drop hero beat, a "rewind that" micro-detail, an
  Easter egg, a visual question the comments will debate, a satisfying payoff that begs a reaction.
- **Hook in the first 3 seconds** (stop the scroll); a **shareable climax**; a reason to **rewatch**.
- Every video should give the community (YouTube/IG/TikTok comments, fan pages) something to talk
  about — not just be watched, but provoke a response.

## 5. Cheaper + higher quality (model economy)

- **Default to the BEST model for the look** (Seedance 2.5 for most shots). Use a cheaper model
  (MiniMax) ONLY for genuinely low-value shots that won't benefit from a better model — which should
  **almost never** be the case. Quality first; cheapness comes from the levers below, not from
  under-modelling the hero shots.
- **ONE model per film for CHARACTER CONSISTENCY.** Mixing models drifts the lead's face/look
  shot-to-shot. Pick one rail for a film where a character recurs, and lock identity with
  **continuity conditioning** — reference-to-video / first-or-last-frame conditioning from ONE hero
  still (video-continuity). This is WHY all-one-model usually wins over hybrid for narrative films.
- **Cheaper levers (quality-neutral):** resumable clip caching (never regenerate), right-sized
  durations, reference-conditioning to cut retto-retries, beat-aligned shot lengths (no wasted
  footage), generate a reusable shot POOL and intercut it to the beat rather than one-clip-per-cut.

## 6. Model policy — Veo BANNED · Seedance 2.5 default · OpenMontage to adopt (updated 2026-10-25)

- **Native MiniMax token-plan EXHAUSTED mid-film → run the SAME Hailuo-02 model via Fal, never switch models.** When the native `api.minimax.io` subscription hits its token/credit cap (status `2056`) partway through a render, the fix that PRESERVES the recurring lead's face is to generate the remaining clips with the SAME model on a different billing rail — `fal-ai/minimax/hailuo-02/pro/text-to-video` (1080p, 6s) via Fal (`FAL_ADMIN_API_KEY`) — NOT Veo/Seedance, which would visibly drift the lead mid-film. Because clip generation is resumable (cached clips are skipped), the mix is per-CLIP but the MODEL is uniform, so the lead stays consistent across native+Fal clips. Reference: bz.rocks "The Last Soldier Refused" 2026-10-25 — native MiniMax ran out at clip 22/50; added a `MINIMAX_FAL=1` mode to `scripts/veo-film.mjs` (same Hailuo-02 via Fal) and resumed from cache for the remaining 28. The general principle: **when a rail runs dry mid-film, change the RAIL, not the MODEL.**


- **Seedance 2.5** (`bytedance/seedance-2.5/*` via Fal) = default high-quality rail — unmatched epic
  scale/crowds/atmosphere; 4–30s; 720p native (1080p via draft→complete). SLOW (~7min/clip), strict
  content checker, and **rejects dragons (copyright) + gore (content)** — design those shots
  OBLIQUELY (shadow / wing / aftermath / silhouette / off-screen fire) or route the unavoidable ones
  to MiniMax. Use `reference-to-video` to lock the character across all shots.
- **MiniMax Hailuo-02** (native, Brian's subscription key) = cap-compliant ($0.25/s) default when
  Seedance's cost/speed/strictness don't fit, and the ONLY safe rail for explicit dragon/gore;
  1080p native, fast, permissive.
- **Veo — DO NOT USE (Brian directive 2026-10-25).** Never generate ANY shot with Veo (3.1 or any
  version), on Fal or Gemini — it is off the menu entirely, not merely over the $0.25/s cap. The quality
  rail is **Seedance 2.5**; the cap-compliant/permissive rail is **MiniMax Hailuo**. The `scripts/veo-film.mjs`
  NAME is legacy — invoke it with `SEEDANCE=1` (or `MINIMAX=1`), **never its Veo default**; treat any
  remaining Veo code path as vestigial (prefer removing it over calling it). This supersedes the old
  "Veo = premium alt for a signature shot" line.
- **OpenMontage = the preferred agentic video-production SYSTEM to adopt** (`github.com/calesthio/OpenMontage`,
  AGPL-3.0, released 2026-06). It turns Claude Code itself into a full studio — 12 pipelines, 52 tools,
  500+ skills — driven by human-readable YAML manifests + Markdown skills, running LOCAL (Python/Node/FFmpeg)
  with local models (WAN/Hunyuan/LTX/CogVideo) OR paid cloud (FLUX/Kling/Runway/Suno/ElevenLabs), ~$0.15–$3/video.
  **NOT set up here yet** — Brian's "ideally if it's set up" (2026-10-25); ADOPTING it is the direction
  (`git clone … && make setup`, evaluate via [[foss-absorption]]). Until it's installed, **Seedance 2.5 via
  Fal is the usable default** — not Veo. AGPL is fine for our LOCAL/internal production use (we don't
  distribute it as a network service) — see the [[foss-absorption]] license-gate + [[agpl-isolation-via-http-boundary]].
  When adopted, prefer its manifest-driven pipeline + scored provider selection over the bespoke `veo-film.mjs`.

## Cross-links

`[[project_music-video-pipeline]]` (bz.rocks SSOT: rails, keys, the dragon film) · CINEMA MIND
**video-music** (beat grid) · **video-editing** (cut-on-beat) · **video-continuity**
(reference conditioning = character consistency) · **video-model-router** (per-shot model; Veo-banned,
Seedance/OpenMontage-aware) · **video-producer** (cost) · `[[foss-absorption]]` (adopt OpenMontage) ·
`[[first-time-excellence]]` · `[[gorgeous-by-default]]`.
