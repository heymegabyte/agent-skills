-- keyword-research — D1 control-plane schema (migration 0001).
--
-- MULTI-TENANT by construction: every row that belongs to a customer carries
-- BOTH a tenant_id AND a project_id, and EVERY query in src/db.ts is scoped by
-- one of those columns. There is no table a tenant can read without its id in
-- the WHERE clause. Indexes exist for exactly the scoped access paths.
--
-- Metrics follow the service's null-doctrine: an UNKNOWN metric is stored as
-- SQL NULL (never 0). Monetary + volume columns are nullable on purpose.
--
-- Applied locally in tests against a better-sqlite3-backed D1 shim, and at P7b
-- against the real D1 database (database_id filled in then).

-- --- Tenants -------------------------------------------------------------
-- A tenant is the billing/isolation boundary (one Cloudflare Access org, one
-- service-token identity, …). Projects hang off a tenant.
CREATE TABLE IF NOT EXISTS tenants (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

-- --- Projects ------------------------------------------------------------
-- A project = one domain under research for one tenant. (tenant_id, domain)
-- is unique so re-registering a domain for the same tenant is idempotent.
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  domain      TEXT NOT NULL,
  locale      TEXT NOT NULL,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_projects_tenant_domain ON projects (tenant_id, domain);

-- --- Keyword opportunities ----------------------------------------------
-- The persisted, scored opportunities. Scoped by project_id (and tenant_id,
-- carried redundantly so a tenant-level sweep never has to join).
CREATE TABLE IF NOT EXISTS keyword_opportunities (
  id                          TEXT PRIMARY KEY,
  project_id                  TEXT NOT NULL,
  tenant_id                   TEXT NOT NULL,
  keyword                     TEXT NOT NULL,
  locale                      TEXT NOT NULL,
  intent                      TEXT NOT NULL,
  monthly_search_volume       INTEGER,          -- NULL = unknown, never 0
  volume_source               TEXT,
  organic_keyword_difficulty  REAL,
  cpc                         REAL,
  opportunity_score           REAL NOT NULL,
  recommended_action          TEXT NOT NULL,
  collected_at                TEXT NOT NULL,
  data_freshness              REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_opps_project ON keyword_opportunities (project_id);
CREATE INDEX IF NOT EXISTS idx_opps_tenant ON keyword_opportunities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_opps_project_score ON keyword_opportunities (project_id, opportunity_score DESC);
-- One row per (project, keyword, locale): re-running research upserts in place.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_opps_project_keyword_locale
  ON keyword_opportunities (project_id, keyword, locale);

-- --- Research jobs -------------------------------------------------------
-- The queue-backed job records. state ∈ queued|running|done|error|dead_letter.
CREATE TABLE IF NOT EXISTS research_jobs (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL,
  tenant_id    TEXT NOT NULL,
  state        TEXT NOT NULL,
  enqueued_at  TEXT NOT NULL,
  started_at   TEXT,
  finished_at  TEXT,
  attempts     INTEGER NOT NULL DEFAULT 0,
  error        TEXT
);
CREATE INDEX IF NOT EXISTS idx_jobs_project ON research_jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON research_jobs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_state ON research_jobs (state);

-- --- Research history ----------------------------------------------------
-- A pointer to each persisted report in R2 (the report bytes live in R2, not
-- D1). Scoped by project_id.
CREATE TABLE IF NOT EXISTS research_history (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL,
  tenant_id     TEXT NOT NULL,
  report_r2_key TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_history_project ON research_history (project_id);
CREATE INDEX IF NOT EXISTS idx_history_tenant ON research_history (tenant_id);

-- --- Cost ledger ---------------------------------------------------------
-- Every costed provider call appends a row here; the circuit breaker sums
-- actual_cost over the rolling monthly window to enforce the $20/mo cap.
CREATE TABLE IF NOT EXISTS cost_ledger (
  id             TEXT PRIMARY KEY,
  project_id     TEXT NOT NULL,
  tenant_id      TEXT NOT NULL,
  provider       TEXT NOT NULL,
  endpoint       TEXT NOT NULL,
  estimated_cost REAL NOT NULL,
  actual_cost    REAL,              -- NULL until the call settles
  created_at     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_project ON cost_ledger (project_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant ON cost_ledger (tenant_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON cost_ledger (created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_tenant_created ON cost_ledger (tenant_id, created_at);

-- --- Provider meta -------------------------------------------------------
-- Per-project provider health snapshot (status + last_checked). PK is the
-- (project_id, provider) pair.
CREATE TABLE IF NOT EXISTS provider_meta (
  project_id   TEXT NOT NULL,
  tenant_id    TEXT NOT NULL,
  provider     TEXT NOT NULL,
  status       TEXT NOT NULL,
  last_checked TEXT NOT NULL,
  PRIMARY KEY (project_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_provider_meta_tenant ON provider_meta (tenant_id);
