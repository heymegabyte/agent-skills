# Emdash Skills for Gemini

Load CONVENTIONS.md for stack defaults. Load _router.md for skill routing.
23 categories, 151 reference docs, 55 agents.

## Stack

CF Workers + Hono | React 19 + Vite + ui.theme.tools (`@theme.tools/ui` — exclusive component system for ALL sites, apps, dashboards, admin consoles, calendars, and portals; NO Angular / NO Spartan UI) | D1/Neon | Drizzle v1-rc | Better Auth | Stripe + Link (default) · Square on request | Inngest | Amazon SES | Bun | Playwright v1.63+ | PostHog | Sentry

## Rules

- **OpenSpec Change Ownership — Plan & Decompose Early (`rules/openspec-change-ownership.md`)**: Before substantial implementation, map authorized work into coherent **OpenSpec changes** (one outcome · bounded scope · acceptance · dependencies · verification; small enough for one agent). Each active change has exactly ONE owning agent instance that directly performs EVERY subtask — design, code, tests, docs, fixes, artifact upkeep, completion verification; NEVER split one change's checklist across agents (a reviewer reports, the owner fixes). **Parallelize ACROSS changes, not within one** — to add implementers, split into more changes (the dispatch unit is the whole change, owned end-to-end). On discovering a concrete high-value improvement at ANY phase, immediately preserve it in OpenSpec with real content (problem · evidence · benefit · scope · priority · deps · acceptance), updating the matching change or opening a scoped proposal routed to its owner; capturing a proposal ≠ authorization to build it.
- **Atomic `Commit → Push → Publish (Live Deploy + CDN Purge) → Live Edge Verify` Mandate (TOP-LEVEL SYSTEM PROMPT RULE)**: Every prompt touching a site, worker, or app MUST automatically build, commit, push to `origin/main`, **publish/deploy live (`pnpm deploy` / `npx wrangler deploy`)**, purge the Cloudflare CDN cache, and verify the live production domain (`https://<domain>/`, `/api/health`, `/og.png`, `/favicon.svg`, `/apple-touch-icon.png`) in the same turn. Never treat `git push` alone as completion without publishing live.
- **Hydration and OpenSpec delivery.** Follow [the parallel delivery workflow](rules/parallel-multi-swarm-orchestration.md) for material engineering work.
- **Dogfood Principle (`@theme.tools#main`) & Canonical Brand Logo Registry**:
  - **`voice.build`**: `/logos/10-sovereign-voice-crown-signature-ideogram.png` (`/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/voice-build.png`).
  - **`qubes.cloud`**: `/logos/10-sovereign-voice-crown-signature-ideogram.png` (`10-sovereign-qubes-crown-signature-ideogram.png`, `/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/qubes-cloud.png`).
  - **`publish.engineer`**: `/logos/08-sacred-folio-lissajous.png` (`/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/publish-engineer.png`).
  - **`post.vision`**: `/logos/06-chronos-timeline-horizon-ideogram.png` (`/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/post-vision.png`).
  - **`template.company`**: `/logos/05-titanium-company-foundry-ideogram.png` (`05-titanium-company-foundry-transparent.png`, `/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/template-company.png`).
  - **`status.charity`**: `/logos/06-verifiable-altruism-spectrogram-ideogram.png` (`06-verifiable-altruism-spectrogram-transparent.png`, `/favicon.svg`, `/apple-touch-icon.png`, `home.megabyte.space` `/icons/status-charity.png`).
  - **`questionl.ink`**: `/logos/08-sacred-dialectic-lissajous-ideogram.png` (`08-sacred-dialectic-lissajous-transparent.png`, recolored to the website's `#060610` canvas, `#0B0B18` card, `#00E5FF` cyan, and `#7C3AED` violet OKLCH palette with zero pink/magenta; Question-Mark Equalizer Waveform icon from Edition 10 adapted to `#060610`/`#00E5FF`/`#7C3AED` with Lissajous orbital rings for `/favicon.svg`, `/apple-touch-icon.png`, `/android-chrome-192x192.png`, `/android-chrome-512x512.png`, `/icon-192.png`, `/icon-512.png`, and `home.megabyte.space` `/icons/question-link.png` — used ONLY for the app icon & favicon, while the navbar displays only the `QUESTIONL.INK` wordmark without the icon; and `1200x630` `/og.png` & `/featured-image.png` with `"Train repositories by answering questions"`).
  - **`radiant.website`**: `/logos/06-chromatic-raytrace-spectrogram-ideogram.png` (square horizontal-line gradient spectrogram `/favicon.svg` & `/apple-touch-icon.png`, and `home.megabyte.space` `/icons/radiant-website.png`).
  - **Post-Crowning Dashboard Hygiene (Remove 10-Edition Logo Studio Once Crowned)**: When a project's official logo has been crowned from the 10-edition Codex+Ideogram exploration suite (e.g., `08-sacred-dialectic-lissajous-ideogram.png` for `questionl.ink`), remove the 10-edition Coming Soon Logo Studio / edition switcher / scope-trainer marketing block from below the live application dashboard (`/`) so the production app dashboard only shows its core functional UI (navbar + user pages / get-started prompts).
- TypeScript strict, never `any`, prefer `interface` over `type`
- Hono inline handlers for RPC type inference
- Zod validation on all inputs
- TDD: failing test first, Playwright 6 breakpoints
- Dark-first design, #060610 bg, #00E5FF accent
- Deploy to CF Workers, purge CDN after every deploy

See CONVENTIONS.md for full patterns.
<!-- EMDASH:POLICY:BEGIN id="operational-prompt-hydration" version="1.3.0" digest="sha256:ab50d27fdd31042024a610e9572536725d7c35a68d38872202863bc5b3342cc9" source-revision="ab50d27fdd31042024a610e9572536725d7c35a6" -->
Split material engineering requests into research-backed briefs guided by repository context and applicable skills. Have a frontier architect compile independently verifiable OpenSpec changes. Give each change one owner through verification. Dispatch ready changes concurrently within approved capacity, using OpenCode with DeepSeek through LiteLLM where suitable and recording provider exceptions. During implementation, capture and admit justified improvements in OpenSpec, and route reusable application code, host configuration, and agent procedures to theme.tools, install.doctor, and agent-skills respectively. Verify integrated results, update documentation and consumers, and deliver authorized changes. Refresh evidence until no justified in-scope work remains and preserve resumable state.

The policy is projected only through supported user-controlled repository, global, plugin, harness, coordinator, and worker surfaces. It never claims to replace provider-controlled system or developer instructions. Explicit user corrections, platform constraints, authorization boundaries, and higher-priority instructions remain controlling.
<!-- EMDASH:POLICY:END -->
