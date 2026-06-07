// ─────────────────────────────────────────────────────────────────────────────
// DEMO NAMING POLICY — Alqia Commercial OS
// Los datos de demo deben ser completamente sanitizados.
// No usar nombres reales de clientes, prospectos, amigos, empresas ni marcas.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_NAMING_POLICY = {
  allowRealBrands: false,
  allowRealClientNames: false,
  allowFriendCompanyNames: false,
  allowRealPersonNames: false,
  useIndustryOnly: true,
  useGenericDemoNames: true,
  note: 'Los datos demo deben ser sanitizados. No usar nombres reales de clientes, prospectos, amigos, empresas o marcas comerciales.',
}

// Nombres genéricos permitidos para personas demo
export const DEMO_PERSON_NAMES = [
  'Contacto Demo 01', 'Contacto Demo 02', 'Contacto Demo 03',
  'Contacto Demo 04', 'Contacto Demo 05', 'Contacto Demo 06',
  'Ejecutivo Demo 01', 'Ejecutivo Demo 02', 'Ejecutivo Demo 03',
  'Gerente Demo 01', 'Gerente Demo 02',
]

// Nombres genéricos para vendedores
export const DEMO_SELLER_NAMES = [
  'Vendedor Demo 01', 'Vendedor Demo 02', 'Vendedor Demo 03',
  'Vendedor Demo 04', 'Gerente Demo', 'Director Comercial Demo',
]

// Nombres genéricos para cuentas B2B
export const DEMO_ACCOUNT_NAMES = [
  'Empresa Prospecto 01', 'Empresa Prospecto 02', 'Empresa Prospecto 03',
  'Cuenta Industrial Demo', 'Cuenta Exportación Demo',
  'Corporativo Demo 01', 'Grupo Demo 01',
]
