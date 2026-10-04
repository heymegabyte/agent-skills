# Skill Profiles

`01-operating-system` is always the base. Pull the smallest profile matching repo/prompt. Never preload every reference doc.

## Domain → Profile

| Pattern | Profile |
|---------|---------|
| `*-foundation`, `*-mission`, `*-charity`, `donate-*`, `give-*` | Nonprofit |
| `*-api`, `api.*`, `*-service`, `*-sdk` | API Service |
| `*-cli`, `*-tool`, `*-lib`, `*-plugin` | Developer Tool |
| `*-app`, `*-dashboard`, `*-portal`, `*-hub` | SaaS |
| `*-ops`, `*-admin`, `*-internal`, `*-backoffice` | Internal Tool |
| `*-micro`, `*-nano`, one-feature repos | Micro-SaaS |
| everything else | Marketing Site |

### Ambiguous cases

- Angular + auth + billing → **SaaS**
- `wrangler.toml` + minimal routes → **Marketing** or **API**
- DB schema + background jobs → **SaaS**
- Single Hono route file → **API Service**
- Internal-only auth → **Internal Tool**

### Process skills — add the flow

For any project type, when the work is **multi-step** (plan→build→review→merge), add the process chain directly after `01`:

1. brainstorm — before ANY creative work
2. write the plan — bite-sized verifiable steps
3. isolate the workspace — native worktree or git worktree
4. build — one subagent per independent task, task review after each
5. code review — dispatch reviewer before merge (Agent Diversity Review gate)
6. receive feedback — verify technically, then act
7. finish — merge, push, clean up (`[[no-staging-doctrine]]` auto-push)

See `commands/process.md` — `/process` runs the full chain in one keystroke.

Skip steps that don't apply (finish-branch on solo auto-push work; worktrees when already isolated) — but the order is inviolable.

## Marketing Site

- `02`
- `06/contact-forms-and-endpoints`
- `06/custom-error-pages`
- `06/domain-provisioning`
- `06/easter-eggs`
- `06/internationalization`
- `06/web-manifest-system`
- `09/seo-and-keywords`
- `09/email-templates`
- `10`
- `11`
- `12`
- `21`
- `22`
- `23`
- `25`
- `26`

## SaaS Application

### Core + refs (load first)

- `05/api-design-and-documentation`
- `05/auth-and-session-management`
- `05/background-jobs-and-workflows`
- `05/drizzle-orm-and-migrations`
- `05/enterprise-multi-tenancy`
- `05/mcp-and-cloud-integrations`

### Build (06)

- `06/admin-dashboard`
- `06/ai-chat-widget`
- `06/data-tables`
- `06/empty-states-and-loading`
- `06/file-uploads-and-storage`
- `06/keyboard-shortcuts-and-command-palette`
- `06/notification-center`
- `06/onboarding-and-first-run`
- `06/realtime-and-websockets`
- `06/rich-text-editor`
- `06/site-search`
- `06/webhook-system`

### Quality (07)

- `07/accessibility-gate`
- `07/agentic-security`
- `07/performance-optimization`
- `07/security-hardening`

### Deploy (08)

- `08/ci-cd-pipeline`
- `08/backup-and-disaster-recovery`
- `08/uptime-and-health`

### Content (09)

- `09/documentation-and-codebase-hygiene`
- `09/seo-and-keywords`

### Growth (13)

- `13/analytics-configuration`
- `13/conversion-optimization`
- `13/feature-flags-and-experiments`
- `13/stripe-billing`
- `13/user-feedback-collection`

### Requirements packs

- `21`
- `22`
- `23`
- `24`
- `25`
- `26`
- `27`

## Micro-SaaS

Trimmed SaaS.

### Architecture (05)

- `05/api-design-and-documentation`
- `05/auth-and-session-management`
- `05/drizzle-orm-and-migrations`

### Build (06)

- `06/contact-forms-and-endpoints`
- `06/custom-error-pages`
- `06/file-uploads-and-storage`
- `06/notification-center`
- `06/site-search`
- `06/webhook-system`

### Quality (07)

- `07/performance-optimization`
- `07/security-hardening`

### Content (09)

- `09/seo-and-keywords`

### Growth (13)

- `13/conversion-optimization`
- `13/email-marketing-and-listmonk`
- `13/feature-flags-and-experiments`
- `13/stripe-billing`

### Requirements packs

- `21`
- `22`
- `25`
- `26`

## Nonprofit

- `02`
- `06/blog-and-content-engine`
- `06/contact-forms-and-endpoints`
- `06/domain-provisioning`
- `06/easter-eggs`
- `06/internationalization`
- `06/web-manifest-system`
- `09/email-templates`
- `09/seo-and-keywords`
- `09/social-automation`
- `13/stripe-billing`
- `13/user-feedback-collection`
- `21`
- `22`
- `23`
- `25`
- `26`

## API Service

### Architecture (05)

- `05/api-design-and-documentation`
- `05/auth-and-session-management`
- `05/background-jobs-and-workflows`
- `05/cf-auto-provision`
- `05/drizzle-orm-and-migrations`
- `05/enterprise-multi-tenancy`
- `05/mcp-and-cloud-integrations`
- `05/openapi-generation`
- `05/shared-api-pool`

### Planning + Build

- `02`
- `06/realtime-and-websockets`
- `06/webhook-system`

### Quality (07)

- `07/agentic-security`
- `07/contract-testing`
- `07/performance-optimization`
- `07/security-hardening`

### Deploy (08)

- `08/backup-and-disaster-recovery`
- `08/changelog-and-releases`
- `08/ci-cd-pipeline`
- `08/uptime-and-health`

### Growth (13)

- `13/feature-flags-and-experiments`
- `13/sentry-alert-rules`

### Requirements packs

- `21`
- `25`
- `26`
- `27`
- `28`

## Developer Tool

- `02`
- `05/api-design-and-documentation`
- `05/mcp-and-cloud-integrations`
- `07/security-hardening`
- `07/semgrep-codebase-rules`
- `08/changelog-and-releases`
- `08/ci-cd-pipeline`
- `09/documentation-and-codebase-hygiene`
- `09/seo-and-keywords`
- `12`

## Internal Tool

### Architecture (05)

- `05/api-design-and-documentation`
- `05/auth-and-session-management`
- `05/drizzle-orm-and-migrations`
- `05/enterprise-multi-tenancy`

### Build (06)

- `06/admin-dashboard`
- `06/chat-native-dashboard`
- `06/data-tables`
- `06/keyboard-shortcuts-and-command-palette`
- `06/notification-center`
- `06/site-search`

### Quality (07)

- `07/accessibility-gate`
- `07/agentic-security`
- `07/security-hardening`

### Deploy + Growth

- `08/uptime-and-health`
- `13/analytics-configuration`
- `13/feature-flags-and-experiments`

### Requirements packs

- `21`
- `24`
- `25`
- `26`
