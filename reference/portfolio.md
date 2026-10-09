# Portfolio Catalog — product identities

Source-of-truth catalog of distinct emdash products. **Catalog only** — this file never
authorizes touching either product's website or app; it records intended identity + capability
so any agent working the estate keeps the two surfaces distinct and on-brand.

- **Why here, not `~/emdash-projects/PORTFOLIO.md`** — that dir is absent on this machine, so per
  the §8 directive the catalog lives at `reference/portfolio.md` (router-invisible, zero token
  cost until read, per `reference/README.md`). If `~/emdash-projects/` is later created, mirror
  these entries into `PORTFOLIO.md` and leave this as the fallback.
- **Label key** — **[V] VERIFIED** = stated in the 2026-10-08 directive OR corroborated by estate
  docs (cited). **[I] INFERRED** = reasonable extrapolation, NOT yet confirmed; treat as a
  hypothesis to validate before building against it.
- **Sibling products** (estate-confirmed, not cataloged here yet) — projectsites.dev,
  fundl.ink, grantl.ink, and the rest of `CONVENTIONS.md § Owned Domains`.

---

## DeskLink — `deskl.ink`

Remote-desktop + AI-agent **desktop infrastructure**: provision, control, and share desktops for
humans, AI agents, and hybrid workflows.

### Identity [V]

- **Domain** — `deskl.ink` (live; shipped on `deskl-ink-api.manhattan.workers.dev` before the
  custom-domain attach — `rules/domain-named-project-dns.md § Reference incident 2026-10-04`).
- **Repo** — `heymegabyte/deskl.ink` (main) — `machines/ubuntu-proxmox-primary.md § Confirmed
  project identities`.
- **Category** — remote-desktop + AI-agent desktop infra (directive §8).

### Intended capabilities [V — from the directive]

- Multi-desktop (operate more than one desktop per account/session).
- Browser-based VNC access (desktops reachable in the browser, no native client).
- BYO-desktop onboarding (connect your own machine as a managed desktop).
- Copyable setup scripts (one-paste provisioning of a BYO desktop).
- Hosted provisioning (DeskLink stands up desktops for you).
- Persistent AND disposable environments (long-lived vs throwaway).
- Multi-distro (more than one Linux distribution / OS image).
- Lifecycle management (provision → run → stop/idle → delete).
- MCP desktop control (drive a desktop over Model Context Protocol).
- Agent integration (AI agents operate desktops as a tool).
- Human / AI / hybrid workflows (any mix of operator types on one desktop).

### Inferred [I — validate before relying on]

- **Stack** — Cloudflare Workers backend (`deskl-ink-api`) [V the worker exists]; the control
  plane / UI stack is otherwise unconfirmed [I].
- **Positioning** — the desktop-infra sibling to GitLink's repo-discovery; complementary, not
  overlapping [I].
- Browser-VNC transport, per-desktop resource quotas, cost controls, and SSH/IDE access modes
  (Coder-style) are plausible given the lifecycle + BYO framing but are NOT stated [I].

---

## GitLink — `gitl.ink`

AI-driven **GitHub repository discovery + evaluation**: find, score, compare, and curate the best
repos far better than GitHub's native search.

### Identity [V]

- **Domain** — `gitl.ink` — `CONVENTIONS.md § Owned Domains`.
- **Repo** — `heymegabyte/gitl.ink` (main) — `machines/ubuntu-proxmox-primary.md § Confirmed
  project identities`.
- **Category** — AI GitHub repo discovery / evaluation (directive §8).

### Intended capabilities [V — from the directive]

- Superior search (beats GitHub-native repo search).
- Semantic / AI discovery (intent + meaning, not keyword-only).
- Quality scores (per-repo quality signal).
- Ratings + rankings (ordered, comparable).
- Comparative analysis (repo-vs-repo head-to-head).
- Curated browsing (editorial / topical collections).
- Rich profiles (deep per-repo detail pages).
- Multimedia explainers (video / audio / visual repo walkthroughs).
- Recommendations (personalized / contextual suggestions).
- Best-repo selection (pick the single best repo for a need).

### Inferred [I — validate before relying on]

- **Stack** — Cloudflare-native (estate default) [I]; no worker/UI stack confirmed in docs yet.
- **Data source** — GitHub API + AI scoring pipeline; scores likely blend stars/activity/code
  signals with LLM judgement, but the exact rubric is unstated [I].
- **Positioning** — the discovery sibling to DeskLink's desktop infra; the two share brand +
  estate, not scope [I].

---

## Do-not-touch

- This catalog is descriptive. Do NOT modify `deskl.ink` or `gitl.ink` website/app code from a
  cataloging task — a build against either needs its own directive.
- Keep the two identities SEPARATE: DeskLink = desktops/infra, GitLink = repo discovery/eval.
  Never merge their capability lists or copy.
