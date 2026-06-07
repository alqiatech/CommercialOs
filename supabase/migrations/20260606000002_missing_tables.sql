-- ============================================================
-- PORTALIA — Migración 002: Tablas faltantes
-- Corrige error: unaccent() no es IMMUTABLE en GENERATED COLUMNS
-- Solución: función wrapper IMMUTABLE + tablas pendientes
-- ============================================================

-- ── Función inmutable para unaccent ───────────────────────────────────────────
-- Necesaria porque las columnas GENERATED requieren funciones IMMUTABLE
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
  SELECT unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- ── CONTACTS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id                  UUID REFERENCES companies(id) ON DELETE SET NULL,
  first_name                  TEXT NOT NULL DEFAULT '',
  last_name                   TEXT,
  full_name                   TEXT NOT NULL,
  normalized_name             TEXT GENERATED ALWAYS AS (lower(immutable_unaccent(full_name))) STORED,
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

CREATE INDEX IF NOT EXISTS idx_contacts_tenant   ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company  ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email    ON contacts(normalized_email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_phone    ON contacts(normalized_phone) WHERE normalized_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING GIN (normalized_name gin_trgm_ops);

-- ── IMPORT_BATCHES ────────────────────────────────────────────────────────────
-- (va antes de raw_leads porque raw_leads lo referencia)
CREATE TABLE IF NOT EXISTS import_batches (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  filename        TEXT NOT NULL,
  total_rows      INTEGER NOT NULL DEFAULT 0,
  processed_rows  INTEGER NOT NULL DEFAULT 0,
  created_rows    INTEGER NOT NULL DEFAULT 0,
  updated_rows    INTEGER NOT NULL DEFAULT 0,
  duplicate_rows  INTEGER NOT NULL DEFAULT 0,
  error_rows      INTEGER NOT NULL DEFAULT 0,
  status          import_status_t NOT NULL DEFAULT 'pending',
  column_map      JSONB NOT NULL DEFAULT '{}',
  settings        JSONB NOT NULL DEFAULT '{}',
  error_log       JSONB NOT NULL DEFAULT '[]',
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_tenant  ON import_batches(tenant_id);
CREATE INDEX IF NOT EXISTS idx_import_batches_company ON import_batches(company_id);

-- ── RAW_LEADS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
  raw_data        JSONB NOT NULL DEFAULT '{}',
  mapped_data     JSONB NOT NULL DEFAULT '{}',
  cleaning_report JSONB NOT NULL DEFAULT '{}',
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','merged','created','rejected','duplicate')),
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  duplicate_of    UUID REFERENCES contacts(id) ON DELETE SET NULL,
  trust_score     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_leads_batch   ON raw_leads(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_raw_leads_contact ON raw_leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_raw_leads_tenant  ON raw_leads(tenant_id);

-- ── OPPORTUNITIES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS opportunities (
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
  probability         INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  won_at              TIMESTAMPTZ,
  lost_at             TIMESTAMPTZ,
  lost_reason         TEXT,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  metadata            JSONB NOT NULL DEFAULT '{}',
  ai_summary          TEXT,
  next_best_action    TEXT,
  status              opportunity_status_t NOT NULL DEFAULT 'open',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_tenant   ON opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opp_company  ON opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opp_contact  ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opp_stage    ON opportunities(stage_id);
CREATE INDEX IF NOT EXISTS idx_opp_status   ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opp_owner    ON opportunities(owner_user_id);

-- ── INTERACTIONS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS interactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  actor_type      actor_type_t NOT NULL DEFAULT 'user',
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  channel         channel_t NOT NULL,
  direction       direction_t NOT NULL DEFAULT 'outbound',
  subject         TEXT,
  body            TEXT,
  ai_generated    BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB NOT NULL DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_int_tenant   ON interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_int_contact  ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_int_opp      ON interactions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_int_occurred ON interactions(occurred_at DESC);

-- ── TASKS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  assigned_to     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  type            task_type_t NOT NULL DEFAULT 'follow_up',
  priority        task_priority_t NOT NULL DEFAULT 'medium',
  status          task_status_t NOT NULL DEFAULT 'pending',
  title           TEXT NOT NULL,
  description     TEXT,
  due_at          TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  ai_generated    BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant  ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_opp     ON tasks(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user    ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due     ON tasks(due_at) WHERE status = 'pending';

-- ── AI_FINDINGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_findings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  finding_type    TEXT NOT NULL,
  severity        severity_t NOT NULL DEFAULT 'info',
  title           TEXT NOT NULL,
  description     TEXT,
  recommendation  TEXT,
  confidence      INTEGER DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  is_read         BOOLEAN NOT NULL DEFAULT false,
  is_actioned     BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB NOT NULL DEFAULT '{}',
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_findings_tenant ON ai_findings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ai_findings_unread ON ai_findings(tenant_id) WHERE is_read = false;

-- ── CADENCES ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cadences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CADENCE_STEPS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cadence_steps (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cadence_id      UUID NOT NULL REFERENCES cadences(id) ON DELETE CASCADE,
  step_order      INTEGER NOT NULL,
  channel         channel_t NOT NULL,
  delay_days      INTEGER NOT NULL DEFAULT 0,
  template_id     TEXT,
  subject         TEXT,
  body_template   TEXT,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cadence_steps_cadence ON cadence_steps(cadence_id);

-- ── CADENCE_ENROLLMENTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cadence_enrollments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cadence_id      UUID NOT NULL REFERENCES cadences(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  opportunity_id  UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  current_step    INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','cancelled')),
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_cadence ON cadence_enrollments(cadence_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_contact ON cadence_enrollments(contact_id);

-- ── AUDIT_LOGS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_type      actor_type_t NOT NULL DEFAULT 'user',
  actor_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     UUID,
  changes         JSONB NOT NULL DEFAULT '{}',
  ip_address      INET,
  user_agent      TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tenant   ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_occurred ON audit_logs(occurred_at DESC);

-- ── Actualizar FK de import_batches en contacts ───────────────────────────────
ALTER TABLE contacts
  DROP CONSTRAINT IF EXISTS contacts_import_batch_id_fkey;
ALTER TABLE contacts
  ADD CONSTRAINT contacts_import_batch_id_fkey
  FOREIGN KEY (import_batch_id) REFERENCES import_batches(id) ON DELETE SET NULL;

-- ── Trigger updated_at para las nuevas tablas ─────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_import_batches_updated_at
  BEFORE UPDATE ON import_batches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_cadences_updated_at
  BEFORE UPDATE ON cadences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER trg_cadence_enrollments_updated_at
  BEFORE UPDATE ON cadence_enrollments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── RLS para nuevas tablas ────────────────────────────────────────────────────
ALTER TABLE contacts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_findings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches       ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_leads            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadences             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_steps        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadence_enrollments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs           ENABLE ROW LEVEL SECURITY;

-- Políticas de aislamiento por tenant
CREATE POLICY "tenant_isolation_contacts" ON contacts
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tenant_isolation_opportunities" ON opportunities
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tenant_isolation_interactions" ON interactions
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tenant_isolation_tasks" ON tasks
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tenant_isolation_ai_findings" ON ai_findings
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tenant_isolation_import_batches" ON import_batches
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tenant_isolation_raw_leads" ON raw_leads
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tenant_isolation_cadences" ON cadences
  USING (tenant_id = auth_tenant_id());
CREATE POLICY "tenant_isolation_audit_logs" ON audit_logs
  USING (tenant_id = auth_tenant_id());

-- ── Confirmar ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  RAISE NOTICE 'Migración 002 completada — tablas creadas: contacts, opportunities, interactions, tasks, ai_findings, import_batches, raw_leads, cadences, cadence_steps, cadence_enrollments, audit_logs';
END $$;
