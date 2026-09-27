---
name: "angular"
priority: 2
pack: "angular"
triggers:
  - "angular"
  - "nx"
  - "monorepo"
  - "rxjs"
  - "observable"
  - "spartan"
  - "spartan ui"
paths:
  - "stack:angular-nx"
last_reviewed: 2026-09-26
superseded_by: null
---

# Angular — Nx Monorepo · RxJS-First · Spartan UI · Large-App Architecture

The complete Angular doctrine (fires when `stack-selector`/`frontend-stack` picks Angular). Standalone + signals + zoneless Angular 22 in an Nx monorepo, RxJS at every backend edge, Spartan UI as the sole component kit, built for apps that may exceed 200k LOC. (Consolidated 2026-09-26 from angular-nx-monorepo + rxjs-first-angular + spartan-ui-only + spartan-ui-design-system + angular-large-app-supervisor.)

## Stack + Nx Monorepo

Build inside an **Nx monorepo running Angular 22** with **Angular CLI MCP**. Standalone only. Signals only. No NgModules.

- **Angular 22** pinned `22.x` in `package.json` + `angular.json`. **Nx 22** wrapper; `nx.json` at root; apps under `apps/`, libs under `libs/`.
- **Standalone components** ONLY (NgModules banned). `provideRouter` / `provideHttpClient` / `provideAnimationsAsync` in `app.config.ts`.
- **Signals** (`signal`, `computed`, `effect`, `linkedSignal`, `resource`) for state. NO RxJS subjects for component state.
- **Typed Reactive Forms** (`FormGroup<T>`, `FormControl<T>`) + **NGX Formly** for schema-driven forms, Zod-backed (`zod-to-json-schema`). No template-driven forms.
- **Lazy-loaded routes** (`loadComponent` / `loadChildren`, one route file per feature) + **`@defer`** blocks for below-fold / role-conditional.
- **Zoneless** — `provideZonelessChangeDetection()` (default since 21); drop Zone.js. **Incremental hydration** — `provideClientHydration(withIncrementalHydration())`.
- **`httpResource()`** (Angular 21 stable) for read-only HTTP→signal; RxJS for mutations/compose/polling (see below).
- **`provideHttpClient(withFetch(), withInterceptors([...]))`** — typed interceptors (auth / tenant / role / error).
- **Angular CDK** + **Floating UI** for overlays/drag-drop/virtual-scroll/positioning/a11y. **Tailwind v4** (OxIDE) + OKLCH brand tokens.
- **esbuild** application builder. **SSR via `@angular/ssr` on Cloudflare Workers** (behind an adapter per `cloudflare-hostable-supervisor`) for SEO-critical + large surfaces.
- **Ionic 8 + Capacitor 8** for MOBILE NATIVE SHELLS ONLY. **Tauri 2** for desktop.
- **Angular built-in i18n** (`@angular/localize`) — NOT ngx-translate, NOT Transloco.
- **ESLint 9 + Prettier + @angular-eslint + eslint-plugin-rxjs**, `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.
- **Vitest** via `@analogjs/vitest-angular` (Karma deprecated since 17). **Playwright** TDD-RED first per `e2e-tdd-organization`. **MSW** for API mocks (dev + Storybook + Playwright). **Storybook 10** for the component library.

### Workspace creation

- New repo: `create-nx-workspace --preset=angular-monorepo --bundler=esbuild --e2eTestRunner=playwright --unitTestRunner=vitest --packageManager=bun`.
- Existing: `npx nx@latest init` → `npx nx add @nx/angular@latest` → generate app `--standalone --bundler=esbuild --e2eTestRunner=playwright`.
- Prefer Angular CLI MCP (`mcp__angular-cli__generate`); fall back to `npx nx g @nx/angular:*`.
- Required Nx plugins: `@nx/angular` · `@nx/playwright` · `@nx/vite` · `@nx/eslint` · `@nx/js`.
- See `reference/angular-nx-monorepo.md` for exact commands, the app skeleton tree, routing/service/interceptor examples, full Nx build+test reference, migration steps.

### Banned

- ❌ NgModules · template-driven forms · RxJS subjects for component state (use signals)
- ❌ Any UI kit other than Spartan + CDK + Floating UI · ngx-translate / Transloco (use `@angular/localize`)
- ❌ ts-node / nodemon (Node 24 native TS + Nx executors) · Karma+Jasmine (Vitest) · Protractor (Playwright)
- ❌ `[ngStyle]` / `[ngClass]` for static bindings · `[(ngModel)]` in Reactive-Forms context

## RxJS-First at Every Backend Edge

Every backend interaction is an **RxJS observable stream**, never a one-shot promise. Polling is the floor; SSE/WebSockets the ceiling. Signals bridge only at the template via `toSignal()`. `firstValueFrom()` defeats the contract.

- HTTP / WebSocket / SSE / postMessage / IndexedDB → `Observable<T>`; component state derived via `toSignal(stream$, { initialValue })`.
- Services keep streams observable to compose `retry`, `debounceTime`, `switchMap`, `combineLatest`, `merge`, `share`, `takeUntilDestroyed`, `repeat`, `interval`.

### Do

- **HTTP** → `HttpClient` returns Observable; keep it (never `firstValueFrom` in the service).
- **WebSocket** → `webSocket()` from `rxjs/webSocket`, never hand-rolled `new WebSocket()`. **SSE** → `fromEventSource()` helper or `fromEvent(source, 'message')`.
- **Polling fallback** → `http.get(url).pipe(repeat({ delay: 5000 }), shareReplay(1))`. **Template** → `toSignal(source$, { initialValue })`.
- **Reactive forms** → `valueChanges` piped `debounceTime + distinctUntilChanged + switchMap`.
- **Cancel** → `takeUntilDestroyed(this.destroyRef)`. **Retry** → `retry({ count: 3, delay: (_, n) => timer(Math.min(2 ** n * 250, 30_000)) })` (helper `libs/util-rxjs/src/retry-with-backoff.ts`).

### Don't

- ❌ `await firstValueFrom(this.api.foo())` / `lastValueFrom()` for simplicity · hand-rolled `setInterval` refresh in a component.
- ❌ Subscribe without `takeUntilDestroyed()` or `| async` · `effect(() => doHttp(signal()))` (use `toObservable(signal$).pipe(switchMap(...))`).
- ❌ Hand-rolled `Subject` for one-direction streams — `BehaviorSubject` only with a meaningful initial value; else `share({ connector: () => new ReplaySubject(1) })`.

### Util library (`libs/util-rxjs/`) + testing + gate

- `retryWithBackoff` · `fromEventSource` · `pollWhile` · `multiplexedSocket` · `pauseWhenHidden` · `cacheFirst`.
- Marble-test every operator chain via `TestScheduler` (don't `await firstValueFrom` in tests).
- `eslint-plugin-rxjs`: no nested subscribes, no manual unsubscribe, no `firstValueFrom`/`lastValueFrom` in service files; `rxjs/operators` legacy import blocked; TS-strict `Observable<T>` return types on every public service method.
- See `reference/rxjs-first-angular.md` for the full service+component example, polling/SSE/WebSocket patterns.

## Spartan UI — the sole component system

**Spartan UI** (the shadcn-for-Angular port) is THE Angular UI component library — admin AND marketing, one kit. **NO PrimeNG / Material / Taiga / NG-ZORRO / Kendo / Syncfusion / Ionic-as-UI. Mixing kits = build fail.** (Reversed 2026-05-29 from the prior "PrimeNG for admin" split — two design systems doubled bundle + upgrade + theme surface.) OSS, owns-the-code (copied into `libs/ui/`, not black-boxed), Tailwind-composed, Angular CDK + Floating UI underneath. React-stack counterpart: `[[shadcn-design-system]]`.

- Pair with **Angular CDK** (overlays, drag-drop, virtual-scroll, a11y) + **Floating UI** (tooltip/popover positioning); **Tippy.js** only where it beats Floating UI ergonomics.
- **When Spartan lacks a primitive**, compose from CDK + Floating UI + Tailwind tokens FIRST. Allowed heavy fallbacks (each gets a `package-decision-matrix.md` row): **AG Grid Community** (100k+ row grids only; TanStack Table+Virtual for normal lists) · **FullCalendar** · **Embla Carousel** · **PhotoSwipe** · **Apache ECharts / Unovis / @visx**.

### Design direction (ProjectSites cockpit)

- **black / cyan / white**, dark-first (`#03070a`/`#060610` canvas, `#00e5ff` accent, `#e8fbff` ink) — reuse cockpit OKLCH tokens from `text-contrast` + `_cockpit.scss`. Compact developer-console feel · `tabular-nums` · icon-rich · strong hierarchy · premium SaaS polish · keyboard-first (Cmd+K palette, `?` overlay).

### Pattern library (build once, compose everywhere)

- **Shell:** app-shell · responsive sidebar · top command bar · breadcrumbs · command palette · global search · tenant/project switcher · theme + language switcher (Angular i18n).
- **Feedback:** notification center (psnotify per `notifications-email-webhooks-supervisor`) · toast · modal/dialog · drawer · shortcut overlay.
- **4-state system (NON-NEGOTIABLE per surface):** loading skeleton · empty (→ first action) · error (→ retry + correlation id) · success.
- **Data:** smart list · smart table (TanStack Table) · advanced grid (AG Grid only for 100k+ rows) · virtualized list (TanStack Virtual) · saved views/filter presets · bulk-actions toolbar.
- **Media/editors** (per `forms-editors-content-supervisor`): media picker · uploader (Uppy) · code editor (Monaco+Shiki) · preview · visual editor (GrapesJS) · rich text (Lexical).
- **Insight:** chart cards · metric cards (`<app-rolling-counter>` per `cinematic-ui-patterns`) · activity timeline · audit-log viewer · health panel (ECharts/Unovis per `visualization-maps-diagrams-supervisor`).
- Compose from the library — never re-implement a shell/table/empty-state per screen (that's drift). Every interactive element: `:focus-visible` cyan ring ≥3:1, 24px min target, CDK a11y semantics. Motion subtle + reduced-motion-safe; View Transitions on route nav only (shell stays static).

### Existing-PrimeNG migration (never rip-and-replace)

Per `no-staging-doctrine` + `main-only-branch`: 1) install Spartan alongside PrimeNG (additive); 2) build new screens with Spartan from day 1; 3) migrate one PrimeNG screen per convergence pass behind the same route + a flag; 4) flip to stable once parity + 6-viewport + axe-clean + smoke-green; 5) delete the PrimeNG component; 6) remove `primeng` + `primeicons` when all screens migrated. Stand up the Spartan shell + pattern library FIRST; remove PrimeNG + preset LAST (never before Spartan replaces it, or the live admin breaks).

## Large-App Architecture (dashboards · SaaS · admin · PWA · multi-tenant · >200k LOC)

- **Angular Router** with lazy routes (one file per feature) + **feature modules** (`libs/features/<slug>/`). Shell (sidebar/topbar) mounts ONCE; only the content outlet swaps. **No full-page reloads on internal nav** (verify with a SPA sentinel + nav-entry count per `e2e-tdd-organization`).
- **Every feature surface ships the DoD:** Types + Zod at every boundary (`zod-everywhere` · `validation-error-handling-supervisor`) · contract-first typed API validated both ends (`contract-first-ai` · `hono-api`) · the 4-state system · WCAG 2.2 AA + keyboard-first + 6-breakpoint responsive · observability (telemetry + structured logs + trace IDs) · robust error handling with correlation IDs, never leaking secrets/stack traces (`error-recovery`) · Vitest units + Playwright E2E (homepage-first, real-auth) · feature flag where rollout risk exists (`feature-flags`) + tenant isolation (`auth-permissions-security-supervisor`) · JSDoc + module README.
- **Supervisor loop** (per `autonomous-engineering`): audit → plan → ONE coherent vertical slice → implement → typecheck → test → polish UI → harden errors → docs → repeat. Finished vertical slices over scattered partials.
