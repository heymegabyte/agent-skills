---
name: "universal-mega-menu-navbar"
priority: 2
pack: "design"
triggers:
  - "navbar"
  - "header"
  - "mega menu"
  - "navigation"
  - "avatar"
  - "logo"
  - "dashboard shell"
paths:
  - "org:website_build"
last_reviewed: 2026-11-22
superseded_by: null
---

# Universal `@theme.tools` Mega-Menu Navbar, Ideogram Brand Emblem & Avatar-Circle Auth Standard

User directive, 2026-11-22. Every site and application across the fleet MUST use a single **Universal Mega-Menu Navbar** sourced from `@theme.tools/ui` across the entire application — including marketing pages, programmatic SEO landing pages, blog articles, sub-pages, AND authenticated dashboards (customer `/me`, worker `/work/dashboard`, unified `/dashboard/*`, and admin `/admin/*` consoles).

Cross-links: `[[logo-generation]]` · `[[logo-contrast]]` · `[[theme-tools-canonical-components]]` · `[[gorgeous-by-default]]`.

## 1. Universal Navbar Across the Whole App (Including Admin & Dashboards)

- **One Universal Top Navbar Everywhere**: Do not replace the site's primary top navbar with a disconnected header on sub-pages or inside `/dashboard` and `/admin` shells. Mount the same universal `@theme.tools/ui` navbar (`UniversalMegaMenuNavbar` / `Header`) at the top of every route (`/` homepage, `/c/*`, `/services/*`, `/for/*`, `/blog/*`, `/book`, `/login`, `/dashboard/*`, `/me`, `/work/*`, and `/admin/*`).
- **Dashboard & Admin Integration**: When rendered inside `DashboardShell`, `AdminShell`, or `UnifiedDashboard`, the universal navbar remains the primary top bar (with an optional mobile sidebar drawer toggle and role badge), ensuring users and operators always have one-click access to the Ideogram brand home link, the full site Mega Menu, the global `"Book the crew"` CTA, and their authenticated Avatar Circle.

## 2. Left Slot: Creative, Theme-Appropriate Ideogram Super-Bold Logo Wordmark

- **Ideogram Super-Bold Creative Wordmark Logo Mandate**: The navbar logo MUST be a super cool, theme-appropriate, creative wordmark logo with super-bold custom logo font and styling generated via Ideogram (`POST https://api.ideogram.ai/v1/ideogram-v3/generate` or `image-generator` subagent, e.g., chiseled industrial block-stencil typography with brick-course mortar cutouts and 3D bevels for Brick Labor). Do not pair it with a redundant secondary hammer/circle badge if the wordmark itself carries the iconic brand styling.
- **100% Pure Transparent Alpha & Tight Crop**: Process the raw Ideogram render via Sharp (`scripts/generate-ideogram-brand-logo.mjs`) to strip 100% of background/checkerboard pixels to pure transparent alpha (`alpha = 0`), tightly crop to the glyph bounding box, apply optical vertical alignment (`relative -top-[5px]`), and serve multi-resolution WebP/PNG (`256w`, `512w`, `1024w`) so only the bold logo typography floats cleanly on the glassmorphic dark navbar.

## 3. Center / Navigation Slot: Single Mega-Menu Trigger Button With Live Featured-Image Preview Pane

- **No Separate Horizontal Text Links in the Top Bar**: Never clutter the top navbar with a row of separate text links (`Services`, `Pricing`, `Coverage`, `Blog`, `FAQ`, `Contact`, `← Home`).
- **Single Mega-Menu Trigger Button (`data-testid="universal-mega-menu-trigger"`)**: Render a single cohesive button (e.g., `Explore & Guides ▾`) that toggles the `@theme.tools/ui` **Mega Menu** (`data-testid="universal-mega-menu-panel"`).
- **Rich Multi-Column Architecture + Live Featured-Image Preview (`data-testid="mega-menu-featured-preview"`)**:
  - The Mega Menu is sourced from `@theme.tools/ui` and organizes the entire site into scannable categories:
    1. **Core Services & 3D Solutions Matrix** (Flagship service hubs, `$50/hr` calculators, free sample test-patch guides, crew × hour blocks)
    2. **Blog Articles & Audio Field Guides** (All featured blog posts and spoken podcast guides)
    3. **City Hubs & Sub-Pages** (Major local city hubs, building COI guides, competitor comparisons, coverage maps)
    4. **Dashboards, Account & Company Pages** (Unified Dashboard, Customer Portal, Crew Portal, Admin Console, Pricing, Reviews, FAQ, Contact, Cited Sources)
  - **Live Featured-Image Preview Card**: Every item in the Mega Menu carries a `featuredImage`, `badge`, `title`, `description`, and `metaLabel`. Hovering, focusing, or tapping a category/item dynamically updates the Mega Menu's preview pane (`<img data-testid="mega-menu-preview-image" />`) so visitors see the page's featured photography and summary before clicking.

## 4. Right Slot: Global Primary CTA (`"Book the crew"`) + Login Indicator With Avatar Circle

- **Global Primary CTA (`"Book the crew"`)**: Keep `"Book the crew"` (`href="/book"`) visible on the right side of the universal navbar across every page of the site and dashboard.
- **Login Indicator With Avatar Circle (`data-testid="universal-navbar-auth-slot"`)**:
  - **Logged-Out State (`anon`)**: Display a unified `"Login"` button that includes an avatar-circle silhouette badge (`data-testid="navbar-login-avatar-button"`, linking to `/login`).
  - **Logged-In State (`customer`, `worker`, `admin`, `super_admin`, or active demo session)**: Automatically replace the `"Login"` button with an interactive **Avatar Circle** (`data-testid="navbar-logged-in-avatar-circle"`) displaying the user's profile photo or stylized initials inside an accent-ringed circle with an active emerald status dot. Clicking the Avatar Circle opens the user's role-aware account/dashboard menu (or navigates to their dashboard with a Sign Out option).

## 5. Dual-Host (Female + Male) Conversational Podcast Studio Deck & `@theme.tools/blog` Multimedia Collections

- **Dual-Host Conversational Podcast Audio (`Maya` Female Co-Host + `Brian` Male Co-Host)**:
  - Every flagship landing page and blog article podcast MP3 MUST be a natural 10-turn back-and-forth conversation between a female co-host (`Maya · Homeowner Advocate`) and a male co-host (`Brian · Founder & Field Lead`) covering why the service exists, why customers should sign up, and real-life property challenges.
  - Synthesize via a cheapest-best provider waterfall (`gemini-2.5-flash-preview-tts` `multiSpeakerVoiceConfig` -> `gpt-4o-mini-tts` alternating `coral` + `ash` -> Google TTS Service `translate.google.com/translate_tts` with FFmpeg dual-host vocal formant/pitch contour, stereo separation, and `-16 LUFS` broadcast loudness normalization).
- **Single-Bar Full-Width Gemini NotebookLM × SoundCloud FFT Waveform Player (`FieldServicePodcastPlayer`)**:
  - Do NOT clutter the podcast widget with multi-row boxes, chapter chip rows, mode switcher pills, or transcript drawers. Render a single full-width horizontal animated play bar (`w-full`) with a full-bleed WebGL GLSL shader backdrop (`webgl-audio-shader-canvas`) + 64 mirrored SoundCloud-style FFT waveform bars (`web-audio-visualizer-bars`) driven at 60fps by `AudioContext` + `AnalyserNode` (`getByteFrequencyData` and `getByteTimeDomainData`), paired with embedded transport buttons (`-15`, glowing `Play/Pause` with reactive audio halo, `+15`), inline `Gemini Notebook` dual-host indicator (`Maya` & `Brian`), SoundCloud hover-scrub tooltip, and inline timecode, speed (`1x–2x`), and volume controls.
- **Full `@theme.tools` (`ui.theme.tools` & `@theme.tools/blog`) Multimedia Collection — Containerless & Un-Tabbed Editorial Flow**:
  - Every blog article and flagship guide MUST opportunistically mount the complete `@theme.tools` editorial & multimedia suite: Top Scroll-Driven Reading Progress Bar (`tt-blog-reading-progress`), Clean Borderless Section Jump Links (`tt-blog-multimedia-badges`), Executive Key Takeaways (`tt-blog-key-takeaways`), Interactive Before/After Photo Slider (`tt-multimedia-before-after-slider`), Open 4-Surface Architecture Breakdown Grid (`tt-multimedia-surface-tabs`), 4-Step On-Site Routine Timeline (`tt-multimedia-step-reel`), Open 2×2 Field Photography Essay (`tt-multimedia-photo-gallery`), Interactive 5-Minute Readiness Checklist (`tt-multimedia-prep-checklist`), Editorial Callout Trio (`tt-blog-callout-cards`), Open 3-Column Hourly vs. Flat-Rate Cost Comparison (`tt-multimedia-scope-picker`), Open Author Bio + Social Share Bar (`tt-blog-author-and-share`), and Collapsed-by-Default Verified Citations Drawer (`collapsible-citations-drawer`).
  - **Zero `@THEME.TOOLS` Meta Titles & Zero Stacked Tab Panes**: Never display internal developer/library labels such as `@THEME.TOOLS/BLOG · COMPREHENSIVE KEYWORD-ALIGNED FAQ` in visible headings or eyebrows. Never stack tab switchers on top of each other inside an article or trap article sections inside heavy nested card containers (`rounded-2xl border bg-[#0c1118] p-6 shadow-xl`); let all multimedia sections escape their tab panes and overflow directly into the surrounding article container with subtle top dividers (`border-t border-white/10 pt-10`).
