# Blog CMS — theme.tools-owned PlateJS, auth-gated, Git-backed (the DEFAULT for every blog)

**Brian directive 2026-11-10.** UNLESS a project states otherwise, **every blog the estate builds uses ONE
reusable CMS pattern owned by `@theme.tools`** — never a per-site reimplementation. A visitor reads a static
blog; the owner gets an **"Add Blog Post"** button on the blog index and an **"Edit Post"** button on each
post that, **after sign-in**, open a **PlateJS** editor whose save is a **Git commit**.

Cross-links: `[[theme-tools-canonical-components]]` · `[[blog-content-standard]]` (content-quality SSOT) ·
`[[inline-editing]]` · `[[public-front-door]]` · `[[embarrassingly-easy-to-use]]` · `[[feature-flags]]` ·
`[[zod-everywhere]]`. Reference impl + consumer #1: `desktop.management` OpenSpec `platejs-blog-editing`.

## The mandate (settled by the directive)

- **Add/Edit affordances on the page** — "Add Blog Post" on `/blog`, "Edit Post" on each `/blog/:slug`.
  Gated **per request on the owner session** (never a global flag) → never shown to anonymous readers, never
  a dead control. Byte-identical public HTML for the signed-out; the admin surface is never advertised.
- **Sign in BEFORE the editor opens** — the directive requires **GitHub + Google + magic e-mail link**.
  Use **Better Auth** (estate default: CF-native on Hono, OSS — NEVER Clerk; `[[code-style]]` § Hono/auth).
  Opening a post or a new post REQUIRES an authenticated, authorized owner session — enforced server-side
  on the route, not just hidden in the UI (`noindex`/hiding is never access control, `#44`).
- **Editor = PlateJS** (`@udecode/plate-*`), a **lazy React island** — NEVER in the public SSR bundle.
  It binds to the lossless serialization contract `@theme.tools/blog/editor` (`toPlateValue`/`fromPlateValue`).
- **Git-backed, content-as-code** — a save is a **commit** (GitHub Contents API / PR). NO runtime editorial
  DB for article content; the repo stays the source of truth. The only runtime store is the auth session
  store (small, editor-surface-scoped) — the **public blog stays stateless** (`#42`/`#50`).
- **theme.tools-owned + REUSABLE across sites** — the whole CMS (auth config + editor island + Add/Edit
  helpers + git-write client + admin routes) lives in `@theme.tools` (`@theme.tools/auth` + `@theme.tools/blog`),
  **parameterized per site** (repo coordinates · content path · publish-allowlist · feature flag). A site
  WIRES it; it never forks it (`[[theme-tools-canonical-components]]`, `[[drift-detection]]` reusable-code rule).
- **This is the DEFAULT for ALL blogs** unless a specific project explicitly states a different model.

## Open decisions (being finalized with the owner — do not hard-code until answered)

- **Who may publish after sign-in** — public OAuth lets anyone authenticate, so sign-in ≠ publish-rights.
  Default recommendation: an **owner allowlist** edits/publishes; a signed-in non-owner may only SUBMIT
  (a PR / the `#34` tip queue), never auto-publish.
- **Save mechanism** — direct commit to `main` (fast, 1-click) vs open a PR + preview deploy (review gate).
- **Magic-email delivery** — magic-link needs an email provider (estate rail = Amazon SES). GitHub + Google
  work with NO email; magic-email is BLOCKED until a sending credential for the domain is authorized (`#31`-class).
- **Image uploads** — R2 bucket vs commit into the repo `public/` (content-as-code) vs deterministic SVG-only.

## Anti-patterns

- A per-site bespoke CMS / editor fork instead of consuming the `@theme.tools` packages.
- Showing Add/Edit to anonymous readers, or a global flag that leaks the buttons publicly.
- A runtime DB holding article CONTENT (breaks content-as-code + the stateless-public posture).
- Treating "signed in" as "may publish" (authenticate ≠ authorize); `noindex`/hidden-button as access control.
- Claiming magic-email works with no authorized email provider (a fake success — report the blocker).
