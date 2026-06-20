import { create } from 'zustand'
import { currentUser } from '@/data'
import { demoCompanies, defaultCompanyId, getCompanyById } from '@/data/demoCompanies'
import { getTemplate } from '@/data/industryTemplates'
import { getDataset } from '@/data/demoData'
import type { User, AuditLog, Contact, Opportunity, AiFinding, Interaction, Pipeline, PipelineStage } from '@/types'
import type { IndustryKey, IndustryTemplate } from '@/data/industryTemplates'
import type { DemoCompany } from '@/data/demoCompanies'
import type { ProcessResult } from '@/lib/apiClient'

// ── Estado global del AI Gateway ──────────────────────────────────────────────
export type AiStatus = 'unknown' | 'active' | 'mock' | 'error'
export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'
const ACTIVE_COMPANY_STORAGE_PREFIX = 'alqia-active-company'

function getActiveCompanyStorageKey(userId?: string) {
  return userId ? `${ACTIVE_COMPANY_STORAGE_PREFIX}:${userId}` : null
}

function readPersistedCompanyId(userId?: string) {
  const key = getActiveCompanyStorageKey(userId)
  return key ? localStorage.getItem(key) : null
}

function persistCompanyId(userId: string | undefined, companyId: string) {
  const key = getActiveCompanyStorageKey(userId)
  if (key) localStorage.setItem(key, companyId)
}

interface AppState {
  companies: DemoCompany[]
  activeCompanyId: string
  activeCompany: DemoCompany
  activeIndustryKey: IndustryKey
  activeIndustry: IndustryTemplate
  // Dataset activo — cambia completo al cambiar empresa
  activeContacts: Contact[]
  activeOpportunities: Opportunity[]
  activeAiFindings: AiFinding[]
  activeInteractions: Interaction[]
  activePipeline: Pipeline
  activeStages: PipelineStage[]
  currentUser: User
  authStatus: AuthStatus
  auditLog: AuditLog[]
  // Estado del motor IA
  aiStatus: AiStatus
  // Última importación procesada
  lastImportResult: ProcessResult | null
  // Tema de la interfaz
  theme: 'dark' | 'light'
  // Acciones
  setActiveCompany: (id: string) => void
  setCurrentUser: (user: User) => void
  setCompanies: (companies: DemoCompany[]) => void
  setAuthStatus: (status: AuthStatus) => void
  resetAuth: () => void
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'created_at'>) => void
  dismissFinding: (id: string) => void
  setAiStatus: (status: AiStatus) => void
  setLastImportResult: (result: ProcessResult) => void
  moveOpportunityStage: (oppId: string, stageId: string) => void
  updateOpportunityStatus: (oppId: string, status: Opportunity['status']) => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>((set, get) => {
  const initialCompany = getCompanyById(defaultCompanyId)
  const initialTemplate = getTemplate(initialCompany.industry_key)
  const initialDataset = getDataset(defaultCompanyId)

  return {
    companies: demoCompanies,
    activeCompanyId: defaultCompanyId,
    activeCompany: initialCompany,
    activeIndustryKey: initialCompany.industry_key,
    activeIndustry: initialTemplate,
    activeContacts: initialDataset.contacts,
    activeOpportunities: initialDataset.opportunities,
    activeAiFindings: initialDataset.aiFindings,
    activeInteractions: initialDataset.interactions,
    activePipeline: initialDataset.pipeline,
    activeStages: initialDataset.stages,
    currentUser,
    authStatus: 'anonymous',
    auditLog: [],
    aiStatus: 'unknown',
    lastImportResult: null,
    theme: (localStorage.getItem('alqia-theme') as 'dark' | 'light') ?? 'dark',

    setActiveCompany: (id) => {
      const company = get().companies.find(c => c.id === id) ?? getCompanyById(id)
      const template = getTemplate(company.industry_key)
      const dataset = getDataset(id)
      persistCompanyId(get().currentUser.auth_user_id, id)
      set({
        activeCompanyId: id,
        activeCompany: company,
        activeIndustryKey: company.industry_key,
        activeIndustry: template,
        activeContacts: dataset.contacts,
        activeOpportunities: dataset.opportunities,
        activeAiFindings: dataset.aiFindings,
        activeInteractions: dataset.interactions,
        activePipeline: dataset.pipeline,
        activeStages: dataset.stages,
      })
    },

    setCurrentUser: (user) => set({ currentUser: user }),

    setCompanies: (companies) => {
      const nextCompanies = companies.length > 0 ? companies : demoCompanies
      const persistedCompanyId = readPersistedCompanyId(get().currentUser.auth_user_id)
      const activeCompany = nextCompanies.find(company => company.id === persistedCompanyId)
        ?? nextCompanies.find(company => company.id === get().activeCompanyId)
        ?? nextCompanies[0]
      const template = getTemplate(activeCompany.industry_key)
      const dataset = getDataset(activeCompany.id)

      persistCompanyId(get().currentUser.auth_user_id, activeCompany.id)

      set({
        companies: nextCompanies,
        activeCompanyId: activeCompany.id,
        activeCompany,
        activeIndustryKey: activeCompany.industry_key,
        activeIndustry: template,
        activeContacts: dataset.contacts,
        activeOpportunities: dataset.opportunities,
        activeAiFindings: dataset.aiFindings,
        activeInteractions: dataset.interactions,
        activePipeline: dataset.pipeline,
        activeStages: dataset.stages,
      })
    },

    setAuthStatus: (status) => set({ authStatus: status }),

    resetAuth: () => set({
      companies: demoCompanies,
      activeCompanyId: defaultCompanyId,
      activeCompany: initialCompany,
      activeIndustryKey: initialCompany.industry_key,
      activeIndustry: initialTemplate,
      activeContacts: initialDataset.contacts,
      activeOpportunities: initialDataset.opportunities,
      activeAiFindings: initialDataset.aiFindings,
      activeInteractions: initialDataset.interactions,
      activePipeline: initialDataset.pipeline,
      activeStages: initialDataset.stages,
      currentUser,
      authStatus: 'anonymous',
    }),

    addAuditLog: (entry) => set(state => ({
      auditLog: [
        ...state.auditLog,
        {
          ...entry,
          id: `audit_${Date.now()}`,
          created_at: new Date().toISOString(),
        },
      ],
    })),

    dismissFinding: (id) => set(state => ({
      activeAiFindings: state.activeAiFindings.filter(f => f.id !== id),
    })),

    setAiStatus: (status) => set({ aiStatus: status }),

    setLastImportResult: (result) => set({ lastImportResult: result }),

    moveOpportunityStage: (oppId, stageId) => set(state => ({
      activeOpportunities: state.activeOpportunities.map(o =>
        o.id === oppId ? { ...o, stage_id: stageId, updated_at: new Date().toISOString() } : o
      ),
    })),

    updateOpportunityStatus: (oppId, status) => set(state => ({
      activeOpportunities: state.activeOpportunities.map(o =>
        o.id === oppId ? { ...o, status, updated_at: new Date().toISOString() } : o
      ),
    })),

    toggleTheme: () => set(state => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('alqia-theme', next)
      return { theme: next }
    }),
  }
})
