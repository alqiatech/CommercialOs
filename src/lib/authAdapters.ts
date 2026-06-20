import type { AuthApiUser } from './apiClient'
import { currentUser as fallbackUser } from '@/data'
import type { User } from '@/types'
import type { DemoCompany } from '@/data/demoCompanies'
import { demoCompanies } from '@/data/demoCompanies'

function fallbackCompanyForIndustry(industryKey: DemoCompany['industry_key']): DemoCompany {
  return demoCompanies.find(company => company.industry_key === industryKey) ?? demoCompanies[0]
}

export function adaptApiUserToAppUser(apiUser: AuthApiUser): User {
  return {
    ...fallbackUser,
    ...apiUser,
    auth_user_id: apiUser.auth_user_id ?? apiUser.id,
    role_id: `role_${apiUser.role_type}`,
    timezone: apiUser.timezone ?? fallbackUser.timezone,
    preferences: apiUser.preferences ?? {},
    created_at: apiUser.created_at ?? fallbackUser.created_at,
    updated_at: apiUser.updated_at ?? fallbackUser.updated_at,
  }
}

export function adaptAccessibleCompanies(apiUser: AuthApiUser): DemoCompany[] {
  const mapped = (apiUser.user_company_access ?? [])
    .map(access => access.companies)
    .filter((company): company is NonNullable<(NonNullable<AuthApiUser['user_company_access']>[number])['companies']> => Boolean(company))
    .map((company) => {
      const industryKey = (company.industry_key as DemoCompany['industry_key']) ?? 'automotriz'
      const fallback = fallbackCompanyForIndustry(industryKey)
      const demoKey = typeof company.settings?.demo_key === 'string' ? company.settings.demo_key : company.id

      return {
        ...fallback,
        id: demoKey,
        db_company_id: company.id,
        name: company.name,
        short_name: company.name,
        industry_key: industryKey,
        industry_label: fallback.industry_label,
        city: company.city ?? fallback.city,
        country: company.country ?? fallback.country,
        status: company.status === 'active' ? 'active' : 'suspended',
      } satisfies DemoCompany
    })

  return mapped.length > 0 ? mapped : demoCompanies
}
