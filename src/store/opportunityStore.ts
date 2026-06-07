import { create } from 'zustand'
import { mockOpportunities } from '@/data'
import type { Opportunity, OpportunityStatus } from '@/types'

interface OpportunityFilters {
  status?: OpportunityStatus
  stage_id?: string
  owner_user_id?: string
  search?: string
}

interface OpportunityState {
  opportunities: Opportunity[]
  filters: OpportunityFilters
  selectedId: string | null
  setFilters: (filters: Partial<OpportunityFilters>) => void
  setSelected: (id: string | null) => void
  updateOpportunity: (id: string, update: Partial<Opportunity>) => void
  getFiltered: () => Opportunity[]
}

export const useOpportunityStore = create<OpportunityState>((set, get) => ({
  opportunities: mockOpportunities,
  filters: {},
  selectedId: null,

  setFilters: (filters) => set(state => ({ filters: { ...state.filters, ...filters } })),

  setSelected: (id) => set({ selectedId: id }),

  updateOpportunity: (id, update) => set(state => ({
    opportunities: state.opportunities.map(o => o.id === id ? { ...o, ...update } : o),
  })),

  getFiltered: () => {
    const { opportunities, filters } = get()
    return opportunities.filter(o => {
      if (filters.status && o.status !== filters.status) return false
      if (filters.stage_id && o.stage_id !== filters.stage_id) return false
      if (filters.owner_user_id && o.owner_user_id !== filters.owner_user_id) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return o.title.toLowerCase().includes(q)
      }
      return true
    })
  },
}))
