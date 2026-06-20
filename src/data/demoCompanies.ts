// ─────────────────────────────────────────────────────────────────────────────
// EMPRESAS DEMO — Alqia Commercial OS
// Nombres genéricos por industria. Sin marcas reales, sin nombres de clientes.
// Ver demoNamingPolicy.ts para reglas completas.
// ─────────────────────────────────────────────────────────────────────────────

import type { IndustryKey } from './industryTemplates'

export interface DemoCompany {
  id: string
  db_company_id?: string
  name: string
  short_name: string
  industry_key: IndustryKey
  industry_label: string
  city: string
  country: string
  size: 'startup' | 'pyme' | 'mediana' | 'grande'
  plan: 'starter' | 'growth' | 'enterprise'
  demo_description: string
  primary_color?: string
  status: 'active' | 'trial' | 'suspended'
}

export const demoCompanies: DemoCompany[] = [
  {
    id: 'cmp_001',
    name: 'Unidad Automotriz Demo',
    short_name: 'Unidad Automotriz Demo',
    industry_key: 'automotriz',
    industry_label: 'Automotriz',
    city: 'Guadalajara',
    country: 'México',
    size: 'pyme',
    plan: 'growth',
    demo_description: 'Agencia automotriz con base de leads acumulados de 3 años y bajo porcentaje de seguimiento.',
    status: 'active',
  },
  {
    id: 'cmp_002',
    name: 'Unidad Industrial Demo',
    short_name: 'Unidad Industrial Demo',
    industry_key: 'distribucion_industrial',
    industry_label: 'Distribución Industrial',
    city: 'Monterrey',
    country: 'México',
    size: 'mediana',
    plan: 'growth',
    demo_description: 'Distribuidora de equipos y refacciones industriales con ciclos de venta de 30–60 días.',
    status: 'active',
  },
]

export const defaultCompanyId = 'cmp_001'
export const getCompanyById = (id: string) => demoCompanies.find(c => c.id === id) ?? demoCompanies[0]
