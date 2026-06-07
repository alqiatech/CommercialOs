-- ============================================================
-- PORTALIA REVENUE OS — Migración inicial v1
-- Ejecutar en Supabase: Dashboard → SQL Editor → New query
-- O con Supabase CLI: supabase db push
-- ============================================================

-- ── Extensiones ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- búsqueda fuzzy por nombre
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- normalización de acentos

-- ── Enum types ────────────────────────────────────────────────────────────────
CREATE TYPE status_t AS ENUM ('active','inactive','suspended','archived');
CREATE TYPE actor_type_t AS ENUM ('user','ai','system','integration');
CREATE TYPE channel_t AS ENUM ('whatsapp','email','phone','sms','note','meeting','form','system');
CREATE TYPE direction_t AS ENUM ('inbound','outbound','internal');
CREATE TYPE consent_t AS ENUM ('granted','denied','unknown','expired');
CREATE TYPE contact_status_t AS ENUM ('active','unreachable','duplicate_merged','do_not_contact','invalid','archived');
CREATE TYPE opportunity_status_t AS ENUM ('open','won','lost','paused','archived','reactivation');
CREATE TYPE stage_type_t AS ENUM ('intake','qualification','contact','proposal','negotiation','closing','won','lost','reactivation');
CREATE TYPE task_priority_t AS ENUM ('low','medium','high','critical');
CREATE TYPE task_status_t AS ENUM ('pending','in_progress','completed','cancelled','overdue');
CREATE TYPE task_type_t AS ENUM ('call','whatsapp','email','meeting','quote','proposal','review','follow_up','data_fix','approval');
CREATE TYPE severity_t AS ENUM ('info','low','medium','high','critical');
CREATE TYPE role_type_t AS ENUM ('super_admin_alqia','owner','admin','sales_director','sales_manager','sales_rep','analyst','support','guest');
CREATE TYPE import_status_t AS ENUM ('pending','processing','completed','failed','cancelled');

-- ── TENANTS ───────────────────────────────────────────────────────────────────
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  legal_name      TEXT,
  status          status_t NOT NULL DEFAULT 'active',
  plan            TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','growth','enterprise')),
  billing_email   TEXT,
  owner_user_id   UUID,
  settings        JSONB NOT NULL DEFAULT '{}',
  branding        JSONB NOT NULL DEFAULT '{}',
  ai_enabled      BOOLEAN NOT NULL DEFAULT false,
  automation_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── COMPANIES ─────────────────────────────────────────────────────────────────
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  industry        TEXT,
  industry_template TEXT,
  business_type   TEXT,
  website         TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  country         TEXT NOT NULL DEFAULT 'MX',
  timezone        TEXT NOT NULL DEFAULT 'America/Monterrey',
  branding        JSONB NOT NULL DEFAULT '{}',
  settings        JSONB NOT NULL DEFAULT '{}',
  status          status_t NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- ── USERS ─────────────────────────────────────────────────────────────────────
-- Los usuarios de Supabase Auth se referencian por auth_user_id
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  auth_user_id    UUID UNIQUE,                   -- Supabase Auth UID
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  role_type       role_type_t NOT NULL DEFAULT 'sales_rep',
  company_ids     UUID[] NOT NULL DEFAULT '{}',  -- empresas a las que tiene acceso
  status          status_t NOT NULL DEFAULT 'active',
  timezone        TEXT NOT NULL DEFAULT 'America/Monterrey',
  last_login_at   TIMESTAMPTZ,
  preferences     JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ── PIPELINES ─────────────────────────────────────────────────────────────────
CREATE TABLE pipelines (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  industry_template TEXT,
  description     TEXT,
  is_default      BOOLEAN NOT NULL DEFAULT false,
  status          status_t NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PIPELINE STAGES ───────────────────────────────────────────────────────────
CREATE TABLE pipeline_stages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  pipeline_id         UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  order_index         INTEGER NOT NULL DEFAULT 0,
  probability_default INTEGER NOT NULL DEFAULT 0 CHECK (probability_default BETWEEN 0 AND 100),
  max_days_in_stage   INTEGER,
  stage_type          stage_type_t NOT NULL DEFAULT 'intake',
  color               TEXT NOT NULL DEFAULT '#718096',
  rules               JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CONTACTS ──────────────────────────────────────────────────────────────────
CREATE TABLE contacts (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id                  UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name                  TEXT NOT NULL DEFAULT '',
  last_name                   TEXT,
  full_name                   TEXT NOT NULL,
  normalized_name             TEXT GENERATED ALWAYS AS (lower(unaccent(full_name))) STORED,
  email                       TEXT,
  normalized_email            TEXT GENERATED ALWAYS AS (lower(trim(email))) STORED,
  phone                       TEXT,
  normalized_phone            TEXT,
  whatsapp_phone              TEXT,
  city                        TEXT,
  state                       TEXT,
  country                     TEXT DEFAULT 'MX',
  preferred_channel           channel_t,
  consent_status              consent_t NOT NULL DEFAULT 'unknown',
  data_trust_score            INTEGER NOT NULL DEFAULT 0 CHECK (data_trust_score BETWEEN 0 AND 100),
  lead_intent_score           INTEGER NOT NULL DEFAULT 0 CHECK (lead_intent_score BETWEEN 0 AND 100),
  urgency_score               INTEGER NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 100),
  identity_verification_status TEXT NOT NULL DEFAULT 'unverified',
  tags                        TEXT[] NOT NULL DEFAULT '{}',
  source                      TEXT,
  owner_user_id               UUID REFERENCES users(id) ON DELETE SET NULL,
  import_batch_id             UUID,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  status                      contact_status_t NOT NULL DEFAULT 'active',
  last_contact_at             TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsqueda y deduplicación
CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(normalized_email) WHERE email IS NOT NULL;
CREATE INDEX idx_contacts_phone ON contacts(normalized_phone) WHERE normalized_phone IS NOT NULL;
CREATE INDEX idx_contacts_name_trgm ON contacts USING GIN (normalized_name gin_trgm_ops);

-- ── OPPORTUNITIES ─────────────────────────────────────────────────────────────
CREATE TABLE opportunities (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pipeline_id         UUID NOT NULL REFERENCES pipelines(id),
  stage_id            UUID NOT NULL REFERENCES pipeline_stages(id),
  contact_id          UUID NOT NULL REFERENCES contacts(id),
  owner_user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  product_interest    TEXT,
  estimated_value     NUMERIC(15,2),
  currency            TEXT NOT NULL DEFAULT 'MXN',
  probability         INTEGER NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  lead_intent_score   INTEGER NOT NULL DEFAULT 0 CHECK (lead_intent_score BETWEEN 0 AND 100),
  data_trust_score    INTEGER NOT NULL DEFAULT 0 CHECK (data_trust_score BETWEEN 0 AND 100),
  urgency_score       INTEGER NOT NULL DEFAULT 0 CHECK (urgency_score BETWEEN 0 AND 100),
  status              opportunity_status_t NOT NULL DEFAULT 'open',
  lost_reason         TEXT,
  won_at              TIMESTAMPTZ,
  lost_at             TIMESTAMPTZ,
  expected_close_date DATE,
  last_contact_at     TIMESTAMPTZ,
  next_action_at      TIMESTAMPTZ,
  ai_summary          TEXT,
  metadata            JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opportunities_tenant ON opportunities(tenant_id);
CREATE INDEX idx_opportunities_company ON opportunities(company_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX idx_opportunities_status ON opportunities(status);
CREATE INDEX idx_opportunities_contact ON opportunities(contact_id);
CREATE INDEX idx_opportunities_owner ON opportunities(owner_user_id);

-- ── INTERACTIONS ──────────────────────────────────────────────────────────────
CREATE TABLE interactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  agent_type      actor_type_t NOT NULL DEFAULT 'user',
  channel         channel_t NOT NULL,
  direction       direction_t NOT NULL DEFAULT 'outbound',
  subject         TEXT,
  content         TEXT,
  summary         TEXT,
  sentiment       TEXT CHECK (sentiment IN ('positive','neutral','negative')),
  intent          TEXT,
  outcome         TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interactions_opportunity ON interactions(opportunity_id);
CREATE INDEX idx_interactions_contact ON interactions(contact_id);
CREATE INDEX idx_interactions_occurred ON interactions(occurred_at DESC);

-- ── TASKS ─────────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  type            task_type_t NOT NULL DEFAULT 'follow_up',
  title           TEXT NOT NULL,
  description     TEXT,
  priority        task_priority_t NOT NULL DEFAULT 'medium',
  status          task_status_t NOT NULL DEFAULT 'pending',
  due_at          TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_opportunity ON tasks(opportunity_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due ON tasks(due_at) WHERE status NOT IN ('completed','cancelled');

-- ── AI FINDINGS ───────────────────────────────────────────────────────────────
CREATE TABLE ai_findings (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id                UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  type                      TEXT NOT NULL,
  severity                  severity_t NOT NULL DEFAULT 'medium',
  title                     TEXT NOT NULL,
  description               TEXT,
  evidence                  TEXT,
  affected_count            INTEGER NOT NULL DEFAULT 0,
  estimated_revenue_impact  NUMERIC(15,2),
  recommended_action        TEXT,
  confidence                NUMERIC(4,3) NOT NULL DEFAULT 0.5,
  action_type               TEXT,
  dismissed_at              TIMESTAMPTZ,
  dismissed_by              UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_findings_company ON ai_findings(company_id);
CREATE INDEX idx_findings_dismissed ON ai_findings(dismissed_at) WHERE dismissed_at IS NULL;

-- ── IMPORT BATCHES ────────────────────────────────────────────────────────────
CREATE TABLE import_batches (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  filename              TEXT NOT NULL,
  original_row_count    INTEGER NOT NULL DEFAULT 0,
  processed_count       INTEGER NOT NULL DEFAULT 0,
  contacts_created      INTEGER NOT NULL DEFAULT 0,
  contacts_updated      INTEGER NOT NULL DEFAULT 0,
  duplicates_found      INTEGER NOT NULL DEFAULT 0,
  invalid_count         INTEGER NOT NULL DEFAULT 0,
  ready_for_cadence     INTEGER NOT NULL DEFAULT 0,
  avg_trust_score       INTEGER NOT NULL DEFAULT 0,
  status                import_status_t NOT NULL DEFAULT 'pending',
  error_message         TEXT,
  column_mapping        JSONB NOT NULL DEFAULT '{}',
  metrics               JSONB NOT NULL DEFAULT '{}',
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RAW LEADS ─────────────────────────────────────────────────────────────────
-- Registros originales de importación antes de procesarse como contacts
CREATE TABLE raw_leads (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  import_batch_id   UUID NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
  contact_id        UUID REFERENCES contacts(id) ON DELETE SET NULL,
  raw_data          JSONB NOT NULL DEFAULT '{}',
  cleaned_data      JSONB NOT NULL DEFAULT '{}',
  trust_score       INTEGER NOT NULL DEFAULT 0,
  classification    TEXT NOT NULL DEFAULT 'needs_review',
  duplicate_of      UUID REFERENCES raw_leads(id) ON DELETE SET NULL,
  duplicate_type    TEXT,
  flags             TEXT[] NOT NULL DEFAULT '{}',
  processed         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_raw_leads_batch ON raw_leads(import_batch_id);
CREATE INDEX idx_raw_leads_classification ON raw_leads(classification);

-- ── CADENCES ──────────────────────────────────────────────────────────────────
CREATE TABLE cadences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  trigger_event   TEXT,
  industry_template TEXT,
  status          status_t NOT NULL DEFAULT 'active',
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cadence_steps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cadence_id      UUID NOT NULL REFERENCES cadences(id) ON DELETE CASCADE,
  day_offset      INTEGER NOT NULL DEFAULT 0,
  channel         channel_t NOT NULL,
  action_type     TEXT NOT NULL,
  template        TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  order_index     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE cadence_enrollments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cadence_id      UUID NOT NULL REFERENCES cadences(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  enrolled_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  current_step    INTEGER NOT NULL DEFAULT 0,
  next_step_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── AUDIT LOG ─────────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type      actor_type_t NOT NULL DEFAULT 'user',
  action          TEXT NOT NULL,
  entity_type     TEXT,
  entity_id       UUID,
  changes         JSONB,
  metadata        JSONB NOT NULL DEFAULT '{}',
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ── UPDATED_AT triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pipelines_updated BEFORE UPDATE ON pipelines FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_pipeline_stages_updated BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_opportunities_updated BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_cadences_updated BEFORE UPDATE ON cadences FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
-- Activar RLS en todas las tablas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Función helper: obtener tenant_id del usuario actual
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Función helper: obtener role del usuario actual
CREATE OR REPLACE FUNCTION auth_role_type()
RETURNS role_type_t AS $$
  SELECT role_type FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Políticas de acceso: usuarios solo ven datos de su tenant
CREATE POLICY tenant_isolation ON tenants USING (id = auth_tenant_id());
CREATE POLICY tenant_isolation ON companies USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON users USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON pipelines USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON pipeline_stages USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON contacts USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON opportunities USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON interactions USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON tasks USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON ai_findings USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON import_batches USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON raw_leads USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON cadences USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON cadence_enrollments USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON audit_logs USING (tenant_id = auth_tenant_id());

-- cadence_steps se accede vía cadence_id (sin tenant directo)
CREATE POLICY cadence_steps_access ON cadence_steps
  USING (cadence_id IN (SELECT id FROM cadences WHERE tenant_id = auth_tenant_id()));
