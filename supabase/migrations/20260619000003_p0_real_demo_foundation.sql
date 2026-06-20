-- ============================================================
-- ALQIA COMMERCIAL OS — P0 demo funcional real
-- Base multiempresa con dos unidades demo, tablas operativas
-- faltantes, RLS por rol y seeds sin datos personales.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ── Compatibilidad de columnas solicitadas ──────────────────────────────────
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry_key TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';
UPDATE companies
SET industry_key = COALESCE(industry_key, industry_template, industry, 'automotriz')
WHERE industry_key IS NULL;

ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS total_rows INTEGER NOT NULL DEFAULT 0;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS processed_rows INTEGER NOT NULL DEFAULT 0;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS valid_rows INTEGER NOT NULL DEFAULT 0;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS invalid_rows INTEGER NOT NULL DEFAULT 0;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS duplicate_rows INTEGER NOT NULL DEFAULT 0;
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS mapping JSONB NOT NULL DEFAULT '{}';
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS summary JSONB NOT NULL DEFAULT '{}';
ALTER TABLE import_batches ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

ALTER TABLE raw_leads ADD COLUMN IF NOT EXISTS row_number INTEGER;
ALTER TABLE raw_leads ADD COLUMN IF NOT EXISTS raw_payload JSONB NOT NULL DEFAULT '{}';
ALTER TABLE raw_leads ADD COLUMN IF NOT EXISTS normalized_payload JSONB NOT NULL DEFAULT '{}';
ALTER TABLE raw_leads ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE raw_leads ADD COLUMN IF NOT EXISTS validation_status TEXT NOT NULL DEFAULT 'format_pending';
ALTER TABLE raw_leads ADD COLUMN IF NOT EXISTS duplicate_status TEXT NOT NULL DEFAULT 'unique';
ALTER TABLE raw_leads ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL;

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_validation_status TEXT NOT NULL DEFAULT 'format_pending';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone_validation_status TEXT NOT NULL DEFAULT 'format_pending';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp_validation_status TEXT NOT NULL DEFAULT 'not_verified';

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS conversion_score INTEGER NOT NULL DEFAULT 0 CHECK (conversion_score BETWEEN 0 AND 100);

ALTER TABLE interactions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type task_type_t;
UPDATE tasks SET task_type = COALESCE(task_type, type) WHERE task_type IS NULL;

-- ── Tablas mínimas faltantes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status status_t NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role role_type_t NOT NULL DEFAULT 'sales_rep',
  status status_t NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_company_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  access_level TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id, branch_id)
);

CREATE TABLE IF NOT EXISTS sales_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES sales_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_in_team TEXT NOT NULL DEFAULT 'sales_rep',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT,
  industry TEXT,
  website TEXT,
  email_domain TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'MX',
  status status_t NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'opportunities_account_id_fkey'
      AND table_name = 'opportunities'
  ) THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT opportunities_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  score_type TEXT NOT NULL,
  score_value INTEGER NOT NULL CHECK (score_value BETWEEN 0 AND 100),
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  calculated_by TEXT NOT NULL DEFAULT 'rules',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Helpers RLS por rol ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_role_type() IN ('super_admin_alqia','owner','admin','sales_director'), false)
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_is_manager()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(auth_role_type() IN ('super_admin_alqia','owner','admin','sales_director','sales_manager'), false)
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_can_access_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    auth_is_admin()
    OR EXISTS (
      SELECT 1 FROM user_company_access uca
      WHERE uca.user_id = auth_user_id()
        AND uca.company_id = target_company_id
    ),
    false
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── RLS tablas nuevas ───────────────────────────────────────────────────────
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON branches;
DROP POLICY IF EXISTS tenant_isolation ON profiles;
DROP POLICY IF EXISTS tenant_isolation ON user_company_access;
DROP POLICY IF EXISTS tenant_isolation ON sales_teams;
DROP POLICY IF EXISTS tenant_isolation ON team_members;
DROP POLICY IF EXISTS tenant_isolation ON accounts;
DROP POLICY IF EXISTS tenant_isolation ON scores;
DROP POLICY IF EXISTS tenant_isolation ON analytics_events;

CREATE POLICY tenant_isolation ON branches
  USING (tenant_id = auth_tenant_id() AND auth_can_access_company(company_id));
CREATE POLICY tenant_isolation ON profiles
  USING (tenant_id = auth_tenant_id());
CREATE POLICY tenant_isolation ON user_company_access
  USING (auth_is_manager() OR user_id = auth_user_id());
CREATE POLICY tenant_isolation ON sales_teams
  USING (tenant_id = auth_tenant_id() AND auth_can_access_company(company_id));
CREATE POLICY tenant_isolation ON team_members
  USING (
    auth_is_manager()
    OR user_id = auth_user_id()
    OR team_id IN (
      SELECT id FROM sales_teams
      WHERE tenant_id = auth_tenant_id()
        AND manager_user_id = auth_user_id()
    )
  );
CREATE POLICY tenant_isolation ON accounts
  USING (tenant_id = auth_tenant_id() AND auth_can_access_company(company_id));
CREATE POLICY tenant_isolation ON scores
  USING (tenant_id = auth_tenant_id() AND auth_can_access_company(company_id));
CREATE POLICY tenant_isolation ON analytics_events
  USING (tenant_id = auth_tenant_id() AND (company_id IS NULL OR auth_can_access_company(company_id)));

-- ── Políticas principales por rol/propietario ───────────────────────────────
DROP POLICY IF EXISTS tenant_isolation ON contacts;
DROP POLICY IF EXISTS tenant_isolation_contacts ON contacts;
CREATE POLICY contacts_role_access ON contacts
  USING (
    tenant_id = auth_tenant_id()
    AND auth_can_access_company(company_id)
    AND (auth_is_manager() OR owner_user_id = auth_user_id())
  );

DROP POLICY IF EXISTS tenant_isolation ON opportunities;
DROP POLICY IF EXISTS tenant_isolation_opportunities ON opportunities;
CREATE POLICY opportunities_role_access ON opportunities
  USING (
    tenant_id = auth_tenant_id()
    AND auth_can_access_company(company_id)
    AND (auth_is_manager() OR owner_user_id = auth_user_id())
  );

DROP POLICY IF EXISTS tenant_isolation ON tasks;
DROP POLICY IF EXISTS tenant_isolation_tasks ON tasks;
CREATE POLICY tasks_role_access ON tasks
  USING (
    tenant_id = auth_tenant_id()
    AND auth_can_access_company(company_id)
    AND (auth_is_manager() OR assigned_to = auth_user_id() OR created_by = auth_user_id())
  );

DROP POLICY IF EXISTS tenant_isolation ON interactions;
DROP POLICY IF EXISTS tenant_isolation_interactions ON interactions;
CREATE POLICY interactions_role_access ON interactions
  USING (
    tenant_id = auth_tenant_id()
    AND auth_can_access_company(company_id)
    AND (
      auth_is_manager()
      OR user_id = auth_user_id()
      OR actor_user_id = auth_user_id()
      OR opportunity_id IN (SELECT id FROM opportunities WHERE owner_user_id = auth_user_id())
      OR contact_id IN (SELECT id FROM contacts WHERE owner_user_id = auth_user_id())
    )
  );

-- ── Seed demo opcional, no personal y limitado a dos unidades ────────────────
DO $$
DECLARE
  v_demo_enabled BOOLEAN := COALESCE(NULLIF(current_setting('app.demo_seed_enabled', true), ''), 'true')::BOOLEAN;
  v_tenant_id UUID := '10000000-0000-0000-0000-000000000001';
  v_auto_company_id UUID := '20000000-0000-0000-0000-000000000001';
  v_industrial_company_id UUID := '20000000-0000-0000-0000-000000000002';
  v_auto_pipeline_id UUID := '30000000-0000-0000-0000-000000000001';
  v_industrial_pipeline_id UUID := '30000000-0000-0000-0000-000000000002';
  v_stage_names TEXT[];
  v_stage_name TEXT;
  v_idx INTEGER;
BEGIN
  IF NOT v_demo_enabled THEN
    RAISE NOTICE 'DEMO_SEED_ENABLED=false: seed demo omitido';
    RETURN;
  END IF;

  INSERT INTO tenants (id, name, slug, status, plan, settings)
  VALUES (v_tenant_id, 'Alqia Demo Tenant', 'alqia-demo-tenant', 'active', 'growth', '{"demo":true}')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, settings = EXCLUDED.settings;

  INSERT INTO companies (id, tenant_id, name, slug, industry, industry_template, industry_key, city, state, country, timezone, settings, status)
  VALUES
    (v_auto_company_id, v_tenant_id, 'Unidad Automotriz Demo', 'unidad-automotriz-demo', 'Automotriz', 'automotriz', 'automotriz', 'Guadalajara', 'Jalisco', 'MX', 'America/Mexico_City', '{"demo_key":"cmp_001","default_country":"MX"}', 'active'),
    (v_industrial_company_id, v_tenant_id, 'Unidad Industrial Demo', 'unidad-industrial-demo', 'Distribución Industrial', 'distribucion_industrial', 'distribucion_industrial', 'Monterrey', 'Nuevo León', 'MX', 'America/Mexico_City', '{"demo_key":"cmp_002","default_country":"MX"}', 'active')
  ON CONFLICT (tenant_id, slug) DO UPDATE
    SET name = EXCLUDED.name,
        industry_key = EXCLUDED.industry_key,
        settings = EXCLUDED.settings,
        status = EXCLUDED.status;

  INSERT INTO branches (tenant_id, company_id, name, status)
  VALUES
    (v_tenant_id, v_auto_company_id, 'Sucursal Demo Automotriz', 'active'),
    (v_tenant_id, v_industrial_company_id, 'Sucursal Demo Industrial', 'active')
  ON CONFLICT DO NOTHING;

  INSERT INTO pipelines (id, tenant_id, company_id, name, industry_template, is_default, status)
  VALUES
    (v_auto_pipeline_id, v_tenant_id, v_auto_company_id, 'Pipeline Automotriz Demo', 'automotriz', true, 'active'),
    (v_industrial_pipeline_id, v_tenant_id, v_industrial_company_id, 'Pipeline Industrial Demo', 'distribucion_industrial', true, 'active')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_default = true, status = 'active';

  v_stage_names := ARRAY['Lead nuevo','Validado','Contactado','Interesado','Cita o demostración','Cotización','Financiamiento o negociación','Cierre','Ganado','Perdido','Reactivación'];
  v_idx := 0;
  FOREACH v_stage_name IN ARRAY v_stage_names LOOP
    v_idx := v_idx + 1;
    INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, order_index, probability_default, max_days_in_stage, stage_type, rules)
    VALUES (
      v_tenant_id,
      v_auto_pipeline_id,
      v_stage_name,
      v_idx,
      CASE v_idx WHEN 1 THEN 5 WHEN 2 THEN 15 WHEN 3 THEN 25 WHEN 4 THEN 40 WHEN 5 THEN 55 WHEN 6 THEN 65 WHEN 7 THEN 75 WHEN 8 THEN 85 WHEN 9 THEN 100 WHEN 10 THEN 0 ELSE 35 END,
      7,
      CASE
        WHEN v_stage_name = 'Ganado' THEN 'won'::stage_type_t
        WHEN v_stage_name = 'Perdido' THEN 'lost'::stage_type_t
        WHEN v_stage_name = 'Reactivación' THEN 'reactivation'::stage_type_t
        WHEN v_idx <= 2 THEN 'qualification'::stage_type_t
        WHEN v_idx <= 4 THEN 'contact'::stage_type_t
        WHEN v_idx <= 6 THEN 'proposal'::stage_type_t
        ELSE 'negotiation'::stage_type_t
      END,
      '{"seed":"demo"}'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;

  v_stage_names := ARRAY['Lead empresa','Diagnóstico inicial','Requerimiento levantado','Propuesta preliminar','Cotización formal','Revisión técnica','Negociación','Orden de compra','Ganado','Perdido','Seguimiento futuro'];
  v_idx := 0;
  FOREACH v_stage_name IN ARRAY v_stage_names LOOP
    v_idx := v_idx + 1;
    INSERT INTO pipeline_stages (tenant_id, pipeline_id, name, order_index, probability_default, max_days_in_stage, stage_type, rules)
    VALUES (
      v_tenant_id,
      v_industrial_pipeline_id,
      v_stage_name,
      v_idx,
      CASE v_idx WHEN 1 THEN 5 WHEN 2 THEN 15 WHEN 3 THEN 30 WHEN 4 THEN 45 WHEN 5 THEN 60 WHEN 6 THEN 70 WHEN 7 THEN 80 WHEN 8 THEN 90 WHEN 9 THEN 100 WHEN 10 THEN 0 ELSE 30 END,
      14,
      CASE
        WHEN v_stage_name = 'Ganado' THEN 'won'::stage_type_t
        WHEN v_stage_name = 'Perdido' THEN 'lost'::stage_type_t
        WHEN v_stage_name = 'Seguimiento futuro' THEN 'reactivation'::stage_type_t
        WHEN v_idx <= 3 THEN 'qualification'::stage_type_t
        WHEN v_idx <= 5 THEN 'proposal'::stage_type_t
        ELSE 'negotiation'::stage_type_t
      END,
      '{"seed":"demo"}'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_industry_key ON companies(industry_key);
CREATE INDEX IF NOT EXISTS idx_user_company_access_user ON user_company_access(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_entity ON scores(entity_type, entity_id, score_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_company ON analytics_events(company_id, created_at DESC);

DO $$
BEGIN
  RAISE NOTICE 'Migración 003 P0 completada: dos unidades demo, tablas faltantes, RLS por rol y pipelines iniciales';
END $$;
