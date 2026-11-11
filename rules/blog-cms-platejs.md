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

## Resolved decisions (owner, 2026-11-10) — the estate default

- **Publish rights = OWNER ALLOWLIST.** Public OAuth lets anyone authenticate, so sign-in ≠ publish.
  Only allowlisted identities open the editor / publish; a signed-in non-owner sees "request access" and
  may only SUBMIT via the public tip/PR queue (`#34`), never auto-publish. (`authenticate ≠ authorize`.)
- **Save = DIRECT COMMIT to `main`** → auto-deploy (fast, true 1-click; fits solo + main-only). Contributor
  submissions are the PR path; the owner's own edits commit directly.
- **Social sign-in SHIPS FIRST (GitHub + Google); magic-email is deferred** until an authorized email
  sending credential for the domain exists (estate rail = Amazon SES) — GitHub/Google need no email, so
  they are never blocked; magic-email is a specific, recorded blocker, never a faked success.
- **Images = Cloudflare R2** (CF-native bucket + CDN URL; repo stays lean) with alt text + provenance
  REQUIRED on every upload. Not committed into the repo.
- **Auth lib = Better Auth** + a small **D1 session store scoped to the editor surface**; the public blog
  stays stateless (no runtime store on the read path).

## Anti-patterns

- A per-site bespoke CMS / editor fork instead of consuming the `@theme.tools` packages.
- Showing Add/Edit to anonymous readers, or a global flag that leaks the buttons publicly.
- A runtime DB holding article CONTENT (breaks content-as-code + the stateless-public posture).
- Treating "signed in" as "may publish" (authenticate ≠ authorize); `noindex`/hidden-button as access control.
- Claiming magic-email works with no authorized email provider (a fake success — report the blocker).
