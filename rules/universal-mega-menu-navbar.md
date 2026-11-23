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

## 2. Left Slot: Creative, Memorable Ideogram-Generated Logo Emblem + Wordmark

- **Ideogram Brand Emblem Mandate**: The navbar logo lockup MUST include a creative, interesting, memorable, catchy, cool brand emblem generated via Ideogram (`POST https://api.ideogram.ai/v1/ideogram-v3/generate` when `IDEOGRAM_API_KEY` is available, with high-craft AI vision / Sharp transparent-alpha emblem generation fallback when offline) paired with the high-weight brand wordmark.
- **Transparent & Crisp at All Viewports**: Process the generated emblem to strip dark/solid backgrounds to transparent alpha, trim margins tightly, and serve multi-resolution WebP/PNG (`128w`, `256w`, `512w`) beside the wordmark so the emblem floats cleanly on the glassmorphic dark navbar (`#060610` / `bg-bg-primary/90`).

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
