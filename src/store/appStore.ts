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

interface AppState {
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
  auditLog: AuditLog[]
  // Estado del motor IA
  aiStatus: AiStatus
  // Última importación procesada
  lastImportResult: ProcessResult | null
  // Tema de la interfaz
  theme: 'dark' | 'light'
  // Acciones
  setActiveCompany: (id: string) => void
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'created_at'>) => void
  dismissFinding: (id: string) => void
  setAiStatus: (status: AiStatus) => void
  setLastImportResult: (result: ProcessResult) => void
  moveOpportunityStage: (oppId: string, stageId: string) => void
  updateOpportunityStatus: (oppId: string, status: Opportunity['status']) => void
  toggleTheme: () => void
}

export const useAppStore = create<AppState>((set) => {
  const initialCompany = getCompanyById(defaultCompanyId)
  const initialTemplate = getTemplate(initialCompany.industry_key)
  const initialDataset = getDataset(defaultCompanyId)

  return {
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
    auditLog: [],
    aiStatus: 'unknown',
    lastImportResult: null,
    theme: (localStorage.getItem('alqia-theme') as 'dark' | 'light') ?? 'dark',

    setActiveCompany: (id) => {
      const company = getCompanyById(id)
      const template = getTemplate(company.industry_key)
      const dataset = getDataset(id)
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

export { demoCompanies }

