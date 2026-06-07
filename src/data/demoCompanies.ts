// ─────────────────────────────────────────────────────────────────────────────
// EMPRESAS DEMO — Alqia Commercial OS
// Nombres genéricos por industria. Sin marcas reales, sin nombres de clientes.
// Ver demoNamingPolicy.ts para reglas completas.
// ─────────────────────────────────────────────────────────────────────────────

import type { IndustryKey } from './industryTemplates'

export interface DemoCompany {
  id: string
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
    name: 'Demo Automotriz',
    short_name: 'Demo Automotriz',
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
    name: 'Demo Industrial',
    short_name: 'Demo Industrial',
    industry_key: 'distribucion_industrial',
    industry_label: 'Distribución Industrial',
    city: 'Monterrey',
    country: 'México',
    size: 'mediana',
    plan: 'growth',
    demo_description: 'Distribuidora de equipos y refacciones industriales con ciclos de venta de 30–60 días.',
    status: 'active',
  },
  {
    id: 'cmp_003',
    name: 'Demo Inmobiliaria',
    short_name: 'Demo Inmobiliaria',
    industry_key: 'inmobiliaria',
    industry_label: 'Inmobiliaria',
    city: 'Ciudad de México',
    country: 'México',
    size: 'mediana',
    plan: 'growth',
    demo_description: 'Desarrolladora inmobiliaria residencial con proyectos en preventa y cartera activa.',
    status: 'active',
  },
  {
    id: 'cmp_004',
    name: 'Demo Servicios',
    short_name: 'Demo Servicios',
    industry_key: 'servicios_profesionales',
    industry_label: 'Servicios Profesionales',
    city: 'Ciudad de México',
    country: 'México',
    size: 'pyme',
    plan: 'starter',
    demo_description: 'Consultora de servicios profesionales con cartera de propuestas activas.',
    status: 'active',
  },
  {
    id: 'cmp_005',
    name: 'Demo SaaS',
    short_name: 'Demo SaaS',
    industry_key: 'saas_membresias',
    industry_label: 'SaaS / Membresías',
    city: 'Ciudad de México',
    country: 'México',
    size: 'startup',
    plan: 'starter',
    demo_description: 'Plataforma SaaS con trials activos y riesgo de churn en etapas tempranas.',
    status: 'active',
  },
  {
    id: 'cmp_006',
    name: 'Demo Salud',
    short_name: 'Demo Salud',
    industry_key: 'clinicas_salud',
    industry_label: 'Salud y Clínicas',
    city: 'Tijuana',
    country: 'México',
    size: 'pyme',
    plan: 'growth',
    demo_description: 'Clínica de salud y bienestar con captación activa de pacientes locales e internacionales.',
    status: 'active',
  },
  {
    id: 'cmp_007',
    name: 'Demo Turismo Médico',
    short_name: 'Demo Turismo Médico',
    industry_key: 'turismo_medico',
    industry_label: 'Turismo Médico',
    city: 'Monterrey',
    country: 'México',
    size: 'pyme',
    plan: 'growth',
    demo_description: 'Coordinadora de turismo médico para pacientes internacionales con procedimientos en México.',
    status: 'active',
  },
  {
    id: 'cmp_008',
    name: 'Demo Exportación B2B',
    short_name: 'Demo Exportación',
    industry_key: 'tequilera_exportacion',
    industry_label: 'Exportación B2B',
    city: 'Jalisco',
    country: 'México',
    size: 'mediana',
    plan: 'enterprise',
    demo_description: 'Empresa exportadora artesanal con presencia internacional y pipeline activo de nuevos distribuidores.',
    status: 'active',
  },
]

export const defaultCompanyId = 'cmp_001'
export const getCompanyById = (id: string) => demoCompanies.find(c => c.id === id) ?? demoCompanies[0]
